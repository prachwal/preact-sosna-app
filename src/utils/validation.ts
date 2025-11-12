/**
 * URL validation utilities
 */

/**
 * Validate if a string is a valid URL
 */
export function validateUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Check if URL uses HTTPS
 */
export function isHttpsUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Check if URL is localhost or local IP
 */
export function isLocalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    );
  } catch {
    return false;
  }
}

/**
 * Get security warning for URL if applicable
 */
export function getUrlSecurityWarning(url: string): string | null {
  if (!validateUrl(url)) {
    return 'Invalid URL format';
  }
  
  if (!isHttpsUrl(url) && !isLocalUrl(url)) {
    return 'Warning: Using HTTP for remote URL is insecure. Consider using HTTPS.';
  }
  
  return null;
}
