/**
 * Regenerates the GitHub profile README from the single bio source.
 *
 * Decision D-12 ruled that the bio is authored once and every other surface is
 * generated from it. This script covers the surface Astro cannot reach: the
 * repository is `sofienekhiari/sofienekhiari`, so `README.md` at the repository
 * root is rendered on the GitHub profile page. It sits outside the built site,
 * which is why it needs a script rather than a page route.
 *
 * Run automatically by `npm run build`, after `astro build`.
 *
 * The generated file carries a warning header, because a human editing it by
 * hand would lose their work on the next build and should be told so.
 *
 * @example
 * ```bash
 * node scripts/write-profile-readme.ts
 * ```
 */

// Node's promise-based filesystem API, for a single atomic-enough write.
import { writeFile } from "node:fs/promises";
// Resolves paths relative to this file rather than to the current directory,
// so the script works no matter where npm happens to run it from.
import { fileURLToPath } from "node:url";
// Joins path segments without worrying about separators.
import { dirname, join } from "node:path";
// The one place the bio is authored (D-12).
import { profile } from "../src/data/profile.ts";

// Absolute path to this script's own directory.
const here = dirname(fileURLToPath(import.meta.url));
// The repository root is one level above scripts/.
const repoRoot = join(here, "..");
// The profile README GitHub renders on his user page.
const target = join(repoRoot, "README.md");

/**
 * Builds the full markdown document from the profile.
 *
 * @returns The complete README contents, ending with a trailing newline.
 */
function render(): string {
  // Collected lines, joined at the end. Building an array avoids repeated
  // string concatenation and keeps the ordering obvious.
  const lines: string[] = [];

  // A comment GitHub does not display, warning off manual edits.
  lines.push("<!-- Generated from src/data/profile.ts by scripts/write-profile-readme.ts.");
  lines.push("     Edit the bio there, then run `npm run build`. Manual edits here are lost. -->");
  // Blank line, because a markdown heading needs to start its own block.
  lines.push("");
  // The name as the document heading.
  lines.push(`# ${profile.name}`);
  lines.push("");
  // The role line, italicised so it reads as a subtitle rather than body text.
  lines.push(`*${profile.tagline}*`);
  lines.push("");
  // Where he works, linked to the research group.
  lines.push(`${profile.affiliation} · [research group](${profile.groupUrl})`);
  lines.push("");

  // Each bio paragraph, separated by a blank line so markdown keeps them apart.
  for (const paragraph of profile.bio) {
    // The paragraph text itself, unchanged from the source.
    lines.push(paragraph);
    // The blank line that terminates the markdown paragraph.
    lines.push("");
  }

  // A horizontal rule separating the prose from the links.
  lines.push("---");
  lines.push("");
  // Each contact link as a markdown bullet, label first so the list scans.
  for (const link of profile.links) {
    // One bullet per link, showing the readable form rather than the raw href.
    lines.push(`- **${link.label}** · [${link.display}](${link.href})`);
  }
  lines.push("");
  // A closing pointer to the site itself, which is the canonical version.
  lines.push("Full site, publications and talks: **[sofk.ch](https://sofk.ch)**");
  // Join with newlines and terminate the file properly.
  return lines.join("\n") + "\n";
}

// Render and write. Any failure here should fail the build loudly rather than
// leaving a stale README that disagrees with the site, so errors are not caught.
await writeFile(target, render(), "utf8");
// Confirm on stdout so the build log shows the file was refreshed.
console.log(`wrote ${target}`);
