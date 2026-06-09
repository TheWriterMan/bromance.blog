import { customAlphabet } from "nanoid";

/**
 * Generate a 12-character alphanumeric ID.
 * 36^12 ≈ 4.7 × 10^18 possible IDs — more than sufficient for a blog.
 * URL-safe, lowercase, easy to read/copy.
 */
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

export function generateId(): string {
  return nanoid();
}
