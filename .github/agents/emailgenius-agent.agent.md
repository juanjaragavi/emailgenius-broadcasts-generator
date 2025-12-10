---
description: "EmailGeinus Agent is an advanced world-class LLM-powered Coding Agent, which is the developer of the EmailGenius Broadcasts Generator project, located at the `/Users/macbookpro/GitHub/emailgenius-broadcasts-generator/`. This project represents a sophisticated AI-powered marketing tool with advanced clipboard integration, multi-platform email generation capabilities, service account authentication, and enterprise-grade production deployment architecture."
tools:
  [
    "edit",
    "runNotebooks",
    "search",
    "new",
    "runCommands",
    "runTasks",
    "Copilot Container Tools/*",
    "chrome-devtools/*",
    "context7/*",
    "usages",
    "vscodeAPI",
    "problems",
    "changes",
    "testFailure",
    "openSimpleBrowser",
    "fetch",
    "githubRepo",
    "github.vscode-pull-request-github/copilotCodingAgent",
    "github.vscode-pull-request-github/issue_fetch",
    "github.vscode-pull-request-github/suggest-fix",
    "github.vscode-pull-request-github/searchSyntax",
    "github.vscode-pull-request-github/doSearch",
    "github.vscode-pull-request-github/renderIssues",
    "github.vscode-pull-request-github/activePullRequest",
    "github.vscode-pull-request-github/openPullRequest",
    "ms-python.python/getPythonEnvironmentInfo",
    "ms-python.python/getPythonExecutableCommand",
    "ms-python.python/installPythonPackage",
    "ms-python.python/configurePythonEnvironment",
    "extensions",
    "todos",
    "runSubagent",
  ]
---

# Project Guidelines

## Project Overview

EmailGenius Broadcasts Generator is an AI-powered email broadcast creation tool that uses Google Cloud Vertex AI (Gemini 2.5 Flash) to generate high-engagement email campaigns optimized for both ConvertKit and ActiveCampaign platforms. The application specializes in creating financial product marketing emails that mimic transactional communications to maximize open rates and conversions.

## Production Environment Setup

The application is deployed on a Google Cloud Platform (GCP) Compute Engine VM running Ubuntu 22.04 LTS with Apache 2.0. The project is owned by the `www-data` user for proper web server permissions.

### Important: User Context

**All development and deployment commands must be run with `sudo -u www-data` prefix** to maintain proper file ownership and permissions in the production environment.

## Development Commands

### Core Next.js Commands (Production Environment)

```bash
# Development server (runs on port 3020) - Production environment
sudo -u www-data npm run dev

# Production build - Production environment
sudo -u www-data npm run build

# Start production server - Production environment
sudo -u www-data npm start

# ESLint linting - Production environment
sudo -u www-data npm run lint

# Install dependencies - Production environment
sudo -u www-data npm install
```

### Project Setup (Production Environment)

```bash
# Navigate to project directory
cd /var/www/html/emailgenius-broadcasts-generator

# Install dependencies
sudo -u www-data npm install

# Copy environment template (if needed)
sudo -u www-data cp .env.example .env.local

# Edit environment variables as www-data user
sudo -u www-data nano .env.local
```

### Google Cloud Authentication Setup (Production)

The application now uses **service account credentials via environment variables** instead of Application Default Credentials (ADC). The authentication is configured in the PM2 ecosystem configuration.

**Current Authentication Method:**

- Service Account Email: `sheets-service-account@absolute-brook-452020-d5.iam.gserviceaccount.com`
- Private Key: Stored as environment variable in `ecosystem.config.js`
- Project: `absolute-brook-452020-d5`
- Location: `us-central1`

**Required Service Account Permissions:**

- Vertex AI User (`roles/aiplatform.user`)

## Architecture Overview

### AI Integration

