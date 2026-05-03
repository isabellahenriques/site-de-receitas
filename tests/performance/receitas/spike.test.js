/**
 * Teste de **Pico** — transição rápida para **500 VUs** durante **30 segundos** após rampa inicial baixa.
 *
 * Avalia comportamento sob carga extrema (timeouts, filas, erros). Os mesmos thresholds SLAs se aplicam;
 * falhas aqui são esperadas se a infraestrutura não suportar o pico — o relatório JSON preserva evidências.
 */

import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { USER_TEMPLATES, RECIPE_TEMPLATES, runRecipesFlow } from './common.js';

const businessErrorRate = new Rate('business_errors');

export const options = {
  stages: [
    /** Linha de base reduzida antes do salto (padrão alinhado aos testes users/auth). */
    { duration: '5s', target: 10 },
    /** Salto abrupto em direção ao alvo de pico. */
    { duration: '2s', target: 500 },
    /** Janela principal do spike — 500 usuários simultâneos por 30s. */
    { duration: '30s', target: 500 },
  ],
  thresholds: {
    'http_req_duration{name:RecipesHTTP}': ['p(95)<2000'],
    'http_req_failed{name:RecipesHTTP}': ['rate<0.01'],
    http_reqs: ['rate>0'],
  },
};

export default function main() {
  const userTemplate = USER_TEMPLATES[(__VU - 1) % USER_TEMPLATES.length];
  const recipeTemplate = RECIPE_TEMPLATES[(__VU - 1) % RECIPE_TEMPLATES.length];

  const { checks } = runRecipesFlow(userTemplate, recipeTemplate);

  const fluxoOk = check(checks, {
    'fluxo receitas OK': (c) =>
      c['setup cadastro 201'] &&
      c['setup login 200'] &&
      c['setup token presente'] &&
      c['POST receitas 201'] &&
      c['GET /api/recipes 200'] &&
      c['GET /api/recipes/my 200'] &&
      c['GET por id 200'] &&
      c['PUT receitas 200'] &&
      c['DELETE receitas 204'],
  });

  businessErrorRate.add(fluxoOk ? 0 : 1);
  sleep(0.1);
}
