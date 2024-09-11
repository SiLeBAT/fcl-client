export interface GDPRDateDTO {
  readonly gdprDate: string;
}

export interface FaqEntryDTO {
  q: string;
  a: string;
}

export interface FaqSectionDTO {
  title: string;
  url: string;
  faq: FaqEntryDTO[];
}

export interface FaqResponseDTO {
  topFaq: FaqEntryDTO[];
  sections: FaqSectionDTO[];
}
