# CLAUDE.MD - EmailGenius Broadcasts Generator

## Project Identity

**EmailGenius Broadcasts Generator** (`/Users/macbookpro/GitHub/emailgenius-broadcasts-generator`) is an enterprise-grade AI-powered email broadcast creation tool that leverages Google Cloud Vertex AI (Gemini 2.5 Flash) to generate high-engagement email campaigns optimized for ConvertKit and ActiveCampaign. The application specializes in creating financial product marketing emails with transactional communication patterns to maximize open rates and conversions.

**Latest Capabilities:**

- AI-powered image generation using Vertex AI Imagen 4.0
- Generation Memory System for content diversity
- Rich text multi-format clipboard copying
- Database-backed broadcast history and templates

## Core Architecture

### Technology Stack

```
Frontend:
├── Next.js 15.4.10 (App Router)
├── React 19.1.1 (Server/Client Components)
├── TypeScript 5.x
├── Tailwind CSS 3.x + shadcn/ui
├── React Hook Form 7.x
└── Lucide React (Icons)

Backend:
├── Next.js API Routes
├── Google Vertex AI (Gemini 2.5 Flash)
├── Vertex AI Imagen 4.0 Preview
├── PostgreSQL (Google Cloud SQL)
└── GitHub App Integration (Context Fetching)

Infrastructure:
├── GCP Compute Engine (Ubuntu 22.04)
├── Apache 2.0 (Reverse Proxy)
├── PM2 (Process Management)
└── Let's Encrypt SSL (Certbot)
```

### Authentication Architecture

The application uses a **hybrid authentication approach** with automatic fallback:

1. **Primary**: Service Account Credentials via Environment Variables
   - Email: `sheets-service-account@absolute-brook-452020-d5.iam.gserviceaccount.com`
   - Private Key: Stored in PM2 `ecosystem.config.js`
   - Required Permissions: `roles/aiplatform.user`

2. **Fallback**: Application Default Credentials (ADC)
   - Used if service account credentials are not available
   - Maintains development environment compatibility

### Data Flow Pipeline

```
1. User Input (app/page.tsx)
   └─> Form submission via React Hook Form

2. Context Gathering
   ├─> GitHub Context Fetcher (lib/mcp/github-context-fetcher.ts)
   │   ├─> Fetches email templates from topfinanzas-ac-image-email-templates
   │   └─> Fetches winning subjects from emailgenius-winner-broadcasts-subjects
   └─> Generation Memory (lib/generation-memory.ts)
       └─> Retrieves last 10 broadcasts to avoid repetition

3. AI Generation (app/api/generate-broadcast/route.ts)
   └─> Vertex AI Gemini 2.5 Flash with comprehensive system prompt

4. Image Generation (app/api/generate-image/route.ts)
   └─> Vertex AI Imagen 4.0 (16:9 aspect ratio, JPG format)

5. Response Rendering
   ├─> Platform-specific formatting
   ├─> Individual field copy buttons
   └─> Rich text multi-format clipboard support
```

## Development Guidelines

### File Organization

```
app/
├── api/
│   ├── generate-broadcast/route.ts    # Main AI endpoint (180 lines)
│   └── generate-image/route.ts        # Image generation endpoint
├── templates/email/                   # React Email templates
│   ├── components/                    # Reusable email components
│   └── *.tsx                          # Template files
├── page.tsx                           # Main UI (600+ lines)
├── layout.tsx                         # App layout with Poppins font
└── globals.css                        # Tailwind + custom styles

components/ui/                         # shadcn/ui components
├── button.tsx
├── card.tsx
├── input.tsx
├── label.tsx
├── select.tsx
└── textarea.tsx

lib/
├── database/services/                 # Database service layer
│   ├── broadcast.service.ts           # Broadcast CRUD operations
│   ├── session.service.ts             # Session management
│   ├── template.service.ts            # Template management
│   ├── context.service.ts             # Context storage
│   └── api-request.service.ts         # API request logging
├── mcp/                               # Model Context Protocol integration
│   ├── github-context-fetcher.ts      # GitHub API integration
│   └── supermemory-client-direct.ts   # Supermemory API client
├── generation-memory.ts               # In-memory generation tracking
├── image-optimizer.ts                 # Sharp-based image processing
├── email-renderer.ts                  # React Email to HTML renderer
├── html-body-extractor.ts             # Body-only HTML extraction
├── html-to-plain-text.ts              # HTML to plain text conversion
├── spam-check.ts                      # Email spam score analysis
└── utils.ts                           # Tailwind class merging
```

