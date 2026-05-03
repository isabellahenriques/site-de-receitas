// Fixture de entrada da US-07.
// Aqui ficam os dados enviados nos testes de exclusão de receita.

module.exports = {
  // Dados validos do usuario A, dono da receita principal usada nos cenarios de exclusao.
  usuarioAValido: {
    name: 'Usuario A - US07',
    email: 'usuario.a.us07@email.com',
    password: '12345678'
  },

  // Credenciais de login do usuario A para gerar token JWT valido.
  loginUsuarioAValido: {
    email: 'usuario.a.us07@email.com',
    password: '12345678'
  },

  // Dados validos do usuario B, criado para validar regras de autorizacao.
  usuarioBValido: {
    name: 'Usuario B - US07',
    email: 'usuario.b.us07@email.com',
    password: '12345678'
  },

  // Credenciais de login do usuario B para gerar o token desse segundo usuario.
  loginUsuarioBValido: {
    email: 'usuario.b.us07@email.com',
    password: '12345678'
  },

  // Receita criada para o usuario A e usada no CT-30 e CT-34.
  receitaUsuarioAValida: {
    title: 'Lasanha da semana',
    ingredients: 'massa, molho, queijo',
    instructions: 'montar camadas e assar',
    visibility: 'public'
  },

  // Receita criada para o usuario B e usada no CT-31 para tentativa indevida de exclusao.
  receitaUsuarioBValida: {
    title: 'Torta exclusiva do usuario B',
    ingredients: 'farinha, manteiga, recheio',
    instructions: 'misturar, rechear e assar',
    visibility: 'private'
  },

  // ID inexistente para validar retorno 404 no CT-32.
  idReceitaInexistente: '999999'
};
