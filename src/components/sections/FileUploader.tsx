"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { cn, formatFileSize, isAllowedFileType } from "@/lib/utils";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function FileUploader({ onFileSelect, disabled }: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: unknown[]) => {
    setError(null);

    if ((rejectedFiles as {file: File}[]).length > 0) {
      setError("Only PDF, DOC, and DOCX files are supported.");
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    if (!isAllowedFileType(file.name)) {
      setError("Only PDF, DOC, and DOCX files are supported.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("File must be under 50 MB.");
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    disabled,
  });

  function clearFile() {
    setSelectedFile(null);
    setError(null);
  }

  if (selectedFile) {
    return (
      <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cosmos-purple-bright/15 border border-cosmos-purple-bright/20 flex items-center justify-center">
            <FileText size={22} className="text-cosmos-purple-light" />
          </div>
          <div>
            <p className="font-medium text-cosmos-star text-sm">{selectedFile.name}</p>
            <p className="text-xs text-cosmos-dust mt-0.5">{formatFileSize(selectedFile.size)}</p>
          </div>
        </div>
        <button
          onClick={clearFile}
          className="text-cosmos-dust hover:text-red-400 transition-colors p-1"
          disabled={disabled}
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-cosmos-purple-bright bg-cosmos-purple-bright/10 shadow-nebula"
            : "border-cosmos-purple-bright/30 hover:border-cosmos-purple-bright/60 hover:bg-cosmos-purple-bright/5",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
            isDragActive
              ? "bg-cosmos-purple-bright/20 shadow-nebula"
              : "bg-cosmos-purple-bright/10"
          )}>
            <Upload size={28} className={isDragActive ? "text-cosmos-purple-light" : "text-cosmos-dust"} />
          </div>
          <div>
            <p className="text-cosmos-star font-medium">
              {isDragActive ? "Drop your file here" : "Drag & drop your document"}
            </p>
            <p className="text-cosmos-dust text-sm mt-1">or click to browse</p>
          </div>
          <p className="text-xs text-cosmos-dust/60">PDF, DOC, DOCX · Max 50 MB</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={15} />
          {error}
        </div>
      )}
    </div>
  );
}
