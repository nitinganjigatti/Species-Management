import imageCompression from 'browser-image-compression'

// Animated/vector formats break under canvas re-encoding (GIFs lose animation,
// SVGs lose scalability) — skip them and send originals.
const COMPRESSIBLE_IMAGE_RE = /^image\/(jpeg|jpg|png|webp|heic|heif|bmp|tiff)$/i

// Default tuning for message attachments — generous size cap so photos still
// look good when previewed full-screen on a high-DPI display.
export const ATTACHMENT_COMPRESS_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/webp'
}

// Group / avatar icons render at ≤ 90px in the UI, so re-encoding to 512px
// and a smaller byte cap saves a lot of bytes without any visible loss.
export const ICON_COMPRESS_OPTIONS = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 512,
  useWebWorker: true,
  fileType: 'image/webp'
}

// Rewrite the filename extension so it matches the transcoded MIME — server
// allow-lists often key off both, and a `photo.jpg` blob with `image/webp`
// content can trip validators.
const swapExtensionForMime = (name: string, mime: string) => {
  const ext = mime.split('/')[1]?.split(';')[0]?.trim() || 'bin'
  const base = name.replace(/\.[^./\\]+$/, '')

  return `${base}.${ext}`
}

export const maybeCompressImage = async (
  file: File,
  options: Parameters<typeof imageCompression>[1] = ATTACHMENT_COMPRESS_OPTIONS
): Promise<File> => {
  if (!COMPRESSIBLE_IMAGE_RE.test(file.type)) return file
  try {
    const out = await imageCompression(file, options)
    if (out.size >= file.size) return file

    // If the encoder switched format (e.g. JPEG → WebP), rebuild the File
    // so the name and lastModified line up with the new MIME. Same MIME →
    // return as-is to keep the original name intact.
    if (out.type && out.type !== file.type) {
      return new File([out], swapExtensionForMime(file.name, out.type), {
        type: out.type,
        lastModified: Date.now()
      })
    }

    return out
  } catch (err) {
    console.warn('[chat] image compression failed, sending original:', err)

    return file
  }
}
