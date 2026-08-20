/* ──────────────────────────────────────────────────────────────────────────
   Setting a scene up, and remembering it between beats.

   A scene file does two things in order: it says what is in the room, and then
   it says what happens, one beat at a time. This file is the first half, plus
   the memory that makes the second half short.

   TWO ANCHORING RULES, and everything else follows from them.

   A CHARACTER'S FEET sit at the centre of the tile they are standing on. So a
   character at (9,4) has their feet at y 288 and their sprite runs from y 224
   to y 288, which is exactly what the brief's floor plans work out by hand.

   A PROP'S CENTRE sits at the centre of the tile it is on, and a wide prop may
   name a fractional tile. So the counter across tiles 8 to 10 of row 5 is at
   column 9, and its 192 px width lands on x 512 to 704, again exactly what the
   plan says.

   Those two rules together reproduce the brief's stated depth for free: the
   counter's bottom edge is lower than Clank's feet and higher than the human's,
   so the machine stands behind it and the man stands at it, with nothing
   anywhere having to declare a stacking order.
   ────────────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  // A tile is 80 px on screen, and a character is one tile tall. That makes the
  // room exactly 16 x 9 tiles, because 1280 and 720 are both whole multiples of
  // 80 and of nothing larger. It is also the size that puts a character at a
  // sixteenth of the frame's width, which is the proportion the reference
  // screenshots hold; at 64 he was a thirtieth, and the room read as empty.
  const TILE = 80;

  // Which sheets a character can walk on. A beat that moves someone puts them on
  // one of these for the journey, whatever pose they finish in, so nobody ever
  // slides across the room with their legs still.
  const TRAVELLING = ['walk', 'carry'];

  /** How high a speech bubble is drawn, given everything a finished scene holds.
   *
   * A bubble is the one thing on screen that is not part of the world, so it is
   * always in front of all of it. Everything else is sorted by where it touches
   * the floor: a layer's level is that floor line in pixels, multiplied by the
   * number of tie-break places the engine keeps per pixel. So the answer is the
   * deepest floor line ANY layer reaches in ANY beat, plus one clear place.
   *
   * DERIVED, NEVER GUESSED, and that is the whole point of this function.
   *
   * It was a flat 9000 before, which is the level of something standing about
   * 140 px down the screen. That was above everything while every room was
   * small, and silently WRONG the moment the connector building grew: from then
   * on every terminal and tray in scenes 8 and 9 outdrew every bubble, and two
   * characters delivered the only line of their scene from behind a cupboard.
   *
   * Nor is the room's own height the answer, which is the first thing tried
   * here and the reason this takes the layers rather than a number: scene 3
   * parks a spare carboy 120 px BELOW the floor, off stage, waiting to be
   * carried in, and that parked prop sits deeper than the room it belongs to.
   * A number measured in one arrangement is not a rule. This is.
   *
   * Args:
   *   layers: Every layer the scene declared.
   *   beats: Every beat, so a layer that MOVES deeper is counted where it ends
   *     up rather than where it was declared.
   *
   * Returns:
   *   A stacking level above every layer the scene can ever produce.
   *
   * Example:
   *   sayZ(layers, beats)  // 33408 in scene 3, against its deepest prop's 33344
   */
  const sayZ = (layers, beats) => {
    // How far down the screen each layer is ever pushed by a beat. A beat only
    // ever records an offset from where a layer was declared, so the deepest a
    // layer goes is its declared line plus the largest of those offsets.
    const drop = {};
    for (const beat of beats) {
      for (const [id, change] of Object.entries(beat.set || {})) {
        if (change.y != null) drop[id] = Math.max(drop[id] || 0, change.y);
      }
    }
    // The highest level anything else in the scene reaches, in two kinds.
    let highest = 0;
    for (const layer of layers) {
      // A bubble does not have to clear another bubble.
      if (layer.id.endsWith('-say')) continue;
      // A PINNED layer named its own level outright, so that number is the
      // thing to beat. Several scenes pin a marker or a token deliberately in
      // front of the world, and a bubble has to clear those too: the marker ring
      // in scene 6 sits above everything the depth sort can produce, and a
      // bubble derived from the depth sort alone went straight behind it.
      if (layer.z != null) { highest = Math.max(highest, layer.z); continue; }
      // Anything lying flat on the floor is below the world by construction.
      if (layer.flat) continue;
      // Otherwise it sorts by where it meets the world: its own anchor line if
      // it named one, and the bottom of its box if it did not.
      const anchor = layer.anchor != null ? layer.anchor : layer.box[3];
      const line = Math.round(layer.box[1] + anchor + (drop[layer.id] || 0));
      // The very last tie-break place that line has to give.
      highest = Math.max(highest, line * window.motion.ORDERS + window.motion.ORDERS - 1);
    }
    // One clear level above the highest of them.
    return highest + 1;
  };

  class Scene {
    /** Start a scene in one of the act's four rooms.
     *
     * Args:
     *   id: The name the deck refers to this scene by, for example 's1'.
     *   room: Which room it plays in: bare, shop, desk or bldg.
     */
    constructor(id, room, size = {}) {
      this.id = id;
      // How big this scene's room is, in tiles. Each scene picks the SMALLEST
      // room that holds what its story needs, because a room with room to spare
      // reads as empty however carefully it is dressed, and dressing it with
      // objects the story does not use is worse than the emptiness.
      this.cols = size.cols || window.act1.COLS;
      this.rows = size.rows || window.act1.ROWS;
      // THE PANEL IS THE SAME SIZE IN EVERY SCENE OF THE ACT, whatever size the
      // room behind it is. A scene with a bigger room is panned across, which
      // with zoom ruled out is the only way to show more than fits. A viewport
      // that changed size between scenes would read as the picture itself
      // resizing, which is worse than either room being the wrong size.
      this.view = { cols: 9, rows: 5 };
      // The room's floor, wall and join go in first, so everything else is
      // added on top of them in the order it is declared.
      this.layers = window.act1.room(room, this.cols, this.rows);
      this.beats = [];
      // Everything the scene remembers between beats.
      this.actors = {};
      this.props = {};
      // Each layer's home box, so a tile can be turned into an offset from it,
      // and the tile it was declared on, which is what the offset is measured
      // from.
      this.boxes = {};
      this.homeTile = {};
      // The sheet each character was last put on, so an unchanged pose is never
      // re-emitted and two beats that should be identical stay identical.
      this.sheet = {};
    }

    /** The centre of a column, in stage pixels. */
    tileX(col) { return col * TILE + TILE / 2; }

    /** The centre of a row, in stage pixels. */
    tileY(row) { return row * TILE + TILE / 2; }

    /** Where a layer's box was declared, failing loudly on a name that is not.
     *
     * Args:
     *   id: The layer wanted.
     *
     * Returns:
     *   Its [left, top, width, height] as declared.
     */
    boxOf(id) {
      if (!this.boxes[id]) throw new Error(`${this.id}: no layer "${id}"`);
      return this.boxes[id];
    }

    /** A character, by name, failing loudly on a typo. */
    actorOf(id) {
      if (!this.actors[id]) throw new Error(`${this.id}: no character "${id}"`);
      return this.actors[id];
    }

    /** A prop, by name, failing loudly on a typo. */
    propOf(id) {
      if (!this.props[id]) throw new Error(`${this.id}: no prop "${id}"`);
      return this.props[id];
    }

    /** How far a layer must move from where it started to reach a tile.
     *
     * Beats move layers by offsets from wherever they were declared, so this is
     * the one conversion between the brief's tiles and the engine's pixels. It
     * is the same arithmetic whether the layer is anchored by its feet or by its
     * centre, because both anchors move with the tile.
     *
     * Args:
     *   id: Which layer.
     *   col: The column wanted.
     *   row: The row wanted.
     *
     * Returns:
     *   An [x, y] offset in pixels.
     */
    offset(id, col, row) {
      const home = this.homeTile[id];
      return [(col - home[0]) * TILE, (row - home[1]) * TILE];
    }

    /** Add a character, with their shadow and their speech bubble.
     *
     * Three layers go in per character and a scene never mentions two of them.
     * The shadow follows them everywhere, which is what makes them read as
     * standing on the floor rather than floating above it; the bubble waits
     * invisible until a beat gives them something to say.
     *
     * Args:
     *   id: The name beats will use.
     *   kind: 'clank' or 'human', which decides which sheets they own.
     *   col: The column they start on.
     *   row: The row they start on.
     *   face: Which way they start facing.
     *   opts: Optional. `pose` starts them on a sheet other than walk, and
     *     `hidden` keeps them out of the room until a beat shows them.
     */
    actor(id, kind, col, row, face, opts = {}) {
      const pose = opts.pose || 'walk';
      const cell = window.act1.asset(`${kind}-${pose}`);
      this.actors[id] = { kind, pose, col, row, face, holding: [] };
      // The shadow is added first so it is underneath, and pinned flat so
      // anyone walking over it is drawn in front of it.
      this.add(id + '-shadow', window.act1.asset('shadow'), col, row, 'prop',
               { flat: true, lift: 0 });
      // Then the character themself, anchored by the feet.
      this.add(id, cell, col, row, 'actor',
               { walks: true,
                 start: { row: face, ...(opts.hidden ? { o: 0 } : {}) } });
      // Then the bubble, invisible until a beat gives them something to say.
      // It starts up and to the right of their head, which is where say() puts
      // it when a beat does not name a position.
      // It is pinned rather than depth-sorted, but at what level cannot be known
      // yet: props declared after this one may sit deeper than anything so far.
      // done() levels every bubble in the scene once, when they all are.
      this.add(id + '-say', window.act1.asset('bubble'), col, row, 'prop',
               { z: 0, cycle: 400, lift: 74, jump: true, start: { o: 0 } });
      this.sheet[id] = cell.img;
      return this;
    }

    /** Add a prop, anchored by its centre on the tile it names.
     *
     * Args:
     *   id: The name beats will use.
     *   name: Its catalogue name, which is usually the same thing.
     *   col: The column it sits on, fractional for a prop wider than a tile.
     *   row: The row it sits on.
     *   opts: Optional. `hidden` keeps it out until a beat shows it, `flat`
     *     lays it on the floor so characters walk over it, `z` pins it at an
     *     exact level, and `lift` raises it above the tile centre.
     */
    prop(id, name, col, row, opts = {}) {
      this.props[id] = { col, row, held: null };
      this.add(id, window.act1.asset(name), col, row, 'prop', opts);
      return this;
    }

    /** Add the same prop several times over, at several tiles.
     *
     * The act is full of these: six flasks, three identical answer cards, four
     * poster blocks, eight terminals. They are literally one PNG drawn many
     * times, which in more than one scene is the argument being made.
     *
     * Args:
     *   id: The stem of their names. They come out as id1, id2 and so on.
     *   name: The catalogue name of the picture they all share.
     *   tiles: A list of [column, row] pairs, one per copy.
     *   opts: Passed through to each copy.
     */
    many(id, name, tiles, opts = {}) {
      tiles.forEach(([col, row], i) => this.prop(`${id}${i + 1}`, name, col, row, opts));
      return this;
    }

    /** Add something drawn face-on, at an exact pixel box.
     *
     * A screen, a board or a hatch seen from directly overhead would show only
     * its back, so the genre draws them standing up out of the floor instead.
     * Their positions come from the brief as pixels, so they are placed as
     * pixels rather than being forced onto a tile.
     *
     * Args:
     *   id: The name beats will use.
     *   name: Its catalogue name.
     *   x: Where its left edge goes.
     *   y: Where its top edge goes.
     *   opts: Passed through, `hidden` and `z` being the useful ones.
     */
    faceOn(id, name, x, y, opts = {}) {
      const art = window.act1.asset(name);
      this.props[id] = { col: null, row: null, held: null };
      this.push(id, art, [x, y, art.w, art.h], opts);
      // Pixel-placed layers still need a home tile for offset() to work from, so
      // they get the one their top-left corner falls in.
      this.homeTile[id] = [x / TILE, y / TILE];
      return this;
    }

    /** Add one layer, working out its box from its anchor.
     *
     * Args:
     *   id: The layer's name.
     *   art: What the catalogue returned for it.
     *   col: The column it starts on.
     *   row: The row it starts on.
     *   anchor: 'actor' to stand it on its feet, 'prop' to centre it.
     *   opts: Anything else the layer needs.
     */
    add(id, art, col, row, anchor, opts) {
      const left = this.tileX(col) - art.w / 2;
      // A character stands ON the tile centre, so their box hangs above it. A
      // prop is CENTRED on it, so its box straddles it.
      const top = anchor === 'actor'
        ? this.tileY(row) - art.h
        : this.tileY(row) - art.h / 2 - (opts.lift || 0);
      // Either way the anchor line is the tile centre, which is what decides
      // depth: it is where this layer touches the world.
      this.push(id, art, [left, top, art.w, art.h],
                { ...opts, anchor: this.tileY(row) - top });
      this.homeTile[id] = [col, row];
    }

    /** Put a finished layer description on the pile. */
    push(id, art, box, opts) {
      // Two layers under one name is silent and confusing: the second wins
      // every lookup while the first stays on the page for ever, unreachable
      // and painted. It matters most where a scene declares part of its set
      // itself and shares the rest, which is exactly what the three connector
      // building scenes do.
      if (this.boxes[id]) throw new Error(`${this.id}: "${id}" declared twice`);
      this.boxes[id] = box;
      this.layers.push({
        id, box, img: art.img,
        // Where this layer meets the floor, measured down from the top of its
        // box. Left out, it defaults to the bottom of the box, which is right
        // for anything standing face-on out of the floor plane.
        ...(opts.anchor != null ? { anchor: opts.anchor } : {}),
        ...(art.sheet ? { sheet: art.sheet } : {}),
        ...(opts.flat ? { flat: true } : {}),
        ...(opts.z != null ? { z: opts.z } : {}),
        ...(opts.cycle ? { cycle: opts.cycle } : {}),
        ...(opts.jump ? { jump: true } : {}),
        ...(opts.walks ? { walks: true } : {}),
        ...(opts.css ? { css: opts.css } : {}),
        start: { ...(opts.hidden ? { o: 0 } : {}), ...(opts.start || {}) },
      });
    }

    /** How far apart two layers' starting tiles are, in pixels.
     *
     * Offsets are measured from where each layer began, so one layer following
     * another's route has to be shifted by the difference between their two
     * starting points.
     *
     * Args:
     *   id: The layer doing the following.
     *   other: The layer whose route is being followed.
     *
     * Returns:
     *   An [x, y] correction to add to the other layer's offsets.
     */
    shift(id, other) {
      const a = this.homeTile[other];
      const b = this.homeTile[id];
      return [(a[0] - b[0]) * TILE, (a[1] - b[1]) * TILE];
    }

    /** Record one beat.
     *
     * Args:
     *   what: One sentence from the brief's own beat table, saying what happens.
     *   write: A function given the beat, which calls the verbs in beat.js. A
     *     beat where nothing changes leaves it out.
     */
    beat(what, write) {
      const beat = new window.act1.Beat(this, what);
      if (write) write(beat);
      // Every character the beat touched gets the sheet its final pose and eye
      // state ask for. Doing it here rather than inside each verb is what makes
      // the verbs order-independent: it does not matter whether the beat says
      // "walk then work" or "work then walk", the answer is the same.
      // A prop set down by somebody who also walked in this beat is CARRIED
      // there: it takes his route and only leaves his hands at the end of it.
      for (const { who, id } of beat.settling || []) {
        const walk = beat.set[who];
        if (!beat.moved.has(who) || !walk) continue;
        const corners = (walk.via || []).map(([x, y]) => [x, y]);
        // His whole route, then the last short step from where he stops to
        // wherever the prop is actually being put down.
        beat.set[id].via = [...corners, [walk.x, walk.y]]
          .map(([x, y]) => [x + this.shift(id, who)[0], y + this.shift(id, who)[1]]);
      }
      // Anything appearing or vanishing in a beat where somebody walks does so
      // ON ARRIVAL. Otherwise a ten-tile walk fades a prop in across two and a
      // half seconds of travelling, when the brief means it lands when he does.
      if (beat.moved.size) {
        for (const [id, change] of Object.entries(beat.set)) {
          // Only something that STAYS PUT waits for the beat to land. Anything
          // travelling in this beat fades as it travels, which is what a shadow
          // does: it moves with its owner, so holding its opacity back left the
          // character standing complete and shadowless for half a second.
          const travelling = change.x != null || change.y != null;
          if (change.o != null && !travelling) change.oLate = true;
        }
      }
      for (const id of beat.touched) {
        const actor = this.actors[id];
        const want = window.act1.asset(this.sheetName(id)).img;
        // A character who moves has to travel on a sheet whose legs work,
        // whatever pose they finish the beat in. Carrying walks; working and
        // pointing do not, so someone crossing the room in order to work at the
        // far end of it walks there and only then picks up the working pose.
        const onFoot = actor.holding.length ? 'carry' : 'walk';
        const travelling = TRAVELLING.includes(actor.pose)
          ? want
          : window.act1.asset(this.sheetName(id, onFoot)).img;
        // The sheets are all one tile tall and NOT the same width: the human
        // walks at 49 px, carries at 52, works at 58 and points at 66, and Clank
        // walks at 54 and works at 62. An element keeps the width it was
        // declared with, so a swap without this squeezes the new pose into the
        // old pose's box and draws it too narrow.
        //
        // THE WIDTH TRAVELS WITH THE PICTURE, both of them. A beat can show two
        // different sheets, the one it walks on and the one it arrives in, so a
        // single width would be wrong for one of them: someone crossing the room
        // to point at something walks there at 49 and arrives at 66. Each
        // picture therefore carries its own width and its own re-centring shift,
        // exactly as `img` and `imgVia` already do.
        const sized = (name) => {
          // What that sheet's cell actually measures on screen.
          const art = window.act1.asset(name);
          // Half the difference from the box this layer was declared with, which
          // is how far to slide it back so the character stays centred on the
          // tile they are standing on rather than growing off one edge of it.
          return { w: art.w, dw: (this.boxes[id][2] - art.w) / 2 };
        };
        if (want !== this.sheet[id]) {
          const at = sized(this.sheetName(id));
          beat.change(id, { img: want, w: at.w, dw: at.dw });
        }
        if (beat.moved.has(id) && travelling !== want) {
          const via = sized(this.sheetName(id, onFoot));
          beat.change(id, { imgVia: travelling, wVia: via.w, dwVia: via.dw });
        }
        this.sheet[id] = want;
      }
      // WHO IS HOLDING WHAT, at the end of this beat. Recorded because it is the
      // only way to tell the difference between a prop travelling with somebody
      // because it is in their hands, which is right, and a prop travelling
      // beside them on its own line, which is the fault Sofiene named: the two
      // look identical in the beat data and completely different on screen,
      // because two things sent separately across a room arrive at different
      // moments and the gap between them opens as they go.
      const held = {};
      for (const [who, actor] of Object.entries(this.actors)) {
        for (const prop of actor.holding) held[prop] = who;
      }
      // WHICH OF THEM THE ENGINE CARRIES, which is not the same list. A prop the
      // beat positioned itself comes out, however firmly it is being held, so
      // the one place in the act where a load is deliberately NOT at hand height
      // in front of its carrier still works: scene 2's can hangs over the middle
      // of the plant it is emptying into.
      const rides = { ...beat.rides };
      for (const id of beat.placed) delete rides[id];
      this.beats.push({
        what,
        ...(beat.camera ? { cam: beat.camera } : {}),
        ...(beat.length ? { hold: beat.length } : {}),
        set: beat.set,
        held,
        rides,
      });
      return this;
    }

    /** Which sheet a character's current pose asks for.
     *
     * THE AMBER TWINS ARE NEVER ASKED FOR. Sofiene dropped the lit eyes outright,
     * so Clank's eyes are black in every frame of the act and the three amber
     * sheets sit unused on disk. This is where that ruling bites, because it is
     * the one place a sheet name is decided: switching it off here means no scene
     * file has to change and none can put the amber back by accident.
     *
     * Args:
     *   id: Which character.
     *   pose: Optional override, used to ask for their travelling sheet.
     *
     * Returns:
     *   A catalogue name such as 'clank-work'.
     */
    sheetName(id, pose) {
      const actor = this.actors[id];
      return `${actor.kind}-${pose || actor.pose}`;
    }

    /** Hand the finished scene to the compositor, in the shape it expects.
     *
     * The stage is as wide as the room, which for most scenes is exactly the
     * frame. A wider room is drawn in full and the camera shows part of it.
     */
    done() {
      // The bubbles are levelled LAST, now that every prop and every beat is
      // known, because that is the only moment the answer can be right. See
      // sayZ: a bubble has to outrank everything the finished scene can produce,
      // and the room's own height is not that number. Scene 3 parks a spare
      // carboy 120 px BELOW its floor waiting to be carried in, which is a level
      // deeper than any room-sized guess would allow for.
      const ceiling = sayZ(this.layers, this.beats);
      for (const layer of this.layers) {
        if (layer.id.endsWith('-say')) layer.z = ceiling;
      }
      return {
        // The room, which the camera moves over.
        w: this.cols * TILE, h: this.rows * TILE,
        // The window onto it, which is the same in every scene.
        view: [this.view.cols * TILE, this.view.rows * TILE],
        layers: this.layers, beats: this.beats,
      };
    }
  }

  /** Build a scene and register it under its name.
   *
   * Args:
   *   id: The name the deck's slide refers to, for example 's1'.
   *   room: Which of the four rooms it plays in.
   *   write: A function given the scene, which declares the set and the beats.
   */
  function scene(id, room, write, size = {}) {
    const built = new Scene(id, room, size);
    write(built);
    window.act1.scenes[id] = built.done();
  }

  window.act1 = Object.assign(window.act1 || {}, {
    scene, Scene, scenes: (window.act1 && window.act1.scenes) || {},
  });
})();
