'use client'

// ** MUI
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// ** Icon
import Icon from 'src/@core/components/icon'

interface ForwardedTagProps {
  // When true, the tag is rendered on top of the sender's primary-colored
  // bubble and needs a higher-contrast (white-ish) treatment. When false,
  // we're on a light bubble (incoming or attachment column) and use the
  // muted text color.
  isSender?: boolean
}

/**
 * Small italic "Forwarded" label rendered above a forwarded message's
 * body or attachment. Driven by the client-side marker in the message
 * text — see src/lib/chat/forwardMarker.ts.
 */
const ForwardedTag = ({ isSender = false }: ForwardedTagProps) => {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        mb: 0.5,
        opacity: isSender ? 0.85 : 0.7,
        color: isSender ? 'common.white' : 'text.secondary'
      }}
    >
      <Icon icon='mdi:share' fontSize='0.875rem' style={{ transform: 'scaleX(-1)' }} />
      <Typography variant='caption' sx={{ fontStyle: 'italic', color: 'inherit' }}>
        Forwarded
      </Typography>
    </Box>
  )
}

export default ForwardedTag
