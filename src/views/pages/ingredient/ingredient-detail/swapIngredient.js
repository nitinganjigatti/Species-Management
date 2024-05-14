import { Typography } from '@mui/material'
import { Box } from '@mui/system'
import TextField from '@mui/material/TextField'
import React, { useState } from 'react'

// import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import IconButton from '@mui/material/IconButton'
import IngredientOverview from './ingrdientoverview'

const SwapIngredient = ({ setActivitySidebarOpen, handleSidebarClose }) => {
  // const theme = useTheme()

  const [searchValue, setSearchValue] = useState('')
  const data = [1, 2, 3, 5]

  return (
    <Box
      style={{
        WebkitScrollbar: { width: '2px' },
        WebkitScrollbarThumb: { backgroundColor: '#888', borderRadius: '10px' }
      }}
      className='sam'
      sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          width: '100%',
          gap: '12px',
          justifyContent: 'space-between',
          alignItems: 'start'
        }}
      >
        <Typography sx={{ fontWeight: 500, fontSize: '24px' }}>Swap Ingredient</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            size='small'
            onClick={() => {
              handleSidebarClose()
            }}
            sx={{ color: 'text.primary' }}
          >
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      </Box>
      <Box>
        <TextField
          value={searchValue}
          fullWidth
          label='Search ingredients'
          InputProps={{
            startAdornment: <Icon style={{ marginRight: 10 }} icon={'ion:search-outline'} />
          }}
          onChange={e => setSearchValue(e.target.value)}
        />
      </Box>

      {/* <IngredientOverview /> */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
        {data?.map((item, index) => (
          <IngredientOverview key={index} />
        ))}
      </Box>
    </Box>
  )
}

export default SwapIngredient
