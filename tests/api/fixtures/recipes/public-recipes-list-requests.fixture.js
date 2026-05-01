// Fixture de entrada da US-09.
// Aqui ficam os dados enviados nos testes de listagem pública.

module.exports = {
  // Usuario autor da receita publica usada para validar retorno da listagem.
  usuarioAutorReceitaPublica: {
    name: 'Autor Receita Publica - US09',
    email: 'autor.publico.us09@email.com',
    password: '12345678'
  },

  // Credenciais de login do autor da receita publica.
  loginUsuarioAutorReceitaPublica: {
    email: 'autor.publico.us09@email.com',
    password: '12345678'
  },

  // Usuario autor da receita privada usada para validar filtro de visibilidade.
  usuarioAutorReceitaPrivada: {
    name: 'Autor Receita Privada - US09',
    email: 'autor.privado.us09@email.com',
    password: '12345678'
  },

  // Credenciais de login do autor da receita privada.
  loginUsuarioAutorReceitaPrivada: {
    email: 'autor.privado.us09@email.com',
    password: '12345678'
  },

  // Receita publica esperada na listagem do endpoint GET /api/recipes.
  receitaPublicaValida: {
    title: 'Brigadeiro tradicional US09',
    ingredients: 'leite condensado, chocolate em po e manteiga',
    instructions: 'misture os ingredientes e cozinhe ate soltar da panela',
    visibility: 'public'
  },

  // Receita privada usada para garantir que nao apareca na listagem publica.
  receitaPrivadaValida: {
    title: 'Caderno secreto US09',
    ingredients: 'ingredientes secretos',
    instructions: 'modo de preparo secreto',
    visibility: 'private'
  }
};
