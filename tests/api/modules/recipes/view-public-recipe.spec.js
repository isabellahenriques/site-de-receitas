// Bibliotecas de teste:
// - supertest: executa requisicoes HTTP diretamente na aplicacao Express.
// - chai: fornece assercoes para validar status, estrutura e regras de negocio.
const request = require('supertest');
const { expect } = require('chai');

// Importa a aplicacao Express para teste integrado dos endpoints.
const app = require('../../../../src/app');

// Importa resets para garantir isolamento entre cenarios.
const { resetUsers } = require('../../../../src/models/userModel');
const { resetRecipes } = require('../../../../src/models/recipeModel');

// Importa fixtures de entrada (request) e de saida esperada (response) da US-11.
const fixtureRequisicao = require('../../fixtures/recipes/view-public-recipe-requests.fixture');
const fixtureResposta = require('../../fixtures/recipes/view-public-recipe-responses.fixture');

// Agrupa os cenarios da US-11 — Visualizacao de receita publica.
describe('US-11 - Visualizacao de receita publica (GET /api/recipes/:id)', () => {
  let tokenUsuarioDonoReceita;
  let tokenUsuarioSecundario;
  let idReceitaPublica;
  let idReceitaPrivada;
  let nomeAutorReceita;

  // beforeEach:
  // 1. Reseta usuarios e receitas em memoria para isolamento total.
  // 2. Cria usuario dono e usuario secundario.
  // 3. Realiza login dos usuarios para obter tokens.
  // 4. Cria uma receita publica e uma privada para validar os cenarios da US-11.
  beforeEach(async () => {
    resetUsers();
    resetRecipes();

    // Gera sufixo unico para evitar colisao de e-mails entre execucoes da suite.
    const sufixoUnico = Date.now();

    const usuarioDonoReceitaComEmailUnico = {
      ...fixtureRequisicao.usuarioDonoReceita,
      email: `dono.receita.us11+${sufixoUnico}@email.com`
    };
    const loginUsuarioDonoReceitaComEmailUnico = {
      ...fixtureRequisicao.loginUsuarioDonoReceita,
      email: usuarioDonoReceitaComEmailUnico.email
    };

    const usuarioSecundarioComEmailUnico = {
      ...fixtureRequisicao.usuarioSecundario,
      email: `usuario.secundario.us11+${sufixoUnico}@email.com`
    };
    const loginUsuarioSecundarioComEmailUnico = {
      ...fixtureRequisicao.loginUsuarioSecundario,
      email: usuarioSecundarioComEmailUnico.email
    };

    // Cria o usuario dono da receita e captura dados para asserts do autor.
    const respostaCriacaoUsuarioDono = await request(app)
      .post('/api/users')
      .send(usuarioDonoReceitaComEmailUnico);
    nomeAutorReceita = respostaCriacaoUsuarioDono.body.name;

    // Cria um segundo usuario para manter o setup alinhado com cenarios de autorizacao.
    await request(app)
      .post('/api/users')
      .send(usuarioSecundarioComEmailUnico);

    // Realiza login dos usuarios para obter token JWT.
    const respostaLoginUsuarioDono = await request(app)
      .post('/api/auth/login')
      .send(loginUsuarioDonoReceitaComEmailUnico);
    tokenUsuarioDonoReceita = respostaLoginUsuarioDono.body.token;

    const respostaLoginUsuarioSecundario = await request(app)
      .post('/api/auth/login')
      .send(loginUsuarioSecundarioComEmailUnico);
    tokenUsuarioSecundario = respostaLoginUsuarioSecundario.body.token;

    // Cria receita publica usada nos cenarios CT-46 e CT-48.
    const respostaReceitaPublica = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenUsuarioDonoReceita}`)
      .send({
        ...fixtureRequisicao.receitaPublicaBase,
        title: `Receita publica US11 ${sufixoUnico}`
      });
    idReceitaPublica = respostaReceitaPublica.body.id;

    // Cria receita privada do proprio dono usada no cenario CT-49.
    const respostaReceitaPrivada = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenUsuarioDonoReceita}`)
      .send({
        ...fixtureRequisicao.receitaPrivadaBase,
        title: `Receita privada US11 ${sufixoUnico}`
      });
    idReceitaPrivada = respostaReceitaPrivada.body.id;
  });

  // CT-46, CT-47, CT-48 e CT-49:
  // Data-Driven Testing aplicado porque os cenarios compartilham o mesmo endpoint,
  // variando apenas o id consultado, autenticacao e expectativa de resposta.
  const casosVisualizacaoReceita = [
    {
      idCaso: 'CT-46',
      ...fixtureResposta.cenarios.CT46
    },
    {
      idCaso: 'CT-47',
      ...fixtureResposta.cenarios.CT47
    },
    {
      idCaso: 'CT-48',
      ...fixtureResposta.cenarios.CT48
    },
    {
      idCaso: 'CT-49',
      ...fixtureResposta.cenarios.CT49
    }
  ];

  casosVisualizacaoReceita.forEach((cenario) => {
    it(`${cenario.idCaso}: deve validar ${cenario.descricao}`, async () => {
      // Resolve o ID da receita alvo com base no tipo de cenario.
      const idReceitaAlvo = cenario.tipoReceita === 'publica'
        ? idReceitaPublica
        : cenario.tipoReceita === 'privada'
          ? idReceitaPrivada
          : fixtureRequisicao.idReceitaInexistente;

      // Monta requisicao base de detalhamento.
      let requisicao = request(app).get(`/api/recipes/${idReceitaAlvo}`);

      // Aplica token somente quando o cenario exige autenticacao explicita.
      if (cenario.enviarToken) {
        const token = cenario.tokenOrigem === 'dono'
          ? tokenUsuarioDonoReceita
          : tokenUsuarioSecundario;
        requisicao = requisicao.set('Authorization', `Bearer ${token}`);
      }

      // Executa a requisicao conforme variacao definida para o caso.
      const response = await requisicao;

      // Resolve expectativa de retorno configurada no fixture de response.
      const expectativa = fixtureResposta[cenario.respostaEsperada];

      // Valida status HTTP esperado para o cenario.
      expect(response.status).to.equal(expectativa.statusEsperado);

      // Fluxo de sucesso:
      // valida estrutura completa de detalhe da receita conforme Swagger.
      if (expectativa.statusEsperado === 200) {
        fixtureResposta.camposObrigatoriosDetalheReceita.forEach((campoObrigatorio) => {
          expect(response.body).to.have.property(campoObrigatorio);
        });

        // Valida campos obrigatorios do objeto de autor.
        expect(response.body.author).to.be.an('object');
        fixtureResposta.camposObrigatoriosAutor.forEach((campoObrigatorioAutor) => {
          expect(response.body.author).to.have.property(campoObrigatorioAutor);
        });

        // Garante que o autor retornado e o dono da receita criada no setup.
        expect(response.body.author.name).to.equal(nomeAutorReceita);

        // Valida os principais campos de negocio exigidos nos cenarios da US-11.
        expect(response.body.title).to.be.a('string').and.not.empty;
        expect(response.body.ingredients).to.be.a('string').and.not.empty;
        expect(response.body.instructions).to.be.a('string').and.not.empty;
      }

      // Fluxo de erro:
      // valida contrato padrao de erro para receita inexistente.
      if (expectativa.statusEsperado === 404) {
        expect(response.body).to.deep.equal({
          error: {
            code: expectativa.codigoErroEsperado,
            message: expectativa.mensagemErroEsperada
          }
        });
      }
    });
  });
});
