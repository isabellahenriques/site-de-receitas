// Este arquivo contém os dados que serão enviados no corpo das requisições
// dos testes da US-01 (Cadastro de usuário).
// Centralizar os dados aqui facilita a manutenção: se um valor mudar,
// basta alterar neste arquivo e todos os testes serão atualizados.

module.exports = {

  // Dados completos e válidos de um usuário — usado no CT-01 para testar o cadastro com sucesso.
  usuarioValido: {
    name: 'Isabella Henriques',
    email: 'isabella@email.com',
    password: '12345678'
  },

  // Body sem o campo "name" — usado no CT-03 para testar validação de campo obrigatório ausente.
  nomeAusente: {
    email: 'isabella@email.com',
    password: '12345678'
  },

  // Body sem o campo "email" — usado no CT-04 para testar validação de campo obrigatório ausente.
  emailAusente: {
    name: 'Isabella Henriques',
    password: '12345678'
  },

  // Body sem o campo "password" — usado no CT-05 para testar validação de campo obrigatório ausente.
  senhaAusente: {
    name: 'Isabella Henriques',
    email: 'isabella@email.com'
  },

  // Body com senha de apenas 3 caracteres — usado no CT-06 para testar a regra de senha mínima de 8 caracteres.
  senhaCurta: {
    name: 'Isabella Henriques',
    email: 'isabella@email.com',
    password: '123'
  },

  // Body completamente vazio — usado no CT-07 para testar o comportamento da API sem nenhum dado.
  corpoVazio: {}

};
