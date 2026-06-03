'use client'

import { AntzChatClient, type AntzChatConfig } from '@antzsoft/chat-core'
import { CHAT_TRANSIT_ENCRYPTION } from 'src/configs/chat'

let _client: AntzChatClient | null = null

const persistStorage = {
  getItem: (k: string) => (typeof window !== 'undefined' ? localStorage.getItem(k) : null),
  setItem: (k: string, v: string) => {
    if (typeof window !== 'undefined') localStorage.setItem(k, v)
  },
  removeItem: (k: string) => {
    if (typeof window !== 'undefined') localStorage.removeItem(k)
  }
}

// Single-shot upload (files < 10 MB, or as the per-strategy uploader).
// Exported because `client.uploadFiles` in chat-core 1.2.4 does NOT forward
// `platformUploadPartFn` to its internal uploadBatch — so large files never
// get the multipart path and 400 on the single-shot fallback. We bypass
// `client.uploadFiles` and call `uploadBatch` directly (see uploadChatFiles
// in api.ts), passing BOTH platform fns. These two must be reused there.
// chat-core 1.2.4: S3 / local now issue a presigned POST (multipart/form-
// data); Azure still uses a raw PUT. Branch on `presigned.method`:
//   • POST + fields → FormData. DO NOT set Content-Type manually — the
//     browser must generate the multipart boundary itself. Setting any
//     header here (esp. Content-Type) would corrupt the boundary and the
//     S3/local upload would fail.
//   • PUT (Azure)   → raw blob + the presigned headers (x-ms-blob-type etc.).
export const platformUploadFn: AntzChatConfig['platformUploadFn'] = async (presigned, file, onProgress) => {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = e => onProgress?.(e.loaded / e.total)
    xhr.onload = () => (xhr.status < 400 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)))
    xhr.onerror = () => reject(new Error('Network error during upload'))

    fetch(file.uri)
      .then(r => r.blob())
      .then(blob => {
        if (presigned.method === 'POST' && presigned.fields) {
          // S3 / local — multipart/form-data, browser-managed boundary.
          const fd = new FormData()
          Object.entries(presigned.fields).forEach(([k, v]) => fd.append(k, v as string))
          fd.append('file', blob, file.name)
          xhr.open('POST', presigned.uploadUrl)
          xhr.send(fd)
        } else {
          // Azure — raw PUT with presigned headers.
          xhr.open(presigned.method, presigned.uploadUrl)
          Object.entries(presigned.headers ?? {}).forEach(([k, v]) => xhr.setRequestHeader(k, v as string))
          xhr.send(blob)
        }
      })
      .catch(reject)
  })
}

// Chunked-upload part uploader (chat-core 1.2.4) — files ≥ 10 MB are split
// into 10 MB parts and uploaded in parallel; the SDK calls this once per
// part and expects the part's ETag back so it can assemble server-side.
// `method` defaults to PUT (S3/local multipart part URLs are presigned PUTs).
export const platformUploadPartFn: NonNullable<AntzChatConfig['platformUploadPartFn']> = async (
  uploadUrl,
  blob,
  onProgress,
  method = 'PUT'
) => {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, uploadUrl)
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status < 300) {
        // S3 returns the part ETag in the response header; strip quotes.
        resolve((xhr.getResponseHeader('ETag') || '').replace(/"/g, ''))
      } else {
        reject(new Error(`Part upload failed: ${xhr.status}`))
      }
    }
    xhr.onerror = () => reject(new Error('Part upload failed'))
    xhr.send(blob as XMLHttpRequestBodyInit)
  })
}

// Text-based document MIME types that gzip well. Images are deliberately
// EXCLUDED — they're already compressed upstream via `maybeCompressImage`
// (SendMsgForm / GroupIconEditor), and binary docs (pdf/docx/xlsx) + media
// (video/audio) don't benefit from gzip. SVG is text under the hood, so it
// gzips well and is included here even though its MIME starts with `image/`.
const GZIP_DOCUMENT_RE =
  /^(text\/|application\/(json|xml|x-yaml|yaml|rtf|sql|csv)|image\/svg\+xml)/i