- **Primary AI Service**: Google Cloud Vertex AI using Gemini 1.5 Pro model
- **Authentication**: Service Account Credentials via environment variables with ADC fallback
- **Request Processing**: JSON-based system prompts with comprehensive email generation rules

### Frontend Architecture

- **Framework**: Next.js 15 with React 19
- **UI Components**: Radix UI with shadcn/ui design system
- **Styling**: Tailwind CSS with custom gradient themes
- **Form Management**: React Hook Form for type-safe form handling
- **Icons**: Lucide React icon library

### Backend API

- **API Route**: `/api/generate-broadcast` - Processes form data and generates email content
- **Content Format**: Structured JSON responses with platform-specific formatting
- **Error Handling**: Comprehensive error parsing and user-friendly messages
- **Authentication**: Supports both service account credentials and ADC fallback

### Rich Text Copy System

- **Advanced Clipboard API**: Uses ClipboardItem for multi-format copying
- **Platform Detection**: Automatically detects HTML vs Markdown content
- **Markdown Processing**: Uses `marked` library to convert markdown to HTML
- **Cross-Platform Compatibility**: Works with both rich text and plain text editors

## Key Technical Features

### Dual Platform Support

The system generates different content formats for each platform:

#### ConvertKit Format

- A/B test subject lines (2 variants)
- Preview text under 150 characters
- Markdown-formatted email body with `{{ subscriber.first_name }}` variable
- CTA button text under 5 words
- Image generation prompt

#### ActiveCampaign Format

- Single subject line with emoji
- Preheader text
- From Name (corporate department)
- From Email (market-specific: `topfinance@topfinanzas.com` for US/UK, `info@topfinanzas.com` for Mexico)
- Natural text formatted email body with `%FIRSTNAME%` variable
- CTA button text and destination URL with UTM parameters

### Multi-Market Content Generation

- **USA/UK Markets**: English content with US/UK cultural adaptation
- **Mexico Market**: Spanish content with Mexican cultural nuances
- **UTM Tracking**: Automatic UTM parameter generation based on platform and market

### Email Content Strategy

The AI system specializes in creating:

- Security alerts and account notifications
- Shipping and delivery updates
- Account status confirmations
- Product dispatch notifications
- Financial product promotions disguised as transactional emails

### Advanced Copy Functionality

- **Rich Text Support**: Copies content as both HTML and plain text
- **Platform Optimization**: ActiveCampaign gets HTML, ConvertKit gets markdown
- **Automatic Conversion**: Markdown automatically converts to HTML for rich text editors
- **Fallback Support**: Graceful degradation for older browsers

## Environment Variables (Production)

### Current Production Configuration

The production environment uses service account credentials stored in the PM2 ecosystem configuration:

```env
# Google Cloud Project Configuration
GOOGLE_CLOUD_PROJECT=absolute-brook-452020-d5
GOOGLE_CLOUD_LOCATION=us-central1

# Service Account Authentication (via ecosystem.config.js)
GOOGLE_SERVICE_ACCOUNT_EMAIL=sheets-service-account@absolute-brook-452020-d5.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[PRIVATE_KEY_CONTENT]\n-----END PRIVATE KEY-----"

# Additional Vertex AI Configuration
VERTEX_AI_DATASTORE=projects/absolute-brook-452020-d5/locations/global/collections/default_collection/dataStores/ejemplos-y-plantillas-folder-august-2025_1753117635099
VERTEX_AI_PROJECT_ID=absolute-brook-452020-d5
VERTEX_AI_LOCATION=global

# Application Configuration
PORT=3020
NODE_ENV=production
```

### Alternative Authentication Methods

The application supports multiple authentication methods with automatic fallback:

1. **Service Account Credentials** (Current Production Method)
2. **Application Default Credentials** (ADC) - Fallback method
3. **Service Account JSON Key File** (Alternative)

## Production Deployment Commands

### PM2 Process Management (Production Environment)

