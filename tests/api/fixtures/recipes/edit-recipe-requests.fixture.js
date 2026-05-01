// Fixture de entrada da US-06.
// Aqui ficam os dados enviados nos testes de edição de receita.

module.exports = {

  // Dados do usuário A criados no beforeEach.
  // Esse usuário representa quem está autenticado na maioria dos cenários da edição.
  usuarioAValido: {
    name: 'Usuario A',
    email: 'usuario.a@email.com',
    password: '12345678'
  },

  // Credenciais de login do usuário A usadas para gerar o token JWT.
  // O token de A é usado no CT-25, CT-27 e CT-29.
  loginUsuarioAValido: {
    email: 'usuario.a@email.com',
    password: '12345678'
  },

  // Dados do usuário B criados no beforeEach com e-mail diferente.
  // Esse usuário existe para validar o cenário de autorização do CT-26.
  usuarioBValido: {
    name: 'Usuario B',
    email: 'usuario.b@email.com',
    password: '12345678'
  },

  // Credenciais de login do usuário B usadas para gerar seu token no beforeEach.
  // O token de B é usado para criar receita de outro dono antes da tentativa indevida do CT-26.
  loginUsuarioBValido: {
    email: 'usuario.b@email.com',
    password: '12345678'
  },

  // Dados válidos de criação da receita do usuário A.
  // Essa receita é criada no beforeEach para ser editada com sucesso no CT-25 e também no CT-29.
  receitaOriginalUsuarioA: {
    title: 'Bolo de cenoura original',
    ingredients: '2 cenouras, 2 ovos, farinha',
    instructions: 'Misturar tudo e assar',
    visibility: 'private'
  },

  // Dados válidos de criação da receita do usuário B.
  // Essa receita é criada no beforeEach para validar tentativa de edição de outro usuário no CT-26.
  receitaOriginalUsuarioB: {
    title: 'Receita exclusiva do usuario B',
    ingredients: 'ingredientes do usuario B',
    instructions: 'modo de preparo do usuario B',
    visibility: 'public'
  },

  // Body com dados válidos de edição.
  // Usado no CT-25 para validar atualização com sucesso e nos CT-26, CT-27 e CT-28 para validar erros de autorização/autenticação/ID.
  receitaAtualizadaValida: {
    title: 'Bolo de cenoura com cobertura',
    ingredients: '3 cenouras, 3 ovos, chocolate',
    instructions: 'Bater, assar e cobrir com chocolate',
    visibility: 'public'
  },

  // Body sem o campo "title".
  // Usado no CT-29 para validar comportamento quando campo obrigatório não é enviado.
  receitaSemTitle: {
    ingredients: '3 cenouras',
    instructions: 'Bater e assar',
    visibility: 'public'
  },

  // ID inexistente usado no CT-27 para validar resposta de receita não encontrada.
  idReceitaInexistente: '999999'
};
