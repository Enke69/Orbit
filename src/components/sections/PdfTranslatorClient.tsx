"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TextItem {
  str: string;
  cx: number; cy: number;
  px: number; py: number;
  width: number; height: number;
  fontSize: number;
  fontName: string;
}

interface Line {
  baseY: number;
  anchorY: number;
  items: TextItem[];
}

interface LineText {
  text: string;
  line: Line;
  _idx: number;
}

interface Region { x1: number; y1: number; x2: number; y2: number; }

// ─── PDF.js CDN loader ────────────────────────────────────────────────────────

const PDFJS_CDNS = [
  {
    main:   "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js",
    worker: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js",
  },
  {
    main:   "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
    worker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  },
  {
    main:   "https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.min.js",
    worker: "https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js",
  },
];

async function loadPdfjsLib(): Promise<unknown> {
  const win = window as any; // needed to access dynamically loaded pdfjsLib
  if (win.pdfjsLib) return win.pdfjsLib;

  for (const cdn of PDFJS_CDNS) {
    try {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = cdn.main;
        s.onload = () => {
          if (win.pdfjsLib) {
            win.pdfjsLib.GlobalWorkerOptions.workerSrc = cdn.worker;
            resolve();
          } else reject(new Error("pdfjsLib not found"));
        };
        s.onerror = reject;
        document.head.appendChild(s);
      });
      return win.pdfjsLib;
    } catch { continue; }
  }
  throw new Error("PDF.js failed to load from all CDNs. Please check your connection.");
}

// ─── Pure pipeline helpers ────────────────────────────────────────────────────

function groupIntoLines(items: TextItem[]): Line[] {
  const sorted = [...items].sort((a, b) => {
    const dy = a.cy - b.cy;
    if (Math.abs(dy) > 3) return dy;
    return a.cx - b.cx;
  });
  const lines: Line[] = [];
  let current: Line | null = null;
  for (const item of sorted) {
    const fs = item.fontSize > 0 ? item.fontSize : 12;
    if (!current || Math.abs(item.cy - current.anchorY) > fs * 0.65) {
      current = { baseY: item.cy, anchorY: item.cy, items: [item] };
      lines.push(current);
    } else {
      current.baseY = Math.max(current.baseY, item.cy);
      current.items.push(item);
    }
  }
  for (const line of lines) line.items.sort((a, b) => a.cx - b.cx);
  return lines;
}

function reconnectHyphens(lines: Line[]) {
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    if (!line.items.length) continue;
    const last = line.items[line.items.length - 1] as TextItem & { _hyphenContinues?: boolean };
    if (last.str.endsWith("-") && last.str.length > 1) {
      const nextFirst = lines[i + 1].items[0] as TextItem & { _hyphenContinued?: boolean };
      if (nextFirst && /^[a-zA-ZА-Яа-я]/i.test(nextFirst.str)) {
        last._hyphenContinues = true;
        nextFirst._hyphenContinued = true;
      }
    }
  }
}

function assembleLineText(line: Line): { text: string; line: Line; _idx: number } {
  if (!line.items.length) return { text: "", line, _idx: 0 };
  let text = "";
  for (let i = 0; i < line.items.length; i++) {
    const item = line.items[i];
    if (i > 0) {
      const prev = line.items[i - 1];
      const gap = item.cx - (prev.cx + prev.width);
      if (gap > prev.fontSize * 0.2 && !text.endsWith(" ") && !item.str.startsWith(" ")) {
        text += " ";
      }
    }
    text += item.str;
  }
  return { text: text.trim(), line, _idx: 0 };
}

function overlapsRegion(bx: number, by: number, bw: number, bh: number, regions: Region[]): boolean {
  for (const r of regions) {
    if (bx + bw < r.x1 || bx > r.x2 || by + bh < r.y1 || by > r.y2) continue;
    return true;
  }
  return false;
}

function alreadyMongolian(text: string): boolean {
  return /[Ѐ-ӿ]/.test(text);
}

