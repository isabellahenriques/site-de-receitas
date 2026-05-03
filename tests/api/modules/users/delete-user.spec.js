// Ferramentas do teste:
// - supertest: chama a API.
// - chai: verifica o resultado.
const request = require('supertest');
const { expect } = require('chai');

// API que será testada.
const app = require('../../../../src/app');

// Limpa dados de usuários e receitas antes de cada cenário.
const { resetUsers } = require('../../../../src/models/userModel');
const { resetRecipes } = require('../../../../src/models/recipeModel');

// Dados de entrada dos testes.
const fixtureRequisicao = require('../../fixtures/users/delete-user-requests.fixture');

// Resultados esperados em cada caso.
const fixtureResposta = require('../../fixtures/users/delete-user-responses.fixture');

function gerarEmailUnico(prefixo) {
  return `${prefixo}+${Date.now()}-${Math.floor(Math.random() * 100000)}@email.com`;
}

// Testes da US-04 (exclusão de conta).
describe('US-04 - Exclusao de conta (DELETE /api/users/:id)', () => {
  let usuarioAId;
  let usuarioBId;
  let tokenUsuarioA;
  let tokenUsuarioB;
  let loginUsuarioAValido;
  let loginUsuarioBValido;

  // Preparo de cada caso: cria dois usuários e faz login nos dois.
  beforeEach(async () => {
    resetUsers();
    resetRecipes();

    const emailUsuarioA = gerarEmailUnico('usuario.a.us04');
    const emailUsuarioB = gerarEmailUnico('usuario.b.us04');
    const usuarioAValido = {
      ...fixtureRequisicao.usuarioAValido,
      email: emailUsuarioA
    };
    loginUsuarioAValido = {
      ...fixtureRequisicao.loginUsuarioAValido,
      email: emailUsuarioA
    };
    const usuarioBValido = {
      ...fixtureRequisicao.usuarioBValido,
      email: emailUsuarioB
    };
    loginUsuarioBValido = {
      ...fixtureRequisicao.loginUsuarioBValido,
      email: emailUsuarioB
    };

    const respostaCriacaoUsuarioA = await request(app)
      .post('/api/users')
      .send(usuarioAValido);

    usuarioAId = respostaCriacaoUsuarioA.body.id;

    const respostaLoginUsuarioA = await request(app)
      .post('/api/auth/login')
      .send(loginUsuarioAValido);

    tokenUsuarioA = respostaLoginUsuarioA.body.token;

    const respostaCriacaoUsuarioB = await request(app)
      .post('/api/users')
      .send(usuarioBValido);

    usuarioBId = respostaCriacaoUsuarioB.body.id;

    const respostaLoginUsuarioB = await request(app)
      .post('/api/auth/login')
      .send(loginUsuarioBValido);

    tokenUsuarioB = respostaLoginUsuarioB.body.token;
  });

  // CT-16: usuário consegue excluir a própria conta.
  it('CT-16: deve excluir a propria conta com sucesso e remover receitas associadas', async () => {
    // Cria uma receita para confirmar que ela também será removida.
    const respostaCriacaoReceita = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenUsuarioA}`)
      .send(fixtureRequisicao.receitaPublicaUsuarioA);

    const receitaCriadaId = respostaCriacaoReceita.body.id;

    // Exclui a própria conta.
    const respostaExclusao = await request(app)
      .delete(`/api/users/${usuarioAId}`)
      .set('Authorization', `Bearer ${tokenUsuarioA}`);

    // Deve retornar sucesso.
    expect(respostaExclusao.status).to.equal(fixtureResposta.sucesso.statusEsperado);

    // Depois da exclusão, esse usuário não consegue mais fazer login.
    const respostaLoginAposExclusao = await request(app)
      .post('/api/auth/login')
      .send(loginUsuarioAValido);

    expect(respostaLoginAposExclusao.status).to.equal(fixtureResposta.loginAposExclusao.statusEsperado);
    expect(respostaLoginAposExclusao.body).to.deep.equal({
      error: {
        code: fixtureResposta.loginAposExclusao.codigoErroEsperado,
        message: fixtureResposta.loginAposExclusao.mensagemErroEsperada
      }
    });

    // O token antigo também deixa de funcionar.
    const respostaTokenAposExclusao = await request(app)
      .get('/api/recipes/my')
      .set('Authorization', `Bearer ${tokenUsuarioA}`);

    expect(respostaTokenAposExclusao.status).to.equal(fixtureResposta.tokenInvalidadoAposExclusao.statusEsperado);
    expect(respostaTokenAposExclusao.body).to.deep.equal({
      error: {
        code: fixtureResposta.tokenInvalidadoAposExclusao.codigoErroEsperado,
        message: fixtureResposta.tokenInvalidadoAposExclusao.mensagemErroEsperada
      }
    });

    // A receita desse usuário também deve sumir.
    const respostaBuscaReceitaExcluida = await request(app)
      .get(`/api/recipes/${receitaCriadaId}`);

    expect(respostaBuscaReceitaExcluida.status).to.equal(404);
    expect(respostaBuscaReceitaExcluida.body).to.deep.equal({
      error: {
        code: 'NOT_FOUND',
        message: 'Receita não encontrada.'
      }
    });
  });

  // CT-17, CT-18 e CT-19: cenários de erro.
  const casosErroExclusao = [
    {
      idCaso: 'CT-17',
      descricao: 'ao tentar excluir a conta de outro usuario',
      // Usuário A tentando excluir usuário B.
      obterIdAlvo: ({ usuarioB }) => usuarioB,
      montarHeaderAutorizacao: ({ tokenA }) => `Bearer ${tokenA}`,
      respostaEsperada: fixtureResposta.excluirOutroUsuario
    },
    {
      idCaso: 'CT-18',
      descricao: 'ao informar um id inexistente',
      // ID que não existe.
      obterIdAlvo: () => fixtureRequisicao.idInexistente,
      montarHeaderAutorizacao: ({ tokenA }) => `Bearer ${tokenA}`,
      respostaEsperada: fixtureResposta.usuarioNaoEncontrado
    },
    {
      idCaso: 'CT-19',
      descricao: 'ao chamar o endpoint sem token no header',
      // Sem token.
      obterIdAlvo: ({ usuarioA }) => usuarioA,
      montarHeaderAutorizacao: () => null,
      respostaEsperada: fixtureResposta.tokenObrigatorio
    }
  ];

  casosErroExclusao.forEach(({ idCaso, descricao, obterIdAlvo, montarHeaderAutorizacao, respostaEsperada }) => {
    it(`${idCaso}: deve retornar erro ${descricao}`, async () => {
      // Escolhe o ID do cenário.
      const idAlvo = obterIdAlvo({
        usuarioA: usuarioAId,
        usuarioB: usuarioBId
      });

      // Monta a chamada de exclusão.
      let requisicao = request(app).delete(`/api/users/${idAlvo}`);

      // Só envia token quando o caso pede.
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

      // No CT-17, confirma que o usuário B continua ativo.
      if (idCaso === 'CT-17') {
        const loginUsuarioBPosTentativa = await request(app)
          .post('/api/auth/login')
          .send(loginUsuarioBValido);

        expect(loginUsuarioBPosTentativa.status).to.equal(200);
      }
    });
  });
});
