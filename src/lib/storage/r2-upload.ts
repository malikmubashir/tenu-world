"use server";

import { createClient } from "@/lib/supabase/server";

interface UploadResult {
  key: string;
  url: string;
  sizeBytes: number;
}

export async function uploadPhotoToR2(
  roomId: string,
  formData: FormData,
): Promise<UploadResult> {
  // verify auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const file = formData.get("photo") as File;
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("Invalid file: must be an image");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.type === "image/png" ? "png" : "jpg";
  const key = `${user.id}/${roomId}/${Date.now()}.${ext}`;

  // upload to R2 via S3-compatible API
  const accountId = process.env.R2_ACCOUNT_ID!;
  const bucket = process.env.R2_BUCKET_NAME!;
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const s3 = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }),
  );

  const publicUrl = process.env.R2_PUBLIC_URL
    ? `${process.env.R2_PUBLIC_URL}/${key}`
    : `${endpoint}/${bucket}/${key}`;

  return {
    key,
    url: publicUrl,
    sizeBytes: buffer.length,
  };
}
