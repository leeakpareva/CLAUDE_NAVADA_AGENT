---
name: navada-media
description: >
  NAVADA media asset creation skill. Generates any kind of media asset
  for the NAVADA brand — videos (Remotion), AI images (Nano Banana 2),
  audio podcasts (NotebookLM), thumbnails, infographics, mind maps,
  slide decks, and animated social clips (Blotato).
  Triggers on: /navada-media, "create a video", "generate an image",
  "make a thumbnail", "create a podcast", "build a slide deck",
  "generate media for NAVADA", "make an infographic", "create assets".
argument-hint: "[asset-type] [description or topic]"
---

# NAVADA Media Skill

## Purpose
Generate any media asset for the NAVADA brand — from full rendered MP4
videos to AI images, branded slide decks, audio podcasts, and animated
social clips. All output follows NAVADA's brand identity.

## NAVADA Brand Identity
- **Primary colour:** `#0A0F2C` (deep navy)
- **Accent colour:** `#C9A84C` (gold)
- **Background:** `#080C22` (near black)
- **Text:** `#FFFFFF` (white) / `#E8E8E8` (light grey)
- **Font style:** Sharp, geometric. Editorial + technical.
- **Aesthetic:** Dark luxury. Confident. Precision over noise.
- **Tone:** Senior practitioner. AI strategy + Africa opportunity.

---

## Asset Type Router

When the user asks to create media, identify the asset type and route to
the correct tool below. If unclear, ask ONE question:
"What format do you need — video, image, audio, slides, or infographic?"

| Asset Type               | Tool               | Output Format        |
|--------------------------|--------------------|----------------------|
| Branded video / intro    | Remotion           | MP4                  |
| Explainer / demo video   | Remotion           | MP4                  |
| Data visualisation video | Remotion           | MP4                  |
| AI-generated video clip  | inference.sh Veo   | MP4                  |
| Hero image / thumbnail   | Nano Banana 2      | PNG/JPG              |
| Logo / icon (no bg)      | Nano Banana 2 -t   | PNG (transparent)    |
| Social visual            | Nano Banana 2      | PNG/JPG              |
| Infographic              | Nano Banana 2      | PNG                  |
| Audio podcast/overview   | NotebookLM CLI     | MP3                  |
| Slide deck               | NotebookLM CLI     | PDF/PPTX             |
| Animated social clip     | Blotato            | MP4 (template-based) |
| Mind map                 | NotebookLM CLI     | JSON/PNG             |
| Quiz / flashcards        | NotebookLM CLI     | JSON/MD              |

---

## TOOL A — Remotion (Branded Video)

Use for: intros, explainers, pitch videos, data visualisations, product
demos, animated presentations. Full control. React-based. Renders to MP4.

### Prerequisites (run once)
```bash
# Check if Remotion project exists, if not create it
ls ~/navada-video/package.json 2>/dev/null || (
  npx create-video@latest navada-video --template blank --tailwind --yes
  cd ~/navada-video && npm install
  npx skills add remotion-dev/skills
)
```

### NAVADA Remotion Brand Config
Create `~/navada-video/src/NavadaBrand.ts` if it doesn't exist:
```typescript
export const NAVADA = {
  colors: {
    navy:  '#0A0F2C',
    gold:  '#C9A84C',
    bg:    '#080C22',
    white: '#FFFFFF',
    grey:  '#E8E8E8',
  },
  fonts: {
    display: 'Space Grotesk',
    body:    'Inter',
    mono:    'JetBrains Mono',
  },
  fps: 30,
};

export const FORMATS = {
  landscape: { width: 1920, height: 1080 }, // YouTube, LinkedIn
  square:    { width: 1080, height: 1080 }, // Instagram, Facebook
  portrait:  { width: 1080, height: 1920 }, // Reels, TikTok, Stories
  thumbnail: { width: 1280, height: 720  }, // YouTube thumbnail
};
```

### Workflow
```bash
# Terminal 1 — start preview
cd ~/navada-video && npm run dev
# Preview at http://localhost:3000

# Terminal 2 — start Claude Code
cd ~/navada-video && claude
```

Then describe the video. Claude writes Remotion components, handles
animation timelines, and renders to MP4.

### Video Prompt Templates
```
# Brand intro (15s)
Create a 15-second NAVADA brand intro. Dark navy (#0A0F2C) background.
Gold (#C9A84C) logo animates in with a light sweep. "NAVADA" title fades
in bold. Subtitle: "AI Strategy | Venture Capital | UK-Africa" slides up.
Cinematic fade to black. 1920x1080, 30fps.
Save to ~/navada-outputs/videos/navada-intro.mp4

# Explainer (60s)
Create a 60-second explainer for [TOPIC]. NAVADA brand colours.
4 sections: Problem (0-15s), Insight (15-30s), NAVADA Approach (30-50s),
CTA (50-60s). Animated text blocks, subtle gold accent lines, dark grid bg.
1920x1080, 30fps.

# Data visualisation
Create an animated data visualisation for [DATA/STATS]. NAVADA dark theme.
Bars/lines animate in. Numbers count up with easing. Gold highlights on
key data points. 30 seconds, 1920x1080.

# YouTube thumbnail (static render)
Create a YouTube thumbnail composition: bold white headline "[TITLE]",
NAVADA navy background, gold left-edge accent bar, abstract AI visual
on the right. Render as PNG, 1280x720.
```

