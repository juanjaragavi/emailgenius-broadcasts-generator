# EmailGenius Broadcasts Generator - AI Coding Instructions

## Architecture Overview

**EmailGenius Broadcasts Generator** (`/Users/macbookpro/GitHub/emailgenius-broadcasts-generator`), is a Next.js 15 app (React 19) that generates AI-powered email broadcasts using Google Cloud Vertex AI (Gemini 2.5 Flash - "gemini-2.5-flash"). Dual-platform support for ConvertKit and ActiveCampaign with multi-market content (USA, UK, Mexico).

**Uses Utua Visual-First Design Philosophy:** Minimal text (60-80 words max), strong visual hierarchy, single prominent CTA.

**Core Data Flow:**

1. `app/page.tsx` → Form submission via React Hook Form (includes session management, history tracking)
2. `app/api/generate-broadcast/route.ts` → Uses local visual context + generation memory + database history, calls Vertex AI
3. `app/api/generate-image/route.ts` → Generates header images via Vertex AI Imagen
4. `app/api/spam-check/route.ts` → Validates email against SpamAssassin (Postmark API)
5. Response renders with platform-specific formatting, spam score, and email preview panel

## Key Integration Points

### AI Context System

- `lib/local-visual-context.ts` - Provides Utua design principles and local examples (replaces GitHub MCP)
- `lib/generation-memory.ts` - Tracks recent generations for content diversity (replaces Supermemory)
- `lib/database/services/` - PostgreSQL services for persistence:
  - `session.service.ts` - Session management
  - `broadcast.service.ts` - Broadcast persistence
  - `il-broadcast.service.ts` - IL dataset management
  - `api-request.service.ts` - API request logging
  - `context.service.ts` - Context management
  - `template.service.ts` - Template management

### New API Routes

- `/api/broadcasts/` - Broadcast CRUD operations
- `/api/sessions/` - Session management
- `/api/spam-check/` - Spam filter analysis (Postmark SpamAssassin)
- `/api/gmail-clip-check/` - Gmail clipping prevention validation
- `/api/render-email/` - Email HTML rendering
- `/api/visual-examples/` - Visual examples management
- `/api/upload-png-image/` - PNG image upload to GitHub
- `/api/upload-winner-subject/` - Winner subject line upload
- `/api/mcp-status/` - MCP server health check

### Platform-Specific Formatting

- **ConvertKit**: Markdown, `{{ subscriber.first_name }}`, A/B subject lines
- **ActiveCampaign**: Natural text→HTML, `%FIRSTNAME%`, single subject line, sender details

### Authentication Pattern

```typescript
// Service account credentials with ADC fallback (see generate-broadcast/route.ts)
// Uses @google/genai v1.30.0 (GoogleGenAI class)
if (
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
  process.env.GOOGLE_PRIVATE_KEY
) {
  vertex = new GoogleGenAI({
    vertexai: true,
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
  // Fall back to ADC
  vertex = new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT || "",
    location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
  });
}

// Model call
await vertex.models.generateContent({
  model: "gemini-2.5-flash",
  contents: [{ role: "user", parts: [{ text: prompt }] }],
});
```

## Development Commands

```bash
npm run dev          # Port 3020
npm run build
npm run lint
```

## Production Environment (GCP VM)

**Critical:** All commands require `sudo -u www-data` prefix for file ownership.

```bash
# Deployment workflow
cd /var/www/html/emailgenius-broadcasts-generator
sudo -u www-data git pull origin main
sudo -u www-data npm install
sudo -u www-data npm run build
sudo -u www-data pm2 restart emailgenius-broadcasts-generator
```

PM2 manages the process via `ecosystem.config.js` (contains credentials).

## Code Patterns

### New Frontend Components (`components/`)

- `email-preview-panel.tsx` - Email preview with spam check integration
- `spam-score-display.tsx` - Spam score visualization
- `email-content-metrics.tsx` - Content metrics (word count, character count)
- `top-ads-navigation.tsx` - Navigation component
- `ui/file-upload.tsx` - Generic file upload
- `ui/png-upload.tsx` - PNG upload to GitHub
- `ui/header.tsx` - Application header

### UI Components

Uses shadcn/ui pattern in `components/ui/` - extend existing components, don't create new design systems.

### Rich Text Copy System (`app/page.tsx`)

The `handleCopyField` function uses ClipboardItem API with dual-format (HTML + plain text) for cross-platform paste compatibility. Markdown is converted via `marked` library.

### API Route Pattern

Return structured JSON matching platform expectations:

```typescript
// Common fields
interface EmailBroadcast {
  emailBody: string;
  ctaButtonText: string;
  imagePrompt: string;

  // ConvertKit-specific
  subjectLine1?: string;
  subjectLine2?: string;
  previewText?: string;

  // ActiveCampaign-specific
  fromName?: string;
  fromEmail?: string;
  destinationUrl?: string;

  // New signature fields (optional)
  signatureName?: string;
  signatureTitle?: string;
  signatureImagePrompt?: string;

  // Metadata
  _meta?: {
    session_id: string;
    broadcast_id: number;
  };
}
```

### Error Handling

API routes return user-friendly Spanish error messages. Log detailed errors server-side only.

## Environment Variables

Required in `ecosystem.config.js` for production:

- `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`
- `DATABASE_URL` - PostgreSQL connection string
- `POSTMARK_SERVER_TOKEN` - For spam check API
- `GITHUB_TOKEN`, `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY` - For GitHub image uploads

**Note:** Supermemory integration removed in favor of database-only persistence.

## Testing API Endpoints

```bash
# Test broadcast generation
curl -X POST https://email.topfinanzas.com/api/generate-broadcast \
  -H "Content-Type: application/json" \
  -d '{"platform":"ConvertKit","emailType":"security-alert","market":"USA","imageType":"product-image","contentLength":"Concise"}'

# Test spam check
curl -X POST https://email.topfinanzas.com/api/spam-check \
  -H "Content-Type: application/json" \
  -d '{"htmlBody":"<html>...</html>","textBody":"..."}'

# Test Gmail clipping check
curl -X POST https://email.topfinanzas.com/api/gmail-clip-check \
  -H "Content-Type: application/json" \
  -d '{"htmlContent":"<html>...</html>"}'
```

## UTM Parameter Structure

Format: `[country]_tf_[platform]_broad`

- USA ConvertKit: `utm_campaign=us_tf_kit_broad&utm_source=convertkit...`
- Mexico ActiveCampaign: `utm_campaign=mx_tf_ac_broad&utm_source=activecampaign...`

URL domains:

- USA/UK: `https://[country].topfinanzas.com/[path]`
- Mexico: `https://topfinanzas.com/mx/[path]` (NOT mx.topfinanzas.com)
