// Ferramentas do teste:
// - supertest: faz chamadas para a API.
// - chai: confere se o resultado veio como esperado.
const request = require('supertest');
const { expect } = require('chai');

// API que será testada.
const app = require('../../../../src/app');

// Limpa os dados antes de cada cenário.
const { resetUsers } = require('../../../../src/models/userModel');

// Dados de entrada dos testes.
const fixtureRequisicao = require('../../fixtures/auth/login-requests.fixture');

// Resultados esperados para cada caso.
const fixtureResposta = require('../../fixtures/auth/login-responses.fixture');

function gerarEmailUnico(prefixo) {
  return `${prefixo}+${Date.now()}-${Math.floor(Math.random() * 100000)}@email.com`;
}

// Testes da US-02 (login).
describe('US-02 - Login de usuario (POST /api/auth/login)', () => {
  let usuarioValido;
  let loginValido;

  // Preparo de cada caso: limpa tudo e cria um usuário novo.
  beforeEach(async () => {
    resetUsers();

    const emailUnico = gerarEmailUnico('isabella.us02');
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
  });

  // CT-08: login com dados corretos.
  it('CT-08: deve realizar login com sucesso com credenciais validas', async () => {

    // Faz login.
    const response = await request(app)
      .post('/api/auth/login')
      .send(loginValido);

    // Confirma sucesso.
    expect(response.status).to.equal(fixtureResposta.sucesso.statusEsperado);

    // Confirma campos principais da resposta.
    fixtureResposta.sucesso.camposEsperados.forEach((campo) => {
      expect(response.body).to.have.property(campo);
    });

    // Token JWT precisa ter 3 partes separadas por ponto.
    expect(response.body.token).to.be.a('string');
    expect(response.body.token.split('.')).to.have.lengthOf(3);

    // Confirma tempo de expiração.
    expect(response.body.expiresIn).to.equal(fixtureResposta.sucesso.expiresInEsperado);

    // Segurança: a API não pode devolver senha.
    fixtureResposta.sucesso.camposNaoPermitidos.forEach((campo) => {
      expect(response.body).to.not.have.property(campo);
    });
  });

  // CT-09 e CT-10: login deve falhar com dados errados.
  const casosCredenciaisInvalidas = [
    {
      idCaso: 'CT-09',
      descricao: 'com e-mail não cadastrado',
      // E-mail não cadastrado.
      carga: fixtureRequisicao.emailNaoCadastrado
    },
    {
      idCaso: 'CT-10',
      descricao: 'com senha incorreta',
      // Senha errada.
      carga: fixtureRequisicao.senhaIncorreta
    }
  ];

  casosCredenciaisInvalidas.forEach(({ idCaso, descricao, carga }) => {
    it(`${idCaso}: deve retornar erro de credenciais invalidas ao realizar login ${descricao}`, async () => {
      const cargaFinal = idCaso === 'CT-10'
        ? { ...carga, email: loginValido.email }
        : carga;

      // Faz a tentativa de login do cenário.
      const response = await request(app)
        .post('/api/auth/login')
        .send(cargaFinal);

      // Deve retornar "não autorizado" com erro padronizado.
      expect(response.status).to.equal(fixtureResposta.credenciaisInvalidas.statusEsperado);
      expect(response.body).to.deep.equal({
        error: {
          code: fixtureResposta.credenciaisInvalidas.codigoErroEsperado,
          message: fixtureResposta.credenciaisInvalidas.mensagemErroEsperada
        }
      });
    });
  });

  // CT-11 e CT-12: login deve falhar quando faltam campos obrigatórios.
  const casosCampoAusente = [
    {
      idCaso: 'CT-11',
      descricao: 'sem o campo "email"',
      // Sem e-mail.
      carga: fixtureRequisicao.emailAusente
    },
    {
      idCaso: 'CT-12',
      descricao: 'sem o campo "password"',
      // Sem senha.
      carga: fixtureRequisicao.senhaAusente
    }
  ];

  casosCampoAusente.forEach(({ idCaso, descricao, carga }) => {
    it(`${idCaso}: deve retornar erro ao realizar login ${descricao}`, async () => {
      const cargaFinal = idCaso === 'CT-12'
        ? { ...carga, email: loginValido.email }
        : carga;

      // Faz a chamada do cenário.
      const response = await request(app)
        .post('/api/auth/login')
        .send(cargaFinal);

      // Deve retornar erro de validação com o formato esperado.
      expect(response.status).to.equal(fixtureResposta.campoObrigatorioAusente.statusEsperado);
      expect(response.body).to.deep.equal({
        error: {
          code: fixtureResposta.campoObrigatorioAusente.codigoErroEsperado,
          message: fixtureResposta.campoObrigatorioAusente.mensagemErroEsperada
        }
      });
    });
  });

});
