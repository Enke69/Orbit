import mammoth from "mammoth";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

// Extract leading emoji/symbols at the start of a string (stripped before translation, prepended after)
function extractLeadingEmoji(text: string): string {
  let i = 0;
  while (i < text.length) {
    const cp = text.codePointAt(i);
    if (cp === undefined) break;
    const isEmoji =
      (cp >= 0x2600 && cp <= 0x27bf) ||  // Misc symbols, Dingbats
      (cp >= 0x2b00 && cp <= 0x2bff) ||  // Misc symbols & arrows
      (cp >= 0x1f000 && cp <= 0x1ffff);  // Emoji, symbols & pictographs
    if (isEmoji) {
      i += cp > 0xffff ? 2 : 1; // supplementary plane chars use 2 UTF-16 code units
    } else if (text[i] === " " && i > 0) {
      i++;
      break;
    } else {
      break;
    }
  }
  return i > 0 ? text.slice(0, i) : "";
}

// Values that should never be translated: codes/IDs, ISO dates, version strings
const NO_TRANSLATE_RE = /^([\w]+-\d+|\d{4}-\d{2}-\d{2}|v\d+(\.\d+)*|[A-Z0-9]{2,}-[A-Z0-9-]+|\d+(\.\d+)*)$/;

// Map Word named styles to semantic HTML so we can detect them
const MAMMOTH_STYLE_MAP = [
  "p[style-name='Quote'] => blockquote:fresh > p",
  "p[style-name='Intense Quote'] => blockquote:fresh > p",
  "p[style-name='Block Text'] => blockquote:fresh > p",
  "p[style-name='Code'] => pre > code:fresh",
  "p[style-name='HTML Code'] => pre > code:fresh",
  "p[style-name='Code Block'] => pre > code:fresh",
  "p[style-name='Preformatted Text'] => pre > code:fresh",
  "r[underline] => u",
].join("\n");

// Replace inline HTML formatting tags with translator-safe markers before stripping HTML.
// The AI is instructed to keep these markers around the translated word(s).
function injectInlineMarkers(html: string): string {
  return html
    // Color spans — capture 6-char hex, strip the #
    .replace(/<span[^>]*style="[^"]*color:\s*#([A-Fa-f0-9]{6})[^"]*"[^>]*>([\s\S]*?)<\/span>/gi,
      (_, hex, inner) => `[C:${hex.toUpperCase()}]${inner}[/C]`)
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, "[B]$1[/B]")
    .replace(/<em>([\s\S]*?)<\/em>/gi, "[I]$1[/I]")
    .replace(/<u>([\s\S]*?)<\/u>/gi, "[U]$1[/U]");
}

// Parse text containing [U], [B], [I], [C:RRGGBB] markers into multiple TextRuns.
// Falls back to a single TextRun with base style if no markers are found.
function parseStyledRuns(
  text: string,
  base: { bold?: boolean; italics?: boolean }
): TextRun[] {
  const MARKER_RE = /\[(U|B|I|C:[A-F0-9]{6})\]([\s\S]*?)\[\/[UBIC]\]/gi;
  const runs: TextRun[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = MARKER_RE.exec(text)) !== null) {
    if (m.index > lastIndex) {
      runs.push(new TextRun({ ...base, text: text.slice(lastIndex, m.index) }));
    }
    const tag = m[1].toUpperCase();
    const inner = m[2];
    const style: { text: string; bold?: boolean; italics?: boolean; underline?: {}; color?: string } =
      { ...base, text: inner };
    if (tag === "B") style.bold = true;
    else if (tag === "I") style.italics = true;
    else if (tag === "U") style.underline = {};
    else if (tag.startsWith("C:")) style.color = tag.slice(2);
    runs.push(new TextRun(style));
    lastIndex = m.index + m[0].length;
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun({ ...base, text: text.slice(lastIndex) }));
  }

  return runs.length > 0 ? runs : [new TextRun({ ...base, text })];
}

