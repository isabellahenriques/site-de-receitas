/**
 * Helpers dos testes de performance — recurso **Receitas** (`/api/recipes*`).
 *
 * Documentação OpenAPI: `resources/swagger.json` (tag Recipes).
 *
 * **Setup (não entra nos thresholds SLAs principais):**
 * - `POST /api/users` — cadastro com e-mail único por iteração (tag `RecipesSetupRegister`).
 * - `POST /api/auth/login` — obtém JWT (tag `RecipesSetupLogin`).
 *
 * **Fluxo medido (thresholds `http_req_*{name:RecipesHTTP}`):**
 * - `POST /api/recipes` — criar receita (corpo vem de `recipeTemplates` no fixture).
 * - `GET /api/recipes` — lista pública (query `search` opcional).
 * - `GET /api/recipes/my` — minhas receitas.
 * - `GET /api/recipes/{id}` — detalhe (usa `id` retornado no POST).
 * - `PUT /api/recipes/{id}` — atualização.
 * - `DELETE /api/recipes/{id}` — exclusão (204).
 */

import http from 'k6/http';

/** Conteúdo do fixture carregado na fase init (caminho relativo a `receitas/`). */
const fixtureRoot = JSON.parse(open('../fixtures/users.json'));

/**
 * Lista de usuários modelo `{ name, email, password }` para cadastro + login.
 * O array raiz também é aceito (formato legado compatível).
 */
export const USER_TEMPLATES = Array.isArray(fixtureRoot) ? fixtureRoot : fixtureRoot.users;

/**
 * Modelos de receita para POST/PUT (`title`, `ingredients`, `instructions`, `visibility`).
 * Fallback mínimo se o JSON não declarar `recipeTemplates`.
 */
export const RECIPE_TEMPLATES =
  !Array.isArray(fixtureRoot) && Array.isArray(fixtureRoot.recipeTemplates) && fixtureRoot.recipeTemplates.length > 0
    ? fixtureRoot.recipeTemplates
    : [
        {
          title: 'Receita padrão K6',
          ingredients: 'Ingrediente A, Ingrediente B',
          instructions: 'Misture e sirva.',
          visibility: 'public',
        },
      ];

/**
 * URL base: variável `BASE_URL` > `baseUrl` no fixture > localhost:3000.
 */
export const BASE_URL =
  __ENV.BASE_URL ||
  (!Array.isArray(fixtureRoot) && fixtureRoot && typeof fixtureRoot.baseUrl === 'string'
    ? fixtureRoot.baseUrl
    : '') ||
  'http://localhost:3000';

/** Cabeçalho JSON reutilizado nos POST/PUT. */
const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * Gera e-mail único por VU/iteração para evitar HTTP 409 no cadastro.
 *
 * @param {string} templateEmail — e-mail modelo do fixture (ex.: joao@example.com).
 * @returns {string}
 */
export function buildUniqueEmail(templateEmail) {
  const [localPart, domain] = templateEmail.split('@');
  const suffix = `vu${__VU}_iter${__ITER}_${Date.now()}`;
  return `${localPart}_${suffix}@${domain}`;
}

/**
 * Monta um título levemente variável por iteração para facilitar identificação em logs (opcional).
 *
 * @param {string} baseTitle
 * @returns {string}
 */
export function uniqueRecipeTitle(baseTitle) {
  return `${baseTitle} [vu${__VU}-i${__ITER}]`;
}

/**
 * Extrai `id` da receita do corpo JSON da resposta de criação (201).
 *
 * @param {object} resPost — resposta k6 do POST /api/recipes
 * @returns {string|null}
 */
export function parseRecipeId(resPost) {
  if (resPost.status !== 201) return null;
  try {
    const body = resPost.json();
    return body && body.id != null ? String(body.id) : null;
  } catch (_) {
    return null;
  }
}

/**
 * Uma iteração completa: setup (cadastro + login) + CRUD/listagem nas rotas de receitas.
 *
 * @param {{ name: string, email: string, password: string }} userTemplate — `fixtures/users.json` → `users`.
 * @param {{ title: string, ingredients: string, instructions: string, visibility: string }} recipeTemplate — `recipeTemplates`.
 * @returns {{ responses: object, checks: Record<string, boolean> }}
 */
