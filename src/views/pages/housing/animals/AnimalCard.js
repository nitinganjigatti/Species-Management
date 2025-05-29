import { Box, Card, Typography, Chip } from '@mui/material'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import { useTheme } from '@emotion/react'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import AnimalParentCard from 'src/views/utility/animalParentCard'

const AnimalCard = ({ data }) => {
  const theme = useTheme()

  return (
    <Card sx={{ p: 3, boxShadow: 'none', border: `1px solid ${theme.palette.customColors.OutlineVariant}` }}>
      <Box display='flex' flexDirection='column' gap={1} flexWrap='wrap' sx={{ ml: 2 }}>
        <AnimalParentCard data={data} size={14} />
      </Box>
    </Card>
  )
}

export default AnimalCard
