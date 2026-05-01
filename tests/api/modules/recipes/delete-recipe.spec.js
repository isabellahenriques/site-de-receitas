// Bibliotecas de teste:
// - supertest: permite enviar requisicoes HTTP para a aplicacao sem cliente externo.
// - chai: fornece assercoes para validar status, payload e regras de negocio.
const request = require('supertest');
const { expect } = require('chai');

// Importa a app Express para executar os testes de API de forma integrada.
const app = require('../../../../src/app');

// Importa resets dos bancos em memoria para isolar cenarios e evitar efeito cascata.
const { resetUsers } = require('../../../../src/models/userModel');
const { resetRecipes } = require('../../../../src/models/recipeModel');

// Importa massa de dados de entrada da US-07.
const fixtureRequisicao = require('../../fixtures/recipes/delete-recipe-requests.fixture');

// Importa resultados esperados (status/corpo de resposta) da US-07.
const fixtureResposta = require('../../fixtures/recipes/delete-recipe-responses.fixture');

// Agrupa os cenarios da US-07 — Exclusao de receita.
describe('US-07 - Exclusao de receita (DELETE /api/recipes/:id)', () => {
  let usuarioAId;
  let usuarioBId;
  let tokenUsuarioA;
  let tokenUsuarioB;
  let receitaUsuarioAId;
  let receitaUsuarioBId;

  // beforeEach:
  // 1. Limpa usuarios e receitas em memoria.
  // 2. Cria usuario A e usuario B.
  // 3. Realiza login de ambos para obter tokens.
  // 4. Cria uma receita para cada usuario.
  // Esse setup deixa os cenarios deterministicos para validar autorizacao e inexistencia.
  beforeEach(async () => {
    resetUsers();
    resetRecipes();

    // Cria um usuario tecnico descartavel para deslocar o proximo ID de usuario.
    // Isso evita colisoes de token com cenarios de logout que podem invalidar tokens de sub=1.
    await request(app)
      .post('/api/users')
      .send({
        name: 'Usuario Tecnico US07',
        email: `usuario.tecnico.us07+${Date.now()}@email.com`,
        password: '12345678'
      });

    // Gera e-mails unicos por execucao para evitar colisao com outros cenarios da suite.
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

  // CT-30: Cenário positivo de exclusao.
  // Mantemos Data-Driven mesmo com um caso para facilitar evolucao sem alterar a estrutura.
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
      // Resolve o ID da receita alvo com base no contexto do cenario.
      const idReceitaAlvo = obterIdReceitaAlvo({
        idReceitaA: receitaUsuarioAId,
        idReceitaB: receitaUsuarioBId
      });

      // Realiza requisicao DELETE autenticada para excluir a receita alvo.
      const respostaExclusao = await request(app)
        .delete(`/api/recipes/${idReceitaAlvo}`)
        .set('Authorization', `Bearer ${token({ tokenA: tokenUsuarioA, tokenB: tokenUsuarioB })}`);

      // Valida status de sucesso aceito pelo cenario (200 ou 204).
      expect(respostaEsperada.statusAceitos).to.include(respostaExclusao.status);

      // Verificacao de regra de negocio: receita nao deve mais existir apos exclusao.
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

  // CT-31, CT-32 e CT-33: Cenarios negativos.
  // Data-Driven aplicado para reaproveitar a mesma estrutura de requisicao e assercao.
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
      // Resolve o ID de receita alvo do cenario atual.
      const idReceitaAlvo = obterIdReceitaAlvo({
        idReceitaA: receitaUsuarioAId,
        idReceitaB: receitaUsuarioBId
      });

      // Monta requisicao base de exclusao.
      let requisicao = request(app).delete(`/api/recipes/${idReceitaAlvo}`);

      // Aplica header Authorization somente quando o cenario exige token.
      const headerAutorizacao = montarHeaderAutorizacao({
        tokenA: tokenUsuarioA,
        tokenB: tokenUsuarioB
      });
      if (headerAutorizacao) {
        requisicao = requisicao.set('Authorization', headerAutorizacao);
      }

      // Executa o cenario e captura resposta.
      const response = await requisicao;

      // Valida status HTTP esperado.
      expect(response.status).to.equal(respostaEsperada.statusEsperado);

      // Valida padrao de erro da API com codigo e mensagem esperados.
      expect(response.body).to.deep.equal({
        error: {
          code: respostaEsperada.codigoErroEsperado,
          message: respostaEsperada.mensagemErroEsperada
        }
      });

      // Validacao extra do CT-31:
      // garante que a receita do usuario B continua existente apos tentativa indevida do usuario A.
      if (idCaso === 'CT-31') {
        const respostaConsultaReceitaB = await request(app)
          .get(`/api/recipes/${receitaUsuarioBId}`)
          .set('Authorization', `Bearer ${tokenUsuarioB}`);

        expect(respostaConsultaReceitaB.status).to.equal(200);
        expect(respostaConsultaReceitaB.body.id).to.equal(receitaUsuarioBId);
      }
    });
  });

  // CT-34: Regra pos-condicao da exclusao.
  // Cenario separado para deixar explicita a validacao de inacessibilidade via GET apos DELETE.
  it('CT-34: deve retornar 404 ao consultar receita excluida', async () => {
    // Exclui uma receita valida do proprio usuario autenticado.
    const respostaExclusao = await request(app)
      .delete(`/api/recipes/${receitaUsuarioAId}`)
      .set('Authorization', `Bearer ${tokenUsuarioA}`);

    expect(fixtureResposta.sucesso.statusAceitos).to.include(respostaExclusao.status);

    // Consulta a mesma receita apos exclusao para comprovar que nao esta mais acessivel.
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
