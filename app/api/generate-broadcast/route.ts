import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { localVisualContextProvider } from "@/lib/local-visual-context";
import { SessionService } from "@/lib/database/services/session.service";
import { BroadcastService } from "@/lib/database/services/broadcast.service";
import { ApiRequestService } from "@/lib/database/services/api-request.service";
import { ILBroadcastService } from "@/lib/database/services/il-broadcast.service";

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

### Word Count Limits (NON-NEGOTIABLE):
- **Concise mode**: 40-60 words max
- **Standard mode**: 60-80 words max  
- **Extended mode**: 80-100 words max

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
- From Name: Personal first name only (e.g., "Emily", "Peter")
- From Email: topfinance@topfinanzas.com (US/UK) or info@topfinanzas.com (Mexico)

## ActiveCampaign HTML Structure Requirements

**CRITICAL**: ActiveCampaign emails MUST use HTML with inline styles. Do NOT generate plain text.

### HTML Email Body Template:
\`\`\`html
<div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333;">
  <p style="margin: 0 0 16px 0;">Hey %FIRSTNAME%,</p>
  
  <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: bold;">YOUR MESSAGE HERE 🎉</p>
  
  <ul style="margin: 0 0 20px 0; padding-left: 20px;">
    <li style="margin-bottom: 8px;">✅ Benefit one</li>
    <li style="margin-bottom: 8px;">✨ Benefit two</li>
    <li style="margin-bottom: 8px;">✔ Benefit three</li>
  </ul>
  
  <p style="margin: 0 0 20px 0;">CTA context text here:</p>
  
  <p style="margin: 0 0 16px 0;">Best,<br>Emily</p>
</div>
\`\`\`

### HTML Inline Style Rules:
- **All styles must be inline** - No external CSS or <style> tags
- **Use <p> tags** with margin: 0 0 16px 0 for paragraphs
- **Use <br> tags** for line breaks within paragraphs
- **Use <ul> and <li>** for bullet lists with inline styles
- **Use <strong> or <b>** for bold text, never **markdown**
- **Keep it simple** - Avoid nested tables or complex structures
- **Font family**: Arial, sans-serif
- **Font size**: 16px (body), 18px (headlines)
- **Line height**: 1.6
- **Text color**: #333333 (dark gray)

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

### ActiveCampaign:
{
  "subjectLine1": "Subject line under 50 chars",
  "previewText": "Preheader under 140 chars",
  "fromName": "FirstName (e.g., Emily)",
  "fromEmail": "topfinance@topfinanzas.com or info@topfinanzas.com",
  "emailBody": "<div style=\"font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333;\"><p style=\"margin: 0 0 16px 0;\">Hey %FIRSTNAME%,</p><p style=\"margin: 0 0 16px 0; font-size: 18px; font-weight: bold;\">MESSAGE 🎉</p><ul style=\"margin: 0 0 20px 0; padding-left: 20px;\"><li style=\"margin-bottom: 8px;\">✅ Benefit</li></ul><p style=\"margin: 0 0 20px 0;\">CTA context</p><p style=\"margin: 0 0 16px 0;\">Best,<br>Emily</p></div>",
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

### Example 2 - ActiveCampaign (HTML):
\`\`\`html
<div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333;">
  <p style="margin: 0 0 16px 0;">Hey %FIRSTNAME%,</p>
  
  <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: bold;">Great news! 🎉 Your loan indication has moved forward.</p>
  
  <p style="margin: 0 0 16px 0;">You now have access to:</p>
  
  <ul style="margin: 0 0 20px 0; padding-left: 20px; list-style-type: none;">
    <li style="margin-bottom: 8px;">✅ A flexible limit</li>
    <li style="margin-bottom: 8px;">✨ Exclusive benefits just for you</li>
  </ul>
  
  <p style="margin: 0 0 20px 0;">Review the details by clicking below:</p>
  
  <p style="margin: 0 0 16px 0;">Best,<br>Emily</p>
</div>
\`\`\`

### Example 3 - ActiveCampaign Card Ready (HTML):
\`\`\`html
<div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333;">
  <p style="margin: 0 0 16px 0;">Hey %FIRSTNAME%,</p>
  
  <p style="margin: 0 0 12px 0; font-size: 20px; font-weight: bold;">YOUR CARD IS READY! 🎉</p>
  <p style="margin: 0 0 16px 0; font-size: 14px; font-style: italic; color: #666666;">*Requires approval</p>
  
  <ul style="margin: 0 0 20px 0; padding-left: 20px; list-style-type: none;">
    <li style="margin-bottom: 8px;">✔ No credit impact when applying</li>
    <li style="margin-bottom: 8px;">✔ No annual or monthly fees</li>
    <li style="margin-bottom: 8px;">✔ Flexible payment options</li>
  </ul>
  
  <p style="margin: 0 0 16px 0;">Best,<br>Peter</p>
</div>
\`\`\`

### Example 4 - ActiveCampaign Spanish/Mexico (HTML):
\`\`\`html
<div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333;">
  <p style="margin: 0 0 16px 0;">Hola %FIRSTNAME%,</p>
  
  <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: bold;">¡Buenas noticias! 🎉 Tu solicitud ha avanzado.</p>
  
  <p style="margin: 0 0 16px 0;">Ahora tienes acceso a:</p>
  
  <ul style="margin: 0 0 20px 0; padding-left: 20px; list-style-type: none;">
    <li style="margin-bottom: 8px;">✅ Un límite flexible</li>
    <li style="margin-bottom: 8px;">✨ Beneficios exclusivos para ti</li>
  </ul>
  
  <p style="margin: 0 0 20px 0;">Revisa los detalles aquí:</p>
  
  <p style="margin: 0 0 16px 0;">Saludos,<br>María</p>
</div>
\`\`\`

## ABSOLUTE PROHIBITIONS

❌ More than 100 words in email body
❌ More than 3 bullet points
❌ Multiple CTA buttons
❌ "Apply Now", "Get Loan", "Click Here" CTAs
❌ Department signatures (e.g., "The Card Issuance Team")
❌ Long paragraphs (more than 2 sentences each)
❌ Excessive bold text (max 2 bold phrases)
❌ **Plain text for ActiveCampaign** (must use HTML!)
❌ Corporate/formal language
❌ Placeholder URLs (example.com)
❌ Detailed feature explanations

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

    // Determine content length instruction
    let lengthInstruction = "";
    switch (formData.contentLength) {
      case "Concise":
        lengthInstruction =
          "Content Length: Concise (Breve) - Keep the email body very short, direct, and to the point. Use minimal text to convey the message. Max 150 words.";
        break;
      case "Extended":
        lengthInstruction =
          "Content Length: Extended (Detallado) - Provide more detailed information and context. You can use more paragraphs and bullet points to explain the offer or update thoroughly. Max 300 words.";
        break;
      case "Standard":
      default:
        lengthInstruction =
          "Content Length: Standard - Balance brevity with sufficient detail. Max 200 words.";
        break;
    }

    // Create user prompt from form data
    const userPrompt = `