export interface DocxBlock {
  type: "paragraph" | "heading" | "table" | "image";
  text?: string;           // full original text (includes emoji prefix)
  level?: number;          // 1-6 for headings
  placeholder?: string;    // e.g. "[TABLE_1]", "[IMG_1]"
  rawData?: unknown;
  alignment?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isBlockQuote?: boolean;  // apply left indent + left border in output
  isCode?: boolean;        // never translate; copy byte-for-byte to output
  emojiPrefix?: string;    // leading emoji stripped before sending to translation
  cells?: string[][];      // [row][col] = cell text (table blocks only)
}

export interface ExtractedDocx {
  blocks: DocxBlock[];
  charCount: number;
  translatable: string;
}

export async function extractDocx(buffer: Buffer): Promise<ExtractedDocx> {
  const htmlResult = await mammoth.convertToHtml(
    { buffer },
    { styleMap: MAMMOTH_STYLE_MAP }
  );
  const html = htmlResult.value;
  const blocks = parseHtmlToBlocks(html);

  const charCount = blocks
    .filter((b) => b.text)
    .reduce((sum, b) => sum + (b.text?.length ?? 0), 0);

  let translatable = "";
  let imgCount = 0;
  let tableCount = 0;

  blocks.forEach((block, i) => {
    if (block.type === "image") {
      imgCount++;
      block.placeholder = `[IMG_${imgCount}]`;
      translatable += `[IMG_${imgCount}]\n`;
    } else if (block.type === "table") {
      tableCount++;
      block.placeholder = `[TABLE_${tableCount}]`;
      translatable += `[TABLE_${tableCount}]\n`;
      // Add each translatable cell with row/col coordinates
      block.cells?.forEach((row, r) => {
        row.forEach((cellText, c) => {
          const trimmed = cellText.trim();
          if (trimmed && !NO_TRANSLATE_RE.test(trimmed)) {
            translatable += `[TABLE_${tableCount}_ROW_${r}_COL_${c}] ${trimmed}\n`;
          }
        });
      });
    } else if (block.isCode) {
      // Code blocks are opaque — never send to translation API
      translatable += `[CODE_${i}]\n`;
    } else if (block.text) {
      // Strip emoji prefix before translation; it will be prepended back in buildDocx
      const textToTranslate = block.emojiPrefix
        ? block.text.slice(block.emojiPrefix.length).trim()
        : block.text;
      if (textToTranslate) {
        translatable += `[BLOCK_${i}] ${textToTranslate}\n`;
      }
    }
  });

  return { blocks, charCount, translatable };
}

function brToNewline(html: string): string {
  return html.replace(/<br\s*\/?>/gi, "\n");
}

// Strip HTML tags; convert </p> and </li> to newlines to preserve paragraph breaks
function stripToText(html: string): string {
  return brToNewline(html)
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseTableCells(tableHtml: string): string[][] {
  const rows: string[][] = [];
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowPattern.exec(tableHtml)) !== null) {
    const cells: string[] = [];
    const cellPattern = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;

    while ((cellMatch = cellPattern.exec(rowMatch[1])) !== null) {
      cells.push(stripToText(cellMatch[1]));
    }

    if (cells.length > 0) rows.push(cells);
  }

  return rows;
}

function parseHtmlToBlocks(html: string): DocxBlock[] {
  const blocks: DocxBlock[] = [];
  const tagPattern = /<(h[1-6]|p|blockquote|pre|table|img)[^>]*>([\s\S]*?)<\/\1>|<img[^>]*\/?>/gi;

  let match;
  while ((match = tagPattern.exec(html)) !== null) {
    const tag = match[1]?.toLowerCase();
    const content = match[2] ?? "";

    if (!tag) continue;

    if (/^h[1-6]$/.test(tag)) {
      const plainText = stripToText(content);
      if (plainText) {
        blocks.push({ type: "heading", text: plainText, level: parseInt(tag[1]) });
      }
    } else if (tag === "p") {
      const isCode = /<code>/i.test(content);
      // Inject style markers before stripping tags so they survive into block.text
      const marked = injectInlineMarkers(content);
      const plainText = stripToText(marked);

      if (!plainText) continue;

      const emojiPrefix = extractLeadingEmoji(plainText) || undefined;

      blocks.push({ type: "paragraph", text: plainText, isCode, emojiPrefix });
    } else if (tag === "blockquote") {
      const marked = injectInlineMarkers(content);
      const plainText = stripToText(marked);
      if (!plainText) continue;

      const emojiPrefix = extractLeadingEmoji(plainText) || undefined;

      blocks.push({ type: "paragraph", text: plainText, isBlockQuote: true, emojiPrefix });
    } else if (tag === "pre") {
      // Code block — preserve whitespace and newlines, never translate
      const codeText = brToNewline(content).replace(/<[^>]+>/g, "");
      if (codeText.trim()) {
        blocks.push({ type: "paragraph", text: codeText, isCode: true });
      }
    } else if (tag === "table") {
      const cells = parseTableCells(content);
      if (cells.length > 0) {
        blocks.push({ type: "table", cells, rawData: content });
      }
    } else if (tag === "img") {
      blocks.push({ type: "image" });
    }
  }

  return blocks;
}

