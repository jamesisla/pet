#!/bin/sh
# ==============================================================================
# Sania Pet v2 — Disaster Recovery & Restore Script
# ==============================================================================
set -e

if [ -z "$1" ]; then
  echo "Uso: sudo bash scripts/restore.sh /opt/saniv2/backups/saniapet_backup_YYYYMMDD_HHMMSS.tar.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Error: El archivo de respaldo '${BACKUP_FILE}' no existe."
  exit 1
fi

echo "⚠️ Restaurando datos desde: ${BACKUP_FILE}..."

# Detener servicio si está activo
if [ -f /etc/init.d/saniapet ]; then
  rc-service saniapet stop || true
elif command -v systemctl >/dev/null 2>&1; then
  systemctl stop saniapet || true
fi

# Extraer respaldo en /opt/saniv2
tar -xzf "${BACKUP_FILE}" -C /opt/saniv2

echo "✅ Datos y archivos multimedia restaurados exitosamente."

# Reiniciar servicio
if [ -f /etc/init.d/saniapet ]; then
  rc-service saniapet start
elif command -v systemctl >/dev/null 2>&1; then
  systemctl start saniapet
fi

echo "🚀 Sania Pet ha sido restaurado y reiniciado con éxito."
