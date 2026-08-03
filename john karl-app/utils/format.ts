/**
 * Set of production utility formatting helpers.
 */

/**
 * Format date strings to standard readable forms.
 */
export const formatDate = (dateInput: string | Date | number, formatStyle: 'short' | 'medium' | 'full' = 'medium'): string => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const options: Intl.DateTimeFormatOptions = {};

  if (formatStyle === 'short') {
    options.month = 'numeric';
    options.day = 'numeric';
    options.year = '2-digit';
  } else if (formatStyle === 'medium') {
    options.month = 'short';
    options.day = 'numeric';
    options.year = 'numeric';
  } else {
    options.weekday = 'long';
    options.month = 'long';
    options.day = 'numeric';
    options.year = 'numeric';
  }

  return new Intl.DateTimeFormat('en-US', options).format(date);
};

/**
 * Format numbers as US Currencies ($)
 */
export const formatCurrency = (amount: number, currencyCode = 'USD'): string => {
  if (amount === undefined || amount === null) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};

/**
 * Truncate a long string and append ellipses
 */
export const truncateText = (text: string, maxLength = 100, suffix = '...'): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + suffix;
};

/**
 * Capitalize first letter of a string
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};