### Code Patterns

#### 1. API Route Pattern

```typescript
// app/api/*/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    if (!body.platform || !body.emailType) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Initialize Vertex AI with hybrid auth
    let vertex: VertexAI;
    if (
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY
    ) {
      vertex = new VertexAI({
        project: process.env.GOOGLE_CLOUD_PROJECT || "",
        location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
        googleAuthOptions: {
          credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          },
        },
      });
    } else {
      // Fallback to ADC
      vertex = new VertexAI({
        project: process.env.GOOGLE_CLOUD_PROJECT || "",
        location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
      });
    }

    // Process and return
    return NextResponse.json(result);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
```

#### 2. Database Service Pattern

```typescript
// lib/database/services/*.service.ts
import pool from "@/lib/db";

export async function createRecord(data: RecordData) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "INSERT INTO table_name (field1, field2) VALUES ($1, $2) RETURNING *",
      [data.field1, data.field2]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    client.release();
  }
}
```

#### 3. Rich Text Copy System

```typescript
// app/page.tsx - handleCopyField function
const handleCopyField = async (content: string, fieldName: string) => {
  try {
    const isHtml = content.includes("<") && content.includes(">");

    if (isHtml) {
      // HTML content - copy as both HTML and plain text
      const plainText = content.replace(/<[^>]+>/g, "");
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([content], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        }),
      ]);
    } else {
      // Markdown content - convert to HTML for rich text editors
      const htmlContent = marked.parse(content);
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([htmlContent], { type: "text/html" }),
          "text/plain": new Blob([content], { type: "text/plain" }),
        }),
      ]);
    }

    // Visual feedback
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  } catch (error) {
    console.error("Copy error:", error);
  }
};
```

## Platform-Specific Requirements

### ConvertKit Format

```typescript
interface ConvertKitBroadcast {
  subjectLine1: string; // A/B test variant 1
  subjectLine2: string; // A/B test variant 2
  previewText: string; // Under 150 characters
  emailBody: string; // Markdown format
  ctaButtonText: string; // Under 5 words
  imagePrompt: string; // For AI image generation
}

// Personalization: {{ subscriber.first_name }}
// Format: Markdown with **bold**, bullet points, emojis
```

### ActiveCampaign Format

```typescript
interface ActiveCampaignBroadcast {
  subjectLine: string; // Single line with emoji
  preheaderText: string; // Preview text
  fromName: string; // Corporate department
  fromEmail: string; // Market-specific email
  emailBody: string; // Natural text (converts to HTML)
  ctaButtonText: string; // Action-oriented phrase
  destinationUrl: string; // With UTM parameters
  imagePrompt: string; // For AI image generation
}

// Personalization: %FIRSTNAME%
// Format: Natural text that renders as HTML
// UTM Structure: [country]_tf_[platform]_broad
```

### Market Adaptation

| Market | Language | Cultural Adaptation           | Sender Email                 | URL Structure                   |
| ------ | -------- | ----------------------------- | ---------------------------- | ------------------------------- |
| USA    | English  | US references, $ currency     | <topfinance@topfinanzas.com> | <https://us.topfinanzas.com/>   |
| UK     | English  | UK references, £ currency     | <topfinance@topfinanzas.com> | <https://uk.topfinanzas.com/>   |
| Mexico | Spanish  | MX references, $ MXN currency | <info@topfinanzas.com>       | <https://topfinanzas.com/mx/>   |

