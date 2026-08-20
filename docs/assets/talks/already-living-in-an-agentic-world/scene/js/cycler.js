/* ──────────────────────────────────────────────────────────────────────────
   The one thing that keeps moving while a beat is held still.

   Everything else in this deck paints only while the playhead is travelling,
   which is right and deliberate: a held beat is meant to be completely still,
   because a single frame may stay on the projector for half a minute while
   Sofiene talks over it.

   The speech bubble is the exception, and it has to be. Its dots run none, one,
   two, three and round again, which is the animation every chat window shows
   while a model is thinking. A stopped ellipsis reads as a broken picture
   rather than as a pause, so it keeps going for as long as the frame is up.

   That is the whole reason this file exists, and why it is separate: it is the
   only part of the deck that owns a clock of its own.
   ────────────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  class Cycler {
    /** Start a clock for the cycling layers of one scene.
     *
     * Args:
     *   els: Every layer element of the scene, keyed by layer id.
     *   sheets: The [columns, rows] grid of each sheet layer, keyed by id.
     *   cycles: How long each cycling layer holds one column, in milliseconds,
     *     keyed by id. A scene with no bubble passes an empty object and this
     *     costs nothing at all.
     */
    constructor(els, sheets, cycles) {
      this.els = els;
      this.sheets = sheets;
      this.cycles = cycles;
      // When each cycling layer last became visible. Its cycle is measured from
      // there rather than from a page-wide clock, so every bubble starts empty.
      this.since = {};
      // Which row of its sheet each layer is currently on, written by the
      // painter, so this file can repaint a layer between beats without losing
      // which way its tail points.
      this.rows = {};
      this.tick();
    }

    /** Which column a cycling layer should be showing right now.
     *
     * EVERY BUBBLE STARTS EMPTY. The clock runs from the moment that bubble
     * became visible, not from a clock shared by the whole page, so a bubble
     * appearing always shows no dots first and then fills.
     *
     * This matters because a shared clock makes a new bubble start wherever the
     * last one happened to leave off, so a character can begin speaking already
     * mid-sentence with three dots showing. Speech should always look like it is
     * starting when it starts.
     *
     * Args:
     *   id: The layer to work out a column for.
     *
     * Returns:
     *   The column index to show, counting from 0 for the empty frame.
     */
    column(id) {
      const el = this.els[id];
      const [cols] = this.sheets[id];
      // Anything faded out is not speaking, so its clock is cleared and it waits
      // parked on the empty frame, ready to start cleanly next time it appears.
      const visible = parseFloat(el.style.opacity || '1') > 0.02;
      if (!visible) {
        this.since[id] = null;
        return 0;
      }
      // First paint since becoming visible: this is when its cycle begins.
      if (this.since[id] == null) this.since[id] = performance.now();
      return Math.floor((performance.now() - this.since[id]) / this.cycles[id]) % cols;
    }

    /** Advance every visible cycling layer, then ask to be run again.
     *
     * Touches only cycling layers, so a scene without a bubble on screen does no
     * work beyond one empty loop over an empty list.
     */
    tick() {
      // A preview is thrown away every time the presenter changes slide. Its
      // clock has to go with it: left running, every scene ever previewed would
      // keep ticking for the rest of the talk and keep its elements alive. One
      // layer being off the page is enough to tell, because they all live in the
      // same stage and leave it together.
      const ids = Object.keys(this.cycles);
      const first = ids.length ? this.els[ids[0]] : null;
      if (first && !first.isConnected) return;
      for (const id of ids) {
        const el = this.els[id];
        if (!el) continue;
        // An invisible bubble is still asked for its column, because that is what
        // clears its clock. Skipping it outright would leave the clock running,
        // and the next appearance would not start from empty.
        if (parseFloat(el.style.opacity || '1') <= 0.02) {
          this.column(id);
          continue;
        }
        const [cols, rows] = this.sheets[id];
        const col = this.column(id);
        // Percentage positioning: with the background blown up to the grid's
        // size, each step of 100/(count-1) percent lands exactly on the next cell.
        const px = (col / (cols - 1)) * 100;
        const py = (Math.round(this.rows[id] || 0) / (rows - 1)) * 100;
        el.style.backgroundPosition = `${px}% ${py}%`;
      }
      requestAnimationFrame(() => this.tick());
    }
  }

  window.Cycler = Cycler;
})();
