# TopNetworks Brand Identity Guide

**Document Version:** 1.0
**Last Updated:** February 12, 2026
**Application:** EmailGenius Broadcasts Generator
**Organization:** TopNetworks, Inc. / TopFinanzas

---

## Executive Summary

This document catalogs all brand identity elements used in the EmailGenius Broadcasts Generator platform, part of the TopNetworks ecosystem. The brand identity combines modern, vibrant colors (lime, cyan, blue) with professional typography to create a fresh, technology-forward aesthetic suitable for AI-powered financial marketing tools.

---

## 1. Brand Logos & Assets

### 1.1 Primary Logo
**Location:** Google Cloud Storage (GCS)
**CDN/Storage:** `storage.googleapis.com/media-topfinanzas-com`

#### TopNetworks Logo
- **URL:** `https://storage.googleapis.com/media-topfinanzas-com/images/topnetworks-positivo-sinfondo.webp`
- **Format:** WebP (optimized for web)
- **Usage:** Main application header, primary branding
- **Dimensions:** 280x88 pixels (aspect ratio: 3.18:1)
- **Display Size:** Height: 48px (width auto-scales)
- **Alt Text:** "TopNetworks Logo"
- **Background:** Transparent
- **Context:** Used in `components/ui/header.tsx` line 87-92

#### TopFinanzas Logo (US Market)
- **URL:** `https://us.topfinanzas.com/wp-content/uploads/2024/10/LOGO-EnglishUS-COLOR.png`
- **Format:** PNG
- **Usage:** TopAds offerwall integration, market-specific branding
- **Context:** Used in `app/layout.tsx` line 89 for offerwall configuration

### 1.2 Favicon & App Icons
**Location:** Google Cloud Storage (GCS)
**CDN/Storage:** `storage.googleapis.com/media-topfinanzas-com`

#### Standard Favicon
- **URL:** `https://storage.googleapis.com/media-topfinanzas-com/favicon.png`
- **Format:** PNG
- **Size:** 32x32 pixels (standard)
- **Usage:** Browser tabs, bookmarks, mobile home screen
- **Referenced In:**
  - `app/layout.tsx` (lines 21, 25, 30-32, 46, 51, 56)
  - `app/templates/email/components/Header.tsx` (line 34)
  - `app/page.tsx` (line 878 - watermark usage)

#### Apple Touch Icon
- **URL:** Same as favicon (`https://storage.googleapis.com/media-topfinanzas-com/favicon.png`)
- **Usage:** iOS Safari, iPad home screen shortcuts

### 1.3 Local Assets
**Location:** `/public/` directory

- **favicon.ico:** 32,246 bytes - Legacy ICO format for older browsers
- **favicon.png:** 13,714 bytes - Local backup of cloud-hosted favicon

### 1.4 Marketing Assets
**Location:** `/public/images/`

Email marketing broadcast screenshots (WebP format):
- `email_marketing_broadcast_01.webp` (68,090 bytes)
- `email_marketing_broadcast_02.webp` (69,618 bytes)
- `email_marketing_broadcast_03.webp` (82,594 bytes)
- `email_marketing_broadcast_04.webp` (64,690 bytes)
- `email_marketing_broadcast_05.webp` (167,960 bytes)
- `email_marketing_broadcast_06.webp` (167,752 bytes)
- `email_marketing_broadcast_07.webp` (156,668 bytes)
- `email_marketing_broadcast_08.webp` (175,004 bytes)

**Purpose:** Documentation, training materials, UI examples

---

## 2. Color Palette

### 2.1 Primary Brand Colors

#### Brand Blue
- **Hex:** `#2563eb`
- **Tailwind:** `blue-600`
- **RGB:** `rgb(37, 99, 235)`
- **Usage:** Primary brand color, CTAs, headings, primary buttons
- **Context:** Email templates, buttons, text gradients

#### Brand Cyan
- **Hex:** `#0891b2`
- **Tailwind:** `cyan-600`
- **RGB:** `rgb(8, 145, 178)`
- **Usage:** Secondary brand color, accents, gradient transitions
- **Context:** Buttons, backgrounds, dividers

