export interface ActivityTranslations {
  uz: string;
  ru: string;
  en: string;
}

export interface ActivityMetadata {
  title: {
    uz: string;
    ru: string;
    en: string;
  };
  subject: {
    uz: string;
    ru: string;
    en: string;
  };
  gradeLevel: string;
  sectionCount: number;
  changes?: string[];
}
