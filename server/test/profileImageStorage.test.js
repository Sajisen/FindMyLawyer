import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_PROFILE_IMAGE_BYTES,
  ProfileImageValidationError,
  validateProfileImage,
} from "../src/services/profileImageStorage.js";

function jpegBuffer() {
  return Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43]);
}

function pngBuffer() {
  return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
}

function webpBuffer() {
  return Buffer.from("RIFF0000WEBPpayload", "ascii");
}

test("profile image validation accepts supported formats whose bytes match the MIME type", () => {
  assert.equal(validateProfileImage(jpegBuffer(), "image/jpeg").extension, ".jpg");
  assert.equal(validateProfileImage(pngBuffer(), "image/png").extension, ".png");
  assert.equal(validateProfileImage(webpBuffer(), "image/webp").extension, ".webp");
});

test("profile image validation rejects a spoofed content type", () => {
  assert.throws(
    () => validateProfileImage(Buffer.from("not an image"), "image/png"),
    ProfileImageValidationError
  );
});

test("profile image validation rejects unsupported formats", () => {
  assert.throws(
    () => validateProfileImage(Buffer.from("GIF89a"), "image/gif"),
    /JPEG, PNG, or WebP/
  );
});

test("profile image validation rejects files over the configured size", () => {
  const oversized = Buffer.alloc(MAX_PROFILE_IMAGE_BYTES + 1);
  oversized[0] = 0xff;
  oversized[1] = 0xd8;
  oversized[2] = 0xff;

  assert.throws(
    () => validateProfileImage(oversized, "image/jpeg"),
    (error) => error instanceof ProfileImageValidationError && error.statusCode === 413
  );
});
