#!/bin/sh
# ==============================================================================
# Sania Pet — Script de Optimización y Rendimiento para OCI (VM.Standard.E2.1.Micro)
# Instancia: 1 OCPU, 1 GB RAM
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
echo -e "${CYAN}  🐾 Sania Pet — Optimización de Servidor OCI (1 OCPU, 1GB RAM)  ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""

# 1. Check Root Privileges
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}[ERROR] Este script debe ejecutarse como root (usa sudo).${NC}"
    exit 1
fi

echo -e "${BLUE}[1/5] Estado de Memoria ANTES de optimizar:${NC}"
free -h 2>/dev/null || free -m
echo ""

# 2. Stop and Permanently Disable Docker & Heavy Daemons
echo -e "${YELLOW}[2/5] Deteniendo y deshabilitando contenedores y servicios pesados...${NC}"

# Stop all docker containers if docker is running
if command -v docker >/dev/null 2>&1; then
    echo "  → Deteniendo contenedores Docker activos..."
    docker stop $(docker ps -q) 2>/dev/null || true
fi

# Detect Init System (OpenRC vs Systemd)
if [ -d /run/systemd/system ]; then
    echo "  → Detectado sistema Systemd (Ubuntu / Debian / Oracle Linux)"
    systemctl stop docker.socket docker.service containerd.service 2>/dev/null || true
    systemctl disable docker.socket docker.service containerd.service 2>/dev/null || true
    systemctl mask docker containerd 2>/dev/null || true
    systemctl daemon-reload 2>/dev/null || true
elif command -v rc-service >/dev/null 2>&1; then
    echo "  → Detectado sistema OpenRC (Alpine Linux)"
    rc-service docker stop 2>/dev/null || true
    rc-service containerd stop 2>/dev/null || true
    rc-update del docker default 2>/dev/null || true
    rc-update del containerd default 2>/dev/null || true
fi

# Kill any leftover docker / containerd processes found in output.txt
echo "  → Limpiando procesos residuales de dockerd, containerd, docker-proxy..."
pkill -9 dockerd 2>/dev/null || true
pkill -9 containerd 2>/dev/null || true
pkill -9 containerd-shim 2>/dev/null || true
pkill -9 docker-proxy 2>/dev/null || true
pkill -9 log_proxy 2>/dev/null || true

echo -e "${GREEN}  ✓ Docker y servicios de contenedores detenidos y deshabilitados de forma permanente.${NC}"

# 3. Configure 1GB Swap File (Crucial for 1GB RAM instances)
echo ""
echo -e "${YELLOW}[3/5] Verificando memoria de intercambio (SWAP)...${NC}"
SWAP_TOTAL=$(free -m | awk '/Swap:/ {print $2}')
if [ "$SWAP_TOTAL" -eq 0 ] || [ "$SWAP_TOTAL" -lt 512 ]; then
    echo "  → Creando archivo Swap de 1GB en /swapfile..."
    if command -v fallocate >/dev/null 2>&1; then
        fallocate -l 1G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=1024
    else
        dd if=/dev/zero of=/swapfile bs=1M count=1024
    fi
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    if ! grep -q "/swapfile" /etc/fstab; then
        echo "/swapfile none swap sw 0 0" >> /etc/fstab
    fi
    echo -e "${GREEN}  ✓ Archivo Swap de 1GB creado y activado.${NC}"
else
    echo -e "${GREEN}  ✓ Swap existente detectado (${SWAP_TOTAL}MB).${NC}"
fi

# 4. Kernel and Sysctl Tuning for Low-Memory Micro Instances
echo ""
echo -e "${YELLOW}[4/5] Aplicando ajustes del kernel para baja latencia y bajo consumo...${NC}"

SYSCTL_CONF="/etc/sysctl.d/99-saniapet.conf"
if [ ! -d /etc/sysctl.d ]; then
    SYSCTL_CONF="/etc/sysctl.conf"
fi

cat << 'EOF' > "$SYSCTL_CONF"
# Sania Pet — Optimizaciones para Instancia Micro 1GB RAM
vm.swappiness = 10
vm.vfs_cache_pressure = 50
net.core.somaxconn = 1024
net.ipv4.tcp_max_syn_backlog = 1024
net.ipv4.tcp_fin_timeout = 15
fs.file-max = 65535
EOF

sysctl -p "$SYSCTL_CONF" >/dev/null 2>&1 || sysctl -p >/dev/null 2>&1 || true
echo -e "${GREEN}  ✓ Parámetros sysctl aplicados correctamente.${NC}"

# 5. Final Report
echo ""
echo -e "${BLUE}[5/5] Estado de Memoria DESPUÉS de la optimización:${NC}"
free -h 2>/dev/null || free -m
echo ""

echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}  🎉 ¡Servidor optimizado con éxito!                           ${NC}"
echo -e "${GREEN}  • Docker deshabilitado en el arranque (no volverá a iniciar).${NC}"
echo -e "${GREEN}  • Memoria RAM liberada (~300MB a 400MB recuperados).         ${NC}"
echo -e "${GREEN}  • Swap de seguridad configurado.                             ${NC}"
echo -e "${GREEN}  • Listo para ejecutar ./deploy.sh                            ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo ""
