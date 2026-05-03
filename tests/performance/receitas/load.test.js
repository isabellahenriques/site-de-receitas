/**
 * Teste de **Carga** — endpoints de receitas sob `/api/recipes` (Swagger: Recipes).
 *
 * Cenário: ~50 usuários virtuais simultâneos após ramp-up curta, platô de **1 minuto**.
 * Cada VU executa por iteração: cadastro → login → POST/GET lista/GET my/GET id/PUT/DELETE.
 *
 * Critérios (thresholds): p95 das requisições tagadas `RecipesHTTP` &lt; 2000 ms,
 * taxa de falha HTTP &lt; 1%, `http_reqs` com taxa &gt; 0 (throughput registrado no JSON).
 */

import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { USER_TEMPLATES, RECIPE_TEMPLATES, runRecipesFlow } from './common.js';

/** Taxa auxiliar de falhas “de negócio” (checks compostos falhando). */
const businessErrorRate = new Rate('business_errors');

export const options = {
  stages: [
    /** Rampa inicial até 50 VUs para aquecer conexões sem um degrau abrupto. */
    { duration: '10s', target: 50 },
    /** Platô principal do teste de carga — 1 minuto conforme especificação. */
    { duration: '1m', target: 50 },
  ],
  thresholds: {
    /** 95% das requisições do fluxo de receitas abaixo de 2 segundos. */
    'http_req_duration{name:RecipesHTTP}': ['p(95)<2000'],
    /** Menos de 1% de falhas nas chamadas à API de receitas. */
    'http_req_failed{name:RecipesHTTP}': ['rate<0.01'],
    /** Garante requisições contínuas; o relatório JSON agrega total e req/s. */
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
  /** Pequena pausa para espaçar iterações e aproximar comportamento humano/leitura. */
  sleep(0.2);
}