function makeChunks(lineTexts: LineText[], maxChars: number): LineText[][] {
  const chunks: LineText[][] = [];
  let current: LineText[] = [];
  let length = 0;
  for (const lt of lineTexts) {
    const len = lt.text.length + 1;
    if (length + len > maxChars && current.length > 0) {
      chunks.push(current);
      current = [lt];
      length = len;
    } else {
      current.push(lt);
      length += len;
    }
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

function sampleBackground(ctx: CanvasRenderingContext2D, bx: number, by: number, bw: number, bh: number): string {
  const cw = ctx.canvas.width, ch = ctx.canvas.height;
  const allColors: [number, number, number][] = [];
  const collect = (rx: number, ry: number, rw: number, rh: number) => {
    const sx = Math.max(0, Math.round(rx)), sy = Math.max(0, Math.round(ry));
    const sw = Math.min(Math.round(rw), cw - sx), sh = Math.min(Math.round(rh), ch - sy);
    if (sw <= 0 || sh <= 0) return;
    try {
      const d = ctx.getImageData(sx, sy, sw, sh).data;
      for (let p = 0; p < d.length; p += 16) allColors.push([d[p], d[p + 1], d[p + 2]]);
    } catch { /* cross-origin */ }
  };
  collect(bx, by - 6, bw, 5);
  collect(bx, by + bh + 1, bw, 5);
  collect(bx - 8, by, 6, bh);
  collect(bx + bw + 2, by, 6, bh);
  if (!allColors.length) return "#ffffff";
  let bestLum = -1, best: [number, number, number] = [255, 255, 255];
  for (const [r, g, b] of allColors) {
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum > bestLum) { bestLum = lum; best = [r, g, b]; }
  }
  return `rgb(${best[0]},${best[1]},${best[2]})`;
}

function getContrastColor(bg: string): string {
  const m = bg.match(/rgb\((\d+),(\d+),(\d+)\)/);
  if (!m) return "#000000";
  const lum = 0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3];
  return lum > 140 ? "#000000" : "#ffffff";
}

// ─── Table / graph detection ──────────────────────────────────────────────────

