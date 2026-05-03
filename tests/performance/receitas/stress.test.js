/**
 * Teste de **Estresse** — receitas (`/api/recipes*`), rampa gradual 0 → **200 VUs** em ~2 minutos.
 *
 * Objetivo: observar degradação, taxa de erro e tempos conforme a carga aumenta (5 estágios de 24s).
 * Métricas customizadas `recipes_*_duration` registram latência por tipo de operação no JSON final
 * para análise junto aos agregados por estágio do k6.
 */

import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { USER_TEMPLATES, RECIPE_TEMPLATES, runRecipesFlow } from './common.js';

const businessErrorRate = new Rate('business_errors');

/** Tendências por operação HTTP do domínio receitas (após login) — úteis para comparar fases da rampa. */
const trendPost = new Trend('recipes_post_duration');
const trendGetList = new Trend('recipes_get_list_duration');
const trendGetMy = new Trend('recipes_get_my_duration');
const trendGetById = new Trend('recipes_get_by_id_duration');
const trendPut = new Trend('recipes_put_duration');
const trendDelete = new Trend('recipes_delete_duration');

export const options = {
  stages: [
    { duration: '24s', target: 40 },
    { duration: '24s', target: 80 },
    { duration: '24s', target: 120 },
    { duration: '24s', target: 160 },
    { duration: '24s', target: 200 },
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

  const { responses, checks } = runRecipesFlow(userTemplate, recipeTemplate);

  /** Registro explícito de durações para correlação com “ponto de ruptura” no relatório. */
  trendPost.add(responses.resPostRecipe.timings.duration);
  trendGetList.add(responses.resGetList.timings.duration);
  trendGetMy.add(responses.resGetMy.timings.duration);
  if (responses.resGetById) trendGetById.add(responses.resGetById.timings.duration);
  if (responses.resPut) trendPut.add(responses.resPut.timings.duration);
  if (responses.resDelete) trendDelete.add(responses.resDelete.timings.duration);

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
  sleep(0.15);
}
