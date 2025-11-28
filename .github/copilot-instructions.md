# EmailGenius Broadcasts Generator - AI Coding Instructions

## Architecture Overview

Next.js 15 app (React 19) that generates AI-powered email broadcasts using Google Cloud Vertex AI (Gemini 2.5 Flash). Dual-platform support for ConvertKit and ActiveCampaign with multi-market content (USA, UK, Mexico).

**Core Data Flow:**

1. `app/page.tsx` → Form submission via React Hook Form
2. `app/api/generate-broadcast/route.ts` → Fetches context from GitHub repos + Supermemory, calls Vertex AI
3. `app/api/generate-image/route.ts` → Generates header images via Vertex AI Imagen
4. Response renders with platform-specific formatting and individual copy buttons

## Key Integration Points

### AI Context Pipeline (`lib/mcp/`)

- `github-context-fetcher.ts` - Fetches email templates from `juanjaragavi/topfinanzas-ac-image-email-templates` and winning subjects from `juanjaragavi/emailgenius-winner-broadcasts-subjects`
- `supermemory-client-direct.ts` - Stores/retrieves past emails to avoid repetitive patterns

### Platform-Specific Formatting

- **ConvertKit**: Markdown, `{{ subscriber.first_name }}`, A/B subject lines
- **ActiveCampaign**: Natural text→HTML, `%FIRSTNAME%`, single subject line, sender details

### Authentication Pattern

```typescript
// Service account credentials with ADC fallback (see generate-broadcast/route.ts)
if (
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
  process.env.GOOGLE_PRIVATE_KEY
) {
  // Use service account
} else {
  // Fall back to ADC
}
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

### UI Components

Uses shadcn/ui pattern in `components/ui/` - extend existing components, don't create new design systems.

### Rich Text Copy System (`app/page.tsx`)

The `handleCopyField` function uses ClipboardItem API with dual-format (HTML + plain text) for cross-platform paste compatibility. Markdown is converted via `marked` library.

### API Route Pattern

Return structured JSON matching platform expectations:

```typescript
// ConvertKit: subjectLine1, subjectLine2, previewText, emailBody, ctaButtonText, imagePrompt
// ActiveCampaign: adds fromName, fromEmail, destinationUrl
```

### Error Handling

API routes return user-friendly Spanish error messages. Log detailed errors server-side only.

## Environment Variables

Required in `ecosystem.config.js` for production:

- `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`
- `GITHUB_TOKEN`, `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`
- `SUPERMEMORY_API_KEY`

## Testing API Endpoints

```bash
curl -X POST https://email.topfinanzas.com/api/generate-broadcast \
  -H "Content-Type: application/json" \
  -d '{"platform":"ConvertKit","emailType":"security-alert","market":"USA","imageType":"product-image"}'
```

## UTM Parameter Structure

Format: `[country]_tf_[platform]_broad`

- USA ConvertKit: `utm_campaign=us_tf_kit_broad&utm_source=convertkit...`
- Mexico ActiveCampaign: `utm_campaign=mx_tf_ac_broad&utm_source=activecampaign...`

URL domains:

- USA/UK: `https://[country].topfinanzas.com/[path]`
- Mexico: `https://topfinanzas.com/mx/[path]` (NOT mx.topfinanzas.com)
