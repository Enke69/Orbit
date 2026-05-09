import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/storage";

// SSE endpoint — client polls every 2s for status updates
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const translationId = params.id;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };

      // Poll DB every 2 seconds for up to 10 minutes
      const maxAttempts = 300;
      let attempts = 0;

      const interval = setInterval(async () => {
        attempts++;

        const translation = await prisma.translation.findUnique({
          where: { id: translationId, userId: session.user.id },
        });

        if (!translation) {
          send({ phase: "failed", error: "Translation not found" });
          clearInterval(interval);
          controller.close();
          return;
        }

        if (translation.status === "PENDING") {
          send({ phase: "uploading", progress: 10 });
        } else if (translation.status === "PROCESSING") {
          // Simulate progress between 25–80%
          const progress = Math.min(80, 25 + attempts * 2);
          send({ phase: "translating", progress });
        } else if (translation.status === "DONE") {
          let downloadUrl = `/api/download/${translationId}`;
          if (translation.translatedFilePath) {
            try {
              downloadUrl = await getSignedUrl(translation.translatedFilePath, 3600);
            } catch {
              // fall back to download route
            }
          }
          send({ phase: "done", progress: 100, downloadUrl });
          clearInterval(interval);
          controller.close();
        } else if (translation.status === "FAILED") {
          send({ phase: "failed", error: translation.errorMessage ?? "Translation failed" });
          clearInterval(interval);
          controller.close();
        }

        if (attempts >= maxAttempts) {
          send({ phase: "failed", error: "Translation timed out" });
          clearInterval(interval);
          controller.close();
        }
      }, 2000);

      // Clean up if client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
