import { Box, Card, Typography, Chip } from '@mui/material'
import { useTheme } from '@emotion/react'
import SpeciesInnerCard from './SpeciesInnerCard'

const HousingSpeciesCard = ({ species }) => {
  const theme = useTheme()

  return (
    <Card sx={{ p: 3, boxShadow: 'none', border: `1px solid ${theme.palette.customColors.OutlineVariant}` }}>
      <SpeciesInnerCard species={species} />
    </Card>
  )
}

export default HousingSpeciesCard