```bash
# Check application status
sudo -u www-data pm2 status

# Start application with ecosystem configuration
sudo -u www-data pm2 start ecosystem.config.js --env production

# Restart application
sudo -u www-data pm2 restart emailgenius-broadcasts-generator

# Stop application
sudo -u www-data pm2 stop emailgenius-broadcasts-generator

# Reload application (zero-downtime)
sudo -u www-data pm2 reload emailgenius-broadcasts-generator

# View logs
sudo -u www-data pm2 logs emailgenius-broadcasts-generator

# View specific number of log lines
sudo -u www-data pm2 logs emailgenius-broadcasts-generator --lines 50

# Save PM2 configuration
sudo -u www-data pm2 save
```

### Build and Deploy Workflow (Production Environment)

```bash
# Navigate to project directory
cd /var/www/html/emailgenius-broadcasts-generator

# Install dependencies
sudo -u www-data npm install

# Build application
sudo -u www-data npm run build

# Restart PM2 process
sudo -u www-data pm2 restart emailgenius-broadcasts-generator

# Check status
sudo -u www-data pm2 status

# View logs to verify successful restart
sudo -u www-data pm2 logs emailgenius-broadcasts-generator --lines 20
```

### Git Operations (Production Environment)

```bash
# Check git status
sudo -u www-data git status

# Pull latest changes
sudo -u www-data git pull origin main

# Add files to staging
sudo -u www-data git add [files]

# Commit changes
sudo -u www-data git commit -m "Your commit message"

# Push changes
sudo -u www-data git push origin main

# View git log
sudo -u www-data git log --oneline -10
```

## Project Structure Deep Dive

### Key Files and Their Purposes

```markdown
app/
├── api/generate-broadcast/route.ts # Main AI API endpoint with service account authentication
├── page.tsx # Main application with form handling and rich text copying
├── layout.tsx # App layout with Poppins font and gradient background
└── globals.css # Global styles and Tailwind configuration

components/ui/ # Shadcn/ui components
├── button.tsx # Reusable button component with variants
├── card.tsx # Card layout components
├── input.tsx # Form input components
├── label.tsx # Form label components
├── select.tsx # Dropdown select components
└── textarea.tsx # Textarea form components

lib/
├── utils.ts # Tailwind class merging utility
├── documents/ # Comprehensive project documentation
│ ├── emailgenius-broadcasts-generator-system-prompt.md
│ ├── RICH_TEXT_COPY_FIX.md # Technical documentation for copy functionality
│ └── [other technical docs]
└── images/ # UI screenshots for reference

# Production Configuration Files

ecosystem.config.js # PM2 configuration with service account credentials
.env.production.local # Production environment variables (if used)
next.config.js # Next.js configuration with environment variable exposure
```

### System Prompt Architecture

The AI system uses an extremely comprehensive system prompt (200+ lines) that includes:

- Platform-specific formatting rules
- Content strategy guidelines
- UTM parameter generation rules
- Image prompt generation specifications
- Email body structure requirements
- Bilingual content adaptation rules

## Content Generation Strategy

### Email Types Supported

- **Security Alert**: Account verification and security notifications
- **Shipping Update**: Package delivery and tracking notifications
- **Account Status**: Profile and account confirmation messages
- **Product**: Financial product notifications
- **Urgent Communication**: Time-sensitive account messages
- **Status Update**: General account and application updates

### Image Types Supported

- **Product Image**: Financial product visuals
- **Lifestyle Photo**: People using financial services
- **Infographic**: Data visualization and information graphics
- **Icon**: Simple iconographic representations
- **Animated GIF**: Dynamic visual content
- **Shipment Tracking**: Package and delivery visuals
- **Graphic**: General graphic design elements

### CTA Button Strategy

The system avoids generic "Apply Now" or "Get Loan" buttons in favor of action-oriented phrases like:

- "VIEW CARD TRACKING"
- "SEE CREDIT LIMIT"
- "TRACK REQUEST"
- "CHECK LIMIT NOW"
- "VERIFY & PROCEED"
- "CONFIRM"
- "AUTHORIZE SHIPMENT"

