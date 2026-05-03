// Fixture de entrada da US-03.
// Aqui ficam os dados enviados nos testes de logout.

module.exports = {

  // Dados de um usuário válido usados no beforeEach dos CT-13, CT-14 e CT-15.
  // Esses dados existem para garantir que sempre teremos um usuário real para autenticar.
  usuarioValido: {
    name: 'Isabella Henriques',
    email: 'isabella@email.com',
    password: '12345678'
  },

  // Credenciais de login usadas no beforeEach para gerar um token JWT válido.
  // O token gerado é necessário para validar o comportamento do endpoint de logout.
  loginValido: {
    email: 'isabella@email.com',
    password: '12345678'
  },

  // Cabeçalho sem token para o CT-14.
  // Esse caso valida a regra de negócio que exige autenticação no logout.
  semTokenNoHeader: {}

};
