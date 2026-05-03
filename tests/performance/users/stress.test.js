/**
 * Teste de Estresse — recurso **Usuários**: `POST /api/users`.
 *
 * Rampa 0 → 200 VUs em ~2 minutos (5 estágios). Métrica `users_register_duration` por iteração.
 */

import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { USER_TEMPLATES, runUserRegistration } from './common.js';

const registerDuration = new Trend('users_register_duration');
const businessErrorRate = new Rate('business_errors');

export const options = {
  stages: [
    { duration: '24s', target: 40 },
    { duration: '24s', target: 80 },
    { duration: '24s', target: 120 },
    { duration: '24s', target: 160 },
    { duration: '24s', target: 200 },
  ],
  thresholds: {
    'http_req_duration{name:UsersRegister}': ['p(95)<2000'],
    'http_req_failed{name:UsersRegister}': ['rate<0.01'],
    http_reqs: ['rate>0'],
  },
};

export default function main() {
  const template = USER_TEMPLATES[(__VU - 1) % USER_TEMPLATES.length];
  const { responses, checks } = runUserRegistration(template);

  registerDuration.add(responses.resRegister.timings.duration);

  const ok = check(checks, {
    'cadastro OK': (c) => c['cadastro status 201'] && c['cadastro duração < 2000ms'],
  });

  businessErrorRate.add(ok ? 0 : 1);
  sleep(0.15);
}