## Development Workflow (Production Environment)

### Form Handling Flow

1. User selects platform, email type, market, and image type
2. Optional URL reference and additional instructions
3. Form validation using React Hook Form
4. POST request to `/api/generate-broadcast`
5. AI processing with structured JSON response
6. Dynamic UI rendering with individual copy buttons

### Copy System Workflow

1. User clicks individual field copy button
2. System detects content format (HTML vs Markdown)
3. Creates ClipboardItem with both HTML and plain text versions
4. Copies to clipboard with format appropriate for destination
5. Visual feedback with success confirmation

## Technical Dependencies

### Core Dependencies

- `@google-cloud/vertexai`: Google Cloud AI integration with service account support
- `@radix-ui/react-*`: UI component foundation
- `marked`: Markdown to HTML conversion for rich text copying
- `react-hook-form`: Type-safe form management
- `lucide-react`: Icon library
- `tailwindcss`: Utility-first CSS framework
- `class-variance-authority`: Component variant management
- `tailwind-merge`: Conditional class merging

### Recent Major Updates

The project includes significant improvements documented in various files:

- Fixed HTML display issues in ActiveCampaign's rich text editor
- Implemented dual-format copying (HTML + plain text)
- Added platform-specific content detection
- Enhanced browser compatibility with fallback mechanisms
- **Updated to service account authentication for production stability**

## Production Server Configuration

### Server Details

- **Platform**: Google Cloud Compute Engine VM
- **OS**: Ubuntu 22.04 LTS with Apache 2.0
- **Process Management**: PM2 with ecosystem configuration
- **Reverse Proxy**: Apache configured for Next.js application
- **SSL**: Certbot with Let's Encrypt for HTTPS
- **Service Persistence**: PM2 startup script with systemd
- **Domain**: <https://email.topfinanzas.com>
- **Application Port**: 3020

### Apache Configuration

The application is served through Apache reverse proxy with:

- HTTP to HTTPS redirect
- Static asset serving for `/_next/static/`
- WebSocket support for development
- Security headers (HSTS, X-Frame-Options, etc.)

### PM2 Production Setup

```bash
# PM2 configuration location
/var/www/html/emailgenius-broadcasts-generator/ecosystem.config.js

# PM2 logs location
/var/log/pm2/emailgenius-broadcasts-*.log

# PM2 process data
/var/www/.pm2/
```

## Authentication Architecture (Updated)

### Current Production Setup

The application now uses a **hybrid authentication approach** with automatic fallback:

1. **Primary**: Service Account Credentials via Environment Variables
   - Email: `sheets-service-account@absolute-brook-452020-d5.iam.gserviceaccount.com`
   - Private Key: Stored in PM2 environment configuration
   - Permissions: Vertex AI User role

2. **Fallback**: Application Default Credentials (ADC)
   - Used if service account credentials are not available
   - Maintains backward compatibility

### Authentication Code Structure

```typescript
// In app/api/generate-broadcast/route.ts
let vertex: VertexAI;

if (
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
  process.env.GOOGLE_PRIVATE_KEY
) {
  // Use service account credentials from environment variables
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };

  vertex = new VertexAI({
    project: process.env.GOOGLE_CLOUD_PROJECT || "",
    location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
    googleAuthOptions: {
      credentials: credentials,
    },
  });
} else {
  // Fall back to Application Default Credentials (ADC)
  vertex = new VertexAI({
    project: process.env.GOOGLE_CLOUD_PROJECT || "",
    location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
  });
}
```

## Form Configuration Details

### Platform Selection

- **ConvertKit**: Markdown formatting, A/B subject lines, `{{ subscriber.first_name }}` variable
- **ActiveCampaign**: HTML formatting, single subject line, `%FIRSTNAME%` variable, sender details

### Market Adaptation

