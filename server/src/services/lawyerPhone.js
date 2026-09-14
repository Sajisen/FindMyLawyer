import LawyerProfile from "../models/LawyerProfile.js";
import { normalizeSriLankanPhone } from "./phoneFormat.js";
export { normalizeSriLankanPhone } from "./phoneFormat.js";

// Store Sri Lankan phone numbers in one format so 077..., 9477..., and
// +94 77... are the same value. Demo placeholders are excluded.
export async function isPhoneInUse(normalizedPhone, excludeId = null) {
  const filter = { isDemo: { $ne: true }, normalizedPhone };
  if (excludeId) filter._id = { $ne: excludeId };
  if (await LawyerProfile.exists(filter)) return true;

  // Accounts created before normalizedPhone existed may have formatted numbers.
  const legacyFilter = { isDemo: { $ne: true }, normalizedPhone: { $exists: false } };
  if (excludeId) legacyFilter._id = { $ne: excludeId };
  const cursor = LawyerProfile.find(legacyFilter).select("phone").lean().cursor();
  for await (const profile of cursor) {
    if (normalizeSriLankanPhone(profile.phone) === normalizedPhone) return true;
  }
  return false;
}

export function isPhoneDuplicateError(error) {
  return error?.code === 11000 && (error.keyPattern?.normalizedPhone || String(error.message).includes("normalizedPhone"));
}
