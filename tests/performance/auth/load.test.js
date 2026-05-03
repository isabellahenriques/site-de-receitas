/**
 * Teste de Carga — recurso **Autenticação**: login + logout (`POST /api/auth/login`, `POST /api/auth/logout`).
 *
 * Setup: cadastro por iteração (fora das métricas de aceite principais). SLAs nas tags `Login` e `Logout`.
 */

import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { USER_TEMPLATES, runAuthFlow } from './common.js';

const businessErrorRate = new Rate('business_errors');

export const options = {
  stages: [
    { duration: '10s', target: 50 },
    { duration: '1m', target: 50 },
  ],
  thresholds: {
    'http_req_duration{name:Login}': ['p(95)<2000'],
    'http_req_failed{name:Login}': ['rate<0.01'],
    'http_req_duration{name:Logout}': ['p(95)<2000'],
    'http_req_failed{name:Logout}': ['rate<0.01'],
    http_reqs: ['rate>0'],
  },
};

export default function main() {
  const template = USER_TEMPLATES[(__VU - 1) % USER_TEMPLATES.length];
  const { checks } = runAuthFlow(template);

  const fluxoOk = check(checks, {
    'fluxo auth OK': (c) =>
      c['setup cadastro 201'] &&
      c['login status 200'] &&
      c['login retornou token'] &&
      c['login duração < 2000ms'] &&
      c['logout status 200'] &&
      c['logout duração < 2000ms'],
  });

  businessErrorRate.add(fluxoOk ? 0 : 1);
  sleep(0.2);
}