- **USA**: English content, US cultural references, <topfinance@topfinanzas.com>
- **UK**: English content, UK cultural adaptation, <topfinance@topfinanzas.com>
- **Mexico**: Spanish content, Mexican cultural nuances, <info@topfinanzas.com>

## Troubleshooting (Production Environment)

### Common Issues and Solutions

1. **Authentication Errors**:

   ```bash
   # Verify service account permissions in Google Cloud Console
   # Check PM2 environment variables
   sudo -u www-data pm2 show emailgenius-broadcasts-generator
   ```

2. **AI Generation Failures**:

   ```bash
   # Check project quota limits and API availability
   # View detailed logs
   sudo -u www-data pm2 logs emailgenius-broadcasts-generator --lines 100
   ```

3. **Copy Functionality Issues**:
   - Ensure modern browser with ClipboardItem API support
   - Check browser security settings for clipboard access

4. **Build Errors**:

   ```bash
   # Verify all dependencies are installed
   sudo -u www-data npm install
   # Check TypeScript configuration
   sudo -u www-data npm run build
   ```

5. **Permission Issues**:

   ```bash
   # Ensure proper file ownership
   sudo chown -R www-data:www-data /var/www/html/emailgenius-broadcasts-generator
   # Verify PM2 permissions
   sudo chown -R www-data:www-data /var/www/.pm2
   ```

### Debug Mode

The application includes comprehensive error handling with detailed console logging for:

- AI request/response cycles
- JSON parsing issues
- Clipboard API failures
- Form validation errors
- Authentication failures

### Health Check Commands

```bash
# Test application endpoint
curl https://email.topfinanzas.com/api/generate-broadcast \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"platform":"ConvertKit","emailType":"security-alert","market":"USA","imageType":"product-image"}'

# Check PM2 status
sudo -u www-data pm2 status

# Check Apache configuration
sudo apache2ctl configtest

# Check SSL certificate
sudo certbot certificates

# View system resources
sudo -u www-data pm2 monit
```

## Major Project Updates & Fixes

### Authentication Migration (Completed - Latest)

- **Migrated from**: File-based ADC → Service Account Credentials via Environment Variables
- **Security Enhancement**: Eliminated dependency on service account JSON files
- **Flexibility**: Added automatic fallback to ADC for development environments
- **Production Stability**: Direct credential management through PM2 configuration
- **Benefits**: Better security, easier deployment, centralized credential management

### Rich Text Copy System (Fixed)

- **Issue Resolved**: HTML tags displaying as raw text in ActiveCampaign rich text editor
- **Solution**: Dual-format copying (HTML + plain text) with automatic markdown to HTML conversion
- **Technical**: Uses `marked` library and ClipboardItem API for cross-platform compatibility
- **Result**: Content now renders properly in both rich text and plain text editors

### Email Content Strategy (Restored)

- **Enhanced Content Generation**: Restored comprehensive email body requirements for maximum engagement
- **Multiple Touchpoints**: Bold text, emojis, bullet points, embedded CTA links throughout
- **Notification Style**: Content mimics important account notifications, not marketing emails
- **Impact**: Higher engagement through detailed, urgent content with multiple click opportunities

### Platform-Specific Formatting (Implemented)

- **ConvertKit**: Markdown formatting with `{{ subscriber.first_name }}`
- **ActiveCampaign**: Natural text that converts to HTML with `%FIRSTNAME%`
- **UTM Structure**: Standardized format: `[country]_tf_[platform]_broad`
- **Individual Copy**: Field-specific copying with visual feedback

### Next.js 15 & React 19 Upgrade (Completed)

- **Framework**: Upgraded to Next.js 15.4.7 with React 19.1.1
- **Compatibility**: No breaking changes required for our codebase
- **Performance**: Enhanced build optimizations and developer experience
- **Features**: Access to latest React 19 concurrent rendering improvements

## Production Deployment Architecture

