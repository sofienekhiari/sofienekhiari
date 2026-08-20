/**
 * The experience and education history, newest first.
 *
 * This was previously modelled as a git commit graph. D-30 retired that
 * metaphor along with the invented commit hashes it needed (D-06 and D-14 are
 * both superseded), so the shape here is now a plain chronological list: a
 * period, a role, an organisation, and the detail behind it.
 *
 * The academic and professional distinction that used to drive two accent
 * colours is gone too. The design carries exactly one accent (D-32), so the
 * only visual distinction left is whether an entry is the current one.
 *
 * Dates come from D-11, which ruled that the dates shown on the page were the
 * correct ones and the older llms.txt dates were stale.
 *
 * @example
 * ```ts
 * import { experience } from "../data/experience";
 * const now = experience.find((entry) => entry.current);
 * ```
 */

/** A downloadable document attached to an entry, such as a diploma. */
export interface EntryDocument {
  /** What the document is, for example "Diploma" or "Transcript of records". */
  label: string;
  /** Path under /assets/documents/, kept identical to the previous site's URLs
   *  so any link shared before the rebuild still resolves. Nothing links these
   *  today (D-37), but the files are still served from that path. */
  href: string;
}

/** One line of the history. */
export interface Entry {
  /** Human-readable period, for example "September 2021 to December 2024". */
  period: string;
  /** The qualification or position itself, shown as the entry's title. */
  role: string;
  /** Institution or employer, shown quietly beneath the role. */
  org: string;
  /** True for the one entry still in progress, which is marked with the accent. */
  current?: boolean;
  /** The longer description, shown when the entry is expanded. */
  detail: string;
  /** Certificates and supporting documents.
   *
   *  NOT CURRENTLY RENDERED. D-37 removed the links from the site because
   *  Sofiene is undecided about publishing his diplomas and a full transcript.
   *  The data is kept deliberately rather than deleted, so that restoring the
   *  links later is one block of markup in CareerList.astro instead of having
   *  to reconstruct which file belongs to which entry. Do not render it again
   *  without a decision from him. */
  documents?: EntryDocument[];
}

// Newest first, which is the order a reader scans a history in.
export const experience: Entry[] = [
  {
    // The only entry in progress, so the only one carrying the accent.
    period: "From January 2025",
    role: "Doctor of Philosophy",
    org: "University of Basel, Computational Pharmacy Group",
    current: true,
    detail:
      "Developing LLM-based agentic AI systems for researchers working in computer-based drug design, to support decision making in lead selection, under the supervision of Prof. Markus A. Lill.",
  },
  {
    period: "September 2021 to December 2024",
    role: "MSc Drug Sciences",
    org: "University of Basel",
    detail:
      "Master of Science in Drug Sciences, in the field of Pharmaceutical Sciences. Conferred by the Faculty of Science on 12 December 2024.",
    // Four documents belong to this degree. Paths match the previous site
    // exactly, so nothing that was already shared breaks.
    documents: [
      { label: "Diploma", href: "/assets/documents/msc_drug_sciences_degree.pdf" },
      { label: "Transcript of records", href: "/assets/documents/msc_drug_sciences_degree_transcript.pdf" },
      { label: "Diploma supplement (EN)", href: "/assets/documents/msc_drug_sciences_degree_supplement_en.pdf" },
      { label: "Diploma supplement (DE)", href: "/assets/documents/msc_drug_sciences_degree_supplement_de.pdf" },
    ],
  },
  {
    period: "September 2010 to February 2019",
    role: "Pharmaciae Doctor",
    org: "University of Monastir, Tunisia",
    detail:
      "Field: Pharmacy, with a minor in Industrial Pharmacy. Thesis, September 2018 to February 2019: a comparison between two disinfectants used in the production of cytotoxic drugs in a cytotoxic safety station.",
    // The original is in Arabic, so the certified German translation is offered
    // beside it rather than instead of it.
    documents: [
      { label: "Diploma (AR)", href: "/assets/documents/pharm_d_degree_ar.pdf" },
      { label: "Certified translation (DE)", href: "/assets/documents/pharm_d_degree_ar_de_translation.pdf" },
    ],
  },
  {
    period: "March to August 2018",
    role: "Internship, bone marrow transplantation",
    org: "National Center for Bone Marrow Transplantation, Tunisia",
    detail:
      "Management of drugs and medical products, pharmaceutical analysis and validation of prescriptions, securing the drug circuit, prevention of drug iatrogenesis, therapeutic education, preparation of cancer drugs as magistral preparations, pharmacovigilance and material monitoring, and clinical studies.",
  },
  {
    period: "December 2017 to February 2018",
    role: "Internship, community pharmacy",
    org: "Local pharmacy, Tunisia",
    detail: "Medication dispensing and patient counselling.",
  },
  {
    period: "September to November 2017",
    role: "Internship, pharmaceutical industry",
    org: "Saïd pharmaceutical industry, Tunisia",
    detail:
      "An overview of the work across every department of a pharmaceutical manufacturer. Built an Excel matrix to speed up the evaluation of elementary impurities during drug production, following ICH guideline Q3D step 4.",
  },
  {
    period: "August 2016",
    role: "Training, clinical anaesthesia",
    org: "Mongi-Slim Hospital, Marsa, Tunisia",
    detail: "An overview of nursing work in a clinical anaesthesia department.",
  },
  {
    period: "August 2013",
    role: "Training, community pharmacy",
    org: "Local pharmacy, Tunisia",
    detail: "A first overview of day to day work in a local pharmacy.",
  },
  {
    period: "September 2006 to July 2010",
    role: "Baccalauréat",
    org: "Lycée pilote Bourguiba de Tunis, Tunisia",
    detail:
      "Final grade 17.37 out of 20, equivalent to 5.2 out of 6, comparable to the Swiss Matura.",
  },
];
