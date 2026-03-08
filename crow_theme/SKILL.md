---
name: crow_theme
description: "NAVADA Lab's official design system — a dark, monochrome, brutalist-editorial aesthetic with strict typographic rules, zero color, and sharp geometry. Use this skill whenever the user says 'crow_theme', 'crow theme', 'CROW', or asks to design anything 'in the NAVADA style'. This skill MUST be used for ALL design outputs: websites (HTML/React/Next.js), PDFs, presentations, application UIs, dashboards, landing pages, documents, email templates, social media graphics, and any visual deliverable. It also includes DALL-E API integration for generating images that seamlessly fit the theme. Even if the user just says 'design me a website' or 'make a landing page' and mentions crow_theme anywhere in the conversation, trigger this skill. The crow_theme is non-negotiable — every pixel must obey these rules."
---

# CROW THEME — NAVADA Lab Design System

You are designing under the **Crow Theme**, NAVADA Lab's signature aesthetic. This is not a suggestion — it is a strict visual language. Every element you produce must conform to these rules, whether you're building a website, generating a PDF, designing an app UI, or creating presentation slides.

The philosophy: **darkness, precision, restraint**. Think classified research dossier meets high-end design journal. Every element earns its place. Nothing decorates — everything communicates.

---

## 1. COLOUR SYSTEM

The Crow Theme is **100% achromatic**. Zero hue. Zero saturation. Every colour is pure grayscale.

### Core Palette (use these exact hex values)

| Token              | Hex       | HSL              | Usage                                          |
|--------------------|-----------|------------------|-------------------------------------------------|
| `--bg-void`        | `#050505` | 0 0% 2%          | Primary background — the "canvas"                |
| `--bg-elevated`    | `#0a0a0a` | 0 0% 4%          | Code blocks, cards, elevated surfaces            |
| `--border-subtle`  | `#1a1a1a` | 0 0% 10%         | Section dividers, faint structural lines         |
| `--border-medium`  | `#222222` | 0 0% 13%         | Card borders, table borders, tag borders         |
| `--border-strong`  | `#444444` | 0 0% 27%         | Logo borders, active element accents, hover      |
| `--text-ghost`     | `#444444` | 0 0% 27%         | Decorative glyphs (▸ ◈ ⬡ ◉), bullet markers     |
| `--text-muted`     | `#555555` | 0 0% 33%         | Labels, captions, section markers, nav inactive  |
| `--text-secondary` | `#888888` | 0 0% 53%         | Body text, descriptions, paragraph copy          |
| `--text-primary`   | `#e0e0e0` | 0 0% 88%         | Values, data, names, stat numbers                |
| `--text-bright`    | `#ffffff` | 0 0% 100%        | Headlines, active nav, emphasis, selection bg     |

### Rules

- **NEVER** introduce any colour with hue or saturation. No blues, no greens, no accent colours. Not even for links, buttons, status indicators, or error states.
- Status differentiation uses **brightness only**: HIGH priority = `#e0e0e0`, MED = `#888`, LOW = `#555`.
- "Active" states use `#fff` text or a `#fff` border-right indicator. "Inactive" uses `#555` or `#888`.
- Selection highlight: white background `#ffffff`, black text `#000000`.
- Scrollbar: track `#050505`, thumb `#222`, thumb hover `#333`.

---

## 2. TYPOGRAPHY

Two fonts define the Crow Theme. Their pairing creates a tension between the literary and the technical — this is intentional and core to the identity.

### Font Stack

| Role       | Font              | Fallback            | CSS Variable             |
|------------|-------------------|----------------------|--------------------------|
| **Serif**  | Newsreader        | Georgia, serif       | `--font-newsreader`      |
| **Mono**   | IBM Plex Mono     | Consolas, monospace  | `--font-ibm-plex-mono`   |

### When to Use Which

**Newsreader (serif)** — the voice of content:
- Headlines and titles (h1, h2, h3)
- Body paragraphs and descriptions
- Data values and stat numbers
- Project names

