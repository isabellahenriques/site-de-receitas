// Bibliotecas de teste:
// - supertest: executa requisicoes HTTP diretamente na aplicacao Express.
// - chai: fornece assercoes para validar status, estrutura e regras de negocio.
const request = require('supertest');
const { expect } = require('chai');

// Importa a aplicacao Express para teste integrado dos endpoints.
const app = require('../../../../src/app');

// Importa resets para garantir isolamento entre cenarios.
const { resetUsers } = require('../../../../src/models/userModel');
const { resetRecipes } = require('../../../../src/models/recipeModel');

// Importa fixtures de entrada (request) e de saida esperada (response) da US-09.
const fixtureRequisicao = require('../../fixtures/recipes/public-recipes-list-requests.fixture');
const fixtureResposta = require('../../fixtures/recipes/public-recipes-list-responses.fixture');

// Agrupa os cenarios da US-09 — Listagem de receitas publicas.
describe('US-09 - Listagem de receitas publicas (GET /api/recipes)', () => {
  let idReceitaPublica;
  let idReceitaPrivada;
  let tituloReceitaPublica;
  let nomeAutorReceitaPublica;

  // beforeEach:
  // 1. Reseta usuarios e receitas em memoria para isolamento total.
  // 2. Cria dois usuarios (autor de receita publica e autor de receita privada).
  // 3. Faz login para obter token dos dois usuarios.
  // 4. Cria uma receita publica e uma receita privada para validar filtro de visibilidade.
  beforeEach(async () => {
    resetUsers();
    resetRecipes();

    // Gera sufixo unico para e-mails e evita colisao com execucoes paralelas da suite.
    const sufixoUnico = Date.now();

    const usuarioAutorPublicaComEmailUnico = {
      ...fixtureRequisicao.usuarioAutorReceitaPublica,
      email: `autor.publico.us09+${sufixoUnico}@email.com`
    };
    const loginAutorPublicaComEmailUnico = {
      ...fixtureRequisicao.loginUsuarioAutorReceitaPublica,
      email: usuarioAutorPublicaComEmailUnico.email
    };

    const usuarioAutorPrivadaComEmailUnico = {
      ...fixtureRequisicao.usuarioAutorReceitaPrivada,
      email: `autor.privado.us09+${sufixoUnico}@email.com`
    };
    const loginAutorPrivadaComEmailUnico = {
      ...fixtureRequisicao.loginUsuarioAutorReceitaPrivada,
      email: usuarioAutorPrivadaComEmailUnico.email
    };

    // Cria usuario autor da receita publica e realiza login.
    const respostaCriacaoAutorPublica = await request(app)
      .post('/api/users')
      .send(usuarioAutorPublicaComEmailUnico);

    const respostaLoginAutorPublica = await request(app)
      .post('/api/auth/login')
      .send(loginAutorPublicaComEmailUnico);
    const tokenAutorPublica = respostaLoginAutorPublica.body.token;

    // Cria usuario autor da receita privada e realiza login.
    await request(app)
      .post('/api/users')
      .send(usuarioAutorPrivadaComEmailUnico);

    const respostaLoginAutorPrivada = await request(app)
      .post('/api/auth/login')
      .send(loginAutorPrivadaComEmailUnico);

    const tokenAutorPrivada = respostaLoginAutorPrivada.body.token;

    // Cria receita publica com autor conhecido para validar item retornado.
    const respostaReceitaPublica = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenAutorPublica}`)
      .send({
        ...fixtureRequisicao.receitaPublicaValida,
        // Sobrescreve o titulo para permitir assert deterministico no cenario.
        title: `Receita publica US09 ${sufixoUnico}`
      });

    // Cria receita privada para confirmar que nao aparece em GET /api/recipes.
    const respostaReceitaPrivada = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenAutorPrivada}`)
      .send({
        ...fixtureRequisicao.receitaPrivadaValida,
        title: `Receita privada US09 ${sufixoUnico}`
      });

    idReceitaPublica = respostaReceitaPublica.body.id;
    idReceitaPrivada = respostaReceitaPrivada.body.id;
    tituloReceitaPublica = respostaReceitaPublica.body.title;
    nomeAutorReceitaPublica = respostaCriacaoAutorPublica.body.name;
  });

  // CT-39 e CT-41:
  // Data-Driven Testing aplicado porque ambos os cenarios validam o mesmo endpoint,
  // mudando apenas a presenca de token na requisicao.
  const casosListagemPublica = [
    {
      idCaso: 'CT-39',
      descricao: 'com sucesso contendo somente receitas publicas',
      montarRequisicao: () => request(app).get('/api/recipes')
    },
    {
      idCaso: 'CT-41',
      descricao: 'sem autenticacao',
      montarRequisicao: () => request(app).get('/api/recipes')
    }
  ];

  casosListagemPublica.forEach(({ idCaso, descricao, montarRequisicao }) => {
    it(`${idCaso}: deve retornar 200 na listagem publica ${descricao}`, async () => {
      // Executa a variacao da requisicao definida para o cenario atual.
      const response = await montarRequisicao();

      // Valida status de sucesso da listagem publica.
      expect(response.status).to.equal(fixtureResposta.listagemPublicaComSucesso.statusEsperado);
      expect(response.body).to.be.an('array');

      // Garante que a receita publica criada no setup esta presente.
      const receitaPublicaRetornada = response.body.find((receita) => receita.id === idReceitaPublica);
      expect(receitaPublicaRetornada).to.exist;

      // Garante que a receita privada criada no setup nao esta presente.
      const idsRetornados = response.body.map((receita) => receita.id);
      expect(idsRetornados).to.not.include(idReceitaPrivada);

      // Verifica campos obrigatorios definidos no Swagger para cada item retornado.
      response.body.forEach((receita) => {
        fixtureResposta.camposObrigatoriosItemListagem.forEach((campoObrigatorio) => {
          expect(receita).to.have.property(campoObrigatorio);
        });

        // Garante que o payload de listagem nao expoe campos de receita detalhada.
        expect(receita).to.not.have.property('visibility');
        expect(receita).to.not.have.property('ingredients');
        expect(receita).to.not.have.property('instructions');
        expect(receita).to.not.have.property('author');
      });

      // Valida dados do item da receita publica criada para reforcar regra de negocio.
      expect(receitaPublicaRetornada.title).to.equal(tituloReceitaPublica);
      expect(receitaPublicaRetornada.authorName).to.equal(nomeAutorReceitaPublica);
    });
  });

  // CT-40: quando nao existem receitas publicas cadastradas, retorno deve ser lista vazia.
  it('CT-40: deve retornar 200 e lista vazia quando nao existem receitas publicas cadastradas', async () => {
    // Limpa receitas para simular cenario sem dados publicos na plataforma.
    resetRecipes();

    // Executa listagem publica sem autenticacao.
    const response = await request(app).get('/api/recipes');

    // Valida retorno de sucesso e lista vazia conforme regra do caso de teste.
    expect(response.status).to.equal(fixtureResposta.listagemPublicaComSucesso.statusEsperado);
    expect(response.body).to.be.an('array').that.is.empty;
  });
});
