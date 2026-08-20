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

- **Keep chat output as short as possible** (D-44). He wants as little as possible to read before he
  can react. One or two lines is usually right. No summaries of what he just watched happen, no
  restating the request, no lists of everything verified. Say what changed and what needs him.
- **Work in small, frequent iterations** (D-44). Do one thing, commit, report briefly, stop. Do not
  batch several changes into one turn.
- This governs chat only. Commit messages, the decision record and the design spec stay as detailed
  as they need to be: they are read on demand, not every turn.

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
- **Commit as work reaches a coherent state** (D-38), staging named files rather than
  everything. A small, finished piece of work is itself a standing request to commit; you need
  not wait to be asked. This does not soften the rule above: committing is not publishing, and
  pushing still requires explicit authorization every single time.

## Decisions

`decisions/` holds the record of every choice that settled how this site works, and it is
authoritative. Forty-three decisions (D-01 to D-43) govern the current design. D-01 to D-28 are in
the served-round files (`round-N.def.json` plus `round-N.answers.json`); D-29 onward are inline
rulings in `inline-decisions.json`. The two formats coexist and both are committed (D-43): the round
files are frozen history, and everything since D-29 goes in the inline file.

**D-42 tunes the boundary for this repository's front-end work.** Technical implementation detail is
Claude's to decide: CSS technique, browser-support tradeoffs, accessibility implementation, orphan
and dead-code cleanup, file structure, build tooling, and spec clauses that only describe how an
already-agreed design is realised. He specifies the effects he wants, in his words: "These are all
details I don't care about. I will focus mostly on the effects I want to see; for the details of
that, implement what you think would work best."

Still his, and surfaced before it is written into code: all copy (D-26), the visual design direction
and register, what content exists and what is published, privacy and what is exposed (D-37),
anything he could be asked to justify to a person, and anything that changes an effect he would
notice and did not ask for. Follow the `decision-ownership` skill for those.

Decisions are made inline in chat, not in served rounds; D-203 retired those.

To read the record: `decisions/round-N.answers.json` carries the question, the choice and his
reason; `round-N.def.json` is the full round.

## Structure

```
src/data/         profile.ts (the single bio source), experience.ts (the timeline)
src/content/      talks/ and publications/ collections, schemas in src/content.config.ts
src/layouts/      Base.astro, the shell every page uses
src/components/   shared pieces used by the pages
src/pages/        index, publications, talks/, and llms.txt.ts
scripts/          write-profile-readme.ts, run after every build
public/           copied verbatim into docs/: CNAME, images, favicon, assets/documents
decisions/        the decision record, not part of the site
```

**The design is specified in `.claude/rules/website-design.md`**, which loads automatically whenever
`src/**`, `astro.config.mjs` or `public/**` is opened. It carries the exact tokens, type scale,
spacing and component anatomy. Check a value there before changing it; if the code and that file
disagree, the code is wrong unless a decision says otherwise.
