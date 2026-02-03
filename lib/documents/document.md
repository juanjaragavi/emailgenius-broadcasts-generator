# Document

## Context

EmailGenius is an LLM-powered email broadcast generation platform with an existing user interface requiring UX improvements based on user feedback. The application generates HTML email content for marketing campaigns integrated with ActiveCampaign and ConvertKit platforms. Repository: `/Users/macbookpro/GitHub/emailgenius-broadcasts-generator`.

Current implementation generates complete HTML documents including `<head>`, `<style>`, and `<body>` tags. User workflow involves toggling between EmailGenius and ActiveCampaign tabs to copy generated content into platform editors. Interface contains three primary sections: configuration form, real-time HTML preview, and code output.

User complaints identify workflow friction in the "Vista Previa HTML" section. Primary issues: unclear purpose of preview-only vs. editable content, inefficient button placement disrupting cross-platform workflow, risk of users overwriting ActiveCampaign template structure by copying full HTML documents instead of body-only content, lack of content quality metrics present in ActiveCampaign's native editor.

## Task

### 1. Refactor HTML Preview Section

Transform "Vista Previa HTML" from passive display to dual-mode interface:

#### **1.1 Preview Mode**

- Display complete rendered email design including template structure
- Maintain read-only state with visual clarity that content is non-editable
- Render full HTML (head + body) for accurate design representation

#### **1.2 Edit Mode**

- Integrate WYSIWYG rich text editor (CKEditor, TinyMCE, or Quill)
- Enable direct manipulation of email content, formatting, and layout
- Trigger backend logic to reconcile user edits with LLM-generated content
- Update all dependent fields (subject line, preheader, CTA text) when body content changes
- Persist user overrides across generation cycles

### 2. Optimize Button Layout

Relocate HTML/Text/Code view toggles below "Abrir Vista Previa del Email" button to minimize cursor travel distance for users executing copy-paste workflow between browser tabs. New layout:

```xml
[Abrir Vista Previa del Email]
[HTML] [Text] [Code]
<preview/editor area>
```

### 3. Implement Body-Only HTML Generation

Modify HTML generation logic:

#### **Input Processing**

- Parse LLM-generated complete HTML document
- Extract content exclusively within `<body>` tags
- Strip `<!DOCTYPE>`, `<html>`, `<head>`, and tracking pixels outside body scope

#### **Output Specification**

- Generate snippet containing only body-internal elements
- Display user instructions: "Copy this snippet into ActiveCampaign's Code Editor within the existing body section"
- Preserve inline styles within body elements

#### **Preview Rendering**

- Continue rendering full HTML structure in preview mode
- Display body-only HTML in Code view with copy button

### 4. Build Email Content Metrics Widget

Reverse-engineer ActiveCampaign's Email Content Metrics algorithm:

#### **Required Metrics**

- HTML Size (KB) - Calculate byte length of generated HTML
- Text/HTML Ratio (%) - Compare plain text length to HTML markup length
- Word Count - Extract and count words from body text content excluding HTML tags
- Reading Time - Calculate based on average 200-250 words/minute reading speed

#### **Implementation**

- Create parser to extract plain text from HTML (strip all tags)
- Implement size calculation for both HTML and plain text versions
- Calculate ratio: `(plain_text_length / html_length) * 100`
- Add real-time validation indicators (green check for optimal, yellow warning for suboptimal, red error for problematic values)
- Position widget in right sidebar of HTML preview section

#### **Threshold Definitions**

- HTML Size: Green <15KB, Yellow 15-30KB, Red >30KB
- Text/HTML Ratio: Green >20%, Yellow 10-20%, Red <10%
- Word Count: Context-dependent, warn if <50 or >500 words

## Outcome

**Deliverables**:

1. Refactored "Vista Previa HTML" component with toggle between preview/edit modes
2. Integrated WYSIWYG editor with backend synchronization logic for user overrides
3. Reorganized UI button layout matching optimized workflow sequence
4. Modified HTML generation service producing body-only snippets with user instructions
5. Implemented Email Content Metrics widget calculating size, ratio, word count, and reading time
6. Updated preview rendering to maintain full HTML display while generating body-only code output

**Success Criteria**:

- Users can visually preview complete email design including template structure
- Users can directly edit email content via rich text editor without switching tools
- User edits persist and override LLM generations in subsequent workflow steps
- Generated HTML snippets contain only body content, preventing accidental template corruption
- Metrics widget displays real-time statistics matching ActiveCampaign calculation methodology
- Copy-paste workflow requires 40% fewer UI interactions compared to current implementation
