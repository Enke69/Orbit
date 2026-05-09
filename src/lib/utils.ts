import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrentMonth(): string {
  return format(new Date(), "yyyy-MM");
}

export function formatCharCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export function calculateOverageChars(used: number, paid: number, free: number): number {
  const totalAllowance = free + paid;
  return Math.max(0, used - totalAllowance);
}

export function calculateOverageCost(overageChars: number, centsPerUnit: number, charsPerUnit: number): number {
  const units = Math.ceil(overageChars / charsPerUnit);
  return units * centsPerUnit;
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function isAllowedFileType(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["pdf", "doc", "docx"].includes(ext);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}
