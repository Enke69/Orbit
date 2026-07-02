"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "mn";

const LanguageContext = createContext<{
  lang: Lang;
  toggle: () => void;
}>({ lang: "mn", toggle: () => {} });

// Mongolian-first: default to MN unless the user explicitly chose EN before
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("mn");

  useEffect(() => {
    const saved = localStorage.getItem("orbit-lang") as Lang | null;
    if (saved === "mn" || saved === "en") setLang(saved);
  }, []);

  function toggle() {
    setLang((prev) => {
      const next = prev === "en" ? "mn" : "en";
      localStorage.setItem("orbit-lang", next);
      document.cookie = `orbit-lang=${next}; path=/; max-age=31536000`;
      return next;
    });
  }

  return (
    <LanguageContext.Provider value={{ lang, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