**Important:** Mexico uses `topfinanzas.com/mx/`, NOT `mx.topfinanzas.com`

## Environment Configuration

### Required Environment Variables

```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=absolute-brook-452020-d5
GOOGLE_CLOUD_LOCATION=us-central1

# Service Account Authentication (Production)
GOOGLE_SERVICE_ACCOUNT_EMAIL=sheets-service-account@absolute-brook-452020-d5.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Database Configuration (Google Cloud SQL)
DB_HOST=34.16.99.221
DB_PORT=5432
DB_NAME=emailgenius
DB_USER=postgres
DB_PASSWORD=your_password

# GitHub App Integration
GITHUB_TOKEN=ghp_...
GITHUB_APP_ID=your_app_id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"

# Supermemory API (Optional)
SUPERMEMORY_API_KEY=your_api_key

# Application Configuration
PORT=3020
NODE_ENV=production
```

### Local Development Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Authenticate with Google Cloud (for ADC)
gcloud auth application-default login

# Initialize database schema
npx tsx scripts/init-db.ts

# Verify database connection
npx tsx scripts/verify-db.ts

# Start development server
npm run dev  # http://localhost:3020
```

## Production Deployment

### Server Environment

- **Platform**: Google Cloud Compute Engine VM
- **OS**: Ubuntu 22.04 LTS
- **Web Server**: Apache 2.0 (Reverse Proxy)
- **Process Manager**: PM2 with ecosystem configuration
- **SSL**: Let's Encrypt via Certbot
- **Domain**: <https://email.topfinanzas.com>
- **User Context**: All commands require `sudo -u www-data` prefix

### Deployment Workflow

```bash
# Navigate to project directory
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
sudo -u www-data pm2 logs emailgenius-broadcasts-generator --lines 50

# Save PM2 configuration
sudo -u www-data pm2 save
```

### PM2 Management Commands

```bash
# Status and monitoring
sudo -u www-data pm2 status
sudo -u www-data pm2 monit
sudo -u www-data pm2 show emailgenius-broadcasts-generator

# Log management
sudo -u www-data pm2 logs emailgenius-broadcasts-generator
sudo -u www-data pm2 logs emailgenius-broadcasts-generator --lines 100
sudo -u www-data pm2 flush emailgenius-broadcasts-generator

# Process control
sudo -u www-data pm2 start ecosystem.config.js --env production
sudo -u www-data pm2 restart emailgenius-broadcasts-generator
sudo -u www-data pm2 reload emailgenius-broadcasts-generator  # Zero-downtime
sudo -u www-data pm2 stop emailgenius-broadcasts-generator
```

## Testing Guidelines

### API Endpoint Testing

```bash
# Test ConvertKit generation
curl -X POST https://email.topfinanzas.com/api/generate-broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "ConvertKit",
    "emailType": "security-alert",
    "market": "USA",
    "imageType": "product-image"
  }'

# Test ActiveCampaign generation
curl -X POST https://email.topfinanzas.com/api/generate-broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "ActiveCampaign",
    "emailType": "shipping-update",
    "market": "Mexico",
    "imageType": "shipment-tracking"
  }'

# Test image generation
curl -X POST https://email.topfinanzas.com/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Professional financial credit card on modern desk",
    "aspectRatio": "16:9",
    "negativePrompt": "blurry, low quality"
  }'
```

### Database Testing

```bash
# Run database initialization
npx tsx scripts/init-db.ts

# Verify database connection and schema
npx tsx scripts/verify-db.ts

