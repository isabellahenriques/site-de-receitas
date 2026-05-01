// Bibliotecas de teste:
// - supertest: permite fazer requisições HTTP para a API sem depender de ferramentas externas.
// - chai: fornece validações para garantir que o comportamento retornado é o esperado.
const request = require('supertest');
const { expect } = require('chai');

// Importa a aplicação Express para o supertest enviar requisições diretamente para os endpoints.
const app = require('../../../../src/app');

// Importa funções de reset dos bancos em memória para garantir isolamento entre os testes.
// Como os dados ficam em arrays na memória, cada cenário deve começar com ambiente limpo.
const { resetUsers } = require('../../../../src/models/userModel');
const { resetRecipes } = require('../../../../src/models/recipeModel');

// Importa os dados de entrada (massa de requisição) da US-04.
const fixtureRequisicao = require('../../fixtures/users/delete-user-requests.fixture');

// Importa os dados esperados de saída (status e mensagens) da US-04.
const fixtureResposta = require('../../fixtures/users/delete-user-responses.fixture');

// Agrupa todos os testes da US-04 — Exclusão de conta.
describe('US-04 - Exclusao de conta (DELETE /api/users/:id)', () => {
  let usuarioAId;
  let usuarioBId;
  let tokenUsuarioA;
  let tokenUsuarioB;

  // beforeEach:
  // 1. Limpa o banco de usuários (resetUsers) e também dados de receita em memória.
  // 2. Cria o usuário A via POST /api/users.
  // 3. Faz login do usuário A via POST /api/auth/login e guarda o token.
  // 4. Cria o usuário B via POST /api/users com e-mail diferente.
  // 5. Faz login do usuário B via POST /api/auth/login e guarda o token.
  // Esse preparo cria um cenário previsível para todos os casos, sem dependência entre testes.
  beforeEach(async () => {
    resetUsers();
    resetRecipes();

    const respostaCriacaoUsuarioA = await request(app)
      .post('/api/users')
      .send(fixtureRequisicao.usuarioAValido);

    usuarioAId = respostaCriacaoUsuarioA.body.id;

    const respostaLoginUsuarioA = await request(app)
      .post('/api/auth/login')
      .send(fixtureRequisicao.loginUsuarioAValido);

    tokenUsuarioA = respostaLoginUsuarioA.body.token;

    const respostaCriacaoUsuarioB = await request(app)
      .post('/api/users')
      .send(fixtureRequisicao.usuarioBValido);

    usuarioBId = respostaCriacaoUsuarioB.body.id;

    const respostaLoginUsuarioB = await request(app)
      .post('/api/auth/login')
      .send(fixtureRequisicao.loginUsuarioBValido);

    tokenUsuarioB = respostaLoginUsuarioB.body.token;
  });

  // CT-16: Cenário positivo — exclusão da própria conta com token válido.
  it('CT-16: deve excluir a propria conta com sucesso e remover receitas associadas', async () => {
    // Cria uma receita pública para o usuário A antes da exclusão da conta.
    // Isso permite validar a regra de negócio de remoção das receitas associadas.
    const respostaCriacaoReceita = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenUsuarioA}`)
      .send(fixtureRequisicao.receitaPublicaUsuarioA);

    const receitaCriadaId = respostaCriacaoReceita.body.id;

    // Executa a exclusão da conta do próprio usuário autenticado.
    const respostaExclusao = await request(app)
      .delete(`/api/users/${usuarioAId}`)
      .set('Authorization', `Bearer ${tokenUsuarioA}`);

    // Verifica o status de sucesso esperado para exclusão.
    expect(respostaExclusao.status).to.equal(fixtureResposta.sucesso.statusEsperado);

    // Verifica que a conta foi removida:
    // após a exclusão, o login com as credenciais do usuário A deve falhar.
    const respostaLoginAposExclusao = await request(app)
      .post('/api/auth/login')
      .send(fixtureRequisicao.loginUsuarioAValido);

    expect(respostaLoginAposExclusao.status).to.equal(fixtureResposta.loginAposExclusao.statusEsperado);
    expect(respostaLoginAposExclusao.body).to.deep.equal({
      error: {
        code: fixtureResposta.loginAposExclusao.codigoErroEsperado,
        message: fixtureResposta.loginAposExclusao.mensagemErroEsperada
      }
    });

    // Verifica que o token antigo do usuário excluído deixou de ser aceito.
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

    // Verifica que a receita associada foi removida:
    // após a exclusão do usuário, a receita não deve mais ser encontrada.
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

  // CT-17, CT-18 e CT-19: Cenários negativos da exclusão de conta.
  // Data-Driven Testing é usado para agrupar casos com a mesma lógica base
  // (montar requisição DELETE e validar status/corpo), mudando apenas token e id alvo.
  const casosErroExclusao = [
    {
      idCaso: 'CT-17',
      descricao: 'ao tentar excluir a conta de outro usuario',
      // No CT-17, o usuário A tenta excluir o usuário B e deve receber 403.
      obterIdAlvo: ({ usuarioB }) => usuarioB,
      montarHeaderAutorizacao: ({ tokenA }) => `Bearer ${tokenA}`,
      respostaEsperada: fixtureResposta.excluirOutroUsuario
    },
    {
      idCaso: 'CT-18',
      descricao: 'ao informar um id inexistente',
      // No CT-18, usamos um id que nao existe para validar retorno 404.
      obterIdAlvo: () => fixtureRequisicao.idInexistente,
      montarHeaderAutorizacao: ({ tokenA }) => `Bearer ${tokenA}`,
      respostaEsperada: fixtureResposta.usuarioNaoEncontrado
    },
    {
      idCaso: 'CT-19',
      descricao: 'ao chamar o endpoint sem token no header',
      // No CT-19, não enviamos o header Authorization para validar autenticação obrigatória.
      obterIdAlvo: ({ usuarioA }) => usuarioA,
      montarHeaderAutorizacao: () => null,
      respostaEsperada: fixtureResposta.tokenObrigatorio
    }
  ];

  casosErroExclusao.forEach(({ idCaso, descricao, obterIdAlvo, montarHeaderAutorizacao, respostaEsperada }) => {
    it(`${idCaso}: deve retornar erro ${descricao}`, async () => {
      // Define o id de usuário alvo do cenário atual.
      const idAlvo = obterIdAlvo({
        usuarioA: usuarioAId,
        usuarioB: usuarioBId
      });

      // Monta a requisição base de exclusão para o usuário alvo.
      let requisicao = request(app).delete(`/api/users/${idAlvo}`);

      // Aplica o header de autorização apenas quando o caso exige token.
      const headerAutorizacao = montarHeaderAutorizacao({
        tokenA: tokenUsuarioA,
        tokenB: tokenUsuarioB
      });

      if (headerAutorizacao) {
        requisicao = requisicao.set('Authorization', headerAutorizacao);
      }

      // Executa a requisição do cenário atual.
      const response = await requisicao;

      // Valida o status HTTP esperado para o caso.
      expect(response.status).to.equal(respostaEsperada.statusEsperado);

      // Valida o corpo de erro padronizado retornado pela API.
      expect(response.body).to.deep.equal({
        error: {
          code: respostaEsperada.codigoErroEsperado,
          message: respostaEsperada.mensagemErroEsperada
        }
      });

      // Validação adicional do CT-17:
      // confirma que o usuário B continua existindo porque a exclusão indevida foi bloqueada.
      if (idCaso === 'CT-17') {
        const loginUsuarioBPosTentativa = await request(app)
          .post('/api/auth/login')
          .send(fixtureRequisicao.loginUsuarioBValido);

        expect(loginUsuarioBPosTentativa.status).to.equal(200);
      }
    });
  });
});
