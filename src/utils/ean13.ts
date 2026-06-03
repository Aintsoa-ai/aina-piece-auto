/**
 * Utility to convert any alphanumeric text into a deterministic 13-digit EAN-13 barcode
 * and check if a scanned EAN-13 matches a given text.
 */

export const getEAN13FromText = (text: string | null | undefined): string => {
  if (!text) return '2000000000000';
  const clean = text.trim();
  
  // If it's already a valid 12 or 13 digit number, return it clean (EAN-13 or EAN-13 base)
  if (/^\d{12,13}$/.test(clean)) {
    const base = clean.substring(0, 12);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(base[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checksum = (10 - (sum % 10)) % 10;
    return base + checksum;
  }
  
  // Convert alphanumeric text (e.g. "Y16") to a deterministic 12-digit number
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  // Convert negative hash to positive, pad/slice to exactly 10 digits
  const absHash = Math.abs(hash).toString();
  const base = '20' + absHash.padStart(10, '0').substring(0, 10);
  
  // Calculate EAN-13 checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const checksum = (10 - (sum % 10)) % 10;
  return base + checksum;
};
