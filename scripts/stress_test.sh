#!/bin/sh
# ==============================================================================
# Sania Pet v0.1 — Stress Test Runner
# ==============================================================================

TARGET="${1:-http://127.0.0.1:8080}"
CONCURRENCY="${2:-100}"
REQUESTS="${3:-5000}"

echo "🚀 Iniciando prueba de carga contra: ${TARGET}"
echo "👥 Usuarios concurrentes: ${CONCURRENCY}"
echo "📊 Total de peticiones: ${REQUESTS}"
echo "--------------------------------------------------"

if command -v hey >/dev/null 2>&1; then
  echo "⚡ Ejecutando con 'hey'..."
  hey -n "${REQUESTS}" -c "${CONCURRENCY}" "${TARGET}/api/pets/luna"
elif command -v bombardier >/dev/null 2>&1; then
  echo "⚡ Ejecutando con 'bombardier'..."
  bombardier -c "${CONCURRENCY}" -n "${REQUESTS}" "${TARGET}/api/pets/luna"
elif command -v ab >/dev/null 2>&1; then
  echo "⚡ Ejecutando con 'Apache Benchmark (ab)'..."
  ab -n "${REQUESTS}" -c "${CONCURRENCY}" -k "${TARGET}/api/pets/luna"
elif command -v k6 >/dev/null 2>&1; then
  echo "⚡ Ejecutando con 'k6'..."
  TARGET_URL="${TARGET}" k6 run scripts/k6_test.js
else
  echo "⚠️ No se encontró 'hey', 'bombardier', 'ab' ni 'k6'."
  echo "Instalación rápida en Alpine Linux: sudo apk add apache2-utils"
  echo "Instalación rápida en Ubuntu/Debian: sudo apt install apache2-utils"
fi
