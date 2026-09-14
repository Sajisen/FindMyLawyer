// Normalize Sri Lankan fixed and mobile numbers into +94 followed by nine digits.
export function normalizeSriLankanPhone(value) {
  if (typeof value !== "string") return null;
  const compact = value.trim().replace(/[\s()-]/g, "");
  if (/^0[1-9]\d{8}$/.test(compact)) return `+94${compact.slice(1)}`;
  if (/^94[1-9]\d{8}$/.test(compact)) return `+${compact}`;
  if (/^\+94[1-9]\d{8}$/.test(compact)) return compact;
  return null;
}
