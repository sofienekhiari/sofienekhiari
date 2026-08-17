---
paths:
  - "src/**"
  - "astro.config.mjs"
  - "public/**"
---

# Design and architecture, sofk.ch

Everything here was settled in the decision rounds in `decisions/`. The decision id is given so the
reasoning can be read rather than guessed at. **None of it may be changed without a new round.**

## What the site is

Three pages (D-03). The home page carries the bio and the experience timeline together, because the
bio makes a claim and the timeline is its evidence. Publications and Talks each have their own page.

There is no Skills section, deliberately. It was removed at Sofiene's instruction: the work is meant
to show the skills.

Written for a general professional reader (D-04), neither an academic nor a recruiter specifically.
That is why the register stays plain and nothing assumes domain knowledge.

## The visual identity (D-05, D-16, D-17)

- **Layout is direction A, "Ledger"**: a sticky left rail holding identity, navigation and contact
  details, with content scrolling beside it. Below 1024px the rail becomes an ordinary header.
- **Teal `#008080` light, `#4dd0d0` dark**, is the accent, preserved from the previous site. It is
  the one element people recognise. Amber marks academic timeline entries, teal professional ones.
- **Inter carries every role**, including headings. There is deliberately no display typeface, so
  hierarchy comes from weight, scale and spacing. JetBrains Mono is for hashes, dates and
  command-line fragments only.
- Both faces come from the **Google Fonts CDN** (D-28), loaded via a `<link>` and two preconnects in
  the head of `Base.astro`. Never move that back into a CSS `@import`: an import makes the browser
  fetch the CSS, parse it, and only then request the fonts. Self-hosting was considered and ruled
  against, so do not reintroduce it either. Because the fonts are third-party, the system fallback
  stack in `--font-sans` and `--font-mono` is load-bearing rather than decorative.
- Tokens live in `@theme` in `src/styles/global.css` (D-21). Use the named Tailwind utilities they
  generate (`text-accent`, `bg-surface`, `border-line`). Never write a raw hex value in markup.

- The favicon is an **SK monogram**, white on teal (D-27), drawn as SVG text with a system font
  stack because a favicon cannot wait for a webfont.

Sofiene left one thing deliberately open: whether a display typeface and a bolder register earn
their place once the built site can be judged. If that comes up, it is a new round that supersedes
D-16, not a reinterpretation of it.

## Copy

The bio is his. The four shorter strings that were not in the original bio, the one-sentence
`summary` in `profile.ts` and the three page subtitles, were drafted by Claude and he approved them
as they stand (D-26). Treat them as his words now: change them only on his say-so.

**One gap is deliberate.** The publications page has no closing line pointing at a full record. An
earlier draft claimed GitHub held one, which is false, so it was removed. When he supplies an ORCID,
Google Scholar or institutional link, that is what goes there.

## The timeline is the signature element (D-06, D-14, D-18)

`src/components/Timeline.astro` renders the career history as a git commit graph. It is the thing
the site is remembered by, so the rest of the design stays quiet around it.

- The seven-character commit hashes are **invented and stay that way** (D-14). They are stable
  literals in `src/data/experience.ts`, never generated, so a rebuild cannot churn them.
- Each entry is a native `<details>`. That is not incidental: the previous version used clickable
  `<article>` elements with no tabindex, making all nine detail views unreachable by keyboard.
- The spine draws itself on scroll using CSS scroll-driven animation. It animates a line that is
  already fully present, so an unsupporting browser shows the finished line and nothing is lost.
- All graph geometry derives from the `--lane-main`, `--lane-branch` and `--node` variables in that
  component. Positioning nodes independently is what previously made the node's opaque ring paint
  over the first characters of every hash.

## Motion (D-18)

Choreographed, but within the progressive-enhancement floor. Permitted: hover and focus transitions,
Astro view transitions between pages, and scroll-driven animation of already-visible elements.
Forbidden: anything that reveals hidden content, and any animation that does not collapse under
`prefers-reduced-motion`.

## Content sources

- **Bio**: `src/data/profile.ts`, the single source (D-12). The hero, `llms.txt` and `README.md` all
  derive from it. Stored as plain text with no markup, because it must serve all three.
- **Experience**: `src/data/experience.ts`. Dates are the ones D-11 confirmed correct: the PhD begins
  January 2025, the MSc ran to December 2024. There is no freelance developer entry (D-10).
- **Publications and talks**: content collections (D-25), one markdown file each. Adding either means
  creating a file, never editing TypeScript.
- **Talks are written articles, not slides** (D-19). A talk write-up is prose making the talk's
  argument, pulling in only figures that carry real information. Never publish a deck as images.
- **Degree documents** are published and linked from their timeline entry (D-22). Paths under
  `/assets/documents/` are unchanged from the previous site so shared links still resolve.

## Code standards here (D-20)

Sofiene's global standards apply, with one boundary drawn by file region:

- **Full rules inside TypeScript**: frontmatter scripts, `.ts` files and config get a comment on the
  line before every line of code, saying what it does and why, plus TSDoc on every exported symbol.
- **Template markup and Tailwind class lists are exempt**, and carry a comment per block instead.
  A comment before every `<div>` buries structure rather than clarifying it.
- The roughly 100-line budget, 200 maximum, counts code lines only. Comment-only lines are free, so
  documenting generously can never push a file over.

## Build and deployment (D-02, D-24)

Built locally and the output committed to `docs/`. Pages serves that folder from the default branch;
there is no CI. URLs are directory-style, so `/publications/` rather than `/publications.html`
(D-24), and there is no redirect facility on this host, so a published URL is effectively permanent.
