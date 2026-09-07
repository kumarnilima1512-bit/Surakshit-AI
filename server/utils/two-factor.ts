import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'

/**
 * Hash a 2FA PIN using Node's built-in scrypt.
 *
 * Stored format:
 * salt:hash
 */
export function hashTwoFactorPin(pin: string): string {
  const salt = randomBytes(16).toString('hex')

  const hash = scryptSync(
    pin,
    salt,
    64,
  ).toString('hex')

  return `${salt}:${hash}`
}

/**
 * Verify a PIN against the stored hash.
 */
export function verifyTwoFactorPin(
  pin: string,
  storedHash: string,
): boolean {
  const [salt, hash] = storedHash.split(':')

  if (!salt || !hash) {
    return false
  }

  const derivedHash = scryptSync(
    pin,
    salt,
    64,
  )

  const storedBuffer = Buffer.from(hash, 'hex')

  if (
    storedBuffer.length !==
    derivedHash.length
  ) {
    return false
  }

  return timingSafeEqual(
    storedBuffer,
    derivedHash,
  )
}

/**
 * Validate the format of a 2FA PIN.
 *
 * We use a 6-digit code.
 */
export function isValidTwoFactorPin(
  pin: string,
): boolean {
  return /^\d{6}$/.test(pin)
}