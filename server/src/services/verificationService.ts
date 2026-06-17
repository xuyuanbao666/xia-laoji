// 验证码存储（内存存储，生产环境建议用 Redis）
interface VerificationRecord {
  code: string;
  email: string;
  expiresAt: number;
  createdAt: number;
}

const verificationStore = new Map<string, VerificationRecord>();

// 清理过期验证码（每5分钟执行一次）
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of verificationStore.entries()) {
    if (record.expiresAt < now) {
      verificationStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * 生成6位随机验证码
 */
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 存储验证码（5分钟有效期）
 */
export function storeCode(email: string, code: string): void {
  // 删除该邮箱之前的验证码
  for (const [key, record] of verificationStore.entries()) {
    if (record.email === email) {
      verificationStore.delete(key);
    }
  }

  verificationStore.set(email, {
    code,
    email,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5分钟
    createdAt: Date.now(),
  });

  console.log(`Code stored for ${email}: ${code}`);
}

/**
 * 验证码是否有效
 */
export function verifyCode(email: string, inputCode: string): boolean {
  const record = verificationStore.get(email);

  if (!record) {
    console.log(`No code found for ${email}`);
    return false;
  }

  if (record.expiresAt < Date.now()) {
    verificationStore.delete(email);
    console.log(`Code expired for ${email}`);
    return false;
  }

  if (record.code !== inputCode) {
    console.log(`Invalid code for ${email}: expected ${record.code}, got ${inputCode}`);
    return false;
  }

  // 验证成功，删除验证码（一次性使用）
  verificationStore.delete(email);
  return true;
}

/**
 * 检查是否发送太频繁（60秒内只能发一次）
 */
export function canSendCode(email: string): boolean {
  const record = verificationStore.get(email);
  if (!record) return true;
  return Date.now() - record.createdAt > 60 * 1000; // 60秒间隔
}
