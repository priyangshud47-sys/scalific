/**
 * Pure Web Crypto API RFC 6238 TOTP (Google Authenticator) Verifier
 * Zero external dependencies. Uses native HMAC-SHA1 Web Crypto API.
 */

export async function verifyTOTPCode(token: string, secret: string): Promise<boolean> {
  const cleanToken = token.trim().replace(/\s+/g, "");
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) return false;

  const sanitizedSecret = secret.toUpperCase().replace(/[^A-Z2-7]/g, "");
  if (!sanitizedSecret) return false;

  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (let i = 0; i < sanitizedSecret.length; i++) {
    const val = base32Chars.indexOf(sanitizedSecret.charAt(i));
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }

  // Generate TOTP for current time windows (T-1, T, T+1) to accommodate 30s clock drift
  const now = Math.floor(Date.now() / 1000);
  const currentCounter = Math.floor(now / 30);

  for (let delta = -1; delta <= 1; delta++) {
    const counter = currentCounter + delta;
    const generatedCode = await generateTOTP(bytes, counter);
    if (generatedCode === cleanToken) return true;
  }

  return false;
}

async function generateTOTP(keyBytes: Uint8Array, counter: number): Promise<string> {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigInt64(0, BigInt(counter), false); // Big-endian 64-bit int

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const hmac = await crypto.subtle.sign("HMAC", cryptoKey, buffer);
  const hmacBytes = new Uint8Array(hmac);

  const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
  const binary =
    ((hmacBytes[offset] & 0x7f) << 24) |
    ((hmacBytes[offset + 1] & 0xff) << 16) |
    ((hmacBytes[offset + 2] & 0xff) << 8) |
    (hmacBytes[offset + 3] & 0xff);

  const otp = (binary % 1000000).toString().padStart(6, "0");
  return otp;
}

export function generateRandomSecretKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < 16; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}
