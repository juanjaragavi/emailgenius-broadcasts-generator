# Generation Memory System Implementation

## Overview

This document describes the **Generation Memory System** - a robust memory mechanism that provides the LLM with historical context about the 10 most recent email broadcast generations. This context helps prevent repetitive content patterns and improves output diversity.

## Problem Statement

The email generation system was producing similar subject lines, CTAs, and content patterns when generating multiple broadcasts in sequence. Without awareness of recent outputs, the LLM would naturally gravitate toward similar high-performing patterns, resulting in:

- Repetitive subject line structures
- Duplicate CTA button text
- Similar email body opening patterns
- Redundant image prompt concepts

## Solution Architecture

### File-Based Persistence

The system uses a **file-based JSON storage** approach that provides:

1. **Reliability**: Works independently of database availability (which is currently in mock mode)
2. **Simplicity**: No additional dependencies or infrastructure required
3. **Persistence**: Survives server restarts and deployments
4. **Performance**: Fast in-memory cache with file synchronization

### Storage Location

```
/data/generation-memory.json
```

### Maximum Memory Size

The system maintains exactly **10 generations** - older records are automatically pruned when new ones are added.

## Implementation Details

### Core Service: `lib/generation-memory.ts`

The `GenerationMemoryService` provides:

#### Data Structure

```typescript
interface GenerationRecord {
  id: string; // UUID
  timestamp: string; // ISO 8601
  market: string; // USA, UK, Mexico
  platform: string; // ActiveCampaign, ConvertKit
  emailType: string; // security-alert, shipping-update, etc.
  subjectLine: string; // Primary subject line
  subjectLine2?: string; // A/B test variant (ConvertKit)
  previewText: string; // Preheader text
  ctaButtonText: string; // CTA button copy
  bodySnippet?: string; // First 500 chars of email body
  imagePrompt?: string; // Image generation prompt
}
```

#### Key Methods

| Method                     | Description                                                    |
| -------------------------- | -------------------------------------------------------------- |
| `storeGeneration()`        | Adds a new generation record, maintains 10-record limit        |
| `getRecentGenerations()`   | Retrieves records with optional market/platform filtering      |
| `formatAsLLMContext()`     | Formats memory as LLM prompt context with diversity guidelines |
| `getStats()`               | Returns statistics about stored generations                    |
| `clearMemory()`            | Clears all stored generations (for testing)                    |
| `loadFromFile()`           | Loads memory from JSON file                                    |
| `saveToFile()`             | Persists memory to JSON file                                   |
| `ensureDataDirectory()`    | Creates `/data` directory if it doesn't exist                  |
| `generateContextSummary()` | Creates formatted summaries for LLM context                    |

### Integration Points

#### 1. Context Retrieval (Pre-Generation)

In `app/api/generate-broadcast/route.ts`, before calling the LLM:

```typescript
// Load historical context for diversity
let generationMemoryContext = "";
try {
  generationMemoryContext = GenerationMemoryService.formatAsLLMContext({
    limit: 10,
    market: formData.market,
    platform: formData.platform,
  });
} catch (error) {
  console.warn("⚠️ Generation Memory: Failed to load history:", error);
}
```

#### 2. Storage (Post-Generation)

After successful broadcast generation:

```typescript
// Store this generation for future diversity context
try {
  GenerationMemoryService.storeGeneration({
    market: formData.market,
    platform: formData.platform,
    emailType: formData.emailType,
    subjectLine: emailBroadcast.subjectLine1,
    subjectLine2: emailBroadcast.subjectLine2,
    previewText: emailBroadcast.previewText || emailBroadcast.preheaderText,
    ctaButtonText: emailBroadcast.ctaButtonText,
    bodySnippet: emailBroadcast.emailBody?.substring(0, 500),
    imagePrompt: emailBroadcast.imagePrompt,
  });
} catch (memoryError) {
  console.warn("⚠️ Generation Memory: Failed to store:", memoryError);
}
```

## LLM Context Format

The memory is formatted as a special context section in the system prompt:

```markdown
## 🧠 GENERATION MEMORY - DIVERSITY CONTEXT

**CRITICAL INSTRUCTION**: The following are your RECENT email generations. You MUST ensure the new generation is SIGNIFICANTLY DIFFERENT from these. Avoid repeating:

- Similar subject line structures or keywords
- Same CTA button text or similar action phrases
- Redundant opening patterns in email body
- Similar image concepts or visual themes

### Most Recent Generations:

---

**Generation 1** (2 minutes ago)
Market: USA | Platform: ActiveCampaign | Type: security-alert
Subject: 🔒 Your Card Has Been Shipped - Action Required
Preview: Important update about your TopFinanzas credit card shipment
CTA: TRACK MY CARD
Body: Dear %FIRSTNAME%, We're excited to inform you that your new...
Image: Professional photo of a credit card being delivered to a doorstep...

---

**Generation 2** (15 minutes ago)
...
```

## Console Logging

The system includes comprehensive logging for debugging:

```
🧠 Generation Memory: Loading historical context for diversity...
✅ Generation Memory: Loaded 5 records for diversity context
🤖 LLM: Generating email content with Utua visual context (3 examples) and Generation Memory and Database history
✅ Generation Memory: Stored generation (6 total records)
```

## Graceful Degradation

The system is designed to **never block or fail** the generation process:

1. **File System Unavailable**: Falls back to in-memory only (resets on restart)
2. **Parse Errors**: Reinitializes with empty memory
3. **Directory Missing**: Auto-creates `/data` directory
4. **Memory Full**: Automatically prunes oldest records

## Files Modified

| File                                        | Changes                                    |
| ------------------------------------------- | ------------------------------------------ |
| `lib/generation-memory.ts`                  | **NEW** - Complete memory service          |
| `app/api/generate-broadcast/route.ts`       | Added import, retrieval, and storage calls |
| `lib/documents/GENERATION_MEMORY_SYSTEM.md` | **NEW** - This documentation               |

## Testing

To verify the system is working:

1. Generate a broadcast and check console for memory logs
2. Verify `/data/generation-memory.json` is created with the record
3. Generate another broadcast and confirm memory context is loaded
4. Verify the new subject line differs from the stored one

## Future Improvements

Potential enhancements for future iterations:

1. **Database Integration**: When database is available, sync with PostgreSQL
2. **Analytics Dashboard**: Visualize pattern diversity over time
3. **Smart Filtering**: Weight recent generations by similarity score
4. **A/B Testing Tracking**: Track which variations perform better
5. **Market-Specific Memory**: Separate memory pools per market

## Related Documentation

- [ACTIVECAMPAIGN_HTML_RENDERING_FIX.md](./ACTIVECAMPAIGN_HTML_RENDERING_FIX.md) - HTML output formatting
- [PNG_TO_JPG_MIGRATION.md](./PNG_TO_JPG_MIGRATION.md) - Image format changes
- [emailgenius-broadcasts-generator-system-prompt.md](./emailgenius-broadcasts-generator-system-prompt.md) - LLM system prompt
