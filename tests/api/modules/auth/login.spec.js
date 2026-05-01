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
const fixtureRequisicao = require('../../fixtures/auth/login-requests.fixture');

// Importa os resultados esperados para validar as respostas da API (saída da API).
const fixtureResposta = require('../../fixtures/auth/login-responses.fixture');

// Agrupa todos os testes da US-02 — Login de usuário.
describe('US-02 - Login de usuario (POST /api/auth/login)', () => {

  // Executado antes de cada teste individual:
  // 1. Limpa o banco em memória para garantir isolamento entre os cenários.
  // 2. Cria um usuário válido para que o login possa ser testado.
  //    Isso é necessário pois o banco é zerado antes de cada teste.
  beforeEach(async () => {
    resetUsers();

    await request(app)
      .post('/api/users')
      .send(fixtureRequisicao.usuarioValido);
  });

  // CT-08: Cenário positivo — login com e-mail e senha corretos.
  it('CT-08: deve realizar login com sucesso com credenciais validas', async () => {

    // Envia a requisição de login com as credenciais válidas definidas na fixture.
    const response = await request(app)
      .post('/api/auth/login')
      .send(fixtureRequisicao.loginValido);

    // Verifica se o status HTTP retornado é 200 (sucesso).
    expect(response.status).to.equal(fixtureResposta.sucesso.statusEsperado);

    // Verifica se os campos obrigatórios (token e expiresIn) estão presentes na resposta.
    fixtureResposta.sucesso.camposEsperados.forEach((campo) => {
      expect(response.body).to.have.property(campo);
    });

    // Verifica se o token retornado é uma string no formato JWT válido.
    // Um JWT sempre tem 3 partes separadas por ponto: header.payload.signature.
    expect(response.body.token).to.be.a('string');
    expect(response.body.token.split('.')).to.have.lengthOf(3);

    // Verifica se o tempo de expiração do token está correto conforme documentado no Swagger.
    expect(response.body.expiresIn).to.equal(fixtureResposta.sucesso.expiresInEsperado);

    // Verifica que campos sensíveis como senha e hash da senha não foram retornados.
    fixtureResposta.sucesso.camposNaoPermitidos.forEach((campo) => {
      expect(response.body).to.not.have.property(campo);
    });
  });

  // CT-09 e CT-10: Cenários negativos — credenciais inválidas.
  // Usando Data-Driven Testing: os dois casos compartilham a mesma lógica de validação,
  // então são agrupados em um array e executados em loop para evitar repetição de código.
  const casosCredenciaisInvalidas = [
    {
      idCaso: 'CT-09',
      descricao: 'com e-mail não cadastrado',
      // Body com e-mail que não existe no banco.
      carga: fixtureRequisicao.emailNaoCadastrado
    },
    {
      idCaso: 'CT-10',
      descricao: 'com senha incorreta',
      // Body com e-mail válido mas senha errada.
      carga: fixtureRequisicao.senhaIncorreta
    }
  ];

  casosCredenciaisInvalidas.forEach(({ idCaso, descricao, carga }) => {
    it(`${idCaso}: deve retornar erro de credenciais invalidas ao realizar login ${descricao}`, async () => {

      // Envia a requisição com as credenciais inválidas do caso atual.
      const response = await request(app)
        .post('/api/auth/login')
        .send(carga);

      // Verifica se o status HTTP é 401 (não autorizado) e se o corpo da resposta
      // contém o código e a mensagem de erro esperados.
      expect(response.status).to.equal(fixtureResposta.credenciaisInvalidas.statusEsperado);
      expect(response.body).to.deep.equal({
        error: {
          code: fixtureResposta.credenciaisInvalidas.codigoErroEsperado,
          message: fixtureResposta.credenciaisInvalidas.mensagemErroEsperada
        }
      });
    });
  });

  // CT-11 e CT-12: Cenários negativos — campos obrigatórios ausentes no body.
  // Também utiliza Data-Driven Testing pelo mesmo motivo dos casos acima.
  const casosCampoAusente = [
    {
      idCaso: 'CT-11',
      descricao: 'sem o campo "email"',
      // Body enviado sem o campo e-mail.
      carga: fixtureRequisicao.emailAusente
    },
    {
      idCaso: 'CT-12',
      descricao: 'sem o campo "password"',
      // Body enviado sem o campo senha.
      carga: fixtureRequisicao.senhaAusente
    }
  ];

  casosCampoAusente.forEach(({ idCaso, descricao, carga }) => {
    it(`${idCaso}: deve retornar erro ao realizar login ${descricao}`, async () => {

      // Envia a requisição com o campo ausente do caso atual.
      const response = await request(app)
        .post('/api/auth/login')
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

});
