// Este arquivo descreve as respostas esperadas para os cenarios da US-11.
// Cada objeto representa uma regra de negocio validada no endpoint GET /api/recipes/:id.

module.exports = {
  // Campos obrigatorios do detalhamento conforme schema RecipeResponse do Swagger.
  camposObrigatoriosDetalheReceita: ['id', 'title', 'ingredients', 'instructions', 'visibility', 'author'],

  // Campos obrigatorios do objeto author no detalhamento da receita.
  camposObrigatoriosAutor: ['id', 'name'],

  // Resultado esperado para sucesso no detalhamento da receita.
  detalheReceitaComSucesso: {
    statusEsperado: 200
  },

  // Resultado esperado para tentativa com ID inexistente.
  receitaNaoEncontrada: {
    statusEsperado: 404,
    codigoErroEsperado: 'NOT_FOUND',
    mensagemErroEsperada: 'Receita não encontrada.'
  },

  // Regras de cada caso de teste da US-11 usadas no fluxo Data-Driven.
  cenarios: {
    CT46: {
      descricao: 'visualizacao de receita publica com sucesso',
      tipoReceita: 'publica',
      enviarToken: false,
      respostaEsperada: 'detalheReceitaComSucesso'
    },
    CT47: {
      descricao: 'visualizacao de receita inexistente',
      tipoReceita: 'inexistente',
      enviarToken: false,
      respostaEsperada: 'receitaNaoEncontrada'
    },
    CT48: {
      descricao: 'visualizacao de receita publica sem autenticacao',
      tipoReceita: 'publica',
      enviarToken: false,
      respostaEsperada: 'detalheReceitaComSucesso'
    },
    CT49: {
      descricao: 'visualizacao de receita privada pelo proprio dono',
      tipoReceita: 'privada',
      enviarToken: true,
      tokenOrigem: 'dono',
      respostaEsperada: 'detalheReceitaComSucesso'
    }
  }
};
