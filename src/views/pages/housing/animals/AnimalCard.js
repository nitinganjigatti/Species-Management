import { Box, Card } from '@mui/material'
import { useTheme } from '@emotion/react'
import AnimalParentCard from 'src/views/utility/animalParentCard'

const AnimalCard = ({ data, animalParentCardStyle }) => {
  const theme = useTheme()

  return (
    <Card sx={{ boxShadow: 'none', border: `1px solid ${theme.palette.customColors.OutlineVariant}` }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          flexWrap: 'wrap'
        }}
      >
        <AnimalParentCard data={data} size={14} animal={true} sx={animalParentCardStyle} />
      </Box>
    </Card>
  )
}

export default AnimalCard
