import imageCompression from 'browser-image-compression'

// Animated/vector formats break under canvas re-encoding (GIFs lose animation,
// SVGs lose scalability) — skip them and send originals.
const COMPRESSIBLE_IMAGE_RE = /^image\/(jpeg|jpg|png|webp|heic|heif|bmp|tiff)$/i

// Default tuning for message attachments — generous size cap so photos still
// look good when previewed full-screen on a high-DPI display.
export const ATTACHMENT_COMPRESS_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true
}

// Group / avatar icons render at ≤ 90px in the UI, so re-encoding to 512px
// and a smaller byte cap saves a lot of bytes without any visible loss.
export const ICON_COMPRESS_OPTIONS = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 512,
  useWebWorker: true
}

export const maybeCompressImage = async (
  file: File,
  options: Parameters<typeof imageCompression>[1] = ATTACHMENT_COMPRESS_OPTIONS
): Promise<File> => {
  if (!COMPRESSIBLE_IMAGE_RE.test(file.type)) return file
  try {
    const out = await imageCompression(file, options)

    return out.size < file.size ? out : file
  } catch (err) {
    console.warn('[chat] image compression failed, sending original:', err)

    return file
  }
}
