'use client'

import { AntzChatClient, type AntzChatConfig } from '@antzsoft/chat-core'

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

const platformUploadFn: AntzChatConfig['platformUploadFn'] = async (presigned, file, onProgress) => {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(presigned.method, presigned.uploadUrl)
    Object.entries(presigned.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v as string))
    xhr.upload.onprogress = e => onProgress?.(e.loaded / e.total)
    xhr.onload = () => (xhr.status < 400 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)))
    xhr.onerror = () => reject(new Error('Network error during upload'))

    if (presigned.method === 'PUT') {
      fetch(file.uri)
        .then(r => r.blob())
        .then(blob => xhr.send(blob))
    } else {
      const fd = new FormData()
      Object.entries(presigned.fields ?? {}).forEach(([k, v]) => fd.append(k, v as string))
      fetch(file.uri)
        .then(r => r.blob())
        .then(blob => {
          fd.append('file', blob, file.name)
          xhr.send(fd)
        })
    }
  })
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
    authToken: opts.accessToken,
    userId: opts.userId,
    tenantId: opts.tenantId,
    avatar: opts.avatar,
    // SDK defaults `transitEncryption: true` (ECDH + AES-256-GCM on every
    // HTTP body and socket event). The deployed server doesn't have
    // `TRANSIT_ENCRYPTION_ENABLED=true`, so the handshake fails and the
    // socket is never registered — `getSocket()` then throws
    // `"Socket not initialized. Call connectSocket first."` on the next
    // line in useChatClient. Forcing false matches the server config.
    // Flip back to true (or remove) once the server enables transit
    // encryption.
    transitEncryption: false
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
