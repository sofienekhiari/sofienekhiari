# The two animated scenes, vendored from the deck

Both scenes on this talk page are drawn by the presentation's own compositor rather than by anything
written for this website. The engine, the scene descriptions and the sprite art all came from
`Summer School 2026/Talk/deck`, so what a reader sees here is the same picture the room saw, painted
by the same code.

## What is here

| Path | Where it came from |
|---|---|
| `js/motion.js`, `js/layers.js`, `js/cycler.js`, `js/compose.js` | the deck root, copied verbatim |
| `js/assets.js`, `js/rooms.js`, `js/beat.js`, `js/stage.js`, `js/s1.js`, `js/s2.js` | the deck's `act1/` folder, copied verbatim |
| `js/play.js` | written for this site, the only new file |
| `art/props`, `art/tiles`, `art/sheets` | the deck's `art/topdown/`, see below |

## The one edit

`js/assets.js` line 18 is the single line that differs from the deck. It read `'./art/topdown/'`,
which resolved correctly only because the deck's page sat beside that folder. The article lives at
`/talks/already-living-in-an-agentic-world/`, so the path is now taken from `window.SCENE_ART_ROOT`,
which the page sets before any of these scripts run. The old relative value survives as the fallback.

Everything else is byte for byte the deck's. Keep it that way: a fix belongs in the deck first and is
then copied across, so the two can never quietly disagree about what a beat looks like.

## The art

Props and tiles are authored at exactly the size they are drawn at, so they were copied unchanged.
The six character sheets were authored about 7.3 times larger than they are drawn and were resampled
down to their exact on-screen size with nearest-neighbour, which is precisely what the browser was
doing to them anyway under `image-rendering: pixelated`. Everything was then reduced to a 64 colour
palette, which is visually indistinguishable and takes the whole set from 512 KB to 136 KB.

Only what scenes 1 and 2 actually use is here. The catalogue in `assets.js` still lists all 138
props and all 11 sheets, because it is the deck's file; the ones no beat asks for are simply never
requested.
