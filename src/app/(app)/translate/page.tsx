"use client";

import { useState } from "react";
import { FileUploader } from "@/components/sections/FileUploader";
import { TranslationProgress } from "@/components/sections/TranslationProgress";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "react-hot-toast";
import { ArrowRight, FileOutput } from "lucide-react";
import { cn } from "@/lib/utils";

type OutputFormat = "docx" | "pdf";
type Stage = "upload" | "translating" | "done";

export default function TranslatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("pdf");
  const [stage, setStage] = useState<Stage>("upload");
  const [translationId, setTranslationId] = useState<string | null>(null);
  const [totalChunks, setTotalChunks] = useState(1);
  const [loading, setLoading] = useState(false);

  async function handleTranslate() {
    if (!file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("outputFormat", outputFormat);

      const res = await fetch("/api/translate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          toast.error("Character limit reached. Please top up your credits.");
        } else {
          toast.error(data.error ?? "Failed to start translation");
        }
        setLoading(false);
        return;
      }

      setTranslationId(data.translationId);
      setTotalChunks(data.totalChunks ?? 1);
      setStage("translating");
    } catch {
      toast.error("Network error. Please try again.");
      setLoading(false);
    }
  }

  function handleComplete(downloadUrl: string) {
    setStage("done");
    toast.success("Translation complete!");
  }

  function handleError(message: string) {
    toast.error(message);
    setStage("upload");
    setLoading(false);
    setTranslationId(null);
  }

  function reset() {
    setFile(null);
    setStage("upload");
    setLoading(false);
    setTranslationId(null);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold text-cosmos-star mb-3">
          Translate a document
        </h1>
        <p className="text-cosmos-dust">
          Upload a PDF or Word file. We&apos;ll translate the text to Mongolian and send it back.
        </p>
      </div>

      {stage === "upload" && (
        <div className="space-y-6">
          {/* File upload */}
          <Card>
            <h2 className="font-semibold text-cosmos-star mb-4 text-sm uppercase tracking-wider opacity-60">
              1. Upload document
            </h2>
            <FileUploader onFileSelect={setFile} disabled={loading} />
          </Card>

          {/* Output format */}
          <Card>
            <h2 className="font-semibold text-cosmos-star mb-4 text-sm uppercase tracking-wider opacity-60">
              2. Output format
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {(["pdf", "docx"] as OutputFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setOutputFormat(fmt)}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                    outputFormat === fmt
                      ? "border-cosmos-purple-bright bg-cosmos-purple-bright/10 shadow-nebula"
                      : "border-cosmos-purple-bright/20 hover:border-cosmos-purple-bright/40"
                  )}
                >
                  <FileOutput size={18} className={outputFormat === fmt ? "text-cosmos-purple-light" : "text-cosmos-dust"} />
                  <div>
                    <p className={cn("font-medium text-sm", outputFormat === fmt ? "text-cosmos-star" : "text-cosmos-dust")}>
                      .{fmt.toUpperCase()}
                    </p>
                    <p className="text-xs text-cosmos-dust/60 mt-0.5">
                      {fmt === "docx" ? "Word document" : "PDF file"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Submit */}
          <Button
            onClick={handleTranslate}
            disabled={!file}
            loading={loading}
            size="lg"
            className="w-full gap-2"
          >
            Translate to Mongolian <ArrowRight size={16} />
          </Button>

          <p className="text-center text-xs text-cosmos-dust/50">
            This uses characters from your monthly allowance.
          </p>
        </div>
      )}

      {stage === "translating" && translationId && (
        <TranslationProgress
          translationId={translationId}
          totalChunks={totalChunks}
          onComplete={handleComplete}
          onError={handleError}
        />
      )}

      {stage === "done" && (
        <div className="text-center mt-6">
          <Button variant="outline" onClick={reset}>
            Translate another document
          </Button>
        </div>
      )}
    </div>
  );
}
