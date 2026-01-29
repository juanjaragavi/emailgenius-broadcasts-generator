# CLAUDE.MD

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

EmailGenius Broadcasts Generator is an AI-powered email broadcast creation tool that uses Google Cloud Vertex AI (Gemini 2.5 Flash) to generate high-engagement email campaigns optimized for both ConvertKit and ActiveCampaign platforms. The application features automated AI-powered image generation using Vertex AI Imagen 4.0 and specializes in creating financial product marketing emails that mimic transactional communications.

## Quick Start

### Development Environment

```bash
# Navigate to project directory
cd /Users/macbookpro/.claude-worktrees/emailgenius-broadcasts-generator/gallant-antonelli

# Install dependencies
npm install

# Start development server (runs on port 3020)
npm run dev

# Build for production
npm run build

# Run linting and formatting checks
npm run lint
npm run format:check
```

### Production Environment

The application is deployed on GCP Compute Engine VM with Apache 2.0 and PM2 process management. All production commands must use `sudo -u www-data` prefix for proper permissions.

```bash
# Production deployment
cd /var/www/html/emailgenius-broadcasts-generator
sudo -u www-data npm install
sudo -u www-data npm run build
sudo -u www-data pm2 restart emailgenius-broadcasts-generator
```

## Architecture Overview

### Tech Stack

- **Frontend**: Next.js 15 with React 19, TypeScript
- **UI**: Radix UI with shadcn/ui, Tailwind CSS
- **AI Services**:
  - Google Cloud Vertex AI (Gemini 1.5 Pro) for text generation
  - Vertex AI Imagen 4.0 for image generation
- **Authentication**: Service Account credentials with ADC fallback
- **Forms**: React Hook Form
- **Database**: PostgreSQL (Google Cloud SQL)
- **Deployment**: PM2, Apache reverse proxy, Let's Encrypt SSL

### Key Directories

```
app/
├── api/
│   ├── generate-broadcast/route.ts  # Email content generation API
│   ├── generate-image/route.ts      # Image generation API
│   └── spam-check/route.ts          # Spam score analysis API
├── page.tsx                         # Main application UI
├── layout.tsx                       # App layout with fonts
└── globals.css                      # Global styles

components/
├── ui/                              # shadcn/ui components
├── email-preview-panel.tsx          # Visual email preview
├── spam-score-display.tsx           # Spam analysis display
└── [other components]

lib/
├── vertexai-imagen.ts               # Imagen service
├── db.ts                            # PostgreSQL connection
├── documents/                       # Technical documentation
└── scripts/                         # Database and build scripts
```

## Development Guidelines

### When Working with This Codebase

1. **Read Before Modifying**: Always read files before suggesting changes
2. **Follow Existing Patterns**: Maintain consistency with existing code style
3. **TypeScript Strict**: All code uses strict TypeScript typing
4. **Component Structure**: Follow shadcn/ui component patterns
5. **API Routes**: Use Next.js 15 App Router conventions

### Code Conventions

- **File Naming**: kebab-case for files, PascalCase for components
- **Imports**: Absolute imports using `@/` alias
- **Styling**: Tailwind CSS utility classes, no inline styles
- **Forms**: React Hook Form with TypeScript validation
- **Error Handling**: Comprehensive try-catch with user-friendly messages

### Platform-Specific Content

The application generates different formats for each email platform:

**ConvertKit**:

- A/B test subject lines (2 variants)
- Markdown-formatted body
- `{{ subscriber.first_name }}` personalization
- Preview text under 150 characters

**ActiveCampaign**:

- Single subject line with emoji
- HTML-formatted body (converts from markdown)
- `%FIRSTNAME%` personalization
- From Name/Email fields
- Preheader text

### Multi-Market Support

- **USA/UK**: English content with cultural adaptation, `topfinance@topfinanzas.com`
- **Mexico**: Spanish content with Mexican nuances, `info@topfinanzas.com`
- **UTM Parameters**: Format `[country]_tf_[platform]_broad`

## Authentication & Environment

### Required Environment Variables

