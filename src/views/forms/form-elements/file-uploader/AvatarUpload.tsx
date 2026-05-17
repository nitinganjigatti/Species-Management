'use client'

// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

// ** Third Party Imports
import { useDropzone } from 'react-dropzone'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

export interface AvatarUploadProps {
  /** Existing image URL (e.g. server-hosted) — shown when no local file selected. */
  value?: string
  /** Called with the selected File (and an auto-generated blob URL). */
  onChange?: (file: File | null, previewUrl: string | null) => void
  /** Pixel diameter of the circle. Default 104. */
  size?: number
  /** Iconify icon for empty state. Default `mdi:camera-plus-outline`. */
  placeholderIcon?: string
  /** Caption under the icon in empty state. Default `Add photo`. */
  placeholderLabel?: string
  /** Disables file selection. */
  disabled?: boolean
}

/**
 * Modern circular avatar uploader.
 *
 * Empty state — gradient ring with dashed inner stroke, camera icon, soft glow,
 *               gentle scale-on-hover, pulsing border on drag-over.
 * Filled state — image fills the circle, smooth dark overlay on hover with
 *               "Change photo" + camera icon, floating remove chip in corner.
 *
 * Built on react-dropzone (same family as FileUploaderSingle).
 */
const AvatarUpload = ({
  value,
  onChange,
  size = 104,
  placeholderIcon = 'mdi:camera-plus-outline',
  placeholderLabel = 'Add photo',
  disabled = false
}: AvatarUploadProps) => {
  const [preview, setPreview] = useState<string | null>(value ?? null)

  // Sync external value -> internal preview
  useEffect(() => {
    if (value !== undefined) setPreview(value)
  }, [value])

  // Clean up object URLs we created
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
    disabled,
    onDrop: accepted => {
      if (!accepted.length) return
      const file = accepted[0]
      const url = URL.createObjectURL(file)
      setPreview(url)
      onChange?.(file, url)
    }
  })

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    setPreview(null)
    onChange?.(null, null)
  }

  const hasImage = Boolean(preview)

  return (
    <Box
      sx={{
        position: 'relative',
        // Extra room around the circle so the floating remove button isn't
        // clipped by parent containers, and the soft glow has space to bleed.
        width: size + 20,
        height: size + 20,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Soft glow underlay — gives the avatar a "lifted" feel */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: theme =>
            `radial-gradient(circle, ${theme.palette.primary.main}33 0%, ${theme.palette.primary.main}00 70%)`,
          filter: 'blur(8px)',
          opacity: isDragActive ? 1 : 0.6,
          transition: 'opacity 240ms ease-out',
          pointerEvents: 'none'
        }}
      />

      <Box
        {...getRootProps()}
        sx={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '50%',
          cursor: disabled ? 'not-allowed' : 'pointer',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          color: 'common.white',
          // Gradient base — primary.main → primary.dark, diagonal
          background: theme =>
            `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          boxShadow: theme => `0 8px 24px -8px ${theme.palette.primary.main}66, inset 0 0 0 2px rgba(255,255,255,0.10)`,
          transition: 'transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 240ms ease-out',
          ...(isDragActive && {
            transform: 'scale(1.06)',
            boxShadow: theme =>
              `0 12px 32px -8px ${theme.palette.primary.main}99, inset 0 0 0 3px rgba(255,255,255,0.25)`
          }),
          '&:hover': disabled
            ? {}
            : {
                transform: 'scale(1.04) translateY(-2px)',
                boxShadow: theme =>
                  `0 12px 28px -8px ${theme.palette.primary.main}99, inset 0 0 0 2px rgba(255,255,255,0.18)`,
                '& .avatar-upload__overlay': { opacity: 1 },
                '& .avatar-upload__placeholder': { transform: 'scale(1.06)' }
              },
          opacity: disabled ? 0.5 : 1
        }}
      >
        <input {...getInputProps()} />

        {/* Animated dashed ring for empty state */}
        {!hasImage ? (
          <Box
            sx={{
              position: 'absolute',
              inset: 6,
              borderRadius: '50%',
              border: '2px dashed rgba(255, 255, 255, 0.55)',
              pointerEvents: 'none',
              animation: isDragActive ? 'ringPulse 1.2s ease-in-out infinite' : 'none',
              '@keyframes ringPulse': {
                '0%, 100%': { transform: 'scale(1)', opacity: 0.55 },
                '50%': { transform: 'scale(1.04)', opacity: 0.95 }
              }
            }}
          />
        ) : null}

        {hasImage && preview ? (
          <>
            <Box
              component='img'
              src={preview}
              alt='avatar preview'
              sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />

            {/* Hover overlay — "Change photo" */}
            <Box
              className='avatar-upload__overlay'
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.55) 100%)',
                opacity: 0,
                transition: 'opacity 220ms ease-out',
                color: 'common.white'
              }}
            >
              <Icon icon='mdi:camera-outline' fontSize='1.375rem' />
              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.02em' }}>Change</Typography>
            </Box>
          </>
        ) : (
          <Box
            className='avatar-upload__placeholder'
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.75,
              transition: 'transform 220ms ease-out',
              // Stronger drop-shadow so the white icon stands out against the
              // lighter top of the gradient
              filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.35)) drop-shadow(0 2px 6px rgba(0,0,0,0.30))'
            }}
          >
            <Icon icon={placeholderIcon} fontSize='1.75rem' />
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: 'common.white',
                // Text-shadow gives the label a dark halo so it's legible
                // even on the lighter portion of the gradient
                textShadow: '0 1px 2px rgba(0,0,0,0.45), 0 0 8px rgba(0,0,0,0.20)'
              }}
            >
              {placeholderLabel}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Remove button — rendered as a sibling of the dropzone circle so it
          isn't clipped by the circle's overflow:hidden. Sits at the top-right
          edge of the circle, fully visible. */}
      {hasImage && !disabled ? (
        <IconButton
          size='small'
          onClick={handleRemove}
          aria-label='Remove photo'
          sx={{
            position: 'absolute',
            // Position the centre of the button on the upper-right edge of the
            // circle (≈ 45° from center). With wrapper = size+20 and circle =
            // size, the circle sits at offset 10px inside. Placing the button
            // at top:4 / right:4 of the wrapper puts it just outside the
            // circle's top-right curve.
            top: 4,
            right: 8,
            width: 28,
            height: 28,
            padding: 0,
            backgroundColor: 'common.white',
            color: 'error.main',
            boxShadow: '0 2px 8px -2px rgba(0,0,0,0.40), 0 0 0 1px rgba(0,0,0,0.08)',
            transition: 'background-color 160ms ease-out, transform 160ms ease-out, box-shadow 160ms ease-out',
            zIndex: 3,
            '&:hover': {
              backgroundColor: 'error.main',
              color: 'common.white',
              transform: 'scale(1.10)',
              boxShadow: '0 4px 14px -2px rgba(220, 38, 38, 0.50)'
            },
            '& svg': { fontSize: '1.125rem', display: 'block' }
          }}
        >
          <Icon icon='mdi:close' />
        </IconButton>
      ) : null}
    </Box>
  )
}

export default AvatarUpload
