/**
 * AdbCredentialStore for @yume-chan/adb 0.0.19
 *
 * In 0.0.19 the interface is:
 *   generateKey(): ValueOrPromise<Uint8Array>   ← raw PKCS#8 bytes
 *   iterateKeys(): Iterable<Uint8Array> | AsyncIterable<Uint8Array>
 */

import type { AdbCredentialStore } from "@yume-chan/adb";

const STORAGE_KEY = "yaadu:adb-private-key";
const KEY_ALGORITHM: RsaHashedKeyGenParams = {
  name: "RSASSA-PKCS1-v1_5",
  modulusLength: 2048,
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
  hash: "SHA-1",
};

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

export class YaaduCredentialStore implements AdbCredentialStore {
  async generateKey(): Promise<Uint8Array> {
    const keyPair = await crypto.subtle.generateKey(KEY_ALGORITHM, true, [
      "sign",
      "verify",
    ]);
    const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const buffer = new Uint8Array(pkcs8);
    localStorage.setItem(STORAGE_KEY, bufToBase64(buffer));
    console.info("[YAADU] Generated new RSA-2048 credential.");
    return buffer;
  }

  *iterateKeys(): Iterable<Uint8Array> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        yield base64ToBuf(stored);
      } catch {
        console.warn("[YAADU] Stored credential corrupt; skipping.");
      }
    }
  }

  clearKey(): void { localStorage.removeItem(STORAGE_KEY); }
  hasKey(): boolean { return !!localStorage.getItem(STORAGE_KEY); }
}

export const credentialStore = new YaaduCredentialStore();
