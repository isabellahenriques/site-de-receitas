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
const fixtureRequisicao = require('../../fixtures/users/create-user-requests.fixture');

// Resultados esperados em cada caso.
const fixtureResposta = require('../../fixtures/users/create-user-responses.fixture');

function gerarEmailUnico(prefixo) {
  return `${prefixo}+${Date.now()}-${Math.floor(Math.random() * 100000)}@email.com`;
}

// Testes da US-01 (cadastro de usuário).
describe('US-01 - Cadastro de usuario (POST /api/users)', () => {

  // Cada caso começa com dados limpos.
  beforeEach(() => {
    resetUsers();
  });

  // CT-01: cadastro com dados corretos.
  it('CT-01: deve cadastrar usuario com sucesso com todos os campos validos', async () => {
    const usuarioValido = {
      ...fixtureRequisicao.usuarioValido,
      email: gerarEmailUnico('isabella.us01')
    };

    // Faz o cadastro.
    const response = await request(app)
      .post('/api/users')
      .send(usuarioValido);

    // Deve retornar sucesso de criação.
    expect(response.status).to.equal(fixtureResposta.sucesso.statusEsperado);

    // Confirma os campos principais.
    fixtureResposta.sucesso.camposEsperados.forEach((campo) => {
      expect(response.body).to.have.property(campo);
    });

    // Confirma se voltou o mesmo nome e e-mail enviados.
    expect(response.body.name).to.equal(usuarioValido.name);
    expect(response.body.email).to.equal(usuarioValido.email);

    // Segurança: a API não pode devolver senha.
    fixtureResposta.sucesso.camposNaoPermitidos.forEach((campo) => {
      expect(response.body).to.not.have.property(campo);
    });
  });

  // CT-02: não pode cadastrar duas contas com o mesmo e-mail.
  it('CT-02: deve retornar erro ao cadastrar com e-mail ja existente', async () => {
    const usuarioValido = {
      ...fixtureRequisicao.usuarioValido,
      email: gerarEmailUnico('isabella.us01')
    };

    // Primeiro cadastro.
    await request(app)
      .post('/api/users')
      .send(usuarioValido);

    // Segundo cadastro com o mesmo e-mail.
    const response = await request(app)
      .post('/api/users')
      .send(usuarioValido);

    // Deve retornar conflito com erro padronizado.
    expect(response.status).to.equal(fixtureResposta.emailDuplicado.statusEsperado);
    expect(response.body).to.deep.equal({
      error: {
        code: fixtureResposta.emailDuplicado.codigoErroEsperado,
        message: fixtureResposta.emailDuplicado.mensagemErroEsperada
      }
    });
  });

  // CT-03, CT-04 e CT-05: cadastro deve falhar quando falta campo obrigatório.
  const casosCampoAusente = [
    {
      idCaso: 'CT-03',
      descricao: 'sem o campo "name"',
      // Sem nome.
      carga: fixtureRequisicao.nomeAusente
    },
    {
      idCaso: 'CT-04',
      descricao: 'sem o campo "email"',
      // Sem e-mail.
      carga: fixtureRequisicao.emailAusente
    },
    {
      idCaso: 'CT-05',
      descricao: 'sem o campo "password"',
      // Sem senha.
      carga: fixtureRequisicao.senhaAusente
    }
  ];

  casosCampoAusente.forEach(({ idCaso, descricao, carga }) => {
    it(`${idCaso}: deve retornar erro ao cadastrar ${descricao}`, async () => {

      // Faz a chamada do cenário.
      const response = await request(app)
        .post('/api/users')
        .send(carga);

      // Deve retornar erro de validação.
      expect(response.status).to.equal(fixtureResposta.campoObrigatorioAusente.statusEsperado);
      expect(response.body).to.deep.equal({
        error: {
          code: fixtureResposta.campoObrigatorioAusente.codigoErroEsperado,
          message: fixtureResposta.campoObrigatorioAusente.mensagemErroEsperada
        }
      });
    });
  });

  // CT-06: senha curta deve falhar.
  it('CT-06: deve retornar erro ao cadastrar com senha menor que 8 caracteres', async () => {

    // Faz cadastro com senha curta.
    const response = await request(app)
      .post('/api/users')
      .send(fixtureRequisicao.senhaCurta);

    // Deve retornar erro de validação.
    expect(response.status).to.equal(fixtureResposta.senhaCurta.statusEsperado);
    expect(response.body).to.deep.equal({
      error: {
        code: fixtureResposta.senhaCurta.codigoErroEsperado,
        message: fixtureResposta.senhaCurta.mensagemErroEsperada
      }
    });
  });

  // CT-07: sem dados no corpo da requisição.
  it('CT-07: deve retornar erro ao cadastrar com body vazio', async () => {

    // Faz cadastro com body vazio.
    const response = await request(app)
      .post('/api/users')
      .send(fixtureRequisicao.corpoVazio);

    // Deve retornar erro de validação.
    expect(response.status).to.equal(fixtureResposta.corpoVazio.statusEsperado);
    expect(response.body).to.deep.equal({
      error: {
        code: fixtureResposta.corpoVazio.codigoErroEsperado,
        message: fixtureResposta.corpoVazio.mensagemErroEsperada
      }
    });
  });

});
