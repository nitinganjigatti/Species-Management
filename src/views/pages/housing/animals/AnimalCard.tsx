import React from 'react'
import { Box, Card, SxProps, Theme } from '@mui/material'
import { useTheme } from '@emotion/react'
import AnimalParentCard from 'src/views/utility/animalParentCard'

interface AnimalCardData {
  [key: string]: unknown
}

interface AnimalCardProps {
  sx?: SxProps<Theme>
  data: AnimalCardData
  animalParentCardStyle?: SxProps<Theme>
  textColor?: string
}

const AnimalCard: React.FC<AnimalCardProps> = ({ sx = {}, data, animalParentCardStyle, textColor }) => {
  const theme = useTheme() as any

  return (
    <Card sx={{ boxShadow: 'none', border: `1px solid ${theme.palette.customColors.OutlineVariant}`, ...sx }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          flexWrap: 'wrap'
        }}
      >
        <AnimalParentCard data={data} size={14} animal={true} sx={animalParentCardStyle} backgroundColor="" ondelete={() => {}} />
      </Box>
    </Card>
  )
}

export default AnimalCard
