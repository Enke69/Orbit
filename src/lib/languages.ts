export interface Language {
  code: string;
  name: string;
  native: string;
}

export const LANGUAGES: Language[] = [
  { code: "mn", name: "Mongolian", native: "Монгол" },
  { code: "en", name: "English", native: "English" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "zh", name: "Chinese (Simplified)", native: "中文" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "fr", name: "French", native: "Français" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "tr", name: "Turkish", native: "Türkçe" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt" },
  { code: "th", name: "Thai", native: "ไทย" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "hi", name: "Hindi", native: "हिंदी" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "uk", name: "Ukrainian", native: "Українська" },
  { code: "pl", name: "Polish", native: "Polski" },
  { code: "nl", name: "Dutch", native: "Nederlands" },
  { code: "sv", name: "Swedish", native: "Svenska" },
];

export const DEFAULT_LANGUAGE = "mn";

export function getLanguageName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.name ?? "Mongolian";
}
