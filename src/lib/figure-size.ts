/**
 * Reading a picture's own size off the file, at build time.
 *
 * A figure with no width and height on it makes the page jump: the browser
 * lays the text out with the image taking no room, downloads it, and then
 * shoves everything below it down. Every figure on the site therefore carries
 * its real dimensions, and this is where they come from.
 *
 * They are read from the file rather than typed into the page because a number
 * typed by hand is a number that goes wrong the first time a picture is
 * replaced, and it goes wrong silently. Nothing here resizes or re-encodes
 * anything: it opens the first few bytes, finds the two numbers, and stops.
 *
 * Only the three formats the site actually publishes are understood, which are
 * SVG for the diagrams and WebP and PNG for everything else. An unknown format
 * is an error rather than a guess, so a picture in a format nobody planned for
 * stops the build instead of shipping without its dimensions.
 *
 * @example
 * ```ts
 * const size = figureSize("/assets/talks/a-talk/figures/loop.svg");
 * // { width: 672, height: 536 }
 * ```
 */

// Reading the file straight off disk. These run during the build, in Node,
// never in a browser.
import { readFileSync } from "node:fs";
// Turning a site path such as /assets/x.webp into a path on this machine.
import { join } from "node:path";

/** The intrinsic size of one picture, in its own pixels. */
export interface FigureSize {
  /** How many pixels wide the picture is. */
  width: number;
  /** How many pixels tall the picture is. */
  height: number;
}

/**
 * Finds how big a picture in `public/` is.
 *
 * @param src - The picture's URL on the site, for example
 *   `/assets/talks/a-talk/figures/loop.svg`. It must start with a slash,
 *   because everything this reads lives in `public/`.
 * @returns The picture's width and height in its own pixels.
 * @throws If the file is missing, or is not an SVG, a WebP or a PNG, or is one
 *   of those but carries no readable size.
 * @example
 * ```ts
 * figureSize("/assets/talks/a-talk/figures/photo.webp"); // { width: 1440, height: 610 }
 * ```
 */
export function figureSize(src: string): FigureSize {
  // Everything served from `public/` appears at the site root, so the path on
  // disk is that folder plus the URL.
  const bytes = readFileSync(join(process.cwd(), "public", src));

  // SVG is text, so its size is written in the markup rather than in a header.
  if (src.endsWith(".svg")) {
    // Only the opening tag can carry these, and it is always at the top.
    const head = bytes.toString("utf8", 0, 1024);
    // A viewBox is the reliable one: it is present on every drawing the deck
    // produced, and it gives the drawing's own coordinate space.
    const box = head.match(/viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/);
    if (box) return { width: Math.round(+box[1]), height: Math.round(+box[2]) };
    // Failing that, the plain width and height attributes, if they are in pixels.
    const w = head.match(/\bwidth="(\d+)"/);
    const h = head.match(/\bheight="(\d+)"/);
    if (w && h) return { width: +w[1], height: +h[1] };
    throw new Error(`figureSize: no viewBox or size on ${src}`);
  }

  // PNG puts its size in the IHDR chunk, which is always the first one, so the
  // two numbers sit at a fixed offset from the start of the file.
  if (src.endsWith(".png")) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }

  // WebP is a RIFF file whose fourth chunk tag says which of three encodings it
  // is, and each one stores its size differently.
  if (src.endsWith(".webp")) {
    const kind = bytes.toString("ascii", 12, 16);
    // Extended WebP, which is what a file with transparency or metadata becomes.
    // It carries the canvas size as two 24 bit numbers, each one short of the
    // real value.
    if (kind === "VP8X") {
      return {
        width: bytes.readUIntLE(24, 3) + 1,
        height: bytes.readUIntLE(27, 3) + 1,
      };
    }
    // Lossless WebP packs both numbers, each one short, into 28 bits.
    if (kind === "VP8L") {
      const packed = bytes.readUInt32LE(21);
      return {
        width: (packed & 0x3fff) + 1,
        height: ((packed >> 14) & 0x3fff) + 1,
      };
    }
    // Plain lossy WebP, which is a VP8 keyframe with its size in the header.
    if (kind === "VP8 ") {
      return {
        width: bytes.readUInt16LE(26) & 0x3fff,
        height: bytes.readUInt16LE(28) & 0x3fff,
      };
    }
    throw new Error(`figureSize: unrecognised WebP chunk "${kind}" in ${src}`);
  }

  throw new Error(`figureSize: unsupported format for ${src}`);
}
