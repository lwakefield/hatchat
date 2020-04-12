const KEY_PAIR_PARAMS = {
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-512",
};

function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

export async function generateIdentity () {
  return await crypto.subtle.generateKey(
    KEY_PAIR_PARAMS,
    true,
    ['sign', 'verify']
  );
}

export async function importB64Identity (b64keyPair) {
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    str2ab(atob(b64keyPair.privateKey)),
    KEY_PAIR_PARAMS,
    false,
    ['sign'],
  );
  const publicKey = await crypto.subtle.importKey(
    'spki',
    str2ab(atob(b64keyPair.publicKey)),
    KEY_PAIR_PARAMS,
    false,
    ['verify'],
  );

  return { privateKey, publicKey };
}

export async function exportB64Identity (keyPair) {
  const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
    .then(buf => btoa(ab2str(buf)));
  const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey)
    .then(buf => btoa(ab2str(buf)));
  return { privateKey, publicKey };
}

export async function exportPEMPublicKey (keyPair) {
  const { publicKey } = await exportB64Identity(keyPair);
  return `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
}

export async function generateToken (_claim, privateKey) {
    const header = JSON.stringify({ alg: KEY_PAIR_PARAMS.hash, type: 'JWT' });
    const claim = JSON.stringify(_claim);
    let token = `${btoa(header)}.${btoa(claim)}`;

    const _signature = await crypto.subtle.sign(
        KEY_PAIR_PARAMS.name,
        privateKey,
        new TextEncoder().encode(token)
    );
    const signature = btoa(ab2str(_signature));

    token += `.${signature}`;

    return `Bearer ${token}`;
}

export async function generateEncryptionKey () {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 128 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportEncryptionKey (key) {
  return (await window.crypto.subtle.exportKey("jwk", key)).k;
}

export async function importEncryptionKey (k) {
  return await window.crypto.subtle.importKey(
    "jwk",
    {
      k,
      alg: "A128GCM",
      ext: true,
      key_ops: ["encrypt", "decrypt"],
      kty: "oct",
    },
    { name: "AES-GCM", length: 128 },
    false, // extractable
    ["encrypt", "decrypt"]
  );
}

export async function encryptToB64 (plaintext, key) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    str2ab(plaintext)
  );
  return {
    ciphertext: btoa(ab2str(ciphertext)),
    iv: btoa(ab2str(iv)),
  };
}

export async function decryptFromB64 ({ ciphertext, iv }, key) {
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: str2ab(atob(iv)) },
    key,
    str2ab(atob(ciphertext))
  );
  return ab2str(decrypted);
}
