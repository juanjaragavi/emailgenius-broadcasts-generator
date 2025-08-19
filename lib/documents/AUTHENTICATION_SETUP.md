# Configuración de Autenticación - Google Cloud Vertex AI

Esta guía te ayudará a configurar la autenticación para usar Google Cloud Vertex AI con este proyecto tanto en desarrollo local como en un servidor de producción.

## Para Desarrollo Local

### Opción 1: Application Default Credentials (Recomendado)

Esta es la forma más fácil y segura para desarrollo local.

### Paso 1: Instalar Google Cloud CLI

Si no tienes `gcloud` instalado:

**macOS (usando Homebrew):**

```bash
brew install google-cloud-sdk
```

**Otros sistemas operativos:**
Visita: <https://cloud.google.com/sdk/docs/install>

### Paso 2: Configurar gcloud

```bash
# Inicializar gcloud y seleccionar tu proyecto
gcloud init

# Configurar Application Default Credentials
gcloud auth application-default login
```

### Paso 3: Configurar variables de entorno

Crea/edita tu archivo `.env.local`:

```env
GOOGLE_CLOUD_PROJECT=tu-proyecto-google-cloud-id
GOOGLE_CLOUD_LOCATION=us-central1
```

### Paso 4: Verificar configuración

```bash
# Verificar que tienes las credenciales configuradas
gcloud auth application-default print-access-token

# Verificar que tu proyecto tiene Vertex AI habilitado
gcloud services list --enabled --filter="name:aiplatform.googleapis.com"
```

## Para Servidor de Producción (GCP Compute Engine - Ubuntu 22.04 LTS)

### Opción 3: Configuración en Servidor de Producción con Apache 2.0

Esta configuración es específica para un servidor Ubuntu 22.04 LTS en Google Cloud Platform con Apache 2.0.

### Paso 1: Conectar al servidor vía SSH

```bash
# Conectar al servidor desde tu máquina local
ssh usuario@ip-del-servidor

# O si usas gcloud compute
gcloud compute ssh nombre-de-la-instancia --zone=zona-de-la-instancia
```

### Paso 2: Actualizar sistema e instalar dependencias

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar curl y otras herramientas necesarias
sudo apt install -y curl wget gnupg lsb-release ca-certificates

# Instalar Node.js 18+ (requerido para Next.js)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version
npm --version
```

### Paso 3: Instalar Google Cloud CLI en el servidor

```bash
# Agregar el repositorio de Google Cloud CLI
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list

# Importar la clave pública de Google Cloud
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -

# Actualizar e instalar gcloud
sudo apt update && sudo apt install -y google-cloud-cli
```

### Paso 4: Configurar cuenta de servicio para el servidor

**Desde tu máquina local (donde tienes gcloud configurado):**

```bash
# Crear cuenta de servicio específica para el servidor
gcloud iam service-accounts create emailgenius-prod-server \
    --display-name="EmailGenius Production Server" \
    --description="Service account for EmailGenius production deployment"

# Obtener el email de la cuenta de servicio
export SERVICE_ACCOUNT_EMAIL="emailgenius-prod-server@$(gcloud config get-value project).iam.gserviceaccount.com"

# Asignar permisos necesarios
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/ml.developer"

# Crear clave JSON para el servidor
gcloud iam service-accounts keys create emailgenius-prod-credentials.json \
    --iam-account=$SERVICE_ACCOUNT_EMAIL

# Mostrar el contenido para copiarlo al servidor
echo "=== COPIA ESTE CONTENIDO AL SERVIDOR ==="
cat emailgenius-prod-credentials.json
echo "=== FIN DEL CONTENIDO ==="
```

### Paso 5: Transferir credenciales al servidor

**En el servidor, crear el archivo de credenciales:**

```bash
# Crear directorio para credenciales
sudo mkdir -p /opt/emailgenius/credentials
sudo chown $USER:$USER /opt/emailgenius/credentials
chmod 750 /opt/emailgenius/credentials

# Crear el archivo de credenciales (pegar el contenido JSON del paso anterior)
nano /opt/emailgenius/credentials/service-account.json

# Configurar permisos seguros
chmod 600 /opt/emailgenius/credentials/service-account.json

# Configurar variable de entorno global
echo 'export GOOGLE_APPLICATION_CREDENTIALS="/opt/emailgenius/credentials/service-account.json"' | sudo tee -a /etc/environment

# Recargar variables de entorno
source /etc/environment
```

### Paso 6: Clonar y configurar el proyecto

```bash
# Clonar el repositorio
cd /opt
sudo git clone https://github.com/tu-usuario/emailgenius-broadcasts-generator.git
sudo chown -R $USER:$USER emailgenius-broadcasts-generator
cd emailgenius-broadcasts-generator

# Instalar dependencias
npm install

# Crear archivo de configuración de producción
cp .env.example .env.production

