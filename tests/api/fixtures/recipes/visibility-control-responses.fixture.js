// Fixture de saída da US-08.
// Aqui ficam os resultados esperados para cada cenário de visibilidade.

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
