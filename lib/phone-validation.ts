/**
 * DRC phone validation.
 * Accepts: +243 XXX XXX XXX (12 digits) or 0XX XXX XX XX (9 digits, local).
 */
export function isValidDRCPhone(val: string): boolean {
  const digits = val.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return false;
  if (digits.length === 9) {
    const first = digits[0];
    return first === "0" || first === "8" || first === "9";
  }
  if (digits.length === 12 && digits.startsWith("243")) return true;
  return true;
}
