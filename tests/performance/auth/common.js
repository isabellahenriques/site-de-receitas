/**
 * Helpers dos testes de performance — recurso **Autenticação** (`/api/auth/*`).
 *
 * Endpoints medidos nas SLAs: **`POST /api/auth/login`** (tag `Login`) e **`POST /api/auth/logout`** (tag `Logout`).
 * O cadastro `POST /api/users` é apenas setup por iteração (e-mail único) para obter credenciais válidas e JWT — não é objeto das métricas filtradas desta pasta.
 */

import http from 'k6/http';

/** Reutiliza a mesma massa de nomes/senhas/e-mails modelo que os testes de usuários (cadastro prévio). */
const fixtureRoot = JSON.parse(open('../fixtures/users.json'));

export const USER_TEMPLATES = Array.isArray(fixtureRoot) ? fixtureRoot : fixtureRoot.users;

export const BASE_URL =
  __ENV.BASE_URL ||
  (!Array.isArray(fixtureRoot) && fixtureRoot && typeof fixtureRoot.baseUrl === 'string'
    ? fixtureRoot.baseUrl
    : '') ||
  'http://localhost:3000';

export function buildUniqueEmail(templateEmail) {
  const [localPart, domain] = templateEmail.split('@');
  const suffix = `vu${__VU}_iter${__ITER}_${Date.now()}`;
  return `${localPart}_${suffix}@${domain}`;
}

/**
 * Setup (cadastro) + login + logout. Métricas de aceite nos tags `Login` e `Logout`.
 *
 * @param {{ name: string, email: string, password: string }} template — fixtures/users.json
 */
export function runAuthFlow(template) {
  const email = buildUniqueEmail(template.email);
  const jsonHeaders = { 'Content-Type': 'application/json' };

  const registerBody = JSON.stringify({
    name: template.name,
    email,
    password: template.password,
  });

  /** Cadastro só para garantir usuário nesta iteração (tag auxiliar — métricas de aceite são Login/Logout). */
  const resRegister = http.post(`${BASE_URL}/api/users`, registerBody, {
    headers: jsonHeaders,
    tags: { name: 'AuthSetupRegister' },
  });

  const loginPayload = JSON.stringify({
    email,
    password: template.password,
  });

  const resLogin = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: jsonHeaders,
    tags: { name: 'Login' },
  });

  let token = null;
  if (resLogin.status === 200) {
    try {
      const body = resLogin.json();
      token = body && body.token ? String(body.token) : null;
    } catch (_) {
      token = null;
    }
  }

  const authHeaders =
    token != null && token.length > 0 ? { Authorization: `Bearer ${token}` } : {};

  const resLogout = http.post(`${BASE_URL}/api/auth/logout`, null, {
    headers: authHeaders,
    tags: { name: 'Logout' },
  });

  const checks = {
    'setup cadastro 201': resRegister.status === 201,
    'login status 200': resLogin.status === 200,
    'login retornou token': token != null && token.length > 0,
    'login duração < 2000ms': resLogin.timings.duration < 2000,
    'logout status 200': resLogout.status === 200,
    'logout duração < 2000ms': resLogout.timings.duration < 2000,
  };

  return {
    responses: { resRegister, resLogin, resLogout },
    checks,
  };
}
