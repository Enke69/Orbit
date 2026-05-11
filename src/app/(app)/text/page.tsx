"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { TermSelectionModal } from "@/components/ui/TermSelectionModal";
import { ArrowRight, Copy, Check, X, Wand2, Globe } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { LANGUAGES, DEFAULT_LANGUAGE, getLanguageName } from "@/lib/languages";

const MAX_CHARS = 5000;

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
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState(DEFAULT_LANGUAGE);
  const [detectedTerms, setDetectedTerms] = useState<string[]>([]);
  const [showTermModal, setShowTermModal] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function handleTranslate() {
    const text = input.trim();
    if (!text) return;
    if (text.length > MAX_CHARS) {
      toast.error(`Text too long. Max ${MAX_CHARS.toLocaleString()} characters.`);
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
    const text = input.trim();
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
            ? "Character limit reached. Please top up your credits."
            : (data.error ?? "Translation failed")
        );
        return;
      }

      const data = await res.json();
      const translated: (string | null)[] = data.translated ?? [];
      const result = lines.map((l, i) => translated[i] ?? l).join("\n");
      setOutput(result);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Network error. Please try again.");
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
  const overLimit = charCount > MAX_CHARS;

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
          <h1 className="font-display text-4xl font-bold text-cosmos-star mb-3">Text translation</h1>
          <p className="text-cosmos-dust">Paste or type any text and get an instant translation.</p>
        </div>

        {/* Language selector */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3 glass-card rounded-2xl px-4 py-3">
            <Globe size={15} className="text-cosmos-dust/50 flex-shrink-0" />
            <span className="text-sm text-cosmos-dust/60">Translate to</span>
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
              <span className="text-xs font-medium text-cosmos-dust/60 uppercase tracking-wider">Source</span>
              <div className="flex items-center gap-3">
                <span className={cn("text-xs", overLimit ? "text-red-400" : "text-cosmos-dust/50")}>
                  {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                </span>
                {input && (
                  <>
                    <button
                      onClick={handleCleanup}
                      title="Remove unnecessary line breaks"
                      className="flex items-center gap-1 text-xs text-cosmos-dust/50 hover:text-cosmos-purple-light transition-colors"
                    >
                      <Wand2 size={12} /> Clean up
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
              placeholder="Type or paste text here…"
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
              <span className="text-xs font-medium text-cosmos-dust/60 uppercase tracking-wider">Translation</span>
              {output && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-cosmos-dust/60 hover:text-cosmos-star transition-colors"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy"}
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
                <span className="text-cosmos-dust/40">Translating…</span>
              ) : output ? (
                <pre className="whitespace-pre-wrap font-sans">{output}</pre>
              ) : (
                <span>Translation will appear here</span>
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
            {scanning ? "Scanning…" : "Translate"} <ArrowRight size={16} />
          </Button>
        </div>

        <p className="text-center text-xs text-cosmos-dust/40 mt-4">Uses characters from your monthly allowance.</p>
      </div>
    </>
  );
}
