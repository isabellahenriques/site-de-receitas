// Este arquivo contém os dados de entrada usados nos testes da US-04 (Exclusão de conta).
// A ideia é manter todas as massas de requisição em um único lugar para facilitar manutenção.

module.exports = {

  // Dados do usuário A criados no beforeEach.
  // Esse usuário representa quem está autenticado na maior parte dos cenários.
  usuarioAValido: {
    name: 'Usuario A',
    email: 'usuario.a@email.com',
    password: '12345678'
  },

  // Credenciais de login do usuário A usadas para gerar o token JWT.
  // O token de A é usado no CT-16 (sucesso) e CT-17 (tentativa de excluir outro usuário).
  loginUsuarioAValido: {
    email: 'usuario.a@email.com',
    password: '12345678'
  },

  // Dados do usuário B criados no beforeEach com e-mail diferente.
  // Esse usuário existe para validar o cenário de autorização (CT-17).
  usuarioBValido: {
    name: 'Usuario B',
    email: 'usuario.b@email.com',
    password: '12345678'
  },

  // Credenciais de login do usuário B usadas para gerar seu token no beforeEach.
  // O token de B ajuda a confirmar que a conta dele continua acessível após CT-17.
  loginUsuarioBValido: {
    email: 'usuario.b@email.com',
    password: '12345678'
  },

  // Dados da receita do usuário A usados no CT-16.
  // Essa receita existe para comprovar que receitas associadas também são excluídas.
  receitaPublicaUsuarioA: {
    title: 'Bolo de laranja da US-04',
    ingredients: 'Farinha, ovos, laranja e açucar',
    instructions: 'Misturar ingredientes, assar e servir.',
    visibility: 'public'
  },

  // ID inexistente usado no CT-18 para validar o retorno de usuário não encontrado.
  idInexistente: '999999'
};
