// Short, URL-safe, sufficiently-unique ID generator.
// Format: prefix_xxxxxxx (7 random chars)
const ALPHA = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function rid(len = 7) {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += ALPHA[Math.floor(Math.random() * ALPHA.length)];
  }
  return out;
}

export const idFor = (prefix) => `${prefix}_${rid()}`;
