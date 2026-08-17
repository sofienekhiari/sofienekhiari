// Astro build configuration for sofk.ch.
//
// Two rulings shape this file. D-02 chose to build locally and commit the
// output, so the build writes into `docs/`, which is the folder GitHub Pages
// already serves from. D-07 requires every word to be readable with JavaScript
// disabled, which Astro gives by default: components render to static HTML at
// build time and ship no client JavaScript unless a client directive asks for it.
//
// Warning worth keeping in mind when editing: Astro empties `outDir` on every
// build. Anything that must survive lives in `public/`, which is copied in
// afterwards. That is why `CNAME` and the profile image sit there and not in
// `docs/`.

// The typed config helper, which gives editor completion and validates keys.
import { defineConfig } from "astro/config";
// Tailwind v4 is a Vite plugin rather than a PostCSS plugin or an Astro
// integration, which is why it is registered under `vite` below (D-21).
import tailwindcss from "@tailwindcss/vite";

// `defineConfig` is exported as the module default because that is what the
// Astro CLI looks for when it loads this file.
export default defineConfig({
  // The canonical origin. Astro uses it to build absolute URLs in the sitemap
  // and in canonical tags, so it must match the domain in `public/CNAME`.
  site: "https://sofk.ch",

  // Write the built site straight into the folder GitHub Pages publishes.
  // Changing this breaks deployment, because Pages is configured to serve
  // `docs/` from the default branch (D-02).
  outDir: "./docs",

  // Emit `about/index.html` rather than `about.html`, so URLs have no file
  // extension and a trailing slash resolves the same as one without.
  // D-24 ruled clean directory URLs: /publications/ rather than
  // /publications.html. This is also Astro's default, and it is written out
  // explicitly because the ruling should be visible where it takes effect.
  build: {
    // Directory format keeps the published URLs clean, for example /talks/.
    format: "directory",
  },

  // Vite-level plugins. Tailwind v4 hooks in here (D-21).
  vite: {
    plugins: [tailwindcss()],
  },
});
