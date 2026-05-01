// Este arquivo contém os resultados esperados da API para os cenários da US-06 (Edição de receita).
// Cada bloco representa o comportamento esperado para um status HTTP em linguagem simples.

module.exports = {

  // Resultado esperado do CT-25.
  // HTTP 200 significa que a receita foi editada com sucesso e o corpo volta com os dados atualizados.
  sucesso: {
    statusEsperado: 200,

    // Campos obrigatórios que devem existir no corpo da resposta de edição.
    camposEsperados: ['id', 'title', 'ingredients', 'instructions', 'visibility', 'author'],

    // Campos obrigatórios dentro do objeto author para garantir que o dono da receita foi preservado.
    camposEsperadosAuthor: ['id', 'name']
  },

  // Resultado esperado do CT-26.
  // HTTP 403 significa que o usuário autenticado tentou editar uma receita que não pertence a ele.
  editarReceitaDeOutroUsuario: {
    statusEsperado: 403,
    codigoErroEsperado: 'FORBIDDEN',
    mensagemErroEsperada: 'Você não tem permissão para editar esta receita.'
  },

  // Resultado esperado do CT-27.
  // HTTP 404 significa que o ID informado não corresponde a nenhuma receita cadastrada.
  receitaNaoEncontrada: {
    statusEsperado: 404,
    codigoErroEsperado: 'NOT_FOUND',
    mensagemErroEsperada: 'Receita não encontrada.'
  },

  // Resultado esperado do CT-28.
  // HTTP 401 significa que o endpoint protegido foi chamado sem token de autenticação.
  tokenObrigatorio: {
    statusEsperado: 401,
    codigoErroEsperado: 'UNAUTHORIZED',
    mensagemErroEsperada: 'Token de autenticação não informado.'
  },

  // Resultado esperado do CT-29.
  // HTTP 400 significa que o body está inválido por ausência de campo obrigatório.
  campoObrigatorioAusente: {
    statusEsperado: 400,
    codigoErroEsperado: 'VALIDATION_ERROR',
    mensagemErroEsperada: 'Título, ingredientes, modo de preparo e visibilidade são obrigatórios.'
  }
};