### Render to File
```bash
cd ~/navada-video
npx remotion render src/index.ts <CompositionId> \
  --output ~/navada-outputs/videos/<filename>.mp4
```

---

## TOOL B — Nano Banana 2 (AI Images)

Use for: hero images, thumbnails, social graphics, infographics,
transparent icons/logos, backgrounds, mockups.

### Prerequisites (run once)
```bash
curl -fsSL https://cli.inference.sh | sh && infsh login
mkdir -p ~/.nano-banana
echo "GEMINI_API_KEY=$GEMINI_API_KEY" > ~/.nano-banana/.env
npx skills add inference-sh/skills@nano-banana-2
```

### Image Generation Commands
```bash
# Standard (1K, fast, ~free tier)
infsh app run google/gemini-3-1-flash-image-preview \
  --input '{"prompt": "<prompt>", "resolution": "1K"}'

# High res (2K)
infsh app run google/gemini-3-1-flash-image-preview \
  --input '{"prompt": "<prompt>", "resolution": "2K", "aspect_ratio": "16:9"}'

# Ultra HD (4K)
infsh app run google/gemini-3-1-flash-image-preview \
  --input '{"prompt": "<prompt>", "resolution": "4K"}'

# Transparent background (logo/icon) — requires FFmpeg + ImageMagick
nano-banana "<prompt>" -t -o ~/navada-outputs/images/<name>

# Pro model (higher quality, paid)
nano-banana "<prompt>" --model pro -s 2K
```

### NAVADA Image Prompt Templates
```
# Hero image
Premium dark-luxury hero for a UK-Africa venture capital fund.
Deep navy (#0A0F2C) background, subtle gold geometric grid lines.
Abstract African continent silhouette blended with circuit patterns.
Cinematic lighting, 4K, 16:9 landscape. Professional, aspirational.

# LinkedIn banner
Wide professional banner for NAVADA AI consultancy. Dark navy.
Gold typographic NAVADA logo top-left. Subtle tech grid overlay.
"AI Strategy | Venture Capital | UK-Africa" in clean sans-serif.
Photorealistic editorial quality, 16:9.

# YouTube thumbnail
Bold YouTube thumbnail. Dark navy. Large white headline: "[TITLE]".
Gold accent bar left edge. Abstract tech/AI visual right side.
High contrast, readable at small size. 16:9, 1280x720.

# Transparent logo mark
NAVADA monogram — letter N with subtle circuit/node motif.
Gold on transparent background. Clean vector-style. Minimal.
Green screen background for transparency pipeline.

# Infographic
Clean data infographic. NAVADA dark theme. Gold accent elements.
[Describe data/stats to visualise]. Structured layout, readable
typography, 16:9 or portrait orientation.
```

### Nano Banana Prompt Rules (for best output)
- Always specify resolution: 512, 1K, 2K, 4K
- Always specify aspect ratio: 1:1, 16:9, 9:16, 4:3
- Use camera language: "wide shot", "tight close-up", "shallow depth of field"
- Use lighting terms: "studio lighting", "golden hour", "dramatic chiaroscuro"
- Use material descriptors: "brushed gold", "matte navy", "translucent glass"
- Mention purpose: "for a YouTube thumbnail", "for a LinkedIn banner"

---

## TOOL C — inference.sh Veo (AI-Generated Video)

Use for: generative B-roll, abstract motion backgrounds, concept clips,
mood videos where creative output matters more than precise control.

### Prerequisites (run once)
```bash
npx skills add inference-sh/skills@google-veo
npx skills add inference-sh/skills@ai-video-generation
```

### Generate Video Clip
```bash
infsh app run google/veo --input '{
  "prompt": "<description>",
  "duration": 5,
  "aspect_ratio": "16:9"
}'
```

### NAVADA Veo Prompt Templates
```
# Abstract AI visualisation
Abstract data flows through a neural network. Deep navy background,
gold particle streams converging into geometric nodes. Cinematic,
slow motion, 5 seconds, 16:9.

# UK-Africa connection concept
Aerial view of African cityscape at night, lights pulsing with data
connections reaching across to a London skyline. Gold network lines,
deep blue atmosphere. 5 seconds, cinematic.

# Agent orchestration visualisation
Abstract AI agents activating in sequence. Dark background, glowing
gold and white nodes lighting up, data packets moving between them.
Technological, precise. 5 seconds, 16:9.

# FOIL / app builder concept
Code transforming into a running application. Particles assembling
into UI elements. Dark theme, gold highlights. 5 seconds.
```

---

## TOOL D — NotebookLM CLI (Audio & Research Assets)

