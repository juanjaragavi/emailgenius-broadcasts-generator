# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

EmailGenius Broadcasts Generator is an AI-powered email broadcast creation tool that uses Google Cloud Vertex AI (Gemini 1.5 Pro) to generate high-engagement email campaigns optimized for both ConvertKit and ActiveCampaign platforms. The application specializes in creating financial product marketing emails that mimic transactional communications to maximize open rates and conversions.

## Development Commands

### Core Next.js Commands

```bash
# Development server (runs on port 3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# ESLint linting
npm run lint
```

### Project Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit environment variables
# Set GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION
```

### Google Cloud Authentication Setup

```bash
# Option A: Application Default Credentials (Recommended for local development)
gcloud auth application-default login

# Option B: Service Account Key (Alternative)
# Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## Architecture Overview

### AI Integration

- **Primary AI Service**: Google Cloud Vertex AI using Gemini 1.5 Pro model
- **Authentication**: Application Default Credentials (ADC) system with automatic fallback
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

## Environment Variables

### Required Configuration

```env
# Google Cloud Project Configuration
GOOGLE_CLOUD_PROJECT=your-google-cloud-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# Authentication (choose one method):

# Option 1: Application Default Credentials (Recommended)
# Run: gcloud auth application-default login

# Option 2: Service Account JSON Key File
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json

# Option 3: Service Account via Environment Variables (Less Secure)
# GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
# GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

## Project Structure Deep Dive

### Key Files and Their Purposes

```markdown
app/
├── api/generate-broadcast/route.ts # Main AI API endpoint with comprehensive system prompts
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

## Development Workflow

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

- `@google-cloud/vertexai`: Google Cloud AI integration
- `@radix-ui/react-*`: UI component foundation
- `marked`: Markdown to HTML conversion for rich text copying
- `react-hook-form`: Type-safe form management
- `lucide-react`: Icon library
- `tailwindcss`: Utility-first CSS framework
- `class-variance-authority`: Component variant management
- `tailwind-merge`: Conditional class merging

### Recent Major Updates

The project includes significant improvements documented in `RICH_TEXT_COPY_FIX.md`:

- Fixed HTML display issues in ActiveCampaign's rich text editor
- Implemented dual-format copying (HTML + plain text)
- Added platform-specific content detection
- Enhanced browser compatibility with fallback mechanisms

## Google Cloud Setup Requirements

### Prerequisites

1. Google Cloud Project with Vertex AI API enabled
2. Service account with Vertex AI permissions
3. Google Cloud CLI installed and configured
4. Billing account attached to project

### Authentication Options

- **Development**: Use `gcloud auth application-default login`
- **Production**: Use service account key file or attached service account
- **CI/CD**: Use service account key via environment variables

## Form Configuration Details

### Platform Selection

- **ConvertKit**: Markdown formatting, A/B subject lines, `{{ subscriber.first_name }}` variable
- **ActiveCampaign**: HTML formatting, single subject line, `%FIRSTNAME%` variable, sender details

### Market Adaptation

- **USA**: English content, US cultural references, <topfinance@topfinanzas.com>
- **UK**: English content, UK cultural adaptation, <topfinance@topfinanzas.com>
- **Mexico**: Spanish content, Mexican cultural nuances, <info@topfinanzas.com>

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Verify Google Cloud credentials and project permissions
2. **AI Generation Failures**: Check project quota limits and API availability
3. **Copy Functionality Issues**: Ensure modern browser with ClipboardItem API support
4. **Build Errors**: Verify all dependencies are installed and TypeScript types are resolved

### Debug Mode

The application includes comprehensive error handling with detailed console logging for:

- AI request/response cycles
- JSON parsing issues
- Clipboard API failures
- Form validation errors

## Major Project Updates & Fixes

### Authentication Migration (Completed)

- **Migrated from**: Google AI Studio API keys → Google Cloud Vertex AI with ADC
- **Security Enhancement**: Eliminated hardcoded API keys, implemented service account authentication
- **Model Upgrade**: `gemini-pro` → `gemini-1.5-pro`
- **Benefits**: Better security, scalability, and Google Cloud integration

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

### Authentication Options

