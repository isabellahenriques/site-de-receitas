// Bibliotecas de teste:
// - supertest: executa requisicoes HTTP diretamente na aplicacao Express.
// - chai: fornece assercoes para validar comportamento da API.
const request = require('supertest');
const { expect } = require('chai');

// Importa a aplicacao para execucao integrada dos testes.
const app = require('../../../../src/app');

// Importa resets para garantir isolamento entre cenarios.
const { resetUsers } = require('../../../../src/models/userModel');
const { resetRecipes } = require('../../../../src/models/recipeModel');

// Importa fixtures de entrada (request) e de saida esperada (response) da US-08.
const fixtureRequisicao = require('../../fixtures/recipes/visibility-control-requests.fixture');
const fixtureResposta = require('../../fixtures/recipes/visibility-control-responses.fixture');

// Agrupa os cenarios da US-08 — Controle de visibilidade da receita.
describe('US-08 - Controle de visibilidade da receita (GET /api/recipes, /api/recipes/:id e /api/recipes/my)', () => {
  let tokenUsuarioA;
  let tokenUsuarioB;
  let receitaPrivadaUsuarioBId;
  let receitaPublicaUsuarioBId;

  // beforeEach:
  // 1. Reseta usuarios e receitas em memoria.
  // 2. Cria usuario A e usuario B.
  // 3. Faz login de ambos para obter tokens.
  // 4. Cria no usuario B uma receita privada e uma publica para validar as regras da US-08.
  beforeEach(async () => {
    resetUsers();
    resetRecipes();

    // Gera e-mails unicos para evitar conflito com execucoes paralelas da suite.
    const sufixoUnico = Date.now();
    const usuarioAComEmailUnico = {
      ...fixtureRequisicao.usuarioAValido,
      email: `usuario.a.us08+${sufixoUnico}@email.com`
    };
    const loginUsuarioAComEmailUnico = {
      ...fixtureRequisicao.loginUsuarioAValido,
      email: usuarioAComEmailUnico.email
    };
    const usuarioBComEmailUnico = {
      ...fixtureRequisicao.usuarioBValido,
      email: `usuario.b.us08+${sufixoUnico}@email.com`
    };
    const loginUsuarioBComEmailUnico = {
      ...fixtureRequisicao.loginUsuarioBValido,
      email: usuarioBComEmailUnico.email
    };

    await request(app)
      .post('/api/users')
      .send(usuarioAComEmailUnico);

    const respostaLoginUsuarioA = await request(app)
      .post('/api/auth/login')
      .send(loginUsuarioAComEmailUnico);
    tokenUsuarioA = respostaLoginUsuarioA.body.token;

    await request(app)
      .post('/api/users')
      .send(usuarioBComEmailUnico);

    const respostaLoginUsuarioB = await request(app)
      .post('/api/auth/login')
      .send(loginUsuarioBComEmailUnico);
    tokenUsuarioB = respostaLoginUsuarioB.body.token;

    const respostaReceitaPrivada = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenUsuarioB}`)
      .send(fixtureRequisicao.receitaPrivadaUsuarioB);
    receitaPrivadaUsuarioBId = respostaReceitaPrivada.body.id;

    const respostaReceitaPublica = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenUsuarioB}`)
      .send(fixtureRequisicao.receitaPublicaUsuarioB);
    receitaPublicaUsuarioBId = respostaReceitaPublica.body.id;
  });

  // CT-35: receita privada nao deve aparecer em listagem publica.
  it('CT-35: deve retornar 200 e ocultar receitas privadas na listagem publica', async () => {
    // Executa endpoint publico de listagem sem autenticacao.
    const response = await request(app).get('/api/recipes');

    // Valida status de sucesso da listagem publica.
    expect(response.status).to.equal(fixtureResposta.listagemPublica.statusEsperado);
    expect(response.body).to.be.an('array');

    // Confirma que a receita privada do usuario B nao aparece no retorno publico.
    const idsRetornados = response.body.map((receita) => receita.id);
    expect(idsRetornados).to.include(receitaPublicaUsuarioBId);
    expect(idsRetornados).to.not.include(receitaPrivadaUsuarioBId);
  });

  // CT-36 e CT-37: cenarios de acesso ao detalhe da receita privada.
  // Data-Driven aplicado porque os casos compartilham fluxo base (GET /api/recipes/:id),
  // mudando apenas autenticacao e expectativa de erro.
  const casosErroAcessoReceitaPrivada = [
    {
      idCaso: 'CT-36',
      descricao: 'por outro usuario autenticado',
      montarRequisicao: ({ idReceitaPrivada, tokenA }) => request(app)
        .get(`/api/recipes/${idReceitaPrivada}`)
        .set('Authorization', `Bearer ${tokenA}`),
      respostaEsperada: fixtureResposta.acessoNegadoReceitaPrivadaOutroUsuario
    },
    {
      idCaso: 'CT-37',
      descricao: 'por visitante sem autenticacao',
      montarRequisicao: ({ idReceitaPrivada }) => request(app)
        .get(`/api/recipes/${idReceitaPrivada}`),
      respostaEsperada: fixtureResposta.acessoPrivadoSemAutenticacao
    }
  ];

  casosErroAcessoReceitaPrivada.forEach(({ idCaso, descricao, montarRequisicao, respostaEsperada }) => {
    it(`${idCaso}: deve retornar erro ao acessar receita privada ${descricao}`, async () => {
      // Executa o cenario com variacao de autenticacao definida no fixture.
      const response = await montarRequisicao({
        idReceitaPrivada: receitaPrivadaUsuarioBId,
        tokenA: tokenUsuarioA,
        tokenB: tokenUsuarioB
      });

      // Valida status HTTP e payload padrao de erro esperado.
      expect(response.status).to.equal(respostaEsperada.statusEsperado);
      expect(response.body).to.deep.equal({
        error: {
          code: respostaEsperada.codigoErroEsperado,
          message: respostaEsperada.mensagemErroEsperada
        }
      });
    });
  });

  // CT-38: endpoint de "minhas receitas" deve trazer publicas e privadas do proprio usuario.
  it('CT-38: deve retornar 200 e listar receitas publicas e privadas do proprio usuario', async () => {
    // Executa listagem autenticada de receitas do usuario B (dono das receitas criadas no setup).
    const response = await request(app)
      .get('/api/recipes/my')
      .set('Authorization', `Bearer ${tokenUsuarioB}`);

    // Valida retorno de sucesso e formato esperado em array.
    expect(response.status).to.equal(fixtureResposta.listagemMinhasReceitas.statusEsperado);
    expect(response.body).to.be.an('array');

    // Verifica que ambas as receitas do usuario (publica e privada) foram retornadas.
    const idsRetornados = response.body.map((receita) => receita.id);
    expect(idsRetornados).to.include(receitaPublicaUsuarioBId);
    expect(idsRetornados).to.include(receitaPrivadaUsuarioBId);

    // Verifica explicitamente os tipos de visibilidade presentes na listagem.
    const visibilidadesRetornadas = response.body.map((receita) => receita.visibility);
    expect(visibilidadesRetornadas).to.include('public');
    expect(visibilidadesRetornadas).to.include('private');
  });
});