# Test database services
npx tsx scripts/test-db-services.ts
```

## Content Generation Strategy

### Email Types

| Type                 | Description                       | Use Case                        |
| -------------------- | --------------------------------- | ------------------------------- |
| security-alert       | Account verification and security | Authentication, password resets |
| shipping-update      | Package delivery and tracking     | Shipment notifications          |
| account-status       | Profile and account confirmation  | Account updates, verifications  |
| product              | Financial product notifications   | New products, offers            |
| urgent-communication | Time-sensitive account messages   | Critical updates                |
| status-update        | General account updates           | Status changes                  |

### Image Types

| Type              | Description                         | Visual Style                               |
| ----------------- | ----------------------------------- | ------------------------------------------ |
| product-image     | Financial product visuals           | Credit cards, products on clean background |
| lifestyle-photo   | People using financial services     | Professional lifestyle photography         |
| infographic       | Data visualization                  | Charts, diagrams, statistics               |
| icon              | Simple iconographic representations | Minimalist icons                           |
| animated-gif      | Dynamic visual content              | Animated graphics                          |
| shipment-tracking | Package and delivery visuals        | Boxes, delivery trucks                     |
| graphic           | General graphic design elements     | Abstract designs, patterns                 |

### CTA Button Strategy

**Avoid generic phrases like:**

- "Apply Now"
- "Get Loan"
- "Sign Up"

**Use action-oriented phrases like:**

- "VIEW CARD TRACKING"
- "SEE CREDIT LIMIT"
- "TRACK REQUEST"
- "CHECK LIMIT NOW"
- "VERIFY & PROCEED"
- "CONFIRM"
- "AUTHORIZE SHIPMENT"

## Key Features

### 1. Generation Memory System

The application maintains a rolling 10-item memory of recent broadcasts to prevent repetitive content:

```typescript
// lib/generation-memory.ts
interface GenerationRecord {
  id: string;
  timestamp: string;
  market: string;
  platform: string;
  emailType: string;
  subjectLine: string;
  previewText: string;
  ctaButtonText: string;
}

// Storage: In-memory cache + JSON file persistence
// Location: data/generation-memory.json
```

### 2. Rich Text Multi-Format Copying

Uses ClipboardItem API to copy content as both HTML and plain text:

- **HTML content**: Copies with tags intact for rich text editors
- **Markdown content**: Auto-converts to HTML for rich text, keeps markdown for plain text
- **Platform detection**: Automatically recognizes content format
- **Visual feedback**: 2-second success confirmation

### 3. AI Image Generation

Automatically generates 16:9 aspect ratio images optimized for email headers:

- **Model**: Vertex AI Imagen 4.0 Preview
- **Format**: JPG (optimized for email)
- **Resolution**: 1024x576px
- **Optimization**: Sharp library for compression
- **Delivery**: Base64-encoded data URLs

### 4. Context-Aware Generation

Fetches context from multiple sources:

- **GitHub Templates**: Working email templates from production campaigns
- **Winning Subjects**: High-performing subject lines from past broadcasts
- **Generation Memory**: Last 10 broadcasts to avoid repetition
- **Database History**: Full broadcast history with performance metrics

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

```bash
# Verify service account permissions in Google Cloud Console
# Check PM2 environment variables
sudo -u www-data pm2 show emailgenius-broadcasts-generator

# Test local ADC
gcloud auth application-default print-access-token

# Verify credentials in ecosystem.config.js
sudo -u www-data cat ecosystem.config.js | grep GOOGLE_
```

#### 2. Database Connection Issues

```bash
# Test database connectivity
npx tsx scripts/verify-db.ts

# Check PostgreSQL service
sudo systemctl status postgresql

# Verify Cloud SQL proxy (if using)
ps aux | grep cloud_sql_proxy
```

#### 3. AI Generation Failures

```bash
# Check Vertex AI quota and billing
gcloud alpha billing projects describe absolute-brook-452020-d5

# View detailed error logs
sudo -u www-data pm2 logs emailgenius-broadcasts-generator --lines 200

# Test API endpoint directly
curl -X POST http://localhost:3020/api/generate-broadcast \
  -H "Content-Type: application/json" \
  -d '{"platform":"ConvertKit","emailType":"product","market":"USA","imageType":"product-image"}'
```

#### 4. Build Errors

```bash
# Clear build cache
sudo -u www-data rm -rf .next
sudo -u www-data npm run build