#### Brand Lime/Green
- **Hex:** `#84cc16`
- **Tailwind:** `lime-500` / `green-600`
- **RGB:** `rgb(132, 204, 22)`
- **Usage:** Accent color, success indicators, vibrant highlights
- **Context:** Gradients, active states, success messages

### 2.2 Extended Brand Palette

#### Blue Variants
- **Blue-50:** `#eff6ff` - Light backgrounds
- **Blue-500:** `#2563eb` - Primary brand
- **Blue-600:** `#1d4ed8` - Hover states
- **Blue-700:** `#1e40af` - Dark accents
- **Blue-800:** `#1e3a5f` - Dark email headers

#### Cyan Variants
- **Cyan-50:** `#ecfeff` - Light backgrounds
- **Cyan-500:** `#06b6d4` - Mid-tone accents
- **Cyan-600:** `#0891b2` - Secondary brand
- **Cyan-700:** `#0e7490` - Dark accents

#### Lime/Green Variants
- **Lime-50:** `#f7fee7` - Very light backgrounds
- **Lime-100:** `#f0f9ff` - Light backgrounds
- **Lime-200:** `#e5e7eb` - Borders, dividers
- **Lime-500:** `#65a30d` - Dark lime
- **Lime-600:** `#84cc16` - Primary lime (accent)
- **Lime-700:** `#4d7c0f` - Deep lime

### 2.3 Neutral Colors

#### Grayscale
- **Gray-50:** `#f9fafb` - Very light backgrounds
- **Gray-100:** `#f4f4f5` - Light backgrounds
- **Gray-400:** `#9ca3af` - Muted text
- **Gray-600:** `#4b5563` - Secondary text
- **Gray-800:** `#1f2937` - Primary text
- **White:** `#ffffff` - Content backgrounds
- **Black:** `#000000` - Deep text (rarely used)

### 2.4 Status Colors

#### Success
- **Hex:** `#22c55e`
- **Tailwind:** `green-500`
- **Usage:** Success messages, confirmations, positive indicators

#### Warning
- **Hex:** `#f59e0b`
- **Tailwind:** `amber-500`
- **Usage:** Warnings, caution messages

#### Error/Destructive
- **Hex:** `#ef4444`
- **Tailwind:** `red-500`
- **Usage:** Error messages, destructive actions, alerts

#### Info
- **Hex:** `#3b82f6`
- **Tailwind:** `blue-500`
- **Usage:** Informational messages, tips

### 2.5 Email Template Color System

**Defined in:** `app/templates/email/components/BaseLayout.tsx` (lines 74-92)

```typescript
colors: {
  brand: {
    primary: "#2563eb",    // Blue-600
    secondary: "#0891b2",  // Cyan-600
    accent: "#84cc16",     // Lime-500
    dark: "#1e3a5f",       // Dark blue
    light: "#f0f9ff"       // Light blue
  },
  text: {
    primary: "#1f2937",    // Gray-800
    secondary: "#4b5563",  // Gray-600
    muted: "#9ca3af"       // Gray-400
  },
  status: {
    success: "#22c55e",    // Green-500
    warning: "#f59e0b",    // Amber-500
    error: "#ef4444",      // Red-500
    info: "#3b82f6"        // Blue-500
  }
}
```

### 2.6 Alert/Banner Color System

**Defined in:** `app/templates/email/components/Header.tsx` (lines 161-164)

```typescript
{
  info: {
    bg: "#eff6ff",      // Light blue background
    border: "#3b82f6",  // Blue border
    text: "#1e40af"     // Dark blue text
  },
  warning: {
    bg: "#fffbeb",      // Light amber background
    border: "#f59e0b",  // Amber border
    text: "#92400e"     // Dark amber text
  },
  success: {
    bg: "#f0fdf4",      // Light green background
    border: "#22c55e",  // Green border
    text: "#166534"     // Dark green text
  },
  urgent: {
    bg: "#fef2f2",      // Light red background
    border: "#ef4444",  // Red border
    text: "#991b1b"     // Dark red text
  }
}
```

---

## 3. Gradient Definitions

### 3.1 Primary Gradients

