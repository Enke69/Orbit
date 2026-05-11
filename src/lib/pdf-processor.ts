// PDF processing: extract text blocks then rebuild as a new PDF
// pdf-parse for reading (Node.js native, no worker needed), pdf-lib for writing

export interface PdfBlock {
  type: "text" | "placeholder";
  text?: string;
  placeholder?: string;
  pageIndex: number;
  blockIndex: number;
}

export interface ExtractedPdf {
  blocks: PdfBlock[];
  charCount: number;
  translatable: string;
  pageCount: number;
}

export async function extractPdf(buffer: Buffer): Promise<ExtractedPdf> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMod = await import("pdf-parse") as any;
  const pdfParse = pdfMod.default ?? pdfMod;
  const data = await pdfParse(buffer);
  const pageCount: number = data.numpages;

  const blocks: PdfBlock[] = [];
  let blockIndex = 0;

  // Split into paragraphs on blank lines, then on single newlines
  const paragraphs = (data.text as string)
    .split(/\n{2,}/)
    .flatMap((chunk: string) => chunk.split("\n"))
    .map((p: string) => p.trim())
    .filter((p: string) => p.length > 5);

  for (const paragraph of paragraphs) {
    blocks.push({
      type: "text",
      text: paragraph,
      pageIndex: 0,
      blockIndex: blockIndex++,
    });
  }

  const charCount = blocks
    .filter((b) => b.type === "text")
    .reduce((sum, b) => sum + (b.text?.length ?? 0), 0);

  let translatable = "";
  blocks.forEach((b) => {
    if (b.type === "placeholder") {
      translatable += `${b.placeholder}\n`;
    } else if (b.text) {
      translatable += `[BLOCK_${b.blockIndex}] ${b.text}\n`;
    }
  });

  return { blocks, charCount, translatable, pageCount };
}

// Fetch Noto Sans TTF that supports Cyrillic/Mongolian characters
async function fetchCyrillicFont(): Promise<Uint8Array> {
  // Request TTF format by using an old user-agent — Google Fonts returns TTF for old browsers
  const cssRes = await fetch(
    "https://fonts.googleapis.com/css?family=Noto+Sans&subset=cyrillic",
    { headers: { "User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0)" } }
  );
  const css = await cssRes.text();
  const match = css.match(/url\(([^)]+\.ttf)\)/);
  if (!match) throw new Error("Could not find Noto Sans TTF URL from Google Fonts");
  const fontRes = await fetch(match[1]);
  const buffer = await fontRes.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function buildPdf(
  blocks: PdfBlock[],
  translatedMap: Map<number, string>
): Promise<Buffer> {
  const { PDFDocument, rgb, PageSizes } = await import("pdf-lib");
  const fontkit = (await import("@pdf-lib/fontkit")).default;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Embed Noto Sans which covers Cyrillic (Mongolian) characters
  const fontBytes = await fetchCyrillicFont();
  const font = await pdfDoc.embedFont(fontBytes);

  const fontSize = 11;
  const margin = 60;
  const lineHeight = fontSize * 1.6;
  const pageWidth = PageSizes.A4[0];
  const pageHeight = PageSizes.A4[1];
  const maxWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage(PageSizes.A4);
  let y = pageHeight - margin;

  function wrapText(text: string, maxW: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      try {
        const testWidth = font.widthOfTextAtSize(test, fontSize);
        if (testWidth > maxW && current) {
          lines.push(current);
          current = word;
        } else {
          current = test;
        }
      } catch {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  function addPage() {
    page = pdfDoc.addPage(PageSizes.A4);
    y = pageHeight - margin;
  }

  for (const block of blocks) {
    if (block.type === "placeholder" && block.placeholder === "[PAGEBREAK]") {
      addPage();
      continue;
    }

    const text = (block.type === "text" ? translatedMap.get(block.blockIndex) ?? block.text : block.placeholder) ?? "";
    if (!text) continue;

    const lines = wrapText(text, maxWidth);
    for (const line of lines) {
      if (y < margin + lineHeight) addPage();
      try {
        page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.05, 0.05, 0.1) });
      } catch {
        // Skip characters the font can't render
      }
      y -= lineHeight;
    }
    y -= lineHeight * 0.5;
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

export function parsePdfTranslatedOutput(
  translatedText: string,
  blockCount: number
): Map<number, string> {
  const map = new Map<number, string>();
  const lines = translatedText.split("\n");

  for (const line of lines) {
    const match = line.match(/^\[BLOCK_(\d+)\]\s*(.*)/);
    if (match) {
      const idx = parseInt(match[1]);
      const text = match[2].trim();
      if (idx < blockCount) map.set(idx, text);
    }
  }

  return map;
}
