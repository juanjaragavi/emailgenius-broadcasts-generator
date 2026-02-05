import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { localVisualContextProvider } from "@/lib/local-visual-context";
import { SessionService } from "@/lib/database/services/session.service";
import { BroadcastService } from "@/lib/database/services/broadcast.service";
import { ApiRequestService } from "@/lib/database/services/api-request.service";
import { ILBroadcastService } from "@/lib/database/services/il-broadcast.service";
import { GenerationMemoryService } from "@/lib/generation-memory";
import { QuotaManager } from "@/lib/quota-manager";

// Initialize Vertex AI with service account credentials or ADC
// This will try service account credentials first, then fall back to ADC
let vertex: GoogleGenAI;

if (
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
  process.env.GOOGLE_PRIVATE_KEY
) {
  // Use service account credentials from environment variables
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };

  vertex = new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT || "",
    location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
    googleAuthOptions: {
      credentials: credentials,
    },
  });
} else {
  // Fall back to Application Default Credentials (ADC)
  vertex = new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT || "",
    location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
  });
}

// System prompt for Utua-style visual-first email broadcast generation
const systemPrompt = `# System Prompt - Utua Visual-First Email Design

You are an AI email generation assistant specialized in creating **visual-first, low-text-density** email broadcasts following the "Utua" design language. Your emails MUST prioritize visual hierarchy, concise messaging, and single-action CTAs.

## CRITICAL DESIGN PHILOSOPHY

The Utua design language emphasizes:
- **Minimal text** (60-80 words maximum in email body)
- **Strong visual hierarchy** with centered layouts
- **Single prominent CTA** button
- **Personal, friendly tone** (not corporate)
- **Clean bullet points** with emoji markers (max 3)

## MANDATORY CONTENT CONSTRAINTS

### Word Count Limits (NON-NEGOTIABLE - STRICTLY ENFORCED):
🚨 **THE USER WILL SPECIFY A CONTENT LENGTH MODE. YOU MUST MATCH THE EXACT WORD COUNT RANGE:**
- **Concise mode**: 40-60 words ONLY (ULTRA-BRIEF, MINIMAL TEXT)
- **Standard mode**: 60-80 words ONLY (BALANCED LENGTH)
- **Extended mode**: 80-100 words ONLY (DETAILED, COMPREHENSIVE)

🔴 **CRITICAL**: Each mode produces DISTINCTLY DIFFERENT content lengths.
- Concise should feel noticeably shorter than Standard
- Extended should feel noticeably longer than Standard
- **Failure to match the specified word count will result in REJECTION**

### Structure Template (Follow Exactly):
1. **Greeting** (1 line): "Hey [Name]," or "Hi [Name],"
2. **Hook** (1-2 sentences): Main message with emoji, max 20 words
3. **Benefits** (2-3 bullets): Use ✅ or ✨ markers, 5-8 words each
4. **CTA Context** (1 sentence): Lead to button, max 12 words
5. **CTA Button**: 2-3 words only (SEE LOAN, SEE CARD, REVIEW DETAILS)
6. **Signature** (1 line): "Best, [Name]" or just "[Name]"

### CTA Button Rules:
- Maximum 3 words
- Start with action verbs: SEE, VIEW, CHECK, CONFIRM, REVIEW, REQUEST
- Examples: "SEE LOAN", "SEE CARD", "REVIEW DETAILS", "REQUEST MINE", "CHECK LIMIT"
- FORBIDDEN: "Apply Now", "Get Loan", "Click Here", "Learn More", "Find Out"

### Emoji Usage:
- Use 🎉 for celebrations/good news
- Use ✅ or ✔ for checkmarks/benefits
- Use ✨ for special features
- Maximum 4-5 emojis per email
- NO emoji in subject lines for ActiveCampaign (cleaner look)

## Platform-Specific Formatting

### ConvertKit:
- Use \`{{ subscriber.first_name }}\` for personalization
- Markdown formatting for body
- Two A/B test subject lines required
- Preview text under 140 characters

### ActiveCampaign:
- Use \`%FIRSTNAME%\` for personalization
- **HTML email body with inline styles** (not plain text!)
- Single subject line (with or without emoji based on email type)
- Preheader text under 140 characters
- **From Name: Personal first name only (e.g., "Emily", "Peter", "Sarah", "Michael", "Jessica", "David", "Rachel", "Andrew")**
  - 🚨 **CRITICAL**: ALWAYS use a DIFFERENT sender name than previously used names
  - Generate DIVERSE names representing different genders, ethnicities, and cultural backgrounds
  - **NEVER repeat the same name across consecutive generations**
  - Mix common American/British/Mexican names appropriate to the market
- From Email: topfinance@topfinanzas.com (US/UK) or info@topfinanzas.com (Mexico)

## ActiveCampaign HTML Structure Requirements

**CRITICAL**: ActiveCampaign emails MUST use HTML with inline styles and TABLE-BASED LAYOUTS for maximum email client compatibility.

### MANDATORY OUTPUT STRUCTURE:

🚨 **OUTPUT BODY CONTENT ONLY** - NO \`<html>\`, \`<head>\`, or \`<body>\` tags
🚨 **USE TABLE-BASED LAYOUT** - ActiveCampaign requires table structure, NOT divs

### HTML Email Body Template (TABLE-BASED):
\`\`\`html
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333;">
  <tr>
    <td style="padding: 20px;">
      <p style="margin: 0 0 16px 0;">Hey %FIRSTNAME%,</p>

      <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: bold; color: #000000;">YOUR MESSAGE HERE 🎉</p>

      <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px 0;">
        <tr><td style="padding: 4px 0; font-size: 16px;">✅ Benefit one with descriptive text</td></tr>
        <tr><td style="padding: 4px 0; font-size: 16px;">✨ Benefit two with descriptive text</td></tr>
        <tr><td style="padding: 4px 0; font-size: 16px;">✔ Benefit three with descriptive text</td></tr>
      </table>

      <p style="margin: 0 0 20px 0;">CTA context text here - explain what happens when they click.</p>

      <p style="margin: 0 0 16px 0;">Best,<br>Emily</p>
    </td>
  </tr>
</table>
\`\`\`

### CRITICAL HTML RULES FOR ACTIVECAMPAIGN:

1. **BODY-ONLY OUTPUT**:
   - ❌ NO \`<html>\`, \`<head>\`, \`<body>\`, \`<!DOCTYPE>\` tags
   - ✅ START with \`<table>\` and END with \`</table>\`
   - Content goes DIRECTLY into ActiveCampaign's Builder

2. **TABLE-BASED LAYOUT** (NOT div-based):
   - Primary container: \`<table width="100%" cellpadding="0" cellspacing="0" border="0">\`
   - Content wrapper: \`<tr><td style="padding: 20px;">\`
   - Bullet points: Use nested \`<table>\` with \`<tr><td>\` rows, NOT \`<ul><li>\`

3. **TEXT/HTML RATIO OPTIMIZATION**:
   - ActiveCampaign flags emails with poor text/image ratio
   - INCREASE text content by making descriptions more verbose
   - Each bullet should have 8-12 words (not 3-4 words)
   - Add helpful explanatory text before/after bullets
   - Example BAD bullet: "✅ Fast approval"
   - Example GOOD bullet: "✅ Fast approval process - get your decision within minutes, not days"

4. **INLINE STYLES ONLY**:
   - Every element needs \`style="..."\` attribute
   - NO external CSS or \`<style>\` blocks
   - Font family: \`Arial, sans-serif\` or \`Arial, 'helvetica neue', helvetica, sans-serif\`
   - Font size: 16px (body), 18-20px (headlines)
   - Line height: 1.6
   - Text color: #333333 or #000000

5. **EMAIL CLIENT COMPATIBILITY**:
   - Use \`cellpadding="0" cellspacing="0" border="0"\` on all tables
   - Use \`margin: 0 0 16px 0\` for paragraph spacing
   - Use \`<br>\` for line breaks within cells
   - Use \`<p>\` tags for paragraphs, never bare text

## Image Generation Prompt

Generate prompts for header images matching the Utua visual style:

### Image Style Guidelines:
- **Dark themes**: Navy/teal backgrounds (#1a1a2e, #0d4747) with white/light text
- **Light themes**: Clean white with subtle borders and professional imagery
- **Product focus**: Credit cards, loan documents shown prominently
- **Lifestyle**: Diverse individuals using financial services naturally
- **Minimal clutter**: Single focal point, generous whitespace

### Image Prompt Format:
Start with "Generate an..." and end with "Generate the image with a 16:9 aspect ratio."
Include: scene description, color palette, mood, focal point, mobile optimization note.

## Destination URL Generation

### URL Structure by Market:
- **USA**: https://us.topfinanzas.com/[path]
- **UK**: https://uk.topfinanzas.com/[path]  
- **Mexico**: https://topfinanzas.com/mx/[path] (NOT mx.topfinanzas.com)

### UTM Parameters:
Format: utm_campaign=[country]_tf_[platform]_broad&utm_source=[platform]&utm_medium=email&utm_term=broadcast&utm_content=boton_1

Examples:
- USA ConvertKit: us_tf_kit_broad / convertkit
- USA ActiveCampaign: us_tf_ac_broad / activecampaign
- Mexico ConvertKit: mx_tf_kit_broad / convertkit

## Output Format (JSON)

### ConvertKit:
{
  "subjectLine1": "First A/B subject (curiosity-driven, under 50 chars)",
  "subjectLine2": "Second A/B subject (different angle, under 50 chars)",
  "previewText": "Preview under 140 chars that creates urgency",
  "emailBody": "Utua-style minimal body with {{ subscriber.first_name }}",
  "ctaButtonText": "ACTION (2-3 words)",
  "destinationUrl": "Full URL with UTM params",
  "imagePrompt": "Generate an... 16:9 aspect ratio."
}

### ActiveCampaign (TABLE-BASED HTML):
{
  "subjectLine1": "Subject line under 50 chars",
  "previewText": "Preheader under 140 chars",
  "fromName": "FirstName (e.g., Emily, Peter, Sarah, Michael - MUST be unique)",
  "fromEmail": "topfinance@topfinanzas.com or info@topfinanzas.com",
  "emailBody": "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333;\"><tr><td style=\"padding: 20px;\"><p style=\"margin: 0 0 16px 0;\">Hey %FIRSTNAME%,</p><p style=\"margin: 0 0 16px 0; font-size: 18px; font-weight: bold; color: #000000;\">MESSAGE 🎉</p><p style=\"margin: 0 0 12px 0;\">Context text with explanation</p><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin: 0 0 20px 0;\"><tr><td style=\"padding: 6px 0; font-size: 16px;\">✅ Detailed benefit with 8-12 words of explanation</td></tr></table><p style=\"margin: 0 0 20px 0;\">CTA context explaining what happens when they click</p><p style=\"margin: 0 0 16px 0;\">Best,<br>Emily</p></td></tr></table>",
  "ctaButtonText": "ACTION (2-3 words)",
  "destinationUrl": "Full URL with UTM params",
  "imagePrompt": "Generate an... 16:9 aspect ratio."
}

## Example Outputs (FOLLOW THESE PATTERNS)

### Example 1 - ConvertKit (Markdown):
\`\`\`
Hey {{ subscriber.first_name }},

Great news! 🎉 Your loan indication has moved forward.

You now have access to:
✅ A flexible limit
✨ Exclusive benefits just for you

Review the details by clicking below:

[SEE LOAN]

Best,
Emily
\`\`\`

### Example 2 - ActiveCampaign (TABLE-BASED HTML):
\`\`\`html
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333;">
  <tr>
    <td style="padding: 20px;">
      <p style="margin: 0 0 16px 0;">Hey %FIRSTNAME%,</p>

      <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: bold; color: #000000;">Great news! 🎉 Your loan indication has moved forward.</p>

      <p style="margin: 0 0 12px 0;">You now have access to exclusive financial tools designed for your needs:</p>

      <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px 0;">
        <tr><td style="padding: 6px 0; font-size: 16px;">✅ A flexible credit limit tailored to your financial profile</td></tr>
        <tr><td style="padding: 6px 0; font-size: 16px;">✨ Exclusive benefits including cashback rewards and priority support</td></tr>
      </table>

      <p style="margin: 0 0 20px 0;">Review your complete offer details and available options by clicking the button below.</p>

      <p style="margin: 0 0 16px 0;">Best,<br>Emily</p>
    </td>
  </tr>
</table>
\`\`\`

### Example 3 - ActiveCampaign Card Ready (TABLE-BASED HTML):
\`\`\`html
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333;">
  <tr>
    <td style="padding: 20px;">
      <p style="margin: 0 0 16px 0;">Hey %FIRSTNAME%,</p>

      <p style="margin: 0 0 12px 0; font-size: 20px; font-weight: bold; color: #000000;">YOUR CARD IS READY! 🎉</p>
      <p style="margin: 0 0 16px 0; font-size: 14px; font-style: italic; color: #666666;">*Subject to approval based on your application review</p>

      <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px 0;">
        <tr><td style="padding: 6px 0; font-size: 16px;">✔ No credit score impact when you submit your initial application</td></tr>
        <tr><td style="padding: 6px 0; font-size: 16px;">✔ Zero annual fees, zero monthly maintenance charges</td></tr>
        <tr><td style="padding: 6px 0; font-size: 16px;">✔ Flexible payment plans that adapt to your financial situation</td></tr>
      </table>

      <p style="margin: 0 0 16px 0;">Best,<br>Peter</p>
    </td>
  </tr>
</table>
\`\`\`

### Example 4 - ActiveCampaign Spanish/Mexico (TABLE-BASED HTML):
\`\`\`html
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333;">
  <tr>
    <td style="padding: 20px;">
      <p style="margin: 0 0 16px 0;">Hola %FIRSTNAME%,</p>

      <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: bold; color: #000000;">¡Buenas noticias! 🎉 Tu solicitud ha avanzado exitosamente.</p>

      <p style="margin: 0 0 12px 0;">Ahora tienes acceso a herramientas financieras diseñadas especialmente para ti:</p>

      <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px 0;">
        <tr><td style="padding: 6px 0; font-size: 16px;">✅ Un límite de crédito flexible adaptado a tu perfil financiero</td></tr>
        <tr><td style="padding: 6px 0; font-size: 16px;">✨ Beneficios exclusivos incluyendo recompensas y atención prioritaria</td></tr>
      </table>

      <p style="margin: 0 0 20px 0;">Revisa todos los detalles de tu oferta haciendo clic en el botón de abajo.</p>

      <p style="margin: 0 0 16px 0;">Saludos,<br>María</p>
    </td>
  </tr>
</table>
\`\`\`

## ABSOLUTE PROHIBITIONS

❌ More than 100 words in email body (respect content length mode)
❌ More than 3 bullet points
❌ Multiple CTA buttons
❌ "Apply Now", "Get Loan", "Click Here" CTAs
❌ Department signatures (e.g., "The Card Issuance Team")
❌ Long paragraphs (more than 2 sentences each)
❌ Excessive bold text (max 2 bold phrases)
❌ **Plain text for ActiveCampaign** (must use TABLE-BASED HTML!)
❌ **DIV-based layouts for ActiveCampaign** (must use TABLES!)
❌ **Including \`<html>\`, \`<head>\`, \`<body>\` tags** (BODY-ONLY OUTPUT!)
❌ **Using \`<ul><li>\` for bullets in ActiveCampaign** (use nested tables!)
❌ **Short bullets with 3-4 words** (need 8-12 words for good text/HTML ratio!)
❌ Corporate/formal language
❌ Placeholder URLs (example.com)
❌ Detailed feature explanations beyond bullet descriptions
❌ Repeating sender names from Generation Memory context

## GMAIL CLIPPING PREVENTION

Gmail enforces a strict clipping threshold of approximately 102KB (104,448 bytes). When HTML content exceeds this limit, the message is truncated, potentially hiding the unsubscribe link and preventing tracking pixels from firing.

### Mandatory Content Constraints for Deliverability:
- **Target size**: < 90KB final MIME message
- **Hard limit**: 102KB (content will be clipped beyond this)
- **Word count**: Keep under 500 words to prevent size bloat

### Content Optimization Rules:
1. **Use minimal HTML structure** - Avoid deeply nested tables/divs
2. **No Microsoft Office metadata** - Content should be clean, no mso- styles
3. **No Google Docs artifacts** - No data-smartmail or docs-internal-guid attributes
4. **Efficient formatting** - Use inline styles for ActiveCampaign, Markdown for ConvertKit
5. **No empty elements** - Remove empty spans, divs, or paragraphs
6. **No HTML comments** - Strip all <!-- --> comments from output
7. **Minimal whitespace** - No excessive spacing or indentation in HTML

### Output Guidelines:
- **ActiveCampaign**: Generate clean HTML with inline styles (see examples above)
- **ConvertKit**: Generate clean Markdown/text with proper formatting
- Avoid redundant formatting or nested emphasis
- Use single line breaks in HTML, not multiple
- Keep bullet lists to 3 items maximum
- No placeholder or filler content

## IMPORTANT RULES

1. **OUTPUT IMMEDIATELY**: Start response with JSON object only. No introductory text.
2. **WORD COUNT**: Count and verify body is under limit before responding.
3. **CTA BREVITY**: Maximum 3 words. Verify before responding.
4. **PERSONALIZATION**: Use correct platform variable.
5. **URL ACCURACY**: Use correct TopFinanzas domain for market.
6. **SIGNATURE**: First name only, friendly tone.

Generate content that follows these Utua design principles exactly.`;

