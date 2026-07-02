"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Languages } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";

interface Props {
  terms: string[];
  onConfirm: (selectedTerms: string[]) => void;
}

export function TermSelectionModal({ terms, onConfirm }: Props) {
  const { lang } = useLanguage();
  const tr = t[lang].terms;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const confirmedRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const confirm = useCallback(
    (sel: Set<string>) => {
      if (confirmedRef.current) return;
      confirmedRef.current = true;
      onConfirm(Array.from(sel));
    },
    [onConfirm]
  );

  // Focus the dialog on mount; Escape skips; Tab is trapped inside
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        confirm(new Set());
        return;
      }
      if (e.key === "Tab" && dialog) {
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [confirm]);

  function toggle(term: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="term-modal-title"
        tabIndex={-1}
        className="w-full max-w-lg bg-[#0d0d1a] border border-cosmos-purple-bright/30 rounded-2xl shadow-2xl overflow-hidden outline-none"
      >
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-cosmos-purple-bright/15 border border-cosmos-purple-bright/25 flex items-center justify-center flex-shrink-0">
              <Languages size={16} className="text-cosmos-purple-light" />
            </div>
            <div>
              <h2 id="term-modal-title" className="font-display font-semibold text-cosmos-star">{tr.title}</h2>
              <p className="text-xs text-cosmos-dust/60 mt-0.5">{tr.subtitle}</p>
            </div>
          </div>

          {/* Term chips */}
          <div className="flex flex-wrap gap-2">
            {terms.map((term) => (
              <button
                key={term}
                onClick={() => toggle(term)}
                aria-pressed={selected.has(term)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                  selected.has(term)
                    ? "bg-cosmos-purple-bright/20 border-cosmos-purple-bright/60 text-cosmos-purple-light"
                    : "bg-white/[0.03] border-cosmos-purple-bright/20 text-cosmos-dust hover:border-cosmos-purple-bright/40 hover:text-cosmos-star"
                )}
              >
                {term}
              </button>
            ))}
          </div>

          {/* Status */}
          <p className="text-xs text-cosmos-dust/50 leading-relaxed" aria-live="polite">
            {selected.size > 0 ? tr.selectedNote(selected.size) : tr.noneNote}
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={() => confirm(new Set())} className="flex-1">
              {tr.skip}
            </Button>
            <Button onClick={() => confirm(selected)} className="flex-1">
              {selected.size > 0 ? tr.translateN(selected.size) : tr.continueBtn}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
