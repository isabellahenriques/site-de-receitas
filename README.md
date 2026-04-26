# Site de Receitas API

API REST construída com Express para cadastro/autenticação de usuários e gerenciamento de receitas com controle de visibilidade.

## Tecnologias

- Node.js
- Express
- JWT (`jsonwebtoken`)
- Hash de senha com `bcryptjs`
- Swagger UI (`swagger-ui-express`)
- Banco em memória (arrays em `models`)

## Estrutura em camadas

- `src/routes`: mapeamento dos endpoints
- `src/controllers`: entrada/saída HTTP
- `src/services`: regras de negócio
- `src/models`: persistência em memória
- `src/middlewares`: autenticação e tratamento de erros
- `resources/swagger.json`: documentação Swagger

## Como executar

```bash
npm install
npm run start
```

Servidor padrão: `http://localhost:3000`

## Documentação Swagger

- UI: `http://localhost:3000/api/docs`
- Arquivo: `resources/swagger.json`

## Endpoints principais

### Usuários

- `POST /api/users` - cadastro de usuário
- `DELETE /api/users/:id` - exclusão da própria conta (autenticado)

### Autenticação

- `POST /api/auth/login` - login e geração de JWT
- `POST /api/auth/logout` - logout e invalidação de token

### Receitas

- `POST /api/recipes` - criar receita (autenticado)
- `PUT /api/recipes/:id` - editar receita própria (autenticado)
- `DELETE /api/recipes/:id` - excluir receita própria (autenticado)
- `GET /api/recipes` - listar receitas públicas (com busca opcional `?search=`)
- `GET /api/recipes/my` - listar receitas do usuário autenticado
- `GET /api/recipes/:id` - detalhar receita (com regras de visibilidade)

## Padrão de erros

A API retorna erros no formato:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Mensagem descritiva"
  }
}
```

## Observações

- Os dados ficam somente em memória; ao reiniciar o servidor, os dados são perdidos.
- Para produção, ajuste `JWT_SECRET` via variável de ambiente.
