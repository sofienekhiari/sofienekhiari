---
paths:
  - "src/**"
  - "astro.config.mjs"
  - "public/**"
---

# sofk.ch design specification

**This file is the design.** It loads automatically whenever site source is opened, and it exists so
that no edit quietly changes how the site looks. Before changing any visual value, check it here. If
a value in the code disagrees with a value here, the code is wrong unless a decision says otherwise.

The design is **R4 Typed** (D-32): Hugo PaperMod's structure and layout, carrying Manrope instead of
PaperMod's system font stack, on a slightly warm ground. The reference the design descends from is
<https://adityatelange.github.io/hugo-PaperMod/>.

**Nothing here may be changed without a new decision.** Decision ids are given so the reasoning can
be read rather than guessed at. Follow the `decision-ownership` skill.

---

## 1. What the site is

Three pages (D-03, reaffirmed by D-33 after the move to a blog-shaped design):

| Route | Carries |
|---|---|
| `/` | Profile block, the bio, and the experience and education list |
| `/publications/` | The publications list |
| `/talks/` | The talks list, with `/talks/<slug>/` for each written-up talk |
| `404.html` | Not found. GitHub Pages serves it for any unresolvable path. |

The home page carries the bio and the career history together, because the bio makes a claim and the
history is its evidence. Splitting them separates the two halves of one argument.

There is **no Skills section**, deliberately, at Sofiene's instruction: the work shows the skills.

Written for a general professional reader (D-04), neither an academic nor a recruiter specifically.
The register stays plain and nothing assumes domain knowledge.

**Talks are written articles, not slides** (D-19). A talk write-up makes the talk's argument in prose
and pulls in only figures that carry real information. Never publish a deck as images.

---

## 2. Design tokens

These are the design. They belong in `@theme` in `src/styles/global.css` (D-21) and must match this
table exactly. Never write a raw hex value in markup; use the named Tailwind utilities the theme
generates.

**Naming.** Tailwind only generates colour utilities from names in its `--color-*` namespace, so each
token below is registered in `@theme` with that prefix: `--border` here is `--color-border` in the
code, and the utility is `border-border`. The prefix is a Tailwind requirement, not a design
decision. The metrics further down carry no prefix, because they are one-off structural values
rather than scales needing a utility each.

### Light (default)

| Token | Value | Used for |
|---|---|---|
| `--theme` | `#fdfdfb` | Page background. Warm off-white, not pure white. |
| `--entry` | `#ffffff` | Raised surfaces, if any are ever introduced. |
| `--primary` | `#1b1d1f` | Headings, entry titles, body emphasis. |
| `--secondary` | `#5c636a` | Meta lines, affiliation, footer, tag pill text. |
| `--tertiary` | `#eaeae5` | Button and tag backgrounds. |
| `--content` | `#25282a` | Long-form prose paragraphs. |
| `--border` | `#eaeae4` | All hairlines and separators. |
| `--accent` | `#00706b` | Links on hover, active nav, draft badge, current role. |
| `--tint` | `rgb(0 112 107 / .09)` | Draft badge background only. |

### Dark (system preference)

| Token | Value |
|---|---|
| `--theme` | `#15171a` |
| `--entry` | `#1d2023` |
| `--primary` | `#e6e8ea` |
| `--secondary` | `#959ba1` |
| `--tertiary` | `#282c30` |
| `--content` | `#c5c9cc` |
| `--border` | `#252a2e` |
| `--accent` | `#4fd6ca` |
| `--tint` | `rgb(79 214 202 / .11)` |

Dark is delivered three ways, in this order (D-45):

1. `@media (prefers-color-scheme: dark)` scoped to `:root:not([data-theme="light"])`, so the system
   preference applies unless the visitor has chosen light.
2. `:root[data-theme="dark"]`, so an explicit choice of dark wins on a light system.
3. Light needs no third block: the light values already sit on `:root` in `@theme`, and the
   `:not([data-theme="light"])` guard in the first rule is what lets a light choice win back.

