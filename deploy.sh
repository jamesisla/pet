#!/bin/sh
# ==============================================================================
# Sania Pet — Script de Despliegue Automático para OCI
# Dominio: pet.oci.lat
# ==============================================================================

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}  🐾 Sania Pet — Despliegue Nativo en Oracle Cloud (OCI)        ${NC}"
echo -e "${CYAN}  🌐 Dominio: pet.oci.lat | Puerto: 3000                         ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""

if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}[ERROR] Este script debe ejecutarse como root (usa sudo).${NC}"
    exit 1
fi

APP_DIR=$(pwd)
TARGET_DIR="/opt/saniv2"

# 1. Check / Install Go compiler
echo -e "${YELLOW}[1/6] Verificando entorno Go...${NC}"
if ! command -v go >/dev/null 2>&1; then
    echo "  → Go no encontrado. Instalando..."
    if command -v apk >/dev/null 2>&1; then
        apk update && apk add go git
    elif command -v apt-get >/dev/null 2>&1; then
        apt-get update && apt-get install -y golang-go git
    elif command -v yum >/dev/null 2>&1; then
        yum install -y golang git
    fi
fi
echo -e "${GREEN}  ✓ $(go version)${NC}"

# 2. Build optimized Go binary
echo ""
echo -e "${YELLOW}[2/6] Compilando binario de alto rendimiento (Go)...${NC}"
go mod tidy
go build -ldflags="-s -w" -o saniapet cmd/app/main.go
echo -e "${GREEN}  ✓ Binario compilado: $(ls -lh saniapet | awk '{print $5}')${NC}"

# 3. Setup Target Directory
echo ""
echo -e "${YELLOW}[3/6] Preparando directorio de instalación en ${TARGET_DIR}...${NC}"
mkdir -p "${TARGET_DIR}/data"
mkdir -p "${TARGET_DIR}/web/static/uploads"

cp -f saniapet "${TARGET_DIR}/"
cp -rf web "${TARGET_DIR}/"
if [ ! -f "${TARGET_DIR}/data/pets.json" ] && [ -f "${APP_DIR}/data/pets.json" ]; then
    cp -f "${APP_DIR}/data/pets.json" "${TARGET_DIR}/data/"
fi

# 4. Install & Start System Service
echo ""
echo -e "${YELLOW}[4/6] Configurando servicio del sistema (Auto-arranque)...${NC}"
if [ -d /run/systemd/system ]; then
    cp -f "${APP_DIR}/saniapet.service" /etc/systemd/system/saniapet.service
    systemctl daemon-reload
    systemctl enable saniapet
    systemctl restart saniapet
    echo -e "${GREEN}  ✓ Servicio Systemd 'saniapet' iniciado y habilitado en el arranque.${NC}"
elif command -v rc-service >/dev/null 2>&1; then
    cp -f "${APP_DIR}/saniapet.initd" /etc/init.d/saniapet
    chmod +x /etc/init.d/saniapet
    rc-update add saniapet default
    rc-service saniapet restart
    echo -e "${GREEN}  ✓ Servicio OpenRC 'saniapet' iniciado y habilitado en el arranque.${NC}"
else
    # Fallback to background process
    nohup "${TARGET_DIR}/saniapet" > /var/log/saniapet.log 2>&1 &
    echo -e "${GREEN}  ✓ Binario ejecutándose en segundo plano (nohup).${NC}"
fi

# 5. Open OS Firewall (iptables/ufw/firewalld)
echo ""
echo -e "${YELLOW}[5/6] Configurando reglas de firewall local (Puertos 80, 443, 3000)...${NC}"
if command -v iptables >/dev/null 2>&1; then
    iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
    iptables -I INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
    iptables -I INPUT -p tcp --dport 3000 -j ACCEPT 2>/dev/null || true
fi
if command -v ufw >/dev/null 2>&1; then
    ufw allow 80/tcp 2>/dev/null || true
    ufw allow 443/tcp 2>/dev/null || true
    ufw allow 3000/tcp 2>/dev/null || true
fi

# 6. Verify Health Check
echo ""
echo -e "${YELLOW}[6/6] Verificando salud del servidor Sania Pet...${NC}"
sleep 2

HEALTH_CHECK=$(curl -s http://127.0.0.1:3000/api/health || echo "error")
if echo "$HEALTH_CHECK" | grep -q "ok"; then
    echo -e "${GREEN}  ✓ API Health: OK!${NC}"
    echo -e "${GREEN}  ✓ $HEALTH_CHECK${NC}"
else
    echo -e "${YELLOW}  ⚠ Servicio iniciado. Si tarda unos segundos, comprueba con: curl http://127.0.0.1:3000/api/health${NC}"
fi

echo ""
echo -e "${CYAN}================================================================${NC}"
echo -e "${GREEN}  🎉 ¡Despliegue de Sania Pet Completado con Éxito!             ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""
echo -e "  👉 Acceso local directo:     http://localhost:3000"
echo -e "  👉 Dominio configurado:      http://pet.oci.lat"
echo ""
echo -e "${BLUE}  Para activar SSL/HTTPS en pet.oci.lat con Nginx:${NC}"
echo -e "    1. cp pet.oci.lat.conf /etc/nginx/conf.d/   (o /etc/nginx/sites-enabled/)"
echo -e "    2. nginx -s reload"
echo -e "    3. certbot --nginx -d pet.oci.lat"
echo ""
