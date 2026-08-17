/**
 * The single source of truth for who Sofiene is.
 *
 * Decision D-12 ruled that the bio is authored in exactly one place and every
 * other surface is generated from it. Three surfaces read this file: the home
 * page hero, the generated `llms.txt`, and the GitHub profile `README.md`.
 * Editing the text here changes all three on the next build, which is the whole
 * point: before this file existed the three copies drifted apart and ended up
 * making different claims about the same person.
 *
 * Dates come from decision D-11, which ruled that the dates shown on the page
 * were the correct ones and the older `llms.txt` dates were stale.
 *
 * @example
 * ```ts
 * import { profile } from "../data/profile";
 * console.log(profile.name);        // "Sofiene Khiari"
 * console.log(profile.bio[0]);      // the first bio paragraph
 * ```
 */

/** A single outbound link, used for the contact list and for JSON-LD `sameAs`. */
export interface ProfileLink {
  /** Short human label, for example "GitHub". */
  label: string;
  /** Fully qualified destination, including the scheme. */
  href: string;
  /** How the link should read when shown as plain text rather than as a label. */
  display: string;
}

/** Everything the site knows about its owner, in one object. */
export interface Profile {
  /** Full name, exactly as it should appear as an H1 and in JSON-LD. */
  name: string;
  /** The one-line role, used under the name and as the page title suffix. */
  tagline: string;
  /** Research group and institution, shown as a quiet line under the tagline. */
  affiliation: string;
  /** Institution homepage, so the affiliation line can be a link. */
  affiliationUrl: string;
  /** Research group homepage, linked from the first bio paragraph. */
  groupUrl: string;
  /** One entry per paragraph of the canonical bio, in reading order. */
  bio: string[];
  /** A single sentence for machine summaries, kept shorter than the full bio. */
  summary: string;
  /** Contact and social links, in the order they should be displayed. */
  links: ProfileLink[];
}

// The exported constant every surface imports. Declared `as const satisfies`
// so the shape is checked against Profile while the literal types survive,
// which lets consumers rely on the exact number of bio paragraphs.
export const profile = {
  // Full name, used as the H1 on the home page and as JSON-LD `name`.
  name: "Sofiene Khiari",
  // The role line. Written with an ampersand rather than the word "and"
  // because it sits directly under the name and needs to stay on one line.
  tagline: "Pharmacist & Software Developer",
  // Shown in small monospace under the tagline to place him immediately.
  affiliation: "Computational Pharmacy Group, University of Basel",
  // Linked from the affiliation line and used as JSON-LD `affiliation.url`.
  affiliationUrl: "https://www.unibas.ch/en.html",
  // The research group itself, linked from the first bio paragraph.
  groupUrl:
    "https://pharma.unibas.ch/en/research/research-groups/computational-pharmacy/",
  // The canonical bio, one string per paragraph. This is the text that the
  // hero, llms.txt and the profile README all render, so it is written to work
  // in all three places: no markup, no em-dashes, and no site-specific phrasing.
  bio: [
    // Paragraph one places him: role, institution, and what he actually works on.
    "I'm a driven pharmacist currently pursuing a PhD in the Computational Pharmacy Group at the University of Basel, where I blend my passion for Pharmaceutical Sciences and Computer Sciences to push the boundaries of what's possible in drug discovery.",
    // Paragraph two is the open-source and open-science position.
    "As a staunch advocate of Open Source Software and Open Science, I'm committed to contributing to the community and fostering a spirit of collaboration. I believe that the future of pharmaceutical innovation lies at the intersection of cutting-edge computational methods and traditional pharmaceutical expertise, a space where I thrive.",
    // Paragraph three is the motivation, and carries the line he cares most about.
    "Driven by a desire to make a tangible difference, I strive to develop groundbreaking pharmaceutical technologies that don't just advance the science, but do so with a keen focus on R&D costs and accessibility. My work is guided by a simple yet powerful principle: transformative solutions should be within reach for those who need them most.",
    // Paragraph four is the invitation to make contact, and closes the page.
    "Whether you're interested in collaboration, innovation, or exploring how computational approaches can revolutionize pharmaceutical research, I'd love to connect.",
  ],
  // A compressed single sentence. llms.txt wants a short blockquote summary
  // rather than four paragraphs, so that summary is authored here rather than
  // being machine-truncated from the bio, which would cut mid-sentence.
  summary:
    "Pharmacist and software developer, pursuing a PhD in the Computational Pharmacy Group at the University of Basel. Works on deep learning and agentic AI for molecular docking and drug discovery, and advocates for open source software and open science.",
  // Contact links in display order. `display` exists because the site shows
  // these as plain monospace text rather than as labelled buttons.
  links: [
    // Email first, because it is the action most visitors actually want.
    { label: "Email", href: "mailto:research@sofk.ch", display: "research@sofk.ch" },
    // GitHub second: the code is the evidence for half of the tagline.
    { label: "GitHub", href: "https://github.com/sofienekhiari", display: "github.com/sofienekhiari" },
    // LinkedIn last, as the most conventional and least informative of the three.
    { label: "LinkedIn", href: "https://www.linkedin.com/in/khiarisofiene", display: "linkedin.com/in/khiarisofiene" },
  ],
} as const satisfies Profile;