The two dark blocks repeat the same declarations because CSS cannot reuse a block. Change one,
change the other.

**On a filled accent surface, text is `#ffffff` in light and `#062421` in dark.** Never white on the
dark-mode accent; it fails contrast.

### Metrics

| Token | Value |
|---|---|
| `--gap` | `24px` |
| `--content-gap` | `20px` |
| `--nav-width` | `1024px` |
| `--main-width` | `720px` |
| `--header-height` | `60px` |
| `--radius` | `8px` |

The nav is wider than the content column. That mismatch is deliberate and inherited from PaperMod:
the header spans 1024px while the reading column stays at 720px.

---

## 3. Typography

**Manrope carries every role** (D-32, superseding D-16). There is no second family in the interface,
and the one exception for rendered code is stated below. Hierarchy comes from weight, size and
letter-spacing.

```
--font: "Manrope", system-ui, -apple-system, sans-serif;
```

Delivered from the Google Fonts CDN (D-28, which ruled the delivery method and now applies to
Manrope), via a `<link>` plus two preconnects in the `<head>` of `Base.astro`. Never move this into a
CSS `@import`: an import makes the browser fetch the CSS, parse it, and only then request the font.
Self-hosting was considered and ruled against. Because the font is third-party, the system fallback
stack is load-bearing rather than decorative.

Weights used: 400, 500, 600, 700, 800. Do not add others without checking the CDN request.

**One exception to "no second family".** Rendered markdown `code` and `pre` use the system monospace
stack (`ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace`) at `0.86em`. Code in a
proportional face is not readable, and the system stack costs no extra font request. This applies to
markdown bodies only; no UI element uses a monospace.

| Element | Size | Weight | Tracking | Line height |
|---|---|---|---|---|
| `body` | `17.5px` | 400 | normal | `1.65` |
| Profile `h1` | `42px` | 800 | `-.04em` | `1.14` |
| Page `h1` (inner pages) | `30px` | 800 | `-.035em` | `1.2` |
| Page `h1` (publications) | `26px` | 700 | `-.03em` | `1.2` |
| Profile subtitle | `18px` | 500 | normal | inherit |
| Profile affiliation | `16px` | 400 | normal | inherit |
| Section `h2` | `20px` | 700 | `-.025em` | inherit |
| Entry title `h2` | `23px` | 700 | `-.03em` | `1.32` |
| Entry meta | `14px` | 500 | normal | inherit |
| Entry summary | `16px` | 400 | normal | `1.62` |
| Prose `p` | `16.5px` | 400 | normal | inherit |
| Nav logo | `22px` | 700 | `-.03em` | inherit |
| Nav link | `15.5px` | 500 | normal | inherit |
| Tag pill | `12.5px` | 500 | normal | inherit |
| Draft badge | `12.5px` | 600 | `0` | inherit |
| CV period | `13.5px` | 500 | normal | inherit |
| CV role | `16px` | 600 | `-.015em` | inherit |
| CV organisation | `14px` | 400 | `0` | inherit |
| Column heading | `11px` | 800 | `.12em` | inherit |
| Publication rail date | `14px` | 600 | normal | `1.45` |
| Publication rail venue | `13px` | 500 | normal | inherit |
| Publication title `h2` | `19px` | 700 | `-.02em` | `1.4` |
| Publication authors | `14.5px` | 400 | normal | `1.5` |
| Publication DOI | `12.5px` | 500 | `.01em` | inherit |
| Footer | `12.5px` | 500 | normal | `24px` |

Sizes are in pixels because they are inherited from PaperMod, which is built that way. Keep them in
pixels rather than converting to `rem`, so this table stays checkable against the code.

---

## 4. Component anatomy

### Header

Full width, background `--theme`. Inner `.nav` is `max-width: calc(var(--nav-width) + var(--gap)*2)`,
centred, `padding: 10px var(--gap)`, `line-height: var(--header-height)`, flex with
`justify-content: space-between` and `flex-wrap: wrap`.

