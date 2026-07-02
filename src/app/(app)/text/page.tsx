"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { TermSelectionModal } from "@/components/ui/TermSelectionModal";
import { ArrowRight, Copy, Check, X, Wand2, Globe } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { LANGUAGES, DEFAULT_LANGUAGE, getLanguageName } from "@/lib/languages";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";

// Fallback until the plan-based limit loads; matches the FREE plan cap
const DEFAULT_MAX_CHARS = 15_000;
// Hard client ceiling even for unlimited plans — protects against silent
// output truncation on extremely long single requests
const HARD_MAX_CHARS = 50_000;

function cleanupText(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((para) =>
      para.replace(/([^\n])\n([^\n])/g, "$1 $2").trim()
    )
    .filter(Boolean)
    .join("\n\n");
}

export default function TextTranslatePage() {
  const { lang } = useLanguage();
  const tr = t[lang].text;
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState(DEFAULT_LANGUAGE);
  const [detectedTerms, setDetectedTerms] = useState<string[]>([]);
  const [showTermModal, setShowTermModal] = useState(false);
  const [maxChars, setMaxChars] = useState(DEFAULT_MAX_CHARS);
  const [remaining, setRemaining] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load the user's actual plan limits (char cap + remaining daily translations)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/quota/text")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setMaxChars(data.maxChars === null ? HARD_MAX_CHARS : data.maxChars);
        if (!data.isAdmin) {
          setRemaining(Math.max(0, data.dailyLimit - data.usedToday));
        }
      })
      .catch(() => { /* keep defaults */ });
    return () => { cancelled = true; };
  }, []);

  async function handleTranslate() {
    const text = input.trim();
    if (!text) return;
    if (text.length > maxChars) {
      toast.error(tr.tooLong(maxChars));
      return;
    }

    // Scan for technical terms first
    setScanning(true);
    let terms: string[] = [];
    try {
      const res = await fetch("/api/translate/detect-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 4000) }),
      });
      if (res.ok) {
        const data = await res.json();
        terms = data.terms ?? [];
      }
    } catch { /* proceed without terms */ }
    setScanning(false);

    if (terms.length > 0) {
      setDetectedTerms(terms);
      setShowTermModal(true);
    } else {
      await runTranslation([]);
    }
  }

  function handleTermsConfirm(selected: string[]) {
    setShowTermModal(false);
    runTranslation(selected);
  }

  async function runTranslation(translateTerms: string[]) {
    // Auto-cleanup before translation: merges mid-sentence line breaks that
    // appear when copying from PDFs (e.g. "with the\ndifference" → "with the difference")
    const text = cleanupText(input.trim());
    if (!text) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setOutput("");

    try {
      const lines = text.split("\n");
      const body: Record<string, unknown> = {
        lines,
        contextSummary: "",
        targetLanguage: getLanguageName(targetLanguage),
      };
      if (translateTerms.length > 0) body.translateTerms = translateTerms;

      const res = await fetch("/api/translate/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(
          res.status === 402
            ? tr.limitReached
            : (data.error ?? "Translation failed")
        );
        return;
      }

      const data = await res.json();
      setRemaining((prev) => (prev !== null ? Math.max(0, prev - 1) : prev));
      const translated: (string | null)[] = data.translated ?? [];
      const result = lines
        .map((l, i) => {
          const t = translated[i];
          if (t !== null && t !== undefined) return t;
          // Keep blank lines (paragraph separators)
          if (!l.trim()) return l;
          // Drop very short untranslated fragments (≤ 2 words, ≤ 15 chars) —
          // these are orphaned mid-sentence words from PDF copy-paste that the
          // model correctly cannot translate in isolation
          const trimmed = l.trim();
          if (trimmed.length <= 15 && trimmed.split(/\s+/).length <= 2) return null;
          return l;
        })
        .filter((l): l is string => l !== null)
        .join("\n");
      setOutput(result);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error(tr.networkError);
    } finally {
      setLoading(false);
    }
  }

  function handleCleanup() {
    const cleaned = cleanupText(input);
    if (cleaned !== input) {
      setInput(cleaned);
      toast.success("Text cleaned up");
    }
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClear() {
    setInput("");
    setOutput("");
    abortRef.current?.abort();
  }

  const charCount = input.length;
  const overLimit = charCount > maxChars;

  return (
    <>
      {showTermModal && (
        <TermSelectionModal
          terms={detectedTerms}
          onConfirm={handleTermsConfirm}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-cosmos-star mb-3">{tr.title}</h1>
          <p className="text-cosmos-dust">{tr.subtitle}</p>
        </div>

        {/* Language selector */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3 glass-card rounded-2xl px-4 py-3">
            <Globe size={15} className="text-cosmos-dust/50 flex-shrink-0" />
            <span className="text-sm text-cosmos-dust/60">{tr.translateTo}</span>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="bg-transparent text-cosmos-star text-sm appearance-none focus:outline-none cursor-pointer pr-1"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#0d0d1a]">
                  {l.name} — {l.native}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Editor panels */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Input */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-medium text-cosmos-dust/60 uppercase tracking-wider">{tr.source}</span>
              <div className="flex items-center gap-3">
                <span className={cn("text-xs", overLimit ? "text-red-400" : "text-cosmos-dust/50")}>
                  {charCount.toLocaleString()} / {maxChars.toLocaleString()}
                </span>
                {input && (
                  <>
                    <button
                      onClick={handleCleanup}
                      title="Remove unnecessary line breaks"
                      className="flex items-center gap-1 text-xs text-cosmos-dust/50 hover:text-cosmos-purple-light transition-colors"
                    >
                      <Wand2 size={12} /> {tr.cleanUp}
                    </button>
                    <button onClick={handleClear} className="text-cosmos-dust/40 hover:text-cosmos-dust transition-colors">
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={tr.placeholder}
              className={cn(
                "flex-1 min-h-[400px] w-full rounded-2xl p-5 text-sm text-cosmos-star placeholder:text-cosmos-dust/30",
                "bg-white/[0.03] border border-cosmos-purple-bright/20 focus:border-cosmos-purple-bright/50",
                "outline-none resize-none transition-colors leading-relaxed",
                overLimit && "border-red-500/50"
              )}
            />
          </div>

          {/* Output */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-medium text-cosmos-dust/60 uppercase tracking-wider">{tr.translation}</span>
              {output && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-cosmos-dust/60 hover:text-cosmos-star transition-colors"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  {copied ? tr.copied : tr.copy}
                </button>
              )}
            </div>
            <div
              className={cn(
                "flex-1 min-h-[400px] rounded-2xl p-5 text-sm leading-relaxed",
                "bg-white/[0.02] border border-cosmos-purple-bright/10",
                output ? "text-cosmos-star" : "text-cosmos-dust/30",
                loading && "animate-pulse"
              )}
            >
              {loading ? (
                <span className="text-cosmos-dust/40">{tr.translating}</span>
              ) : output ? (
                <pre className="whitespace-pre-wrap font-sans">{output}</pre>
              ) : (
                <span>{tr.outputPlaceholder}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <Button
            onClick={handleTranslate}
            disabled={!input.trim() || overLimit}
            loading={loading || scanning}
            size="lg"
            className="gap-2 min-w-[200px]"
          >
            {scanning ? tr.scanning : tr.translate} <ArrowRight size={16} />
          </Button>
        </div>

        <p className="text-center text-xs text-cosmos-dust/60 mt-4">
          {remaining !== null ? tr.remainingToday(remaining) : tr.usageNote}
        </p>
      </div>
    </>
  );
}