# Check TypeScript configuration
sudo -u www-data npx tsc --noEmit

# Verify dependencies
sudo -u www-data npm list
```

#### 5. Permission Issues

```bash
# Fix file ownership
sudo chown -R www-data:www-data /var/www/html/emailgenius-broadcasts-generator

# Fix PM2 permissions
sudo chown -R www-data:www-data /var/www/.pm2

# Check file permissions
ls -la /var/www/html/emailgenius-broadcasts-generator
```

### Debug Mode

The application includes comprehensive logging:

- **AI Requests**: Full prompt and response logging
- **Context Fetching**: GitHub and memory retrieval logs
- **Image Generation**: Imagen API request/response tracking
- **Database Operations**: Query logging with timing
- **Clipboard API**: Copy operation success/failure tracking

## Recent Updates

### Image Pipeline Migration (February 2025)

- Migrated from PNG to JPG format for better email compatibility
- Optimized image size for faster loading (600px width standard)
- Fixed ActiveCampaign HTML rendering issues with body-only extraction
- Implemented Sharp library for server-side image optimization

### Generation Memory System (February 2025)

- Implemented rolling 10-item memory for content diversity
- File-based persistence with in-memory caching
- Graceful degradation if filesystem unavailable
- Provides LLM context to prevent repetitive patterns

### UX Improvements (February 2025)

- Added WYSIWYG editor for template customization
- Implemented email content metrics (word count, read time)
- Body-only HTML extraction for cleaner rendering
- Enhanced visual feedback for all copy operations

### Authentication Migration (January 2025)

- Migrated from file-based ADC to service account via environment variables
- Implemented hybrid authentication with automatic fallback
- Centralized credential management in PM2 ecosystem config
- Enhanced security with no JSON files on disk

## Best Practices

### When Writing Code

1. **Never create new files unnecessarily** - Always prefer editing existing files
2. **Follow existing patterns** - Match the code style in similar files
3. **Use TypeScript strictly** - Leverage types from existing interfaces
4. **Keep components small** - Break down large components into focused units
5. **Document complex logic** - Add comments for non-obvious implementations

### When Modifying AI Generation

1. **Test both platforms** - ConvertKit and ActiveCampaign have different requirements
2. **Verify all markets** - USA, UK, Mexico each have specific formatting needs
3. **Check UTM parameters** - Ensure correct structure: `[country]_tf_[platform]_broad`
4. **Maintain content diversity** - Generation memory prevents repetition

### When Working with Database

1. **Always use connection pooling** - Import from `lib/db.ts`
2. **Release connections** - Use try/finally blocks
3. **Handle errors gracefully** - Log errors but return user-friendly messages
4. **Use parameterized queries** - Never concatenate SQL strings

### When Deploying to Production

1. **Always use www-data user** - Prefix all commands with `sudo -u www-data`
2. **Build before restarting** - Run `npm run build` before PM2 restart
3. **Check logs after deployment** - Verify no errors in PM2 logs
4. **Test endpoints** - Curl test API routes after deployment
5. **Monitor resource usage** - Use `pm2 monit` to check memory/CPU

## Additional Resources

- **System Prompt**: `lib/documents/emailgenius-broadcasts-generator-system-prompt.md`
- **Rich Text Copy Fix**: `lib/documents/RICH_TEXT_COPY_FIX.md`
- **ActiveCampaign Fix**: `lib/documents/ACTIVECAMPAIGN_FORMATTING_FIX.md`
- **Cline Rules**: `.clinerules/RULES.md`
- **Warp Guide**: `WARP.md`
- **GitHub Copilot**: `.github/copilot-instructions.md`
- **README**: `README.md`

## Contact & Support

For questions about the codebase or deployment:

1. Check existing documentation in `lib/documents/`
2. Review commit history for recent changes
3. Test locally before deploying to production
4. Monitor PM2 logs for runtime issues

---

**Last Updated**: February 2025
**Project Version**: 0.1.0
**Next.js Version**: 15.4.10
**React Version**: 19.1.1