- **Left:** avatar at `34px` circle, `object-fit: cover`, then the name. Gap `9px`.
- **Right:** the menu, a flat `<ul>`, items separated by `margin-inline-start: var(--gap)`. It reads
  **Talks, Publications, Contact** (D-35, amended by D-39). There is no About item: the bio lives on
  the home page and the site name on the left already goes there.
- Menu links sit at `--secondary` and go to `--primary` on hover.
- Each link's label is wrapped in a `<span>` carrying `border-bottom: 2px solid transparent`, which
  becomes `--accent` on hover. The current page's item keeps that border permanently.
- **The theme toggle** is the last item in the menu (D-45). It is an icon, not a word (D-46): a
  `19px` outline moon or sun at `stroke-width: 1.8`, drawn in `currentColor`, sitting at
  `--secondary` and going to `--accent` on hover. It carries no underline, since there is no label
  to underline. Its list item is `display: flex; align-items: center`, because the icon is 19px
  tall inside a 60px line box and would otherwise sit high.
- Whichever glyph is showing names the theme the button switches TO: **moon offers dark, sun offers
  light**. Both glyphs and both spoken words carry `.to-dark` / `.to-light` and are shown or hidden
  by the same three-way rule as the palette, so the screen and a screen reader cannot disagree.
- The glyphs are `aria-hidden`; the button's name comes from `sr-only` words beside them and reads
  "Switch to dark theme" or "Switch to light theme".
- The whole control is `display: none` until the head script sets `data-has-js` on `<html>`, so
  nobody without JavaScript meets a control that cannot work.

### Profile block (home only)

Flex column, centred, `min-height: 74vh`, `justify-content: center`, `padding-bottom: 40px`.

Order: avatar `150px` circle with `margin-bottom: var(--gap)`, then `h1`, then the subtitle, then the
affiliation at `margin-top: 10px` linked to the group, then the button row at
`margin-top: calc(var(--gap)*1.2)`.

The affiliation sits here rather than `profile.summary`. The summary was authored as a machine
summary for `llms.txt`: it opens by restating the tagline directly above it and is written in the
third person while the bio below is in the first. It still serves `llms.txt`, which is what it is
for.

The subtitle contains exactly one emphasised span, set in `--accent` at weight 600.

`74vh` rather than a full viewport is deliberate: it leaves the first section heading visible at the
fold, so a visitor sees that there is content below.

### Buttons

`background: var(--tertiary)`, `border-radius: 999px`, `padding: 7px 16px`, gap `12px` between them.
On hover the background becomes `--accent` with the on-accent text colour from section 2. On
`:active`, `transform: scale(.96)`. Full pill radius is the rule for buttons and tags; `--radius`
(8px) is for larger surfaces. Do not mix the two on the same element class.

### Section heading

`h2.section`, `margin: calc(var(--gap)*2) 0 var(--gap)`. No rule, no eyebrow, no section number.

### Post entry

The signature element of the list. A block-level `<a>` wrapping the whole entry, so the entire row is
one click target and one tab stop.

```
margin-bottom:  calc(var(--gap)*1.5)
padding-bottom: calc(var(--gap)*1.15)
border-bottom:  1px solid var(--border)   /* removed on :last-of-type */
```

Inside, in order:

1. `h2` title. Turns `--accent` when the entry is hovered.
2. `.entry-meta`, a single line of facts separated by a middle dot with non-breaking spaces either
   side: `May 2026 · Preprint · arXiv`.
3. `.entry-content`, the summary or the author list.
4. `.entry-tags`, optional, `margin-top: 13px`, gap `7px`.

**Entries are plain rows, never cards.** No background, no shadow, no border box. Card entries were
built as R1 and not chosen, and offered again as the losing option 4 of D-47.

**This shape is the talks list and the 404 list only.** Publications left it at D-47 and are
specified separately below.

**No reading-time meta.** PaperMod shows `Date · N min · Author`. The slot is deliberately empty
because a minute count must be computed from real content, never invented. If reading time is ever
wanted, it is computed at build time from the rendered body.

### Publication row (D-47)

