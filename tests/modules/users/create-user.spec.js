const request = require('supertest');
const { expect } = require('chai');

const app = require('../../../src/app');
const { resetUsers } = require('../../../src/models/userModel');

// fixtureRequisicao: origem dos bodies enviados nas requisicoes (entrada da API).
const fixtureRequisicao = require('../../fixtures/users/create-user-requests.fixture');
// fixtureResposta: origem dos status/campos/mensagens esperadas (saida da API).
const fixtureResposta = require('../../fixtures/users/create-user-responses.fixture');

describe('US-01 - Cadastro de usuario (POST /api/users)', () => {
  // Garante isolamento entre cenarios por conta do "banco" em memoria.
  beforeEach(() => {
    resetUsers();
  });

  it('CT-01: deve cadastrar usuario com sucesso com todos os campos validos', async () => {
    // Body enviado vem de fixtureRequisicao.usuarioValido.
    const response = await request(app)
      .post('/api/users')
      .send(fixtureRequisicao.usuarioValido);

    // Status esperado vem de fixtureResposta.sucesso.
    expect(response.status).to.equal(fixtureResposta.sucesso.statusEsperado);

    // Campos obrigatorios esperados no retorno vem de fixtureResposta.sucesso.camposEsperados.
    fixtureResposta.sucesso.camposEsperados.forEach((campo) => {
      expect(response.body).to.have.property(campo);
    });

    // Valores de name/email validados contra o payload de fixture (fixtureRequisicao.usuarioValido).
    expect(response.body.name).to.equal(fixtureRequisicao.usuarioValido.name);
    expect(response.body.email).to.equal(fixtureRequisicao.usuarioValido.email);

    // Campos proibidos na resposta vem de fixtureResposta.sucesso.camposNaoPermitidos.
    fixtureResposta.sucesso.camposNaoPermitidos.forEach((campo) => {
      expect(response.body).to.not.have.property(campo);
    });
  });

  it('CT-02: deve retornar erro ao cadastrar com e-mail ja existente', async () => {
    // Pre-condicao usando fixtureRequisicao.usuarioValido para criar o usuario inicial.
    await request(app)
      .post('/api/users')
      .send(fixtureRequisicao.usuarioValido);

    // Reenvia o mesmo payload da fixture para validar conflito de e-mail.
    const response = await request(app)
      .post('/api/users')
      .send(fixtureRequisicao.usuarioValido);

    // Expectativas de erro (status/codigo/mensagem) vindas de fixtureResposta.emailDuplicado.
    expect(response.status).to.equal(fixtureResposta.emailDuplicado.statusEsperado);
    expect(response.body).to.deep.equal({
      error: {
        code: fixtureResposta.emailDuplicado.codigoErroEsperado,
        message: fixtureResposta.emailDuplicado.mensagemErroEsperada
      }
    });
  });

  // Data-driven para cenarios de campos obrigatorios ausentes.
  // Cada "payload" e extraido diretamente da fixture de requisicao.
  const casosCampoAusente = [
    { idCaso: 'CT-03', descricao: 'sem o campo "name"', carga: fixtureRequisicao.nomeAusente },
    { idCaso: 'CT-04', descricao: 'sem o campo "email"', carga: fixtureRequisicao.emailAusente },
    { idCaso: 'CT-05', descricao: 'sem o campo "password"', carga: fixtureRequisicao.senhaAusente }
  ];

  casosCampoAusente.forEach(({ idCaso, descricao, carga }) => {
    it(`${idCaso}: deve retornar erro ao cadastrar ${descricao}`, async () => {
      // Envia a carga do caso atual vinda do array data-driven (fixture de requisicao).
      const response = await request(app)
        .post('/api/users')
        .send(carga);

      // Todas as expectativas destes cenarios vem de fixtureResposta.campoObrigatorioAusente.
      expect(response.status).to.equal(fixtureResposta.campoObrigatorioAusente.statusEsperado);
      expect(response.body).to.deep.equal({
        error: {
          code: fixtureResposta.campoObrigatorioAusente.codigoErroEsperado,
          message: fixtureResposta.campoObrigatorioAusente.mensagemErroEsperada
        }
      });
    });
  });

  it('CT-06: deve retornar erro ao cadastrar com senha menor que 8 caracteres', async () => {
    // Request invalida vem de fixtureRequisicao.senhaCurta.
    const response = await request(app)
      .post('/api/users')
      .send(fixtureRequisicao.senhaCurta);

    // Resposta esperada vem de fixtureResposta.senhaCurta.
    expect(response.status).to.equal(fixtureResposta.senhaCurta.statusEsperado);
    expect(response.body).to.deep.equal({
      error: {
        code: fixtureResposta.senhaCurta.codigoErroEsperado,
        message: fixtureResposta.senhaCurta.mensagemErroEsperada
      }
    });
  });

  it('CT-07: deve retornar erro ao cadastrar com body vazio', async () => {
    // Body vazio enviado a partir de fixtureRequisicao.corpoVazio.
    const response = await request(app)
      .post('/api/users')
      .send(fixtureRequisicao.corpoVazio);

    // Validacoes de retorno carregadas de fixtureResposta.corpoVazio.
    expect(response.status).to.equal(fixtureResposta.corpoVazio.statusEsperado);
    expect(response.body).to.deep.equal({
      error: {
        code: fixtureResposta.corpoVazio.codigoErroEsperado,
        message: fixtureResposta.corpoVazio.mensagemErroEsperada
      }
    });
  });
});
