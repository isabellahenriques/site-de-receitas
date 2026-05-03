/**
 * Helpers dos testes de performance — recurso **Usuários** (`/api/users`).
 *
 * Endpoint medido aqui: **`POST /api/users`** (cadastro — Swagger: resources/swagger.json).
 * Tag HTTP `UsersRegister` para thresholds e relatórios filtrados.
 */

import http from 'k6/http';

/** Fixture na fase init (caminho relativo ao script em users/). */
const fixtureRoot = JSON.parse(open('../fixtures/users.json'));

/**
 * Modelos `{ name, email, password }` para montar o body do cadastro.
 * Aceita `{ users: [...] }` ou array direto no JSON.
 */
export const USER_TEMPLATES = Array.isArray(fixtureRoot) ? fixtureRoot : fixtureRoot.users;

/**
 * URL base: `BASE_URL` (env) > `baseUrl` no fixture > localhost.
 */
export const BASE_URL =
  __ENV.BASE_URL ||
  (!Array.isArray(fixtureRoot) && fixtureRoot && typeof fixtureRoot.baseUrl === 'string'
    ? fixtureRoot.baseUrl
    : '') ||
  'http://localhost:3000';

/**
 * E-mail único por VU/iteração para evitar HTTP 409 (e-mail já cadastrado).
 */
export function buildUniqueEmail(templateEmail) {
  const [localPart, domain] = templateEmail.split('@');
  const suffix = `vu${__VU}_iter${__ITER}_${Date.now()}`;
  return `${localPart}_${suffix}@${domain}`;
}

/**
 * Uma iteração = apenas **`POST /api/users`** com payload JSON do fixture + e-mail único.
 *
 * @param {{ name: string, email: string, password: string }} template — fixtures/users.json
 * @returns {{ responses: object, checks: Record<string, boolean> }}
 */
export function runUserRegistration(template) {
  const email = buildUniqueEmail(template.email);
  const jsonHeaders = { 'Content-Type': 'application/json' };

  const registerBody = JSON.stringify({
    name: template.name,
    email,
    password: template.password,
  });

  const resRegister = http.post(`${BASE_URL}/api/users`, registerBody, {
    headers: jsonHeaders,
    tags: { name: 'UsersRegister' },
  });

  const checks = {
    'cadastro status 201': resRegister.status === 201,
    'cadastro duração < 2000ms': resRegister.timings.duration < 2000,
  };

  return {
    responses: { resRegister },
    checks,
  };
}
