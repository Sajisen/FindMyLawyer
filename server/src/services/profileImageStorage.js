import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const PROFILE_IMAGE_DIRECTORY = path.resolve(
  currentDir,
  "../../uploads/profile-images"
);

export const MAX_PROFILE_IMAGE_BYTES = 4 * 1024 * 1024;

const TYPES = {
  "image/jpeg": { extension: ".jpg", signature: "jpeg" },
  "image/png": { extension: ".png", signature: "png" },
  "image/webp": { extension: ".webp", signature: "webp" },
};

export class ProfileImageValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "ProfileImageValidationError";
    this.statusCode = statusCode;
  }
}

function matchesSignature(buffer, signature) {
  if (!Buffer.isBuffer(buffer)) {
    return false;
  }

  if (signature === "jpeg") {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  if (signature === "png") {
    return (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      )
    );
  }

  if (signature === "webp") {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  return false;
}

export function validateProfileImage(buffer, mimeType = "") {
  const normalizedMime = String(mimeType).toLowerCase().split(";")[0].trim();
  const type = TYPES[normalizedMime];

  if (!type) {
    throw new ProfileImageValidationError(
      "Profile images must be JPEG, PNG, or WebP files."
    );
  }

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new ProfileImageValidationError("Choose an image to upload.");
  }

  if (buffer.length > MAX_PROFILE_IMAGE_BYTES) {
    throw new ProfileImageValidationError(
      "Profile images must be 4 MB or smaller.",
      413
    );
  }

  if (!matchesSignature(buffer, type.signature)) {
    throw new ProfileImageValidationError(
      "The uploaded file does not match its image type."
    );
  }

  return {
    mimeType: normalizedMime,
    extension: type.extension,
  };
}

export async function saveProfileImage(buffer, mimeType) {
  const validated = validateProfileImage(buffer, mimeType);
  await mkdir(PROFILE_IMAGE_DIRECTORY, { recursive: true });

  const filename = `${randomUUID()}${validated.extension}`;
  const absolutePath = path.join(PROFILE_IMAGE_DIRECTORY, filename);

  await writeFile(absolutePath, buffer, { flag: "wx" });

  return {
    filename,
    publicUrl: `/uploads/profile-images/${filename}`,
    mimeType: validated.mimeType,
  };
}

export async function deleteProfileImageByUrl(profileImageUrl) {
  const prefix = "/uploads/profile-images/";

  if (!profileImageUrl || !String(profileImageUrl).startsWith(prefix)) {
    return false;
  }

  const filename = path.basename(String(profileImageUrl));

  if (!/^[0-9a-f-]{36}\.(?:jpg|png|webp)$/i.test(filename)) {
    return false;
  }

  const absolutePath = path.join(PROFILE_IMAGE_DIRECTORY, filename);

  try {
    await unlink(absolutePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