```env
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=absolute-brook-452020-d5
GOOGLE_CLOUD_LOCATION=us-central1

# Service Account (Primary Method)
GOOGLE_SERVICE_ACCOUNT_EMAIL=sheets-service-account@absolute-brook-452020-d5.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[KEY]\n-----END PRIVATE KEY-----"

# Optional Enhanced Auth
GOOGLE_PRIVATE_KEY_ID=optional-key-id
GOOGLE_CLIENT_ID=optional-client-id

# Database (PostgreSQL)
DB_HOST=34.16.99.221
DB_PORT=5432
DB_NAME=emailgenius
DB_USER=postgres
DB_PASSWORD=your_password

# Application
PORT=3020
NODE_ENV=production
```

### Authentication Architecture

The application uses a hybrid approach:

1. **Primary**: Service Account credentials from environment variables
2. **Fallback**: Application Default Credentials (ADC)

This is implemented in `app/api/generate-broadcast/route.ts` with automatic fallback logic.

## Key Features

### 1. Email Content Generation

- Powered by Gemini 1.5 Pro model
- Comprehensive 200+ line system prompt
- Platform-specific formatting
- UTM parameter generation
- Multiple email type templates

### 2. Image Generation

- Automatic generation from LLM output
- Vertex AI Imagen 4.0 Preview model
- 16:9 aspect ratio for email headers
- Base64-encoded PNG delivery
- Download functionality

### 3. Rich Text Copy System

- Multi-format clipboard support (HTML + plain text)
- Platform-specific conversion (markdown to HTML for ActiveCampaign)
- Uses `marked` library for markdown processing
- ClipboardItem API with fallback support

### 4. Spam Score Analysis

- Mail-Tester API integration
- Real-time spam score checking
- Visual feedback with color-coded scores
- Detailed improvement suggestions

### 5. Email Preview

- Visual side-by-side preview
- Real-time rendering
- Platform-specific styling
- Mobile-responsive view

### 6. Session History

- PostgreSQL-backed storage
- Recent broadcasts display
- Quick regeneration from history
- Timestamped entries

## Common Tasks

### Adding a New Email Type

1. Update form options in `app/page.tsx`
2. Add type definition to system prompt
3. Test with both platforms
4. Document in appropriate `.md` file in `lib/documents/`

### Modifying AI Prompts

The main system prompt is located in `lib/documents/emailgenius-broadcasts-generator-system-prompt.md`. Changes should:

- Maintain platform-specific sections
- Preserve JSON structure requirements
- Test thoroughly with both platforms

### Database Changes

1. Modify schema in `scripts/init-db.ts`
2. Update types in relevant files
3. Test with `scripts/verify-db.ts`
4. Document changes

### UI Component Updates

Follow shadcn/ui patterns:

- Use Radix UI primitives
- Apply Tailwind classes
- Maintain accessibility
- Test responsiveness

## Testing & Verification

### API Endpoint Testing

```bash
# Test broadcast generation (ConvertKit)
curl -X POST http://localhost:3020/api/generate-broadcast \
  -H "Content-Type: application/json" \
  -d '{"platform":"ConvertKit","emailType":"security-alert","market":"USA","imageType":"product-image","contentLength":"Standard"}'

# Test image generation
curl -X POST http://localhost:3020/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{"imagePrompt":"A modern credit card on a desk with professional lighting, 16:9 aspect ratio"}'

# Health check for image generation
curl http://localhost:3020/api/generate-image
```

### Build Verification

```bash
# TypeScript compilation
npm run build

# Linting
npm run lint

# Format check
npm run format:check
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY`
   - Ensure private key has proper newline escaping (`\\n`)
   - Check Service Account has Vertex AI User role

2. **Image Generation Failures**
   - Check GCP project quotas
   - Verify Imagen API is enabled
   - Review error logs for specific error codes (401, 403, 429)

3. **Clipboard Issues**
   - Ensure HTTPS or localhost (clipboard API requirement)
   - Check browser compatibility (modern browsers only)
   - Verify ClipboardItem API support

