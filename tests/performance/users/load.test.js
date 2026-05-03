/**
 * Teste de Carga — recurso **Usuários**: `POST /api/users`.
 *
 * ~50 VUs simultâneos durante 1 minuto (após ramp-up). SLAs nas requisições tagadas `UsersRegister`.
 */

import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { USER_TEMPLATES, runUserRegistration } from './common.js';

const businessErrorRate = new Rate('business_errors');

export const options = {
  stages: [
    { duration: '10s', target: 50 },
    { duration: '1m', target: 50 },
  ],
  thresholds: {
    'http_req_duration{name:UsersRegister}': ['p(95)<2000'],
    'http_req_failed{name:UsersRegister}': ['rate<0.01'],
    http_reqs: ['rate>0'],
  },
};

export default function main() {
  const template = USER_TEMPLATES[(__VU - 1) % USER_TEMPLATES.length];
  const { checks } = runUserRegistration(template);

  const ok = check(checks, {
    'cadastro OK': (c) => c['cadastro status 201'] && c['cadastro duração < 2000ms'],
  });

  businessErrorRate.add(ok ? 0 : 1);
  sleep(0.2);
}
