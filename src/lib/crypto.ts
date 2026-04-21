import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LEN = 12
const TAG_LEN = 16

function getKey(): Buffer {
  const hex = process.env.CHECKIN_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('CHECKIN_ENCRYPTION_KEY must be 32-byte hex (64 chars)')
  }
  return Buffer.from(hex, 'hex')
}

/** 휴대폰 번호 AES-256-GCM 암호화 → Buffer (iv || ciphertext || authTag) */
export function encryptPhone(phone: string): Buffer {
  const key = getKey()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(phone, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, encrypted, tag])
}

/** 복호화 */
export function decryptPhone(data: Buffer): string {
  const key = getKey()
  const iv = data.subarray(0, IV_LEN)
  const tag = data.subarray(data.length - TAG_LEN)
  const ciphertext = data.subarray(IV_LEN, data.length - TAG_LEN)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

/** SHA-256 해시 (비식별화 후 참조용) */
export function hashPhone(phone: string): string {
  return createHash('sha256').update(phone).digest('hex')
}

/** 이메일 마스킹: abc***@gmail.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  const visible = local.length >= 3 ? local.slice(0, 3) : local.slice(0, 1)
  return `${visible}***@${domain}`
}

/** Q&A / 설문 submitter_token 생성 */
export function makeSubmitterToken(eventId: string, cookie: string): string {
  const salt = process.env.SUBMITTER_TOKEN_SALT
  if (!salt) throw new Error('SUBMITTER_TOKEN_SALT 환경변수가 설정되지 않았습니다')
  return createHash('sha256').update(`${eventId}|${cookie}|${salt}`).digest('hex')
}

/** IP 해시 (일별 솔트) */
export function hashIp(ip: string): string {
  const dailySalt = new Date().toISOString().slice(0, 10)
  return createHash('sha256').update(`${ip}|${dailySalt}`).digest('hex')
}

/** 휴대폰 번호 정규화: 다양한 형식 → 01012345678 */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('82')) digits = '0' + digits.slice(2)
  return digits
}
