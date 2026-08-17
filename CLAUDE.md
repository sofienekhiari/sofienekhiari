# sofk.ch

Sofiene Khiari's personal website. Astro, built to `docs/`, served by GitHub Pages at sofk.ch.

**This repository is also the GitHub profile-README repo** (`sofienekhiari/sofienekhiari`), so
`README.md` is rendered on his public GitHub profile. It is generated, not written.

## Commands

```bash
npm run dev      # local dev server with hot reload
npm run build    # builds into docs/ and regenerates README.md
npm run preview  # serve the built output exactly as Pages will
```

## Hard rules

- **`docs/` is build output. Never edit it by hand.** Every build empties it. Anything that must
  survive lives in `public/`.
- **`README.md` and `docs/llms.txt` are generated.** Editing them directly loses the change on the
  next build. The bio is authored in exactly one place: `src/data/profile.ts`.
- **No em-dashes or en-dashes anywhere**, in code, content, commits or UI copy. Use a hyphen, a
  comma, or two sentences. This is a standing rule and it has no exceptions.
- **Every word must be readable with JavaScript disabled.** Never hide content behind a class that
  a script adds later. Animation may only change how something already visible arrives.
- **Everything interactive must work from the keyboard** with a visible focus ring, and all motion
  must collapse under `prefers-reduced-motion`.
- **Never push without explicit authorization, every single time.** In this repository pushing
  *is* publishing: `main` deploys straight to sofk.ch through GitHub Pages, and `README.md` is
  rendered on his public GitHub profile. There is no staging environment and no review step between
  a push and the live site. Authorization for one push never carries to the next.
- **Commit only when asked**, and stage named files rather than everything.

## Decisions

`decisions/` holds the served decision rounds that settled how this site works, and it is the
authoritative record. Twenty-five decisions (D-01 to D-25) govern the current build.

Any choice with a defensible why goes through a new round before it is written into code: a
framework or library, a data format, published URLs, what the site says about him, anything he
could be asked to justify. Follow the `decision-ownership` skill. Do not settle such a choice in
chat, and do not implement one and mention it afterwards.

To read the record: `decisions/round-N.answers.json` carries the question, the choice and his
reason; `round-N.def.json` is the full round.

## Structure

```
src/data/         profile.ts (the single bio source), experience.ts (the timeline)
src/content/      talks/ and publications/ collections, schemas in src/content.config.ts
src/layouts/      Base.astro, the shell every page uses
src/components/   Timeline.astro, the site's signature element
src/pages/        index, publications, talks/, and llms.txt.ts
scripts/          write-profile-readme.ts, run after every build
public/           copied verbatim into docs/: CNAME, images, favicon, assets/documents
decisions/        the decision record, not part of the site
```

Design and architecture detail loads from `.claude/rules/` when the relevant files are opened.