function detectTableLines(lines: Line[]): { skipSet: Set<number>; protectedRegions: Region[] } {
  const skipSet = new Set<number>();
  const protectedRegions: Region[] = [];
  const captionRe = /^\s*(table|figure|chart|graph|fig\.)\b/i;
  const BUCKET = 10;

  const xBucketLines = new Map<number, Set<number>>();
  for (let i = 0; i < lines.length; i++) {
    for (const item of lines[i].items) {
      const b = Math.round(item.cx / BUCKET) * BUCKET;
      if (!xBucketLines.has(b)) xBucketLines.set(b, new Set());
      xBucketLines.get(b)!.add(i);
    }
  }
  const sharedXs = new Set<number>();
  // 2 lines sharing an x-bucket is enough to mark it as a column
  xBucketLines.forEach((lineSet, bx) => {
    if (lineSet.size >= 2) sharedXs.add(bx);
  });

  const isTableRow = lines.map((line) => {
    if (!line.items.length || line.items.length > 15) return false;
    const text = line.items.map((it) => it.str).join("").trim();
    if (!text || captionRe.test(text)) return false;
    let sharedCount = 0;
    for (const item of line.items) {
      const b = Math.round(item.cx / BUCKET) * BUCKET;
      if (sharedXs.has(b)) sharedCount++;
    }
    if (sharedCount < 1) return false;
    if (line.items.length >= 2) {
      const sorted = [...line.items].sort((a, b) => a.cx - b.cx);
      let gaps = 0;
      for (let k = 1; k < sorted.length; k++) {
        const gap = sorted[k].cx - (sorted[k - 1].cx + sorted[k - 1].width);
        if (gap > 15) gaps++;
      }
      if (gaps < 1) return false;
    } else {
      // Single-item line — only treat as table row if strongly aligned with multiple columns
      if (sharedCount < 2) return false;
    }
    const avgLen = line.items.reduce((s, it) => s + it.str.trim().length, 0) / line.items.length;
    return avgLen < 60;
  });

  const runs: [number, number][] = [];
  let runStart = -1;
  for (let i = 0; i <= lines.length; i++) {
    if (i < lines.length && isTableRow[i]) {
      if (runStart < 0) runStart = i;
    } else {
      // Even a single table-like row is enough
      if (runStart >= 0 && i - runStart >= 1) runs.push([runStart, i - 1]);
      runStart = -1;
    }
  }

  for (const [s, e] of runs) {
    for (let j = s; j <= e; j++) skipSet.add(j);
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    for (let j = s; j <= e; j++) {
      for (const it of lines[j].items) {
        const fs = it.fontSize > 0 ? it.fontSize : 12;
        x1 = Math.min(x1, it.cx); y1 = Math.min(y1, it.cy - fs);
        x2 = Math.max(x2, it.cx + Math.max(it.width, 4)); y2 = Math.max(y2, it.cy + fs * 0.3);
      }
    }
    if (x1 >= Infinity) continue;
    protectedRegions.push({ x1: x1 - 10, y1: y1 - 4, x2: x2 + 10, y2: y2 + 4 });
  }

  // Pure-number lines (axis ticks)
  for (let i = 0; i < lines.length; i++) {
    if (skipSet.has(i)) continue;
    const text = lines[i].items.map((it) => it.str).join("").trim();
    if (/^[\d\s,.\-–+%°×x()]+$/.test(text) && text.length > 0) skipSet.add(i);
  }

  // Promote overlapping lines
  for (let i = 0; i < lines.length; i++) {
    if (skipSet.has(i) || !lines[i].items.length) continue;
    const text = lines[i].items.map((it) => it.str).join("").trim();
    if (captionRe.test(text)) continue;
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    for (const it of lines[i].items) {
      const fs = it.fontSize > 0 ? it.fontSize : 12;
      x1 = Math.min(x1, it.cx); y1 = Math.min(y1, it.cy - fs);
      x2 = Math.max(x2, it.cx + Math.max(it.width, 4)); y2 = Math.max(y2, it.cy + fs * 0.3);
    }
    if (overlapsRegion(x1, y1, x2 - x1, y2 - y1, protectedRegions)) skipSet.add(i);
  }

  return { skipSet, protectedRegions };
}

// ─── Draw translated page ─────────────────────────────────────────────────────

