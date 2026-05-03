// Fixture de entrada da US-08.
// Aqui ficam os dados enviados nos testes de visibilidade.

module.exports = {
  // Dados do usuario A, usado para tentar acessar receita privada de outro usuario (CT-36).
  usuarioAValido: {
    name: 'Usuario A - US08',
    email: 'usuario.a.us08@email.com',
    password: '12345678'
  },

  // Credenciais de login do usuario A para obter token JWT valido.
  loginUsuarioAValido: {
    email: 'usuario.a.us08@email.com',
    password: '12345678'
  },

  // Dados do usuario B, dono das receitas usadas nos cenarios de visibilidade.
  usuarioBValido: {
    name: 'Usuario B - US08',
    email: 'usuario.b.us08@email.com',
    password: '12345678'
  },

  // Credenciais de login do usuario B para obter token JWT valido.
  loginUsuarioBValido: {
    email: 'usuario.b.us08@email.com',
    password: '12345678'
  },

  // Receita privada do usuario B usada para validar bloqueio de acesso (CT-36 e CT-37).
  receitaPrivadaUsuarioB: {
    title: 'Segredo da familia US08',
    ingredients: 'ingredientes confidenciais',
    instructions: 'preparo confidencial',
    visibility: 'private'
  },

  // Receita publica do usuario B usada para compor cenarios de listagem (CT-35 e CT-38).
  receitaPublicaUsuarioB: {
    title: 'Receita aberta US08',
    ingredients: 'farinha, leite, ovos',
    instructions: 'misture e asse',
    visibility: 'public'
  }
};
