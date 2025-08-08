import { useTheme } from '@emotion/react'
import { Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'

const AnimalDetailsHistory = ({ historyData }) => {
  const theme = useTheme()

  if (!historyData) {
    return null
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 1,
          p: 4,
          borderRadius: 1,
          background: theme.palette.customColors.displaybgPrimary,
          width: { xs: '100%', md: '100%' },
          mt: 1
        }}
      >
        <Typography variant='subtitle1'>
          Section : <strong>{historyData.section || 'N/A'}</strong>
        </Typography>
        <Typography variant='subtitle1'>
          Site : <strong>{historyData.site || 'N/A'}</strong>
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 2 }}>
          <img src='/images/line_start_circle.svg' alt='line-start-circle' />
          <strong> {historyData.inDate}</strong>
        </Box>
        {historyData.outDate && (
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 2 }}>
            <img src='/images/line_end_square.svg' alt='line-end-square' />
            <strong> {historyData.outDate}</strong>
          </Box>
        )}
        <Typography variant='subtitle1' sx={{ display: 'none' }}>
          Reported By : <strong>{historyData.reporter}</strong>
        </Typography>
      </Box>
    </>
  )
}

export default AnimalDetailsHistory