**IBM Plex Mono (mono)** — the voice of structure:
- Navigation labels
- Section markers and category labels
- Tags, badges, status indicators
- Code blocks
- Metadata (dates, versions, specs)
- Button text and CTAs
- Captions and fine print

### Type Scale (exact sizes)

| Element                    | Font   | Size     | Weight     | Colour     | Letter-spacing | Transform   |
|----------------------------|--------|----------|------------|------------|----------------|-------------|
| Hero headline (h1)         | Serif  | 56px     | 300 light  | `#fff`     | -0.02em        | none        |
| Section title (h2)         | Serif  | 40px     | 300 light  | `#fff`     | -0.02em        | none        |
| Subsection title (h3)      | Serif  | 24px     | 300 light  | `#e0e0e0`  | normal         | none        |
| Hero subtitle              | Serif  | 22px     | 300 italic | `#888`     | normal         | none        |
| Body / description         | Serif  | 15px     | 300 light  | `#888`     | normal         | none        |
| Item title (list)          | Serif  | 20px     | 300 light  | `#e0e0e0`  | normal         | none        |
| Item body (14px)           | Serif  | 14px     | 300 light  | `#888`     | normal         | none        |
| Data value (stat)          | Serif  | 20px     | 300 light  | `#e0e0e0`  | normal         | none        |
| Data value (table cell)    | Serif  | 18px     | 300 light  | `#e0e0e0`  | normal         | none        |
| Section marker / label     | Mono   | 10px     | 400        | `#555`     | 0.3em          | uppercase   |
| Nav item                   | Mono   | 10.5px   | 400        | `#888`     | 0.15em         | uppercase   |
| Sub-nav item               | Mono   | 9.5px    | 400        | `#555`     | 0.12em         | uppercase   |
| Tag / badge                | Mono   | 9px      | 400        | `#555`     | 0.1em          | uppercase   |
| Status badge               | Mono   | 8px      | 400        | varies     | 0.15em         | uppercase   |
| Code block text            | Mono   | 12.5px   | 400        | `#888`     | normal         | none        |
| Table header               | Mono   | 9px      | 400        | `#555`     | 0.2em          | uppercase   |
| Detail item text           | Mono   | 11px     | 400        | `#888`     | normal         | none        |
| CTA / button text          | Mono   | 10px     | 400        | `#555`     | 0.35em         | uppercase   |
| Cover title                | Mono   | 11px     | 500 medium | `#e0e0e0`  | 0.45em         | uppercase   |
| Cover logo letter          | Mono   | 40px     | 300 light  | `#fff`     | 0.05em         | none        |
| Sidebar logo text          | Mono   | 10px     | 400        | `#888`     | 0.25em         | uppercase   |

### Key Principles

- Serif text is ALWAYS `font-weight: 300` (light). Never bold serif.
- Mono text for labels is ALWAYS uppercase with wide letter-spacing.
- Body text line-height: `leading-relaxed` (~1.625).
- Headlines have tight negative letter-spacing (-0.02em).
- The contrast hierarchy is: `#fff` > `#e0e0e0` > `#888` > `#555` > `#444`. Use this to create visual importance.

---

## 3. GEOMETRY & SPACING

### Border Radius

**Zero. Always. Everywhere.**

```
--radius: 0rem;
```

Every card, button, input, badge, image container, and modal has `border-radius: 0`. This is non-negotiable. Rounded corners break the Crow Theme. If a library default adds rounding, override it to 0.

### Borders

- Structural dividers: `1px solid #1a1a1a` — near-invisible, just structural
- Card/container borders: `1px solid #222`
- Emphasis borders: `1px solid #444` — logo boxes, hover states
- Active indicator: `2px solid #fff` on the right edge (sidebar nav)
- Section separator: full-width `<div>` with `height: 1px; background: #1a1a1a`

### Spacing Patterns