// Parse [BLOCK_N] markers from AI output → block index → translated text
export function parseTranslatedOutput(translatedText: string, blockCount: number): Map<number, string> {
  const map = new Map<number, string>();
  for (const line of translatedText.split("\n")) {
    const m = line.match(/^\[BLOCK_(\d+)\]\s*(.*)/);
    if (m) {
      const idx = parseInt(m[1]);
      if (idx < blockCount) map.set(idx, m[2].trim());
    }
  }
  return map;
}

// Parse [TABLE_N_ROW_R_COL_C] markers → "tableIdx_row_col" → translated text
export function parseTableCellTranslations(translatedText: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of translatedText.split("\n")) {
    const m = line.match(/^\[TABLE_(\d+)_ROW_(\d+)_COL_(\d+)\]\s*(.*)/);
    if (m) {
      map.set(`${m[1]}_${m[2]}_${m[3]}`, m[4].trim());
    }
  }
  return map;
}

// Rebuild DOCX with translated text injected back into blocks
export async function buildDocx(
  blocks: DocxBlock[],
  translatedMap: Map<number, string>,
  tableCellMap?: Map<string, string>
): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  const headingLevels: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
    5: HeadingLevel.HEADING_5,
    6: HeadingLevel.HEADING_6,
  };

  let tableCount = 0;

  blocks.forEach((block, i) => {
    if (block.type === "image") {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: block.placeholder ?? "", color: "888888", size: 18 })],
        })
      );
      return;
    }

    if (block.type === "table") {
      tableCount++;
      const tIdx = tableCount;
      const rows = block.cells ?? [];
      if (rows.length === 0) return;

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: rows.map((row, r) =>
            new TableRow({
              children: row.map((cellText, c) => {
                const translated = tableCellMap?.get(`${tIdx}_${r}_${c}`);
                return new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: translated ?? cellText })],
                    }),
                  ],
                });
              }),
            })
          ),
        })
      );
      return;
    }

    // Code blocks: copy original text line-by-line, never replace with translation
    if (block.isCode) {
      for (const line of (block.text ?? "").split("\n")) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line, font: "Courier New", size: 18 })],
          })
        );
      }
      return;
    }

    // Reconstruct text: translated body + restored emoji prefix
    const translatedBody =
      translatedMap.get(i) ??
      (block.emojiPrefix ? block.text?.slice(block.emojiPrefix.length).trim() : block.text) ??
      "";
    const finalText = block.emojiPrefix ? block.emojiPrefix + translatedBody : translatedBody;

    if (block.type === "heading" && block.level) {
      children.push(
        new Paragraph({
          text: finalText,
          heading: headingLevels[block.level] ?? HeadingLevel.HEADING_1,
        })
      );
    } else {
      children.push(
        new Paragraph({
          indent: block.isBlockQuote ? { left: 720, right: 720 } : undefined,
          border: block.isBlockQuote
            ? { left: { style: BorderStyle.SINGLE, size: 6, space: 8, color: "AAAAAA" } }
            : undefined,
          children: parseStyledRuns(finalText, { bold: block.isBold, italics: block.isItalic }),
        })
      );
    }
  });

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
