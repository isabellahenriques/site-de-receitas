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

## Branches

| Branch | Descrição |
|--------|-----------|
| `main` | Código da API em produção |
| `testesDeApi` | Testes automatizados e de performance |
| `testesDePerformance` | Testes de performance |

## Testes automatizados

**Nota:** Os testes de API estão disponíveis na branch `testesDeApi`.

Os testes de API foram implementados em JavaScript com:

- `mocha` (runner)
- `chai` (assertions)
- `supertest` (requisições HTTP)
- `mochawesome` (relatório HTML/JSON)

### Estrutura de testes

- `tests/api/modules/users`: cenários automatizados do módulo de usuários
- `tests/api/modules/auth`: cenários automatizados do módulo de autenticação
- `tests/api/modules/recipes`: cenários automatizados do módulo de receitas
- `tests/api/fixtures/users`: massa de dados (request/response) da US-01 e US-04
- `tests/api/fixtures/auth`: massa de dados (request/response) da US-02 e US-03
- `tests/api/fixtures/recipes`: massa de dados (request/response) da US-05, US-06, US-07, US-08, US-09 e US-10
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

```bash
# Execução apenas da suíte de API sem relatório
npm run test:api:no-report
```

```bash
# Execução apenas da suíte de API com relatório mochawesome
npm run test:api:report
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

### Cobertura da US-02 (Login de usuário)

Endpoint: `POST /api/auth/login`

Casos implementados:

- CT-08: login com sucesso com credenciais válidas
- CT-09: login com e-mail não cadastrado
- CT-10: login com senha incorreta
- CT-11: login sem `email`
- CT-12: login sem `password`

### Cobertura da US-03 (Logout de usuário)

Endpoint: `POST /api/auth/logout`

Casos implementados:

- CT-13: logout com sucesso com token válido
- CT-14: logout sem token no header `Authorization`
- CT-15: logout com token já invalidado por logout anterior

### Cobertura da US-04 (Exclusão de conta)

Endpoint: `DELETE /api/users/:id`

Casos implementados:

- CT-16: exclusão da própria conta com sucesso
- CT-17: tentativa de excluir conta de outro usuário
- CT-18: tentativa de excluir conta com id inexistente
- CT-19: tentativa de excluir conta sem token no header `Authorization`

### Cobertura da US-05 (Cadastro de receita)

Endpoint: `POST /api/recipes`

Casos implementados:

- CT-20: cadastro de receita com sucesso
- CT-21: cadastro de receita com visibilidade privada
- CT-22: cadastro de receita sem token
- CT-23: cadastro de receita sem o campo `title`
- CT-24: cadastro de receita com visibilidade inválida

### Cobertura da US-06 (Edição de receita)

Endpoint: `PUT /api/recipes/:id`

Casos implementados:

- CT-25: edição de receita com sucesso
- CT-26: tentativa de edição de receita de outro usuário
- CT-27: tentativa de edição com id de receita inexistente
- CT-28: tentativa de edição sem token no header `Authorization`
- CT-29: tentativa de edição sem o campo obrigatório `title`

### Cobertura da US-07 (Exclusão de receita)

Endpoint: `DELETE /api/recipes/:id`

Casos implementados:

- CT-30: exclusão de receita própria com sucesso
- CT-31: tentativa de exclusão de receita de outro usuário
- CT-32: tentativa de exclusão com id de receita inexistente
- CT-33: tentativa de exclusão sem token no header `Authorization`
- CT-34: validação de que receita excluída não é mais acessível via `GET /api/recipes/:id`

### Cobertura da US-08 (Controle de visibilidade da receita)

Endpoints:

- `GET /api/recipes`
- `GET /api/recipes/:id`
- `GET /api/recipes/my`

Casos implementados:

- CT-35: receita privada não aparece na listagem pública
- CT-36: acesso negado para usuário autenticado que não é dono da receita privada
- CT-37: acesso negado para visitante não autenticado em receita privada
- CT-38: listagem de receitas do próprio usuário retorna receitas públicas e privadas

### Cobertura da US-09 (Listagem de receitas públicas)

Endpoint:

- `GET /api/recipes`

Casos implementados:

- CT-39: listagem de receitas públicas com sucesso retornando somente itens públicos
- CT-40: listagem sem receitas públicas cadastradas retorna lista vazia
- CT-41: listagem de receitas públicas sem autenticação retorna sucesso e apenas receitas públicas

### Cobertura da US-10 (Busca de receitas por nome)

Endpoint:

- `GET /api/recipes?search=termo`

Casos implementados:

- CT-42: busca de receita com termo válido retorna 200 e contém `Bolo de cenoura`
- CT-43: busca case insensitive com termo em maiúsculo retorna 200 e contém `Bolo de cenoura`
- CT-44: busca com termo inexistente retorna 200 com lista vazia
- CT-45: busca por termo de receita privada retorna 200 sem expor receita privada

## Testes de Performance

**Nota:** Os testes de performance estão disponíveis na branch `testesDePerformance`.

Os testes de performance foram implementados com K6 para avaliar a robustez da API sob diferentes cargas.

### Instalação do K6

Para executar os testes de performance, é necessário instalar o K6. Siga as instruções abaixo:

#### Windows (usando Chocolatey ou winget)

```bash
# Com Chocolatey
choco install k6

# Ou com winget
winget install k6
```

#### Linux

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install k6

# Outras distribuições: consulte https://k6.io/docs/get-started/installation/
```

#### macOS

```bash
brew install k6
```

Verifique a instalação:

```bash
k6 version
```

### Estrutura de testes de performance

- `tests/performance/users/`: testes específicos para o endpoint de usuários
  - `load.test.js`: teste de carga
  - `stress.test.js`: teste de estresse
  - `spike.test.js`: teste de pico
- `tests/performance/fixtures/users.json`: dados de exemplo para os testes
- `tests/performance/reports/`: relatórios de execução em JSON

### Cenários de teste

1. **Teste de Carga (Load Test)**: Simula 50 usuários simultâneos durante 1 minuto. Verifica se a API mantém tempo de resposta abaixo de 2 segundos e taxa de erro menor que 1%.

2. **Teste de Estresse (Stress Test)**: Sobe gradualmente de 0 até 200 usuários em 2 minutos. Identifica o ponto de ruptura da API, registrando taxa de erro e tempo de resposta.

3. **Teste de Pico (Spike Test)**: Simula pico repentino de 500 usuários por 30 segundos. Verifica o comportamento da API sob carga extrema.

### Executar testes de performance

Certifique-se de que a API está rodando em `http://localhost:3000` antes de executar os testes.

```bash
# Teste de carga
npm run perf:load

# Teste de estresse
npm run perf:stress

# Teste de pico
npm run perf:spike
```

Os relatórios serão salvos em `tests/performance/reports/` no formato JSON.

### Thresholds (critérios de aceite)

- `http_req_duration`: 95% das requisições abaixo de 2000ms
- `http_req_failed`: taxa de falha menor que 1%
- `http_reqs`: registro do total de requisições por segundo

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
