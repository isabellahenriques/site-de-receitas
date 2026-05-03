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

## Rodando os testes

### Testes de API (Mocha)

Com `npm install` já executado:

```bash
npm test                # terminal, reporter spec
npm run test:no-report  # mesmo comportamento (alias explícito)
npm run test:report     # relatório HTML/JSON em tests/reports/mochawesome/
```

Os specs ficam em `tests/**/*.spec.js` (configuração em `package.json`).

### Testes de performance (k6)

Instale o [k6](#instalação-do-k6), suba a API (`npm run start`) e use os comandos em **[Testes de Performance](#testes-de-performance)** (secções por recurso, URL alternativa e `k6 run` direto).

## Branches

| Branch | Descrição |
|--------|-----------|
| `main` | Código da API em produção |
| `testesDeApi` | Testes automatizados |
| `testesDePerformance` | Testes de performance |

## Testes automatizados

**Nota:** Os testes de API estão disponíveis na branch `testesDeApi`.

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

Resumo dos comandos: secção [Rodando os testes](#rodando-os-testes).

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

## Testes de Performance

**Nota:** Os testes de performance estão disponíveis na branch `testesDePerformance`.

Os testes usam [k6](https://k6.io/) (JavaScript) e estão separados por recurso (`resources/swagger.json`):

- **`tests/performance/users/`** — apenas **`POST /api/users`** (cadastro). Métricas filtradas pela tag **`UsersRegister`**.
- **`tests/performance/auth/`** — **`POST /api/auth/login`** e **`POST /api/auth/logout`**. Por iteração há um cadastro prévio (`POST /api/users`) só como *setup* para credenciais válidas; os SLAs aplicam-se às tags **`Login`** e **`Logout`**.
- **`tests/performance/receitas/`** — fluxo completo das rotas de receitas: **`POST /api/recipes`**, **`GET /api/recipes`**, **`GET /api/recipes/my`**, **`GET /api/recipes/:id`**, **`PUT /api/recipes/:id`**, **`DELETE /api/recipes/:id`**. Cadastro + login por iteração usam tags **`RecipesSetupRegister`** / **`RecipesSetupLogin`**; os SLAs aplicam-se à tag **`RecipesHTTP`**. Scripts npm: **`perf:load`**, **`perf:stress`**, **`perf:spike`** (saída JSON em `tests/performance/reports/receitas-*-report.json`).

### Instalação do k6

Instale o binário `k6` no sistema (não é pacote npm do projeto).

#### Windows (Chocolatey ou winget)

```bash
choco install k6
```

```bash
winget install k6 --source winget
```

#### Linux (Ubuntu/Debian)

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

Outras distribuições: [documentação oficial de instalação](https://grafana.com/docs/k6/latest/set-up/install-k6/).

#### macOS

```bash
brew install k6
```

Confirme a instalação:

```bash
k6 version
```

### Estrutura de testes de performance

- `tests/performance/users/` — recurso **Usuários**
  - `common.js`: fixture, URL base e **`POST /api/users`** (tag `UsersRegister`)
  - `load.test.js` / `stress.test.js` / `spike.test.js`: carga, estresse e pico só no cadastro (stress registra também `users_register_duration`)
- `tests/performance/auth/` — recurso **Autenticação**
  - `common.js`: setup com cadastro + **`POST /api/auth/login`** + **`POST /api/auth/logout`**
  - `load.test.js` / `stress.test.js` / `spike.test.js`: mesmos padrões de VUs/duração; stress inclui `login_req_duration` e `logout_req_duration`
- `tests/performance/receitas/` — recurso **Recipes**
  - `common.js`: setup (`RecipesSetupRegister` / `RecipesSetupLogin`) + fluxo **`RecipesHTTP`** (`POST`/`GET`/`GET my`/`GET :id`/`PUT`/`DELETE`)
  - `load.test.js` / `stress.test.js` / `spike.test.js`: carga, estresse (métricas `recipes_*_duration`) e pico; relatórios `receitas-*-report.json`
- `tests/performance/fixtures/users.json`: `baseUrl`, lista `users` (`name`, `email`, `password`) e **`recipeTemplates`** (`title`, `ingredients`, `instructions`, `visibility`) — usada pelos pacotes users, auth e **receitas**
- `tests/performance/reports/`: um JSON por execução (`--out json=...` nos scripts npm)

### Cenários (espelhados em users, auth e receitas)

1. **Carga**: ~50 VUs após ramp-up curta + platô de **1 minuto**.
2. **Estresse**: cinco estágios de **24s**, alvos **40 → 200 VUs** (≈2 minutos). Em **receitas**, métricas `recipes_*_duration` registram latência por operação para análise junto ao relatório JSON.
3. **Pico**: linha base → até **500 VUs** por **30s**.

### Como rodar os testes de performance

Pré-requisitos: [k6 instalado](#instalação-do-k6), API em execução (`npm run start`). Por padrão a URL é `http://localhost:3000` (também configurável em `tests/performance/fixtures/users.json`).

### **Testes de performance — usuários (cadastro `POST /api/users`)**

```bash
npm run perf:users:load
npm run perf:users:stress
npm run perf:users:spike
```

Relatórios: `tests/performance/reports/users-*-report.json`.

---

### **Testes de performance — autenticação (login / logout)**

```bash
npm run perf:auth:load
npm run perf:auth:stress
npm run perf:auth:spike
```

Relatórios: `tests/performance/reports/auth-*-report.json`.

---

### **Testes de performance — receitas (fluxo CRUD)**

```bash
npm run perf:load
npm run perf:stress
npm run perf:spike
```

Relatórios: `tests/performance/reports/receitas-*-report.json`.

---

### **URL da API diferente de localhost**

PowerShell (exemplo em uma linha — altere host, porta e o script `npm run` conforme o teste):

```powershell
$env:BASE_URL="http://outro-host:3000"; npm run perf:load
```

Outros shells:

```bash
set BASE_URL=http://outro-host:3000 && npm run perf:load
```

```bash
export BASE_URL=http://outro-host:3000 && npm run perf:load
```

---

### **Rodar um script k6 direto (sem npm)**

Equivalente aos scripts em `package.json`; ajuste o arquivo `.js` e o caminho do relatório JSON.

```bash
k6 run tests/performance/receitas/load.test.js --out json=tests/performance/reports/receitas-load-report.json
```

Substitua o caminho do `.js` e do relatório conforme o teste desejado (por exemplo: `tests/performance/users/load.test.js` → `users-load-report.json`, `tests/performance/auth/stress.test.js` → `auth-stress-report.json`).

### Thresholds (critérios de aceite)

**Usuários**

- `http_req_duration{name:UsersRegister}` / `http_req_failed{name:UsersRegister}` — p95 **< 2000 ms**, falhas **< 1%** em **`POST /api/users`**

**Autenticação**

- `http_req_duration{name:Login}` / `http_req_failed{name:Login}` — idem para **`POST /api/auth/login`**
- `http_req_duration{name:Logout}` / `http_req_failed{name:Logout}` — idem para **`POST /api/auth/logout`**

Em todos os pacotes: `http_reqs` com `rate>0` para garantir tráfego mensurável (total e req/s no JSON).

Em **estresse** ou **pico**, falhas de threshold indicam limite do ambiente ou da API — útil para capacidade e tuning.

**Receitas**

- `http_req_duration{name:RecipesHTTP}` / `http_req_failed{name:RecipesHTTP}` — p95 **< 2000 ms**, falhas **< 1%** nas operações medidas do recurso Recipes (conforme `resources/swagger.json`).

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
