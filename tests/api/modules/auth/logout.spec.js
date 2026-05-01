// Bibliotecas de teste:
// - supertest: permite simular chamadas HTTP na API sem precisar abrir ferramentas externas.
// - chai: fornece validações para conferir se o resultado retornado é o esperado.
const request = require('supertest');
const { expect } = require('chai');

// Importa a aplicação Express para que o supertest possa enviar requisições diretamente.
const app = require('../../../../src/app');

// Importa a função para limpar o banco em memória antes de cada cenário.
// Isso evita que o resultado de um teste afete o próximo.
const { resetUsers } = require('../../../../src/models/userModel');

// Importa os dados de entrada (corpos de requisição e apoio para autenticação).
const fixtureRequisicao = require('../../fixtures/auth/logout-requests.fixture');

// Importa os dados esperados de saída (status e mensagens de resposta).
const fixtureResposta = require('../../fixtures/auth/logout-responses.fixture');

// Agrupa todos os testes da US-03 — Logout de usuário.
describe('US-03 - Logout de usuario (POST /api/auth/logout)', () => {
  let tokenValido;

  // beforeEach:
  // 1. Limpa o banco em memória para isolar os cenários.
  // 2. Cria um usuário via endpoint de cadastro.
  // 3. Faz login para obter um token JWT válido.
  // 4. Guarda o token para uso nos testes de logout.
  beforeEach(async () => {
    resetUsers();

    await request(app)
      .post('/api/users')
      .send(fixtureRequisicao.usuarioValido);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send(fixtureRequisicao.loginValido);

    tokenValido = loginResponse.body.token;
  });

  // CT-13: Cenário positivo — logout com token válido.
  it('CT-13: deve realizar logout com sucesso com token valido', async () => {
    // Envia a requisição de logout com token válido no header Authorization.
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${tokenValido}`);

    // Valida se a API retornou HTTP 200 e a mensagem de sucesso esperada.
    expect(response.status).to.equal(fixtureResposta.sucesso.statusEsperado);
    expect(response.body).to.deep.equal({
      message: fixtureResposta.sucesso.mensagemEsperada
    });

    // Valida que o token foi invalidado:
    // após o logout bem-sucedido, tentar usar o mesmo token deve falhar com 401.
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

  // CT-14 e CT-15: Cenários negativos.
  // Usamos Data-Driven Testing porque os cenários compartilham o mesmo fluxo de validação
  // (chamar o endpoint e validar erro), mudando apenas a preparação e o header enviado.
  const casosErroLogout = [
    {
      idCaso: 'CT-14',
      descricao: 'sem token no header de autorizacao',
      // Não envia o header Authorization para simular ausência de token.
      montarRequisicao: (req) => req,
      respostaEsperada: fixtureResposta.semToken
    },
    {
      idCaso: 'CT-15',
      descricao: 'com token ja invalidado por logout anterior',
      // Executa um logout prévio para invalidar o token e então tenta usar o mesmo token novamente.
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
      // Prepara a requisição base para o endpoint de logout.
      const requisicaoBase = request(app).post('/api/auth/logout');

      // Aplica a variação do caso (com ou sem token / token invalidado).
      const requisicaoFinal = await montarRequisicao(requisicaoBase, tokenValido);
      const response = await requisicaoFinal;

      // Valida que a API retorna HTTP 401 e o conteúdo de erro esperado para o cenário.
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
