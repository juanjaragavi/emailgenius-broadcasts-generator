# Spam Analysis Integration

## Overview

EmailGenius now includes a **Spam Analysis Service** powered by **Postmark SpamCheck API** (SpamAssassin). This enables LLM agents and users to validate email content against spam filters before deployment, ensuring optimal deliverability.

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (page.tsx)                       │
│  ┌─────────────────┐    ┌──────────────────────────────────────┐│
│  │ "Analyze Spam"  │───▶│     SpamScoreDisplay Component       ││
│  │     Button      │    │  - Visual score gauge                ││
│  └────────┬────────┘    │  - Pass/Warning/Fail status          ││
│           │             │  - Expandable rule details           ││
│           ▼             └──────────────────────────────────────┘│
└───────────┼─────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│               API Route (/api/spam-check/route.ts)               │
│  - POST: Single email analysis                                   │
│  - POST (batch): A/B variant comparison                          │
│  - GET: API documentation/health check                           │
└───────────┬─────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Library (lib/spam-check.ts)                      │
│  - buildRawEmail(): Constructs RFC-compliant email format        │
│  - parseRulesFromReport(): Extracts SpamAssassin rules           │
│  - checkSpamScore(): Main analysis function                      │
│  - validateEmailVariants(): A/B testing support                  │
└───────────┬─────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Postmark SpamCheck API (External)                   │
│  - Endpoint: https://spamcheck.postmarkapp.com/filter            │
│  - Free, no authentication required                              │
│  - Returns SpamAssassin score + detailed rule breakdown          │
└─────────────────────────────────────────────────────────────────┘
```

## Files Created/Modified

| File                                | Purpose                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `types/spam-check.ts`               | TypeScript interfaces for API responses, thresholds, and helper functions |
| `lib/spam-check.ts`                 | Core library for Postmark API integration                                 |
| `app/api/spam-check/route.ts`       | Next.js API route exposing spam checking                                  |
| `components/spam-score-display.tsx` | React component for visualizing results                                   |
| `app/page.tsx`                      | Updated to include "Analyze Spam Score" button                            |

## Usage

### UI Usage

1. Generate an email broadcast using the form
2. Click **"Analizar Puntaje de Spam"** button in the results section
3. View the score, status (pass/warning/fail), and detailed rule breakdown

### Programmatic Usage (for LLM Agents)

```typescript
// Single email check
const response = await fetch("/api/spam-check", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    content: "<html>Email body here...</html>",
    subjectLine: "Your Subject Line",
    previewText: "Preview text here",
  }),
});

const result = await response.json();
// {
//   success: true,
//   score: 1.2,
//   status: 'pass',
//   summary: 'Good! Your email passes spam filters...',
//   rules: [{ rule: 'HTML_MESSAGE', score: '0.0', description: '...' }]
// }
```

### A/B Testing Support

```typescript
// Compare multiple variants
const response = await fetch("/api/spam-check", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    variants: [
      { id: "A", content: "...", subjectLine: "Subject A" },
      { id: "B", content: "...", subjectLine: "Subject B" },
    ],
  }),
});

const result = await response.json();
// { success: true, results: [...], bestVariantId: 'A' }
```

## Score Thresholds

| Score Range | Status    | Meaning                                           |
| ----------- | --------- | ------------------------------------------------- |
| < 0         | Excellent | Negative score indicates very high deliverability |
| 0 - 2.9     | Pass      | Email should deliver successfully                 |
| 3.0 - 4.9   | Warning   | Moderate risk, consider addressing flagged rules  |
| ≥ 5.0       | Fail      | High risk of being flagged as spam                |

## API Documentation

Access full API documentation by making a GET request:

```bash
curl https://email.topfinanzas.com/api/spam-check
```

## Future Enhancements

1. **GlockApps Integration**: For inbox placement testing (Gmail Primary vs Promotions vs Spam)
2. **Automatic Analysis**: Option to run spam check automatically after every AI generation
3. **Historical Tracking**: Store spam scores in database for trend analysis
4. **Content Suggestions**: AI-powered recommendations to improve scores based on triggered rules
