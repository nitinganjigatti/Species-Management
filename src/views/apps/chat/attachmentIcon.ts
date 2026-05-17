// Maps a file's mimeType + filename to a mdi:* icon and a brand color.
// Used by both the SendMsgForm preview chips and ChatLog bubble renderer
// so document attachments show a recognizable type icon (PDF / Word /
// Excel / PowerPoint / archive / code / etc.) instead of a generic file glyph.

export type AttachmentVisual = {
  icon: string
  color: string
}

const extFromName = (name?: string): string => {
  if (!name) return ''
  const dot = name.lastIndexOf('.')

  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : ''
}

export function getAttachmentVisual(mimeType: string, filename?: string): AttachmentVisual {
  const m = (mimeType || '').toLowerCase()
  const ext = extFromName(filename)

  // PDF
  if (m === 'application/pdf' || ext === 'pdf') {
    return { icon: 'mdi:file-pdf-box', color: '#E53935' }
  }

  // Word
  if (
    m === 'application/msword' ||
    m === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'doc' ||
    ext === 'docx' ||
    ext === 'rtf'
  ) {
    return { icon: 'mdi:file-word-box', color: '#1E88E5' }
  }

  // Excel / Spreadsheet
  if (
    m === 'application/vnd.ms-excel' ||
    m === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    m === 'text/csv' ||
    ext === 'xls' ||
    ext === 'xlsx' ||
    ext === 'csv'
  ) {
    return { icon: 'mdi:file-excel-box', color: '#43A047' }
  }

  // PowerPoint
  if (
    m === 'application/vnd.ms-powerpoint' ||
    m === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    ext === 'ppt' ||
    ext === 'pptx'
  ) {
    return { icon: 'mdi:file-powerpoint-box', color: '#F57C00' }
  }

  // Archive (zip / rar / 7z / tar / gz)
  if (
    m === 'application/zip' ||
    m === 'application/x-rar-compressed' ||
    m === 'application/x-7z-compressed' ||
    m === 'application/x-tar' ||
    m === 'application/gzip' ||
    ext === 'zip' ||
    ext === 'rar' ||
    ext === '7z' ||
    ext === 'tar' ||
    ext === 'gz'
  ) {
    return { icon: 'mdi:zip-box-outline', color: '#8E24AA' }
  }

  // Code / JSON / XML
  if (
    m === 'application/json' ||
    m === 'application/xml' ||
    m.startsWith('text/x-') ||
    ['js', 'ts', 'tsx', 'jsx', 'json', 'xml', 'html', 'css', 'py', 'java', 'cpp', 'c', 'rb', 'go', 'rs', 'sh'].includes(ext)
  ) {
    return { icon: 'mdi:code-json', color: '#546E7A' }
  }

  // Plain text
  if (m.startsWith('text/') || ext === 'txt') {
    return { icon: 'mdi:file-document-outline', color: '#607D8B' }
  }

  // Generic fallback
  return { icon: 'mdi:file-outline', color: '#90A4AE' }
}
