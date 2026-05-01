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
const fixtureRequisicao = require('../../fixtures/recipes/search-recipes-by-name-requests.fixture');
const fixtureResposta = require('../../fixtures/recipes/search-recipes-by-name-responses.fixture');

// Testes da US-10 (busca por nome).
describe('US-10 - Busca de receitas por nome (GET /api/recipes?search=termo)', () => {
  let idReceitaPublica;
  let idReceitaPrivada;
  let tituloReceitaPublica;
  let tituloReceitaPrivada;

  // Preparo: cria usuários, faz login e cria receitas pública e privada.
  beforeEach(async () => {
    resetUsers();
    resetRecipes();

    // E-mails únicos evitam mistura entre testes.
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

    // Cria os dois usuários.
    await request(app)
      .post('/api/users')
      .send(usuarioAutorPublicaComEmailUnico);

    await request(app)
      .post('/api/users')
      .send(usuarioAutorPrivadaComEmailUnico);

    // Faz login para obter tokens.
    const respostaLoginAutorPublica = await request(app)
      .post('/api/auth/login')
      .send(loginAutorPublicaComEmailUnico);
    const tokenAutorPublica = respostaLoginAutorPublica.body.token;

    const respostaLoginAutorPrivada = await request(app)
      .post('/api/auth/login')
      .send(loginAutorPrivadaComEmailUnico);
    const tokenAutorPrivada = respostaLoginAutorPrivada.body.token;

    // Cria receita pública para os cenários de busca.
    const respostaReceitaPublica = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenAutorPublica}`)
      .send(fixtureRequisicao.receitaPublicaBase);

    // Cria receita privada para validar ocultação.
    const respostaReceitaPrivada = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenAutorPrivada}`)
      .send(fixtureRequisicao.receitaPrivadaBase);

    idReceitaPublica = respostaReceitaPublica.body.id;
    idReceitaPrivada = respostaReceitaPrivada.body.id;
    tituloReceitaPublica = respostaReceitaPublica.body.title;
    tituloReceitaPrivada = respostaReceitaPrivada.body.title;
  });

  // CT-42, CT-43, CT-44 e CT-45: cenários da busca.
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

      // Faz a busca com o termo do cenário.
      const response = await request(app)
        .get('/api/recipes')
        .query({ search: termoBusca });

      // Confirma sucesso.
      expect(response.status).to.equal(fixtureResposta.buscaComSucesso.statusEsperado);
      expect(response.body).to.be.an('array');

      // Cada item precisa ter os campos mínimos.
      response.body.forEach((receita) => {
        fixtureResposta.camposObrigatoriosItemListagem.forEach((campoObrigatorio) => {
          expect(receita).to.have.property(campoObrigatorio);
        });

        // Não deve expor detalhes extras.
        expect(receita).to.not.have.property('visibility');
        expect(receita).to.not.have.property('ingredients');
        expect(receita).to.not.have.property('instructions');
        expect(receita).to.not.have.property('author');
      });

      // Procura a receita pública criada no preparo.
      const receitaPublicaRetornada = response.body.find((receita) => receita.id === idReceitaPublica);

      // Nos cenários positivos, receita pública deve aparecer.
      if (cenario.deveConterReceitaPublica) {
        expect(receitaPublicaRetornada).to.exist;
        expect(receitaPublicaRetornada.title).to.equal(tituloReceitaPublica);
      } else {
        expect(receitaPublicaRetornada).to.not.exist;
      }

      // Receita privada nunca pode aparecer.
      if (cenario.deveOcultarReceitaPrivada) {
        const idsRetornados = response.body.map((receita) => receita.id);
        const titulosRetornados = response.body.map((receita) => receita.title);
        expect(idsRetornados).to.not.include(idReceitaPrivada);
        expect(titulosRetornados).to.not.include(tituloReceitaPrivada);
      }

      // Nos cenários sem resultado, a lista deve vir vazia.
      if (cenario.deveRetornarListaVazia) {
        expect(response.body).to.be.an('array').that.is.empty;
      }
    });
  });
});