| Context               | Value                 |
|-----------------------|-----------------------|
| Section padding       | `py-16` (64px)        |
| Main content padding  | `px-12` to `px-16`    |
| Card internal padding | `p-5` to `p-6`        |
| Between sections (divider) | 1px line, no extra gap |
| Header to content     | `mb-12` (48px)        |
| Label to heading      | `mb-3` (12px)         |
| Heading underline     | `mt-4`, width 64px (`w-16`), `#222` |
| Stat groups           | `gap-10` (40px)       |
| Tag groups            | `gap-1.5` to `gap-2`  |
| Grid gap (1px-gap pattern) | `gap-px` with `#222` bg showing through |

### The 1px-Gap Grid Pattern

This is a signature Crow Theme pattern for data grids:

```html
<div class="grid grid-cols-3 gap-px border border-[#222]" style="background: #222">
  <div class="p-5" style="background: #050505">
    <!-- cell content -->
  </div>
  <!-- more cells... -->
</div>
```

The parent has a `#222` background and `gap-px`. Each child has the void `#050505` background. The 1px gap reveals the parent's background as hairline grid lines. This creates an elegant data table without heavy borders.

---

## 4. COMPONENT PATTERNS

### Section Header (use for every section)

```
[Section marker]     ◈ Infrastructure          — mono 10px, #555, uppercase, 0.3em spacing
[Title]              Environment Setup          — serif 40px, #fff, light
[Underline]          ────────                   — 1px height, 64px width, #222, mt-4
```

The section marker always starts with a decorative glyph from this set: `◈ ⬡ ◉ ▸ ★`. Followed by the section name.

### Data Card / Stat Block

```
┌─────────────────────────────┐  border: 1px #222
│  LABEL          mono 9px #555│
│  Value          serif 18px #e0e0e0│
│  Detail         mono 10px #444│
└─────────────────────────────┘
```

### Tag / Badge

```
┌──────────┐  border: 1px #222, px-2 py-0.5
│  QLoRA   │  mono 9px, #555, uppercase, 0.1em spacing
└──────────┘
```

### Status Badge

Same as tag but color varies by importance:
- HIGH / ACTIVE / NEW → `#e0e0e0`
- MEDIUM / MVP → `#888`
- LOW / PLANNED → `#555`

### Expandable Item (Accordion)

```
┌──────────────────────────────────────────────┐
│  ◈  Project Name   [STATUS]              +   │  — + rotates 45° when open
│      Tagline text                            │
├──────────────────────────────────────────────┤
│  Description paragraph in serif #888         │
│                                              │
│  DETAILS         mono 9px #555               │
│  ▸ Detail line 1  mono 11px #888             │
│  ▸ Detail line 2                             │
│                                              │
│  [Tag1] [Tag2] [Tag3]                        │
└──────────────────────────────────────────────┘
```

### Code Block

```
┌──────────────────────────────────────────────┐
│  LABEL                              COPY     │  border-b #222
├──────────────────────────────────────────────┤
│  code content                                │  bg: #0a0a0a, mono 12.5px #888
│  more code                                   │
└──────────────────────────────────────────────┘
```

### Sidebar Navigation

- Fixed left, 180px wide, full height
- Background: `#050505`
- Border-right: `1px #1a1a1a`
- Logo: square box `border: 1px #444` with single letter, mono
- Nav items: mono 10.5px uppercase, `#888` default, `#fff` + right-border `#fff` when active
- Sub-items indented with `▸` prefix, mono 9.5px, `#555`
- Footer: tech tags in small bordered badges

### Table

- Border: `1px solid #222` outer
- Row dividers: `border-bottom: 1px #1a1a1a`
- Header cells: mono 9px uppercase `#555`
- Data cells: mono 10-11px `#888` or `#e0e0e0` for emphasis
- Column dividers: `border-right: 1px #1a1a1a`

### Pipeline / Flow Visualization