The publications list is a two column record rather than a feed, which is the shape the experience
list already uses, so the site has one way of presenting a chronology. Hierarchy is carried by weight
and colour, not by size: the version this replaced set the meta line, the authors and the tags in the
same grey at nearly the same weight, so nothing anchored the eye.

The whole row is still one block-level `<a>`, one click target and one tab stop, which is why the DOI
is text rather than its own link.

**Where the row points (D-48).** An arXiv paper links straight to `arxiv.org/pdf/<identifier>`,
skipping the abstract page. The identifier is read out of the DOI, since arXiv mints them to the
fixed pattern `10.48550/arXiv.<identifier>`, so nothing is hardcoded per paper. No version is
pinned: `/pdf/<id>` serves the newest, and pinning `v1` would freeze the link on a superseded draft
the moment the paper is revised. Anything that is not an arXiv DOI keeps going through
`doi.org`, which is the only link that can be predicted for a journal paper.

```
grid-template-columns: 150px minmax(0, 1fr)
gap:            var(--gap)
padding-block:  20px
border-bottom:  1px solid var(--border)
margin-inline:  -12px        /* the table bleeds past the reading column ... */
padding-inline:  12px        /* ... and pulls back, so text stays aligned    */
```

The bleed is on the shared `.row` class, which the column headings also carry, so the heavy rule
under the headings and the hairlines under the rows share one set of edges. Its purpose is the hover
band: without it the highlight would start exactly at the first letter.

Above the rows sit column headings reading **Date** and **Work**, `border-bottom: 2px solid
var(--primary)`, `padding-bottom: 8px`. They are what makes the two columns read as a record rather
than as an accident of alignment.

Left rail, in order: the month and year, then the venue. `Preprint` precedes the venue in
`--accent` at weight 700 and is the only coloured word in the rail, because it is the first thing an
academic reader checks.

Right column, in order: the title `h2`, the author list, the bare DOI.

**The author's own name is the only one in `--primary` at weight 600**; the rest of the list is
`--secondary` at 400. It is matched against `profile.name` rather than written out, so the two cannot
drift apart.

**Hover** puts `--color-tertiary` behind the whole row and turns the title `--accent`, over `0.15s`.
This is the one row-background hover on the site and it belongs to this component only; it is what
makes the list read as a table.

**No tags here.** The frontmatter still carries them and the schema still validates them, but they
are not rendered: five labels per entry, mostly repeated between entries, added bulk without adding
information. Rendering them again is a decision, not an implementation detail.

### Not-found page (D-49)

Deliberately the sparest page on the site: an image, a line, one link out. Nothing else. The earlier
version listed all three routes; a single obvious way out is easier to act on, and the header already
carries the full navigation.

Centred in a `min-height: 62vh` flex column. In order: a `200px` circular image with
`object-fit: cover`, `margin-bottom: 28px`; the page `h1`; one line of `--secondary` body text capped
at `42ch`; then the site's pill button reading **Back to the home page** at `margin-top: 28px`.

The image is `/images/404-molecule.webp`, generated with the OpenArt connector. Its `alt` is
deliberately empty: it says nothing the heading does not, so a screen reader should skip it rather
than stop to describe decoration. The circular mask is the same treatment as the profile photograph,
which is what ties the two pages together.

### Tag pill

`font-size: 12.5px`, weight 500, `color: var(--secondary)`, `background: var(--tertiary)`,
`border-radius: 999px`, `padding: 3px 10px`.

### Draft badge

`font-size: 12.5px`, weight 600, `color: var(--accent)`, `background: var(--tint)`,
`border-radius: 999px`, `padding: 2px 9px`, `margin-inline-start: 9px`, `vertical-align: 3px`,
`letter-spacing: 0`. Sits inline inside the entry title.

### Experience and education list

A `<ul>` with `list-style: none`. Each `<li>` is
`grid-template-columns: 180px minmax(0, 1fr)` with `gap: var(--gap)`, `padding: 11px 0`, and a
`--border` bottom rule that is removed on the last item.

