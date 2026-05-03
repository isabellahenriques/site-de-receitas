// Ferramentas do teste:
// - supertest: chama a API.
// - chai: verifica o resultado.
const request = require('supertest');
const { expect } = require('chai');

// API que será testada.
const app = require('../../../../src/app');

// Limpa dados antes de cada cenário.
const { resetUsers } = require('../../../../src/models/userModel');
const { resetRecipes } = require('../../../../src/models/recipeModel');

// Dados de entrada e resultados esperados.
const fixtureRequisicao = require('../../fixtures/recipes/view-public-recipe-requests.fixture');
const fixtureResposta = require('../../fixtures/recipes/view-public-recipe-responses.fixture');

// Testes da US-11 (visualização de receita).
describe('US-11 - Visualizacao de receita publica (GET /api/recipes/:id)', () => {
  let tokenUsuarioDonoReceita;
  let tokenUsuarioSecundario;
  let idReceitaPublica;
  let idReceitaPrivada;
  let nomeAutorReceita;

  // Preparo: cria usuários, faz login e cria receitas pública e privada.
  beforeEach(async () => {
    resetUsers();
    resetRecipes();

    // E-mails únicos evitam mistura entre testes.
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

    // Cria o dono da receita.
    const respostaCriacaoUsuarioDono = await request(app)
      .post('/api/users')
      .send(usuarioDonoReceitaComEmailUnico);
    nomeAutorReceita = respostaCriacaoUsuarioDono.body.name;

    // Cria usuário secundário para cenários de acesso.
    await request(app)
      .post('/api/users')
      .send(usuarioSecundarioComEmailUnico);

    // Faz login dos dois usuários.
    const respostaLoginUsuarioDono = await request(app)
      .post('/api/auth/login')
      .send(loginUsuarioDonoReceitaComEmailUnico);
    tokenUsuarioDonoReceita = respostaLoginUsuarioDono.body.token;

    const respostaLoginUsuarioSecundario = await request(app)
      .post('/api/auth/login')
      .send(loginUsuarioSecundarioComEmailUnico);
    tokenUsuarioSecundario = respostaLoginUsuarioSecundario.body.token;

    // Cria receita pública.
    const respostaReceitaPublica = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenUsuarioDonoReceita}`)
      .send({
        ...fixtureRequisicao.receitaPublicaBase,
        title: `Receita publica US11 ${sufixoUnico}`
      });
    idReceitaPublica = respostaReceitaPublica.body.id;

    // Cria receita privada do dono.
    const respostaReceitaPrivada = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenUsuarioDonoReceita}`)
      .send({
        ...fixtureRequisicao.receitaPrivadaBase,
        title: `Receita privada US11 ${sufixoUnico}`
      });
    idReceitaPrivada = respostaReceitaPrivada.body.id;
  });

  // CT-46, CT-47, CT-48 e CT-49: cenários de visualização.
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
      // Escolhe qual receita será consultada.
      const idReceitaAlvo = cenario.tipoReceita === 'publica'
        ? idReceitaPublica
        : cenario.tipoReceita === 'privada'
          ? idReceitaPrivada
          : fixtureRequisicao.idReceitaInexistente;

      // Chamada base.
      let requisicao = request(app).get(`/api/recipes/${idReceitaAlvo}`);

      // Só envia token quando o cenário exige.
      if (cenario.enviarToken) {
        const token = cenario.tokenOrigem === 'dono'
          ? tokenUsuarioDonoReceita
          : tokenUsuarioSecundario;
        requisicao = requisicao.set('Authorization', `Bearer ${token}`);
      }

      // Executa a chamada.
      const response = await requisicao;

      // Carrega o resultado esperado do cenário.
      const expectativa = fixtureResposta[cenario.respostaEsperada];

      // Confirma o status esperado.
      expect(response.status).to.equal(expectativa.statusEsperado);

      // Em sucesso, valida os campos do detalhe da receita.
      if (expectativa.statusEsperado === 200) {
        fixtureResposta.camposObrigatoriosDetalheReceita.forEach((campoObrigatorio) => {
          expect(response.body).to.have.property(campoObrigatorio);
        });

        // Valida dados do autor.
        expect(response.body.author).to.be.an('object');
        fixtureResposta.camposObrigatoriosAutor.forEach((campoObrigatorioAutor) => {
          expect(response.body.author).to.have.property(campoObrigatorioAutor);
        });

        // Confirma que o autor é o dono.
        expect(response.body.author.name).to.equal(nomeAutorReceita);

        // Confirma campos principais da receita.
        expect(response.body.title).to.be.a('string').and.not.empty;
        expect(response.body.ingredients).to.be.a('string').and.not.empty;
        expect(response.body.instructions).to.be.a('string').and.not.empty;
      }

      // Em erro 404, valida o formato de erro.
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
