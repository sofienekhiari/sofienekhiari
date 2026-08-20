/* ──────────────────────────────────────────────────────────────────────────
   Playing a composited scene by itself, on a web page.

   In the talk the scenes were walked a click at a time: Sofiene pressed the
   space bar, one beat happened, and he talked over the picture until he was
   ready for the next one. A reader has nobody pressing anything, so the beats
   have to arrive on their own, and when the last one has played the sequence
   starts again from the top.

   This file adds nothing to the drawing. Every pixel is still drawn by the
   deck's own compositor, exactly as it was in the room. All that happens here
   is that a clock presses the button.

   Each scene is independent. Two of them on one page are two separate
   sequences, each with its own clock and its own controls, and neither ever
   waits for the other.
   ────────────────────────────────────────────────────────────────────────── */
(() => {
  "use strict";

  // How long a finished beat is held before the next one starts, in
  // milliseconds. The deck had no equivalent, because a person decided when to
  // move on; this is the reading pace that replaces them.
  const DWELL = 850;
  // How long the last beat is held before the sequence starts over, so the end
  // of a run reads as an ending rather than as a stutter.
  const REPLAY_PAUSE = 2200;
  // How long the picture fades down and back up across a restart. Short enough
  // to feel like a cut, long enough not to jump.
  const FADE = 260;

  // Whether the reader has asked their system for as little movement as
  // possible. Checked once here and honoured everywhere below: nothing starts
  // on its own, and the picture is placed on a still beat instead.
  const stillPlease = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  class Sequence {
    /** Take one scene on the page and give it a clock and a pair of controls.
     *
     * Args:
     *   root: The figure element wrapping one scene. It holds the `.compose`
     *     element the compositor has already built, the still image shown
     *     before the script runs, and the controls.
     *
     * Example:
     *   ```js
     *   new Sequence(document.querySelector(".scene-sequence"));
     *   ```
     */
    constructor(root) {
      this.root = root;
      // The compositor's object for this scene, which owns every beat and knows
      // how to paint any one of them. Asked for through the same lookup the deck
      // uses, so nothing here reaches inside the engine.
      this.scene = window.scrub && window.scrub.forSlide(root);
      // A scene that failed to build leaves the still image up and the controls
      // hidden, which is a worse page but never a broken one.
      if (!this.scene) return;
      // How many beats there are, and which one is showing.
      this.total = this.scene.stopCount;
      this.at = 0;
      // The timer for the next beat, so pausing can cancel it.
      this.timer = null;
      // Whether the clock is currently meant to be running.
      this.playing = false;

      // The pieces of the figure this file drives.
      this.panel = root.querySelector(".scene-panel");
      this.still = root.querySelector(".scene-still");
      this.button = root.querySelector(".scene-toggle");
      this.count = root.querySelector(".scene-count");
      this.rail = root.querySelector(".scene-rail-fill");

      // The live scene replaces the still image now that it is known to work.
      // Hiding rather than removing keeps the alt text in the document.
      if (this.still) this.still.hidden = true;
      this.panel.hidden = false;
      // The controls were hidden in the markup, because with no script they can
      // do nothing and a dead button is worse than no button.
      root.querySelector(".scene-controls").hidden = false;

      // The compositor draws at a fixed 720 by 400 whatever the page is doing,
      // so on anything narrower than the reading column the picture has to be
      // scaled down to fit. Watched rather than measured once, because the
      // reading column changes width when the window does.
      this.stage = root.querySelector(".compose");
      this.fit();
      new ResizeObserver(() => this.fit()).observe(this.panel);

      // Show the opening beat, and wire the one control up.
      this.show(stillPlease ? this.posterBeat() : 0);
      this.button.addEventListener("click", () => this.toggle());
      // Stop the clock whenever the figure is off screen, so a page with two
      // sequences on it is never animating one the reader cannot see.
      this.watch();
    }

    /** Scale the fixed-size picture so it exactly fills the box it is in.
     *
     * The compositor set the scene's own width in pixels when it built it, so
     * that number is read back off the element rather than assumed, and the
     * scene is shrunk by however much it overflows.
     */
    fit() {
      const drawn = parseFloat(this.stage.style.width) || this.panel.clientWidth;
      this.stage.style.transform = `scale(${this.panel.clientWidth / drawn})`;
    }

    /** Which beat to rest on when nothing is playing.
     *
     * A scene's own last beat is not always its most telling picture: the plant
     * watering ends back on the empty room it started from. The page says which
     * frame to rest on with `data-poster`, and falls back to the last one.
     *
     * Returns:
     *   The index of the beat to show while the sequence is stopped.
     */
    posterBeat() {
      const asked = parseInt(this.root.dataset.poster || "", 10);
      return Number.isFinite(asked) ? asked : this.total - 1;
    }

    /** Paint one beat immediately, with no travel, and update the readout.
     *
     * Args:
     *   n: Which beat, counting from zero.
     */
    show(n) {
      this.at = n;
      this.scene.snapToStop(n);
      this.report();
    }

    /** Keep the beat counter and the progress rail honest. */
    report() {
      this.count.textContent = `Beat ${this.at + 1} of ${this.total}`;
      this.rail.style.width = `${((this.at + 1) / this.total) * 100}%`;
    }

    /** Play the next beat, then book the one after it.
     *
     * The compositor works out how long a beat takes from how far anything in
     * it travels, and records that on itself, so the wait is the scene's own
     * timing rather than a number guessed here.
     */
    step() {
      // Past the end: hold, then fade out, restart from the top, and fade back.
      if (this.at + 1 >= this.total) {
        this.timer = setTimeout(() => {
          this.panel.style.opacity = "0";
          this.timer = setTimeout(() => {
            this.show(0);
            this.panel.style.opacity = "1";
            this.timer = setTimeout(() => this.step(), FADE);
          }, FADE);
        }, REPLAY_PAUSE);
        return;
      }
      this.at += 1;
      this.scene.goToStop(this.at);
      this.report();
      this.timer = setTimeout(() => this.step(), (this.scene.span || 0) + DWELL);
    }

    /** Start the clock, from the top if the sequence has already finished. */
    play() {
      if (this.playing) return;
      this.playing = true;
      this.button.setAttribute("aria-pressed", "true");
      this.button.querySelector(".scene-toggle-label").textContent = "Pause";
      // Coming back to a sequence that was resting on its poster beat should
      // start the story again rather than resume from the middle of it.
      if (this.at + 1 >= this.total || stillPlease) this.show(0);
      this.timer = setTimeout(() => this.step(), 400);
    }

    /** Stop the clock and leave the picture exactly where it is. */
    pause() {
      this.playing = false;
      clearTimeout(this.timer);
      this.timer = null;
      this.panel.style.opacity = "1";
      this.button.setAttribute("aria-pressed", "false");
      this.button.querySelector(".scene-toggle-label").textContent = "Play";
    }

    /** Swap between the two, which is what the one button does. */
    toggle() {
      if (this.playing) this.pause();
      else this.play();
    }

    /** Run only while the figure is actually on screen.
     *
     * Two things at once: it starts the sequence the first time the reader
     * reaches it, and it stops the sequence the moment they scroll past. A
     * reader who has asked for reduced motion gets neither, and starts it
     * themselves if they want it.
     */
    watch() {
      if (stillPlease) return;
      const eye = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) this.play();
            else this.pause();
          }
        },
        // A little of the figure showing is not enough; a third of it is.
        { threshold: 0.33 },
      );
      eye.observe(this.root);
    }
  }

  // One sequence per scene on the page, built as soon as this file runs. It is
  // loaded after the compositor, so every scene is already drawn by now.
  document.querySelectorAll(".scene-sequence").forEach((root) => new Sequence(root));
})();