export function runRecipesFlow(userTemplate, recipeTemplate) {
  const email = buildUniqueEmail(userTemplate.email);

  /** Cadastro para esta iteração — não conta nos thresholds `RecipesHTTP`. */
  const registerBody = JSON.stringify({
    name: userTemplate.name,
    email,
    password: userTemplate.password,
  });
  const resRegister = http.post(`${BASE_URL}/api/users`, registerBody, {
    headers: JSON_HEADERS,
    tags: { name: 'RecipesSetupRegister' },
  });

  const loginBody = JSON.stringify({
    email,
    password: userTemplate.password,
  });
  const resLogin = http.post(`${BASE_URL}/api/auth/login`, loginBody, {
    headers: JSON_HEADERS,
    tags: { name: 'RecipesSetupLogin' },
  });

  let token = null;
  if (resLogin.status === 200) {
    try {
      const loginJson = resLogin.json();
      token = loginJson && loginJson.token ? String(loginJson.token) : null;
    } catch (_) {
      token = null;
    }
  }

  const authHeaders =
    token != null && token.length > 0 ? { ...JSON_HEADERS, Authorization: `Bearer ${token}` } : { ...JSON_HEADERS };

  /** Payload da nova receita (título único reduz colisões perceptíveis em depuração). */
  const createPayload = JSON.stringify({
    title: uniqueRecipeTitle(recipeTemplate.title),
    ingredients: recipeTemplate.ingredients,
    instructions: recipeTemplate.instructions,
    visibility: recipeTemplate.visibility,
  });

  const resPostRecipe = http.post(`${BASE_URL}/api/recipes`, createPayload, {
    headers: authHeaders,
    tags: { name: 'RecipesHTTP' },
  });

  const recipeId = parseRecipeId(resPostRecipe);

  /** Lista pública — não exige autenticação na especificação Swagger. */
  const resGetList = http.get(`${BASE_URL}/api/recipes`, {
    tags: { name: 'RecipesHTTP' },
  });

  /** Lista autenticada do autor. */
  const resGetMy = http.get(`${BASE_URL}/api/recipes/my`, {
    headers: authHeaders,
    tags: { name: 'RecipesHTTP' },
  });

  /** Detalhe só se houver id válido após o POST. */
  const resGetById =
    recipeId != null
      ? http.get(`${BASE_URL}/api/recipes/${recipeId}`, {
          headers: authHeaders,
          tags: { name: 'RecipesHTTP' },
        })
      : null;

  /** Corpo do PUT: mesmos campos obrigatórios com pequena alteração no título. */
  const updatePayload = JSON.stringify({
    title: `${uniqueRecipeTitle(recipeTemplate.title)} (editado)`,
    ingredients: recipeTemplate.ingredients,
    instructions: `${recipeTemplate.instructions} Refogue mais 2 minutos.`,
    visibility: recipeTemplate.visibility === 'public' ? 'public' : 'private',
  });

  const resPut =
    recipeId != null
      ? http.put(`${BASE_URL}/api/recipes/${recipeId}`, updatePayload, {
          headers: authHeaders,
          tags: { name: 'RecipesHTTP' },
        })
      : null;

  const resDelete =
    recipeId != null
      ? http.del(`${BASE_URL}/api/recipes/${recipeId}`, null, {
          headers: authHeaders,
          tags: { name: 'RecipesHTTP' },
        })
      : null;

  const checks = {
    'setup cadastro 201': resRegister.status === 201,
    'setup login 200': resLogin.status === 200,
    'setup token presente': token != null && token.length > 0,
    'POST receitas 201': resPostRecipe.status === 201,
    'GET /api/recipes 200': resGetList.status === 200,
    'GET /api/recipes/my 200': resGetMy.status === 200,
    'GET por id 200': resGetById != null && resGetById.status === 200,
    'PUT receitas 200': resPut != null && resPut.status === 200,
    'DELETE receitas 204': resDelete != null && resDelete.status === 204,
  };

  return {
    responses: {
      resRegister,
      resLogin,
      resPostRecipe,
      resGetList,
      resGetMy,
      resGetById,
      resPut,
      resDelete,
    },
    checks,
  };
}