# Editar variables de entorno
nano .env.production
```

**Contenido de `.env.production`:**

```env
GOOGLE_CLOUD_PROJECT=tu-proyecto-google-cloud-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/opt/emailgenius/credentials/service-account.json
NODE_ENV=production
PORT=3000
```

### Paso 7: Configurar Apache como proxy reverso

```bash
# Habilitar módulos necesarios de Apache
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_balancer
sudo a2enmod lbmethod_byrequests

# Crear configuración del sitio
sudo nano /etc/apache2/sites-available/emailgenius.conf
```

**Contenido de `/etc/apache2/sites-available/emailgenius.conf`:**

```apache
<VirtualHost *:80>
    ServerName tu-dominio.com
    ServerAlias www.tu-dominio.com

    # Proxy para Next.js
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    # Configuración de headers
    ProxyPreserveHost On
    ProxyRequests Off

    # Logs
    ErrorLog ${APACHE_LOG_DIR}/emailgenius_error.log
    CustomLog ${APACHE_LOG_DIR}/emailgenius_access.log combined
</VirtualHost>
```

### Paso 8: Habilitar el sitio y reiniciar Apache

```bash
# Habilitar el sitio
sudo a2ensite emailgenius.conf

# Deshabilitar sitio por defecto (opcional)
sudo a2dissite 000-default.conf

# Verificar configuración
sudo apache2ctl configtest

# Reiniciar Apache
sudo systemctl restart apache2

# Verificar estado
sudo systemctl status apache2
```

### Paso 9: Crear servicio systemd para Next.js

```bash
# Crear archivo de servicio
sudo nano /etc/systemd/system/emailgenius.service
```

**Contenido de `/etc/systemd/system/emailgenius.service`:**

```ini
[Unit]
Description=EmailGenius Next.js Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/emailgenius-broadcasts-generator
Environment=NODE_ENV=production
Environment=GOOGLE_APPLICATION_CREDENTIALS=/opt/emailgenius/credentials/service-account.json
Environment=GOOGLE_CLOUD_PROJECT=tu-proyecto-google-cloud-id
Environment=GOOGLE_CLOUD_LOCATION=us-central1
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Paso 10: Construir y ejecutar la aplicación

```bash
# Construir la aplicación para producción
npm run build

# Habilitar e iniciar el servicio
sudo systemctl enable emailgenius.service
sudo systemctl start emailgenius.service

# Verificar estado del servicio
sudo systemctl status emailgenius.service

# Ver logs si hay problemas
sudo journalctl -u emailgenius.service -f
```

### Paso 11: Configurar firewall (si está habilitado)

```bash
# Permitir tráfico HTTP y HTTPS
sudo ufw allow 'Apache Full'

# Verificar reglas
sudo ufw status
```

## Para Desarrollo Local - Archivo de Cuenta de Servicio

### Opción 2: Archivo de Cuenta de Servicio (Alternativa)

Si prefieres usar un archivo de cuenta de servicio para desarrollo:

### Paso 1: Crear cuenta de servicio

```bash
# Crear una cuenta de servicio
gcloud iam service-accounts create emailgenius-service-account \
    --display-name="EmailGenius Service Account"

# Obtener el email de la cuenta de servicio
export SERVICE_ACCOUNT_EMAIL="emailgenius-service-account@$(gcloud config get-value project).iam.gserviceaccount.com"

# Asignar permisos necesarios
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/aiplatform.user"
```

### Paso 2: Crear y descargar clave

```bash
# Crear clave JSON
gcloud iam service-accounts keys create ~/emailgenius-service-account.json \
    --iam-account=$SERVICE_ACCOUNT_EMAIL

# Configurar variable de entorno
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/emailgenius-service-account.json"
```

### Paso 3: Configurar variables de entorno locales

Agrega a tu archivo `.env.local`:

```env
GOOGLE_CLOUD_PROJECT=tu-proyecto-google-cloud-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/Users/tu-usuario/emailgenius-service-account.json
```

## Verificación y Monitoreo del Servidor

### Verificar que todo funciona correctamente

```bash
# Verificar estado del servicio Next.js
sudo systemctl status emailgenius.service

# Verificar estado de Apache
sudo systemctl status apache2

# Verificar conectividad desde el servidor
curl -X POST http://localhost:3000/api/generate-broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "ConvertKit",
    "emailType": "Alerta de seguridad",
    "market": "USA",
    "imageType": "Producto"
  }'

# Verificar desde el exterior (reemplaza con tu IP/dominio)
curl -X POST http://tu-servidor.com/api/generate-broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "ConvertKit",
    "emailType": "Alerta de seguridad",
    "market": "USA",
    "imageType": "Producto"
  }'
```

### Comandos útiles para monitoreo

```bash
# Ver logs del servicio Next.js
sudo journalctl -u emailgenius.service -f

# Ver logs de Apache
sudo tail -f /var/log/apache2/emailgenius_error.log
sudo tail -f /var/log/apache2/emailgenius_access.log

# Verificar puertos abiertos
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :80

# Verificar espacio en disco
df -h

# Verificar memoria
free -h

# Reiniciar servicios si es necesario
sudo systemctl restart emailgenius.service
sudo systemctl restart apache2
```

