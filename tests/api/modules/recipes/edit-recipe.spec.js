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

// Dados de entrada dos testes.
const fixtureRequisicao = require('../../fixtures/recipes/edit-recipe-requests.fixture');

// Resultados esperados em cada caso.
const fixtureResposta = require('../../fixtures/recipes/edit-recipe-responses.fixture');

// Testes da US-06 (edição de receita).
describe('US-06 - Edicao de receita (PUT /api/recipes/:id)', () => {
  let usuarioAId;
  let usuarioBId;
  let tokenUsuarioA;
  let tokenUsuarioB;
  let receitaUsuarioAId;
  let receitaUsuarioBId;

  // Preparo: cria dois usuários, faz login e cria receitas para cada um.
  beforeEach(async () => {
    resetUsers();
    resetRecipes();

    // E-mails únicos evitam mistura entre testes.
    const sufixoUnico = Date.now();
    const usuarioAComEmailUnico = {
      ...fixtureRequisicao.usuarioAValido,
      email: `usuario.a+us06-${sufixoUnico}@email.com`
    };
    const loginUsuarioAComEmailUnico = {
      ...fixtureRequisicao.loginUsuarioAValido,
      email: usuarioAComEmailUnico.email
    };
    const usuarioBComEmailUnico = {
      ...fixtureRequisicao.usuarioBValido,
      email: `usuario.b+us06-${sufixoUnico}@email.com`
    };
    const loginUsuarioBComEmailUnico = {
      ...fixtureRequisicao.loginUsuarioBValido,
      email: usuarioBComEmailUnico.email
    };

    const respostaCriacaoUsuarioA = await request(app)
      .post('/api/users')
      .send(usuarioAComEmailUnico);
    usuarioAId = respostaCriacaoUsuarioA.body.id;

    const respostaLoginUsuarioA = await request(app)
      .post('/api/auth/login')
      .send(loginUsuarioAComEmailUnico);
    tokenUsuarioA = respostaLoginUsuarioA.body.token;

    const respostaCriacaoUsuarioB = await request(app)
      .post('/api/users')
      .send(usuarioBComEmailUnico);
    usuarioBId = respostaCriacaoUsuarioB.body.id;

    const respostaLoginUsuarioB = await request(app)
      .post('/api/auth/login')
      .send(loginUsuarioBComEmailUnico);
    tokenUsuarioB = respostaLoginUsuarioB.body.token;

    const respostaCriacaoReceitaUsuarioA = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenUsuarioA}`)
      .send(fixtureRequisicao.receitaOriginalUsuarioA);
    receitaUsuarioAId = respostaCriacaoReceitaUsuarioA.body.id;

    const respostaCriacaoReceitaUsuarioB = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenUsuarioB}`)
      .send(fixtureRequisicao.receitaOriginalUsuarioB);
    receitaUsuarioBId = respostaCriacaoReceitaUsuarioB.body.id;
  });

  // CT-25: edição com sucesso.
  const casosSucessoEdicao = [
    {
      idCaso: 'CT-25',
      descricao: 'da propria receita com dados validos',
      obterIdReceitaAlvo: ({ idReceitaA }) => idReceitaA,
      token: ({ tokenA }) => tokenA,
      payload: fixtureRequisicao.receitaAtualizadaValida,
      respostaEsperada: fixtureResposta.sucesso
    }
  ];

  casosSucessoEdicao.forEach(({ idCaso, descricao, obterIdReceitaAlvo, token, payload, respostaEsperada }) => {
    it(`${idCaso}: deve editar receita com sucesso ${descricao}`, async () => {
      // Escolhe a receita do cenário.
      const idReceitaAlvo = obterIdReceitaAlvo({
        idReceitaA: receitaUsuarioAId,
        idReceitaB: receitaUsuarioBId
      });

      // Faz a edição.
      const response = await request(app)
        .put(`/api/recipes/${idReceitaAlvo}`)
        .set('Authorization', `Bearer ${token({ tokenA: tokenUsuarioA, tokenB: tokenUsuarioB })}`)
        .send(payload);

      // Deve retornar sucesso.
      expect(response.status).to.equal(respostaEsperada.statusEsperado);

      // Confirma os campos principais.
      respostaEsperada.camposEsperados.forEach((campo) => {
        expect(response.body).to.have.property(campo);
      });

      // Confere se os dados foram atualizados.
      expect(response.body.id).to.equal(idReceitaAlvo);
      expect(response.body.title).to.equal(payload.title);
      expect(response.body.ingredients).to.equal(payload.ingredients);
      expect(response.body.instructions).to.equal(payload.instructions);
      expect(response.body.visibility).to.equal(payload.visibility);

      // Confirma que o dono da receita continua o mesmo.
      expect(response.body.author).to.be.an('object');
      respostaEsperada.camposEsperadosAuthor.forEach((campo) => {
        expect(response.body.author).to.have.property(campo);
      });
      expect(response.body.author.id).to.equal(usuarioAId);
    });
  });

  // CT-26, CT-27, CT-28 e CT-29: cenários de erro.
  const casosErroEdicao = [
    {
      idCaso: 'CT-26',
      descricao: 'ao tentar editar receita de outro usuario',
      obterIdReceitaAlvo: ({ idReceitaB }) => idReceitaB,
      montarHeaderAutorizacao: ({ tokenA }) => `Bearer ${tokenA}`,
      payload: fixtureRequisicao.receitaAtualizadaValida,
      respostaEsperada: fixtureResposta.editarReceitaDeOutroUsuario
    },
    {
      idCaso: 'CT-27',
      descricao: 'ao informar id inexistente',
      obterIdReceitaAlvo: () => fixtureRequisicao.idReceitaInexistente,
      montarHeaderAutorizacao: ({ tokenA }) => `Bearer ${tokenA}`,
      payload: fixtureRequisicao.receitaAtualizadaValida,
      respostaEsperada: fixtureResposta.receitaNaoEncontrada
    },
    {
      idCaso: 'CT-28',
      descricao: 'ao chamar endpoint sem token',
      obterIdReceitaAlvo: ({ idReceitaA }) => idReceitaA,
      montarHeaderAutorizacao: () => null,
      payload: fixtureRequisicao.receitaAtualizadaValida,
      respostaEsperada: fixtureResposta.tokenObrigatorio
    },
    {
      idCaso: 'CT-29',
      descricao: 'ao enviar body sem o campo obrigatorio "title"',
      obterIdReceitaAlvo: ({ idReceitaA }) => idReceitaA,
      montarHeaderAutorizacao: ({ tokenA }) => `Bearer ${tokenA}`,
      payload: fixtureRequisicao.receitaSemTitle,
      respostaEsperada: fixtureResposta.campoObrigatorioAusente
    }
  ];

  casosErroEdicao.forEach(({ idCaso, descricao, obterIdReceitaAlvo, montarHeaderAutorizacao, payload, respostaEsperada }) => {
    it(`${idCaso}: deve retornar erro ${descricao}`, async () => {
      // Escolhe a receita alvo do cenário.
      const idReceitaAlvo = obterIdReceitaAlvo({
        idReceitaA: receitaUsuarioAId,
        idReceitaB: receitaUsuarioBId
      });

      // Chamada base de edição.
      let requisicao = request(app)
        .put(`/api/recipes/${idReceitaAlvo}`)
        .send(payload);

      // Só envia token quando o cenário exige.
      const headerAutorizacao = montarHeaderAutorizacao({
        tokenA: tokenUsuarioA,
        tokenB: tokenUsuarioB
      });
      if (headerAutorizacao) {
        requisicao = requisicao.set('Authorization', headerAutorizacao);
      }

      // Executa a chamada.
      const response = await requisicao;

      // Confirma o status esperado.
      expect(response.status).to.equal(respostaEsperada.statusEsperado);

      // Confirma o erro padronizado.
      expect(response.body).to.deep.equal({
        error: {
          code: respostaEsperada.codigoErroEsperado,
          message: respostaEsperada.mensagemErroEsperada
        }
      });

      // No CT-26, confirma que a receita do usuário B não foi alterada.
      if (idCaso === 'CT-26') {
        const respostaConsultaReceitaB = await request(app)
          .get(`/api/recipes/${receitaUsuarioBId}`)
          .set('Authorization', `Bearer ${tokenUsuarioB}`);

        expect(respostaConsultaReceitaB.status).to.equal(200);
        expect(respostaConsultaReceitaB.body.title).to.equal(fixtureRequisicao.receitaOriginalUsuarioB.title);
      }
    });
  });
});
