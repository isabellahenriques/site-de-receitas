// Ferramentas do teste:
// - supertest: chama a API.
// - chai: verifica o resultado.
const request = require('supertest');
const { expect } = require('chai');

// API que será testada.
const app = require('../../../../src/app');

// Limpa dados antes de cada cenário.
const { resetUsers } = require('../../../../src/models/userModel');
const { resetRecipes } = require('../../../../src/models/recipeModel');

// Dados de entrada e resultados esperados.
const fixtureRequisicao = require('../../fixtures/recipes/public-recipes-list-requests.fixture');
const fixtureResposta = require('../../fixtures/recipes/public-recipes-list-responses.fixture');

// Testes da US-09 (listagem de receitas públicas).
describe('US-09 - Listagem de receitas publicas (GET /api/recipes)', () => {
  let idReceitaPublica;
  let idReceitaPrivada;
  let tituloReceitaPublica;
  let nomeAutorReceitaPublica;

  // Preparo: cria usuários, faz login e cria receitas pública e privada.
  beforeEach(async () => {
    resetUsers();
    resetRecipes();

    // E-mails únicos evitam mistura entre testes.
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

    // Cria e autentica autor da receita pública.
    const respostaCriacaoAutorPublica = await request(app)
      .post('/api/users')
      .send(usuarioAutorPublicaComEmailUnico);

    const respostaLoginAutorPublica = await request(app)
      .post('/api/auth/login')
      .send(loginAutorPublicaComEmailUnico);
    const tokenAutorPublica = respostaLoginAutorPublica.body.token;

    // Cria e autentica autor da receita privada.
    await request(app)
      .post('/api/users')
      .send(usuarioAutorPrivadaComEmailUnico);

    const respostaLoginAutorPrivada = await request(app)
      .post('/api/auth/login')
      .send(loginAutorPrivadaComEmailUnico);

    const tokenAutorPrivada = respostaLoginAutorPrivada.body.token;

    // Cria receita pública para validar retorno.
    const respostaReceitaPublica = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenAutorPublica}`)
      .send({
        ...fixtureRequisicao.receitaPublicaValida,
        // Título único facilita a validação.
        title: `Receita publica US09 ${sufixoUnico}`
      });

    // Cria receita privada para confirmar que não aparece na lista pública.
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

  // CT-39 e CT-41: listagem pública com comportamento esperado.
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
      // Executa o cenário.
      const response = await montarRequisicao();

      // Confirma sucesso.
      expect(response.status).to.equal(fixtureResposta.listagemPublicaComSucesso.statusEsperado);
      expect(response.body).to.be.an('array');

      // Receita pública deve aparecer.
      const receitaPublicaRetornada = response.body.find((receita) => receita.id === idReceitaPublica);
      expect(receitaPublicaRetornada).to.exist;

      // Receita privada não pode aparecer.
      const idsRetornados = response.body.map((receita) => receita.id);
      expect(idsRetornados).to.not.include(idReceitaPrivada);

      // Cada item precisa ter os campos mínimos.
      response.body.forEach((receita) => {
        fixtureResposta.camposObrigatoriosItemListagem.forEach((campoObrigatorio) => {
          expect(receita).to.have.property(campoObrigatorio);
        });

        // A listagem não deve expor detalhes sensíveis.
        expect(receita).to.not.have.property('visibility');
        expect(receita).to.not.have.property('ingredients');
        expect(receita).to.not.have.property('instructions');
        expect(receita).to.not.have.property('author');
      });

      // Confere dados da receita pública criada.
      expect(receitaPublicaRetornada.title).to.equal(tituloReceitaPublica);
      expect(receitaPublicaRetornada.authorName).to.equal(nomeAutorReceitaPublica);
    });
  });

  // CT-40: sem receitas públicas, deve voltar lista vazia.
  it('CT-40: deve retornar 200 e lista vazia quando nao existem receitas publicas cadastradas', async () => {
    // Remove receitas para simular ambiente vazio.
    resetRecipes();

    // Faz a listagem pública.
    const response = await request(app).get('/api/recipes');

    // Confirma sucesso com lista vazia.
    expect(response.status).to.equal(fixtureResposta.listagemPublicaComSucesso.statusEsperado);
    expect(response.body).to.be.an('array').that.is.empty;
  });
});
