/**
 * Teste de Estresse — recurso **Autenticação**: rampa até 200 VUs em ~2 minutos.
 *
 * Tendências `login_req_duration` e `logout_req_duration` por iteração para comparar estágios no JSON.
 */

import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { USER_TEMPLATES, runAuthFlow } from './common.js';

const loginDuration = new Trend('login_req_duration');
const logoutDuration = new Trend('logout_req_duration');
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
    'http_req_duration{name:Login}': ['p(95)<2000'],
    'http_req_failed{name:Login}': ['rate<0.01'],
    'http_req_duration{name:Logout}': ['p(95)<2000'],
    'http_req_failed{name:Logout}': ['rate<0.01'],
    http_reqs: ['rate>0'],
  },
};

export default function main() {
  const template = USER_TEMPLATES[(__VU - 1) % USER_TEMPLATES.length];
  const { responses, checks } = runAuthFlow(template);

  loginDuration.add(responses.resLogin.timings.duration);
  logoutDuration.add(responses.resLogout.timings.duration);

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
  sleep(0.15);
}