- Left column: the period, `13.5px`, weight 500, `--secondary`.
- Right column: the role at `16px` weight 600, then the organisation in a `<small>` set to `display: block`,
  `14px`, weight 400, `--secondary`, `margin-top: 2px`.
- The current role carries `.now`, which sets its period to `--accent`.
- Below `640px` the grid collapses to one column with `gap: 2px`.

**Each entry is a native `<details>`.** That is not incidental: D-07 requires the detail to open with
JavaScript off, and `<details>` is the only element giving that for free. The row above is the
`<summary>`, plus a `+` marker at the end that rotates 45 degrees and turns `--accent` when open. The
detail is indented by `calc(180px + var(--gap))` so it aligns under the role column, and that indent
is removed below `640px`.

**No document links.** D-37 removed them, superseding D-22. Do not render `entry.documents` without a
new decision from Sofiene.

### Footer

Same `max-width` as the main column, `margin-top: calc(var(--gap)*2)`,
`padding: 20px var(--gap) 40px`, centred text, `border-top: 1px solid var(--border)`.

---

## 5. Layout

`main` is `max-width: calc(var(--main-width) + var(--gap)*2)`, centred, with
`padding: calc(var(--gap)*1.5) var(--gap)`.

`html` carries `scroll-behavior: smooth` and **`scrollbar-gutter: stable`**.

There is **no `scroll-padding-top`** (D-41). It was carried over from the mockups, where it stopped
anchors landing beneath a fixed header. This header is not fixed, so the reserve served nothing
except pushing the skip link's target 80px too low.

The gutter is not cosmetic. Without it a scrolling page is 15px narrower than a short one, and
because the header is centred its contents shift by half that: the name and avatar visibly jumped
between the home page, which scrolls, and Talks, which does not. Reserving the gutter everywhere
costs a thin empty strip on short pages and removes the jump. Do not remove it.

Confirmed as D-40, over `overflow-y: scroll` and over making the header full-bleed. It is Baseline
only since December 2024, so a browser older than that still shows the jump; that was accepted
knowingly rather than overlooked.

Breakpoints in use: `640px` (CV list collapses) and `560px` where a row needs to stack. Do not
introduce a new breakpoint without checking whether an existing one serves.

---

## 6. Motion

Restrained by design. Permitted: colour transitions on hover and focus, the `scale(.96)` press on
buttons, and Astro view transitions between pages.

Forbidden: anything that reveals hidden content, scroll-driven reveals, parallax, marquees, and any
animation that does not collapse under `prefers-reduced-motion`.

Every stylesheet ends with the blanket override:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 7. Invariants

These hold regardless of what any future edit is trying to achieve.

- **Every word is readable with JavaScript disabled** (D-07). Never hide content behind a class a
  script adds later. This is why disclosure uses native `<details>`. The theme toggle is the one
  thing a script adds, and it is allowed because it is a control rather than content: with no
  script it is hidden outright and the site still follows the system preference.
- **Everything interactive works from the keyboard**, with a visible focus ring:
  `outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 3px` on `:focus-visible`.
- **No em-dashes or en-dashes anywhere**, in code, content, commits or UI copy. Use a hyphen, a
  comma, or two sentences. No exceptions. The separator in meta lines is a middle dot, not a dash.
- **Contrast:** every text-on-background pair meets WCAG AA (4.5:1), measured rather than assumed.
  The pairs that exist, light then dark: body 16.60 / 14.62, prose 14.57 / 10.78, meta 5.98 / 6.40,
  accent on ground 5.84 / 10.09, tag pill text 5.05 / 5.01, label on accent 5.95 / 9.21, draft badge
  5.12 / 8.17, and accent on `--tertiary` 4.93 / 8.86, which is the hovered publication row. Recompute before changing any colour: `--secondary` at its previous `#697077`
  measured 4.16 on a tag pill and failed.
- **One accent, used consistently.** No second accent colour anywhere on the site.

---

## 8. Content sources

