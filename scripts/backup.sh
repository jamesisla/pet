#!/bin/sh
# ==============================================================================
# Sania Pet v0.1 — Automated Backup Script for Oracle Cloud Infrastructure (OCI)
# ==============================================================================
set -e

BACKUP_DIR="/opt/saniv2/backups"
DATA_DIR="/opt/saniv2/data"
UPLOADS_DIR="/opt/saniv2/web/static/uploads"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/saniapet_backup_${TIMESTAMP}.tar.gz"

echo "📦 [$(date)] Iniciando respaldo de Sania Pet..."
mkdir -p "${BACKUP_DIR}"

# Crear archivo comprimido con los datos y archivos subidos
tar -czf "${BACKUP_FILE}" -C /opt/saniv2 data web/static/uploads

echo "✅ [$(date)] Respaldo generado: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# Rotación de respaldos: Conservar los últimos 14 días y eliminar los más antiguos
find "${BACKUP_DIR}" -name "saniapet_backup_*.tar.gz" -mtime +14 -delete

echo "🧹 [$(date)] Limpieza de respaldos antiguos completada."
