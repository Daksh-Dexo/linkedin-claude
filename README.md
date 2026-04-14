# LinkedIn Content System — Dexo Media

A fully automated LinkedIn content pipeline. Brief Claude → approve the draft → say "post it". Everything in between is handled automatically.

---

## What This Is

A structured workspace for creating, approving, and publishing daily LinkedIn posts — including carousel cards with designed PNG images — without running a single command manually.

Built for: [Dexo Media](https://dexomedia.com) / Daksh Sahu.

---

## How It Works

```
IDEA → BRIEF → DRAFT → APPROVE → CAROUSEL CARDS + IMAGES → PUBLISH
```

You handle: briefing and approving.  
Claude handles: drafting, generating card images, uploading to LinkedIn, updating the calendar.

---

## Quick Start (Daily Flow)

1. Open a Claude Code session in this folder
2. Say: _"Let's do idea 4 from the bank"_ or _"I had a situation today — [brief details]"_
3. Claude drafts the post in your voice
4. Say _"Perfect"_ to approve — Claude saves it
5. Say _"Generate carousel cards"_ — Claude writes the card HTML and generates PNG images
6. Review images in `posts/drafts/[topic]/images/`
7. Say _"Post it"_ — Claude uploads to LinkedIn and marks it as published

Full command reference: see [`HOW-TO.md`](HOW-TO.md)

---

## Folder Structure

```
linkedin content/
├── CLAUDE.md                        # Claude's instructions — auto-loaded every session
├── HOW-TO.md                        # Workflow guide
├── ideas/
│   ├── bank.md                      # Idea backlog (hooks/angles, not full posts)
│   └── archive.md                   # Used or killed ideas
├── posts/
│   ├── drafts/
│   │   └── [topic-name]/
│   │       ├── [topic-name].md      # Draft post text
│   │       ├── cards/               # Card HTML files (Claude generates)
│   │       └── images/              # Generated PNGs (1080x1080, Claude generates)
│   ├── ready/                       # Approved posts, ready to publish
│   └── published/                   # Published posts with date + post ID
├── strategy/
│   ├── content-pillars.md           # 4 content buckets + angles
│   ├── voice-guide.md               # Writing rules extracted from real posts
│   └── weekly-plan.md               # Rolling 4-week content calendar
├── scripts/
│   ├── generate-images.js           # Playwright: card HTML → PNG (1080x1080)
│   ├── linkedin-auth.js             # One-time OAuth setup
│   ├── linkedin-post.js             # Posts text + PDF carousel to LinkedIn API
│   └── linkedin-set-urn.js          # Fallback: manually set person URN
└── templates/
    └── card-standalone.html         # Card design base (red/white, 1080x1080)
```

---

## Tech Stack

| Purpose | Tool |
|---|---|
| Card images | Playwright (headless Chromium, HTML → PNG screenshot) |
| Carousel upload | `pdf-lib` — PNGs merged into PDF, uploaded via LinkedIn Documents API |
| LinkedIn API | REST API v2 (`/rest/posts`, `/rest/documents`) with OAuth 2.0 |
| Runtime | Node.js (via `/opt/homebrew/bin/node`) |

---

## Content Strategy

4 buckets, posted in rotation:

| Bucket | What it covers |
|---|---|
| **Agency Reality** | Internal truths about how agencies actually work |
| **Marketing Truths** | What actually works vs. what LinkedIn says |
| **Brand Breakdowns** | Real analysis of what brands do right or wrong |
| **Operator Insights** | SOPs, communication systems, scaling problems |

Rotation: Mon (Agency) → Tue (Marketing) → Wed (Brand) → Thu (Operator) → Fri (Personal) → Sat (Short)

---

## Setup (One-Time)

**1. Install dependencies**
```bash
npm install
```

**2. Add LinkedIn credentials to `.env`**
```
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
```

**3. Authorize LinkedIn** (tell Claude: _"Authorize LinkedIn"_ — Claude runs the auth flow and saves the token)

The app needs these LinkedIn Developer products enabled:
- **Share on LinkedIn** (`w_member_social` scope)
- **Sign In with LinkedIn using OpenID Connect** (`openid profile` scopes — needed to get your Person URN)

Token lasts ~60 days. When it expires, tell Claude: _"Re-authorize LinkedIn"_.

---

## Voice Rules (Short Version)

- Short lines. One idea per line. Fragments are intentional.
- Always specific: ₹86L, 12:15 PM, 21 agencies — never vague.
- Failure first. Show the loss before the lesson.
- Quiet endings. Never preachy.
- No listicles, no jargon, no AI phrases.

Full rules: [`strategy/voice-guide.md`](strategy/voice-guide.md)

---

## Security

`.env` is gitignored. Never commit credentials.  
The `.gitignore` covers: `.env`, `node_modules/`, `.DS_Store`
