"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { FileUploader } from "@/components/sections/FileUploader";
import { TranslationProgress } from "@/components/sections/TranslationProgress";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "react-hot-toast";
import { ArrowRight, FileOutput, Download, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { LANGUAGES, DEFAULT_LANGUAGE, getLanguageName } from "@/lib/languages";

const PdfTranslatorClient = dynamic(
  () => import("@/components/sections/PdfTranslatorClient").then((m) => m.PdfTranslatorClient),
  { ssr: false }
);

type OutputFormat = "docx" | "pdf";
type Stage = "upload" | "translating" | "done";

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export default function TranslatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("pdf");
  const [targetLanguage, setTargetLanguage] = useState(DEFAULT_LANGUAGE);
  const [stage, setStage] = useState<Stage>("upload");
  const [translationId, setTranslationId] = useState<string | null>(null);
  const [totalChunks, setTotalChunks] = useState(1);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  async function handleTranslate() {
    if (!file) return;

    if (isPdf(file)) {
      setStage("translating");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("outputFormat", outputFormat);
      formData.append("targetLanguage", getLanguageName(targetLanguage));

      const res = await fetch("/api/translate", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        toast.error(res.status === 402 ? "Character limit reached. Please top up your credits." : (data.error ?? "Failed to start translation"));
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

  function handleComplete(url?: string) {
    if (url) setDownloadUrl(url);
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
    setDownloadUrl(null);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold text-cosmos-star mb-3">Translate a document</h1>
        <p className="text-cosmos-dust">Upload a PDF or Word file and get it translated. Download the result instantly.</p>
      </div>

      {stage === "upload" && (
        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold text-cosmos-star mb-4 text-sm uppercase tracking-wider opacity-60">1. Upload document</h2>
            <FileUploader onFileSelect={setFile} disabled={loading} />
          </Card>

          {/* Target language */}
          <Card>
            <h2 className="font-semibold text-cosmos-star mb-4 text-sm uppercase tracking-wider opacity-60">
              2. Target language
            </h2>
            <div className="relative">
              <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmos-dust/50 pointer-events-none" />
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-cosmos-purple-bright/20 text-cosmos-star text-sm appearance-none focus:outline-none focus:border-cosmos-purple-bright/50 transition-colors"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[#0d0d1a]">
                    {l.name} — {l.native}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* Output format — only for non-PDF */}
          {file && !isPdf(file) && (
            <Card>
              <h2 className="font-semibold text-cosmos-star mb-4 text-sm uppercase tracking-wider opacity-60">3. Output format</h2>
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
                      <p className={cn("font-medium text-sm", outputFormat === fmt ? "text-cosmos-star" : "text-cosmos-dust")}>.{fmt.toUpperCase()}</p>
                      <p className="text-xs text-cosmos-dust/60 mt-0.5">{fmt === "docx" ? "Word document" : "PDF file"}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}

          <Button onClick={handleTranslate} disabled={!file} loading={loading} size="lg" className="w-full gap-2">
            Translate <ArrowRight size={16} />
          </Button>
          <p className="text-center text-xs text-cosmos-dust/50">This uses characters from your monthly allowance.</p>
        </div>
      )}

      {stage === "translating" && file && isPdf(file) && (
        <PdfTranslatorClient
          file={file}
          targetLanguage={getLanguageName(targetLanguage)}
          onComplete={handleComplete}
          onError={handleError}
        />
      )}

      {stage === "translating" && translationId && !isPdf(file!) && (
        <TranslationProgress
          translationId={translationId}
          totalChunks={totalChunks}
          onComplete={handleComplete}
          onError={handleError}
        />
      )}

      {stage === "done" && (
        <div className="glass-card rounded-2xl p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <Download size={28} className="text-emerald-400" />
          </div>
          <div>
            <p className="font-display font-semibold text-lg text-cosmos-star">Translation complete!</p>
            <p className="text-sm text-cosmos-dust mt-1">Your document has been translated.</p>
          </div>
          {downloadUrl && (
            <a href={downloadUrl} download={file ? file.name.replace(/\.[^.]+$/, "") + "_translated.pdf" : "translated.pdf"}>
              <Button size="lg" className="gap-2 w-full"><Download size={16} /> Download translated document</Button>
            </a>
          )}
          <Button variant="outline" onClick={reset} className="w-full">Translate another document</Button>
        </div>
      )}
    </div>
  );
}
