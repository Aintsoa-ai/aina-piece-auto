/**
 * Utility functions for formatting amounts, phone numbers, and helping with UI behavior
 */

/**
 * Formats a number to Ariary currency string: e.g. 1 500 000 Ar
 */
export const formatCurrency = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(Number(val))) return '0 Ar';
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0
  }).format(Number(val)) + ' Ar';
};

/**
 * Formats an input value (string) in real-time as thousands separator (e.g. "100000" -> "100 000")
 */
export const formatCurrencyInput = (rawVal: string): string => {
  // Remove non-digit characters
  const clean = rawVal.replace(/\D/g, '');
  if (!clean) return '';
  // Format with space separators
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0
  }).format(Number(clean));
};

/**
 * Parses a currency input string (e.g. "1 500 000") back to a standard number
 */
export const parseCurrencyInput = (formattedVal: string): number => {
  if (!formattedVal) return 0;
  const cleaned = formattedVal.replace(/\s/g, '');
  return Number(cleaned) || 0;
};

/**
 * Formats a phone number in real-time while typing or for display to: xxx xx xxx xx
 */
export const formatPhoneInput = (rawPhone: string): string => {
  // Remove non-digit characters
  const clean = rawPhone.replace(/\D/g, '').substring(0, 10);
  if (!clean) return '';
  
  const parts = [];
  // xxx xx xxx xx
  if (clean.length > 0) parts.push(clean.substring(0, 3));
  if (clean.length > 3) parts.push(clean.substring(3, 5));
  if (clean.length > 5) parts.push(clean.substring(5, 8));
  if (clean.length > 8) parts.push(clean.substring(8, 10));
  
  return parts.join(' ');
};

/**
 * Clean phone number back to raw digits
 */
export const parsePhoneInput = (formattedPhone: string): string => {
  return formattedPhone.replace(/\s/g, '');
};

/**
 * Helper to ensure a focused input is scrolled into view on mobile devices,
 * preventing it from being covered by the virtual keyboard.
 */
export const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const target = e.target;
  setTimeout(() => {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 300);
};
