import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadFile } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const translation = await prisma.translation.findUnique({
    where: { id: params.id, userId: session.user.id },
  });

  if (!translation || !translation.translatedFilePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (translation.status !== "DONE") {
    return NextResponse.json({ error: "Translation not complete" }, { status: 409 });
  }

  const buffer = await downloadFile(translation.translatedFilePath);
  const isDocx = translation.outputFormat === "docx";
  const ext = isDocx ? "docx" : "pdf";
  const baseName = translation.originalFileName.replace(/\.[^.]+$/, "");
  const filename = `${baseName}_mongolian.${ext}`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": isDocx
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
