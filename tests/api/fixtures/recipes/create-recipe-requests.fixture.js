// Este arquivo contém os dados que serão enviados no corpo das requisições
// dos testes da US-05 (Cadastro de receita).
// Centralizar os dados aqui facilita manutenção: se algo mudar,
// basta atualizar este arquivo e os testes continuam organizados.

module.exports = {

  // Dados válidos da receita pública — usado no CT-20 para validar cadastro com sucesso.
  receitaPublicaValida: {
    title: 'Bolo de cenoura',
    ingredients: '3 cenouras, 3 ovos, 1 xícara de óleo',
    instructions: 'Bater no liquidificador e assar por 40 minutos',
    visibility: 'public'
  },

  // Dados válidos da receita privada — usado no CT-21 para validar visibilidade privada.
  receitaPrivadaValida: {
    title: 'Receita secreta',
    ingredients: 'Ingredientes secretos',
    instructions: 'Modo de preparo secreto',
    visibility: 'private'
  },

  // Body sem o campo "title" — usado no CT-23 para validar campo obrigatório ausente.
  receitaSemTitle: {
    ingredients: '3 cenouras, 3 ovos',
    instructions: 'Bater e assar',
    visibility: 'public'
  },

  // Body com valor inválido em "visibility" — usado no CT-24 para validar enum permitido.
  receitaComVisibilidadeInvalida: {
    title: 'Bolo de cenoura',
    ingredients: '3 cenouras, 3 ovos',
    instructions: 'Bater e assar',
    visibility: 'qualquer'
  },

  // Dados de usuário válido para autenticar e obter token antes de testar o endpoint de receita.
  usuarioValido: {
    name: 'Isabella Henriques',
    email: 'isabella@email.com',
    password: '12345678'
  },

  // Credenciais válidas usadas para login e geração do token JWT.
  loginValido: {
    email: 'isabella@email.com',
    password: '12345678'
  }

};
