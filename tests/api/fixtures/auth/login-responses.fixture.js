// Fixture de saída da US-02.
// Aqui ficam os resultados esperados para cada cenário de login.

module.exports = {

  // Resultado esperado quando o login é feito com sucesso (CT-08).
  sucesso: {
    // A API deve retornar o status HTTP 200 (OK) indicando que o login foi aceito.
    statusEsperado: 200,

    // A resposta deve conter esses dois campos: o token de acesso e o tempo de expiração.
    camposEsperados: ['token', 'expiresIn'],

    // A senha nunca deve aparecer na resposta, nem em formato criptografado.
    camposNaoPermitidos: ['password', 'passwordHash'],

    // O token deve expirar em 24 horas conforme documentado no Swagger.
    expiresInEsperado: '24h'
  },

  // Resultado esperado quando o e-mail não existe ou a senha está errada (CT-09 e CT-10).
  // A mensagem é genérica por segurança — não informa qual campo está errado.
  credenciaisInvalidas: {
    // A API deve retornar o status HTTP 401 (Não autorizado).
    statusEsperado: 401,

    // Código de erro padronizado retornado no corpo da resposta.
    codigoErroEsperado: 'UNAUTHORIZED',

    // Mensagem de erro exibida ao usuário.
    mensagemErroEsperada: 'E-mail ou senha inválidos.'
  },

  // Resultado esperado quando um campo obrigatório não é enviado no body (CT-11 e CT-12).
  campoObrigatorioAusente: {
    // A API deve retornar o status HTTP 400 (Requisição inválida).
    statusEsperado: 400,

    // Código de erro padronizado retornado no corpo da resposta.
    codigoErroEsperado: 'VALIDATION_ERROR',

    // Mensagem de erro exibida ao usuário.
    mensagemErroEsperada: 'E-mail e senha são obrigatórios.'
  }

};
