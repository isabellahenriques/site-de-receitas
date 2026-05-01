// Fixture de saída da US-04.
// Aqui ficam os resultados esperados para cada cenário.

module.exports = {

  // Resultado esperado do CT-16.
  // HTTP 204 significa que a conta foi excluída com sucesso e não há corpo de resposta.
  sucesso: {
    statusEsperado: 204
  },

  // Resultado esperado do CT-17.
  // HTTP 403 significa que o usuário autenticado tentou excluir uma conta que não pertence a ele.
  excluirOutroUsuario: {
    statusEsperado: 403,
    codigoErroEsperado: 'FORBIDDEN',
    mensagemErroEsperada: 'Você só pode excluir a própria conta.'
  },

  // Resultado esperado do CT-18.
  // HTTP 404 significa que o ID informado não corresponde a nenhum usuário cadastrado.
  usuarioNaoEncontrado: {
    statusEsperado: 404,
    codigoErroEsperado: 'NOT_FOUND',
    mensagemErroEsperada: 'Usuário não encontrado.'
  },

  // Resultado esperado do CT-19.
  // HTTP 401 significa que o endpoint protegido foi chamado sem token de autenticação.
  tokenObrigatorio: {
    statusEsperado: 401,
    codigoErroEsperado: 'UNAUTHORIZED',
    mensagemErroEsperada: 'Token de autenticação não informado.'
  },

  // Resultado usado como apoio no CT-16 para validar que o usuário removido não consegue mais logar.
  // HTTP 401 no login indica que as credenciais não são mais aceitas porque a conta não existe.
  loginAposExclusao: {
    statusEsperado: 401,
    codigoErroEsperado: 'UNAUTHORIZED',
    mensagemErroEsperada: 'E-mail ou senha inválidos.'
  },

  // Resultado usado como apoio no CT-16 para validar que o token antigo do usuário removido não funciona.
  // HTTP 401 indica que o token se tornou inválido após a conta deixar de existir.
  tokenInvalidadoAposExclusao: {
    statusEsperado: 401,
    codigoErroEsperado: 'UNAUTHORIZED',
    mensagemErroEsperada: 'Token inválido ou expirado.'
  }
};
