import { createClient } from "@supabase/supabase-js";

// Server-side client with service role key (full access)
export function getStorageClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const BUCKET = "translations";

export async function uploadFile(
  buffer: Buffer,
  path: string,
  contentType: string
): Promise<string> {
  const supabase = getStorageClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return path;
}

export async function downloadFile(path: string): Promise<Buffer> {
  const supabase = getStorageClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw new Error(`Storage download failed: ${error.message}`);
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function getSignedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const supabase = getStorageClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw new Error(`Signed URL failed: ${error.message}`);
  return data.signedUrl;
}

export async function deleteFile(path: string): Promise<void> {
  const supabase = getStorageClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}
