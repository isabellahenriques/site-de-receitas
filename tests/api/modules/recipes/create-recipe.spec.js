// Bibliotecas de teste:
// - supertest: permite fazer requisições HTTP para a API sem depender de ferramentas externas.
// - chai: fornece validações para garantir que o comportamento retornado é o esperado.
const request = require('supertest');
const { expect } = require('chai');

// Importa a aplicação Express para o supertest enviar requisições diretamente para os endpoints.
const app = require('../../../../src/app');

// Importa funções de reset dos bancos em memória para garantir isolamento entre os testes.
// Como os dados ficam em arrays na memória, cada cenário deve começar com ambiente limpo.
const { resetRecipes } = require('../../../../src/models/recipeModel');

// Importa os dados de entrada (massa de requisição) da US-05.
const fixtureRequisicao = require('../../fixtures/recipes/create-recipe-requests.fixture');

// Importa os dados esperados de saída (status e mensagens) da US-05.
const fixtureResposta = require('../../fixtures/recipes/create-recipe-responses.fixture');

// Agrupa todos os testes da US-05 — Cadastro de receita.
describe('US-05 - Cadastro de receita (POST /api/recipes)', () => {
  let tokenValido;
  let usuarioAutenticado;
  let credenciaisLogin;

  // beforeEach:
  // 1. Limpa o banco de receitas em memória para que um cenário não influencie o outro.
  // 2. Cria um usuário válido via endpoint de cadastro.
  // 3. Realiza login para obter token JWT válido para os cenários autenticados.
  beforeEach(async () => {
    resetRecipes();

    // Gera um e-mail único por cenário para evitar colisão de token com outros testes.
    // Isso é importante porque a suíte completa também possui cenários que invalidam tokens.
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

  // CT-20 e CT-21: Cenários positivos do cadastro de receita.
  // Data-Driven Testing foi aplicado porque os dois cenários usam o mesmo fluxo base
  // (enviar POST autenticado e validar criação), mudando apenas os dados da receita.
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
      // Envia a requisição autenticada de cadastro de receita com os dados do cenário atual.
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${tokenValido}`)
        .send(payload);

      // Verifica se o status retornado é 201 (recurso criado com sucesso).
      expect(response.status).to.equal(fixtureResposta.sucesso.statusEsperado);

      // Verifica presença de todos os campos principais esperados no corpo da resposta.
      fixtureResposta.sucesso.camposEsperados.forEach((campo) => {
        expect(response.body).to.have.property(campo);
      });

      // Verifica que os dados de receita retornados batem com os enviados na requisição.
      expect(response.body.title).to.equal(payload.title);
      expect(response.body.ingredients).to.equal(payload.ingredients);
      expect(response.body.instructions).to.equal(payload.instructions);
      expect(response.body.visibility).to.equal(payload.visibility);

      // Verifica que o autor da receita foi preenchido com o usuário autenticado.
      expect(response.body.author).to.be.an('object');
      fixtureResposta.sucesso.camposEsperadosAuthor.forEach((campo) => {
        expect(response.body.author).to.have.property(campo);
      });
      expect(response.body.author.id).to.equal(usuarioAutenticado.id);
      expect(response.body.author.name).to.equal(usuarioAutenticado.name);
    });
  });

  // CT-22, CT-23 e CT-24: Cenários negativos do cadastro de receita.
  // Também usamos Data-Driven Testing porque os cenários compartilham a mesma lógica
  // (montar requisição POST e validar erro), mudando token e/ou payload.
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
      // Cria a requisição base para o endpoint de cadastro de receita.
      const requisicaoBase = request(app).post('/api/recipes');

      // Aplica a variação do cenário atual (com ou sem token e payload específico).
      const response = await montarRequisicao(requisicaoBase);

      // Verifica se o status HTTP retornado é o esperado para o erro do cenário.
      expect(response.status).to.equal(respostaEsperada.statusEsperado);

      // Verifica se o corpo retorna o erro padronizado com código e mensagem corretos.
      expect(response.body).to.deep.equal({
        error: {
          code: respostaEsperada.codigoErroEsperado,
          message: respostaEsperada.mensagemErroEsperada
        }
      });
    });
  });
});