4. **Database Connection**
   - Verify DB credentials in environment
   - Check Cloud SQL instance is running
   - Test connection with `scripts/verify-db.ts`

### Debug Commands

```bash
# View detailed logs (production)
sudo -u www-data pm2 logs emailgenius-broadcasts-generator --lines 100

# Monitor resources
sudo -u www-data pm2 monit

# Check PM2 status
sudo -u www-data pm2 status

# Test database connection
npx tsx scripts/verify-db.ts
```

## Recent Major Updates

### Next.js 15 & React 19 Upgrade

- Upgraded to latest stable versions
- No breaking changes required
- Enhanced performance and DX

### Service Account Authentication

- Migrated from file-based ADC to environment variables
- Improved security and deployment flexibility
- Automatic fallback to ADC

### Rich Text Copy Fix

- Resolved HTML rendering in ActiveCampaign
- Dual-format copying implementation
- Cross-platform compatibility

### Spam Score Integration

- Mail-Tester API integration
- Real-time analysis
- Visual feedback system

### Visual Email Preview

- Side-by-side preview panel
- Platform-specific rendering
- Mobile-responsive design

## Documentation References

- **WARP.md**: Comprehensive technical documentation for WARP terminal
- **RULES.md**: CLINE-specific guidelines (mirrors this file)
- **README.md**: User-facing documentation
- **lib/documents/**: Technical implementation docs
- **docs/IMAGE_GENERATION.md**: Image generation feature details

## Production Deployment

### Complete Deployment Workflow

```bash
# Navigate to production directory
cd /var/www/html/emailgenius-broadcasts-generator

# Pull latest changes
sudo -u www-data git pull origin main

# Install dependencies
sudo -u www-data npm install

# Build application
sudo -u www-data npm run build

# Restart PM2 process
sudo -u www-data pm2 restart emailgenius-broadcasts-generator

# Verify deployment
sudo -u www-data pm2 status
curl https://email.topfinanzas.com/

# Save PM2 configuration
sudo -u www-data pm2 save
```

### Production URLs

- **Application**: <https://email.topfinanzas.com>
- **Port**: 3020 (behind Apache reverse proxy)
- **PM2 Config**: `/var/www/html/emailgenius-broadcasts-generator/ecosystem.config.js`
- **Logs**: `/var/log/pm2/emailgenius-broadcasts-*.log`

## Git Workflow

- **Main Branch**: `main` (production)
- **Current Branch**: `gallant-antonelli` (development)
- **Worktree Location**: `/Users/macbookpro/.claude-worktrees/emailgenius-broadcasts-generator/gallant-antonelli`
- **Main Repo**: `/Users/macbookpro/GitHub/emailgenius-broadcasts-generator`

### Making Changes

1. Work in the current worktree branch
2. Test thoroughly locally
3. Create commits with descriptive messages
4. Push to remote branch
5. Create PR to main when ready
6. Deploy to production after merge

## Best Practices for Claude Code

1. **Always Read First**: Use Read tool before suggesting edits
2. **Understand Context**: Review related files for full context
3. **Test Locally**: Verify changes with `npm run dev` and `npm run build`
4. **Follow Patterns**: Maintain consistency with existing code
5. **Document Changes**: Update relevant `.md` files when making significant changes
6. **Use TypeScript**: Leverage strict typing for better code quality
7. **Respect Conventions**: Follow Next.js 15, React 19, and shadcn/ui patterns
8. **Security First**: Never commit credentials or sensitive data

## Important Notes

- This is a production application serving live users
- All changes should be thoroughly tested before deployment
- The application handles financial product marketing content
- Maintain professional code quality and documentation standards
- Follow security best practices for authentication and data handling

## Support & Resources

- **GitHub Issues**: For bug reports and feature requests
- **Documentation**: See `lib/documents/` for detailed technical docs
- **Production Monitoring**: PM2 logs and status commands
- **GCP Console**: For Vertex AI quotas and service account management

---

This project represents a sophisticated AI-powered marketing tool with enterprise-grade architecture, comprehensive error handling, and production-ready deployment configuration.
