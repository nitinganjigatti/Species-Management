import React from 'react'
import { Box, Card, Typography, Chip } from '@mui/material'
import { useTheme } from '@emotion/react'
import SpeciesInnerCard from './SpeciesInnerCard'
import type { Species, HousingSpeciesCardProps } from 'src/types/housing'

interface HousingSpeciesCardComponentProps {
  species: Species
  textColor?: string
}

const HousingSpeciesCard: React.FC<HousingSpeciesCardComponentProps> = ({ species, textColor }) => {
  const theme = useTheme() as any

  return (
    <Card sx={{ p: 3, boxShadow: 'none', border: `1px solid ${theme.palette.customColors.OutlineVariant}` }}>
      <SpeciesInnerCard species={species} />
    </Card>
  )
}

export default HousingSpeciesCard
