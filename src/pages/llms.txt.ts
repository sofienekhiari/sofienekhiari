/**
 * Generates `/llms.txt` at build time.
 *
 * Decision D-15 ruled that the file stays but is generated from the site's own
 * content rather than hand-maintained, because hand-maintaining it is exactly
 * how it came to claim a freelance role the site does not mention and dates the
 * page disagreed with (D-10, D-11).
 *
 * The output follows the llmstxt.org format: an H1, a blockquote summary, then
 * H2 sections whose every list item is a markdown link with optional notes. The
 * old file broke that rule in its Contact section, which listed a bare email
 * address and two bare URLs; here every item is a real link.
 *
 * @example
 * ```
 * curl https://sofk.ch/llms.txt
 * ```
 */

// The type of a static endpoint, so the signature is checked at build time.
import type { APIRoute } from "astro";
// Reads both collections so the file lists real entries, never a guess.
import { getCollection } from "astro:content";
// The single bio source (D-12).
import { profile } from "../data/profile.ts";

// Astro prerenders this route to a static file during `astro build`.
export const prerender = true;

/** Builds the llms.txt body. */
async function render(): Promise<string> {
  // Published talks only: a draft write-up must not be advertised.
  const talks = (await getCollection("talks")).filter((t) => !t.data.draft);
  // Publications, newest first, since a reader scans for the most recent work.
  const publications = (await getCollection("publications")).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
  // Accumulated lines, joined at the end.
  const lines: string[] = [];

  // The H1, which the format requires and allows only one of.
  lines.push(`# ${profile.name}`);
  lines.push("");
  // The blockquote summary, authored in profile.ts rather than truncated here.
  lines.push(`> ${profile.summary}`);
  lines.push("");

  // The three real pages, which only became worth listing once D-03 split the
  // site up. Before that every link was an anchor on one document.
  lines.push("## Pages");
  lines.push("");
  lines.push(`- [Home](https://sofk.ch/): Biography and the full academic and professional history, presented as a git commit log.`);
  lines.push(`- [Publications](https://sofk.ch/publications/): Peer-reviewed publications and preprints in computational pharmacy, molecular docking and drug discovery.`);
  lines.push(`- [Talks](https://sofk.ch/talks/): Talks given, each rewritten as a readable article rather than published as slides.`);
  lines.push("");

  // Every publication, so an agent gets the citation without fetching the page.
  lines.push("## Publications");
  lines.push("");
  for (const pub of publications) {
    // Preprints are labelled honestly rather than passed off as peer reviewed.
    const status = pub.data.preprint ? "preprint" : "peer-reviewed";
    // The publication year, which is all a reader needs to place the work.
    const year = pub.data.date.getUTCFullYear();
    // One markdown link per entry, with the venue, year and status as notes.
    lines.push(`- [${pub.data.title}](https://doi.org/${pub.data.doi}): ${pub.data.authors.join(", ")}. ${pub.data.venue}, ${year}, ${status}.`);
  }
  lines.push("");

  // Talks, or an honest note when there are none yet rather than an empty H2.
  lines.push("## Talks");
  lines.push("");
  if (talks.length === 0) {
    // Says plainly that nothing is published yet, which is true and useful.
    lines.push("- No talk write-ups are published yet.");
  } else {
    for (const talk of talks) {
      // The delivery year, which is what a reader wants to place a talk.
      const year = talk.data.date.getUTCFullYear();
      lines.push(`- [${talk.data.title}](https://sofk.ch/talks/${talk.id}/): ${talk.data.venue}, ${year}. ${talk.data.description}`);
    }
  }
  lines.push("");

  // Contact, with every item a proper markdown link. This is the section the
  // previous hand-written file got wrong.
  lines.push("## Contact");
  lines.push("");
  for (const link of profile.links) {
    lines.push(`- [${link.label}](${link.href}): ${link.display}`);
  }
  // Terminate the file with a single trailing newline.
  return lines.join("\n") + "\n";
}

// The endpoint itself. Returns plain text so a crawler is not served HTML.
export const GET: APIRoute = async () =>
  new Response(await render(), {
    // UTF-8 matters: the bio and the venue names carry accented characters.
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
