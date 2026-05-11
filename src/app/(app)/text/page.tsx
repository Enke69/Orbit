"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Copy, Check, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

const MAX_CHARS = 5000;

export default function TextTranslatePage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function handleTranslate() {
    const text = input.trim();
    if (!text) return;
    if (text.length > MAX_CHARS) {
      toast.error(`Text too long. Max ${MAX_CHARS.toLocaleString()} characters.`);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setOutput("");

    try {
      const lines = text.split("\n");
      const res = await fetch("/api/translate/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, contextSummary: "" }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 402) {
          toast.error("Character limit reached. Please top up your credits.");
        } else {
          toast.error(data.error ?? "Translation failed");
        }
        return;
      }

      const data = await res.json();
      const translated: (string | null)[] = data.translated ?? [];
      // Merge back — keep original line if translation is null (e.g. numbers, URLs)
      const result = lines.map((l, i) => translated[i] ?? l).join("\n");
      setOutput(result);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
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
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold text-cosmos-star mb-3">
          Text translation
        </h1>
        <p className="text-cosmos-dust">
          Paste or type any text and get an instant translation.
        </p>
      </div>

      {/* Editor */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Input */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-medium text-cosmos-dust/60 uppercase tracking-wider">Source</span>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs", overLimit ? "text-red-400" : "text-cosmos-dust/50")}>
                {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
              {input && (
                <button onClick={handleClear} className="text-cosmos-dust/40 hover:text-cosmos-dust transition-colors">
                  <X size={14} />
                </button>
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

      {/* Translate button */}
      <div className="flex justify-center mt-6">
        <Button
          onClick={handleTranslate}
          disabled={!input.trim() || overLimit}
          loading={loading}
          size="lg"
          className="gap-2 min-w-[200px]"
        >
          Translate <ArrowRight size={16} />
        </Button>
      </div>

      <p className="text-center text-xs text-cosmos-dust/40 mt-4">
        Uses characters from your monthly allowance.
      </p>
    </div>
  );
}
