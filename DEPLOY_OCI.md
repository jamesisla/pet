# Guía de Despliegue en Oracle Cloud Infrastructure (OCI)

### Instancia: `VM.Standard.E2.1.Micro` (1 OCPU, 1 GB RAM)
### Dominio: `pet.oci.lat`

Esta guía te permite desplegar **Sania Pet v2** de forma nativa en tu servidor OCI, eliminando el overhead de contenedores (Docker) y reduciendo el consumo de memoria a **< 10 MB de RAM** con tiempos de respuesta menores a **2 ms**.

---

## 📋 Diagnóstico del Servidor (Análisis de `output.txt`)

En el estado inicial del servidor, **Docker y sus servicios asociados consumían más del 35% de la memoria total (más de 350 MB de RAM)**:
- `dockerd`: ~201 MB (20.8% RAM)
- `containerd`: ~43 MB (4.4% RAM)
- `containerd-shim-runc-v2`: ~21 MB (2.2% RAM)
- `postgres` (en contenedor) y `docker-proxy`: ~10 MB
- Múltiples procesos `log_proxy`

Con el script de optimización `optimize-server.sh`, estos servicios se **detienen y deshabilitan permanentemente del arranque del sistema**, recuperando la memoria y dejando el servidor en un consumo basal de **~35 MB de RAM**.

---

## 🚀 Pasos de Despliegue

### Paso 1: Configuración en la Consola de OCI y DNS

1. **Lista de Seguridad de OCI (Virtual Cloud Network - VCN)**:
   - Ve a **Networking** → **Virtual Cloud Networks** → Tu VCN → **Security Lists** → **Default Security List**.
   - Agrega las siguientes reglas de entrada (**Ingress Rules**):
     - **Source CIDR**: `0.0.0.0/0` | **IP Protocol**: `TCP` | **Destination Port**: `80` (HTTP)
     - **Source CIDR**: `0.0.0.0/0` | **IP Protocol**: `TCP` | **Destination Port**: `443` (HTTPS)
     - **Source CIDR**: `0.0.0.0/0` | **IP Protocol**: `TCP` | **Destination Port**: `3000` (Direct Go Access)
2. **Configuración de DNS**:
   - Crea un registro **A** en tu proveedor de DNS:
     - **Host / Nombre**: `pet`
     - **Tipo**: `A`
     - **Valor**: `<IP-PÚBLICA-DE-TU-INSTANCIA-OCI>`

---

### Paso 2: Conectarse al Servidor y Clonar el Repositorio

Conéctate por SSH a tu instancia:
```bash
ssh ubuntu@<TU-IP-PUBLICA-OCI>
# O si es Alpine:
# ssh alpine@<TU-IP-PUBLICA-OCI>
```

Clona el repositorio desde GitHub:
```bash
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git saniv2
cd saniv2
```

---

### Paso 3: Ejecutar Script de Optimización del Servidor

Ejecuta el script para bajar y deshabilitar Docker permanentemente, configurar Swap de 1GB y optimizar el kernel:
```bash
sudo bash optimize-server.sh
```

> **¿Qué hace este script?**
> 1. Detiene todos los contenedores y daemons de Docker/containerd.
> 2. Deshabilita Docker en el gestor de arranque (`systemd` o `OpenRC`) para que **nunca vuelva a iniciar tras reiniciar**.
> 3. Crea y activa un archivo Swap de seguridad de 1GB en `/swapfile`.
> 4. Aplica parámetros del kernel para baja latencia (`vm.swappiness = 10`, `fs.file-max = 65535`).

---

### Paso 4: Desplegar la Aplicación Sania Pet

Ejecuta el script de despliegue automatizado:
```bash
sudo bash deploy.sh
```

> **¿Qué hace este script?**
> 1. Compila el binario ultraoptimizado en Go (`saniapet`, ~10 MB).
> 2. Instala los archivos en `/opt/saniv2/`.
> 3. Configura el servicio del sistema (`saniapet.service` o `saniapet.initd`) con autoarranque.
> 4. Abre los puertos en el firewall local (iptables / ufw).
> 5. Verifica el estado de salud de la API (`/api/health`).

---

### Paso 5: Configurar Nginx y Certificado SSL (HTTPS) para `pet.oci.lat`

#### A. Si estás en **Alpine Linux**:
```bash
# 1. Instalar Nginx y Certbot
sudo apk update && sudo apk add nginx certbot certbot-nginx

# 2. Crear directorios y copiar configuración (En Alpine se usa http.d)
sudo mkdir -p /etc/nginx/http.d /etc/nginx/conf.d
sudo cp pet.oci.lat.conf /etc/nginx/http.d/pet.oci.lat.conf

# 3. Iniciar y habilitar Nginx en OpenRC
sudo rc-update add nginx default
sudo rc-service nginx restart

# 4. Obtener Certificado SSL Gratuito
sudo certbot --nginx -d pet.oci.lat
```

#### B. Si estás en **Ubuntu / Debian**:
```bash
# 1. Instalar Nginx y Certbot
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Copiar configuración
sudo mkdir -p /etc/nginx/conf.d
sudo cp pet.oci.lat.conf /etc/nginx/conf.d/pet.oci.lat.conf

# 3. Recargar Nginx
sudo nginx -t && sudo systemctl reload nginx

# 4. Obtener Certificado SSL Gratuito
sudo certbot --nginx -d pet.oci.lat
```

¡Listo! Tu aplicación estará disponible de forma segura y ultrarrápida en **`https://pet.oci.lat`**.

---

## 🛠️ Comandos de Operación y Monitoreo

- **Ver estado del servicio**:
  ```bash
  sudo systemctl status saniapet
  # En Alpine:
  # sudo rc-service saniapet status
  ```

- **Ver logs en tiempo real**:
  ```bash
  sudo journalctl -u saniapet -f
  ```

- **Reiniciar servicio**:
  ```bash
  sudo systemctl restart saniapet
  # En Alpine:
  # sudo rc-service saniapet restart
  ```

- **Comprobar uso de RAM y CPU**:
  ```bash
  free -h
  top
  ```

- **Respaldar datos de mascotas**:
  ```bash
  cp /opt/saniv2/data/pets.json /opt/saniv2/data/pets_backup.json
  ```
