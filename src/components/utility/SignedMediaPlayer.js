import React, { useEffect, useState, useRef } from 'react'
import { Box } from '@mui/material'

const isSafari =
  typeof window !== 'undefined' &&
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent)


const SignedMediaPlayer = ({
  src,
  type, // 'video' | 'audio'
  width = '100%',
  height = 'auto',
  controls = true,
  preload = 'metadata',
  playsInline = true,
  muted = false,
  onError,
  style = {}
}) => {
  const [blobUrl, setBlobUrl] = useState(null)

  // Signed URL → Blob URL (Safari safe)
  const getSignedMediaBlobUrl = async url => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-' },
        credentials: 'omit'
      })

      const blob = await response.blob()
      
      return URL.createObjectURL(blob)
    } catch (error) {
      console.error('Failed to load media:', error)
      
      return null
    }
  }

  useEffect(() => {
    if (!src) return
    if (type === 'audio' && !isSafari) return

    let active = true


    getSignedMediaBlobUrl(src).then(url => {
      if (active && url) {
        setBlobUrl(url)
      }
    })

    return () => {
      active = false

    //   if (objectUrl) URL.revokeObjectURL(objectUrl)
      if (blobUrl) URL.revokeObjectURL(blobUrl)

    //   setBlobUrl(null)
    }
  }, [src])

  if (!blobUrl) return null

  const commonProps = {
    src: blobUrl,
    controls,
    preload,
    muted,
    style: {
      width,
      height,
      ...style
    },
    onError
  }

  return (
  <Box sx={{ width, height }}>
    {type === 'video' ? (
      <video
        {...commonProps}
        playsInline={playsInline}
      />
    ) : isSafari ? (

      // Safari → blob audio
      <audio
        {...commonProps}
      />
    ) : (

      // Chrome / others → direct URL audio
      <audio
        src={src}
        controls
        preload="auto"
        style={{ width: '100%' }}
        onError={onError}
      />
    )}
  </Box>
)
}

export default SignedMediaPlayer

