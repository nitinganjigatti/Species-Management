import React, { useEffect, useState } from 'react'
import { Drawer, IconButton, Typography } from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import AnimalParentCard from 'src/views/utility/animalParentCard'
import type { AnimalSideSheetProps } from 'src/types/lab'

const AnimalSideSheet = ({ openAnimalSheet, setOpenAnimalSheet, request }: AnimalSideSheetProps) => {

  const [first, setfirst] = useState(0)

  useEffect(() => {
    request?.map(item => {
      item?.animal_details?.map(() => {
        setfirst(prev => prev + 1)
      })
    })
  }, [])

  return (
    <Drawer
      anchor='right'
      open={openAnimalSheet}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '500px'] },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
          p: (theme: { spacing: (...args: number[]) => string }) => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2 }}>
          <img src='/icons/activity_icon.png' alt='Grocery Icon' width='30px' />
          <Typography variant='h6'>Total animals - {first}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <IconButton size='small' sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={20} onClick={() => setOpenAnimalSheet(false)} />
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ overflowY: 'auto', flexGrow: 1, px: 6, py: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {request?.map(
          (item, index) =>
            item?.animal_details?.map((animal, animalIndex) => (
              <AnimalParentCard key={animalIndex} data={animal} backgroundColor={'background.default'} />
            ))
        )}
      </Box>
    </Drawer>
  )
}

export default AnimalSideSheet