- **Bio:** `src/data/profile.ts`, the single source (D-12). The home page, `llms.txt` and the profile
  `README.md` all derive from it. Stored as plain text with no markup, because it serves all three.
- **Experience:** `src/data/experience.ts`. Dates are the ones D-11 confirmed correct: the PhD begins
  January 2025, the MSc ran to December 2024. There is no freelance developer entry (D-10).
  **The git-log metaphor and its invented commit hashes are retired** (D-30, confirming D-06 and
  D-14). This is a plain chronological list now. Do not reintroduce the hashes.
- **Publications and talks:** content collections (D-25), one markdown file each. Adding either means
  creating a file, never editing TypeScript.
- **Degree documents are not linked from anywhere** (D-37, superseding D-22). Sofiene is undecided
  about publishing his diplomas and a full transcript. The `documents` data stays in
  `experience.ts` so the links can be restored in one block of markup, but nothing renders it.
  **Unlinking is not unpublishing:** the six PDFs still sit in `public/assets/documents/` and are
  copied into `docs/`, so they remain fetchable at their original URLs, which were live on the
  previous site. Whether to stop serving them is a separate open question, listed in section 11.
- **The favicon** is an SK monogram, white on teal (D-27), drawn as SVG text with a system font stack
  because a favicon cannot wait for a webfont. Note it predates the Manrope ruling and still carries
  the old teal.

### Copy

The bio is his. The one-sentence `summary` in `profile.ts` and the page subtitles were drafted by
Claude and approved as they stand (D-26). Treat them as his words: change them only on his say-so.

**One gap is deliberate.** The publications page has no closing line pointing at a full record. An
earlier draft claimed GitHub held one, which is false, so it was removed. When he supplies an ORCID,
Google Scholar or institutional link, that is what goes there.

---

## 9. Code standards here (D-20)

Sofiene's global standards apply, with one boundary drawn by file region:

- **Full rules inside TypeScript:** frontmatter scripts, `.ts` files and config get a comment on the
  line before every line of code, saying what it does and why, plus TSDoc on every exported symbol.
- **Template markup and Tailwind class lists are exempt**, and carry a comment per block instead.
- The roughly 100-line budget, 200 maximum, counts code lines only. Comment-only lines are free.

## 10. Build and deployment (D-02, D-24)

Built locally, output committed to `docs/`. Pages serves that folder from the default branch; there
is no CI. URLs are directory-style, so `/publications/` rather than `/publications.html` (D-24), and
there is no redirect facility on this host, so a published URL is effectively permanent.

**Pushing is publishing.** See `CLAUDE.md`.

---

## 11. Open, not yet settled

Do not resolve these by writing code. They need a ruling.

- **Nav labels.** The R4 mockup's nav read `Posts | Publications | About | Contact`, but D-33 keeps
  the three-page set, where the posts section is Talks and About lives on the home page. The labels
  therefore need deciding.
- **The favicon** is still the old teal SK monogram (D-27), chosen before Manrope and before the
  `--accent` value changed. Whether it is restyled is open.
- **Reading-time meta**, per section 4: currently absent by choice.
- **Whether the degree PDFs stop being served at all.** D-37 removed the links, which ends
  discoverability but not access: the files are still built into `docs/` and reachable by anyone
  with the URL. Making them genuinely private means moving them out of `public/`, and separately
  reckoning with the fact that they were already published on the live site. He asked to think
  about this separately, so nothing has been moved.
- **The profile blurb.** The block currently renders `profile.summary`, which was authored as a
  machine summary for `llms.txt`. On the page it reads awkwardly: it is in the third person while the
  bio directly below is in the first, and it opens by repeating the tagline shown immediately above
  it. It needs either a separate human-facing blurb in `profile.ts` or permission to edit the
  summary. Both are his copy under D-26, so neither was done.
*(The four clauses added during the build, the page `h1` scale entry, the token naming prefix, the
`<details>` treatment of the experience list and the monospace exception for code, are settled under
D-42: implementation detail of an agreed design is Claude's to decide. They are no longer open.)*