Use for: podcast audio overviews, slide decks from research, mind maps,
quizzes, data tables from NAVADA notebooks.

### Prerequisites (run once)
```bash
pip install "notebooklm-py[browser]"
playwright install chromium
notebooklm login
notebooklm skill install
```

### Audio Podcast (MP3)
```bash
notebooklm use <notebook_id>
notebooklm generate audio \
  "professional, aimed at enterprise AI practitioners and investors" --wait
notebooklm download audio ~/navada-outputs/audio/podcast.mp3
```

### Slide Deck (PDF)
```bash
notebooklm generate slide-deck --wait
notebooklm download slides ~/navada-outputs/slides/deck.pdf
```

### Infographic (PNG)
```bash
notebooklm generate infographic --orientation landscape --wait
notebooklm download infographic ~/navada-outputs/images/infographic.png
```

### Mind Map (JSON + PNG)
```bash
notebooklm generate mind-map --wait
notebooklm download mind-map ~/navada-outputs/mindmaps/map.json
```

### Quiz / Flashcards (Markdown)
```bash
notebooklm generate quiz --difficulty hard --wait
notebooklm download quiz ~/navada-outputs/data/quiz.md --format markdown

notebooklm generate flashcards --quantity more --wait
notebooklm download flashcards ~/navada-outputs/data/flashcards.md --format markdown
```

### Data Table (CSV)
```bash
notebooklm generate data-table "compare key concepts" --wait
notebooklm download data-table ~/navada-outputs/data/table.csv
```

---

## TOOL E — Blotato (Animated Social Clips)

Use for: quick branded social video clips via templates. Best for Reels,
TikTok, Stories. Faster than Remotion for simple animated posts.

```bash
# Generate animated clip
curl -s -X POST "https://backend.blotato.com/v2/videos" \
  -H "blotato-api-key: $BLOTATO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "<template>",
    "text": "<headline>",
    "brandColor": "#0A0F2C"
  }'

# Poll for completion then download the mediaUrl from response
```

Browse templates: https://help.blotato.com/api/create-video/visuals
API key lives in `.claude/settings.local.json` → `$BLOTATO_API_KEY`

---

## Output Directory Structure

Always save to the NAVADA outputs folder. Create on first run:

```bash
mkdir -p ~/navada-outputs/{videos,images,audio,slides,mindmaps,data,social-clips}
```

```
~/navada-outputs/
  ├── videos/        ← Remotion MP4s, Veo clips, Blotato clips
  ├── images/        ← Nano Banana images, infographics, thumbnails
  ├── audio/         ← NotebookLM podcasts (MP3)
  ├── slides/        ← Slide decks (PDF/PPTX)
  ├── mindmaps/      ← Mind map exports (JSON/PNG)
  ├── data/          ← Tables, CSVs, quizzes, flashcards
  └── social-clips/  ← Blotato animated social clips
```

---

## Full Asset Pack (all assets from one topic)

When user says `/navada-media all "[TOPIC]"`, run this full pipeline:

1. **Hero image** — Nano Banana, 16:9, 2K → `images/hero.png`
2. **Thumbnail** — Nano Banana, 16:9, 1K → `images/thumbnail.png`
3. **Portrait social** — Nano Banana, 9:16, 1K → `images/social-portrait.png`
4. **Branded video** — Remotion 60s explainer → `videos/explainer.mp4`
5. **Social clip** — Blotato animated (9:16) → `social-clips/reel.mp4`
6. **AI clip** — Veo 5s concept clip → `videos/broll.mp4`
7. **Podcast** — NotebookLM audio (if notebook exists) → `audio/podcast.mp3`
8. **Slides** — NotebookLM deck (if notebook exists) → `slides/deck.pdf`

Run steps 1-3 and 7-8 in parallel.
Start Remotion video (step 4) after hero image is ready.
Show user a full asset summary with all file paths when complete.

---

## Error Handling

| Error | Action |
|-------|--------|
| Remotion render fails | Check `npm run dev` is running. Show error to Claude to fix. |
| Nano Banana rate limit | ~500/day free. Switch to `--model pro` or wait. |
| NotebookLM not authenticated | Run `notebooklm login`. Use dedicated Google account. |
| Blotato visual fails | Use Nano Banana image as fallback. |
| Veo generation slow | Normal — 30-120s. Poll every 10s max. |
| No notebook for audio/slides | Ask user: "Which NotebookLM notebook should I use?" |

---

## Example Invocations

```
/navada-media video "NAVADA VC fund overview, 60 seconds"
/navada-media image "hero for UK-Africa AI investment theme, 4K"
/navada-media thumbnail "Why Enterprise AI Fails"
/navada-media audio "podcast from my NAVADA VC notebook"
/navada-media slides "slide deck from NAVADA strategy notebook"
/navada-media infographic "UK-Africa VC landscape 2026"
/navada-media logo "NAVADA N monogram, transparent background"
/navada-media clip "abstract AI agent animation, 5 seconds"
/navada-media all "NAVADA FOIL app builder launch"
```
