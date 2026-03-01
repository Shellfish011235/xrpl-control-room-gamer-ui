/**
 * Secure wallet: unlock with password, local encrypted seed storage (WebCrypto).
 * PBKDF2 + AES-GCM; seed stored in localStorage, never in plaintext.
 */

import { useEffect, useMemo, useState } from 'react';
import { Wallet } from 'xrpl';

const STORAGE_KEY = 'cr_encrypted_seed_v1';
const SALT_KEY = 'cr_seed_salt_v1';
const IV_LEN = 12;
const SALT_LEN = 16;
const PBKDF2_ITERS = 150_000;

function bufToB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64ToBuf(b64: string): Uint8Array {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

async function deriveAesKey(password: string, saltBytes: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new Uint8Array(saltBytes), iterations: PBKDF2_ITERS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptSeed(seed: string, password: string): Promise<void> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  let saltBytes: Uint8Array;
  const saltStored = localStorage.getItem(SALT_KEY);
  if (saltStored) {
    saltBytes = b64ToBuf(saltStored);
  } else {
    saltBytes = crypto.getRandomValues(new Uint8Array(SALT_LEN));
    localStorage.setItem(SALT_KEY, bufToB64(saltBytes));
  }
  const key = await deriveAesKey(password, saltBytes);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(seed));
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  localStorage.setItem(STORAGE_KEY, bufToB64(combined));
}

async function decryptSeed(password: string): Promise<string | null> {
  const stored = localStorage.getItem(STORAGE_KEY);
  const saltStored = localStorage.getItem(SALT_KEY);
  if (!stored || !saltStored) return null;
  const combined = b64ToBuf(stored);
  const iv = combined.slice(0, IV_LEN);
  const cipher = combined.slice(IV_LEN);
  const saltBytes = b64ToBuf(saltStored);
  const key = await deriveAesKey(password, saltBytes);
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

export default function useSecureWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [locked, setLocked] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasSavedSeed = useMemo(() => {
    try {
      return !!localStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    setLocked(true);
  }, []);

  function lock(): void {
    setWallet(null);
    setAddress(null);
    setLocked(true);
    setError(null);
  }

  async function unlock(password: string): Promise<boolean> {
    setError(null);
    const seed = await decryptSeed(password);
    if (!seed) {
      setError('Unlock failed (wrong password or no saved wallet).');
      return false;
    }
    try {
      const w = Wallet.fromSeed(seed);
      setWallet(w);
      setAddress(w.classicAddress);
      setLocked(false);
      return true;
    } catch {
      setError('Saved seed is invalid or corrupted.');
      return false;
    }
  }

  async function saveSeed(seed: string, password: string): Promise<Wallet> {
    setError(null);
    await encryptSeed(seed, password);
    const w = Wallet.fromSeed(seed);
    setWallet(w);
    setAddress(w.classicAddress);
    setLocked(false);
    return w;
  }

  function clearSavedWallet(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SALT_KEY);
    } catch {
      // ignore
    }
    lock();
  }

  return {
    wallet,
    address,
    locked,
    error,
    hasSavedSeed,
    unlock,
    saveSeed,
    lock,
    clearSavedWallet,
  };
}
