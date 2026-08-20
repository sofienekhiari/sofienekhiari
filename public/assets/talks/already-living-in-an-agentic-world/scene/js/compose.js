/* ──────────────────────────────────────────────────────────────────────────
   Click-driven scene compositor.

   The deterministic sibling of scrub.js. Where a scrub slide plays back frames
   somebody generated, a composite slide DRAWS its beats: the scene is a list of
   layers (a body, a head, an eye, a speech bubble) and a list of beats saying
   where each layer sits and how visible it is. Everything between two beats is
   interpolated in the browser.

   Why this exists: a generated clip is resampled in full every time it is made,
   so a detail you corrected can come back wrong and two beats that are supposed
   to be identical never quite are. Here a layer is one element that moves. Beats
   1, 4, 7 and 10 of the LLM scene are not "very similar", they are the same
   numbers, so they paint the same pixels. Nothing drifts because nothing is
   regenerated.

   It exposes the same three members deck.js already drives on a scrubber
   (stopCount, goToStop, snapToStop) and chains itself onto window.scrub.forSlide,
   so deck.js needs no change and the two kinds of slide can sit side by side.

   The scene is DATA. A small demo declares it as JSON inside its own container;
   a full scene is built in JavaScript by deck/act1/ and registered by name.
   Either way this file never learns anything about a particular scene, which is
   the whole point of building it this way.
   ────────────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  // The movement arithmetic, from motion.js: distance, direction and pace. It
  // is kept in its own file because none of it needs to know a page exists, so
  // all of it can be checked without a browser.
  const {
    WALK_CYCLE, WALK_MS, MOVING, FLAT_Z, ORDERS, HOLD_LIFT,
    REST, lerp, measure, walkAlong, paceOf, heldAt,
  } = window.motion;

  class Composite {
    /** Build one composited scene.
     *
     * Args:
     *   root: The .compose element. It either names a registered scene with a
     *     data-scene attribute, or holds the scene as JSON inside itself.
     */
    constructor(root) {
      // The scene description: canvas size, layers, and the beat list. It comes
      // from one of two places. A small demo declares it as JSON inside its own
      // container, which is how this engine started and how the two live demos
      // in the top-down brief still work. A full scene is built in JavaScript
      // instead and registered by name, because a hundred and twenty-three beats
      // written out as literal coordinates would be unreadable and unmaintainable.
      const named = root.dataset.scene;
      this.scene = named
        ? (window.act1 && window.act1.scenes[named])
        : JSON.parse(root.querySelector('script[type="application/json"]').textContent);
      // Failing loudly here beats a silently blank slide in a lecture theatre.
      if (!this.scene) throw new Error(`compose: no scene named "${named}"`);
      // The element every layer lives inside; the camera transform is applied here.
      this.stage = root.querySelector('.compose-stage');
      // One element per declared layer, plus everything about them this file
      // needs to paint: their sheets, their home boxes, their pinned stacking
      // levels and their cycle speeds.
      // The panel is exactly as big as the room it shows. Each scene picks the
      // smallest room that holds its story, so this is what makes a small scene
      // draw a small panel rather than a big one with space left over.
      // The panel is the WINDOW, which is one size across the whole act. The
      // room behind it may be bigger, and the camera pans over it.
      const view = this.scene.view || [this.scene.w, this.scene.h];
      this.view = { w: view[0], h: view[1] };
      root.style.width = this.view.w + 'px';
      root.style.height = this.view.h + 'px';
      const built = window.layers.build(this.stage, this.scene);
      this.els = built.els;
      this.sheets = built.sheets;
      this.boxes = built.boxes;
      this.pinned = built.pinned;
      this.anchors = built.anchors;
      this.jumps = built.jumps;
      this.walkers = built.walkers;
      // Where each sheet layer was on the previous paint, so movement can be
      // detected and the legs started without any beat having to say so.
      this.lastPos = {};
      // The z-index each layer was last given, so the engine only touches the
      // style when it actually changes.
      this.lastZ = {};
      // The width each layer was last drawn at, for the same reason. Only the
      // characters ever change it, when they change pose sheet.
      this.lastW = {};
      // Multi-leg walking routes, keyed by the beat being walked TO. A beat with
      // no corner in it needs no entry here and interpolates straight.
      this.paths = {};
      // WHAT IS IN WHOSE HANDS during each beat, as prop -> carrier. A prop
      // listed here is placed from its carrier on every frame instead of being
      // sent along a route, which is the only way its position can be exactly
      // right at every instant rather than only at the two ends.
      this.rides = {};
      // How long a change waits before it starts, keyed by beat then layer.
      this.waits = {};
      // How long the beat being played lasts, so a delay in milliseconds can be
      // turned into a position along it.
      this.span = 0;
      // Fully resolved per-beat state, with nothing left inheriting.
      this.beats = [];
      // Where the playhead is now, as a fractional beat index.
      this.current = 0;
      // Handle of the running animation, so a fast double-click cannot overlap.
      this.raf = null;
      // Speech bubbles keep their dots running while a beat is held still. It
      // owns its own clock, which is why it is the one thing here with one.
      this.cycler = new window.Cycler(this.els, this.sheets, built.cycles);

      this.resolve();
      this.paint(0);
    }

    /** Expand the beat list so every beat names every layer.
     *
     * A beat only writes what it changes, the way a keyframe does. This walks
     * forward carrying the previous beat's values, so painting never has to
     * search backwards for the last time a layer was mentioned.
     */
    resolve() {
      // Start from every layer at rest, using each layer's own declared start.
      let state = {};
      for (const layer of this.scene.layers) {
        state[layer.id] = { ...REST, ...(layer.start || {}) };
      }
      // The camera starts filling the frame exactly.
      // The camera starts showing the top-left of the room, which for a room the
      // size of the window is the whole of it.
      let cam = { cx: this.view.w / 2, cy: this.view.h / 2, cs: 1 };
      for (const beat of this.scene.beats) {
        // Where this beat is being walked to, counting from zero.
        const index = this.beats.length;
        // Copy forward, then apply only what this beat overrides.
        const before = state;
        // Everything carries forward EXCEPT imgVia, which describes this one
        // journey rather than the layer. Left to inherit, a single walk-then-work
        // beat would go on showing a walking sheet for the rest of the scene.
        state = Object.fromEntries(Object.entries(state)
          .map(([k, v]) => [k, { ...v, imgVia: null, oLate: false, rowVia: null }]));
        cam = { ...cam, ...(beat.cam || {}) };
        // Who is carrying what through this beat. It belongs to the beat rather
        // than to any layer's state, exactly as a route does.
        this.rides[index] = beat.rides || {};
        for (const [id, change] of Object.entries(beat.set || {})) {
          if (!state[id]) continue;
          // `via` is not a property of the layer, it is the shape of the journey
          // to this beat, so it is lifted out rather than stored as state.
          const { via, delay, ...rest } = change;
          // A delayed change is held back for the first part of the beat, so
          // one click can play a short sequence that still comes to a stop.
          if (delay) (this.waits[index] || (this.waits[index] = {}))[id] = delay;
          Object.assign(state[id], rest);
          if (!via) continue;
          // A route runs from wherever the layer was, through every corner
          // named, to wherever this beat puts it. Measuring it now means
          // painting never has to.
          const route = [[before[id].x, before[id].y], ...via,
                         [state[id].x, state[id].y]];
          (this.paths[index] || (this.paths[index] = {}))[id] = measure(route);
        }
        this.beats.push({ state, cam, hold: beat.hold || 0 });
      }
    }

    /** Paint the scene at a fractional beat position (3.4 = 40% past beat 3). */
    paint(p) {
      // Clamp into range, then split into the pair of beats being crossed.
      const max = this.beats.length - 1;
      const at = Math.max(0, Math.min(max, p));
      const i = Math.min(max, Math.floor(at));
      const j = Math.min(max, i + 1);
      const t = at - i;
      const from = this.beats[i];
      const to = this.beats[j];

      // The route being walked on this transition, if any layer has a corner in
      // it. Almost every beat has none and interpolates in a straight line.
      const routes = this.paths[j] || {};

      // How far the longest movement of this transition is, and how far each
      // layer goes. Distances are measured by spanOf when the beat is started;
      // arriving cold (a grid jump, the first paint) leaves them empty, which
      // simply means every layer runs on the beat's own progress.
      const furthest = this.furthest || 0;
      const trips = this.trips || {};

      /* Where one layer is at this instant, and which way it faces.
         Worked out on demand and remembered, because a carried thing needs its
         CARRIER'S answer as well as its own, and the carrier may be declared
         anywhere in the list. */
      const spots = {};
      const spotOf = (id) => {
        if (spots[id]) return spots[id];
        const a = from.state[id];
        const b = to.state[id];
        // EVERYTHING MOVES AT ONE SPEED. A layer with a shorter distance to
        // cover finishes sooner and waits, rather than crawling so that it
        // arrives at the same moment as the longest mover. Without this, one
        // beat's duration was shared by everything in it, so a robot taking a
        // single step beside a carboy being carried across the room took that
        // step at a quarter speed, and a token sent up a wire beside him flew.
        let own = trips[id] > MOVING && furthest > trips[id]
          ? Math.min(1, t * furthest / trips[id])
          : t;
        // A layer told to wait does nothing at all until its delay has passed,
        // and then runs out over what is left of the beat. That is what lets one
        // click play "he speaks, and a second later the answer appears" and
        // still come to a complete stop at the end of it.
        const wait = (this.waits[j] || {})[id];
        if (wait && t > 0 && this.span > wait) {
          own = Math.max(0, (t * this.span - wait) / (this.span - wait));
        }
        // Where the layer is, and which way it is facing. A straight move blends
        // the two beats directly; a route with corners in it is walked by
        // DISTANCE instead, so the pace stays the same round every corner and
        // the facing changes as each corner is turned.
        let x = lerp(a.x, b.x, own);
        let y = lerp(a.y, b.y, own);
        // The facing is never blended, because a character turns on the frame:
        // there is no half-way between facing left and facing up. While
        // travelling it is the facing of the beat being walked TO, since that is
        // the direction of travel; at rest it is the facing of the beat actually
        // arrived at.
        let row = t > 0 ? (b.rowVia != null ? b.rowVia : b.row) : a.row;
        // A jumping layer is simply THERE, from the first frame of the beat: it
        // never animates in any respect. A speech bubble is the only one, and it
        // has to be, because speech starting is an event rather than a
        // transition. Fading one in reads as the words arriving gradually.
        if (this.jumps[id] && t > 0) { x = b.x; y = b.y; }
        else if (routes[id] && t > 0) {
          const step = walkAlong(routes[id], own);
          x = step.x;
          y = step.y;
          row = step.row;
        }
        return (spots[id] = { x, y, row, own });
      };

      // What is in whose hands right now. During a beat it is that beat's list;
      // standing still on one, it is the list belonging to the beat we are on.
      const riding = (t > 0 ? this.rides[j] : this.rides[i]) || {};

      for (const id of Object.keys(this.els)) {
        const a = from.state[id];
        const b = to.state[id];
        let { x, y, row, own } = spotOf(id);
        const s = this.jumps[id] && t > 0 ? b.s : lerp(a.s, b.s, own);
        // Height above the floor is added to the drawing only. Depth below uses
        // the unlifted y, so a carried thing stays in front of its carrier.
        let lift = lerp(a.lift, b.lift, own);
        // A THING IN SOMEBODY'S HANDS IS PLACED FROM THEM, every frame, rather
        // than sent along a route of its own. That is the whole repair: a route
        // is blended from one end to the other, so a carrier who turned as he
        // set off dragged his load diagonally across the floor, and its x moved
        // during a walk that had no x in it. Placed from the carrier, the load is
        // in front of him on the FIRST frame of the beat and every frame after,
        // it turns the instant he turns and at every corner he goes round, and it
        // cannot lag, drift or change distance, because there is no in-between
        // for any of those to happen in.
        if (riding[id] && this.boxes[riding[id]]) {
          const at = this.carriedAt(id, riding[id], spotOf(riding[id]));
          x = at.x;
          y = at.y;
          lift = HOLD_LIFT;
        }
        // Which pose sheet is on screen right now, and therefore how wide this
        // element has to be. The pose sheets are not all the same width, so a
        // layer that keeps its declared box squeezes a wider pose into a
        // narrower frame: the human points at 66 px and walks at 49, and drawn
        // in the walking box he was three quarters of his proper width. The
        // TRAVELLING picture carries its own width too, because one beat can
        // show two sheets, walking there and arriving pointing.
        const wide = t > 0 && b.imgVia != null ? { w: b.wVia, dw: b.dwVia }
                   : t > 0 ? { w: b.w, dw: b.dw }
                   : { w: a.w, dw: a.dw };
        this.paintWidth(id, wide.w);
        // The re-centring shift goes into the DRAWING only, never into x itself.
        // x is what tells the walk cycle whether this layer moved since the last
        // frame, and a pose swap is not a step: folded into x, changing pose on
        // the spot would flick the legs for one frame.
        const dx = wide.w != null ? wide.dw : 0;
        this.els[id].style.transform = `translate(${x + dx}px, ${y - lift}px) scale(${s})`;
        // A late change holds the old value until the beat lands, which is what
        // "it appears when he gets there" means.
        this.els[id].style.opacity = this.jumps[id]
          ? (t > 0 ? b.o : a.o)
          : ((t > 0 && b.oLate) ? a.o : lerp(a.o, b.o, own));
        // A beat may swap the picture a layer shows: a pose sheet for a
        // character, an on-or-off state for a prop. At rest it is the picture of
        // the beat we are standing on; while travelling it is the travelling
        // picture if this beat named one, and otherwise the one being arrived at.
        this.paintImage(id, t > 0 ? (b.imgVia || b.img) : a.img);
        // A sheet layer also has to choose which cell of the sheet to show.
        if (this.sheets[id]) this.paintCell(id, x, y, row);
        // Then how far forward it is drawn, which in a top-down world is
        // decided by how far down the screen its feet are.
        this.paintDepth(id, y);
      }

      // The camera centres a world point at a scale, and is then held inside the
      // canvas so a push-in can never reveal an empty edge.
      const cs = lerp(from.cam.cs, to.cam.cs, t);
      const cx = lerp(from.cam.cx, to.cam.cx, t);
      const cy = lerp(from.cam.cy, to.cam.cy, t);
      // Centre the camera's point in the WINDOW, then hold the room inside it so
      // a pan can never reveal an empty edge. With zoom ruled out, cs is always
      // 1 and this is a pure translation.
      const px = Math.min(0, Math.max(this.view.w - this.scene.w * cs,
                                      this.view.w / 2 - cs * cx));
      const py = Math.min(0, Math.max(this.view.h - this.scene.h * cs,
                                      this.view.h / 2 - cs * cy));
      this.stage.style.transform = `translate(${px}px, ${py}px) scale(${cs})`;
      this.current = at;
    }

    /** Return the furthest any single layer travels between two beats, in pixels.
     *
     * Used to time a move. The furthest-travelling layer sets the pace, because
     * if the pace were set by an average then one object crossing the room
     * alongside a small nudge would arrive far too quickly.
     *
     * Args:
     *   a: Index of the beat being left.
     *   b: Index of the beat being reached.
     *
     * Returns:
     *   The largest distance any layer covers, in pixels.
     */
    spanOf(a, b) {
      const target = Math.max(0, Math.min(this.beats.length - 1, b));
      const start = Math.max(0, Math.min(this.beats.length - 1, a));
      const from = this.beats[start];
      const to = this.beats[target];
      // The routes walked on the way to this beat, so a journey round a corner
      // is timed by the ground actually covered rather than by the straight line
      // between its ends. Without this, walking two sides of a square would be
      // paced as though it were the diagonal, and the character would sprint.
      // A route is filed under the beat it arrives AT, so stepping backwards
      // retraces the route belonging to the beat being left, which is the later
      // of the two.
      const routes = this.paths[Math.max(start, target)] || {};
      // How far each layer travels, measured once. A jumping layer covers its
      // distance in no time at all, so it is never allowed to stretch a beat.
      const carried = this.rides[Math.max(start, target)] || {};
      const trip = (id) => {
        if (this.jumps[id]) return 0;
        // A CARRIED THING NEVER SETS THE PACE. It does not travel under its own
        // steam: it is placed from its carrier, so its distance is his distance
        // already counted once. Counting it again would only ever make a beat
        // longer than the walk inside it, and a walk stretched to fit is a walk
        // at the wrong speed.
        if (carried[id]) return 0;
        if (routes[id]) return routes[id].length;
        return Math.hypot(to.state[id].x - from.state[id].x,
                          to.state[id].y - from.state[id].y);
      };
      // The beat lasts as long as its LONGEST movement. Everything shorter runs
      // at the same speed and finishes early, which is what paint() does with
      // the distances recorded here.
      this.trips = {};
      let far = 0;
      for (const id of Object.keys(this.els)) {
        this.trips[id] = trip(id);
        far = Math.max(far, this.trips[id]);
      }
      this.furthest = far;
      // A camera move counts too, so a push-in is not over before it registers.
      return Math.max(far, Math.hypot(to.cam.cx - from.cam.cx, to.cam.cy - from.cam.cy));
    }

    /** Where a carried thing is, given where its carrier is and how they face.
     *
     * Both layers are positioned as an offset from their own home box, and the
     * two boxes are anchored differently: a character stands ON their tile so
     * their box hangs above it, while a prop is CENTRED on its tile. So the sum
     * goes through the world rather than between the offsets. Find the carrier's
     * feet in stage pixels, step one reach in the direction they are facing, and
     * put the middle of the load's box there.
     *
     * Working in world pixels is also what makes the answer independent of where
     * either layer happened to be declared, which is the only reason a prop can
     * change hands or be picked up on the far side of the room at all.
     *
     * Args:
     *   id: The layer being carried.
     *   carrier: The layer carrying it.
     *   spot: Where the carrier is this frame, from spotOf.
     *
     * Returns:
     *   The load's own [x, y] offset, as every other layer's is measured.
     */
    carriedAt(id, carrier, spot) {
      const load = this.boxes[id];
      const who = this.boxes[carrier];
      // Which way the carrier is turned, rounded because a facing is a whole
      // sheet row and a route hands back the row of the leg being walked.
      const [dx, dy] = heldAt(Math.round(spot.row));
      // The carrier's feet: the middle of their box across, its bottom down.
      const feetX = who.x + who.w / 2 + spot.x;
      const feetY = who.y + who.h + spot.y;
      return {
        x: feetX + dx - (load.x + load.w / 2),
        y: feetY + dy - (load.y + load.h / 2),
      };
    }

    /** Swap the picture a layer is showing, if this beat changed it.
     *
     * One mechanism covers two things that look different but are not: a
     * character changing pose sheet (walk to work, dark eyes to amber) and a
     * prop changing state (a terminal going from off to on). Both are the same
     * layer showing a different file, so both are this.
     *
     * Args:
     *   id: The layer's id.
     *   img: The picture it should be showing, or null to leave it alone.
     */
    paintImage(id, img) {
      // Nothing to do for a layer no beat ever repaints, which is most of them.
      if (!img) return;
      const el = this.els[id];
      // Only touch the style when the file actually changes. Rewriting the same
      // url every frame would make the browser re-resolve it sixty times a
      // second for no reason.
      if (el.dataset.img === img) return;
      el.dataset.img = img;
      el.style.backgroundImage = `url(${img})`;
    }

    /** Set a layer's width to the width of the pose it is currently showing.
     *
     * Only sheet layers ever need this, and only the ones whose scene swaps
     * their pose. Everything else passes undefined and keeps the box it was
     * declared with.
     *
     * The background is sized as a percentage of the element, so changing the
     * width rescales the sheet with it and the right cell still fills the frame.
     * That is why this is one line rather than a recalculation.
     *
     * Args:
     *   id: The layer's id.
     *   w: The on-screen width of the sheet being shown, or undefined to leave
     *     the declared width alone.
     *
     * Example:
     *   paintWidth('human', 66);  // the pointing sheet, against walking's 49
     */
    paintWidth(id, w) {
      // Nothing to do for the great majority of layers, which never change pose.
      if (w == null) return;
      // Only touch the style when the number actually changes, for the same
      // reason paintImage does: this runs on every layer on every frame.
      if (this.lastW[id] === w) return;
      this.lastW[id] = w;
      this.els[id].style.width = `${w}px`;
    }

    /** Decide how far forward a layer is drawn, from where it touches the floor.
     *
     * This is the one rule that makes a top-down room read as a room rather than
     * as a pile of stickers: whatever stands lower on the screen is nearer the
     * viewer, so it covers whatever stands higher up. It is worked out on every
     * paint, which means it stays right while things are moving — a character
     * walking down past a bench passes behind it and then in front of it, with
     * no beat having to say so.
     *
     * What counts is the ANCHOR LINE, where a layer meets the world: a
     * character's feet, a prop's tile centre, the foot of a board drawn
     * face-on. Using the bottom of the box instead would hide a card lying on a
     * counter behind the counter it is lying on, because the card's box bottom
     * sits half a tile higher than the counter's.
     *
     * Two layers anchored on the same line are separated by the order they were
     * declared in, which is why a scene lists its furniture before the things
     * that sit on it.
     *
     * Args:
     *   id: The layer's id.
     *   y: Its current vertical offset from its home box, in pixels.
     */
    paintDepth(id, y) {
      // A pinned layer opted out: the floor, a puddle, a speech bubble.
      if (this.pinned[id] != null) {
        if (this.lastZ[id] !== this.pinned[id]) {
          this.lastZ[id] = this.pinned[id];
          this.els[id].style.zIndex = this.pinned[id];
        }
        return;
      }
      const box = this.boxes[id];
      const anchor = this.anchors[id];
      // Room enough between whole pixels for every layer's declaration order to
      // fit, so a tie is broken without two layers ever colliding on one level.
      const z = Math.max(FLAT_Z + 1,
                         Math.round(box.y + anchor.line + y) * ORDERS + anchor.order);
      if (this.lastZ[id] === z) return;
      this.lastZ[id] = z;
      this.els[id].style.zIndex = z;
    }

    /** Show the right cell of a sprite sheet, and walk the legs if it is moving.
     *
     * Nothing has to declare that a character is walking. If the layer has moved
     * since the last paint it is walking, and when it stops it lands on the
     * standing frame. That keeps a beat's job to saying where someone ends up,
     * which is the only thing the scene actually cares about.
     *
     * Args:
     *   id: The layer's id.
     *   x: Its current horizontal offset, in pixels.
     *   y: Its current vertical offset, in pixels.
     *   row: Which line of the sheet to show, so which way it faces.
     */
    paintCell(id, x, y, row) {
      const [cols, rows] = this.sheets[id];
      const was = this.lastPos[id];
      // Moving if either axis changed by more than a hair since the last paint,
      // but never during a snap: jumping to a beat is not walking to it, and a
      // slide arrived at from the grid must show a standing character, not
      // someone frozen mid-stride.
      const moving = !this.snapping && was
        && (Math.abs(x - was.x) > MOVING || Math.abs(y - was.y) > MOVING);
      this.lastPos[id] = { x, y };
      // Hand the row to the cycler, because it repaints this layer between beats
      // and would otherwise lose which way the bubble's tail points.
      this.cycler.rows[id] = row;
      // A cycling layer steps through its columns on a clock regardless of
      // whether anything is moving. That is how the speech bubble's dots run:
      // none, one, two, three, and round again.
      const col = this.cycler.cycles[id]
        ? this.cycler.column(id)
        // Otherwise it is a character, who steps only while actually walking.
        : (moving
          ? WALK_CYCLE[Math.floor(performance.now() / WALK_MS) % WALK_CYCLE.length]
          : 1);
      // Percentage positioning: with the background blown up to the grid's size,
      // each step of 100/(count-1) percent lands exactly on the next cell.
      const px = (col / (cols - 1)) * 100;
      const py = (Math.round(row) / (rows - 1)) * 100;
      this.els[id].style.backgroundPosition = `${px}% ${py}%`;
    }

    /** Animate the playhead to a beat, easing in and out of rest. */
    travelTo(target) {
      if (this.raf) cancelAnimationFrame(this.raf);
      const from = this.current;
      const delta = target - from;
      if (delta === 0) return;
      // How long this beat takes and how its progress is shaped, both decided
      // purely by the furthest distance anything covers. Constant speed, no
      // ceiling, and linear whenever anything actually walks.
      const paced = paceOf(this.spanOf(Math.round(from), target));
      // A beat that plays a short sequence lasts as long as that sequence needs,
      // whatever its distances would otherwise have made it.
      const span = Math.max(paced.span, this.beats[target].hold || 0);
      const curve = paced.curve;
      this.span = span;
      const t0 = performance.now();
      const stepFrame = (now) => {
        const t = Math.min(1, (now - t0) / span);
        this.paint(from + delta * curve(t));
        if (t < 1) this.raf = requestAnimationFrame(stepFrame);
        else { this.paint(target); this.raf = null; }
      };
      this.raf = requestAnimationFrame(stepFrame);
    }

    // Beat n, reached with motion. Called by deck.js on every forward click.
    goToStop(n) {
      this.travelTo(Math.max(0, Math.min(this.beats.length - 1, n)));
    }

    // Beat n with no motion, for arriving on the slide and for grid jumps.
    snapToStop(n) {
      if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
      // Tell paintCell this is a jump rather than a walk, so nobody lands here
      // with a foot in the air.
      this.snapping = true;
      this.paint(Math.max(0, Math.min(this.beats.length - 1, n)));
      this.snapping = false;
    }

    // How many beats this scene has, which is what deck.js counts clicks against.
    get stopCount() { return this.beats.length; }
  }

  /* ── Registry ────────────────────────────────────────────────────────────
     Built once per element and chained onto scrub.js's lookup, so deck.js keeps
     asking one question ("does this slide have a scrubber?") and gets the right
     answer whichever kind of slide it is. */
  const byRoot = new WeakMap();

  function build() {
    document.querySelectorAll('.compose').forEach((root) => {
      if (byRoot.has(root)) return;
      // ONE BROKEN SCENE MUST NOT TAKE THE DECK WITH IT. A scene file that
      // fails to load, or names an asset that is not there, would otherwise
      // throw out of this loop and leave every slide after it unbuilt and the
      // whole deck unnavigable. In a lecture theatre a single blank slide is
      // survivable and a dead deck is not, so the failure is contained here and
      // shouted into the console where a rehearsal will find it.
      try {
        byRoot.set(root, new Composite(root));
      } catch (err) {
        console.error(`compose: scene "${root.dataset.scene}" failed to build`, err);
      }
    });
  }

  build();

  // Keep whatever scrub.js registered and fall through to it, rather than
  // replacing it: both kinds of slide have to work in the same deck. The old
  // object is captured first, because the line below rebinds window.scrub and a
  // delegated call must still run against the one that owns the frame slides.
  const prev = window.scrub;
  window.scrub = Object.assign({}, prev, {
    // Build both kinds, so a single call still wakes every slide in the deck.
    build() {
      if (prev && prev.build) prev.build();
      build();
    },
    forSlide(slide) {
      const root = slide && slide.querySelector('.compose');
      if (root && byRoot.has(root)) return byRoot.get(root);
      return prev && prev.forSlide ? prev.forSlide.call(prev, slide) : null;
    },
  });
})();