Horizontal chain of bordered boxes connected by `▸` arrows:

```
[Step 1] ▸ [Step 2] ▸ [Step 3] ▸ [Step 4]
```

Each box: `border: 1px #222`, `px-4 py-3`, mono 10px uppercase `#e0e0e0`.

### Status Strip

Horizontal bar with label-value pairs separated by thin vertical dividers (`1px #222`):

```
Status ◉ Online  |  Platform  Gradient  |  Stack  Python 3.11
```

---

## 5. ANIMATIONS (web only)

Animations are sparse and slow. They communicate state, not decoration.

### Available Animations

```css
/* Pulsing text (cover page CTA) */
@keyframes pulse-text {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
/* Duration: 2s, ease-in-out, infinite */

/* Expanding line (cover page) */
@keyframes line-expand {
  from { width: 0; }
  to { width: 120px; }
}
/* Duration: 1.5s, ease-out, 0.5s delay, forwards */

/* Fade in up (tab content transitions) */
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Duration: 0.8s, ease-out, forwards */
```

### Rules

- Page transitions: simple opacity fade, 500ms
- Interactive elements: `transition-colors` only, default duration
- Expand/collapse: `rotate(45deg)` on the `+` icon, 200ms
- No bouncing, no sliding panels, no parallax, no particle effects

---

## 6. COVER PAGE PATTERN (web only)

When building a website, include a cover/splash page:

```
                    ┌───────────┐
                    │           │
                    │     N     │  100×100px box, border #444
                    │           │  mono 40px light #fff
                    └───────────┘

                    NAVADA LAB        mono 11px medium #e0e0e0, 0.45em
                    ───────────       animated expanding line #444
                    AI Research       mono 10px #555, 0.3em

                    Click to enter    pulsing mono 10px #555, 0.35em
```

Background: `#050505`. Centered. Clicking anywhere triggers a 500ms fade-out and enters the main app.

---

## 7. LAYOUT ARCHITECTURE

### Web Layout

```
┌──────────┬───────────────────────────────────────┐
│          │                                       │
│ Sidebar  │        Main Content Area              │
│ 180px    │        max-width: 896px (max-w-4xl)   │
│ fixed    │        px-12 to px-16                  │
│          │        centered                        │
│          │                                       │
│          │  [Section]                             │
│          │  ─────── 1px divider                   │
│          │  [Section]                             │
│          │  ─────── 1px divider                   │
│          │  [Section]                             │
│          │                                       │
└──────────┴───────────────────────────────────────┘
```

### PDF / Document Layout

- Page background: very dark (`#050505` or near-black for digital PDFs)
- Margins: generous (at least 1 inch / 2.5cm)
- Section titles: serif, large, `#fff`
- Body text: serif 11-12pt, `#888`
- Labels: mono, small, uppercase, `#555`
- Tables: use the 1px-gap grid pattern or thin-border tables
- Page numbers: mono, small, bottom-right, `#555`

### Application / Dashboard Layout

- Same sidebar + main content pattern
- Cards use `#0a0a0a` elevated background with `#222` borders
- Form inputs: `border: 1px #222`, `background: #050505`, mono text `#888`, no rounded corners
- Buttons: `border: 1px #222`, mono uppercase, `#555` text, hover → `#888` text + `#1a1a1a` bg

---

## 8. ICON & GLYPH SYSTEM

The Crow Theme uses **Unicode glyphs** instead of icon libraries. This keeps the aesthetic pure and avoids visual noise.

### Approved Glyphs

| Glyph | Unicode | Usage                           |
|-------|---------|----------------------------------|
| ◈     | U+25C8  | Primary section marker, LLM      |
| ⬡     | U+2B21  | Projects, hexagonal concept      |
| ◉     | U+25C9  | Status indicator (online/active) |
| ▸     | U+25B8  | List bullet, flow arrow, sub-item|
| ★     | U+2605  | Technical/featured marker        |
| +     | ASCII   | Expand/collapse toggle           |

