/**
 * Simple encryption/decryption utilities for localStorage
 * Note: This provides basic obfuscation, not military-grade encryption
 * For production, consider more robust solutions or server-side token management
 */

const ENCRYPTION_KEY = 'preact-qdrant-gui-key-v1'; // In production, this should be environment-specific

/**
 * Simple XOR-based encryption (obfuscation)
 * Sufficient for preventing casual token exposure in localStorage
 */
export function encryptToken(token: string): string {
  if (!token) return '';
  
  try {
    const encrypted = Array.from(token)
      .map((char, i) => {
        const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
      })
      .join('');
    
    // Base64 encode to make it storage-safe
    return btoa(encrypted);
  } catch (error) {
    console.warn('Token encryption failed:', error);
    return token; // Fallback to plain token
  }
}

/**
 * Decrypt token encrypted with encryptToken
 */
export function decryptToken(encryptedToken: string): string {
  if (!encryptedToken) return '';
  
  try {
    // Base64 decode
    const encrypted = atob(encryptedToken);
    
    // XOR decrypt
    const decrypted = Array.from(encrypted)
      .map((char, i) => {
        const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
      })
      .join('');
    
    return decrypted;
  } catch (error) {
    console.warn('Token decryption failed, returning original:', error);
    return encryptedToken; // Fallback - might be plain token from old version
  }
}

/**
 * Check if a token appears to be encrypted
 */
export function isTokenEncrypted(token: string): boolean {
  if (!token) return false;
  
  // Check if it looks like base64
  try {
    return token === btoa(atob(token));
  } catch {
    return false;
  }
}