#### Tri-Color Brand Gradient
**CSS:** `bg-gradient-to-r from-blue-600 via-cyan-600 to-lime-600`
**Colors:** `#2563eb` → `#0891b2` → `#84cc16`
**Usage:** Headlines, titles, text emphasis (with `bg-clip-text text-transparent`)
**Context:**
- App header title "EmailGenius"
- Section headings throughout UI

#### Background Gradient (Full Page)
**CSS:** `bg-gradient-to-br from-lime-50 via-cyan-50 to-blue-100`
**Colors:** `#f7fee7` → `#ecfeff` → `#dbeafe`
**Usage:** Main application background
**Context:** `app/layout.tsx` line 113

#### Header Gradient
**CSS:** `bg-gradient-to-r from-lime-50 via-cyan-50 to-blue-50`
**Colors:** Lighter variant of main gradient
**Usage:** Sticky header background with backdrop blur
**Context:** `components/ui/header.tsx` line 79

### 3.2 Button Gradients

#### Primary Button (Active)
**CSS:** `bg-gradient-to-r from-blue-600 to-cyan-600`
**Hover:** `hover:from-blue-700 hover:to-cyan-700`
**Text:** White (`#ffffff`)
**Usage:** Primary action buttons, submit buttons

#### Secondary Button (Subtle)
**CSS:** `bg-gradient-to-r from-blue-50 to-cyan-50`
**Hover:** `hover:from-blue-100 hover:to-cyan-100`
**Text:** Blue-700 (`#1e40af`)
**Border:** Blue-200
**Usage:** Secondary actions, cancel buttons

#### Navigation Active State
**CSS:** `bg-gradient-to-r from-lime-500 to-cyan-500`
**Text:** White
**Usage:** Active navigation items, selected state

### 3.3 Decorative Gradients

#### Card Backgrounds
**CSS:** `bg-gradient-to-br from-white to-lime-50/30`
**Usage:** Form fields, card containers
**Opacity:** 30% lime overlay on white

#### Upload Component Backgrounds
**CSS:** `bg-gradient-to-r from-lime-50 to-cyan-50`
**Border:** `border-lime-200`
**Usage:** File upload areas, info sections

#### Email Divider Gradient
**CSS:** `linear-gradient(to right, #2563eb, #0891b2, #84cc16)`
**Usage:** Decorative dividers in email templates
**Context:** `app/templates/email/components/Divider.tsx` line 55

---

## 4. Typography

### 4.1 Primary Font Family

#### Poppins (Google Fonts)
- **Provider:** Google Fonts
- **Weights:** 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold)
- **Display:** Swap (FOUT prevention)
- **CSS Variable:** `--font-poppins`
- **Fallbacks:** `system-ui, sans-serif`
- **Implementation:** `app/layout.tsx` lines 7-12

**Full Font Stack:**
```css
font-family: var(--font-poppins), system-ui, sans-serif
```

**Configuration:**
```typescript
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});
```

### 4.2 Typography Usage Guidelines

#### Headlines (H1)
- **Font:** Poppins Bold (700)
- **Size:** `text-xl` (1.25rem / 20px)
- **Color:** Tri-color gradient (blue-cyan-lime)
- **Example:** "EmailGenius" main title

#### Subheadings (H2)
- **Font:** Poppins Bold (700)
- **Size:** `text-lg` (1.125rem / 18px)
- **Color:** Tri-color gradient
- **Example:** "Generador de Broadcasts de Email"

