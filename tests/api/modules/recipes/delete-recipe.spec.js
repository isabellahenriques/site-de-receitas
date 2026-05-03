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

// Dados de entrada dos testes.
const fixtureRequisicao = require('../../fixtures/recipes/delete-recipe-requests.fixture');

// Resultados esperados em cada caso.
const fixtureResposta = require('../../fixtures/recipes/delete-recipe-responses.fixture');

// Testes da US-07 (exclusão de receita).
describe('US-07 - Exclusao de receita (DELETE /api/recipes/:id)', () => {
  let usuarioAId;
  let usuarioBId;
  let tokenUsuarioA;
  let tokenUsuarioB;
  let receitaUsuarioAId;
  let receitaUsuarioBId;

  // Preparo: cria usuários, faz login e cria receitas.
  beforeEach(async () => {
    resetUsers();
    resetRecipes();

    // Usuário técnico para evitar conflito com outros cenários da suíte.
    await request(app)
      .post('/api/users')
      .send({
        name: 'Usuario Tecnico US07',
        email: `usuario.tecnico.us07+${Date.now()}@email.com`,
        password: '12345678'
      });

    // E-mails únicos evitam mistura entre testes.
    const sufixoUnico = Date.now();
    const usuarioAComEmailUnico = {
      ...fixtureRequisicao.usuarioAValido,
      email: `usuario.a.us07+${sufixoUnico}@email.com`
    };
    const loginUsuarioAComEmailUnico = {
      ...fixtureRequisicao.loginUsuarioAValido,
      email: usuarioAComEmailUnico.email
    };
    const usuarioBComEmailUnico = {
      ...fixtureRequisicao.usuarioBValido,
      email: `usuario.b.us07+${sufixoUnico}@email.com`
    };
    const loginUsuarioBComEmailUnico = {
      ...fixtureRequisicao.loginUsuarioBValido,
      email: usuarioBComEmailUnico.email
    };

    const respostaCriacaoUsuarioA = await request(app)
      .post('/api/users')
      .send(usuarioAComEmailUnico);
    usuarioAId = respostaCriacaoUsuarioA.body.id;

    const respostaLoginUsuarioA = await request(app)
      .post('/api/auth/login')
      .send(loginUsuarioAComEmailUnico);
    tokenUsuarioA = respostaLoginUsuarioA.body.token;

    const respostaCriacaoUsuarioB = await request(app)
      .post('/api/users')
      .send(usuarioBComEmailUnico);
    usuarioBId = respostaCriacaoUsuarioB.body.id;

    const respostaLoginUsuarioB = await request(app)
      .post('/api/auth/login')
      .send(loginUsuarioBComEmailUnico);
    tokenUsuarioB = respostaLoginUsuarioB.body.token;

    const respostaCriacaoReceitaUsuarioA = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenUsuarioA}`)
      .send(fixtureRequisicao.receitaUsuarioAValida);
    receitaUsuarioAId = respostaCriacaoReceitaUsuarioA.body.id;

    const respostaCriacaoReceitaUsuarioB = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenUsuarioB}`)
      .send(fixtureRequisicao.receitaUsuarioBValida);
    receitaUsuarioBId = respostaCriacaoReceitaUsuarioB.body.id;
  });

  // CT-30: exclusão com sucesso.
  const casosSucessoExclusao = [
    {
      idCaso: 'CT-30',
      descricao: 'de receita propria com token valido',
      obterIdReceitaAlvo: ({ idReceitaA }) => idReceitaA,
      token: ({ tokenA }) => tokenA,
      respostaEsperada: fixtureResposta.sucesso
    }
  ];

  casosSucessoExclusao.forEach(({ idCaso, descricao, obterIdReceitaAlvo, token, respostaEsperada }) => {
    it(`${idCaso}: deve excluir receita com sucesso ${descricao}`, async () => {
      // Escolhe a receita do cenário.
      const idReceitaAlvo = obterIdReceitaAlvo({
        idReceitaA: receitaUsuarioAId,
        idReceitaB: receitaUsuarioBId
      });

      // Faz a exclusão.
      const respostaExclusao = await request(app)
        .delete(`/api/recipes/${idReceitaAlvo}`)
        .set('Authorization', `Bearer ${token({ tokenA: tokenUsuarioA, tokenB: tokenUsuarioB })}`);

      // Deve retornar status de sucesso.
      expect(respostaEsperada.statusAceitos).to.include(respostaExclusao.status);

      // Depois da exclusão, a receita não pode mais existir.
      const respostaConsultaAposExclusao = await request(app).get(`/api/recipes/${idReceitaAlvo}`);
      expect(respostaConsultaAposExclusao.status).to.equal(fixtureResposta.receitaNaoAcessivelAposExclusao.statusEsperado);
      expect(respostaConsultaAposExclusao.body).to.deep.equal({
        error: {
          code: fixtureResposta.receitaNaoAcessivelAposExclusao.codigoErroEsperado,
          message: fixtureResposta.receitaNaoAcessivelAposExclusao.mensagemErroEsperada
        }
      });
    });
  });

  // CT-31, CT-32 e CT-33: cenários de erro.
  const casosErroExclusao = [
    {
      idCaso: 'CT-31',
      descricao: 'ao tentar excluir receita de outro usuario',
      obterIdReceitaAlvo: ({ idReceitaB }) => idReceitaB,
      montarHeaderAutorizacao: ({ tokenA }) => `Bearer ${tokenA}`,
      respostaEsperada: fixtureResposta.excluirReceitaDeOutroUsuario
    },
    {
      idCaso: 'CT-32',
      descricao: 'ao informar id inexistente',
      obterIdReceitaAlvo: () => fixtureRequisicao.idReceitaInexistente,
      montarHeaderAutorizacao: ({ tokenA }) => `Bearer ${tokenA}`,
      respostaEsperada: fixtureResposta.receitaNaoEncontrada
    },
    {
      idCaso: 'CT-33',
      descricao: 'ao chamar endpoint sem token',
      obterIdReceitaAlvo: ({ idReceitaA }) => idReceitaA,
      montarHeaderAutorizacao: () => null,
      respostaEsperada: fixtureResposta.tokenObrigatorio
    }
  ];

  casosErroExclusao.forEach(({ idCaso, descricao, obterIdReceitaAlvo, montarHeaderAutorizacao, respostaEsperada }) => {
    it(`${idCaso}: deve retornar erro ${descricao}`, async () => {
      // Escolhe a receita alvo.
      const idReceitaAlvo = obterIdReceitaAlvo({
        idReceitaA: receitaUsuarioAId,
        idReceitaB: receitaUsuarioBId
      });

      // Chamada base de exclusão.
      let requisicao = request(app).delete(`/api/recipes/${idReceitaAlvo}`);

      // Só envia token quando o cenário pede.
      const headerAutorizacao = montarHeaderAutorizacao({
        tokenA: tokenUsuarioA,
        tokenB: tokenUsuarioB
      });
      if (headerAutorizacao) {
        requisicao = requisicao.set('Authorization', headerAutorizacao);
      }

      // Executa a chamada.
      const response = await requisicao;

      // Confirma o status esperado.
      expect(response.status).to.equal(respostaEsperada.statusEsperado);

      // Confirma o erro padronizado.
      expect(response.body).to.deep.equal({
        error: {
          code: respostaEsperada.codigoErroEsperado,
          message: respostaEsperada.mensagemErroEsperada
        }
      });

      // No CT-31, confirma que a receita do usuário B continua existindo.
      if (idCaso === 'CT-31') {
        const respostaConsultaReceitaB = await request(app)
          .get(`/api/recipes/${receitaUsuarioBId}`)
          .set('Authorization', `Bearer ${tokenUsuarioB}`);

        expect(respostaConsultaReceitaB.status).to.equal(200);
        expect(respostaConsultaReceitaB.body.id).to.equal(receitaUsuarioBId);
      }
    });
  });

  // CT-34: após excluir, consultar deve retornar 404.
  it('CT-34: deve retornar 404 ao consultar receita excluida', async () => {
    // Exclui uma receita válida.
    const respostaExclusao = await request(app)
      .delete(`/api/recipes/${receitaUsuarioAId}`)
      .set('Authorization', `Bearer ${tokenUsuarioA}`);

    expect(fixtureResposta.sucesso.statusAceitos).to.include(respostaExclusao.status);

    // Consulta a mesma receita para confirmar que sumiu.
    const respostaConsultaAposExclusao = await request(app).get(`/api/recipes/${receitaUsuarioAId}`);

    expect(respostaConsultaAposExclusao.status).to.equal(fixtureResposta.receitaNaoAcessivelAposExclusao.statusEsperado);
    expect(respostaConsultaAposExclusao.body).to.deep.equal({
      error: {
        code: fixtureResposta.receitaNaoAcessivelAposExclusao.codigoErroEsperado,
        message: fixtureResposta.receitaNaoAcessivelAposExclusao.mensagemErroEsperada
      }
    });
  });
});
