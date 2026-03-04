---
name: navada-post
description: >
  NAVADA content creation skill. Creates and publishes social media posts
  for NAVADA across LinkedIn, Twitter/X, Instagram, and Facebook.
  Triggers on: /navada-post, "post for NAVADA", "create a NAVADA post",
  "publish to socials", "schedule content for NAVADA".
argument-hint: "[topic or URL] [platform? twitter|linkedin|instagram|facebook|all]"
---

# NAVADA Post Skill

## Purpose
Create and publish social media content for NAVADA — AI strategy consultancy
and UK-Africa venture capital fund. Takes a topic, URL, or draft and produces
platform-native posts with visuals, then publishes via Blotato API.

## Content Pillars
Always frame content around one of these NAVADA themes:
- Enterprise AI delivery & Claude Code / agent systems
- UK-Africa venture capital & tech investment
- AI tools, skills, and workflows (FOIL, ALEX, NotebookLM, etc.)
- Thought leadership: AI strategy for insurance, financial services, digital transformation

---

## Trigger
Use this skill when the user:
- Types `/navada-post`
- Mentions "post for NAVADA", "NAVADA content", "schedule a post"
- Provides a topic + platform combination
- Pastes a URL and asks to turn it into a post

---

## Step-by-Step Process

### Step 1 — Parse Input
Determine what the user has provided:
- **Topic only** → research it, then draft
- **URL** (YouTube, article, PDF, website) → extract via Blotato Create Source API, then draft
- **Draft text** → adapt it per platform voice
- **Image URLs** → use as visual, skip generation

If platform is not specified, default to `linkedin`.
If platform is `all`, post to all four platforms in parallel using subagents.

Ask ONE clarifying question if intent is unclear. Do not ask multiple questions at once.

---

### Step 2 — Extract Source Content (if URL provided)

```bash
curl -s -X POST "https://backend.blotato.com/v2/sources" \
  -H "blotato-api-key: $BLOTATO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "<URL>"}'
```

Poll until status is `completed`, then use the extracted text as your content base.

---

### Step 3 — Draft Post

Write the post following NAVADA brand voice (see below).
Adapt length, format, and tone per platform:

| Platform  | Length       | Format notes                                      |
|-----------|--------------|---------------------------------------------------|
| LinkedIn  | 150-300 words | Paragraph breaks. No markdown. Story or insight.  |
| Twitter/X | Under 280 chars | Punchy. Single idea. Optional thread.           |
| Instagram | 100-150 words | Conversational. Line breaks. No links in body.   |
| Facebook  | 80-150 words  | Warm, direct. Can include a question.             |

---

### Step 4 — Generate Visual (unless user provides image URLs)

Browse available Blotato templates: https://help.blotato.com/api/create-video/visuals

Pick a template appropriate for the content type, then:

```bash
curl -s -X POST "https://backend.blotato.com/v2/videos" \
  -H "blotato-api-key: $BLOTATO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"templateName": "<template>", "text": "<headline>", "brandColor": "#0A0F2C"}'
```

Poll for `status: completed` to get the media URL.
NAVADA brand colour: `#0A0F2C` (dark navy). Accent: `#C9A84C` (gold).

---

### Step 5 — Quality Gate (run before every publish)

Check the post draft for ALL of the following before proceeding:
- [ ] No em dashes (—). Replace with comma, period, or ellipsis (...)
- [ ] No banned words (see brand voice section below)
- [ ] Within character limit for the platform
- [ ] Instagram and Facebook posts do NOT contain markdown
- [ ] LinkedIn post does NOT exceed 3000 characters
- [ ] Visual or image URL is present if platform requires one

If any check fails: **stop, show what needs fixing, fix it, re-check.**
Do NOT publish a post that fails the quality gate.

---

### Step 6 — Show Plan & Ask for Approval

Display the full post draft(s) and visual preview URL to the user.
Ask: "Ready to publish/schedule? (yes / edit first)"

Do NOT publish until the user explicitly approves.

---

### Step 7 — Publish via Blotato

For single platform:

```bash
curl -s -X POST "https://backend.blotato.com/v2/posts" \
  -H "blotato-api-key: $BLOTATO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"platform": "<platform>", "text": "<post_text>", "mediaUrls": ["<visual_url>"], "useNextFreeSlot": true}'
```

For `all` platforms — spawn one subagent per platform. Each subagent:
1. Adapts the post for its platform using brand voice
2. Runs the quality gate
3. Publishes independently
4. Logs its result

All subagents run in parallel. Wait for all to complete before summarising.

---

### Step 8 — Log Results

Append to `navada-posts-log.md` in the project root:

```markdown
## [DATE] — [PLATFORM]
**Topic:** [topic]
**Status:** published / scheduled
**Live URL:** [url from Blotato response]
**Scheduled for:** [slot time if useNextFreeSlot]
---
```

---

## NAVADA Brand Voice

### Writing Rules (apply to ALL platforms)
- Professional and direct. Practitioner tone — not influencer, not corporate.
- Short sentences. One idea per sentence.
- Active voice only. Never passive.
- Address the reader as "you" and "your".
- No em dashes (—). Use commas, periods, or ellipsis (...) instead.
- No hashtags, markdown, asterisks, or semicolons.
- No filler: just, very, really, literally, actually, certainly, basically,
  could, maybe, perhaps, quite, rather, somewhat.
- No AI buzzwords: delve, embark, game-changer, unlock, revolutionize,
  cutting-edge, groundbreaking, tapestry, pivotal, leverage (when overused),
  disruptive, utilize, dive deep, illuminate, unveil, elucidate, skyrocket,
  transformative, paradigm, synergy, holistic, robust.
- No "In conclusion", "In summary", "To summarise".
- Review every post before publishing and confirm zero em dashes.

### Voice per Platform

**LinkedIn** — Thought leadership. Share a concrete insight or lesson from
real delivery work. Lead with the point, then support it. End with a
question or call to action. Sound like a senior practitioner, not a vendor.

**Twitter/X** — One sharp observation. Punchy. Can be provocative if backed
by evidence. Short enough to stand alone. No thread unless content genuinely
needs it.

**Instagram** — Behind the scenes of building NAVADA or ALEX. More personal
than LinkedIn. Line breaks between short sentences. Accessible to non-technical
followers.

**Facebook** — Community-facing. Slightly warmer. Can reference the NAVADA
UK-Africa mission more directly. Invite conversation.

---

## API Configuration

API key lives in `.claude/settings.local.json`:
```json
{
  "env": {
    "BLOTATO_API_KEY": "your-key-here"
  }
}
```

This file is gitignored. Claude Code auto-injects `$BLOTATO_API_KEY`
into every shell command. Never hardcode the key.

Blotato API docs: https://help.blotato.com/api/llm
Blotato scheduling: https://my.blotato.com/queue/slots
Blotato visual templates: https://help.blotato.com/api/create-video/visuals

---

## Error Handling

- If Blotato returns non-200: show the error, do not retry automatically, ask user how to proceed.
- If visual generation fails: ask user if they want to post without a visual or provide their own image URL.
- If `useNextFreeSlot` returns no available slots: warn user their content calendar may be full, link them to https://my.blotato.com/queue/slots.
- If source extraction fails for a URL: ask user to paste the content manually.

---

## Example Invocations

```
/navada-post "Why most enterprise AI pilots fail" linkedin
/navada-post "ALEX architecture update" all
/navada-post https://youtube.com/watch?v=xxx twitter
/navada-post "UK-Africa VC opportunity in fintech" all
```
