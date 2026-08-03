import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"

function getEncryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is required for encryption")
  return crypto.createHash("sha256").update(secret).digest()
}

export function encrypt(text: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  const authTag = cipher.getAuthTag().toString("hex")
  return `${iv.toString("hex")}:${authTag}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey()
  const parts = encryptedText.split(":")
  if (parts.length !== 3) throw new Error("Invalid encrypted format")
  const [ivHex, authTagHex, ciphertext] = parts
  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(ciphertext, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}
