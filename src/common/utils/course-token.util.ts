const TOKEN_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randomSegment(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * TOKEN_CHARS.length);
    result += TOKEN_CHARS[idx];
  }
  return result;
}
export function generateCourseToken(): string {
  return `${randomSegment(4)}-${randomSegment(4)}`;
}