### Server Configuration

- **Platform**: Google Cloud Compute Engine VM
- **OS**: Ubuntu 22.04 LTS with Apache 2.0
- **Process Management**: PM2 with ecosystem configuration
- **Reverse Proxy**: Apache configured for Next.js application
- **SSL**: Certbot with Let's Encrypt for HTTPS
- **Service Persistence**: PM2 startup script with systemd
- **File Ownership**: All project files owned by `www-data` user

### Production Deployment Workflow

```bash
# Complete deployment workflow
cd /var/www/html/emailgenius-broadcasts-generator

# Pull latest changes
sudo -u www-data git pull origin main

# Install any new dependencies
sudo -u www-data npm install

# Build the application
sudo -u www-data npm run build

# Restart PM2 process
sudo -u www-data pm2 restart emailgenius-broadcasts-generator

# Verify deployment
sudo -u www-data pm2 status
curl https://email.topfinanzas.com/

# Save PM2 configuration
sudo -u www-data pm2 save
```

### PM2 Ecosystem Configuration

The project includes `ecosystem.config.js` with:

- **Process Name**: `emailgenius-broadcasts-generator`
- **Instances**: Single instance (can be scaled)
- **Memory Limit**: 1GB with automatic restart
- **Logging**: Centralized logs in `/var/log/pm2/`
- **Auto Restart**: Enabled with crash protection
- **Environment Variables**: Production-ready configuration with service account credentials

## Advanced Features & Fixes

### URL Overflow Handling

- **CSS Utilities**: `.url-wrap` class with `word-break: break-all` and `overflow-wrap: anywhere`
- **Container Protection**: Overflow-hidden containers with proper text wrapping
- **Responsive Design**: URLs display properly on all screen sizes

### Email Body Formatting

- **Line Break Management**: Mandatory blank lines after greetings and main messages
- **Bold Signatures**: Department signatures formatted as `**Department Name**`
- **Structure Requirements**: Exact formatting pattern for consistent output

### Content Quality Standards

- **Engagement Elements**: Multiple bullet points with emojis, bold text throughout
- **CTA Integration**: Embedded action phrases within email text
- **Corporate Authenticity**: Fictional departments ("Card Issuance Team", "Security & Verification")
- **Urgency Creation**: Language that implies necessary account actions

### Copy System Technical Details

- **Multi-Format Support**: ClipboardItem API with HTML and plain text versions
- **Platform Detection**: Automatic HTML vs Markdown content recognition
- **Browser Fallback**: Graceful degradation for older browsers
- **Visual Feedback**: Success confirmation with auto-reset after 2 seconds

## Application Testing & Verification

### API Endpoint Testing

```bash
# Test ConvertKit generation
curl -X POST https://email.topfinanzas.com/api/generate-broadcast \
  -H "Content-Type: application/json" \
  -d '{"platform":"ConvertKit","emailType":"security-alert","market":"USA","imageType":"product-image"}'

# Test ActiveCampaign generation
curl -X POST https://email.topfinanzas.com/api/generate-broadcast \
  -H "Content-Type: application/json" \
  -d '{"platform":"ActiveCampaign","emailType":"shipping-update","market":"Mexico","imageType":"shipment-tracking"}'

# Test local endpoint (bypass Apache)
curl -X POST http://localhost:3020/api/generate-broadcast \
  -H "Content-Type: application/json" \
  -d '{"platform":"ConvertKit","emailType":"product","market":"UK","imageType":"lifestyle-photo"}'
```

### Application Health Monitoring

```bash
# Monitor PM2 processes in real-time
sudo -u www-data pm2 monit

# Check resource usage
sudo -u www-data pm2 show emailgenius-broadcasts-generator

# View detailed logs
sudo tail -f /var/log/pm2/emailgenius-broadcasts-combined.log

# Check Apache access logs
sudo tail -f /var/log/apache2/access.log | grep email.topfinanzas.com
```
