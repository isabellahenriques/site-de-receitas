// Este arquivo descreve as respostas esperadas para os cenarios da US-08.
// Cada objeto representa uma regra de negocio validada pelos testes de visibilidade.

module.exports = {
  // Resultado esperado do CT-35: listagem publica deve retornar 200.
  listagemPublica: {
    statusEsperado: 200
  },

  // Resultado esperado do CT-36: usuario autenticado sem permissao para receita privada alheia.
  acessoNegadoReceitaPrivadaOutroUsuario: {
    statusEsperado: 403,
    codigoErroEsperado: 'FORBIDDEN',
    mensagemErroEsperada: 'Você não tem permissão para visualizar esta receita.'
  },

  // Resultado esperado do CT-37: visitante sem token tentando acessar receita privada.
  acessoPrivadoSemAutenticacao: {
    statusEsperado: 401,
    codigoErroEsperado: 'UNAUTHORIZED',
    mensagemErroEsperada: 'É necessário autenticação para acessar receita privada.'
  },

  // Resultado esperado do CT-38: endpoint de minhas receitas retorna sucesso.
  listagemMinhasReceitas: {
    statusEsperado: 200
  }
};