## Permisos Necesarios

Tu cuenta de usuario o cuenta de servicio necesita los siguientes permisos:

- `roles/aiplatform.user` - Para usar Vertex AI
- `roles/ml.developer` - Para generar contenido con modelos ML

## Solución de Problemas

### Problemas Comunes en Desarrollo Local

#### Error: "Project not found"

```bash
# Verificar que el proyecto existe y tienes acceso
gcloud projects describe tu-proyecto-id
```

#### Error: "Permission denied"

```bash
# Verificar permisos del usuario actual
gcloud projects get-iam-policy tu-proyecto-id \
    --flatten="bindings[].members" \
    --format="table(bindings.role)" \
    --filter="bindings.members:$(gcloud config get-value account)"
```

#### Error: "Vertex AI API not enabled"

```bash
# Habilitar la API de Vertex AI
gcloud services enable aiplatform.googleapis.com
```

### Problemas Comunes en Servidor de Producción

#### Error: "Service failed to start"

```bash
# Verificar logs detallados
sudo journalctl -u emailgenius.service -n 50

# Verificar permisos de archivos
ls -la /opt/emailgenius/credentials/
ls -la /opt/emailgenius-broadcasts-generator/

# Verificar variables de entorno
sudo systemctl show emailgenius.service --property=Environment
```

#### Error: "Apache proxy not working"

```bash
# Verificar configuración de Apache
sudo apache2ctl configtest

# Verificar módulos habilitados
sudo apache2ctl -M | grep proxy

# Verificar puertos
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3000
```

#### Error: "GOOGLE_APPLICATION_CREDENTIALS not found"

```bash
# Verificar que el archivo existe
ls -la /opt/emailgenius/credentials/service-account.json

# Verificar contenido del archivo (sin mostrar claves privadas)
head -5 /opt/emailgenius/credentials/service-account.json

# Verificar variable de entorno
echo $GOOGLE_APPLICATION_CREDENTIALS
```

#### Error: "Port 3000 already in use"

```bash
# Verificar qué proceso usa el puerto
sudo lsof -i :3000

# Detener proceso si es necesario
sudo systemctl stop emailgenius.service

# Cambiar puerto en la configuración si es necesario
sudo nano /etc/systemd/system/emailgenius.service
```

### Actualizaciones y Mantenimiento del Servidor

#### Actualizar código de la aplicación

```bash
# Conectar al servidor
ssh usuario@ip-del-servidor

# Ir al directorio del proyecto
cd /opt/emailgenius-broadcasts-generator

# Hacer backup de la configuración actual
cp .env.production .env.production.backup

# Actualizar código
sudo git pull origin main

# Instalar nuevas dependencias si las hay
npm install

# Reconstruir la aplicación
npm run build

# Reiniciar el servicio
sudo systemctl restart emailgenius.service

# Verificar que funciona
sudo systemctl status emailgenius.service
```

#### Rotar credenciales de la cuenta de servicio

```bash
# Desde tu máquina local, crear nueva clave
gcloud iam service-accounts keys create emailgenius-prod-credentials-new.json \
    --iam-account=emailgenius-prod-server@tu-proyecto.iam.gserviceaccount.com

# Transferir al servidor y reemplazar archivo
scp emailgenius-prod-credentials-new.json usuario@ip-del-servidor:/tmp/

# En el servidor
sudo mv /tmp/emailgenius-prod-credentials-new.json /opt/emailgenius/credentials/service-account.json
sudo chown www-data:www-data /opt/emailgenius/credentials/service-account.json
sudo chmod 600 /opt/emailgenius/credentials/service-account.json

# Reiniciar servicio
sudo systemctl restart emailgenius.service

# Desde tu máquina local, eliminar clave antigua
gcloud iam service-accounts keys list --iam-account=emailgenius-prod-server@tu-proyecto.iam.gserviceaccount.com
gcloud iam service-accounts keys delete KEY_ID --iam-account=emailgenius-prod-server@tu-proyecto.iam.gserviceaccount.com
```

## Configuración de SSL/HTTPS (Recomendado para Producción)

### Instalar Certbot para SSL gratuito con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-apache

# Obtener certificado SSL (reemplaza con tu dominio)
sudo certbot --apache -d tu-dominio.com -d www.tu-dominio.com

# Verificar renovación automática
sudo certbot renew --dry-run

# Configurar renovación automática
sudo crontab -e
# Agregar línea:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

Si recibes una respuesta JSON con el contenido del email, ¡la configuración está completa!

## Recursos Adicionales

- [Documentación de Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials)
- [Documentación de Vertex AI](https://cloud.google.com/vertex-ai/docs)
- [Configuración de permisos IAM](https://cloud.google.com/iam/docs/understanding-roles)
