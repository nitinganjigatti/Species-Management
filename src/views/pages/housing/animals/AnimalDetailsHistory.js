import { useTheme } from '@emotion/react'
import { Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'

const AnimalDetailsHistory = ({ historyData }) => {
  const theme = useTheme()

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
          width: '80%',
          mt: 1
        }}
      >
        <Typography variant='subtitle1'>
          Section : <strong>Quail Section</strong>
        </Typography>
        <Typography variant='subtitle1'>
          Site : <strong>Gagva</strong>
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 2 }}>
          <img src='/images/line_start_circle.svg' alt='line-start-circle' />
          <strong>21 Jan 2024</strong>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 2 }}>
          <img src='/images/line_end_square.svg' alt='line-end-square' />
          <strong>21 Jan 2024</strong>
        </Box>
        <Typography variant='subtitle1'>
          Reported By : <strong>Naveen Kumar</strong>
        </Typography>
      </Box>
    </>
  )
}

export default AnimalDetailsHistory