#### Body Text
- **Font:** Poppins Regular (400)
- **Size:** `text-sm` to `text-base` (0.875rem - 1rem)
- **Color:** `text-gray-600` (#6b7280) or `text-gray-700`

#### Small Text / Captions
- **Font:** Poppins Regular (400) or Light (300)
- **Size:** `text-xs` to `text-sm` (0.75rem - 0.875rem)
- **Color:** `text-gray-500` or `text-gray-600`

#### Button Text
- **Font:** Poppins Medium (500) or Semi-Bold (600)
- **Size:** `text-sm` to `text-base`
- **Transform:** None (maintains natural case)

---

## 5. Button Styles

### 5.1 Email Template Buttons

**Defined in:** `app/templates/email/components/Button.tsx`

#### Primary Button (Cyan)
- **Background:** `#0891b2` (cyan-600)
- **Text:** `#ffffff` (white)
- **Padding:** 12px 24px
- **Border Radius:** 4px
- **Font Weight:** Bold

#### Secondary Button (Outline)
- **Color:** `#2563eb` (blue-600)
- **Border:** `2px solid #2563eb`
- **Background:** Transparent
- **Hover:** Slight background tint

#### Destructive Button
- **Background:** `#dc2626` (red-600)
- **Text:** `#ffffff` (white)

#### Success Button
- **Background:** `#16a34a` (green-600)
- **Text:** `#ffffff` (white)

#### CTA Button (Default)
- **Background:** `#2563eb` (blue-600)
- **Text:** `#ffffff` (white)

### 5.2 UI Component Buttons

#### Primary Action Button
- **Class:** `bg-gradient-to-r from-blue-600 to-cyan-600`
- **Hover:** `hover:from-blue-700 hover:to-cyan-700`
- **Text:** White, font-medium
- **Transition:** `transition-all duration-200`

#### Secondary/Ghost Button
- **Variant:** Ghost or outline
- **Color:** `text-gray-600`
- **Hover:** `hover:text-gray-900 hover:bg-lime-50`

#### Navigation Button (Active)
- **Class:** `bg-gradient-to-r from-lime-500 to-cyan-500`
- **Text:** White
- **Shadow:** `shadow-md`

---

## 6. Border & Spacing System

### 6.1 Border Radius

**Defined in:** `tailwind.config.js` lines 78-82

- **Large (lg):** `var(--radius)` = `0.5rem` (8px)
- **Medium (md):** `calc(var(--radius) - 2px)` = `0.375rem` (6px)
- **Small (sm):** `calc(var(--radius) - 4px)` = `0.25rem` (4px)

### 6.2 Border Colors

- **Primary:** `border-lime-200` (#e5e7eb)
- **Light:** `border-lime-100`
- **Input:** `border-gray-200` to `border-gray-300`
- **Focus:** `focus:border-lime-400` with `focus:ring-lime-400`
- **Dark Mode:** `border-gray-700` to `border-gray-800`

### 6.3 Standard Spacing

- **Container Padding:** `px-4` (1rem / 16px)
- **Header Padding:** `py-4` (1rem / 16px)
- **Card Padding:** `p-4` to `p-6` (1rem - 1.5rem)
- **Button Padding:** `px-4 py-2` to `px-6 py-3`

---

## 7. Domain & URL Structure

### 7.1 Primary Domains

#### Application Domain
- **Production:** `https://email.topfinanzas.com`
- **SSL:** Let's Encrypt (Certbot)
- **Web Server:** Apache 2.0 (Reverse Proxy)
- **Backend:** PM2 + Next.js on port 3020

#### Market-Specific Domains
- **USA:** `https://us.topfinanzas.com`
- **UK:** `https://uk.topfinanzas.com`
- **Mexico:** `https://topfinanzas.com/mx/` ⚠️ **NOT** `mx.topfinanzas.com`

### 7.2 Email Addresses

#### Market-Specific Sending Addresses
- **US/UK Markets:** `topfinance@topfinanzas.com`
- **Mexico Market:** `info@topfinanzas.com`

#### System Email Addresses
- **Email Generator Bot:** `bot@topfinanzas.com`
- **Broadcast System:** `broadcast@topfinanzas.com`
- **Message ID Domain:** `emailgenius.topfinanzas.com`

### 7.3 UTM Parameter Structure

**Format:** `[country]_tf_[platform]_broad`

**Examples:**
- US ActiveCampaign: `utm_campaign=us_tf_ac_broad`
- UK ConvertKit: `utm_campaign=uk_tf_ck_broad`
- Mexico ActiveCampaign: `utm_campaign=mx_tf_ac_broad`

**Full URL Example:**
```
https://us.topfinanzas.com/financial-solutions/credit-card?
utm_source=activecampaign&
utm_medium=email&
utm_campaign=us_tf_ac_broad&
utm_term=automation&
utm_content=button_1
```

---

## 8. Animation & Interactions

### 8.1 Transition System

**Standard Transitions:**
- **Duration:** `transition-all duration-200` (200ms)
- **Easing:** Default ease-out
- **Properties:** All (transform, color, background, opacity)

### 8.2 Keyframe Animations

**Defined in:** `tailwind.config.js` lines 83-96

#### Accordion Down
```css
@keyframes accordion-down {
  from { height: 0 }
  to { height: var(--radix-accordion-content-height) }
}
animation: accordion-down 0.2s ease-out
```

#### Accordion Up
```css
@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height) }
  to { height: 0 }
}
animation: accordion-up 0.2s ease-out
```

### 8.3 Hover Effects

- **Button Hover:** Opacity change or gradient shift
- **Link Hover:** Underline + color shift to darker variant
- **Card Hover:** Subtle shadow increase or background tint
- **Navigation Hover:** Background color `hover:bg-lime-50`

---

## 9. Icon System

### 9.1 Icon Library
**Provider:** Lucide React
**Package:** `lucide-react`

#### Primary Icons Used
- **Mail:** Email/messaging representation
- **Sparkles:** AI/automation/magic features
- **Menu:** Mobile navigation menu
- **X:** Close/dismiss actions
- **Copy:** Clipboard operations
- **Check:** Success/completion states
- **Upload:** File upload actions

#### Icon Sizes
- **Small:** `h-4 w-4` (16px)
- **Medium:** `h-5 w-5` (20px)
- **Large:** `h-6 w-6` (24px)

#### Icon Colors
- **Primary:** `text-lime-600` or `text-cyan-500`
- **Neutral:** `text-gray-500` to `text-gray-700`
- **Active:** Match button/element color

---

## 10. Cloud Infrastructure

### 10.1 Google Cloud Platform

#### Storage Buckets
- **Primary Bucket:** `media-topfinanzas-com`
- **Access:** Public read access for web assets
- **CDN:** `storage.googleapis.com/media-topfinanzas-com`

#### Stored Assets
- **Favicons:** `/favicon.png`
- **Logos:** `/images/topnetworks-positivo-sinfondo.webp`
- **Generated Images:** `/images/generated/activecampaign-broadcasts/`

#### Compute Resources
- **Platform:** Google Cloud Compute Engine
- **OS:** Ubuntu 22.04 LTS
- **Instance:** VM with Apache + PM2 + Node.js

### 10.2 CDN Strategy

- **Primary CDN:** Google Cloud Storage (built-in CDN)
- **SSL:** Let's Encrypt certificates via Certbot
- **Caching:** Browser caching + GCS edge caching
- **Image Formats:** WebP (primary), PNG (fallback), JPG (email compatibility)

---

## 11. Dark Mode Support

### 11.1 Dark Mode Colors

**Defined in:** `app/globals.css` lines 38-66

#### Backgrounds
- **Background:** `hsl(222.2, 84%, 4.9%)` - Very dark blue
- **Card:** Same as background
- **Popover:** Same as background

#### Text
- **Foreground:** `hsl(210, 40%, 98%)` - Near white
- **Primary:** `hsl(210, 40%, 98%)`
- **Muted:** `hsl(215, 20.2%, 65.1%)`

#### Components
- **Primary:** `hsl(210, 40%, 98%)`
- **Secondary:** `hsl(217.2, 32.6%, 17.5%)`
- **Border:** `hsl(217.2, 32.6%, 17.5%)`
- **Input:** Same as border

#### Status
- **Destructive:** `hsl(0, 62.8%, 30.6%)` - Dark red

### 11.2 Dark Mode Implementation

**CSS Class:** `.dark`
**Toggle:** Class-based switching on `<html>` element
**Email Templates:** Separate dark mode styles for email clients supporting dark mode

---

## 12. Brand Voice & Messaging

### 12.1 Application Titles

#### Primary Title
**Spanish:** "Generador de Broadcasts de Email"
**English:** "Email Broadcast Generator"

#### Subtitle
**Spanish:** "Plataforma Profesional de Marketing por Email para ConvertKit y ActiveCampaign"
**English:** "Professional Email Marketing Platform for ConvertKit and ActiveCampaign"

### 12.2 Brand Names

- **Organization:** TopNetworks, Inc.
- **Product:** EmailGenius
- **Parent Brand:** TopFinanzas
- **Market Name:** TopFinance (US/UK)

### 12.3 Tagline & Positioning

- **AI-Powered:** Emphasize Vertex AI (Gemini 2.5 Flash) integration
- **Professional:** Enterprise-grade, production-ready
- **Optimized:** High-engagement, conversion-focused
- **Multi-Market:** USA, UK, Mexico localization

---

## 13. Usage Guidelines

### 13.1 Logo Usage

✅ **DO:**
- Use official cloud-hosted versions for consistency
- Maintain aspect ratio (never distort)
- Provide adequate white space around logo
- Use transparent background variant where appropriate

❌ **DON'T:**
- Recreate or modify logo colors
- Use low-resolution versions
- Place on busy backgrounds without contrast
- Stretch or compress disproportionately

### 13.2 Color Usage

✅ **DO:**
- Use primary brand gradient for emphasis
- Maintain WCAG AA contrast ratios (minimum 4.5:1)
- Use lime accent sparingly for maximum impact
- Follow semantic color meanings (red=error, green=success)

❌ **DON'T:**
- Mix gradients with status colors
- Use low-contrast color combinations
- Override brand colors without design approval
- Use pure black (`#000000`) - prefer dark gray

### 13.3 Typography Usage

✅ **DO:**
- Use Poppins for all UI text
- Maintain hierarchy (Bold for headings, Regular for body)
- Use gradient text treatment for major headings
- Ensure readable line-height (1.5 minimum)

❌ **DON'T:**
- Mix multiple font families
- Use all-caps for long text blocks
- Reduce font size below 12px for body text
- Use decorative fonts

---

## 14. Asset Checklist

### 14.1 Required Assets for New TopNetworks Platforms

- [ ] Primary logo (WebP format, transparent background)
- [ ] Favicon set (PNG 32x32, ICO for legacy)
- [ ] Apple Touch Icon (180x180 recommended)
- [ ] Open Graph image (1200x630 for social sharing)
- [ ] Email header logo (600px width, 16:9 aspect ratio)
- [ ] Loading spinner/animation (brand colors)
- [ ] Error state illustrations (optional)
- [ ] Success state illustrations (optional)

### 14.2 Code Templates

**Tailwind Config:**
```javascript
// Copy from tailwind.config.js lines 18-98
extend: {
  fontFamily: {
    sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
  },
  colors: {
    brand: {
      blue: { 50: "#eff6ff", 500: "#2563eb", 600: "#1d4ed8", 700: "#1e40af" },
      green: { 50: "#f7fee7", 500: "#65a30d", 600: "#84cc16", 700: "#4d7c0f" },
      cyan: { 50: "#ecfeff", 500: "#06b6d4", 600: "#0891b2", 700: "#0e7490" },
    }
  }
}
```

**Gradient Classes:**
```css
/* Primary brand gradient */
.brand-gradient-text {
  @apply bg-gradient-to-r from-blue-600 via-cyan-600 to-lime-600 bg-clip-text text-transparent;
}

/* Background gradient */
.brand-gradient-bg {
  @apply bg-gradient-to-br from-lime-50 via-cyan-50 to-blue-100;
}

/* Button gradient */
.brand-gradient-button {
  @apply bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700;
}
```

---

## 15. Version History

### Version 1.0 (February 12, 2026)
- Initial comprehensive brand identity documentation
- Extracted from EmailGenius Broadcasts Generator codebase
- Cataloged all assets, colors, typography, and design systems
- Documented cloud infrastructure and CDN strategy

---

## 16. Contact & Governance

### Design System Ownership
- **Organization:** TopNetworks, Inc.
- **Primary Application:** EmailGenius Broadcasts Generator
- **Repository:** `emailgenius-broadcasts-generator`
- **Production URL:** `https://email.topfinanzas.com`

### Future Platforms
This brand identity guide is intended for reuse across the TopNetworks platform ecosystem, including future AI-powered services and tools.

### Updates & Maintenance
- **Document Location:** `/TOPNETWORKS_BRAND_IDENTITY.md` (repository root)
- **Update Frequency:** As needed with major design changes
- **Version Control:** Git-tracked with commit history

---

**End of Document**
