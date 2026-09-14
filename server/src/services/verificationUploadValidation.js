export function validUpload(kind, type, buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 16 || buffer.length > 8 * 1024 * 1024) return false;
  if (kind === "certificate") return type === "application/pdf" && buffer.subarray(0, 5).toString() === "%PDF-";
  const image = ["nicFront", "nicBack", "passport"].includes(kind);
  const png = type === "image/png" && buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  const jpeg = type === "image/jpeg" && buffer.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"));
  return image && (png || jpeg);
}