interface FormData {
  platform: "ActiveCampaign" | "ConvertKit";
  emailType: string;
  market: "USA" | "UK" | "Mexico";
  imageType: string;
  contentLength?: "Concise" | "Standard" | "Extended";
  url?: string;
  additionalInstructions?: string;
  includeHandwrittenSignature?: boolean;
  session_id?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let sessionId = "";

  try {
    // Check Gemini API quota before processing
    const geminiQuota = QuotaManager.canMakeGeminiRequest();
    if (!geminiQuota.allowed) {
      console.error(`🚫 Quota: ${geminiQuota.reason}`);
      return NextResponse.json(
        {
          error: "API quota exceeded",
          details: geminiQuota.reason,
          quota: {
            used: geminiQuota.usage,
            limit: geminiQuota.limit,
            remaining: geminiQuota.remaining,
            resetAt: geminiQuota.resetAt,
          },
        },
        { status: 429 }
      );
    }

    const formData: FormData = await request.json();
    sessionId =
      formData.session_id ||
      `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Ensure session exists
    try {
      let session = await SessionService.getSession(sessionId);
      if (!session) {
        session = await SessionService.createSession(sessionId);
      }
    } catch (dbError) {
      console.error("Database error creating/fetching session:", dbError);
      // Continue without DB if it fails, but log it
    }

    // Fetch dynamic context from GitHub repositories via MCP integration
    let dynamicContext = "";
    let contextMetadata = {
      success: false,
      localExamples: 0,
      contextLength: 0,
      fetchTime: 0,
    };

    try {
      console.log(
        "🎨 Local Visual Context: Loading Utua design principles and local examples..."
      );
      const fetchStartTime = Date.now();

      // Use local visual context instead of external GitHub repos
      dynamicContext = localVisualContextProvider.getContext();
      const examples = localVisualContextProvider.getExamples();

      const fetchEndTime = Date.now();
      contextMetadata = {
        success: true,
        localExamples: examples.length,
        contextLength: dynamicContext.length,
        fetchTime: fetchEndTime - fetchStartTime,
      };

      console.log(
        `✅ Local Visual Context: Loaded ${examples.length} examples, ${contextMetadata.contextLength} chars in ${contextMetadata.fetchTime}ms`
      );
    } catch (error) {
      console.warn(
        "⚠️ Local Visual Context: Failed to load, using system prompt only:",
        error
      );
      contextMetadata.success = false;
    }

    // GENERATION MEMORY: Fetch recent generations for diversity context
    let generationMemoryContext = "";
    try {
      console.log(
        "🧠 Generation Memory: Loading historical context for diversity..."
      );
      generationMemoryContext = GenerationMemoryService.formatAsLLMContext({
        limit: 10,
        market: formData.market,
        platform: formData.platform,
      });

      if (generationMemoryContext) {
        const stats = GenerationMemoryService.getStats();
        console.log(
          `✅ Generation Memory: Loaded ${stats.totalGenerations} records for diversity context`
        );
      } else {
        console.log(
          "ℹ️ Generation Memory: No previous generations found (first run)"
        );
      }
    } catch (error) {
      console.warn(
        "⚠️ Generation Memory: Failed to load history, continuing without:",
        error
      );
    }

    // Note: Supermemory integration removed - using local visual context and database only

    // Fetch recent broadcasts from Database for negative constraints
    let recentBroadcastsContext = "";
    try {
      console.log(
        "🗄️ Database: Fetching recent broadcasts for uniqueness context..."
      );
      const recentBroadcasts = await BroadcastService.getRecentBroadcasts(
        5,
        formData.market,
        formData.platform
      );

      if (recentBroadcasts.length > 0) {
        recentBroadcastsContext = `
## RECENTLY GENERATED BROADCASTS (NEGATIVE CONSTRAINTS)

The following emails were recently generated for this market and platform. You MUST NOT duplicate these subject lines or exact content patterns. Use them as a reference for what has already been sent, and ensure your new generation is distinct and unique.

${recentBroadcasts
  .map(
    (b, i) => `
--- Broadcast ${i + 1} ---
Subject: ${b.title}
Content Snippet: ${b.content ? b.content.substring(0, 300).replace(/\n/g, " ") : "N/A"}...
`
  )
  .join("\n")}
`;
        console.log(
          `✅ Database: Retrieved ${recentBroadcasts.length} recent broadcasts for context`
        );
      } else {
        console.log("ℹ️ Database: No recent broadcasts found for context");
      }
    } catch (error) {
      console.warn("⚠️ Database: Failed to fetch recent broadcasts:", error);
    }

    // Fetch IL broadcasts dataset for negative constraints
    let ilBroadcastsContext = "";
    try {
      console.log(
        "🗄️ Database: Fetching IL broadcasts dataset for uniqueness context..."
      );

      const ilBroadcasts = await ILBroadcastService.getRecentBroadcasts({
        limit: 5,
        market: formData.market,
        platform: formData.platform,
      });

      if (ilBroadcasts.length > 0) {
        const serializeField = (value: unknown) =>
          typeof value === "string"
            ? value
            : value === undefined || value === null
              ? ""
              : String(value);

        ilBroadcastsContext = `
## IL DATASET REFERENCE (DO NOT REPEAT)

The following broadcasts exist in the il_broadcasts dataset. Use them only as negative examples. Do NOT reuse their subject lines, preheaders, CTA phrases, or body wording. Generate fresh, distinct content.

${ilBroadcasts
  .map((b, i) => {
    const subject = serializeField(b["subject"] || b["title"]);
    const preheader = serializeField(
      b["preheader"] || b["preview_text"] || b["preview"]
    );
    const body = serializeField(b["email_body"] || b["body"] || b["content"]);
    const spamScore = serializeField(b["spam_score"]);
    const marketTag = serializeField(
      b["market"] || b["country"] || b["locale"]
    );
    const platformTag = serializeField(b["platform"] || b["email_platform"]);
    const timestamp = serializeField(
      b["created_at"] || b["sent_at"] || b["updated_at"]
    );
    const snippet = body ? body.substring(0, 300).replace(/\n/g, " ") : "";

    return `--- IL Broadcast ${i + 1} ---\n${subject ? `Subject: ${subject}\n` : ""}${preheader ? `Preheader: ${preheader}\n` : ""}${marketTag || platformTag ? `Market/Platform: ${marketTag} ${platformTag}\n` : ""}${spamScore ? `Spam Score: ${spamScore}\n` : ""}${timestamp ? `Timestamp: ${timestamp}\n` : ""}${snippet ? `Content Snippet: ${snippet}...\n` : ""}`;
  })
  .join("\n")}
`;

        console.log(
          `✅ Database: Retrieved ${ilBroadcasts.length} IL broadcasts for context`
        );
      } else {
        console.log("ℹ️ Database: No IL broadcasts found for context");
      }
    } catch (error) {
      console.warn(
        "⚠️ Database: Failed to fetch IL broadcasts dataset:",
        error
      );
    }

    // Determine content length instruction with STRONG enforcement
    let lengthInstruction = "";
    let wordCountEnforcement = "";

    switch (formData.contentLength) {
      case "Concise":
        lengthInstruction =
          "**MANDATORY CONTENT LENGTH: CONCISE (Breve)**\n\n" +
          "YOU MUST generate VERY SHORT, ULTRA-BRIEF content.\n" +
          "WORD COUNT CONSTRAINT: **40-60 words maximum** in email body.\n" +
          "STRUCTURE: 1 short greeting + 1-2 sentence hook + 2-3 ultra-brief bullets + 1 CTA lead-in.\n" +
          "NO ELABORATION. NO EXTRA DETAILS. ABSOLUTE MINIMUM TEXT.\n" +
          "If you generate more than 60 words, the output will be REJECTED.";
        wordCountEnforcement = "CONCISE MODE: 40-60 WORDS MAXIMUM";
        break;
      case "Extended":
        lengthInstruction =
          "**MANDATORY CONTENT LENGTH: EXTENDED (Detallado)**\n\n" +
          "YOU MUST generate DETAILED, COMPREHENSIVE content with explanations.\n" +
          "WORD COUNT CONSTRAINT: **80-100 words in email body**.\n" +
          "STRUCTURE: Full greeting + 2-3 sentence hook with context + 3-4 detailed bullets with explanations + 2 sentence CTA lead-in.\n" +
          "PROVIDE THOROUGH INFORMATION. INCLUDE CONTEXT AND BENEFITS.\n" +
          "You MUST use 80-100 words to fully explain the offer.";
        wordCountEnforcement = "EXTENDED MODE: 80-100 WORDS REQUIRED";
        break;
      case "Standard":
      default:
        lengthInstruction =
          "**MANDATORY CONTENT LENGTH: STANDARD**\n\n" +
          "YOU MUST generate BALANCED content - not too brief, not too long.\n" +
          "WORD COUNT CONSTRAINT: **60-80 words in email body**.\n" +
          "STRUCTURE: Greeting + 2 sentence hook + 3 moderate bullets + 1 CTA lead-in.\n" +
          "BALANCE brevity with sufficient detail. NEITHER sparse NOR verbose.\n" +
          "Stay within the 60-80 word range strictly.";
        wordCountEnforcement = "STANDARD MODE: 60-80 WORDS";
        break;
    }

    // Create user prompt from form data with PROMINENT length enforcement
    const userPrompt = `
=== GENERATION PARAMETERS ===

Platform: ${formData.platform}
Email Type: ${formData.emailType}
Market: ${formData.market}
Image Type: ${formData.imageType}

=== CRITICAL CONTENT LENGTH CONSTRAINT ===
${lengthInstruction}

${wordCountEnforcement ? `\n🚨 WORD COUNT ENFORCEMENT: ${wordCountEnforcement}\n` : ""}

${formData.url ? `URL Reference: ${formData.url}` : ""}
${
  formData.additionalInstructions
    ? `Additional Instructions: ${formData.additionalInstructions}`
    : ""
}
${
  formData.includeHandwrittenSignature
    ? `Include Handwritten Signature: Yes - Include a personalized closing text with professional valediction, sender's name, and title. Also provide signature generation details.`
    : ""
}

IMPORTANT: The content length specification above is MANDATORY and MUST be followed exactly. Word count compliance is non-negotiable.

Generate an email broadcast based on these specifications.`;

    // Combine system prompt with local visual context
    const contextHeader = contextMetadata.success
      ? `\n\n=== UTUA VISUAL DESIGN CONTEXT ACTIVE ===\nLocal visual context loaded with ${contextMetadata.localExamples} examples at ${new Date().toISOString()}:\n\n`
      : `\n\n=== UTUA DESIGN CONTEXT (SYSTEM PROMPT ONLY) ===\nLocal visual examples not found. Using Utua design principles from system prompt.\n\n`;

    const enhancedSystemPrompt = `${systemPrompt}${contextHeader}${dynamicContext}${generationMemoryContext}${recentBroadcastsContext}${ilBroadcastsContext}`;

    console.log(
      `🤖 LLM: Generating email content with ${
        contextMetadata.success
          ? `Utua visual context (${contextMetadata.localExamples} examples)`
          : "system prompt only"
      }${generationMemoryContext ? " and Generation Memory" : ""}${
        recentBroadcastsContext ? " and Database history" : ""
      }${ilBroadcastsContext ? " and IL dataset" : ""}`
    );

    // Generate content using Vertex AI with enhanced context
    const result = await vertex.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `${enhancedSystemPrompt}\n\n${userPrompt}` }],
        },
      ],
    });

    // Record successful Gemini API usage
    QuotaManager.recordGeminiRequest();

    // Extract the text from the response
    const text = result.text || "";

    // Extract usage metadata if available
    const response = result as unknown as {
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
      };
    };
    const usageMetadata = response.usageMetadata || {};
    const inputTokens = usageMetadata.promptTokenCount || 0;
    const outputTokens = usageMetadata.candidatesTokenCount || 0;

    // Try to parse the JSON response
    let emailBroadcast;
    try {
      // Clean up the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        emailBroadcast = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      console.error("Failed to parse JSON response:", text);

      // Log failed request
      try {
        await ApiRequestService.logRequest({
          session_id: sessionId,
          request_type: "generate_broadcast",
          model_used: "gemini-2.5-flash",
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          status: "failed",
          error_message: "Failed to parse JSON response",
          response_time_ms: Date.now() - startTime,
        });
      } catch (e) {
        console.error("Failed to log API request", e);
      }

      return NextResponse.json(
        { error: "Error parsing AI response" },
        { status: 500 }
      );
    }

    // Note: Supermemory storage removed - using database only for persistence

    // Store in Database
    let broadcastId = null;
    try {
      const broadcast = await BroadcastService.createBroadcast({
        session_id: sessionId,
        title: emailBroadcast.subjectLine1,
        content: emailBroadcast.emailBody,
        target_market: formData.market,
        email_platform: formData.platform,
        configuration: formData as unknown as Record<string, unknown>,
        generated_content: emailBroadcast,
        images: emailBroadcast.imagePrompt
          ? { prompt: emailBroadcast.imagePrompt }
          : {},
        status: "generated",
      });
      broadcastId = broadcast.id;
      console.log(`✅ Database: Broadcast stored with ID ${broadcastId}`);
    } catch (dbError) {
      console.error("⚠️ Database: Failed to store broadcast:", dbError);
    }

    // GENERATION MEMORY: Store this generation for future diversity context
    try {
      const storedRecord = GenerationMemoryService.storeGeneration({
        market: formData.market,
        platform: formData.platform,
        emailType: formData.emailType,
        subjectLine: emailBroadcast.subjectLine1,
        subjectLine2: emailBroadcast.subjectLine2,
        previewText: emailBroadcast.previewText || emailBroadcast.preheaderText,
        ctaButtonText: emailBroadcast.ctaButtonText,
        bodySnippet: emailBroadcast.emailBody
          ? emailBroadcast.emailBody.substring(0, 500)
          : undefined,
        imagePrompt: emailBroadcast.imagePrompt,
      });

      if (storedRecord) {
        const stats = GenerationMemoryService.getStats();
        console.log(
          `✅ Generation Memory: Stored generation (${stats.totalGenerations} total records)`
        );
      }
    } catch (memoryError) {
      console.warn(
        "⚠️ Generation Memory: Failed to store generation:",
        memoryError
      );
    }

    // Log API Request
    try {
      await ApiRequestService.logRequest({
        session_id: sessionId,
        request_type: "generate_broadcast",
        model_used: "gemini-2.5-flash",
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        // Estimate cost: $0.000125 / 1k chars input, $0.000375 / 1k chars output (approx for Flash/Pro)
        // Or use token pricing if known. Gemini 1.5 Pro: Input $3.50/1M, Output $10.50/1M
        // Gemini 1.5 Flash: Input $0.075/1M, Output $0.30/1M
        // Assuming Gemini 1.5 Pro pricing for now as "gemini-2.5-flash" might be a placeholder for 1.5 Pro or similar
        cost: (inputTokens / 1000000) * 3.5 + (outputTokens / 1000000) * 10.5,
        status: "success",
        response_time_ms: Date.now() - startTime,
      });
    } catch (e) {
      console.error("Failed to log API request", e);
    }

    return NextResponse.json({
      ...emailBroadcast,
      _meta: {
        session_id: sessionId,
        broadcast_id: broadcastId,
      },
    });
  } catch (error) {
    console.error("Error generating broadcast:", error);
    return NextResponse.json(
      { error: "Error generating broadcast" },
      { status: 500 }
    );
  }
}
