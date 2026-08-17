/**
 * The experience timeline, modelled as a git history.
 *
 * Three rulings govern this file. D-06 kept the git-log metaphor but asked for
 * the execution to be rebuilt. D-14 ruled that the seven-character commit hashes
 * stay even though they are invented, because they are what makes the device
 * read as a git log rather than as a list in a monospace font. D-11 ruled that
 * the dates shown on the old page were the correct ones, so the PhD begins in
 * January 2025 and the MSc runs to December 2024.
 *
 * The hashes are deliberately stable strings rather than generated values: they
 * appear in the published HTML, and a hash that changed on every build would
 * make every rebuild produce a spurious diff.
 *
 * Entries are listed newest first, which is the order `git log` prints.
 *
 * @example
 * ```ts
 * import { experience } from "../data/experience";
 * const current = experience.find((e) => e.kind === "working");
 * ```
 */

/** Which visual lane an entry sits in, mirroring a git graph. */
export type Lane = "main" | "branch";

/** How an entry is drawn and coloured. */
export type EntryKind = "working" | "academic" | "professional";

/** A downloadable document attached to an entry, such as a diploma. */
export interface EntryDocument {
  /** What the document is, for example "Diploma" or "Transcript of records". */
  label: string;
  /** Path under /assets/documents/, kept identical to the previous site's URLs
   *  so any link shared before the rebuild still resolves. */
  href: string;
}

/** One line of the career history. */
export interface Entry {
  /** Invented seven-character commit hash, or null for uncommitted work (D-14). */
  hash: string | null;
  /** Conventional-commit prefix: build, feat, spike or init. */
  prefix: string;
  /** The commit message, which is the role or qualification itself. */
  message: string;
  /** Institution or employer, shown as the author line. */
  org: string;
  /** Human-readable period, for example "September 2021 to December 2024". */
  period: string;
  /** Graph lane: the main line, or the internships branch. */
  lane: Lane;
  /** Drives colour and node styling. */
  kind: EntryKind;
  /** The longer description, shown when the entry is expanded. */
  detail: string;
  /** Certificates and supporting documents. D-22 ruled these are published and
   *  linked from their entry rather than left reachable but unlinked. */
  documents?: EntryDocument[];
}

// Newest first, exactly as `git log` orders its output.
export const experience: Entry[] = [
  {
    // The PhD is in progress, so it has no hash: it is an uncommitted change.
    hash: null,
    prefix: "build",
    message: "Obtain Doctor of Philosophy diploma",
    org: "University of Basel, Computational Pharmacy Group",
    // D-11 ruled this start date correct against the stale llms.txt value.
    period: "from January 2025",
    lane: "main",
    kind: "working",
    detail:
      "Developing LLM-based agentic AI systems for researchers working in computer-based drug design, to support decision making in lead selection, under the supervision of Prof. Markus A. Lill.",
  },
  {
    hash: "8b2e4f1",
    prefix: "build",
    message: "Obtain MSc Drug Sciences diploma",
    org: "University of Basel",
    // D-11: conferred 12 December 2024, which the old llms.txt had as 2023.
    period: "September 2021 to December 2024",
    lane: "main",
    kind: "academic",
    detail:
      "Master of Science in Drug Sciences, in the field of Pharmaceutical Sciences. Conferred by the Faculty of Science on 12 December 2024.",
    // Four documents belong to this degree (D-22). Paths match the previous
    // site exactly, so nothing that was already shared breaks.
    documents: [
      { label: "Diploma", href: "/assets/documents/msc_drug_sciences_degree.pdf" },
      { label: "Transcript of records", href: "/assets/documents/msc_drug_sciences_degree_transcript.pdf" },
      { label: "Diploma supplement (EN)", href: "/assets/documents/msc_drug_sciences_degree_supplement_en.pdf" },
      { label: "Diploma supplement (DE)", href: "/assets/documents/msc_drug_sciences_degree_supplement_de.pdf" },
    ],
  },
  {
    hash: "5c9a3d2",
    prefix: "build",
    message: "Obtain Pharmaciae Doctor diploma",
    org: "University of Monastir, Tunisia",
    period: "September 2010 to February 2019",
    lane: "main",
    kind: "academic",
    detail:
      "Field: Pharmacy, with a minor in Industrial Pharmacy. Thesis, September 2018 to February 2019: a comparison between two disinfectants used in the production of cytotoxic drugs in a cytotoxic safety station.",
    // The original is in Arabic, so the certified German translation is offered
    // beside it rather than instead of it (D-22).
    documents: [
      { label: "Diploma (AR)", href: "/assets/documents/pharm_d_degree_ar.pdf" },
      { label: "Certified translation (DE)", href: "/assets/documents/pharm_d_degree_ar_de_translation.pdf" },
    ],
  },
  {
    hash: "7f1b8e3",
    prefix: "feat",
    message: "Complete internship at Bone Marrow Transplantation Center",
    org: "National Center for Bone Marrow Transplantation, Tunisia",
    period: "March to August 2018",
    lane: "branch",
    kind: "professional",
    detail:
      "Management of drugs and medical products, pharmaceutical analysis and validation of prescriptions, securing the drug circuit, prevention of drug iatrogenesis, therapeutic education, preparation of cancer drugs as magistral preparations, pharmacovigilance and material monitoring, and clinical studies.",
  },
  {
    hash: "2d6c4a9",
    prefix: "feat",
    message: "Complete internship at a local pharmacy",
    org: "Local pharmacy, Tunisia",
    period: "December 2017 to February 2018",
    lane: "branch",
    kind: "professional",
    detail: "Medication dispensing and patient counselling.",
  },
  {
    hash: "9e3f7b1",
    prefix: "feat",
    message: "Complete internship at Saïd pharmaceutical industry",
    org: "Saïd pharmaceutical industry, Tunisia",
    period: "September to November 2017",
    lane: "branch",
    kind: "professional",
    detail:
      "An overview of the work across every department of a pharmaceutical manufacturer. Built an Excel matrix to speed up the evaluation of elementary impurities during drug production, following ICH guideline Q3D step 4.",
  },
  {
    hash: "4a8d2c6",
    prefix: "spike",
    message: "Complete training at Mongi-Slim Hospital",
    org: "Mongi-Slim Hospital, Marsa, Tunisia",
    period: "August 2016",
    lane: "branch",
    kind: "professional",
    detail: "An overview of nursing work in a clinical anaesthesia department.",
  },
  {
    hash: "1b5e9f4",
    prefix: "spike",
    message: "Complete training at a local pharmacy",
    org: "Local pharmacy, Tunisia",
    period: "August 2013",
    lane: "branch",
    kind: "professional",
    detail: "A first overview of day to day work in a local pharmacy.",
  },
  {
    // `init` is the first commit of the history, which is what a Baccalauréat is.
    hash: "3f7b2e5",
    prefix: "init",
    message: "Obtain Baccalauréat diploma",
    org: "Lycée pilote Bourguiba de Tunis, Tunisia",
    period: "September 2006 to July 2010",
    lane: "main",
    kind: "academic",
    detail: "Final grade 17.37 out of 20, equivalent to 5.2 out of 6, comparable to the Swiss Matura.",
  },
];
