import { IconButton } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import Icon from 'src/@core/components/icon'
import AnimalDetailsCard from 'src/views/pages/housing/animals/AnimalDetailsCard'
import EnclosureDetailsCard from 'src/views/pages/housing/animals/EnclosureDetailsCard'

const AnimalOverview = () => {
  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <ListingHeader title='Animal Details' />
        <IconButton size='small' sx={{ mr: 0.5 }} onClick={() => console.log('Edit clicked')}>
          <Icon icon='mdi:pencil-outline' />
        </IconButton>
      </Box>
      <Box>
        <AnimalDetailsCard />
        <EnclosureDetailsCard />
      </Box>
    </>
  )
}

export default AnimalOverview
