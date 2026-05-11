"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Loader2, CheckCircle2, XCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface TranslationProgressProps {
  translationId: string;
  totalChunks: number;
  onComplete: (downloadUrl: string) => void;
  onError: (message: string) => void;
}

type Phase = "translating" | "building" | "done" | "failed";

export function TranslationProgress({
  translationId,
  totalChunks,
  onComplete,
  onError,
}: TranslationProgressProps) {
  const [phase, setPhase] = useState<Phase>("translating");
  const [chunksProcessed, setChunksProcessed] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const processingRef = useRef(false);

  const processAllChunks = useCallback(async () => {
    for (let i = 0; i < totalChunks; i++) {
      if (i === totalChunks - 1) setPhase("building");

      try {
        const res = await fetch("/api/translate/chunk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translationId, chunkIndex: i }),
        });

        const data = await res.json();

        if (!res.ok) {
          setPhase("failed");
          setErrorMsg(data.error ?? "Translation failed");
          onError(data.error ?? "Translation failed");
          return;
        }

        setChunksProcessed(i + 1);

        if (data.done) {
          setPhase("done");
          setDownloadUrl(data.downloadUrl);
          onComplete(data.downloadUrl);
          return;
        }
      } catch {
        setPhase("failed");
        setErrorMsg("Network error during translation. Please try again.");
        onError("Network error");
        return;
      }
    }
  }, [translationId, totalChunks, onComplete, onError]);

  useEffect(() => {
    if (processingRef.current) return;
    processingRef.current = true;
    processAllChunks();
  }, [processAllChunks]);

  const progress =
    phase === "done"
      ? 100
      : phase === "building"
      ? 90
      : totalChunks > 0
      ? Math.round((chunksProcessed / totalChunks) * 80) + 10
      : 10;

  const phaseLabel: Record<Phase, string> = {
    translating: `Translating... (${chunksProcessed}/${totalChunks} sections)`,
    building: "Rebuilding document...",
    done: "Translation complete!",
    failed: "Translation failed",
  };

  const isDone = phase === "done";
  const isFailed = phase === "failed";

  return (
    <div className="glass-card rounded-2xl p-8 text-center space-y-6">
      {/* Icon */}
      <div
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mx-auto",
          isDone
            ? "bg-emerald-500/15 border border-emerald-500/30"
            : isFailed
            ? "bg-red-500/15 border border-red-500/30"
            : "bg-cosmos-purple-bright/15 border border-cosmos-purple-bright/30"
        )}
      >
        {isDone ? (
          <CheckCircle2 size={28} className="text-emerald-400" />
        ) : isFailed ? (
          <XCircle size={28} className="text-red-400" />
        ) : (
          <Loader2 size={28} className="text-cosmos-purple-light animate-spin" />
        )}
      </div>

      {/* Label */}
      <div>
        <p className="font-semibold text-cosmos-star font-display text-lg">
          {phaseLabel[phase]}
        </p>
        {isFailed && errorMsg && (
          <p className="text-sm text-red-400 mt-1">{errorMsg}</p>
        )}
        {!isDone && !isFailed && (
          <p className="text-sm text-cosmos-dust mt-1">
            Please keep this page open while translating
          </p>
        )}
      </div>

      {/* Progress bar */}
      {!isFailed && <ProgressBar value={progress} showPercent={!isDone} />}

      {/* Download */}
      {isDone && downloadUrl && (
        <a href={downloadUrl} download>
          <Button size="lg" className="gap-2 w-full sm:w-auto">
            <Download size={16} /> Download translated document
          </Button>
        </a>
      )}
    </div>
  );
}
