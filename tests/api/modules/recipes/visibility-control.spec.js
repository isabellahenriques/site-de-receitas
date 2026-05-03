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
const fixtureRequisicao = require('../../fixtures/recipes/visibility-control-requests.fixture');
const fixtureResposta = require('../../fixtures/recipes/visibility-control-responses.fixture');

// Testes da US-08 (visibilidade da receita).
describe('US-08 - Controle de visibilidade da receita (GET /api/recipes, /api/recipes/:id e /api/recipes/my)', () => {
  let tokenUsuarioA;
  let tokenUsuarioB;
  let receitaPrivadaUsuarioBId;
  let receitaPublicaUsuarioBId;

  // Preparo: cria usuários, faz login e cria receitas pública e privada.
  beforeEach(async () => {
    resetUsers();
    resetRecipes();

    // E-mails únicos evitam mistura entre testes.
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

  // CT-35: receita privada não deve aparecer na listagem pública.
  it('CT-35: deve retornar 200 e ocultar receitas privadas na listagem publica', async () => {
    // Faz a listagem pública.
    const response = await request(app).get('/api/recipes');

    // Confirma sucesso.
    expect(response.status).to.equal(fixtureResposta.listagemPublica.statusEsperado);
    expect(response.body).to.be.an('array');

    // Confirma que só aparece a receita pública.
    const idsRetornados = response.body.map((receita) => receita.id);
    expect(idsRetornados).to.include(receitaPublicaUsuarioBId);
    expect(idsRetornados).to.not.include(receitaPrivadaUsuarioBId);
  });

  // CT-36 e CT-37: acesso indevido à receita privada.
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
      // Executa a variação do cenário.
      const response = await montarRequisicao({
        idReceitaPrivada: receitaPrivadaUsuarioBId,
        tokenA: tokenUsuarioA,
        tokenB: tokenUsuarioB
      });

      // Confirma status e erro esperados.
      expect(response.status).to.equal(respostaEsperada.statusEsperado);
      expect(response.body).to.deep.equal({
        error: {
          code: respostaEsperada.codigoErroEsperado,
          message: respostaEsperada.mensagemErroEsperada
        }
      });
    });
  });

  // CT-38: "minhas receitas" deve mostrar públicas e privadas do dono.
  it('CT-38: deve retornar 200 e listar receitas publicas e privadas do proprio usuario', async () => {
    // Faz a listagem do usuário dono.
    const response = await request(app)
      .get('/api/recipes/my')
      .set('Authorization', `Bearer ${tokenUsuarioB}`);

    // Confirma sucesso e formato em lista.
    expect(response.status).to.equal(fixtureResposta.listagemMinhasReceitas.statusEsperado);
    expect(response.body).to.be.an('array');

    // Confirma que vieram as duas receitas.
    const idsRetornados = response.body.map((receita) => receita.id);
    expect(idsRetornados).to.include(receitaPublicaUsuarioBId);
    expect(idsRetornados).to.include(receitaPrivadaUsuarioBId);

    // Confirma os tipos de visibilidade.
    const visibilidadesRetornadas = response.body.map((receita) => receita.visibility);
    expect(visibilidadesRetornadas).to.include('public');
    expect(visibilidadesRetornadas).to.include('private');
  });
});
