/**
 * AdbCredentialStore for @yume-chan/adb 2.x (Tango ADB)
 *
 * In 2.x the interface is:
 *   generateKey(): ValueOrPromise<{ buffer: Uint8Array; name: string }>
 *   iterateKeys(): Iterable<{ buffer: Uint8Array; name: string }> | AsyncIterable<...>
 *
 * The RSA private key is encrypted at rest with AES-256-GCM.
 * The AES key is stored as raw bytes in localStorage (extractable during
 * generation so it can be exported; imported as non-extractable for use).
 * On first use a new AES key is generated; on subsequent loads it is
 * retrieved from localStorage.
 */

import type { AdbCredentialStore } from "@yume-chan/adb";

const RSA_STORAGE_KEY = "yaadu:adb-private-key";
const AES_STORAGE_KEY = "yaadu:aes-key";

const AES_ALGORITHM: AesKeyGenParams = { name: "AES-GCM", length: 256 };
const AES_USAGES: KeyUsage[] = ["encrypt", "decrypt"];

const KEY_ALGORITHM: RsaHashedKeyGenParams = {
  name: "RSASSA-PKCS1-v1_5",
  modulusLength: 2048,
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
  hash: "SHA-1",
};

// ── Base64 helpers ──────────────────────────────────────────────────────

function bufToBase64(buf: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return btoa(binary);
}

function base64ToBuf(b64: string): Uint8Array {
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf;
}

// ── AES key helpers (stored as raw bytes in localStorage) ──────────────

async function loadAesKey(): Promise<CryptoKey | null> {
  try {
    const stored = localStorage.getItem(AES_STORAGE_KEY);
    if (!stored) return null;
    const raw = base64ToBuf(stored);
    return await crypto.subtle.importKey("raw", raw, AES_ALGORITHM, false, AES_USAGES);
  } catch {
    return null;
  }
}

async function saveAesKey(key: CryptoKey): Promise<void> {
  const raw = await crypto.subtle.exportKey("raw", key);
  localStorage.setItem(AES_STORAGE_KEY, bufToBase64(new Uint8Array(raw)));
}

async function loadOrCreateAesKey(): Promise<CryptoKey> {
  const existing = await loadAesKey();
  if (existing) return existing;

  const key = await crypto.subtle.generateKey(AES_ALGORITHM, true, AES_USAGES);
  await saveAesKey(key);
  return key;
}

// ── Encrypt / decrypt helpers ───────────────────────────────────────────

async function encryptRsaKey(
  aesKey: CryptoKey,
  plaintext: Uint8Array,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    plaintext,
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return bufToBase64(combined);
}

async function decryptRsaKey(
  aesKey: CryptoKey,
  stored: string,
): Promise<Uint8Array> {
  const combined = base64ToBuf(stored);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    ciphertext,
  );
  return new Uint8Array(plaintext);
}

// ── Credential store ────────────────────────────────────────────────────

export class YaaduCredentialStore implements AdbCredentialStore {
  private _keyCache: Uint8Array | null = null;
  private _aesKey: CryptoKey | null = null;

  async generateKey(): Promise<{ buffer: Uint8Array; name: string }> {
    const keyPair = await crypto.subtle.generateKey(KEY_ALGORITHM, true, [
      "sign",
      "verify",
    ]);
    const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const buffer = new Uint8Array(pkcs8);

    this._aesKey ??= await loadOrCreateAesKey();
    const encrypted = await encryptRsaKey(this._aesKey, buffer);
    localStorage.setItem(RSA_STORAGE_KEY, encrypted);

    this._keyCache = buffer;
    console.info("[YAADU] Generated new RSA-2048 credential (encrypted at rest).");
    return { buffer, name: "YAADU" };
  }

  async *iterateKeys(): AsyncIterable<{ buffer: Uint8Array; name: string }> {
    if (this._keyCache) {
      yield { buffer: this._keyCache, name: "YAADU" };
      return;
    }

    const stored = localStorage.getItem(RSA_STORAGE_KEY);
    if (!stored) return;

    try {
      this._aesKey ??= await loadOrCreateAesKey();
      this._keyCache = await decryptRsaKey(this._aesKey, stored);
      yield { buffer: this._keyCache, name: "YAADU" };
    } catch {
      console.warn("[YAADU] Stored credential corrupt or encryption key unavailable; skipping.");
    }
  }

  clearKey(): void {
    localStorage.removeItem(RSA_STORAGE_KEY);
    localStorage.removeItem(AES_STORAGE_KEY);
    this._keyCache = null;
  }

  hasKey(): boolean {
    return !!localStorage.getItem(RSA_STORAGE_KEY);
  }
}

export const credentialStore = new YaaduCredentialStore();
