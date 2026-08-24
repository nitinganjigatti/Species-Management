// DEV-LAN (2026-08-24): crypto.subtle polyfill for plain-HTTP LAN origins.
//
// Safari/Chrome only expose the Web Crypto API (crypto.subtle) on SECURE
// contexts — https:// or localhost. When the dev server is opened from another
// device on the LAN (e.g. the iPad design-review setup at
// http://192.168.0.120:3000), crypto.subtle is undefined and
// @antzsoft/wso2-auth-web's PKCE step throws:
//   TypeError: undefined is not an object (evaluating 'crypto.subtle.digest')
//
// The SDK's only Web Crypto call is crypto.subtle.digest('SHA-256', …) in
// pkce.js (crypto.getRandomValues works on insecure contexts already), so this
// shim installs a pure-JS SHA-256 digest — nothing else — and ONLY when:
//   • running in a browser, AND
//   • the context is insecure (never on https/localhost), AND
//   • this is a development build.
// Production builds and normal localhost dev never execute any of this.
// Remove alongside the LAN-review workflow if it's ever retired.

/* eslint-disable no-bitwise */

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]

const rotr = (x, n) => (x >>> n) | (x << (32 - n))

// FIPS 180-4 SHA-256 over a Uint8Array; returns a 32-byte ArrayBuffer.
function sha256 (bytes) {
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]

  const padded = new Uint8Array(Math.ceil((bytes.length + 9) / 64) * 64)
  padded.set(bytes)
  padded[bytes.length] = 0x80

  const dv = new DataView(padded.buffer)
  const bitLen = bytes.length * 8
  dv.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000))
  dv.setUint32(padded.length - 4, bitLen >>> 0)

  const w = new Uint32Array(64)
  for (let i = 0; i < padded.length; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4)
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3)
      const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10)
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0
    }

    let [a, b, c, d, e, f, g, h] = H
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const ch = (e & f) ^ (~e & g)
      const t1 = (h + S1 + ch + K[t] + w[t]) >>> 0
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const t2 = (S0 + maj) >>> 0
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0
    }

    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0
  }

  const out = new DataView(new ArrayBuffer(32))
  for (let i = 0; i < 8; i++) out.setUint32(i * 4, H[i])

  return out.buffer
}

if (
  typeof window !== 'undefined' &&
  !window.isSecureContext &&
  process.env.NODE_ENV === 'development' &&
  !window.crypto.subtle
) {
  Object.defineProperty(window.crypto, 'subtle', {
    configurable: true,
    value: {
      digest (algorithm, data) {
        const name = typeof algorithm === 'string' ? algorithm : algorithm?.name
        if (name !== 'SHA-256') {
          return Promise.reject(new Error(`insecureContextShims: only SHA-256 is polyfilled (got ${name})`))
        }
        const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)

        try {
          return Promise.resolve(sha256(bytes))
        } catch (err) {
          return Promise.reject(err)
        }
      }
    }
  })
}
