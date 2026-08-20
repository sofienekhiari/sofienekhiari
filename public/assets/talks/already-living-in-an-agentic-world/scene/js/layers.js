/* ──────────────────────────────────────────────────────────────────────────
   Turning a scene description into elements on the page.

   One job, done once per scene when it is first built: read the list of layers
   and make a positioned element for each. Nothing here knows about beats, the
   playhead, or time. Splitting it out of compose.js leaves that file with a
   single job of its own, which is working out what a beat should look like and
   painting it.

   A "layer" is one thing that can move independently: a character, a prop, a
   speech bubble, a band of floor tiles. The element it becomes is a plain div
   with a background image, because a div can be transformed, faded and
   restacked far more cheaply than anything drawn into a canvas.
   ────────────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  // Where a flat-on-the-floor layer is drawn, shared with the rest of the deck.
  const { FLAT_Z, ORDERS } = window.motion;

  /** Build every element a scene needs, and report what was built.
   *
   * Args:
   *   stage: The element the layers are added to. It is sized to the scene here,
   *     because the camera transform is applied to it and it must be exactly the
   *     authored size for that transform to land where the scene expects.
   *   scene: The scene description, holding w, h and a list of layers.
   *
   * Returns:
   *   An object with five lookups, each keyed by layer id:
   *     els     the element itself
   *     sheets  the [columns, rows] grid of any layer that is a sprite sheet
   *     boxes   where the layer sits before any beat moves it
   *     pinned  a fixed stacking level, for layers that opt out of depth sorting
   *     cycles  how often a layer steps through its own columns, in milliseconds
   *     anchors where the layer touches the world, and where it was declared
   *     jumps   layers that land at a new position rather than travelling
   *
   * Example:
   *   const built = window.layers.build(stage, scene);
   *   built.els['clank'].style.opacity = 0;
   */
  function build(stage, scene) {
    // Author coordinates are fixed pixels inside the deck's 1280x720 surface.
    stage.style.width = scene.w + 'px';
    stage.style.height = scene.h + 'px';
    const els = {}, sheets = {}, boxes = {}, pinned = {}, cycles = {}, anchors = {};
    // Layers that land at their new position rather than travelling to it.
    const jumps = {};
    // Layers that are characters on legs rather than objects.
    const walkers = {};
    scene.layers.forEach((layer, order) => {
      const el = document.createElement('div');
      // The home box: where this layer sits before any beat moves it.
      const [x, y, w, h] = layer.box;
      el.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;`
        + `background-color:${layer.fill || 'transparent'};border-radius:${layer.r || 0}px;`
        // A plain layer shows one whole image. A sheet layer shows one cell of a
        // grid, so it is blown up by the grid's size and then slid to the cell
        // wanted, which is the standard way to read a sprite sheet in CSS.
        + (layer.sheet
          ? `background-size:${layer.sheet[0] * 100}% ${layer.sheet[1] * 100}%;`
          : `background-size:contain;background-repeat:no-repeat;background-position:center;`)
        // Pixel art must not be smoothed when it is scaled, or the hard edges
        // that make it read as pixel art turn to mush.
        + `image-rendering:pixelated;`
        + `will-change:transform,opacity;`
        // Anything a layer needs that the fields above do not cover: a repeating
        // floor tile, a clip, a border. Declared per layer and applied last, so a
        // layer can override any default above it without this file growing a
        // special case for one scene.
        + (layer.css || '');
      // A named look from the stylesheet, rather than inline style, for anything
      // that needs a pseudo element and so cannot be expressed inline.
      if (layer.cls) el.className = layer.cls;
      // The layer's own name, on the element. Nothing in the deck reads it, but
      // it is what lets a beat be checked against the brief by name rather than
      // by guessing from a file path, and several props share one picture.
      el.dataset.id = layer.id;
      // The picture this layer starts on. Recorded as well as applied, so the
      // per-beat swapper can tell whether a picture has actually changed before
      // touching the style. A layer with no image is still a plain coloured box,
      // which is how a scene gets blocked out before its art exists.
      if (layer.img) {
        el.style.backgroundImage = `url(${layer.img})`;
        el.dataset.img = layer.img;
      }
      // The grid of any sheet layer, which is what tells the painter to pick a
      // cell rather than show the whole image.
      if (layer.sheet) sheets[layer.id] = layer.sheet;
      // The home box, because depth is worked out from where this layer
      // currently is, and that moves as the layer moves.
      boxes[layer.id] = { x, y, w, h };
      // Its ANCHOR LINE: how far below the top of the box the layer touches the
      // world. A character's feet, a prop's tile centre, the foot of a board.
      // Depth is decided by that line rather than by the bottom of the box, so a
      // card lying on a counter is not hidden behind the counter it lies on.
      // The declaration order rides along as a tie-break, which is what puts an
      // object in front of the furniture it was declared after.
      // The order is SQUEEZED into the places one pixel of depth has to give,
      // rather than used raw. A scene with more layers than there are places
      // would otherwise have its late layers overflow into the pixel above and
      // be drawn in front of things standing nearer the viewer than they are.
      // Squeezing keeps every layer's relative order and cannot overflow; where
      // two neighbours collapse onto one place, they are drawn in the order they
      // appear on the page, which is the same order again.
      const fitted = Math.floor(order * ORDERS / Math.max(ORDERS, scene.layers.length));
      anchors[layer.id] = { line: layer.anchor != null ? layer.anchor : h, order: fitted };
      // A pinned layer opts out of depth sorting. `z` names the exact level;
      // `flat` is the shorthand for something lying ON the floor, like a puddle
      // or a wire, which everybody walks over rather than behind.
      if (layer.z != null) pinned[layer.id] = layer.z;
      else if (layer.flat) pinned[layer.id] = FLAT_Z;
      // A cycling layer advances one column every `cycle` milliseconds.
      if (layer.cycle) cycles[layer.id] = layer.cycle;
      // A jumping layer is somewhere new the instant a beat starts, and never
      // sets the pace of a beat, because it does not travel.
      if (layer.jump) jumps[layer.id] = true;
      // A walker is someone on legs. When anybody walks in a beat, the beat is
      // timed by them alone, so no prop can slow a person down.
      if (layer.walks) walkers[layer.id] = true;
      stage.appendChild(el);
      els[layer.id] = el;
    });
    return { els, sheets, boxes, pinned, cycles, anchors, jumps, walkers };
  }

  window.layers = { build };
})();
