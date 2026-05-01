// Fixture de entrada da US-02.
// Aqui ficam exemplos do que enviamos para a API nos testes de login.

module.exports = {

  // Dados de um usuário válido usado para criar a conta antes de testar o login.
  // O beforeEach usa esse objeto para garantir que o usuário existe no banco antes de cada teste.
  usuarioValido: {
    name: 'Isabella Henriques',
    email: 'isabella@email.com',
    password: '12345678'
  },

  // Credenciais corretas usadas no CT-08 para testar o login com sucesso.
  loginValido: {
    email: 'isabella@email.com',
    password: '12345678'
  },

  // E-mail que não existe no banco — usado no CT-09 para testar login com e-mail inválido.
  emailNaoCadastrado: {
    email: 'naoexiste@email.com',
    password: '12345678'
  },

  // Senha errada para um e-mail válido — usado no CT-10 para testar login com senha incorreta.
  senhaIncorreta: {
    email: 'isabella@email.com',
    password: 'senhaerrada'
  },

  // Body sem o campo "email" — usado no CT-11 para testar validação de campo obrigatório ausente.
  emailAusente: {
    password: '12345678'
  },

  // Body sem o campo "password" — usado no CT-12 para testar validação de campo obrigatório ausente.
  senhaAusente: {
    email: 'isabella@email.com'
  }

};
