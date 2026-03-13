const KEY_DERIVATION_ITERATIONS = 240000;

function bytesToBase64(bytes) {
  let binary = "";

  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });

  return window.btoa(binary);
}

function base64ToBytes(value) {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export async function deriveHistoryKey(password, historySalt) {
  const passwordBytes = new TextEncoder().encode(password);
  const saltBytes = base64ToBytes(historySalt);
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    passwordBytes,
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: KEY_DERIVATION_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function exportHistoryKey(key) {
  return window.crypto.subtle.exportKey("jwk", key);
}

export async function importHistoryKey(serializedKey) {
  return window.crypto.subtle.importKey(
    "jwk",
    serializedKey,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function encryptHistoryEntry(key, entry) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const entryBytes = new TextEncoder().encode(JSON.stringify(entry));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    entryBytes,
  );

  return {
    encrypted_payload: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
  };
}

export async function decryptHistoryEntry(key, encryptedEntry) {
  try {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64ToBytes(encryptedEntry.iv),
      },
      key,
      base64ToBytes(encryptedEntry.encrypted_payload),
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    return null;
  }
}
