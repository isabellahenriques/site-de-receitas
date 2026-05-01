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

// Importa os dados de entrada (massa de requisição) da US-06.
const fixtureRequisicao = require('../../fixtures/recipes/edit-recipe-requests.fixture');

// Importa os dados esperados de saída (status e mensagens) da US-06.
const fixtureResposta = require('../../fixtures/recipes/edit-recipe-responses.fixture');

// Agrupa todos os testes da US-06 — Edição de receita.
describe('US-06 - Edicao de receita (PUT /api/recipes/:id)', () => {
  let usuarioAId;
  let usuarioBId;
  let tokenUsuarioA;
  let tokenUsuarioB;
  let receitaUsuarioAId;
  let receitaUsuarioBId;

  // beforeEach:
  // 1. Limpa o banco de usuários e receitas em memória.
  // 2. Cria o usuário A e faz login para obter token.
  // 3. Cria o usuário B e faz login para obter token.
  // 4. Cria uma receita para o usuário A e outra para o usuário B.
  // Esse preparo garante cenário previsível e independente para cada caso de teste.
  beforeEach(async () => {
    resetUsers();
    resetRecipes();

    // Gera e-mails únicos por cenário para evitar colisões de token em execuções completas da suíte.
    const sufixoUnico = Date.now();
    const usuarioAComEmailUnico = {
      ...fixtureRequisicao.usuarioAValido,
      email: `usuario.a+us06-${sufixoUnico}@email.com`
    };
    const loginUsuarioAComEmailUnico = {
      ...fixtureRequisicao.loginUsuarioAValido,
      email: usuarioAComEmailUnico.email
    };
    const usuarioBComEmailUnico = {
      ...fixtureRequisicao.usuarioBValido,
      email: `usuario.b+us06-${sufixoUnico}@email.com`
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
      .send(fixtureRequisicao.receitaOriginalUsuarioA);
    receitaUsuarioAId = respostaCriacaoReceitaUsuarioA.body.id;

    const respostaCriacaoReceitaUsuarioB = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${tokenUsuarioB}`)
      .send(fixtureRequisicao.receitaOriginalUsuarioB);
    receitaUsuarioBId = respostaCriacaoReceitaUsuarioB.body.id;
  });

  // CT-25: Cenário positivo da edição.
  // Mesmo sendo apenas um caso, o Data-Driven Testing foi aplicado em array para manter
  // um padrão único com os demais cenários e facilitar expansão futura sem reestruturar o teste.
  const casosSucessoEdicao = [
    {
      idCaso: 'CT-25',
      descricao: 'da propria receita com dados validos',
      obterIdReceitaAlvo: ({ idReceitaA }) => idReceitaA,
      token: ({ tokenA }) => tokenA,
      payload: fixtureRequisicao.receitaAtualizadaValida,
      respostaEsperada: fixtureResposta.sucesso
    }
  ];

  casosSucessoEdicao.forEach(({ idCaso, descricao, obterIdReceitaAlvo, token, payload, respostaEsperada }) => {
    it(`${idCaso}: deve editar receita com sucesso ${descricao}`, async () => {
      // Define o ID da receita que será editada no cenário atual.
      const idReceitaAlvo = obterIdReceitaAlvo({
        idReceitaA: receitaUsuarioAId,
        idReceitaB: receitaUsuarioBId
      });

      // Envia a requisição autenticada de edição com os dados atualizados.
      const response = await request(app)
        .put(`/api/recipes/${idReceitaAlvo}`)
        .set('Authorization', `Bearer ${token({ tokenA: tokenUsuarioA, tokenB: tokenUsuarioB })}`)
        .send(payload);

      // Verifica se o status HTTP retornado é 200 (requisição processada com sucesso).
      expect(response.status).to.equal(respostaEsperada.statusEsperado);

      // Verifica se o corpo contém todos os campos principais esperados após a edição.
      respostaEsperada.camposEsperados.forEach((campo) => {
        expect(response.body).to.have.property(campo);
      });

      // Verifica se os dados retornados batem com os dados enviados no body de atualização.
      expect(response.body.id).to.equal(idReceitaAlvo);
      expect(response.body.title).to.equal(payload.title);
      expect(response.body.ingredients).to.equal(payload.ingredients);
      expect(response.body.instructions).to.equal(payload.instructions);
      expect(response.body.visibility).to.equal(payload.visibility);

      // Verifica se os dados do autor permanecem vinculados ao usuário dono da receita.
      expect(response.body.author).to.be.an('object');
      respostaEsperada.camposEsperadosAuthor.forEach((campo) => {
        expect(response.body.author).to.have.property(campo);
      });
      expect(response.body.author.id).to.equal(usuarioAId);
    });
  });

  // CT-26, CT-27, CT-28 e CT-29: Cenários negativos da edição de receita.
  // Data-Driven Testing foi aplicado porque todos os casos compartilham a mesma lógica base:
  // montar requisição PUT e validar status/código/mensagem de erro, mudando token, id e payload.
  const casosErroEdicao = [
    {
      idCaso: 'CT-26',
      descricao: 'ao tentar editar receita de outro usuario',
      obterIdReceitaAlvo: ({ idReceitaB }) => idReceitaB,
      montarHeaderAutorizacao: ({ tokenA }) => `Bearer ${tokenA}`,
      payload: fixtureRequisicao.receitaAtualizadaValida,
      respostaEsperada: fixtureResposta.editarReceitaDeOutroUsuario
    },
    {
      idCaso: 'CT-27',
      descricao: 'ao informar id inexistente',
      obterIdReceitaAlvo: () => fixtureRequisicao.idReceitaInexistente,
      montarHeaderAutorizacao: ({ tokenA }) => `Bearer ${tokenA}`,
      payload: fixtureRequisicao.receitaAtualizadaValida,
      respostaEsperada: fixtureResposta.receitaNaoEncontrada
    },
    {
      idCaso: 'CT-28',
      descricao: 'ao chamar endpoint sem token',
      obterIdReceitaAlvo: ({ idReceitaA }) => idReceitaA,
      montarHeaderAutorizacao: () => null,
      payload: fixtureRequisicao.receitaAtualizadaValida,
      respostaEsperada: fixtureResposta.tokenObrigatorio
    },
    {
      idCaso: 'CT-29',
      descricao: 'ao enviar body sem o campo obrigatorio "title"',
      obterIdReceitaAlvo: ({ idReceitaA }) => idReceitaA,
      montarHeaderAutorizacao: ({ tokenA }) => `Bearer ${tokenA}`,
      payload: fixtureRequisicao.receitaSemTitle,
      respostaEsperada: fixtureResposta.campoObrigatorioAusente
    }
  ];

  casosErroEdicao.forEach(({ idCaso, descricao, obterIdReceitaAlvo, montarHeaderAutorizacao, payload, respostaEsperada }) => {
    it(`${idCaso}: deve retornar erro ${descricao}`, async () => {
      // Define o ID alvo da edição conforme regra do cenário atual.
      const idReceitaAlvo = obterIdReceitaAlvo({
        idReceitaA: receitaUsuarioAId,
        idReceitaB: receitaUsuarioBId
      });

      // Monta a requisição base para o endpoint de edição.
      let requisicao = request(app)
        .put(`/api/recipes/${idReceitaAlvo}`)
        .send(payload);

      // Aplica o header Authorization apenas quando o cenário exige token.
      const headerAutorizacao = montarHeaderAutorizacao({
        tokenA: tokenUsuarioA,
        tokenB: tokenUsuarioB
      });
      if (headerAutorizacao) {
        requisicao = requisicao.set('Authorization', headerAutorizacao);
      }

      // Executa a requisição do cenário atual.
      const response = await requisicao;

      // Verifica se o status HTTP retornado é o esperado para o erro validado.
      expect(response.status).to.equal(respostaEsperada.statusEsperado);

      // Verifica se o corpo retorna o padrão de erro com código e mensagem esperados.
      expect(response.body).to.deep.equal({
        error: {
          code: respostaEsperada.codigoErroEsperado,
          message: respostaEsperada.mensagemErroEsperada
        }
      });

      // Validação adicional do CT-26:
      // confirma que a receita do usuário B não foi alterada após tentativa indevida do usuário A.
      if (idCaso === 'CT-26') {
        const respostaConsultaReceitaB = await request(app)
          .get(`/api/recipes/${receitaUsuarioBId}`)
          .set('Authorization', `Bearer ${tokenUsuarioB}`);

        expect(respostaConsultaReceitaB.status).to.equal(200);
        expect(respostaConsultaReceitaB.body.title).to.equal(fixtureRequisicao.receitaOriginalUsuarioB.title);
      }
    });
  });
});
