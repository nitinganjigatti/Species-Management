import { TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'

const EggTableHeader = ({ tabValue, totalCount, handleSearch }) => {
  const theme = useTheme()

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 4, py: 4 }}>
      <Box>
        <Typography sx={{ fontSize: '14px', fontWeight: 300 }}>
          Total Eggs{' '}
          {tabValue === 'eggs_received'
            ? 'in  Received'
            : tabValue === 'eggs_hatched'
            ? 'Hatched'
            : tabValue === 'eggs_incubation'
            ? 'in Incubation'
            : tabValue === 'eggs_ready_to_be_discarded_at_nursery'
            ? 'in Discard'
            : null}{' '}
          : <span style={{ fontWeight: 500, color: '#000000' }}>{totalCount}</span>
        </Typography>
      </Box>
      <Box sx={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #C3CEC7',
            borderRadius: '4px',
            padding: '0 8px',
            height: '40px'
          }}
        >
          <Icon icon='mi:search' fontSize={20} />
          <TextField
            variant='outlined'
            placeholder='Search'
            InputProps={{
              disableUnderline: true
            }}
            onChange={e => handleSearch(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                border: 'none',
                padding: '0',
                '& fieldset': {
                  border: 'none'
                }
              }
            }}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '4px',
            bgcolor: theme?.palette.customColors?.lightBg,
            alignItems: 'center'
          }}
        >
          <Icon icon='uil:calender' fontSize={24} />
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '4px',
            bgcolor: theme?.palette.customColors?.lightBg,
            alignItems: 'center'
          }}
        >
          <Icon icon='mage:filter' fontSize={24} />
        </Box>
      </Box>
    </Box>
  )
}

export default EggTableHeader