Display these in `#444` (ghost colour) at 8-12px. They are structural, not decorative.

---

## 9. DALL-E IMAGE GENERATION INTEGRATION

When the Crow Theme requires images (hero images, backgrounds, illustrations, product shots, etc.), use the DALL-E API to generate them **on-theme**.

### DALL-E Prompt Formula

Every DALL-E prompt for the Crow Theme MUST follow this structure:

```
[Subject description]. Shot in pure monochrome black and white,
high contrast, dark background (#050505 near-black), dramatic studio lighting
with sharp directional light from the left. Ultra-clean, minimal composition.
No color whatsoever — strictly grayscale. Technical/industrial aesthetic,
editorial quality. Sharp focus, no blur. Modern brutalist style.
Negative space is intentional and generous. [specific framing instruction].
```

### Prompt Templates by Use Case

**Product / Object Shot:**
```
A [object] photographed in pure monochrome. Near-black background,
single sharp directional light from the upper-left creating dramatic
highlights on edges. Ultra-clean studio shot, no reflections on
background. Technical precision, editorial quality. High contrast
black and white only — zero color. Object fills 60% of frame,
generous negative space.
```

**Abstract / Texture Background:**
```
Abstract [texture/pattern description] in pure monochrome.
Near-black tones dominating, with subtle lighter gradients revealing
form. Minimal, almost invisible detail. Could be mistaken for a
solid dark surface at first glance. No color. Suitable as a
dark background with very subtle visual interest.
```

**Person / Portrait:**
```
[Person description] photographed in dramatic monochrome.
Near-black background, Rembrandt-style lighting with single key light.
High contrast, deep shadows. Only face and key details illuminated.
Strictly black and white, editorial fashion photography aesthetic.
Sharp focus, no motion blur. Confident, composed expression.
```

**Architecture / Environment:**
```
[Space description] in stark monochrome. Deep shadows, minimal
ambient light, sharp geometric forms. Brutalist or minimalist
architecture. Near-black atmosphere with selective highlights on
structural edges. No colour. Feels like a high-end architectural
photography monograph.
```

**Tech / Interface Mock:**
```
[Device/screen description] in pure dark monochrome.
Near-black environment, screen glowing faintly with grayscale UI.
No colour LEDs or indicators — everything grayscale. Clean
technical aesthetic, studio shot. Sharp focus, no lens effects.
```

### DALL-E API Integration Code

When generating images programmatically, use this pattern:

```python
import openai
import os

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_crow_image(subject: str, use_case: str = "product", size: str = "1792x1024"):
    """Generate a DALL-E image that conforms to the Crow Theme.

    Args:
        subject: What to depict (e.g., "a sports car", "a laptop on a desk")
        use_case: One of "product", "abstract", "portrait", "architecture", "tech"
        size: DALL-E 3 sizes — "1024x1024", "1792x1024", "1024x1792"
    """
    base_style = (
        "Pure monochrome black and white, high contrast, near-black background (#050505), "
        "dramatic studio lighting with sharp directional light. Ultra-clean minimal composition. "
        "No color whatsoever — strictly grayscale. Brutalist editorial aesthetic. "
        "Sharp focus, generous negative space."
    )

    prompts = {
        "product": f"{subject}. {base_style} Studio product photography, object fills 60% of frame.",
        "abstract": f"Abstract representation of {subject}. {base_style} Subtle texture on near-black, almost invisible detail.",
        "portrait": f"{subject}. {base_style} Rembrandt lighting, deep shadows, editorial fashion photography.",
        "architecture": f"{subject}. {base_style} Stark geometric forms, brutalist minimalism, selective edge highlights.",
        "tech": f"{subject}. {base_style} Faint grayscale glow, clean technical aesthetic, no colour LEDs.",
    }

    response = client.images.generate(
        model="dall-e-3",
        prompt=prompts.get(use_case, prompts["product"]),
        n=1,
        size=size,
        quality="hd",
        style="natural",
    )

    return response.data[0].url
```

