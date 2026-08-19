import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Rampa hasta 50 usuarios concurrentes
    { duration: '30s', target: 200 }, // Carga sostenida con 200 usuarios concurrentes
    { duration: '10s', target: 500 }, // Pico de estrés con 500 usuarios concurrentes
    { duration: '10s', target: 0 },   // Enfriamiento
  ],
  thresholds: {
    http_req_duration: ['p(95)<150'], // 95% de las respuestas deben ser < 150ms
    http_req_failed: ['rate<0.01'],   // Tasa de error menor al 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8080';

export default function () {
  // 1. Cargar aplicación web
  const resHome = http.get(`${BASE_URL}/`);
  check(resHome, { 'Home HTTP 200': (r) => r.status === 200 });

  // 2. Consultar lista de mascotas
  const resPets = http.get(`${BASE_URL}/api/pets`);
  check(resPets, { 'List Pets HTTP 200': (r) => r.status === 200 });

  // 3. Consultar ficha médica completa
  const resLuna = http.get(`${BASE_URL}/api/pets/luna`);
  check(resLuna, { 'Pet Detail HTTP 200': (r) => r.status === 200 });

  sleep(0.05);
}
