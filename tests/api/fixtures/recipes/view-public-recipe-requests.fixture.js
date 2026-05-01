// Fixture de entrada da US-11.
// Aqui ficam os dados enviados nos testes de visualização de receita.

module.exports = {
  // Usuario dono da receita usada nos cenarios de visualizacao.
  usuarioDonoReceita: {
    name: 'Dono Receita - US11',
    email: 'dono.receita.us11@email.com',
    password: '12345678'
  },

  // Credenciais de login do dono da receita.
  loginUsuarioDonoReceita: {
    email: 'dono.receita.us11@email.com',
    password: '12345678'
  },

  // Usuario auxiliar para cenarios que exigem outro contexto autenticado.
  usuarioSecundario: {
    name: 'Usuario Secundario - US11',
    email: 'usuario.secundario.us11@email.com',
    password: '12345678'
  },

  // Credenciais de login do usuario secundario.
  loginUsuarioSecundario: {
    email: 'usuario.secundario.us11@email.com',
    password: '12345678'
  },

  // Payload base da receita publica usada nos CT-46 e CT-48.
  receitaPublicaBase: {
    title: 'Receita publica US11',
    ingredients: 'farinha, acucar, leite e ovos',
    instructions: 'misture os ingredientes e asse por 40 minutos',
    visibility: 'public'
  },

  // Payload base da receita privada usada no CT-49.
  receitaPrivadaBase: {
    title: 'Receita privada US11',
    ingredients: 'ingredientes secretos da familia',
    instructions: 'siga o modo de preparo secreto',
    visibility: 'private'
  },

  // ID inexistente usado para validar o CT-47.
  idReceitaInexistente: '999999'
};
