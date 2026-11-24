import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
const secret = randomBytes(32);
const TTL = 300000;
const MAX_ATTEMPTS = 5;
const MAX_ENTRIES = 10000;
interface Record { digest: Buffer; expiresAt: number; createdAt: number; attempts: number }
const records = new Map<string, Record>();
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
const digest = (email: string, code: string) =>
  createHmac('sha256', secret).update(email + ':' + code).digest();
function prune(now: number) {
  for (const [key, value] of records) if (value.expiresAt <= now) records.delete(key);
}
export function generateCode(): string { return randomInt(100000, 1000000).toString(); }
export function canSendCode(email: string): boolean {
  const now = Date.now(), key = normalizeEmail(email);
  prune(now);
  const record = records.get(key);
  return (!record || now - record.createdAt >= 60000) && (records.has(key) || records.size < MAX_ENTRIES);
}
export function storeCode(email: string, code: string): void {
  const key = normalizeEmail(email), now = Date.now();
  prune(now);
  if (!records.has(key) && records.size >= MAX_ENTRIES) throw new Error('Verification capacity reached');
  records.set(key, { digest: digest(key, code), expiresAt: now + TTL, createdAt: now, attempts: 0 });
}
export function invalidateCode(email: string): void {
  const record = records.get(normalizeEmail(email));
  if (record) record.attempts = MAX_ATTEMPTS;
}
export function verifyCode(email: string, code: string, consume = true): boolean {
  const key = normalizeEmail(email), record = records.get(key);
  if (!record || record.expiresAt <= Date.now() || record.attempts >= MAX_ATTEMPTS) return false;
  if (!/^\d{6}$/.test(code) || !timingSafeEqual(record.digest, digest(key, code))) {
    record.attempts++;
    return false;
  }
  // Consume synchronously before awaiting the database; preserve resend cooldown.
  if (consume) record.attempts = MAX_ATTEMPTS;
  return true;
}
