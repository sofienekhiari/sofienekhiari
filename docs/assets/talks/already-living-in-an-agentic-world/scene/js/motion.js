/* ──────────────────────────────────────────────────────────────────────────
   How things move: the pure arithmetic behind every beat in the deck.

   Nothing in here touches the page. Every function is a plain calculation with
   no memory, which is deliberate: it means a beat painted twice paints the same
   pixels twice, and it means all of this can be checked in isolation without a
   browser or a scene.

   It is split out of compose.js because it answers a different question. That
   file is about elements and beats; this one is about distance, direction and
   pace, and none of it needs to know that a web page exists.
   ────────────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  // One tile on screen, and how long a character takes to cross one. Both come
  // straight from the top-down brief, so the deck and the direction agree.
  // CONSTANT SPEED, NEVER CONSTANT DURATION: a beat takes as long as its
  // distance demands, so eight tiles takes exactly twice as long as four.
  const TILE = 80;
  const TILE_MS = 250;

  // How long a beat takes when nothing actually moves, for example when the only
  // change is an opacity or a sprite swap. Anything that DOES move is timed by
  // distance instead, never by a fixed duration.
  const STATIC_MS = 320;

  // The order a walk cycle steps through its three frames: stand, left foot,
  // stand, right foot. Two step frames make a complete walk, which is why the
  // sheet only needs three columns.
  const WALK_CYCLE = [1, 0, 1, 2];
  // How long each of those four frames is held, in milliseconds.
  const WALK_MS = 150;
  // How far a layer must move between paints before it counts as walking, so a
  // sub-pixel wobble cannot start the legs going.
  const MOVING = 0.4;

  // The level anything lying flat on the floor is drawn at: above the room's own
  // floor and walls, below every object and character that stands on it. A
  // puddle is the reason this exists. Sorting a puddle by its bottom edge like an
  // upright object would put it in front of a robot standing in it.
  const FLAT_Z = 1;

  // How many stacking levels each screen pixel of depth is given. Two layers
  // anchored on the same line are separated by the order they were declared in,
  // which needs somewhere to go: this leaves room for that order without two
  // layers on neighbouring pixels ever colliding.
  //
  // A LAYER'S ORDER IS SQUEEZED TO FIT IN HERE, in layers.js, and it has to be.
  // The connector building brought scenes 7, 8 and 9 to between 88 and 98
  // layers, and a raw declaration index of 97 in 64 places climbs clean over the
  // pixel above: a thing standing FURTHER BACK drawn in front of a thing
  // standing nearer, purely for being written later in the file. Squeezing the
  // index is the right repair rather than widening this number, because several
  // scenes pin layers at hand-picked levels chosen against this scale, and
  // changing it would move every one of them at once.
  const ORDERS = 64;

  // Which row of a sprite sheet each direction wants. Every sheet in the act is
  // laid out down, left, right, up, so this is the whole mapping.
  const DOWN = 0, LEFT = 1, RIGHT = 2, UP = 3;

  // How high above the floor a carried thing rides. The carry sheet holds both
  // arms up in front with the hands empty, and this is where those hands are.
  const HOLD_LIFT = 34;

  // HOW FAR IN FRONT OF ITS CARRIER a held thing rides. ONE distance, not one per
  // direction, because a thing held in two hands does not get nearer or further
  // away when its carrier turns round.
  const HOLD_REACH = 27;

  // A hair of forward bias for a sideways carry, so it is never an exact tie.
  // Held out to the left or right the load shares its carrier's floor line, and
  // depth would then be settled by whichever layer was declared first, which is a
  // property of the scene file rather than of the picture.
  const HOLD_BIAS = 1;

  /** Where a held thing sits, given the way its carrier is facing.
   *
   * ALWAYS IN FRONT, ALWAYS THE SAME DISTANCE AWAY. Everything else follows from
   * that, including the one case that used to need special pleading:
   *
   *   facing the camera  the load is below him, so it is drawn OVER him
   *   in profile         it is out to that side, level, a hair in front
   *   back turned        it is above him, so it is drawn BEHIND him and hidden
   *
   * The last line is the point. With his back to us his own body is between the
   * camera and his hands, so the load SHOULD disappear behind him, and putting it
   * in front of him in world terms is exactly what makes that happen: depth here
   * is the line a thing meets the floor on, and a thing further up the screen is
   * further away.
   *
   * It lives HERE, with the rest of the arithmetic, rather than in the scene
   * vocabulary, because the compositor is now the thing that applies it: a load
   * is placed from its carrier on every single painted frame rather than being
   * given a route of its own. That is what stopped it drifting. A prop with its
   * own route was blended from where it used to be to where it ends up, so a
   * robot turning as he set off down the room dragged what he was holding
   * diagonally across the floor: its x moved during a walk that had no x in it.
   *
   * Args:
   *   facing: Which way the carrier is turned.
   *
   * Returns:
   *   The [sideways, forwards] offset from the carrier's own tile, in pixels.
   *
   * Example:
   *   heldAt(UP)  // [0, -27], which sorts behind the carrier and is hidden
   */
  function heldAt(facing) {
    if (facing === LEFT) return [-HOLD_REACH, HOLD_BIAS];
    if (facing === RIGHT) return [HOLD_REACH, HOLD_BIAS];
    if (facing === UP) return [0, -HOLD_REACH];
    return [0, HOLD_REACH];
  }

  // A layer's resting state, used for anything a beat never mentions: sitting in
  // its home box, full size, fully visible. x and y are offsets from that box,
  // s is scale, o is opacity, and row is which line of a sprite sheet to show,
  // which for a walk sheet means which way the character is facing.
  // img is the picture the layer is currently showing, which a beat may change:
  // that is how a character swaps pose sheet and how a prop swaps state. null
  // means "whatever the layer was declared with".
  // imgVia is the picture to show WHILE TRAVELLING to this beat, when that is
  // not the same as the picture to rest on. A character walking across the room
  // in order to work at the far end of it needs his walking sheet for the
  // journey and his working sheet only on arrival, or his legs stop moving
  // halfway across. Naming the travelling picture is clearer than saying "keep
  // whatever you had", because what he had may itself have been a working pose.
  // lift is how high above the floor a layer rides, which is NOT the same thing
  // as where it is. A prop in a character's hands is drawn 34 px up but stands
  // on the tile he is standing on, so it is drawn at y - lift and sorted at y.
  // Folding the two together drew every carried object behind its carrier.
  // oLate holds a layer's old opacity until the beat arrives, so something that
  // appears or vanishes during a walk does so when the walk ENDS rather than
  // fading across the whole of it.
  // rowVia is which way a character faces WHILE TRAVELLING, when that is not
  // the way they face once they arrive. Walking somewhere and turning to face
  // something on arrival is two different facings, and sharing one field made
  // the second overwrite the first: a man walking in from the right crossed the
  // whole room with his back to the camera.
  const REST = { x: 0, y: 0, s: 1, o: 1, row: 0, img: null, imgVia: null,
                 lift: 0, oLate: false, rowVia: null };

  /** Blend two numbers together.
   *
   * Args:
   *   a: The value at the start.
   *   b: The value at the end.
   *   t: How far between them, from 0 to 1.
   *
   * Returns:
   *   The value that far along.
   */
  const lerp = (a, b, t) => a + (b - a) * t;

  /** Soften a movement so it starts and stops gently instead of snapping.
   *
   * Used ONLY where nothing actually travels: a bubble appearing, an opacity
   * crossing over. A walk must never be eased. A character who creeps off,
   * races through the middle at roughly twice the average and then creeps to a
   * halt, while his legs cycle at a fixed rate throughout, slides at both ends
   * and outruns his legs in between.
   *
   * Args:
   *   t: How far through the movement, from 0 to 1.
   *
   * Returns:
   *   The eased position, also from 0 to 1.
   */
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /** Work out which way a character is facing from the way they are moving.
   *
   * Used while walking a route with corners in it, where the facing has to
   * change at each corner and no beat can name it in advance.
   *
   * Args:
   *   dx: How far the layer moves horizontally on this leg, in pixels.
   *   dy: How far it moves vertically on this leg, in pixels.
   *
   * Returns:
   *   The sheet row for that direction: 0 down, 1 left, 2 right, 3 up.
   *
   * Example:
   *   facingOf(-128, 0)  // 1, facing left along a four-tile walk
   */
  function facingOf(dx, dy) {
    // Whichever axis dominates decides the facing, because there is no diagonal
    // row in any sheet and inventing one would cost four more sheets.
    if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? RIGHT : LEFT;
    return dy >= 0 ? DOWN : UP;
  }

  /** Measure a route once, so that painting it never has to measure anything.
   *
   * Args:
   *   points: The corners of the route, as [x, y] pairs, starting point first.
   *
   * Returns:
   *   An object holding the corners, the distance covered by the time each
   *   corner is reached, and the total length of the whole route.
   *
   * Example:
   *   measure([[0, 0], [0, 128], [256, 128]]).length  // 384, three tiles
   */
  function measure(points) {
    // The distance travelled by the time each corner is reached. The first is
    // always zero, because that is where the walk starts.
    const marks = [0];
    for (let i = 1; i < points.length; i++) {
      const dx = points[i][0] - points[i - 1][0];
      const dy = points[i][1] - points[i - 1][1];
      marks.push(marks[i - 1] + Math.hypot(dx, dy));
    }
    return { points, marks, length: marks[marks.length - 1] };
  }

  /** Find the point a given fraction of the way ALONG a route, not across it.
   *
   * This is what keeps walking speed constant round a corner. Blending the start
   * and end points directly would cut the corner off entirely, and would run
   * fast along the long leg and slow along the short one. Walking by distance
   * means a character covers the same ground per second whatever shape the
   * route is, which is the brief's rule stated as arithmetic.
   *
   * Args:
   *   path: A route already measured by measure().
   *   t: How far along it, from 0 at the start to 1 at the end.
   *
   * Returns:
   *   An object with the x and y reached, and the facing that leg needs.
   */
  function walkAlong(path, t) {
    // How far along the route we are, in pixels rather than as a fraction.
    const want = t * path.length;
    // Find the leg holding that distance. Routes here are a handful of legs
    // long, so a plain scan is quicker than anything cleverer would be.
    let leg = 1;
    while (leg < path.marks.length - 1 && path.marks[leg] < want) leg += 1;
    const from = path.points[leg - 1];
    const to = path.points[leg];
    // How far into this particular leg we are, guarding a zero-length leg so a
    // repeated corner can never divide by zero.
    const run = path.marks[leg] - path.marks[leg - 1];
    const k = run > 0 ? (want - path.marks[leg - 1]) / run : 1;
    return {
      x: lerp(from[0], to[0], k),
      y: lerp(from[1], to[1], k),
      row: facingOf(to[0] - from[0], to[1] - from[1]),
    };
  }

  /** Decide how long a beat takes, and how its movement is shaped.
   *
   * This is the rule the whole act's pacing rests on. EVERYONE MOVES AT ONE
   * CONSTANT SPEED, never for a fixed duration, so a beat takes exactly as long
   * as its distance demands: crossing the room takes as long as it takes, and a
   * sidestep is over in a moment. There is deliberately no ceiling, because a
   * cap only ever fires on the longest walks and so silently speeds up precisely
   * the ones the rule exists to protect.
   *
   * Args:
   *   distance: The furthest any layer travels in this beat, in pixels.
   *
   * Returns:
   *   An object with how long the beat should take in milliseconds, and the
   *   curve its progress follows.
   *
   * Example:
   *   paceOf(512).span  // 2000, eight tiles at a quarter-second each
   */
  function paceOf(distance) {
    // When nothing moved, the beat is a state change rather than a walk, so it
    // gets one short fixed duration instead of a distance it does not have.
    const walking = distance >= MOVING;
    return {
      span: walking ? (distance / TILE) * TILE_MS : STATIC_MS,
      // A WALK IS LINEAR. Easing one means the character creeps off, races
      // through the middle at roughly twice the average, then creeps to a halt,
      // while the legs cycle at a fixed rate throughout: he slides at both ends
      // and outruns his legs in between. Easing survives only where nothing
      // travels, because a bubble appearing does genuinely look better soft.
      curve: walking ? ((t) => t) : easeInOut,
    };
  }

  // Everything above, published under one name so the files that need it can
  // pull out just the pieces they use.
  window.motion = {
    TILE, TILE_MS, STATIC_MS, WALK_CYCLE, WALK_MS, MOVING, FLAT_Z, ORDERS,
    DOWN, LEFT, RIGHT, UP, REST, HOLD_LIFT, HOLD_REACH, HOLD_BIAS,
    lerp, easeInOut, facingOf, measure, walkAlong, paceOf, heldAt,
  };
})();
