// Minimal nanoid-like ID generator (no extra dependency)
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function nanoid(size = 12): string {
  let id = '';
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  for (const b of bytes) id += CHARS[b % CHARS.length];
  return id;
}
