// Bibliotecas de teste:
// - supertest: permite fazer requisições HTTP para a API sem precisar que o servidor esteja rodando separadamente.
// - chai: fornece funções de validação (assertions) para verificar se o resultado é o esperado.
const request = require('supertest');
const { expect } = require('chai');

// Importa a aplicação Express para que o supertest possa fazer requisições diretamente nela.
const app = require('../../../../src/app');

// Importa a função que limpa o banco de dados em memória antes de cada teste.
// Como o banco é em memória, os dados precisam ser resetados para garantir que
// um teste não interfira no resultado do outro.
const { resetUsers } = require('../../../../src/models/userModel');

// Importa os dados que serão enviados no corpo das requisições (entrada da API).
const fixtureRequisicao = require('../../fixtures/users/create-user-requests.fixture');

// Importa os resultados esperados para validar as respostas da API (saída da API).
const fixtureResposta = require('../../fixtures/users/create-user-responses.fixture');

// Agrupa todos os testes da US-01 — Cadastro de usuário.
describe('US-01 - Cadastro de usuario (POST /api/users)', () => {

  // Executado antes de cada teste individual para limpar o banco em memória.
  // Isso garante que os dados de um teste não influenciem o próximo.
  beforeEach(() => {
    resetUsers();
  });

  // CT-01: Cenário positivo — cadastro com todos os campos preenchidos corretamente.
  it('CT-01: deve cadastrar usuario com sucesso com todos os campos validos', async () => {

    // Envia a requisição de cadastro com os dados válidos definidos na fixture.
    const response = await request(app)
      .post('/api/users')
      .send(fixtureRequisicao.usuarioValido);

    // Verifica se o status HTTP retornado é 201 (criado com sucesso).
    expect(response.status).to.equal(fixtureResposta.sucesso.statusEsperado);

    // Verifica se os campos obrigatórios (id, name, email) estão presentes na resposta.
    fixtureResposta.sucesso.camposEsperados.forEach((campo) => {
      expect(response.body).to.have.property(campo);
    });

    // Verifica se os dados retornados correspondem ao que foi enviado na requisição.
    expect(response.body.name).to.equal(fixtureRequisicao.usuarioValido.name);
    expect(response.body.email).to.equal(fixtureRequisicao.usuarioValido.email);

    // Verifica que campos sensíveis como senha e hash da senha não foram retornados.
    fixtureResposta.sucesso.camposNaoPermitidos.forEach((campo) => {
      expect(response.body).to.not.have.property(campo);
    });
  });

  // CT-02: Cenário negativo — tentativa de cadastro com um e-mail já existente no banco.
  it('CT-02: deve retornar erro ao cadastrar com e-mail ja existente', async () => {

    // Primeiro cadastro — cria o usuário no banco.
    await request(app)
      .post('/api/users')
      .send(fixtureRequisicao.usuarioValido);

    // Segundo cadastro com o mesmo e-mail — deve ser rejeitado pela API.
    const response = await request(app)
      .post('/api/users')
      .send(fixtureRequisicao.usuarioValido);

    // Verifica se o status HTTP é 409 (conflito) e se o corpo da resposta
    // contém o código e a mensagem de erro esperados.
    expect(response.status).to.equal(fixtureResposta.emailDuplicado.statusEsperado);
    expect(response.body).to.deep.equal({
      error: {
        code: fixtureResposta.emailDuplicado.codigoErroEsperado,
        message: fixtureResposta.emailDuplicado.mensagemErroEsperada
      }
    });
  });

  // CT-03, CT-04 e CT-05: Cenários negativos — campos obrigatórios ausentes no body.
  // Usando Data-Driven Testing: os três casos compartilham a mesma lógica de validação,
  // então são agrupados em um array e executados em loop para evitar repetição de código.
  const casosCampoAusente = [
    {
      idCaso: 'CT-03',
      descricao: 'sem o campo "name"',
      // Body enviado sem o campo nome.
      carga: fixtureRequisicao.nomeAusente
    },
    {
      idCaso: 'CT-04',
      descricao: 'sem o campo "email"',
      // Body enviado sem o campo e-mail.
      carga: fixtureRequisicao.emailAusente
    },
    {
      idCaso: 'CT-05',
      descricao: 'sem o campo "password"',
      // Body enviado sem o campo senha.
      carga: fixtureRequisicao.senhaAusente
    }
  ];

  casosCampoAusente.forEach(({ idCaso, descricao, carga }) => {
    it(`${idCaso}: deve retornar erro ao cadastrar ${descricao}`, async () => {

      // Envia a requisição com o campo ausente do caso atual.
      const response = await request(app)
        .post('/api/users')
        .send(carga);

      // Verifica se o status HTTP é 400 (requisição inválida) e se o corpo da resposta
      // contém o código e a mensagem de erro esperados.
      expect(response.status).to.equal(fixtureResposta.campoObrigatorioAusente.statusEsperado);
      expect(response.body).to.deep.equal({
        error: {
          code: fixtureResposta.campoObrigatorioAusente.codigoErroEsperado,
          message: fixtureResposta.campoObrigatorioAusente.mensagemErroEsperada
        }
      });
    });
  });

  // CT-06: Cenário negativo — senha com menos de 8 caracteres.
  it('CT-06: deve retornar erro ao cadastrar com senha menor que 8 caracteres', async () => {

    // Envia a requisição com uma senha de apenas 3 caracteres.
    const response = await request(app)
      .post('/api/users')
      .send(fixtureRequisicao.senhaCurta);

    // Verifica se o status HTTP é 400 e se o corpo da resposta contém
    // o código e a mensagem de erro esperados para senha inválida.
    expect(response.status).to.equal(fixtureResposta.senhaCurta.statusEsperado);
    expect(response.body).to.deep.equal({
      error: {
        code: fixtureResposta.senhaCurta.codigoErroEsperado,
        message: fixtureResposta.senhaCurta.mensagemErroEsperada
      }
    });
  });

  // CT-07: Cenário negativo — body completamente vazio enviado na requisição.
  it('CT-07: deve retornar erro ao cadastrar com body vazio', async () => {

    // Envia a requisição sem nenhum dado no corpo.
    const response = await request(app)
      .post('/api/users')
      .send(fixtureRequisicao.corpoVazio);

    // Verifica se o status HTTP é 400 e se o corpo da resposta contém
    // o código e a mensagem de erro esperados para body vazio.
    expect(response.status).to.equal(fixtureResposta.corpoVazio.statusEsperado);
    expect(response.body).to.deep.equal({
      error: {
        code: fixtureResposta.corpoVazio.codigoErroEsperado,
        message: fixtureResposta.corpoVazio.mensagemErroEsperada
      }
    });
  });

});
