// Fixture com as validacoes esperadas de resposta para os cenarios da US-01.
// Mantem regras de negocio e contratos em um ponto unico para data-driven testing.
module.exports = {
  sucesso: {
    statusEsperado: 201,
    camposEsperados: ['id', 'name', 'email'],
    camposNaoPermitidos: ['password', 'passwordHash']
  },
  emailDuplicado: {
    statusEsperado: 409,
    codigoErroEsperado: 'CONFLICT',
    mensagemErroEsperada: 'O e-mail informado já está em uso.'
  },
  campoObrigatorioAusente: {
    statusEsperado: 400,
    codigoErroEsperado: 'VALIDATION_ERROR',
    mensagemErroEsperada: 'Nome, e-mail e senha são obrigatórios.'
  },
  senhaCurta: {
    statusEsperado: 400,
    codigoErroEsperado: 'VALIDATION_ERROR',
    mensagemErroEsperada: 'A senha deve ter no mínimo 8 caracteres.'
  },
  corpoVazio: {
    statusEsperado: 400,
    codigoErroEsperado: 'VALIDATION_ERROR',
    mensagemErroEsperada: 'Nome, e-mail e senha são obrigatórios.'
  }
};
