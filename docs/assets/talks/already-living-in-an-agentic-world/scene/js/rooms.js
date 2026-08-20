/* ──────────────────────────────────────────────────────────────────────────
   The four rooms of Act 1.

   Nine scenes, four rooms: a BARE room (scenes 1, 2), a WORKSHOP (3, 4), a DESK
   room (5, 6) and the CONNECTOR BUILDING (7, 8, 9). Reusing them is continuity
   rather than economy, as the brief puts it: the act reads as one place.

   A room is nothing more than horizontal bands of one repeating tile. That is
   the whole of it, and it is why a new room costs an arrangement rather than a
   generation. Each band becomes ONE element with the tile repeating inside it,
   so a sixteen-by-nine floor is three elements rather than a hundred and
   forty-four.

   ONE CONVENTION ACROSS THE WHOLE ACT: row 0 is the back wall, row 1 is the
   join where the wall meets the floor, and rows 2 to 8 are floor. The
   connector building is the same shape with a taller wall, because its eight
   remote rooms stand four tiles high on it. The individual floor plans in the
   brief vary in how they draw this, so one convention is used everywhere: a
   room that changed its wall height between scenes would read as a different
   room, which is exactly what reuse is meant to avoid.
   ────────────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  // The room is twelve tiles across and eight down, at eighty pixels each, so
  // the scene panel is 960 x 640. It is NOT the whole slide: the panel is
  // centred under a title strip and above a footer, because a scene reads as a
  // picture of a place when it is framed and as an empty hall when it bleeds to
  // every edge.
  const COLS = 12, ROWS = 8;

  // How big one tile is on screen, shared with the rest of the deck.
  const TILE = window.motion.TILE;

  // Where the wall stops and the floor starts, for an ordinary room and for the
  // building. A band is [tile suffix, first row, last row].
  // A band is [tile suffix, first row, last row], where -1 means "to the bottom",
  // so one layout serves a room of any height.
  // ONE ROW OF WALL, not two. A back wall with nothing on it is the emptiest
  // thing a room can have, and at two rows it was taking a third of a small
  // panel. The join tile is the wall meeting the floor, so a single row of it
  // says "there is a wall here" and spends eighty pixels rather than a hundred
  // and sixty.
  const ORDINARY = [['join', 0, 0], ['floor', 1, -1]];
  const BUILDING = [['wall', 0, 2], ['join', 3, 3], ['floor', 4, -1]];

  // Each room's name in the brief, the prefix its tiles are filed under, and how
  // its bands are laid out.
  const ROOMS = {
    bare: { tiles: 'bare', bands: ORDINARY },
    shop: { tiles: 'shop', bands: ORDINARY },
    desk: { tiles: 'desk', bands: ORDINARY },
    bldg: { tiles: 'bldg', bands: BUILDING },
  };

  /** Build the layers that draw one room.
   *
   * Args:
   *   name: Which room, one of bare, shop, desk or bldg.
 *   cols: Optional. How many tiles wide to draw it, when a scene needs a room
 *     bigger than the frame for the camera to pan across.
   *
   * Returns:
   *   A list of layer descriptions, ready to go at the bottom of a scene's
   *   layer list. They are pinned below everything else, so nothing standing in
   *   the room can ever be drawn behind its own floor.
   *
   * Example:
   *   build('bare')  // three layers: the wall, the join and the floor
   */
  function build(name, cols, rows) {
    const room = ROOMS[name];
    // A misspelled room should stop the deck here, while the name is still
    // known, rather than paint a scene onto nothing.
    if (!room) throw new Error(`act1: no room named "${name}"`);
    // A room is normally exactly as wide as the frame. One that needs more is
    // drawn wider and the camera pans across it, which the brief allows and the
    // connector building requires: its eight rooms fill the frame edge to edge,
    // leaving nowhere for the gap that draws the inform/act line.
    const across = cols || COLS;
    const down = rows || ROWS;
    return room.bands.map(([part, first, end]) => {
      // -1 means the band runs to the bottom of whatever room this is.
      const last = end < 0 ? down - 1 : end;
      const tile = window.act1.asset(`${room.tiles}-${part}`);
      // Eight rows of 80 px come to exactly 640, which is the panel's height, so
      // the floor fills it on its own and no band has to be stretched.
      return {
        id: `room-${part}`,
        // The band spans the full width and however many rows it covers.
        box: [0, first * TILE, across * TILE, (last - first + 1) * TILE],
        img: tile.img,
        // Repeating rather than stretched, at exactly one tile per TILE px. Each
        // tile was cut on its own measured repeat, so the joins are invisible.
        css: `background-repeat:repeat;background-size:${TILE}px ${TILE}px;background-position:0 0;`,
        // Underneath everything, always. Zero is reserved for the room itself.
        z: 0,
      };
    });
  }

  window.act1 = Object.assign(window.act1 || {}, { room: build, COLS, ROWS });
})();
