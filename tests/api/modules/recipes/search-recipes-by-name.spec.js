// Bibliotecas de teste:
// - supertest: executa requisicoes HTTP diretamente na aplicacao Express.
// - chai: fornece assercoes para validar status, estrutura e regras de negocio.
const request = require('supertest');
const { expect } = require('chai');

// Importa a aplicacao Express para teste integrado dos endpoints.
const app = require('../../../../src/app');

// Importa resets para garantir isolamento total entre cenarios.
const { resetUsers } = require('../../../../src/models/userModel');
const { resetRecipes } = require('../../../../src/models/recipeModel');

// Importa fixtures de entrada (request) e de saida esperada (response) da US-10.
const fixtureRequisicao = require('../../fixtures/recipes/search-recipes-by-name-requests.fixture');
const fixtureResposta = require('../../fixtures/recipes/search-recipes-by-name-responses.fixture');

// Agrupa os cenarios da US-10 — Busca de receitas por nome.
describe('US-10 - Busca de receitas por nome (GET /api/recipes?search=termo)', () => {
  let idReceitaPublica;
  let idReceitaPrivada;
  let tituloReceitaPublica;
  let tituloReceitaPrivada;

  // beforeEach:
  // 1. Reseta usuarios e receitas em memoria para garantir independencia dos testes.
  // 2. Cria os autores das receitas (publica e privada) e obtem os tokens.
  // 3. Cria a receita publica "Bolo de cenoura" para os cenarios de busca positiva.
  // 4. Cria a receita privada "Receita secreta" para validar que nao aparece na busca publica.
  beforeEach(async () => {
    resetUsers();
    resetRecipes();

    // Gera sufixo unico para evitar colisao de e-mail entre execucoes da suite.
    const sufixoUnico = Date.now();

    const usuarioAutorPublicaComEmailUnico = {
      ...fixtureRequisicao.usuarioAutorReceitaPublica,
      email: `autor.publico.us10+${sufixoUnico}@email.com`
    };
    const loginAutorPublicaComEmailUnico = {
      ...fixtureRequisicao.loginUsuarioAutorReceitaPublica,
      email: usuarioAutorPublicaComEmailUnico.email
    };

    const usuarioAutorPrivadaComEmailUnico = {
      ...fixtureRequisicao.usuarioAutorReceitaPrivada,
      email: `autor.privado.us10+${sufixoUnico}@email.com`
    };
    const loginAutorPrivadaComEmailUnico = {
      ...fixtureRequisicao.loginUsuarioAutorReceitaPrivada,
      email: usuarioAutorPrivadaComEmailUnico.email
    };

    // Cria usuarios autores para montar base de dados do cenario.
    await request(app)
      .post('/api/users')
      .send(usuarioAutorPublicaComEmailUnico);

    await request(app)
      .post('/api/users')
      .send(usuarioAutorPrivadaComEmailUnico);

    // Realiza login para obter token dos autores e criar receitas.
    const respostaLoginAutorPublica = await request(app)
      .post('/api/auth/login')
      .send(loginAutorPublicaComEmailUnico);
    const tokenAutorPublica = respostaLoginAutorPublica.body.token;

    const respostaLoginAutorPrivada = await request(app)
      .post('/api/auth/login')
      .send(loginAutorPrivadaComEmailUnico);
    const tokenAutorPrivada = respostaLoginAutorPrivada.body.token;

    // Cria receita publica com titulo deterministico para os asserts dos casos CT-42 e CT-43.
    const respostaReceitaPublica = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenAutorPublica}`)
      .send(fixtureRequisicao.receitaPublicaBase);

    // Cria receita privada para validar que nunca aparece na busca publica (CT-45).
    const respostaReceitaPrivada = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenAutorPrivada}`)
      .send(fixtureRequisicao.receitaPrivadaBase);

    idReceitaPublica = respostaReceitaPublica.body.id;
    idReceitaPrivada = respostaReceitaPrivada.body.id;
    tituloReceitaPublica = respostaReceitaPublica.body.title;
    tituloReceitaPrivada = respostaReceitaPrivada.body.title;
  });

  // CT-42, CT-43, CT-44 e CT-45:
  // Data-Driven Testing aplicado porque todos os cenarios usam o mesmo endpoint
  // e variam apenas o termo de busca e a expectativa de retorno.
  const cenariosBuscaPorNome = [
    {
      idCaso: 'CT-42',
      ...fixtureResposta.cenarios.CT42
    },
    {
      idCaso: 'CT-43',
      ...fixtureResposta.cenarios.CT43
    },
    {
      idCaso: 'CT-44',
      ...fixtureResposta.cenarios.CT44
    },
    {
      idCaso: 'CT-45',
      ...fixtureResposta.cenarios.CT45
    }
  ];

  cenariosBuscaPorNome.forEach((cenario) => {
    it(`${cenario.idCaso}: deve retornar 200 em ${cenario.descricao}`, async () => {
      const termoBusca = fixtureRequisicao.termosBusca[cenario.termoBusca];

      // Executa a busca publica por nome conforme termo definido no cenario.
      const response = await request(app)
        .get('/api/recipes')
        .query({ search: termoBusca });

      // Valida status de sucesso conforme contrato do Swagger para GET /api/recipes.
      expect(response.status).to.equal(fixtureResposta.buscaComSucesso.statusEsperado);
      expect(response.body).to.be.an('array');

      // Verifica os campos minimos de cada item retornado na listagem.
      response.body.forEach((receita) => {
        fixtureResposta.camposObrigatoriosItemListagem.forEach((campoObrigatorio) => {
          expect(receita).to.have.property(campoObrigatorio);
        });

        // Garante que o retorno de listagem nao expoe campos de detalhe da receita.
        expect(receita).to.not.have.property('visibility');
        expect(receita).to.not.have.property('ingredients');
        expect(receita).to.not.have.property('instructions');
        expect(receita).to.not.have.property('author');
      });

      // Busca a receita publica criada no setup para validar cenarios de retorno positivo.
      const receitaPublicaRetornada = response.body.find((receita) => receita.id === idReceitaPublica);

      // Valida regra de negocio de retorno da receita publica para CT-42 e CT-43.
      if (cenario.deveConterReceitaPublica) {
        expect(receitaPublicaRetornada).to.exist;
        expect(receitaPublicaRetornada.title).to.equal(tituloReceitaPublica);
      } else {
        expect(receitaPublicaRetornada).to.not.exist;
      }

      // Valida que a receita privada nunca aparece no endpoint publico (incluindo CT-45).
      if (cenario.deveOcultarReceitaPrivada) {
        const idsRetornados = response.body.map((receita) => receita.id);
        const titulosRetornados = response.body.map((receita) => receita.title);
        expect(idsRetornados).to.not.include(idReceitaPrivada);
        expect(titulosRetornados).to.not.include(tituloReceitaPrivada);
      }

      // Valida retorno vazio para cenarios sem resultado de busca (CT-44 e CT-45).
      if (cenario.deveRetornarListaVazia) {
        expect(response.body).to.be.an('array').that.is.empty;
      }
    });
  });
});