1. **Development**: Application Default Credentials (`gcloud auth application-default login`)
2. **Production**: Service account with JSON key file
3. **CI/CD**: Environment variables with service account credentials

### PM2 Ecosystem Configuration

The project includes `ecosystem.config.js` with:

- **Process Name**: `emailgenius-broadcasts-generator`
- **Instances**: Single instance (can be scaled)
- **Memory Limit**: 1GB with automatic restart
- **Logging**: Centralized logs in `/var/log/pm2/`
- **Auto Restart**: Enabled with crash protection
- **Environment Variables**: Production-ready configuration

### Initial Production Setup

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Clone and setup project
git clone https://github.com/your-username/emailgenius-broadcasts-generator.git /opt/emailgenius-broadcasts-generator
cd /opt/emailgenius-broadcasts-generator

# Install dependencies and build
npm install
npm run build

# Update ecosystem.config.js with your actual values
# Edit GOOGLE_CLOUD_PROJECT and other environment variables

# Start application with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions provided by the command above
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### Deployment Commands

```bash
# Check application status
pm2 status
pm2 show emailgenius-broadcasts-generator

# View logs
pm2 logs emailgenius-broadcasts-generator
pm2 logs emailgenius-broadcasts-generator --lines 100

# Restart application
pm2 restart emailgenius-broadcasts-generator

# Reload application (zero-downtime)
pm2 reload emailgenius-broadcasts-generator

# Stop application
pm2 stop emailgenius-broadcasts-generator

# Update application
cd /opt/emailgenius-broadcasts-generator
git pull origin main
npm install
npm run build
pm2 reload emailgenius-broadcasts-generator

# Monitor in real-time
pm2 monit
```

### PM2 Log Management

```bash
# View specific log files
tail -f /var/log/pm2/emailgenius-error.log
tail -f /var/log/pm2/emailgenius-out.log
tail -f /var/log/pm2/emailgenius-combined.log

# Clear logs
pm2 flush

# Rotate logs (configure logrotate)
sudo nano /etc/logrotate.d/pm2
```

### Logrotate Configuration for PM2

Create `/etc/logrotate.d/pm2`:

```text
/var/log/pm2/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 0640 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
```

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

## Troubleshooting Guide

### Authentication Issues

```bash
# Verify ADC setup
gcloud auth application-default print-access-token

# Check Vertex AI API
gcloud services list --enabled --filter="name:aiplatform.googleapis.com"

# Test credentials
curl -X POST http://localhost:3000/api/generate-broadcast -H "Content-Type: application/json" -d '{"platform":"ConvertKit","emailType":"security-alert","market":"USA","imageType":"product-image"}'
```

### PM2 Service Management

```bash
# Check application status
pm2 status
pm2 show emailgenius-broadcasts-generator

# View detailed logs
pm2 logs emailgenius-broadcasts-generator --lines 50
tail -f /var/log/pm2/emailgenius-error.log

# Check if PM2 is managing the process
pm2 list

# Verify Apache proxy
sudo apache2ctl configtest
sudo netstat -tlnp | grep :3000

# Restart PM2 process if needed
pm2 restart emailgenius-broadcasts-generator
```

### Development Workflow

```bash
# Health check during development
node --version  # Verify Node.js 18+
npm run build   # Test production build
npm run dev     # Start development server

# Authentication verification
echo $GOOGLE_APPLICATION_CREDENTIALS
gcloud config get-value project
````

## Content Generation Examples

### Before Enhancements (Simple)

```markdown
Hi %FIRSTNAME%, Your card is ready.

- Track shipment
- Confirm receipt
  **The Card Team**
```

### After Enhancements (Comprehensive)

```markdown
Hi %FIRSTNAME%,

Your **account status** requires immediate attention. To ensure your card is delivered without delays, please **verify your shipping details** as soon as possible.

- ✅ **Action Required:** Confirm your address details
- ⚠️ **Important:** Your package is currently on hold pending confirmation
- 📊 **Status Update:** View tracking details to monitor delivery

Don't let delivery delays affect your account standing. Complete verification now to ensure seamless processing.

**The Card Issuance Team**
Logistics & Fulfillment Division
```

This project represents a sophisticated AI-powered marketing tool with advanced clipboard integration, multi-platform email generation capabilities, and enterprise-grade production deployment architecture.
