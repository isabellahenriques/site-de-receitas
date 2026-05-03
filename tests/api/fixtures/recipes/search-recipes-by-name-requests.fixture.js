// Fixture de entrada da US-10.
// Aqui ficam os dados enviados nos testes de busca por nome.

module.exports = {
  // Usuario autor da receita publica que deve aparecer no resultado da busca.
  usuarioAutorReceitaPublica: {
    name: 'Autor Receita Publica - US10',
    email: 'autor.publico.us10@email.com',
    password: '12345678'
  },

  // Credenciais de login do autor da receita publica.
  loginUsuarioAutorReceitaPublica: {
    email: 'autor.publico.us10@email.com',
    password: '12345678'
  },

  // Usuario autor da receita privada que nao deve aparecer no endpoint publico.
  usuarioAutorReceitaPrivada: {
    name: 'Autor Receita Privada - US10',
    email: 'autor.privado.us10@email.com',
    password: '12345678'
  },

  // Credenciais de login do autor da receita privada.
  loginUsuarioAutorReceitaPrivada: {
    email: 'autor.privado.us10@email.com',
    password: '12345678'
  },

  // Payload base da receita publica usada nos cenarios CT-42 e CT-43.
  receitaPublicaBase: {
    title: 'Bolo de cenoura',
    ingredients: 'cenoura, ovos, farinha, acucar e fermento',
    instructions: 'misture os ingredientes, asse e finalize com cobertura',
    visibility: 'public'
  },

  // Payload base da receita privada usada no cenario CT-45.
  receitaPrivadaBase: {
    title: 'Receita secreta',
    ingredients: 'ingredientes confidenciais',
    instructions: 'modo de preparo confidencial',
    visibility: 'private'
  },

  // Termos de busca usados nos cenarios da US-10.
  termosBusca: {
    termoValido: 'bolo',
    termoMaiusculo: 'BOLO',
    termoSemResultado: 'xyzinexistente',
    termoReceitaPrivada: 'secreta'
  }
};
