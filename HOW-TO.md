# How to Use This System
### LinkedIn Content — Dexo Media

---

## The Full Flow

```
IDEA → BRIEF → DRAFT → APPROVE → CARDS + IMAGES → PUBLISH
```

You handle: briefing and approving.
Claude handles: everything else — including posting to LinkedIn.

---

## Step 1 — Pick an Idea

Tell Claude:
> "Let's do idea 6 from the bank"

Or bring your own story:
> "I had a call today where X happened, let's turn it into a post"

---

## Step 2 — Brief Claude

Give the real details when asked:
- What happened (specific situation, moment, client)
- The numbers (₹ amounts, timeframes, percentages)
- What was said, how it ended

The more specific, the better the draft.

---

## Step 3 — Review the Draft

Claude writes the post and shows it to you.

- **"Perfect"** → Claude saves it and moves it to ready
- **"Change X"** → Claude edits and shows it again
- **"Scrap it"** → start fresh with a new brief

---

## Step 4 — Get the Carousel

Tell Claude:
> "Generate carousel cards for this post"

Claude will:
1. Write all the card HTML files
2. Generate the images automatically
3. Tell you where the PNGs are

You don't run anything. Claude does it all.

---

## Step 5 — Review the Images

Open Finder → `posts/drafts/[topic-name]/images/`

If something looks off, tell Claude:
> "Card 3 has too much text, trim it"
> "Redo card 5 — the headline should say X"

Claude edits the card and regenerates the image.

---

## Step 6 — Publish to LinkedIn

Tell Claude:
> "Post it"

Claude will:
1. Take the approved post text
2. Merge all carousel images into a PDF
3. Upload the PDF to LinkedIn
4. Publish the post with the carousel attached
5. Move the post to `posts/published/` and update the calendar

You do nothing. It's live.

---

## Quick Commands — What to Say to Claude

| What you want | Say this |
|---|---|
| Pick an idea | "Let's do idea [#] from the bank" |
| Draft from a story | "I had a situation — [brief details], make a post" |
| Generate carousel | "Generate carousel cards for this post" |
| Fix a card | "Redo card [#] — [what to change]" |
| Move to ready | "Move this to ready" |
| Publish to LinkedIn | "Post it" |
| Add a new idea | "Add this to the idea bank: [hook]" |
| See what's next | "What's on the content calendar?" |
| Check remaining ideas | "What ideas do we have left in the bank?" |

---

## Folder Map (for reference)

```
linkedin content/
├── HOW-TO.md                        ← you are here
├── CLAUDE.md                        ← Claude's instructions (auto-loaded)
├── ideas/
│   ├── bank.md                      ← idea backlog
│   └── archive.md                   ← used/killed ideas
├── posts/
│   ├── drafts/
│   │   └── [topic-name]/
│   │       ├── cards/               ← card HTML files (Claude writes these)
│   │       └── images/              ← generated PNGs (Claude generates these)
│   ├── ready/                       ← approved, copy-paste ready
│   └── published/                   ← posted + date + performance notes
├── strategy/
│   ├── content-pillars.md           ← 4 buckets + angles
│   ├── voice-guide.md               ← writing rules
│   └── weekly-plan.md               ← 4-week calendar
└── templates/
    └── card-standalone.html         ← card design base (Claude uses this automatically)
```

---

## That's It

You talk. Claude builds. You approve. Claude posts.

---

## One-Time LinkedIn Setup (already done)

LinkedIn credentials are stored in `.env` (gitignored — never committed).
Auth token was set up via `scripts/linkedin-auth.js`.
If the token ever expires (after ~60 days), just tell Claude: "Re-authorize LinkedIn".
