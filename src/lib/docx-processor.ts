import mammoth from "mammoth";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";

export interface DocxBlock {
  type: "paragraph" | "heading" | "table" | "image";
  text?: string;         // for paragraph/heading
  level?: number;        // 1-6 for headings
  placeholder?: string;  // e.g. "[TABLE_1]", "[IMG_1]"
  rawData?: unknown;     // original mammoth element for tables/images
  alignment?: string;
  isBold?: boolean;
  isItalic?: boolean;
}

export interface ExtractedDocx {
  blocks: DocxBlock[];
  charCount: number;
  translatable: string; // all text concatenated with [BLOCK_N] markers for AI
}

// Extract structured content from a DOCX buffer
export async function extractDocx(buffer: Buffer): Promise<ExtractedDocx> {
  const result = await mammoth.extractRawText({ buffer });
  const fullText = result.value;

  // Use mammoth's HTML output to detect structure
  const htmlResult = await mammoth.convertToHtml({ buffer });
  const html = htmlResult.value;

  const blocks = parseHtmlToBlocks(html);
  const charCount = blocks
    .filter((b) => b.text)
    .reduce((sum, b) => sum + (b.text?.length ?? 0), 0);

  // Build translatable string: text blocks get [BLOCK_N] markers
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
    } else if (block.text) {
      translatable += `[BLOCK_${i}] ${block.text}\n`;
    }
  });

  return { blocks, charCount, translatable };
}

function parseHtmlToBlocks(html: string): DocxBlock[] {
  const blocks: DocxBlock[] = [];
  // Simple regex-based HTML parser — handles mammoth's clean output
  const tagPattern = /<(h[1-6]|p|table|img)[^>]*>([\s\S]*?)<\/\1>|<img[^>]*>/gi;
  let match;

  while ((match = tagPattern.exec(html)) !== null) {
    const tag = match[1]?.toLowerCase();
    const content = match[2] ?? "";
    const plainText = content.replace(/<[^>]+>/g, "").trim();

    if (!tag) continue;

    if (tag.match(/^h[1-6]$/)) {
      blocks.push({
        type: "heading",
        text: plainText,
        level: parseInt(tag[1]),
      });
    } else if (tag === "p") {
      if (plainText) {
        const isBold = /<strong>/i.test(content);
        const isItalic = /<em>/i.test(content);
        blocks.push({ type: "paragraph", text: plainText, isBold, isItalic });
      }
    } else if (tag === "table") {
      blocks.push({ type: "table", rawData: content });
    } else if (tag === "img") {
      blocks.push({ type: "image" });
    }
  }

  return blocks;
}

// Rebuild DOCX with translated text injected back into blocks
export async function buildDocx(
  blocks: DocxBlock[],
  translatedMap: Map<number, string>
): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  const headingLevels: Record<number, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
    5: HeadingLevel.HEADING_5,
    6: HeadingLevel.HEADING_6,
  };

  blocks.forEach((block, i) => {
    if (block.type === "image" || block.type === "table") {
      // Keep placeholder paragraph for images/tables
      children.push(
        new Paragraph({
          children: [new TextRun({ text: block.placeholder ?? "", color: "888888", size: 18 })],
        })
      );
      return;
    }

    const text = translatedMap.get(i) ?? block.text ?? "";

    if (block.type === "heading" && block.level) {
      children.push(
        new Paragraph({
          text,
          heading: headingLevels[block.level] ?? HeadingLevel.HEADING_1,
        })
      );
    } else {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text,
              bold: block.isBold,
              italics: block.isItalic,
            }),
          ],
        })
      );
    }
  });

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}

// Parse the AI output back into a block-index → text map
export function parseTranslatedOutput(
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
