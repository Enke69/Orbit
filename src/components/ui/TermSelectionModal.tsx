"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Languages } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface Props {
  terms: string[];
  onConfirm: (selectedTerms: string[]) => void;
  timerSeconds?: number;
}

export function TermSelectionModal({ terms, onConfirm, timerSeconds = 15 }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const confirmedRef = useRef(false);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const confirm = useCallback(
    (sel: Set<string>) => {
      if (confirmedRef.current) return;
      confirmedRef.current = true;
      onConfirm(Array.from(sel));
    },
    [onConfirm]
  );

  useEffect(() => {
    if (timeLeft <= 0) {
      confirm(selectedRef.current);
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, confirm]);

  function toggle(term: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });
    setTimeLeft(timerSeconds);
  }

  const pct = (timeLeft / timerSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0d0d1a] border border-cosmos-purple-bright/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Countdown bar */}
        <div className="h-1 bg-cosmos-purple-bright/10">
          <div
            className="h-full bg-cosmos-purple-bright transition-all duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-cosmos-purple-bright/15 border border-cosmos-purple-bright/25 flex items-center justify-center flex-shrink-0">
              <Languages size={16} className="text-cosmos-purple-light" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-cosmos-star">Technical terms detected</h2>
              <p className="text-xs text-cosmos-dust/60 mt-0.5">
                Click terms you want translated. Auto-continuing in{" "}
                <span className={cn("font-medium", timeLeft <= 5 ? "text-red-400" : "text-cosmos-purple-light")}>
                  {timeLeft}s
                </span>
              </p>
            </div>
          </div>

          {/* Term chips */}
          <div className="flex flex-wrap gap-2">
            {terms.map((term) => (
              <button
                key={term}
                onClick={() => toggle(term)}
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
          <p className="text-xs text-cosmos-dust/50 leading-relaxed">
            {selected.size > 0
              ? `${selected.size} term${selected.size !== 1 ? "s" : ""} selected — these will be translated`
              : "No terms selected — all terms handled automatically by context"}
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={() => confirm(new Set())} className="flex-1">
              Skip
            </Button>
            <Button onClick={() => confirm(selected)} className="flex-1">
              {selected.size > 0 ? `Translate ${selected.size} term${selected.size !== 1 ? "s" : ""}` : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
