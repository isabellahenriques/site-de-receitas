// Ferramentas do teste:
// - supertest: chama a API.
// - chai: verifica o resultado.
const request = require('supertest');
const { expect } = require('chai');

// API que será testada.
const app = require('../../../../src/app');

// Limpa os dados antes de cada cenário.
const { resetUsers } = require('../../../../src/models/userModel');

// Dados de entrada dos testes.
const fixtureRequisicao = require('../../fixtures/auth/logout-requests.fixture');

// Resultados esperados em cada caso.
const fixtureResposta = require('../../fixtures/auth/logout-responses.fixture');

function gerarEmailUnico(prefixo) {
  return `${prefixo}+${Date.now()}-${Math.floor(Math.random() * 100000)}@email.com`;
}

// Testes da US-03 (logout).
describe('US-03 - Logout de usuario (POST /api/auth/logout)', () => {
  let tokenValido;
  let usuarioValido;
  let loginValido;

  // Preparo de cada caso: limpa tudo, cria usuário e faz login.
  beforeEach(async () => {
    resetUsers();

    const emailUnico = gerarEmailUnico('isabella.us03');
    usuarioValido = {
      ...fixtureRequisicao.usuarioValido,
      email: emailUnico
    };
    loginValido = {
      ...fixtureRequisicao.loginValido,
      email: emailUnico
    };

    await request(app)
      .post('/api/users')
      .send(usuarioValido);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send(loginValido);

    tokenValido = loginResponse.body.token;
  });

  // CT-13: logout com token válido.
  it('CT-13: deve realizar logout com sucesso com token valido', async () => {
    // Faz logout.
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${tokenValido}`);

    // Deve retornar sucesso.
    expect(response.status).to.equal(fixtureResposta.sucesso.statusEsperado);
    expect(response.body).to.deep.equal({
      message: fixtureResposta.sucesso.mensagemEsperada
    });

    // Depois do logout, o mesmo token não pode mais funcionar.
    const tentativaComTokenInvalidado = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${tokenValido}`);

    expect(tentativaComTokenInvalidado.status).to.equal(fixtureResposta.tokenInvalido.statusEsperado);
    expect(tentativaComTokenInvalidado.body).to.deep.equal({
      error: {
        code: fixtureResposta.tokenInvalido.codigoErroEsperado,
        message: fixtureResposta.tokenInvalido.mensagemErroEsperada
      }
    });
  });

  // CT-14 e CT-15: cenários de erro.
  const casosErroLogout = [
    {
      idCaso: 'CT-14',
      descricao: 'sem token no header de autorizacao',
      // Sem token.
      montarRequisicao: (req) => req,
      respostaEsperada: fixtureResposta.semToken
    },
    {
      idCaso: 'CT-15',
      descricao: 'com token ja invalidado por logout anterior',
      // Invalida o token e tenta usar de novo.
      montarRequisicao: async (req, token) => {
        await request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${token}`);

        return req.set('Authorization', `Bearer ${token}`);
      },
      respostaEsperada: fixtureResposta.tokenInvalido
    }
  ];

  casosErroLogout.forEach(({ idCaso, descricao, montarRequisicao, respostaEsperada }) => {
    it(`${idCaso}: deve retornar erro ao realizar logout ${descricao}`, async () => {
      // Cria a chamada base.
      const requisicaoBase = request(app).post('/api/auth/logout');

      // Aplica a variação do cenário.
      const requisicaoFinal = await montarRequisicao(requisicaoBase, tokenValido);
      const response = await requisicaoFinal;

      // Deve retornar erro de autenticação no formato esperado.
      expect(response.status).to.equal(respostaEsperada.statusEsperado);
      expect(response.body).to.deep.equal({
        error: {
          code: respostaEsperada.codigoErroEsperado,
          message: respostaEsperada.mensagemErroEsperada
        }
      });
    });
  });
});
