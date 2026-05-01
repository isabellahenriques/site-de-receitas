// Fixture de saída da US-07.
// Aqui ficam os resultados esperados dos cenários de exclusão.

module.exports = {
  // Resultado esperado do CT-30.
  // O Swagger descreve 204 e alguns cenarios podem aceitar 200; por isso usamos ambos como validos.
  sucesso: {
    statusAceitos: [200, 204]
  },

  // Resultado esperado do CT-31.
  // Usuario autenticado nao pode excluir receita que pertence a outro usuario.
  excluirReceitaDeOutroUsuario: {
    statusEsperado: 403,
    codigoErroEsperado: 'FORBIDDEN',
    mensagemErroEsperada: 'Você não tem permissão para excluir esta receita.'
  },

  // Resultado esperado do CT-32.
  // Quando o ID nao existe, a API deve retornar recurso nao encontrado.
  receitaNaoEncontrada: {
    statusEsperado: 404,
    codigoErroEsperado: 'NOT_FOUND',
    mensagemErroEsperada: 'Receita não encontrada.'
  },

  // Resultado esperado do CT-33.
  // Endpoint protegido sem token deve falhar com nao autenticado.
  tokenObrigatorio: {
    statusEsperado: 401,
    codigoErroEsperado: 'UNAUTHORIZED',
    mensagemErroEsperada: 'Token de autenticação não informado.'
  },

  // Resultado esperado do CT-34.
  // Depois de excluir, a receita nao pode mais ser consultada.
  receitaNaoAcessivelAposExclusao: {
    statusEsperado: 404,
    codigoErroEsperado: 'NOT_FOUND',
    mensagemErroEsperada: 'Receita não encontrada.'
  }
};