### Image Integration Rules

- All images must be **monochrome only** — if you receive a coloured image, desaturate it to grayscale before using
- Images sit on `#050505` backgrounds with no visible border (or `border: 1px #1a1a1a` if needed for structure)
- Captions below images: mono 9px uppercase `#555`, 0.2em letter-spacing
- Image containers: no border-radius (square corners always)
- Prefer `object-contain` over `object-cover` to preserve the subject
- Hero images can be large but should never dominate — the typography is the hero

---

## 10. APPLYING CROW THEME TO DIFFERENT OUTPUTS

### Websites (HTML / React / Next.js)

- Use all CSS variables, fonts, and component patterns exactly as documented
- Import Newsreader and IBM Plex Mono from Google Fonts
- Set `<body>` background to `#050505`, `color` to `#fff`
- Include the cover page pattern
- Include sidebar navigation
- Use Tailwind utility classes matching the patterns above
- Scrollbar styling required (see Colour System)

### PDFs

- Background: near-black for digital viewing PDFs, or white with inverted colour scheme for print PDFs (ask user which)
- Use Newsreader for headings and body, IBM Plex Mono for labels/metadata
- Maintain the same typographic scale (adjusted for print: ~11pt body, ~24pt headings)
- Tables use thin `#222` borders, mono headers
- Page numbers: mono, small, bottom-right

### Presentations (PPTX)

- Slide background: `#050505`
- Title slides: serif, large, centered, `#fff`
- Content slides: follow the section header pattern
- Data slides: use the 1px-gap grid pattern
- No gradients, no drop shadows, no rounded shapes
- Slide numbers: mono, small, bottom-right, `#555`

### Application UIs

- Follow the sidebar + main content layout
- Forms: dark inputs, mono labels, no rounded corners
- Modals: `#0a0a0a` background, `#222` border, no rounded corners
- Tooltips: `#0a0a0a` bg, `#222` border, mono 10px `#888`
- Loading states: use `pulse-text` animation on "Loading..." text (mono, `#555`)

### Dashboards

- Cards: `#0a0a0a` elevated background, `#222` border
- Charts: grayscale only — use `#fff`, `#e0e0e0`, `#888`, `#555`, `#333` for data series
- KPI numbers: serif 40px+ light `#fff`
- KPI labels: mono 9px uppercase `#555`

---

## 11. ANTI-PATTERNS (what NOT to do)

These will break the Crow Theme:

- Adding any colour (even "subtle" blues or greens)
- Using rounded corners (`border-radius > 0`)
- Using bold serif text (serif is always `font-weight: 300`)
- Using icon libraries (FontAwesome, Heroicons, etc.) — use Unicode glyphs
- Adding drop shadows or box shadows
- Using gradients (the only exception: very subtle `#0a0a0a` → `#050505` for depth)
- Using more than 2 font families
- Making text larger than 56px or smaller than 8px
- Using decorative dividers (fancy lines, ornaments)
- Adding animations that bounce, slide sideways, or loop aggressively
- Using emojis anywhere in the UI
- Using background images that aren't monochrome
- Centering body text (body text is always left-aligned; only cover page elements center)

---

## Quick Reference Card

```
Background:     #050505
Elevated:       #0a0a0a
Border light:   #1a1a1a
Border medium:  #222
Border strong:  #444
Text ghost:     #444
Text muted:     #555
Text body:      #888
Text emphasis:  #e0e0e0
Text bright:    #fff

Serif:          Newsreader, weight 300, for content
Mono:           IBM Plex Mono, weight 400, for structure
Radius:         0 everywhere
Dividers:       1px, #1a1a1a
Glyphs:         ◈ ⬡ ◉ ▸ ★
```

When in doubt: darker, thinner, smaller, more spaced-out, more restrained. The Crow Theme whispers — it never shouts.
