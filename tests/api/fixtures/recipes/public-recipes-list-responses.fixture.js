// Fixture de saída da US-09.
// Aqui ficam os resultados esperados dos cenários de listagem pública.

module.exports = {
  // Resultado esperado de sucesso para os cenarios CT-39, CT-40 e CT-41.
  listagemPublicaComSucesso: {
    statusEsperado: 200
  },

  // Campos obrigatorios definidos no Swagger para cada item de GET /api/recipes.
  camposObrigatoriosItemListagem: ['id', 'title', 'authorName']
};