function drawTranslatedPage(
  originalCanvas: HTMLCanvasElement,
  lines: Line[],
  translatedMap: Record<number, string | null>,
  skipLines: Set<number>,
  protectedRegions: Region[],
  scale: number
): string {
  const canvas = document.createElement("canvas");
  canvas.width = originalCanvas.width;
  canvas.height = originalCanvas.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(originalCanvas, 0, 0);

  const BODY_PT = 12;
  const BODY_PX = BODY_PT * scale;
  const LINE_GAP = 1.18;
  const PAGE_RIGHT = 16;
  const PAGE_BOTTOM = 20;

  const origSizes: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (skipLines.has(i) || translatedMap[i] == null || !lines[i].items.length) continue;
    const avg = lines[i].items.reduce((s, it) => s + (it.fontSize > 0 ? it.fontSize : 12), 0) / lines[i].items.length;
    origSizes.push(avg);
  }
  origSizes.sort((a, b) => a - b);
  const medianSize = origSizes.length ? origSizes[Math.floor(origSizes.length / 2)] : BODY_PX;
  const HEADING_THRESHOLD = medianSize * 1.2;

  function wrapText(text: string, maxW: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const out: string[] = [];
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxW && current) { out.push(current); current = word; }
      else current = test;
    }
    if (current) out.push(current);
    return out.length ? out : [text];
  }

  for (let i = 0; i < lines.length; i++) {
    if (skipLines.has(i)) continue;
    const line = lines[i];
    const translated = translatedMap[i];
    if (!translated?.trim() || !line.items.length) continue;

    const items = line.items;
    const origAvgFs = items.reduce((s, it) => s + (it.fontSize > 0 ? it.fontSize : 12), 0) / items.length;
    let minX = Infinity, maxX = -Infinity;
    const baseline = line.baseY;
    for (const it of items) { minX = Math.min(minX, it.cx); maxX = Math.max(maxX, it.cx + Math.max(it.width, 4)); }

    const ascent = origAvgFs * 0.85, descender = origAvgFs * 0.25;
    const byTop = baseline - ascent, byBot = baseline + descender;
    const origLineH = byBot - byTop;
    if (origLineH <= 0 || maxX - minX <= 0) continue;

    const bx = minX - 1, by = byTop - 1;
    const bwOrig = maxX - minX + 2, bhOrig = origLineH + 2;

    if (overlapsRegion(bx, by, bwOrig, bhOrig, protectedRegions)) continue;

    const isHeading = origAvgFs >= HEADING_THRESHOLD;
    let drawFs = isHeading ? origAvgFs : BODY_PX;
    const rightLimit = canvas.width - PAGE_RIGHT;
    const wrapWidth = Math.min(Math.max(bwOrig, rightLimit - minX), rightLimit - minX);
    if (wrapWidth < 20) continue;

    let nextTop = canvas.height - PAGE_BOTTOM;
    for (let j = i + 1; j < lines.length; j++) {
      if (!lines[j].items.length) continue;
      const nxFs = lines[j].items.reduce((s, it) => s + (it.fontSize > 0 ? it.fontSize : 12), 0) / lines[j].items.length;
      nextTop = Math.min(nextTop, lines[j].baseY - nxFs * 0.85);
      break;
    }
    // Cap at 1.6× original line height to prevent overlap with the next line
    const availH = Math.min(Math.max(origLineH, nextTop - byTop), origLineH * 1.6);

    const isBold = items.some((it) => /bold/i.test(it.fontName));
    const isItalic = items.some((it) => /italic|oblique/i.test(it.fontName));
    const fontStyle = (isBold ? "bold " : "") + (isItalic ? "italic " : "");
    const isRTL = /[֑-߿‏‫]/.test(translated);

    let wrappedLines: string[] = [];
    const MIN_SCALE = 0.62;
    const initialFs = drawFs;
    for (let tryS = 1.0; tryS >= MIN_SCALE - 0.001; tryS -= 0.1) {
      drawFs = initialFs * tryS;
      ctx.font = `${fontStyle}${drawFs}px sans-serif`;
      wrappedLines = wrapText(translated, wrapWidth);
      if (wrappedLines.length * drawFs * LINE_GAP <= availH || tryS <= MIN_SCALE + 0.001) break;
    }

    const bgColor = sampleBackground(ctx, bx, by, bwOrig, bhOrig);
    const textColor = getContrastColor(bgColor);
    const lineStep = drawFs * LINE_GAP;
    const totalDrawH = Math.min(wrappedLines.length * lineStep + drawFs * 0.3, availH);
    const coverW = wrappedLines.length > 1 ? wrapWidth : bwOrig;

    let finalCoverH = totalDrawH;
    for (const r of protectedRegions) {
      if (bx + coverW + 2 < r.x1 || bx > r.x2) continue;
      if (r.y1 > by && r.y1 < by + finalCoverH) finalCoverH = Math.max(origLineH, r.y1 - by - 2);
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(bx, by, coverW + 2, finalCoverH);
    ctx.fillStyle = textColor;
    ctx.textBaseline = "alphabetic";
    ctx.direction = isRTL ? "rtl" : "ltr";
    ctx.font = `${fontStyle}${drawFs}px sans-serif`;

    for (let li = 0; li < wrappedLines.length; li++) {
      const y = baseline + li * lineStep;
      if (y - drawFs > by + finalCoverH) break;
      ctx.fillText(wrappedLines[li], isRTL ? minX + wrapWidth : minX, y, wrapWidth);
    }
    ctx.direction = "ltr";
  }

  return canvas.toDataURL("image/jpeg", 0.93);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  file: File;
  onComplete: (url: string) => void;
  onError: (msg: string) => void;
}

type LogEntry = { msg: string; type: "active" | "done" | "error" };

