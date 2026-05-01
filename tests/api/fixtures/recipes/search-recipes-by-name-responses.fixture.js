// Este arquivo centraliza as respostas esperadas da US-10.
// Cada entrada descreve o comportamento esperado para cada cenario de busca.

module.exports = {
  // Resultado esperado para os cenarios de sucesso da busca por nome.
  buscaComSucesso: {
    statusEsperado: 200
  },

  // Campos obrigatorios definidos no Swagger para cada item retornado em GET /api/recipes.
  camposObrigatoriosItemListagem: ['id', 'title', 'authorName'],

  // Regras de cada caso de teste da US-10, usadas no fluxo Data-Driven.
  cenarios: {
    CT42: {
      descricao: 'busca de receita com termo valido',
      termoBusca: 'termoValido',
      deveConterReceitaPublica: true,
      deveRetornarListaVazia: false,
      deveOcultarReceitaPrivada: true
    },
    CT43: {
      descricao: 'busca case insensitive',
      termoBusca: 'termoMaiusculo',
      deveConterReceitaPublica: true,
      deveRetornarListaVazia: false,
      deveOcultarReceitaPrivada: true
    },
    CT44: {
      descricao: 'busca sem resultado',
      termoBusca: 'termoSemResultado',
      deveConterReceitaPublica: false,
      deveRetornarListaVazia: true,
      deveOcultarReceitaPrivada: true
    },
    CT45: {
      descricao: 'busca nao retorna receitas privadas',
      termoBusca: 'termoReceitaPrivada',
      deveConterReceitaPublica: false,
      deveRetornarListaVazia: true,
      deveOcultarReceitaPrivada: true
    }
  }
};
