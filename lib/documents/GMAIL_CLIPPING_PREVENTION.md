# Gmail Clipping Prevention Implementation

## Overview

Gmail enforces a strict clipping threshold of approximately **102KB (104,448 bytes)** on email messages. When HTML content exceeds this limit, the message is truncated with a "[Message clipped] View entire message" link, potentially:

- Hiding the unsubscribe link (compliance issue)
- Preventing tracking pixels from firing (analytics loss)
- Breaking email layout and CTAs
- Damaging brand perception

This implementation provides comprehensive tools to analyze, validate, and optimize email content before deployment.

## Architecture

### New Files Created

```
types/email-size.ts           # Type definitions and constants
lib/email-size-analyzer.ts    # Core analysis logic
app/api/gmail-clip-check/     # API endpoint for validation
  └── route.ts
```

### Size Thresholds

| Threshold      | Bytes   | KB  | Description             |
| -------------- | ------- | --- | ----------------------- |
| **Optimal**    | 71,680  | 70  | Best deliverability     |
| **Warning**    | 87,040  | 85  | Consider optimization   |
| **Target**     | 92,160  | 90  | Maximum recommended     |
| **Hard Limit** | 104,448 | 102 | Gmail clips beyond this |

## API Endpoints

### POST `/api/gmail-clip-check`

Analyze a single email's HTML content.

**Request:**

```json
{
  "htmlContent": "<html>...</html>",
  "subjectLine": "Optional subject line",
  "preheader": "Optional preheader text",
  "includeMimeOverhead": true
}
```

**Response:**

```json
{
  "success": true,
  "totalBytes": 45678,
  "sizeKB": 44.61,
  "status": "good",
  "summary": "Good! Email size (44.6KB) is within safe limits.",
  "percentOfLimit": 43,
  "bytesRemaining": 58770,
  "domComplexity": {
    "totalNodes": 145,
    "tableCount": 8,
    "divCount": 23,
    "spanCount": 45,
    "maxNestingDepth": 12,
    "inlineStyleCount": 67,
    "inlineStyleBytes": 4532
  },
  "contentSource": {
    "hasMicrosoftMetadata": false,
    "hasGoogleDocsMetadata": false,
    "hasRichTextArtifacts": true,
    "problematicPatterns": ["Rich text artifacts (12 occurrences)"],
    "estimatedBloatBytes": 890
  },
  "suggestions": [...],
  "wordCount": 234,
  "characterCount": 1456,
  "validation": {
    "deploymentReady": true,
    "recommendations": []
  }
}
```

### POST `/api/gmail-clip-check` (Batch)

Analyze multiple email variants for A/B testing.

**Request:**

```json
{
  "variants": [
    { "id": "variant-a", "htmlContent": "...", "subjectLine": "Subject A" },
    { "id": "variant-b", "htmlContent": "...", "subjectLine": "Subject B" }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "results": [...],
  "bestVariantId": "variant-a",
  "summary": {
    "totalVariants": 2,
    "passingVariants": 2,
    "smallestSize": 42.3,
    "largestSize": 48.7
  }
}
```

### PUT `/api/gmail-clip-check`

Sanitize email content by removing problematic metadata.

**Request:**

```json
{
  "htmlContent": "<html>...</html>"
}
```

**Response:**

```json
{
  "success": true,
  "sanitizedContent": "<html>...</html>",
  "bytesRemoved": 2345,
  "percentReduction": 5.2,
  "before": { "sizeKB": 45.0, "status": "warning" },
  "after": { "sizeKB": 42.7, "status": "good" }
}
```

### GET `/api/gmail-clip-check`

Get API documentation and current thresholds.

## Library Functions

### `analyzeEmailSize(htmlContent, options?)`

Main analysis function that returns comprehensive metrics.

```typescript
import { analyzeEmailSize } from "@/lib/email-size-analyzer";

const analysis = analyzeEmailSize(html, {
  subjectLine: "Your subject",
  preheader: "Preview text",
  includeMimeOverhead: true,
});

if (analysis.status === "clipped") {
  console.error("Email will be clipped by Gmail!");
}
```

### `sanitizeEmailHtml(html)`

Remove problematic metadata from HTML.

```typescript
import { sanitizeEmailHtml } from "@/lib/email-size-analyzer";

const { sanitized, bytesRemoved } = sanitizeEmailHtml(dirtyHtml);
console.log(`Removed ${bytesRemoved} bytes of bloat`);
```

### `quickClipCheck(html)`

Fast boolean check for Gmail clipping risk.

