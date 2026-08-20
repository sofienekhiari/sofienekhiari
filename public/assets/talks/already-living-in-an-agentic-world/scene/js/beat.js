/* ──────────────────────────────────────────────────────────────────────────
   What can happen in a beat.

   This is the vocabulary Act 1 is written in. A beat is a short list of these
   calls and nothing else, so a scene file reads close to the brief's own beat
   table and a change to a beat is a change to one line.

   Two things make that possible. FIRST, the scene remembers everything: where
   everyone is standing, which way they face, which pose sheet they are on and
   whether Clank's eyes are lit. So a verb only ever has to say what changes,
   and "walk to the bin" does not have to restate the eight things that stay the
   same. SECOND, the order of the calls inside a beat does not matter, because
   the sheet each character ends up on is worked out once at the end of the beat
   from everything the beat said.

   Positions are TILES, written as a column and a row, exactly as the brief's
   floor plans write them. Nothing in a scene file is ever a pixel unless the
   brief itself gives a pixel.
   ────────────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  // The four facings, in the order every sheet in the act is laid out.
  const DOWN = 0, LEFT = 1, RIGHT = 2, UP = 3;

  // Which row of the bubble sheet each tail position is on. The name says where
  // the tail is ON THE BUBBLE, so a tail at the bottom-left means the bubble is
  // sitting above and to the right of whoever is speaking.
  const TAILS = { tl: 0, tr: 1, bl: 2, br: 3 };

  // How far off a speaker a bubble sits. SIDE is measured from the middle of
  // their tile, and is half a character plus half a bubble, so the two just
  // clear each other. UP clears the top of their head; DOWN clears their feet.
  const SAY_SIDE = 34, SAY_UP = 96, SAY_DOWN = 34;

  // Which way each facing points, as one step across the floor.
  const AHEAD = { [DOWN]: [0, 1], [LEFT]: [-1, 0], [RIGHT]: [1, 0], [UP]: [0, -1] };

  // HOW MUCH HEAVIER WHAT A SPEAKER IS LOOKING AT COUNTS than a person standing
  // somewhere else in the room. Two, which is enough that the thing being looked
  // at wins against a single bystander however close they are, and that is the
  // right way round: a bystander is somebody the bubble must not cover, and the
  // thing being looked at is what the beat is ABOUT.
  const FACING_WEIGHT = 2;

  /** Work out where a character's speech bubble should sit.
   *
   * This is a FUNCTION OF THE SCENE rather than a fixed offset, because a fixed
   * offset is only ever right for the arrangement it was measured in. Two
   * characters facing each other across a counter share a column, so a bubble
   * that always goes up and to the right puts one speaker's words on top of the
   * other speaker.
   *
   * The rule: a bubble goes on the side of its speaker FURTHEST FROM WHAT
   * MATTERS IN THE FRAME, which is two things. Whoever else is in the room,
   * counted by how near they are, so somebody across the room barely pulls at
   * all. And WHATEVER THE SPEAKER IS LOOKING AT, counted double, because a
   * character stopped dead facing something is the act's way of saying that
   * thing is the subject of the beat.
   *
   * The facing half was missing and it cost three beats, each of them the beat
   * its scene exists for: the bubble covered the ill plant at the moment of
   * noticing it, twice, and covered the shelf of medicines at the moment of
   * choosing between them. In every case one bystander five tiles away was
   * deciding the side, because distance did not come into it.
   *
   * Two characters facing each other are unaffected, which is why this is safe:
   * away-from-the-other-person and away-from-what-I-am-looking-at are the same
   * direction when the other person IS what I am looking at.
   *
   * Args:
   *   scene: The scene, for everyone else's positions.
   *   actor: The character speaking.
   *
   * Returns:
   *   An object with the bubble's centre in stage pixels and which corner its
   *   tail leaves from.
   */
  function placeSay(scene, actor) {
    // Everyone else on their feet in this room, which is what the bubble has to
    // keep away from.
    const others = Object.values(scene.actors).filter((a) => a !== actor);
    // Where everything worth avoiding is, relative to the speaker. With nobody
    // else about and nothing being looked at, the bubble goes up and right.
    let dy = 0, dx = 0;
    for (const other of others) {
      const ox = other.col - actor.col;
      const oy = other.row - actor.row;
      // COUNTED BY HOW NEAR THEY ARE rather than by where they are, so a person
      // at the far wall pulls a fraction of what a person at your elbow does.
      // Unweighted, one bystander anywhere in the room out-voted everything.
      const far = Math.hypot(ox, oy) || 1;
      dx += ox / far;
      dy += oy / far;
    }
    // And what the speaker is looking at, which is one step ahead of them and
    // counts double. This is the half that keeps a bubble off the thing the
    // beat is about.
    const [fx, fy] = AHEAD[actor.face] || [0, 0];
    dx += fx * FACING_WEIGHT;
    dy += fy * FACING_WEIGHT;
    // Away from them: below if they are above, above if they are below or level.
    const above = dy > 0 || (dy === 0 && true);
    // And to the side they are not on, defaulting right when they are level.
    const right = dx <= 0;
    const feet = scene.tileY(actor.row);
    return {
      cx: scene.tileX(actor.col) + (right ? SAY_SIDE : -SAY_SIDE),
      cy: above ? feet - SAY_UP : feet + SAY_DOWN,
      // The tail names its own corner, so it points back at the speaker: a
      // bubble above and right of someone has its tail at the bottom left.
      tail: above ? (right ? 'bl' : 'br') : (right ? 'tl' : 'tr'),
    };
  }

  // HOW FAR A BUBBLE MAY EVER BE from the middle of its speaker, in pixels. A
  // character is 80 px tall, so this is about one and a quarter characters: far
  // enough to clear their head and anyone standing next to them, near enough
  // that nobody has to work out who is talking. A beat asking for more is pulled
  // back to it rather than obeyed, because the one job a bubble has is to say
  // WHICH of the people on screen is speaking.
  const SAY_REACH = 100;

  // WHERE A CARRIED THING RIDES now lives in motion.js with the rest of the
  // arithmetic, because the COMPOSITOR is what applies it: a load is placed from
  // its carrier on every painted frame rather than being sent along a route of
  // its own. Pulled in here under the same names so nothing else had to change.
  const { HOLD_LIFT, HOLD_REACH, heldAt } = window.motion;

  class Beat {
    /** Start collecting the changes that make up one beat.
     *
     * Args:
     *   scene: The scene being built. Everything is looked up and recorded
     *     there, so consecutive beats inherit the world they were left in.
     *   what: One plain sentence saying what happens, taken from the brief's
     *     own beat table. It is carried through to the deck's notes.
     */
    constructor(scene, what) {
      this.scene = scene;
      this.what = what;
      // The changes, keyed by layer id, in exactly the shape compose.js wants.
      this.set = {};
      // Which characters moved in this beat, so the sheet they travel on can be
      // decided once the beat is complete rather than in the order it was typed.
      this.moved = new Set();
      // Which characters this beat touched at all, so an untouched one is never
      // re-emitted and two identical beats stay literally identical.
      this.touched = new Set();
      // WHICH PROPS RIDE IN WHOSE HANDS through this beat, as prop -> carrier.
      // The compositor reads this and places those props from their carrier on
      // every frame instead of interpolating a route, which is what stops a load
      // drifting sideways during a walk that has no sideways in it.
      this.rides = {};
      // Which props this beat positioned ITSELF. They are taken back out of the
      // ride list at the close of the beat, because a beat that says exactly
      // where a prop goes means it: scene 2 hangs the watering can over the
      // middle of a plant while it is still in Clank's hands, and hand height in
      // front of him is precisely where it must not be.
      this.placed = new Set();
      // A camera move, if this beat makes one.
      this.camera = null;
    }

    /** Change something about a layer, merging with anything already said.
     *
     * A name that was never declared stops the scene here. Without this a
     * mistyped id is completely silent: the change is recorded against nothing,
     * the layer it was meant for quietly keeps its old state, and the beat looks
     * finished. That is the worst kind of fault in a deck, because it survives
     * every check that does not happen to look at that one beat.
     */
    change(id, values) {
      if (!this.scene.boxes[id]) {
        throw new Error(`${this.scene.id}: beat "${this.what}" names "${id}", `
                      + 'which is not a layer in this scene');
      }
      this.set[id] = Object.assign(this.set[id] || {}, values);
      return this;
    }

    /** Every layer that belongs to a name and moves or vanishes with it.
     *
     * A character is three layers, not one: themself, the shadow underneath
     * them and the speech bubble above them. A scene never says so, which is
     * the point, so anything that moves or hides a character has to come
     * through here or the shadow gets left behind on the far side of the room.
     *
     * Args:
     *   id: A character or a prop.
     *
     * Returns:
     *   The layer ids that travel together, the named one first.
     */
    group(id) {
      return this.scene.actors[id] ? [id, `${id}-shadow`] : [id];
    }

    /** Walk a character to a tile, going round corners if more than one is given.
     *
     * The facing looks after itself: a character faces the way they are
     * travelling, and turns at each corner. That is what the brief means when it
     * says every leg's direction of travel IS the facing it needs on arrival, so
     * no beat is ever spent on a turn.
     *
     * Anything the character is holding travels with them, along the same route.
     *
     * Args:
     *   id: Which character.
     *   ...tiles: One or more [column, row] pairs. The last is where they end
     *     up; any before it are corners to go round on the way.
     *
     * Example:
     *   b.walk('clank', [5, 4], [13, 4]);  // out to the aisle, then along it
     */
    walk(id, ...tiles) {
      const actor = this.scene.actorOf(id);
      const [col, row] = tiles[tiles.length - 1];
      // The corners, as offsets from wherever this layer began the scene.
      const via = tiles.slice(0, -1).map(([c, r]) => this.scene.offset(id, c, r));
      const to = this.scene.offset(id, col, row);
      // Facing on arrival is the direction of the final leg, measured from the
      // corner before it rather than from the start.
      const prev = tiles.length > 1 ? tiles[tiles.length - 2] : [actor.col, actor.row];
      const facing = window.motion.facingOf(col - prev[0], row - prev[1]);
      actor.face = facing;
      // The character and their shadow travel together, each with the route
      // measured from its own starting tile.
      for (const layer of this.group(id)) {
        const end = this.scene.offset(layer, col, row);
        const corners = tiles.slice(0, -1).map(([c, r]) => this.scene.offset(layer, c, r));
        this.change(layer, {
          x: end[0], y: end[1], ...(corners.length ? { via: corners } : {}),
        });
      }
      // The way they FACE WHILE WALKING is the way they are walking, and it is
      // recorded separately from the way they face once they get there. A beat
      // that walks somebody in and then turns them to face something would
      // otherwise send them the whole way already turned, which for anyone
      // arriving at something is their back to the camera the entire time.
      this.change(id, { row: facing, rowVia: facing });
      // A LOAD TURNS AT EVERY CORNER WITHOUT ANYTHING SAYING SO. The compositor
      // reads the facing off the leg being walked, frame by frame, so a load that
      // is correctly in front of him going down the room is in front of him again
      // the instant he turns along the bottom of it. Working the corner facings
      // out here, as this used to, could only ever place the load AT the corner
      // and left the whole leg after it to be guessed by interpolation.
      // Everything in their hands goes with them, and the ENGINE takes it there:
      // the beat only says whose hands it is in. The position written here is
      // where it comes to rest, so the scene's own record of the world stays
      // truthful and a later beat that moves the prop itself starts from the
      // right place; every frame in between is painted from the carrier instead.
      //
      // It used to be given its own route, and that was the fault Sofiene named
      // twice. A route is blended from one end to the other, so a robot who set
      // off downward while holding something out to his left dragged it
      // diagonally across the floor for the whole walk: its x changed during a
      // walk that had no x in it. Riding has no such in-between to get wrong.
      for (const held of actor.holding) {
        const [dx, dy] = heldAt(facing);
        const hp = this.scene.offset(held, col, row);
        // It travels on the floor with him and is DRAWN at hand height. Those
        // are different things: the position decides depth, so folding the height
        // into it would sort the load behind whoever is carrying it.
        this.change(held, { x: hp[0] + dx, y: hp[1] + dy, lift: HOLD_LIFT });
        this.rides[held] = id;
        Object.assign(this.scene.propOf(held), { col, row });
      }
      // Only a walk that covers ground counts as travelling. A beat that names
      // the tile someone is already standing on is a turn, not a journey, and
      // treating it as one would flash the walking sheet for no reason.
      if (col !== actor.col || row !== actor.row) this.moved.add(id);
      Object.assign(actor, { col, row });
      this.touched.add(id);
      return this;
    }

    /** Turn a character on the spot, without moving them.
     *
     * Args:
     *   id: Which character.
     *   dir: One of DOWN, LEFT, RIGHT or UP.
     */
    face(id, dir) {
      const actor = this.scene.actorOf(id);
      actor.face = dir;
      this.touched.add(id);
      // ANYTHING IN THEIR HANDS SWINGS ROUND WITH THEM, and the engine does the
      // swinging: turning on the spot changes what "in front" means, so the load
      // is simply somewhere else the moment the turn starts. The rest position is
      // still written down so the scene's record of the world stays truthful.
      for (const held of actor.holding) {
        const [dx, dy] = heldAt(dir);
        const at = this.scene.offset(held, actor.col, actor.row);
        this.change(held, { x: at[0] + dx, y: at[1] + dy, lift: HOLD_LIFT });
        this.rides[held] = id;
      }
      return this.change(id, { row: dir });
    }

    /** Put a character into one of their pose sheets.
     *
     * Args:
     *   id: Which character.
     *   name: 'walk', 'carry', 'work', or 'point' for the human only.
     */
    pose(id, name) {
      const actor = this.scene.actorOf(id);
      // THE HUMAN NEVER USES THE WORK SHEET. It is the one pose of his without
      // visible legs: leaning over a bench merges them into a solid mass, and a
      // person with no legs is the sort of thing nobody notices while building
      // and everybody notices on a projector. `carry` is the pose that means
      // "hands busy with something in front of him" and it keeps his legs.
      if (id !== 'clank' && actor.kind === 'human' && name === 'work') {
        throw new Error(`${this.scene.id}: the human has no work sheet with legs; `
                      + 'use carry');
      }
      actor.pose = name;
      this.touched.add(id);
      return this;
    }

    /** DOES NOTHING. Clank's eyes are black at all times, everywhere in the act.
     *
     * Sofiene dropped the amber eyes outright: "the amber eyes thing seems
     * complicated, let's just drop it. Keep the eyes of the robot black at all
     * times." So there is now no signal of internal state anywhere in Act 1, and
     * expression is carried entirely by which way a character faces, whether it
     * is moving or completely still, and where it is standing.
     *
     * The verb survives as a no-op rather than being deleted from the scenes for
     * one reason: scene 1 is signed off and must not be edited, and it calls
     * this. Turning it off HERE makes the ruling one change in one place instead
     * of an edit to every scene file, which is also the only version of it that
     * a scene written later cannot accidentally undo.
     *
     * Args:
     *   id: Which character. Ignored.
     *   on: Whether to light them. Ignored.
     */
    eyes(id, on) {
      return this;
    }

    /** Move a prop to a tile, or place it for the first time.
     *
     * Args:
     *   id: Which prop.
     *   col: The column to put it on, which may be fractional for a wide prop.
     *   row: The row to put it on.
     *   opts: Optional. `lift` raises it above the tile centre in pixels, and
     *     `via` gives corners to travel round.
     */
    put(id, col, row, opts = {}) {
      const prop = this.scene.propOf(id);
      const to = this.scene.offset(id, col, row);
      const via = (opts.via || []).map(([c, r]) => this.scene.offset(id, c, r));
      Object.assign(prop, { col, row });
      // `lift` is how high above the tile it is drawn, and it never affects
      // which tile it is on, so a thing resting on a bench still sorts as being
      // at that bench rather than half a tile behind it.
      const [dx, dy] = opts.nudge || [0, 0];
      // A BEAT THAT SAYS WHERE A PROP GOES MEANS IT, even for something still in
      // somebody's hands. Recorded so the close of the beat can take this prop
      // back out of the ride list: scene 2 hangs the watering can over the middle
      // of a plant while Clank is still holding it, and hand height in front of
      // him is exactly where the water must not fall.
      this.placed.add(id);
      return this.change(id, {
        x: to[0] + dx, y: to[1] + dy, lift: opts.lift || 0,
        ...(via.length ? { via } : {}),
      });
    }

    /** Move a prop by exact pixels, for the few places the brief gives pixels.
     *
     * Scene 6's poster blocks are the reason this exists: they are laid out
     * inside a board drawn face-on, so their positions are given as pixels
     * rather than tiles and translating them into tiles would lose precision.
     *
     * Args:
     *   id: Which prop.
     *   x: Where its left edge goes, in stage pixels.
     *   y: Where its top edge goes, in stage pixels.
     */
    putPx(id, x, y) {
      const box = this.scene.boxOf(id);
      // Placing by pixels is placing, so it wins over riding in a carrier's
      // hands for exactly the same reason put() does.
      this.placed.add(id);
      return this.change(id, { x: x - box[0], y: y - box[1] });
    }

    /** Bring a layer into the scene. A character brings their shadow with them. */
    show(id) {
      this.group(id).forEach((layer) => this.change(layer, { o: 1 }));
      return this;
    }

    /** Take a layer out of the scene, leaving it where it is.
     *
     * A character takes their shadow and their bubble out with them, because a
     * shadow left lying on an empty floor is the sort of thing nobody notices
     * while building and everybody notices on a projector.
     */
    hide(id) {
      this.group(id).forEach((layer) => this.change(layer, { o: 0 }));
      if (this.scene.actors[id]) this.quiet(id);
      return this;
    }

    /** Swap a prop for another picture of itself: a terminal lighting up, a
     * bin filling, a plant dying.
     *
     * Args:
     *   id: Which prop.
     *   name: The catalogue name of the picture it changes to.
     */
    state(id, name) {
      return this.change(id, { img: window.act1.asset(name).img });
    }

    /** Put a prop into a character's hands, so it travels with them.
     *
     * IT USED TO BE CALLED `hold`, AND THAT NAME WAS SILENTLY DEAD. A class
     * cannot carry two methods of one name, and the beat-length `hold(ms)`
     * below it replaced this one outright, so every `b.hold('clank', 'can')`
     * in the act set the beat's duration to the string "clank" and picked
     * nothing up. Nothing complained, because a prop that was never picked up
     * simply stays where it was declared. The two jobs now have two names, and
     * `hold` still forwards a two-argument call here so no scene has to change.
     *
     * Args:
     *   who: Which character picks it up.
     *   id: Which prop.
     */
    carry(who, id) {
      const actor = this.scene.actorOf(who);
      if (!actor.holding.includes(id)) actor.holding.push(id);
      this.scene.propOf(id).held = who;
      // Carrying is a pose, not a prop trick: both arms come up in front with
      // the hands empty, and the load is drawn into them. In three scenes the
      // ACT of carrying is the beat rather than the object, so arms up and empty
      // reads as "I am fetching this for you" before the audience sees what it is.
      this.pose(who, 'carry');
      // It arrives in their hands: one reach in front of them, at hand height,
      // by the same rule that carries it everywhere else.
      const [dx, dy] = heldAt(actor.face);
      return this.put(id, actor.col, actor.row,
                      { lift: HOLD_LIFT, nudge: [dx, dy] });
    }

    /** Take a prop out of a character's hands and set it down.
     *
     * Args:
     *   who: Which character was holding it.
     *   id: Which prop.
     *   col: The column to set it down on.
     *   row: The row to set it down on.
     */
    drop(who, id, col, row) {
      const actor = this.scene.actorOf(who);
      actor.holding = actor.holding.filter((held) => held !== id);
      this.scene.propOf(id).held = null;
      // Hands free again, so back to the ordinary walking pose unless the beat
      // goes on to say otherwise.
      if (!actor.holding.length) this.pose(who, 'walk');
      this.put(id, col, row);
      // IT IS CARRIED THERE, NOT SENT THERE. If its carrier also walks in this
      // beat, the prop takes his route and only leaves his hands at the end of
      // it. Without this it set off straight for the floor on its own line while
      // he took a different one, so it peeled away and crossed the room ahead
      // of him. Recorded for the close of the beat, because the walk may not
      // have been written yet.
      (this.settling = this.settling || []).push({ who, id });
      return this;
    }

    /** Put a speech bubble over a character.
     *
     * The bubble is empty and always will be: Sofiene is speaking over every
     * frame, and a line of text on screen would compete with him. Its whole job
     * is to say THIS ONE IS TALKING NOW, which the tail does on its own.
     *
     * Args:
     *   id: Which character is speaking.
     *   opts: Optional. `at` places the bubble's centre at exact stage pixels
     *     when the brief gives them; `tail` picks which corner the tail leaves
     *     from, as 'tl', 'tr', 'bl' or 'br'.
     */
    say(id, opts = {}) {
      const actor = this.scene.actorOf(id);
      const bubble = `${id}-say`;
      const box = this.scene.boxOf(bubble);
      // Where the bubble's centre goes: either exactly where the brief says, or
      // up and to the right of the speaker's head.
      // The speaker's head, which is what the bubble is anchored to. Their feet
      // are on the tile centre and they are one tile tall, so their head is half
      // a tile above it.
      const headX = this.scene.tileX(actor.col);
      const headY = this.scene.tileY(actor.row) - 40;
      // Worked out from where everyone is standing, unless the beat insists.
      const spot = placeSay(this.scene, actor);
      let cx = opts.at ? opts.at[0] : spot.cx;
      let cy = opts.at ? opts.at[1] : spot.cy;
      // Held within reach of the speaker, whatever the beat asked for.
      const dx = cx - headX, dy = cy - headY;
      const far = Math.hypot(dx, dy);
      if (far > SAY_REACH) {
        cx = headX + (dx / far) * SAY_REACH;
        cy = headY + (dy / far) * SAY_REACH;
      }
      // ONLY ONE OF THEM TALKS AT A TIME. Whoever else was speaking stops here,
      // automatically, so a scene can never leave two bubbles up at once and no
      // beat has to remember to hush the last speaker.
      for (const other of Object.keys(this.scene.actors)) {
        if (other !== id) this.quiet(other);
      }
      return this.change(bubble, {
        o: 1,
        x: cx - box[0] - box[2] / 2,
        y: cy - box[1] - box[3] / 2,
        row: TAILS[opts.tail || spot.tail],
      });
    }

    /** Stop a character speaking, so the bubble goes and its dots reset. */
    quiet(id) {
      // Straight off, with no fade: speech stopping is an event too.
      return this.change(`${id}-say`, { o: 0 });
    }

    /** Move the camera in on a tile.
     *
     * Args:
     *   scale: How far in, where 1 is the whole room.
     *   col: The column to centre on, which may be fractional.
     *   row: The row to centre on.
     */
    cam(col, row) {
      // NO ZOOM, EVER. The camera moves across the room and never changes how
      // big it is. A zoom in a fixed-angle pixel world resamples every sprite to
      // a size it was never drawn at, and it changes the scale of the world
      // mid-scene, which is the one thing a held tableau cannot survive.
      this.camera = { cs: 1, cx: this.scene.tileX(col), cy: this.scene.tileY(row) };
      return this;
    }

    /** Move the camera to an exact point, for the plans that give pixels. */
    camPx(x, y) {
      this.camera = { cs: 1, cx: x, cy: y };
      return this;
    }

    /** Make this beat last at least this long, in milliseconds.
     *
     * Only needed by a beat that plays a short sequence rather than a single
     * change: scene 1's answer beats speak for a second, put the finished page
     * down, and then hold until the next click. Everything else is timed by the
     * distance it covers, at the act's one constant speed.
     *
     * A two-argument call is the OLD carrying verb and is forwarded to
     * `carry`, so every scene already written as `b.hold('clank', 'can')` keeps
     * working and starts actually working. Told apart by what is passed: a
     * number is a length of time, a name is somebody's hands.
     *
     * Args:
     *   ms: How long the beat should take, or a character to hand a prop to.
     *   id: Only when handing something over: which prop.
     */
    hold(ms, id) {
      // A name rather than a number means this is the carrying verb.
      if (typeof ms !== 'number') return this.carry(ms, id);
      this.length = ms;
      return this;
    }

    /** Put the camera back in the middle of the room. */
    wide() {
      this.camera = { cs: 1, cx: this.scene.cols * 40, cy: this.scene.rows * 40 };
      return this;
    }
  }

  window.act1 = Object.assign(window.act1 || {}, {
    Beat, DOWN, LEFT, RIGHT, UP, HOLD_LIFT, HOLD_REACH, heldAt,
  });
})();