// Document-only compression hook (SDK Step 16.5). The SDK ships NO default
// compressor — it delegates to this fn, which receives a blob-URL-backed
// `UploadableFile` and must return a `CompressedFile`. We gzip ONLY text-based
// documents; everything else (images, media, binary docs) returns unchanged
// with `compressed: false`. Any failure (unsupported CompressionStream, fetch
// error, gzip larger than original) falls back to the original bytes — so
// wiring this can never block or corrupt an upload.
export const platformCompressFn: NonNullable<AntzChatConfig['platformCompressFn']> = async (file, options) => {
  const passthrough = (): Awaited<ReturnType<NonNullable<AntzChatConfig['platformCompressFn']>>> => ({
    ...file,
    originalSize: file.size,
    compressed: false,
    compressionAlgorithm: 'none'
  })

  // Respect the SDK's resolved config: bail unless document compression is on.
  if (!options?.enabled || !options?.compressDocuments) return passthrough()
  if (!GZIP_DOCUMENT_RE.test(file.type)) return passthrough()
  if (typeof CompressionStream === 'undefined') return passthrough()

  try {
    const blob = await fetch(file.uri).then(r => r.blob())
    const gzippedBlob = await new Response(
      blob.stream().pipeThrough(new CompressionStream('gzip'))
    ).blob()

    // Don't ship a gzip that's bigger than the source (tiny files can grow).
    if (gzippedBlob.size >= file.size) return passthrough()

    return {
      uri: URL.createObjectURL(gzippedBlob),
      name: file.name,
      type: file.type,
      size: gzippedBlob.size,
      originalSize: file.size,
      compressed: true,
      compressionAlgorithm: 'gzip'
    }
  } catch (err) {
    console.warn('[chat] document gzip failed, sending original:', err)

    return passthrough()
  }
}

export interface GetChatClientOpts {
  accessToken: string
  userId: string
  tenantId?: string
  avatar?: { url?: string; base64?: string }
}

export function getChatClient(opts: GetChatClientOpts): AntzChatClient {
  if (_client) return _client

  const apiUrl = process.env.NEXT_PUBLIC_CHAT_API_URL
  if (!apiUrl) throw new Error('[chat] NEXT_PUBLIC_CHAT_API_URL is not configured')

  _client = new AntzChatClient({
    apiUrl,
    persistStorage,
    platformUploadFn,
    // chat-core 1.2.4 — enables chunked multipart upload for files ≥ 10 MB.
    // Optional in the config; `client.uploadFiles` / `uploadIcon` pass it
    // into their internal uploadBatch automatically. Omitting it would
    // leave large files without chunking (timeout risk); small files are
    // unaffected either way.
    platformUploadPartFn,
    // Per-type client-side size caps. The SDK defaults (image 5 / video 25
    // / audio 10 / document 10) are conservative and reject files BEFORE
    // the upload pipeline — which blocked the very large files that 1.2.4's
    // multipart chunking was built to handle. Raised here so large media
    // reaches the (now chunked) upload path. NOTE: the server still enforces
    // its own cap when issuing the presigned URL — these caps must stay at
    // or below the backend's limit, otherwise a file passes client
    // validation but is rejected server-side.
    upload: {
      maxFileSizeMB: {
        image: 10,
        audio: 25,
        document: 25,
        video: 100
      }
    },
    authToken: opts.accessToken,
    userId: opts.userId,
    tenantId: opts.tenantId,
    avatar: opts.avatar,
    // Single source of truth: src/configs/chat.ts (same constant used by
    // the socket handshake in ChatClientContext.tsx — keeps the two
    // surfaces in sync, MUST match the server's TRANSIT_ENCRYPTION_ENABLED).
    transitEncryption: CHAT_TRANSIT_ENCRYPTION
  })

  return _client
}

export function getChatClientOrNull(): AntzChatClient | null {
  return _client
}

export function disposeChatClient(): void {
  _client?.disconnect()
  _client = null
}
