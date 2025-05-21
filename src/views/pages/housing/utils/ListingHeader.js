import { Box, Typography } from '@mui/material'
import React from 'react'
import { useTheme } from '@mui/material/styles'
import { ExportButton } from 'src/views/utility/render-snippets'

const ListingHeader = ({ title = 'Listing', totalCount = 0, onDownload = () => {}, loading = false }) => {
  const theme = useTheme()

  return (
    <Box display='flex' justifyContent='space-between' alignItems='center' flexWrap='wrap' p={2}>
      <Typography variant='h6'>
        {title} ({totalCount})
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Typography sx={{ color: theme?.palette?.primary?.dark }}>Download</Typography>
        <ExportButton
          loading={loading}
          onClick={onDownload}
        />
      </Box>
    </Box>
  )
}

export default React.memo(ListingHeader)
