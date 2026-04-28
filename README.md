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

## Testes automatizados

Os testes de API foram implementados em JavaScript com:

- `mocha` (runner)
- `chai` (assertions)
- `supertest` (requisições HTTP)
- `mochawesome` (relatório HTML/JSON)

### Estrutura de testes

- `tests/modules/users`: cenários automatizados por módulo da API
- `tests/fixtures/users`: massa de dados (request/response) para data-driven testing
- `tests/reports/mochawesome`: saída dos relatórios de execução

### Executar testes

```bash
# Execução padrão (sem relatório HTML)
npm test
```

```bash
# Execução explícita sem relatório (alias)
npm run test:no-report
```

```bash
# Execução com geração de relatório mochawesome
npm run test:report
```

### Cobertura da US-01 (Cadastro de usuário)

Endpoint: `POST /api/users`

Casos implementados:

- CT-01: cadastro com sucesso
- CT-02: cadastro com e-mail já existente
- CT-03: cadastro sem `name`
- CT-04: cadastro sem `email`
- CT-05: cadastro sem `password`
- CT-06: cadastro com senha menor que 8 caracteres
- CT-07: cadastro com body vazio

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
