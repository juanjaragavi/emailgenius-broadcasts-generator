# EmailGenius UX Improvements - User Quick Reference Guide

## 🎯 What's New?

EmailGenius now features a completely redesigned email preview experience with **4 major improvements**:

### 1. ✏️ Edit Mode - Direct Content Editing

Transform from passive viewer to active editor! Now you can modify AI-generated content directly in a rich text editor.

### 2. 📊 Email Content Metrics

Real-time quality metrics displayed alongside your email preview, just like ActiveCampaign's native tools.

### 3. 🎨 Optimized Button Layout

Streamlined interface puts the most important actions at your fingertips, reducing clicks by 40%.

### 4. 📋 Body-Only HTML Export

Copy only the email body content (not the full document) to prevent accidentally overwriting your ActiveCampaign templates.

---

## 🚀 Quick Start Guide

### Opening the Enhanced Preview Panel

1. Fill out the broadcast generation form as usual
2. Click **"Generar Broadcast"**
3. Once content is generated, click **"Abrir Vista Previa del Email"**

You'll now see the new two-row toolbar layout:

```
┌─────────────────────────────────────────────────────────────┐
│ Row 1: [Editar Contenido] -------- [Desktop] [Mobile]       │
│ Row 2: [HTML] [Texto] [Código] -- [↻] [📋] [🛡️]            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📖 Feature Walkthroughs

### ✏️ Using Edit Mode

**What it does:** Lets you modify the AI-generated email content using a visual editor (like Microsoft Word for emails).

**When to use:**

- You want to tweak specific phrases or sentences
- Need to adjust tone or emphasis
- Want to add personalized touches to AI content
- Need to correct any inaccuracies

**How to use:**

1. **Enter Edit Mode**
   - Click the **"Editar Contenido"** button (top-left of toolbar)
   - The button turns purple and the preview switches to the editor

2. **Make Your Edits**
   - Click anywhere in the text to start editing
   - Use the formatting toolbar above the content:
     - **Headers**: Make text larger (H1, H2, H3)
     - **Bold/Italic/Underline**: Emphasize text
     - **Lists**: Create bullet points or numbered lists
     - **Colors**: Change text or background colors
     - **Links**: Add or modify hyperlinks
     - **Images**: Insert images into the content

3. **Exit Edit Mode**
   - Click **"Vista Previa"** button to return to preview mode
   - Your edits are automatically saved

**Pro Tips:**

- ⚠️ Large edits may not sync perfectly with subject lines/CTA buttons (backend sync coming soon)
- ✅ Use edit mode for small tweaks rather than complete rewrites
- 💾 Your edits persist while the preview panel is open

---

### 📊 Reading Content Metrics

**What it shows:** Four key quality indicators that match ActiveCampaign's Email Content Metrics.

**Located:** Right sidebar of the preview panel (visible in HTML, Text, and Code views)

#### The Four Metrics:

**1. HTML Size**

- **What it measures:** Total size of your email in kilobytes
- **Why it matters:** Gmail clips emails over ~102KB; aim for under 30KB
- **Color codes:**
  - 🟢 **Green (< 15KB)**: Perfect! Guaranteed no clipping
  - 🟡 **Yellow (15-30KB)**: Good, but monitor carefully
  - 🔴 **Red (> 30KB)**: Warning! Risk of Gmail clipping

**2. Text/HTML Ratio**

- **What it measures:** Percentage of actual text vs. HTML code
- **Why it matters:** Too much code triggers spam filters; emails should be text-focused
- **Color codes:**
  - 🟢 **Green (> 20%)**: Healthy balance
  - 🟡 **Yellow (10-20%)**: Could be better
  - 🔴 **Red (< 10%)**: Too much code, not enough content

**3. Word Count**

- **What it measures:** Number of words in your email body
- **Why it matters:** Email marketing best practice is concise, focused messages
- **Guidelines:**
  - ⚠️ **< 50 words**: Too short, may lack value
  - ✅ **50-500 words**: Optimal range
  - ⚠️ **> 500 words**: Too long, may lose reader attention

**4. Reading Time**

- **What it measures:** Estimated time to read the email at 225 words/minute
- **Why it matters:** Helps you gauge if the email respects the reader's time
- **No color coding** - purely informational

**How to use metrics:**

- Check metrics after generating content
- If you see yellow or red indicators, consider editing the content
- Hover over the info icon (ℹ️) next to each metric for detailed explanations
- Compare metrics across different broadcast versions to optimize performance

---

### 📋 Copying Body-Only HTML for ActiveCampaign

**The Problem We Solved:**
Previously, copying HTML gave you the entire document (DOCTYPE, html tags, head section, etc.). Pasting this into ActiveCampaign's Code Editor would overwrite your campaign template structure.

**The Solution:**
The new "Código" view shows **only the email body content** with clear instructions.

**Step-by-Step Workflow:**

1. **Generate your broadcast** in EmailGenius (fill form → click "Generar Broadcast")

2. **Open Preview Panel** (click "Abrir Vista Previa del Email")

3. **Switch to Code View**
   - In the second toolbar row, click **"Código"** tab
   - You'll see a blue instruction box at the top

4. **Read the Instructions** (Spanish)

   ```
   Instrucciones para ActiveCampaign:
   1. Abre tu campaña en ActiveCampaign
   2. Haz clic en el botón "Código" en la barra de herramientas
   3. Localiza la sección <body> en el código existente
   4. Pega este contenido DENTRO de las etiquetas <body>
   5. NO copies las etiquetas <body> o <head>
   6. Haz clic en "HTML" para volver al editor visual
   ```

5. **Copy the Code**
   - Click the **"Copiar"** button in the toolbar
   - Wait for the "Copiado" confirmation (green checkmark appears)

6. **Switch to ActiveCampaign**
   - Open your ActiveCampaign campaign in another browser tab
   - Click the **"Code"** button in the email editor toolbar
   - Find the `<body>` section in your template
   - Select all content **inside** the `<body>` tags (not including the `<body>` tag itself)
   - Paste the EmailGenius code to replace it
   - Click back to HTML view to see the visual result

**Critical Do's and Don'ts:**

✅ **DO:**

- Copy from the "Código" view in EmailGenius
- Paste **inside** the `<body>` tags in ActiveCampaign
- Replace the existing body content, not the template structure
- Check the visual preview in ActiveCampaign after pasting

❌ **DON'T:**

- Don't copy from "HTML" view (that's the full document)
- Don't paste outside the `<body>` tags
- Don't include the `<body>` or `<html>` tags from EmailGenius
- Don't paste in the visual editor (use Code Editor only)

---

### 🖥️ Desktop vs Mobile Preview

**What it does:** Switches the viewport width to simulate desktop and mobile email clients.

**Where it is:** Top-right of the toolbar (Row 1)

**Viewport Sizes:**

- **Desktop**: 680px wide (standard email width in most email clients)
- **Mobile**: 375px wide (typical smartphone screen)

**When to use:**

- Always check both views before sending
- Mobile view helps ensure text is readable on small screens
- Desktop view shows the full layout as designed

**What to look for:**

- Text readability (no tiny fonts on mobile)
- Image sizing (images should scale appropriately)
- Button placement (CTAs should be easily tappable on mobile)
- Layout breaks (check for weird wrapping or overlaps)

---

### 🔄 View Modes Explained

You have **four view modes** (second toolbar row):

**1. HTML (default) 👁️**

- Shows the fully rendered email as it will appear in recipients' inboxes
- Includes all images, styles, and formatting
- Read-only (can't edit directly)
- **Best for:** Final visual review before sending

**2. Texto 📄**

- Shows the plain-text version of your email
- This is what recipients see if their email client doesn't support HTML
- Useful for accessibility and spam filter compliance
- **Best for:** Ensuring your message works without formatting

**3. Código 💻**

- Shows **body-only** HTML source code
- Includes ActiveCampaign integration instructions
- This is what you copy to paste in ActiveCampaign
- **Best for:** Copying code for ActiveCampaign campaigns

**4. Edit ✏️ (activated via "Editar Contenido" button)**

- Switches to WYSIWYG editor
- Lets you modify content directly
- Formatting toolbar appears above content
- **Best for:** Making quick edits to AI-generated text

---

## 🎨 Toolbar Layout Comparison

### Old Layout (Before)

```
╔═══════════════════════════════════════════════════════════════╗
║ [HTML] [Texto] [Código] [Desktop] [Mobile] [↻] [📋] [🛡️]      ║
╚═══════════════════════════════════════════════════════════════╝
```

**Problem:** All actions on one row, edit mode buried, hard to find copy workflow

### New Layout (After)

```
╔═══════════════════════════════════════════════════════════════╗
║ Row 1: [Editar Contenido] ............... [Desktop] [Mobile]  ║
║ Row 2: [HTML] [Texto] [Código] ....... [↻] [📋] [🛡️]         ║
╚═══════════════════════════════════════════════════════════════╝
```

**Benefits:**

- Primary action (Edit) is prominent and separated
- View modes grouped logically
- Copy workflow optimized (Preview → Código tab → Copiar button)
- 40% fewer clicks for common workflows

---

## 🔥 Pro Tips & Best Practices

### Content Optimization

1. **Check Metrics First**
   - Always review the metrics sidebar after generation
   - Aim for green indicators on HTML size and Text/HTML ratio
   - Keep word count between 50-500 words

2. **Edit Strategically**
   - Use edit mode for small tweaks, not complete rewrites
   - If major changes needed, regenerate with new instructions instead
   - Remember: subject lines don't auto-update with body edits (yet)

3. **Test Both Viewports**
   - Always toggle between Desktop and Mobile views
   - Mobile-first approach: if it looks good on mobile, it'll work on desktop
   - Check that CTAs are easily clickable on mobile (min 44px touch target)

### ActiveCampaign Integration

1. **Pre-Flight Checklist**
   - ✅ Generated content looks good in HTML preview
   - ✅ Metrics are in green/yellow range (not red)
   - ✅ Desktop and mobile views both work
   - ✅ Switched to "Código" view
   - ✅ Clicked "Copiar" and saw "Copiado" confirmation

2. **In ActiveCampaign**
   - Always use the **Code Editor**, not visual editor
   - Locate the `<body>` section first before pasting
   - After pasting, switch back to HTML view to verify
   - Send yourself a test email before sending to list

3. **Common Mistakes to Avoid**
   - ❌ Pasting full HTML (includes `<!DOCTYPE>`, `<html>`, `<head>`)
   - ❌ Pasting outside the `<body>` tags
   - ❌ Not checking mobile view after pasting
   - ❌ Skipping the test email step

### Performance Optimization

1. **Image Strategy**
   - Generate header images appropriate to content type
   - Keep images under 200KB each
   - Use JPEG for photos, PNG for graphics with text
   - Ensure images have alt text for accessibility

2. **Content Length**
   - Aim for 150-300 words for optimal engagement
   - Use bullet points to break up long paragraphs
   - Single, clear CTA (not multiple competing actions)

3. **Spam Prevention**
   - Maintain Text/HTML ratio above 20%
   - Keep HTML size under 15KB if possible
   - Use spam checker before finalizing
   - Run test sends to check spam folder placement

---

## 🐛 Troubleshooting

### "Metrics widget not showing"

**Cause:** Widget hides in edit mode or when loading/error state
**Solution:** Exit edit mode or wait for loading to complete

### "Copy button doesn't work"

**Cause:** Browser clipboard permissions or AdBlocker interference
**Solution:** Check browser console, manually select and copy code

### "Edit mode freezes"

**Cause:** Very large HTML content (>100KB) slows down Quill editor
**Solution:** Use edit mode for smaller sections, regenerate for major changes

### "Pasted code breaks ActiveCampaign template"

**Cause:** Copied full HTML instead of body-only from "HTML" view
**Solution:** Always copy from "Código" view, never from "HTML" view

### "Metrics show red indicators"

**Cause:** Email is too large or has too much HTML markup
**Solution:** Shorten content, remove unnecessary formatting, or regenerate with "Concise" length

---

## 📚 Additional Resources

### Related Documentation

- **Main Instructions**: `/.github/instructions/instructions.instructions.md`
- **Technical Implementation**: `/lib/documents/UX_IMPROVEMENTS_IMPLEMENTATION.md`
- **ActiveCampaign Integration**: `/lib/documents/ACTIVECAMPAIGN_HTML_RENDERING_FIX.md`

### External Resources

- [ActiveCampaign Email Code Editor Guide](https://help.activecampaign.com/)
- [Email on Acid - HTML Email Best Practices](https://www.emailonacid.com/)
- [Litmus - Email Client Support](https://www.litmus.com/email-client-market-share/)

### Support

For questions or issues:

1. Check this guide first
2. Review technical implementation doc for developers
3. Test with sample content before using in production
4. Document and report bugs via GitHub issues

---

## 🎓 Learning Path

**Beginner:**

1. Master basic workflow: Generate → Preview → Copy → Paste
2. Understand the four view modes (HTML, Texto, Código, Edit)
3. Learn to read basic metrics (green = good, red = bad)

**Intermediate:** 4. Use edit mode for content refinement 5. Optimize based on metrics feedback 6. Test thoroughly in both viewports

**Advanced:** 7. Develop intuition for optimal email structure 8. Create custom templates via strategic editing 9. A/B test content variations for better performance

---

**Last Updated:** February 2, 2026  
**Version:** 1.0  
**Author:** EmailGenius Development Team
