// Fixture com os corpos de requisicao usados nos cenarios da US-01.
// Os dados ficam centralizados para facilitar manutencao e reuso em outros testes.
module.exports = {
  usuarioValido: {
    name: 'Isabella Henriques',
    email: 'isabella@email.com',
    password: '12345678'
  },
  nomeAusente: {
    email: 'isabella@email.com',
    password: '12345678'
  },
  emailAusente: {
    name: 'Isabella Henriques',
    password: '12345678'
  },
  senhaAusente: {
    name: 'Isabella Henriques',
    email: 'isabella@email.com'
  },
  senhaCurta: {
    name: 'Isabella Henriques',
    email: 'isabella@email.com',
    password: '123'
  },
  corpoVazio: {}
};
