// Teste de Estresse (Stress Test)
// Objetivo: Subir gradualmente de 0 até 200 usuários em 2 minutos
// Verificar: Identificar ponto de ruptura, registrar taxa de erro e tempo de resposta

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Carregar dados de fixture
const users = JSON.parse(open('../fixtures/users.json'));

// Métricas customizadas
const errorRate = new Rate('errors');

// Configuração do teste de estresse
export const options = {
  // Cenário: Subir gradualmente de 0 até 200 usuários em 2 minutos
  stages: [
    { duration: '2m', target: 200 },
  ],
  // Thresholds de performance
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% das requisições abaixo de 2s
    http_req_failed: ['rate<0.01'],    // Taxa de erro menor que 1%
    http_reqs: ['rate>0'],             // Registrar RPS
  },
};

// Função principal do teste
export default function () {
  // Gerar dados únicos para evitar conflitos de email
  const userIndex = (__VU - 1) % users.length;
  const user = users[userIndex];
  const uniqueEmail = `${user.email.split('@')[0]}_${__VU}_${Date.now()}@${user.email.split('@')[1]}`;

  const payload = JSON.stringify({
    name: user.name,
    email: uniqueEmail,
    password: user.password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Fazer requisição POST para cadastro de usuário
  const response = http.post('http://localhost:3000/api/users', payload, params);

  // Verificar resposta
  const checkResult = check(response, {
    'status is 201': (r) => r.status === 201,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  // Registrar erro se check falhar
  if (!checkResult) {
    errorRate.add(1);
  }

  // Pausa entre requisições para simular comportamento real
  sleep(1);
}