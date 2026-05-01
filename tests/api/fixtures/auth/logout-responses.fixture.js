// Este arquivo contém os resultados esperados da API para os cenários da US-03 (Logout de usuário).
// Cada bloco representa um comportamento esperado para um status HTTP específico.

module.exports = {

  // Resultado esperado para o CT-13.
  // HTTP 200 significa que o logout foi processado com sucesso e o token foi invalidado.
  sucesso: {
    statusEsperado: 200,
    mensagemEsperada: 'Logout realizado com sucesso.'
  },

  // Resultado esperado para o CT-14.
  // HTTP 401 significa que a requisição foi negada por falta de autenticação.
  semToken: {
    statusEsperado: 401,
    codigoErroEsperado: 'UNAUTHORIZED',
    mensagemErroEsperada: 'Token de autenticação não informado.'
  },

  // Resultado esperado para o CT-15.
  // HTTP 401 significa que o token informado não pode mais ser usado.
  tokenInvalido: {
    statusEsperado: 401,
    codigoErroEsperado: 'UNAUTHORIZED',
    mensagemErroEsperada: 'Token inválido ou expirado.'
  }

};