export function PdfTranslatorClient({ file, onComplete, onError }: Props) {
  const [phase, setPhase] = useState("Loading PDF.js…");
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const startedRef = useRef(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const totalCharsRef = useRef(0);

  function addLog(msg: string, type: LogEntry["type"] = "active") {
    setLog((prev) => [...prev, { msg, type }]);
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function setProgressState(label: string, pct: number) {
    setPhase(label);
    setProgress(Math.round(pct));
  }

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    runTranslation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function translateChunk(lineTexts: LineText[], contextSummary: string): Promise<{ results: (string | null)[]; newContext: string }> {
    const lines = lineTexts.map((lt) => lt.text);
    totalCharsRef.current += lines.reduce((s, l) => s + l.length, 0);
    const res = await fetch("/api/translate/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines, contextSummary }),
    });
    if (res.status === 402) throw new Error("Character limit reached. Please top up your credits.");
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error ?? `Translation error ${res.status}`);
    }
    const data = await res.json();
    return { results: data.translated, newContext: data.newContext ?? contextSummary };
  }

  async function runTranslation() {
    try {
      // Load PDF.js
      const pdfjsLib = await loadPdfjsLib() as {
        getDocument: (opts: unknown) => { promise: Promise<unknown> };
        OPS: Record<string, number>;
      };
      addLog("PDF.js loaded", "done");

      setProgressState("Loading PDF…", 3);
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await (pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise) as {
        numPages: number;
        getPage: (n: number) => Promise<unknown>;
      };
      const totalPages = pdfDoc.numPages;
      addLog(`Found ${totalPages} page${totalPages > 1 ? "s" : ""}`, "done");

      const SCALE = 2.0;
      const CHUNK_SIZE = 1000;
      const renderedPages: { imageDataUrl: string; width: number; height: number }[] = [];
      let contextSummary = "";

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const pageBase = 5 + ((pageNum - 1) / totalPages) * 88;
        setProgressState(`Page ${pageNum} / ${totalPages}…`, pageBase);
        addLog(`Page ${pageNum}: rendering`);

        const page = await pdfDoc.getPage(pageNum) as {
          getViewport: (opts: { scale: number }) => {
            width: number; height: number;
            convertToViewportPoint: (x: number, y: number) => [number, number];
          };
          render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> };
          getTextContent: () => Promise<{ items: { str: string; transform: number[]; width: number; height: number; fontName: string }[] }>;
          getOperatorList: () => Promise<{ fnArray: number[]; argsArray: unknown[][] }>;
        };

        const viewport = page.getViewport({ scale: SCALE });
        const nativeViewport = page.getViewport({ scale: 1.0 });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        const textContent = await page.getTextContent();
        const rawItems = textContent.items.filter((it) => it.str?.trim());

        const items: TextItem[] = rawItems.map((item) => {
          const [a, b, , , px, py] = item.transform;
          const fontSize = Math.hypot(a, b);
          const [cx, cy] = viewport.convertToViewportPoint(px, py);
          return {
            str: item.str,
            cx, cy, px, py,
            width: item.width * SCALE,
            height: (item.height || fontSize) * SCALE,
            fontSize: fontSize * SCALE,
            fontName: item.fontName || "",
          };
        });

        addLog(`Page ${pageNum}: ${items.length} text items`);

        if (!items.length) {
          addLog(`Page ${pageNum}: no text, keeping original`, "done");
          renderedPages.push({ imageDataUrl: canvas.toDataURL("image/png"), width: nativeViewport.width, height: nativeViewport.height });
          continue;
        }

        const lines = groupIntoLines(items);
        reconnectHyphens(lines);
        const { skipSet, protectedRegions } = detectTableLines(lines);

        // Also detect drawn table borders from PDF operators
        try {
          const opList = await page.getOperatorList();
          const OPS = pdfjsLib.OPS;
          const rectangles: { x1: number; y1: number; x2: number; y2: number }[] = [];
          let lastPath: { rects: { x: number; y: number; w: number; h: number }[] } | null = null;

          for (let i = 0; i < opList.fnArray.length; i++) {
            const fn = opList.fnArray[i];
            const args = opList.argsArray[i] as unknown[];
            if (fn === OPS.constructPath && Array.isArray(args) && Array.isArray(args[0]) && Array.isArray(args[1])) {
              const subOps = args[0] as number[], coords = args[1] as number[];
              let ci = 0;
              const pathRects: { x: number; y: number; w: number; h: number }[] = [];
              for (const subOp of subOps) {
                if (subOp === OPS.rectangle && ci + 4 <= coords.length) {
                  pathRects.push({ x: coords[ci], y: coords[ci + 1], w: coords[ci + 2], h: coords[ci + 3] });
                  ci += 4;
                } else if (subOp === OPS.moveTo || subOp === OPS.lineTo) ci += 2;
                else if (subOp === OPS.curveTo) ci += 6;
                else if (subOp === OPS.curveTo2 || subOp === OPS.curveTo3) ci += 4;
              }
              lastPath = { rects: pathRects };
            } else if (lastPath && (fn === OPS.stroke || fn === OPS.fillStroke || fn === OPS.closeStroke)) {
              for (const r of lastPath.rects) {
                const [cx1, cy1] = viewport.convertToViewportPoint(r.x, r.y);
                const [cx2, cy2] = viewport.convertToViewportPoint(r.x + r.w, r.y + r.h);
                const x1 = Math.min(cx1, cx2), y1 = Math.min(cy1, cy2);
                const x2 = Math.max(cx1, cx2), y2 = Math.max(cy1, cy2);
                const w = x2 - x1, h = y2 - y1;
                if (w >= 15 && h >= 8 && w < viewport.width * 0.95) rectangles.push({ x1, y1, x2, y2 });
              }
              lastPath = null;
            } else lastPath = null;
          }

          if (rectangles.length >= 2) {
            const claimed = new Set<number>();
            for (let i = 0; i < rectangles.length; i++) {
              if (claimed.has(i)) continue;
              const cluster = [rectangles[i]]; claimed.add(i);
              let changed = true;
              while (changed) {
                changed = false;
                for (let j = 0; j < rectangles.length; j++) {
                  if (claimed.has(j)) continue;
                  const r = rectangles[j];
                  const near = cluster.some((c) => !(r.x2 < c.x1 - 25 || r.x1 > c.x2 + 25 || r.y2 < c.y1 - 25 || r.y1 > c.y2 + 25));
                  if (near) { cluster.push(r); claimed.add(j); changed = true; }
                }
              }
              if (cluster.length >= 2) {
                const region = {
                  x1: Math.min(...cluster.map((r) => r.x1)) - 6,
                  y1: Math.min(...cluster.map((r) => r.y1)) - 6,
                  x2: Math.max(...cluster.map((r) => r.x2)) + 6,
                  y2: Math.max(...cluster.map((r) => r.y2)) + 6,
                };
                protectedRegions.push(region);
                // Mark lines inside this region as skip — check any item, not just first
                for (let li = 0; li < lines.length; li++) {
                  if (!lines[li].items.length) continue;
                  const inside = lines[li].items.some((it) =>
                    it.cx >= region.x1 - 5 && it.cx <= region.x2 + 5 &&
                    it.cy >= region.y1 - 5 && it.cy <= region.y2 + 5
                  );
                  if (inside) skipSet.add(li);
                }
              }
            }
          }
        } catch { /* non-critical */ }

        const lineTexts: LineText[] = lines.map((line, idx) => {
          const lt = assembleLineText(line);
          return { ...lt, _idx: idx };
        });

        const translatableLines = lineTexts.filter((lt) => !skipSet.has(lt._idx) && lt.text.trim().length > 0);
        addLog(`Page ${pageNum}: ${translatableLines.length} lines to translate`);

        const chunks = makeChunks(translatableLines, CHUNK_SIZE);
        const translatedMap: Record<number, string | null> = {};

        for (let ci = 0; ci < chunks.length; ci++) {
          addLog(`Page ${pageNum}: chunk ${ci + 1}/${chunks.length}`);
          const { results, newContext } = await translateChunk(chunks[ci], contextSummary);
          contextSummary = newContext;
          chunks[ci].forEach((lt, li) => {
            const t = results[li];
            translatedMap[lt._idx] = (t && !alreadyMongolian(lt.text)) || alreadyMongolian(t ?? "") ? t : null;
          });
          setProgressState(`Page ${pageNum} / ${totalPages}…`, pageBase + ((ci + 1) / chunks.length) * (88 / totalPages));
        }

        addLog(`Page ${pageNum}: compositing`);
        const dataUrl = drawTranslatedPage(canvas, lines, translatedMap, skipSet, protectedRegions, SCALE);
        renderedPages.push({ imageDataUrl: dataUrl, width: nativeViewport.width, height: nativeViewport.height });
        addLog(`Page ${pageNum}: done`, "done");
      }

      // Assemble PDF
      setProgressState("Assembling PDF…", 96);
      addLog("Building final PDF");

      const { PDFDocument } = await import("pdf-lib");
      const outDoc = await PDFDocument.create();
      for (const pg of renderedPages) {
        const isJpeg = pg.imageDataUrl.startsWith("data:image/jpeg");
        const b64 = pg.imageDataUrl.split(",")[1];
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const img = isJpeg ? await outDoc.embedJpg(bytes) : await outDoc.embedPng(bytes);
        const pdfPage = outDoc.addPage([pg.width, pg.height]);
        pdfPage.drawImage(img, { x: 0, y: 0, width: pg.width, height: pg.height });
      }
      const pdfBytes = await outDoc.save();

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      setDownloadUrl(blobUrl);
      setProgressState("Translation complete!", 100);
      addLog("All done!", "done");

      // Save to history in background — best-effort, don't block the download
      try {
        const fd = new FormData();
        fd.append("file", new File([blob], file.name, { type: "application/pdf" }));
        fd.append("filename", file.name);
        fd.append("charCount", String(totalCharsRef.current));
        await fetch("/api/translate/save-pdf", { method: "POST", body: fd });
      } catch {
        // History save failed — download still works via blob URL
      }

      onComplete(blobUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Translation failed";
      addLog(msg, "error");
      setFailed(true);
      onError(msg);
    }
  }

  const isDone = !!downloadUrl;

  return (
    <div className="glass-card rounded-2xl p-8 space-y-6">
      {/* Icon */}
      <div className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center mx-auto",
        isDone ? "bg-emerald-500/15 border border-emerald-500/30"
          : failed ? "bg-red-500/15 border border-red-500/30"
          : "bg-cosmos-purple-bright/15 border border-cosmos-purple-bright/30"
      )}>
        {isDone ? <CheckCircle2 size={28} className="text-emerald-400" />
          : failed ? <XCircle size={28} className="text-red-400" />
          : <Loader2 size={28} className="text-cosmos-purple-light animate-spin" />}
      </div>

      {/* Phase */}
      <div className="text-center">
        <p className="font-semibold text-cosmos-star font-display text-lg">{phase}</p>
        {!isDone && !failed && (
          <p className="text-sm text-cosmos-dust mt-1">Keep this page open while translating</p>
        )}
      </div>

      {/* Progress bar */}
      {!failed && <ProgressBar value={progress} showPercent={!isDone} />}

      {/* Log */}
      <div className="max-h-32 overflow-y-auto text-xs space-y-0.5">
        {log.map((entry, i) => (
          <div key={i} className={cn(
            "flex gap-2",
            entry.type === "done" ? "text-emerald-400" : entry.type === "error" ? "text-red-400" : "text-cosmos-dust/60"
          )}>
            <span>{entry.type === "done" ? "✓" : entry.type === "error" ? "✗" : "·"}</span>
            <span>{entry.msg}</span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Download */}
      {isDone && downloadUrl && (
        <a href={downloadUrl} download={file.name.replace(/\.pdf$/i, "") + "_translated.pdf"}>
          <Button size="lg" className="gap-2 w-full">
            <Download size={16} /> Download translated PDF
          </Button>
        </a>
      )}
    </div>
  );
}