Platform: ${formData.platform}
Email Type: ${formData.emailType}
Market: ${formData.market}
Image Type: ${formData.imageType}
${lengthInstruction}
${formData.url ? `URL: ${formData.url}` : ""}
${
  formData.additionalInstructions
    ? `Additional Instructions: ${formData.additionalInstructions}`
    : ""
}   : ""
}
${
  formData.includeHandwrittenSignature
    ? `Include Handwritten Signature: Yes - Include a personalized closing text with professional valediction, sender's name, and title. Also provide signature generation details.`
    : ""
}

Generate an email broadcast based on these specifications.`;

    // Combine system prompt with local visual context
    const contextHeader = contextMetadata.success
      ? `\n\n=== UTUA VISUAL DESIGN CONTEXT ACTIVE ===\nLocal visual context loaded with ${contextMetadata.localExamples} examples at ${new Date().toISOString()}:\n\n`
      : `\n\n=== UTUA DESIGN CONTEXT (SYSTEM PROMPT ONLY) ===\nLocal visual examples not found. Using Utua design principles from system prompt.\n\n`;

    const enhancedSystemPrompt = `${systemPrompt}${contextHeader}${dynamicContext}${recentBroadcastsContext}${ilBroadcastsContext}`;

    console.log(
      `🤖 LLM: Generating email content with ${
        contextMetadata.success
          ? `Utua visual context (${contextMetadata.localExamples} examples)`
          : "system prompt only"
      }${
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
