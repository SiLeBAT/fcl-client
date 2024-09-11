export interface FaqEntry {
  question: string;
  answer: string;
}

export interface FaqSection {
  title: string;
  urlFragment: string;
  entries: FaqEntry[];
}

export interface Faq {
  topEntries: FaqEntry[];
  sections: FaqSection[];
}
