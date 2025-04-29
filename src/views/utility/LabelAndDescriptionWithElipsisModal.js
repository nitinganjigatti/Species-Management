import React from 'react'
import { Box, Tooltip, Typography } from '@mui/material'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'

const LabelAndDescriptionWithElipsisModal = ({ reason, comment, reasonTextColor, commentTextColor }) => {
  return (
    <Tooltip title={reason || ''}>
      <Box sx={{ maxWidth: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography
          variant='p'
          sx={{
            color: reasonTextColor,
            fontSize: '0.875rem',
            fontWeight: 400,
            fontFamily: 'Inter',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            width: '100%'
          }}
        >
          {reason && reason}
        </Typography>
        {comment && (
          <TextEllipsisWithModal icon={'mdi:file-document-outline'} text={comment} iconColor={commentTextColor} />
        )}
      </Box>
    </Tooltip>
  )
}

export default React.memo(LabelAndDescriptionWithElipsisModal)
