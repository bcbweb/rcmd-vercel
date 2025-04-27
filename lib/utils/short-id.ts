/**
 * Simple, deterministic UUID ↔ short ID conversion
 * This implementation uses base62 encoding and is fully reversible
 * without requiring database lookups
 */

// URL-friendly alphabet (0-9, A-Z, a-z)
const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const BASE = ALPHABET.length;

/**
 * Convert a UUID to a short ID
 * This is a deterministic, reversible encoding
 */
export function getShortIdFromUUID(uuid: string): string {
  // Remove dashes from UUID
  const cleanUuid = uuid.replace(/-/g, "");

  // Convert hex UUID to a decimal number (as a string to handle large numbers)
  const decimal = BigInt(`0x${cleanUuid}`);

  // Convert to base62
  let shortId = "";
  let value = decimal;

  // Convert to our custom base
  while (value > 0) {
    shortId = ALPHABET[Number(value % BigInt(BASE))] + shortId;
    value = value / BigInt(BASE);
  }

  // Ensure minimum length (for consistency - can be adjusted)
  const minLength = 10;
  return shortId.padStart(minLength, "0");
}

/**
 * Convert a short ID back to a UUID
 * This is the reverse of getShortIdFromUUID
 */
export function getUUIDFromShortId(shortId: string): string {
  // Convert from base62 to decimal
  let decimal = BigInt(0);

  for (let i = 0; i < shortId.length; i++) {
    const char = shortId[i];
    const value = ALPHABET.indexOf(char);
    if (value === -1) {
      throw new Error(`Invalid character in short ID: ${char}`);
    }
    decimal = decimal * BigInt(BASE) + BigInt(value);
  }

  // Convert decimal to hex
  let hex = decimal.toString(16);

  // Pad to ensure full length
  hex = hex.padStart(32, "0");

  // Format as UUID with dashes
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// For compatibility with existing code
export const encodeUUID = getShortIdFromUUID;
export const decodeToUUID = getUUIDFromShortId;
