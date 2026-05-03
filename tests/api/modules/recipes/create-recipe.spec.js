// Ferramentas do teste:
// - supertest: chama a API.
// - chai: verifica o resultado.
const request = require('supertest');
const { expect } = require('chai');

// API que será testada.
const app = require('../../../../src/app');

// Limpa receitas antes de cada cenário.
const { resetRecipes } = require('../../../../src/models/recipeModel');

// Dados de entrada dos testes.
const fixtureRequisicao = require('../../fixtures/recipes/create-recipe-requests.fixture');

// Resultados esperados em cada caso.
const fixtureResposta = require('../../fixtures/recipes/create-recipe-responses.fixture');

// Testes da US-05 (cadastro de receita).
describe('US-05 - Cadastro de receita (POST /api/recipes)', () => {
  let tokenValido;
  let usuarioAutenticado;
  let credenciaisLogin;

  // Preparo: limpa dados, cria usuário e faz login.
  beforeEach(async () => {
    resetRecipes();

    // Cria e-mail único para não misturar dados entre testes.
    const emailUnico = `isabella+ct05-${Date.now()}@email.com`;
    const usuarioValidoComEmailUnico = {
      ...fixtureRequisicao.usuarioValido,
      email: emailUnico
    };
    credenciaisLogin = {
      ...fixtureRequisicao.loginValido,
      email: emailUnico
    };

    const respostaCriacaoUsuario = await request(app)
      .post('/api/users')
      .send(usuarioValidoComEmailUnico);

    usuarioAutenticado = respostaCriacaoUsuario.body;

    const respostaLogin = await request(app)
      .post('/api/auth/login')
      .send(credenciaisLogin);

    tokenValido = respostaLogin.body.token;
  });

  // CT-20 e CT-21: cadastro com sucesso.
  const casosSucessoCadastro = [
    {
      idCaso: 'CT-20',
      descricao: 'com visibilidade publica',
      payload: fixtureRequisicao.receitaPublicaValida
    },
    {
      idCaso: 'CT-21',
      descricao: 'com visibilidade privada',
      payload: fixtureRequisicao.receitaPrivadaValida
    }
  ];

  casosSucessoCadastro.forEach(({ idCaso, descricao, payload }) => {
    it(`${idCaso}: deve cadastrar receita com sucesso ${descricao}`, async () => {
      // Faz o cadastro da receita.
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${tokenValido}`)
        .send(payload);

      // Deve criar com sucesso.
      expect(response.status).to.equal(fixtureResposta.sucesso.statusEsperado);

      // Confirma campos principais.
      fixtureResposta.sucesso.camposEsperados.forEach((campo) => {
        expect(response.body).to.have.property(campo);
      });

      // Confere se voltou os mesmos dados enviados.
      expect(response.body.title).to.equal(payload.title);
      expect(response.body.ingredients).to.equal(payload.ingredients);
      expect(response.body.instructions).to.equal(payload.instructions);
      expect(response.body.visibility).to.equal(payload.visibility);

      // Confirma que a receita ficou ligada ao usuário logado.
      expect(response.body.author).to.be.an('object');
      fixtureResposta.sucesso.camposEsperadosAuthor.forEach((campo) => {
        expect(response.body.author).to.have.property(campo);
      });
      expect(response.body.author.id).to.equal(usuarioAutenticado.id);
      expect(response.body.author.name).to.equal(usuarioAutenticado.name);
    });
  });

  // CT-22, CT-23 e CT-24: cenários de erro.
  const casosErroCadastro = [
    {
      idCaso: 'CT-22',
      descricao: 'sem token no header de autorizacao',
      montarRequisicao: (requisicaoBase) => requisicaoBase.send(fixtureRequisicao.receitaPublicaValida),
      respostaEsperada: fixtureResposta.semToken
    },
    {
      idCaso: 'CT-23',
      descricao: 'sem o campo "title" no body',
      montarRequisicao: (requisicaoBase) => requisicaoBase
        .set('Authorization', `Bearer ${tokenValido}`)
        .send(fixtureRequisicao.receitaSemTitle),
      respostaEsperada: fixtureResposta.campoObrigatorioAusente
    },
    {
      idCaso: 'CT-24',
      descricao: 'com valor invalido no campo "visibility"',
      montarRequisicao: (requisicaoBase) => requisicaoBase
        .set('Authorization', `Bearer ${tokenValido}`)
        .send(fixtureRequisicao.receitaComVisibilidadeInvalida),
      respostaEsperada: fixtureResposta.visibilidadeInvalida
    }
  ];

  casosErroCadastro.forEach(({ idCaso, descricao, montarRequisicao, respostaEsperada }) => {
    it(`${idCaso}: deve retornar erro ao cadastrar receita ${descricao}`, async () => {
      // Chamada base do endpoint.
      const requisicaoBase = request(app).post('/api/recipes');

      // Aplica a variação do cenário.
      const response = await montarRequisicao(requisicaoBase);

      // Confirma o status esperado.
      expect(response.status).to.equal(respostaEsperada.statusEsperado);

      // Confirma o erro padronizado.
      expect(response.body).to.deep.equal({
        error: {
          code: respostaEsperada.codigoErroEsperado,
          message: respostaEsperada.mensagemErroEsperada
        }
      });
    });
  });
});
