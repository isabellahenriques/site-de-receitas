// Fixture de saída da US-05.
// Aqui ficam os resultados esperados para cada cenário.

module.exports = {

  // Resultado esperado para CT-20 e CT-21.
  // HTTP 201 significa que a receita foi criada com sucesso.
  sucesso: {
    statusEsperado: 201,

    // Campos obrigatórios que devem existir no corpo da resposta de criação.
    camposEsperados: ['id', 'title', 'ingredients', 'instructions', 'visibility', 'author'],

    // Campos obrigatórios dentro do objeto author para garantir associação com usuário autenticado.
    camposEsperadosAuthor: ['id', 'name']
  },

  // Resultado esperado para CT-22.
  // HTTP 401 significa que a requisição foi negada por falta de autenticação.
  semToken: {
    statusEsperado: 401,
    codigoErroEsperado: 'UNAUTHORIZED',
    mensagemErroEsperada: 'Token de autenticação não informado.'
  },

  // Resultado esperado para CT-23.
  // HTTP 400 significa que o body está inválido por ausência de campo obrigatório.
  campoObrigatorioAusente: {
    statusEsperado: 400,
    codigoErroEsperado: 'VALIDATION_ERROR',
    mensagemErroEsperada: 'Título, ingredientes, modo de preparo e visibilidade são obrigatórios.'
  },

  // Resultado esperado para CT-24.
  // HTTP 400 significa que o valor de visibilidade informado não é aceito pela regra de negócio.
  visibilidadeInvalida: {
    statusEsperado: 400,
    codigoErroEsperado: 'VALIDATION_ERROR',
    mensagemErroEsperada: 'O campo visibility deve ser public ou private.'
  }

};
