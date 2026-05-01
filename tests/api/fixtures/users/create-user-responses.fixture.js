// Este arquivo contém os resultados esperados para cada cenário da US-01 (Cadastro de usuário).
// Cada propriedade representa um grupo de validações que o teste irá verificar na resposta da API.
// Centralizar aqui garante que qualquer mudança no contrato da API seja feita em um único lugar.

module.exports = {

  // Resultado esperado quando o cadastro é feito com sucesso (CT-01).
  sucesso: {
    // A API deve retornar o status HTTP 201 (Criado) indicando que o usuário foi cadastrado.
    statusEsperado: 201,

    // A resposta deve conter esses campos: id gerado, nome e e-mail do usuário cadastrado.
    camposEsperados: ['id', 'name', 'email'],

    // A senha nunca deve aparecer na resposta, nem em formato criptografado.
    camposNaoPermitidos: ['password', 'passwordHash']
  },

  // Resultado esperado quando o e-mail enviado já está cadastrado no sistema (CT-02).
  emailDuplicado: {
    // A API deve retornar o status HTTP 409 (Conflito) indicando que o recurso já existe.
    statusEsperado: 409,

    // Código de erro padronizado retornado no corpo da resposta.
    codigoErroEsperado: 'CONFLICT',

    // Mensagem de erro exibida ao usuário.
    mensagemErroEsperada: 'O e-mail informado já está em uso.'
  },

  // Resultado esperado quando um campo obrigatório não é enviado no body (CT-03, CT-04 e CT-05).
  campoObrigatorioAusente: {
    // A API deve retornar o status HTTP 400 (Requisição inválida).
    statusEsperado: 400,

    // Código de erro padronizado retornado no corpo da resposta.
    codigoErroEsperado: 'VALIDATION_ERROR',

    // Mensagem de erro exibida ao usuário.
    mensagemErroEsperada: 'Nome, e-mail e senha são obrigatórios.'
  },

  // Resultado esperado quando a senha enviada tem menos de 8 caracteres (CT-06).
  senhaCurta: {
    // A API deve retornar o status HTTP 400 (Requisição inválida).
    statusEsperado: 400,

    // Código de erro padronizado retornado no corpo da resposta.
    codigoErroEsperado: 'VALIDATION_ERROR',

    // Mensagem de erro exibida ao usuário.
    mensagemErroEsperada: 'A senha deve ter no mínimo 8 caracteres.'
  },

  // Resultado esperado quando o body enviado está completamente vazio (CT-07).
  corpoVazio: {
    // A API deve retornar o status HTTP 400 (Requisição inválida).
    statusEsperado: 400,

    // Código de erro padronizado retornado no corpo da resposta.
    codigoErroEsperado: 'VALIDATION_ERROR',

    // Mensagem de erro exibida ao usuário.
    mensagemErroEsperada: 'Nome, e-mail e senha são obrigatórios.'
  }

};
