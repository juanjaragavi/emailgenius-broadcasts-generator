# EmailGenius - Generador de Broadcasts

Una aplicación Next.js para generar broadcasts de email optimizados para ConvertKit y ActiveCampaign usando Google Vertex AI.

## Características

- ✨ Interfaz de usuario intuitiva en español
- 🚀 Generación de contenido usando Google Vertex AI Gemini
- 📧 Soporte para ConvertKit y ActiveCampaign
- 🌐 Contenido multiidioma (Inglés/Español)
- 🎯 Optimizado para alta engagement y CTR
- 📱 Diseño responsive con Tailwind CSS

## Configuración

### Prerequisitos

- Node.js 18+
- NPM o Yarn
- Cuenta de Google Cloud con Vertex AI habilitado
- Google Cloud CLI (gcloud) instalado

### Instalación

1. Clona el repositorio:

   ```bash
   git clone <repository-url>
   cd emailgenius-broadcasts-generator
   ```

2. Instala las dependencias requeridas:

   ```bash
   npm install
   ```

3. Configura las variables de entorno:

   ```bash
   cp .env.example .env.local
   ```

4. Edita `.env.local` con tu configuración de Google Cloud:

   ```env
   GOOGLE_CLOUD_PROJECT=tu-proyecto-google-cloud-id
   GOOGLE_CLOUD_LOCATION=us-central1
   ```

5. Configura la autenticación (elige una opción):

   **Opción A: Application Default Credentials (Recomendado para desarrollo local)**

   ```bash
   # Instala Google Cloud CLI si no lo tienes
   # https://cloud.google.com/sdk/docs/install

   # Inicializa gcloud
   gcloud init

   # Auténticate para Application Default Credentials
   gcloud auth application-default login
   ```

   **Opción B: Archivo de clave de cuenta de servicio**

   ```bash
   # Descarga la clave JSON de tu cuenta de servicio desde Google Cloud Console
   # Guárdala en un lugar seguro (ej: ~/.gcp/service-account-key.json)

   # Configura la variable de entorno
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
   ```

6. Ejecuta el servidor de desarrollo:

   ```bash
   npm run dev
   ```

7. Abre [http://localhost:3020](http://localhost:3020) en tu navegador.

### Configuración de Base de Datos (PostgreSQL)

Esta aplicación utiliza una base de datos PostgreSQL (Google Cloud SQL) para almacenar el historial de broadcasts y sesiones.

1. **Variables de Entorno**: Asegúrate de que tu `.env.local` tenga las credenciales de la base de datos:

   ```env
   DB_HOST=34.16.99.221
   DB_PORT=5432
   DB_NAME=emailgenius
   DB_USER=postgres
   DB_PASSWORD=tu_password
   ```

2. **Inicialización de Schema**:
   Para crear las tablas necesarias, ejecuta el script de inicialización:

   ```bash
   npx tsx scripts/init-db.ts
   ```

3. **Verificación**:
   Puedes verificar que la base de datos está conectada y las tablas existen con:

   ```bash
   npx tsx scripts/verify-db.ts
   ```

## Configuración del Proyecto

### Dependencias

Las dependencias principales incluyen:

- `@google-cloud/vertexai` - SDK de Google Cloud Vertex AI
- `next` - Framework de React
- `react-hook-form` - Manejo de formularios
- `@radix-ui/*` - Componentes de UI
- `tailwindcss` - CSS framework

Todas las dependencias se instalan automáticamente con `npm install`.

### Autenticación

Esta aplicación utiliza Google Cloud Vertex AI con autenticación de cuenta de servicio a través de Application Default Credentials (ADC).

**Métodos de autenticación soportados:**

1. **Application Default Credentials (Recomendado para desarrollo)**

   ```bash
   gcloud auth application-default login
   ```

2. **Variable de entorno GOOGLE_APPLICATION_CREDENTIALS**

   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
   ```

3. **Cuenta de servicio adjunta** (cuando se ejecuta en Google Cloud Platform)

Para más información sobre configuración de autenticación, visita la [documentación oficial de Google Cloud](https://cloud.google.com/docs/authentication/application-default-credentials).

## Uso

1. **Selecciona la plataforma**: ConvertKit o ActiveCampaign
2. **Elige el tipo de email**: Alerta de seguridad, actualización de envío, etc.
3. **Selecciona el mercado**: USA, UK (Inglés) o México (Español)
4. **Tipo de imagen**: Producto, estilo de vida, infografía, etc.
5. **URL de referencia** (opcional): Para contexto adicional
6. **Instrucciones adicionales** (opcional): Especificaciones personalizadas
7. **Genera el broadcast**: Haz clic en "Generar Broadcast"

## Estructura del Proyecto

```markdown
emailgenius-broadcasts-generator/
├── app/
│ ├── api/
│ │ └── generate-broadcast/
│ │ └── route.ts
│ ├── globals.css
│ ├── layout.tsx
│ └── page.tsx
├── components/
│ └── ui/
│ ├── button.tsx
│ ├── card.tsx
│ ├── input.tsx
│ ├── label.tsx
│ ├── select.tsx
│ └── textarea.tsx
├── lib/
│ ├── documents/
│ ├── images/
│ ├── scripts/
│ └── utils.ts
├── .env.example
├── .env.local
├── next.config.js
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Tecnologías

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Forms**: React Hook Form
- **AI**: Google Cloud Vertex AI (Gemini 1.5 Pro)
- **Authentication**: Google Cloud Application Default Credentials
- **Icons**: Lucide React

## Características de los Broadcasts

### ConvertKit

- Líneas de asunto A/B test
- Texto de vista previa
- Cuerpo del email con personalización
- Texto del botón CTA
- Prompt para generación de imagen

### ActiveCampaign

- Línea de asunto
- Preheader
- Nombre del remitente
- Email del remitente
- Cuerpo del email con personalización
- Texto del botón CTA
- Prompt para generación de imagen

## Configuración de Google Cloud

1. Crea un proyecto en Google Cloud Console
2. Habilita la API de Vertex AI
3. Crea una cuenta de servicio con permisos de Vertex AI
4. Descarga la clave JSON y extrae el email y la clave privada
5. Configura las variables de entorno

## Scripts Disponibles

- `npm run dev` - Ejecuta el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm start` - Ejecuta la aplicación en modo producción
- `npm run lint` - Ejecuta el linter

## Recent Updates / Actualizaciones Recientes

### ✅ Rich Text Copy Fix (Agosto 2025)

Fixed the issue where HTML content copied from the application and pasted into ActiveCampaign's rich text editor would display raw HTML tags instead of formatted text.

**Solucionado**: El problema donde el contenido HTML copiado de la aplicación y pegado en el editor de texto enriquecido de ActiveCampaign mostraba etiquetas HTML sin procesar en lugar de texto formateado.

**Key improvements / Mejoras principales**:

- 🔧 **Rich Text Copying**: Content now copies as both HTML and plain text for maximum compatibility
- 🎯 **Platform-Specific Formatting**: ActiveCampaign gets HTML, ConvertKit gets markdown
- 📋 **Universal Compatibility**: Works with both rich text and plain text editors
- 🔄 **Automatic Conversion**: Markdown automatically converts to HTML for rich text editors

**Technical details / Detalles técnicos**: See `RICH_TEXT_COPY_FIX.md` and `ACTIVECAMPAIGN_FORMATTING_FIX.md`

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Soporte

Para preguntas o soporte, por favor contacta a través de los issues del repositorio.
