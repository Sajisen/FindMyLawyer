import { validUpload } from "./verificationUploadValidation.js";
export { validUpload };
import mongoose from "mongoose";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export const fileBucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "verificationFiles" });

export async function storeVerificationFile(kind, type, buffer) {
  const bucket = fileBucket();
  const upload = bucket.openUploadStream(`${kind}-${Date.now()}`, { contentType: type });
  await pipeline(Readable.from(buffer), upload);
  return { fileId: upload.id, contentType: type, size: buffer.length, uploadedAt: new Date() };
}
