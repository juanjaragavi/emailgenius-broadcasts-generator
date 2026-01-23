/**
 * Local Visual Context Provider
 *
 * This utility provides context from local visual examples stored in
 * public/images/ directory instead of fetching from external GitHub repos.
 * Implements the Utua design language for visual-first, concise email generation.
 */

import fs from "fs";
import path from "path";

export interface LocalVisualExample {
  filename: string;
  path: string;
  type: "webp" | "png" | "jpg";
  addedAt?: string;
}

export interface UtualDesignContext {
  designPrinciples: string;
  visualExamples: LocalVisualExample[];
  totalExamples: number;
  lastUpdated: string;
}

/**
 * Utua Design Language Specification
 *
 * Based on analysis of provided screenshot examples:
 * - Dark teal/navy backgrounds with high contrast text
 * - Minimal text density (3-5 short lines max)
 * - Single prominent CTA button
 * - Clean visual hierarchy with centered layout
 * - Personal greeting with first name
 * - Professional sender signatures
 * - Optional header image (product or lifestyle)
 */
export const UTUA_DESIGN_PRINCIPLES = `
## UTUA VISUAL DESIGN LANGUAGE - MANDATORY CONSTRAINTS

You are generating emails that MUST follow the "Utua" design language - a visual-first, 
low-text-density approach that maximizes engagement through visual hierarchy and concise messaging.

### CRITICAL DESIGN CONSTRAINTS (NON-NEGOTIABLE):

1. **TEXT DENSITY LIMIT**: Maximum 80 words in email body (excluding CTA)
   - Greeting: 1 line (e.g., "Hey Frank,")
   - Main hook: 1-2 short sentences (max 25 words)
   - Benefits: 2-3 bullet points with checkmarks/emojis
   - CTA context: 1 short sentence (max 15 words)
   - Signature: Name only or "Best regards, [Name]"

2. **VISUAL HIERARCHY RULES**:
   - Single column, centered layout
   - Large, prominent CTA button (single action)
   - Optional: Header image or product visual
   - Generous whitespace between sections
   - Bold text ONLY for key emphasis (1-2 instances max)

3. **CTA BUTTON REQUIREMENTS**:
   - Maximum 3 words (e.g., "SEE LOAN", "SEE CARD", "REVIEW DETAILS")
   - Action-oriented verbs: SEE, VIEW, CHECK, CONFIRM, REVIEW
   - NEVER use: "Apply Now", "Get Loan", "Click Here", "Learn More"
   - High contrast color (green, orange, or blue on dark backgrounds)

4. **GREETING & SIGNATURE STYLE**:
   - Greeting: "Hey [FirstName]," or "Hi [FirstName],"
   - Signature: Single line - just name (e.g., "Emily") or "Best, [Name]"
   - NEVER include job titles, departments, or lengthy closings

5. **BULLET POINT RULES**:
   - Use ✅ or ✨ emojis as bullet markers
   - Maximum 3 bullet points per email
   - Each bullet: 5-8 words maximum
   - Focus on benefits, not features

6. **COLOR THEME PATTERNS** (for image prompts):
   - Dark backgrounds: Navy (#1a1a2e), Teal (#0d4747), Slate (#334155)
   - Light backgrounds: Clean white with subtle borders
   - Accent colors: Green (#10b981), Orange (#f97316), Blue (#3b82f6)

### EXAMPLE STRUCTURES (FOLLOW EXACTLY):

**Structure A - Status Update (Dark Theme)**:
\`\`\`
Hey [Name],

Great news! 🎉 Your loan indication has moved forward.

You now have access to:
✅ A flexible limit
✨ Exclusive benefits just for you

Review the details and take the next step by clicking below:

[SEE LOAN]

Best regards,
Emily
\`\`\`

**Structure B - Product Card (Light Theme)**:
\`\`\`
[Header Image: Credit card product]

We have carefully analyzed your data and have come to the conclusion 
that this is the best card we can refer you to.

• Up to $30,000 credit limit
• No interest charges
• No security deposit
• No credit check required

[SEE CARD]
\`\`\`

**Structure C - Personalized Notification**:
\`\`\`
Hey [Name], how are you?

YOUR CARD IS READY!
*Requires approval

[SEE CARD]

✔ No credit impact when applying
✔ No annual or monthly fees
✔ Choose between Pay in 4, Pay in Full, or long-term financing

Best,
Peter Elias
\`\`\`

### WHAT TO AVOID (ABSOLUTELY FORBIDDEN):

❌ Long paragraphs (more than 2 sentences)
❌ Multiple CTA buttons
❌ Detailed explanations or features lists
❌ Department signatures or corporate closings
❌ "Click here" or "Apply Now" CTAs
❌ More than 3 bullet points
❌ Text-heavy layouts exceeding 80 words
❌ Formal or overly corporate language
❌ Multiple font sizes or excessive formatting
❌ Cluttered layouts with many visual elements
`;

