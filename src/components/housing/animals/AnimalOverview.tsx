import { IconButton } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'
import { useTranslation } from 'react-i18next'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import Icon from 'src/@core/components/icon'
import AnimalDetailsCard from 'src/views/pages/housing/animals/AnimalDetailsCard'
import EnclosureDetailsCard from 'src/views/pages/housing/animals/EnclosureDetailsCard'
import { AnimalOverview as AnimalOverviewType, EnclosureStats } from 'src/types/housing'

interface AnimalOverviewProps {
  animalDetails: AnimalOverviewType | null
  enclosureDetails: EnclosureStats | null
}

const AnimalOverview: React.FC<AnimalOverviewProps> = ({ animalDetails, enclosureDetails }) => {
  const { t } = useTranslation()

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <ListingHeader title={t('animals_module.animal_details')} />
        {/* <IconButton size='small' sx={{ mr: 0.5 }} onClick={() => console.log('Edit clicked')}>
          <Icon icon='mdi:pencil-outline' />
        </IconButton> */}
      </Box>
      <Box>
        <AnimalDetailsCard data={animalDetails as any} />
        <EnclosureDetailsCard enclosureData={enclosureDetails as any} />
      </Box>
    </>
  )
}

export default AnimalOverview