```typescript
import { quickClipCheck } from "@/lib/email-size-analyzer";

const { isAtRisk, sizeKB, message } = quickClipCheck(html);
if (isAtRisk) {
  console.warn(message);
}
```

### `validateEmailForDeployment(html, options?)`

Validate email is ready for production deployment.

```typescript
import { validateEmailForDeployment } from "@/lib/email-size-analyzer";

const { valid, analysis, recommendations } = validateEmailForDeployment(html, {
  strictMode: true, // Use optimal limit instead of target
});

if (!valid) {
  recommendations.forEach((r) => console.warn(r));
}
```

## Detection Capabilities

### Microsoft Office Metadata

Detects and flags:

- `mso-` prefixed styles
- `<!--[if mso]>` conditional comments
- `<o:p>` Office paragraph tags
- `<w:WordDocument>` tags
- `xmlns:o` Office namespaces

### Google Docs Artifacts

Detects and flags:

- `docs-internal-guid` IDs
- Docs-specific class patterns
- `data-smartmail` attributes
- `dir="ltr"` direction attributes

### Rich Text Editor Bloat

Detects and flags:

- Legacy `<font>` tags
- Empty styled spans
- HTML comments
- Non-breaking space (`&nbsp;`) abuse
- Empty divs with breaks

## Best Practices

### Content Creation Workflow

1. **Always paste as plain text**
   - Windows: `Ctrl + Shift + V`
   - macOS: `Cmd + Shift + V`

2. **Use "Remove Formatting" tool**
   - Click Tx/Eraser icon in block editor
   - Strips extraneous tags from pasted content

3. **Consolidate content blocks**
   - Use single text blocks with line breaks
   - Avoid separate blocks per paragraph
   - Reduces HTML wrapper nodes

4. **Simplify layout architecture**
   - Minimize nested columns
   - Avoid varying background colors per section
   - Limit complex visual designs

### Validation Workflow

1. **Pre-flight check**

   ```bash
   curl -X POST https://email.topfinanzas.com/api/gmail-clip-check \
     -H "Content-Type: application/json" \
     -d '{"htmlContent": "..."}'
   ```

2. **Send test to Gmail**
   - Send test email to Gmail account
   - Open email → Menu → "Show original"
   - Select "Download Original"
   - Check file size (target < 90KB)

3. **Automated CI check**
   ```typescript
   const { valid } = validateEmailForDeployment(html);
   if (!valid) {
     throw new Error("Email exceeds Gmail size limits");
   }
   ```

## Integration with System Prompt

The AI system prompt has been updated with Gmail clipping prevention guidelines:

- Word count limits enforced
- Clean output guidelines
- No redundant formatting
- Minimal HTML structure requirements

## Word Count Guidelines

| Content Type    | Max Words | Rationale               |
| --------------- | --------- | ----------------------- |
| Marketing email | 60-80     | Utua design philosophy  |
| Newsletter      | 500-800   | Reader engagement limit |
| Transactional   | 100-150   | Clarity focus           |

**Note:** High-volume newsletters (3,000+ words) may breach limits regardless of code efficiency.

## Troubleshooting

### Common Issues

**Issue:** Email clipped despite low word count

- **Cause:** Excessive inline styles or nested tables
- **Solution:** Use `sanitizeEmailHtml()` to strip bloat

**Issue:** Microsoft Office metadata detected

- **Cause:** Copy-paste from Word/Outlook
- **Solution:** Always paste as plain text

**Issue:** High DOM complexity score

- **Cause:** Email builder nesting each block
- **Solution:** Consolidate content blocks, simplify layout

### Debug Commands

```bash
# Check current Gmail limits
curl https://email.topfinanzas.com/api/gmail-clip-check

# Analyze specific content
curl -X POST https://email.topfinanzas.com/api/gmail-clip-check \
  -H "Content-Type: application/json" \
  -d @email.json

# Sanitize content
curl -X PUT https://email.topfinanzas.com/api/gmail-clip-check \
  -H "Content-Type: application/json" \
  -d '{"htmlContent": "..."}'
```

## Performance

- Analysis: ~5-15ms for typical emails
- Sanitization: ~2-8ms
- Batch (10 variants): ~50-100ms

## References

- [Gmail Message Clipping](https://www.litmus.com/blog/do-gmail-image-and-file-size-limits-affect-your-email)
- [Email Size Best Practices](https://www.emailonacid.com/blog/article/email-development/email-file-size-best-practices/)
- [SpamAssassin Documentation](https://spamassassin.apache.org/doc.html)
