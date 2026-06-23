import { randomInt } from 'node:crypto';

const CHARACTER_POOL =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randomSegment(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const idx = randomInt(0, CHARACTER_POOL.length);
    result += CHARACTER_POOL[idx];
  }
  return result;
}
export function generateCourseToken(): string {
  return `${randomSegment(4)}-${randomSegment(4)}`;
}
