/**
 * Content collection schemas.
 *
 * Both lists on this site are collections. Talks are written articles rather
 * than published slides (D-19), so they were always going to be documents with
 * bodies. Publications became a collection too under D-25, chosen over a typed
 * array so that the whole site has exactly one way to add something: create a
 * small file.
 *
 * The schema is the point. A publication with a missing DOI, or a talk with a
 * malformed date, fails the build rather than reaching the published site.
 *
 * @example
 * ```ts
 * import { getCollection } from "astro:content";
 * const papers = await getCollection("publications");
 * const talks = await getCollection("talks");
 * ```
 */

// `defineCollection` describes a collection; `z` is Astro's bundled Zod, used
// to declare what a valid entry looks like.
import { defineCollection, z } from "astro:content";
// The glob loader reads entries from files on disk. Astro requires an explicit
// loader rather than inferring the directory.
import { glob } from "astro/loaders";

// Every talk that has been given, written up as prose (D-19).
const talks = defineCollection({
  // Read every markdown file directly inside src/content/talks.
  loader: glob({ pattern: "**/*.md", base: "./src/content/talks" }),
  // The frontmatter contract each talk file must satisfy.
  schema: z.object({
    // Headline of the write-up, used as the H1 and in the talks index.
    title: z.string(),
    // One sentence shown in the index so a reader can decide whether to open it.
    description: z.string(),
    // The date the talk was delivered, not the date it was written up.
    // Coerced so a bare YYYY-MM-DD in frontmatter becomes a real Date.
    date: z.coerce.date(),
    // Where it was given, for example "PhD Summer School, Neuchatel".
    venue: z.string(),
    // Keeps an unfinished write-up out of the published index. D-19 makes the
    // writing the slow part, so a talk will often exist here before it is ready.
    draft: z.boolean().default(false),
  }),
});

// Publications and preprints (D-25). The body is optional: most entries are
// metadata only, but the collection leaves room to write about a paper later
// without having to restructure anything.
const publications = defineCollection({
  // Same loader and pattern as talks, so adding either feels identical.
  loader: glob({ pattern: "**/*.md", base: "./src/content/publications" }),
  // The frontmatter contract each publication file must satisfy.
  schema: z.object({
    // Full title, exactly as on the published record.
    title: z.string(),
    // Every author in order, written as they appear on the paper.
    authors: z.array(z.string()).nonempty(),
    // Journal or preprint server, for example "arXiv".
    venue: z.string(),
    // Labels the entry honestly rather than letting a preprint read as
    // peer reviewed, which matters on a page academics will read.
    preprint: z.boolean().default(false),
    // Publication date. Month precision is enough and is valid ISO 8601.
    date: z.coerce.date(),
    // Bare DOI with no resolver prefix, so the prefix is added once at render.
    // The pattern rejects a pasted full URL, which is the likely mistake.
    doi: z.string().regex(/^10\.\d{4,9}\/\S+$/, "expected a bare DOI, not a URL"),
    // Subject labels, ordered from most to least specific.
    tags: z.array(z.string()).default([]),
  }),
});

// Astro reads this export to discover every collection in the project.
export const collections = { talks, publications };