/**
 * Get list of local visual examples from public/images directory
 */
export function getLocalVisualExamples(): LocalVisualExample[] {
  const imagesDir = path.join(process.cwd(), "public", "images");
  const examples: LocalVisualExample[] = [];

  try {
    if (fs.existsSync(imagesDir)) {
      const files = fs.readdirSync(imagesDir);

      for (const file of files) {
        const ext = path.extname(file).toLowerCase().slice(1);
        if (["webp", "png", "jpg", "jpeg"].includes(ext)) {
          const filePath = path.join(imagesDir, file);
          const stats = fs.statSync(filePath);

          examples.push({
            filename: file,
            path: `/images/${file}`,
            type: ext === "jpeg" ? "jpg" : (ext as "webp" | "png" | "jpg"),
            addedAt: stats.mtime.toISOString(),
          });
        }
      }
    }
  } catch (error) {
    console.warn("⚠️ Failed to read local visual examples:", error);
  }

  return examples.sort(
    (a, b) =>
      new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime()
  );
}

/**
 * Generate LLM context from local visual examples and Utua design principles
 */
export function generateLocalVisualContext(): string {
  const examples = getLocalVisualExamples();

  let context = `\n\n=== LOCAL VISUAL DESIGN CONTEXT ===\n`;
  context += `**Context generated at:** ${new Date().toISOString()}\n\n`;

  // Add Utua design principles
  context += UTUA_DESIGN_PRINCIPLES;

  // Add reference to local examples
  if (examples.length > 0) {
    context += `\n\n### AVAILABLE VISUAL REFERENCE EXAMPLES\n\n`;
    context += `The following ${examples.length} visual examples are stored locally in the application:\n\n`;

    for (const example of examples) {
      context += `- **${example.filename}** (${example.type.toUpperCase()}) - Added: ${example.addedAt?.split("T")[0] || "N/A"}\n`;
    }

    context += `\n**Reference Pattern**: These screenshots represent successful email designs from the Utua campaign `;
    context += `series. Each demonstrates the visual-first, low-text-density approach that achieves high engagement.\n`;
  } else {
    context += `\n\n### NO LOCAL EXAMPLES FOUND\n`;
    context += `No visual examples found in public/images/. Relying on Utua design principles only.\n`;
  }

  context += `\n---\n\n`;

  return context;
}

/**
 * Get comprehensive design context for email generation
 */
export function getUtualDesignContext(): UtualDesignContext {
  const examples = getLocalVisualExamples();

  return {
    designPrinciples: UTUA_DESIGN_PRINCIPLES,
    visualExamples: examples,
    totalExamples: examples.length,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Validate email content against Utua design constraints
 */
export function validateUtualCompliance(emailBody: string): {
  isCompliant: boolean;
  wordCount: number;
  issues: string[];
} {
  const issues: string[] = [];
  const words = emailBody.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  // Check word count limit
  if (wordCount > 100) {
    issues.push(`Word count (${wordCount}) exceeds Utua limit of 80-100 words`);
  }

  // Check for forbidden phrases
  const forbiddenPhrases = [
    "apply now",
    "get loan",
    "click here",
    "learn more",
    "find out",
  ];
  for (const phrase of forbiddenPhrases) {
    if (emailBody.toLowerCase().includes(phrase)) {
      issues.push(`Contains forbidden phrase: "${phrase}"`);
    }
  }

  // Check bullet count (rough estimate)
  const bulletMatches = emailBody.match(/[•✅✨⚠️✔]/g) || [];
  if (bulletMatches.length > 4) {
    issues.push(`Too many bullet points (${bulletMatches.length}), max 3-4`);
  }

  return {
    isCompliant: issues.length === 0,
    wordCount,
    issues,
  };
}

// Export singleton instance for consistent context
class LocalVisualContextProvider {
  private cachedContext: string | null = null;
  private cacheTime: Date | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  getContext(): string {
    const now = new Date();

    if (
      this.cachedContext &&
      this.cacheTime &&
      now.getTime() - this.cacheTime.getTime() < this.CACHE_TTL
    ) {
      console.log("📦 Using cached local visual context");
      return this.cachedContext;
    }

    console.log("🔄 Generating fresh local visual context...");
    this.cachedContext = generateLocalVisualContext();
    this.cacheTime = now;

    return this.cachedContext;
  }

  clearCache(): void {
    this.cachedContext = null;
    this.cacheTime = null;
  }

  getExamples(): LocalVisualExample[] {
    return getLocalVisualExamples();
  }
}

export const localVisualContextProvider = new LocalVisualContextProvider();
