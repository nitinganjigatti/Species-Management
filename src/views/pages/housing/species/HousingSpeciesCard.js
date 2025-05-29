import { Box, Card, Typography, Chip } from '@mui/material'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import { useTheme } from '@emotion/react'
import SpeciesCard from 'src/views/utility/SpeciesCard'

const HousingSpeciesCard = ({ species }) => {
  const theme = useTheme()

  const SpeciesInnerCard = () => {
    return (
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        {/* Left Section: Avatar + Info + Labels */}

        <Box display='flex' flexDirection='column' gap={1} flexWrap='wrap' sx={{ ml: 2 }}>
          <SpeciesCard
            species={{
              scientific_name: species.complete_name,
              common_name: species.common_name,
              default_icon: species.default_icon
            }}
          />

          <Box display='flex' flexWrap='wrap' gap={3} sx={{ mt: 1, ml: 10 }}>
            {species?.sex_data?.male && (
              <Chip
                label={`M - ${species?.sex_data?.male}`}
                size='small'
                sx={{
                  bgcolor: `${theme.palette.customColors.SecondaryContainer}80`,
                  color: theme.palette.customColors.addPrimary,
                  borderRadius: 0.5
                }}
              />
            )}
            {species?.sex_data?.female && (
              <Chip
                label={`F - ${species?.sex_data?.female}`}
                size='small'
                sx={{
                  bgcolor: `${theme.palette.customColors.customDropdownColor}4D`,
                  color: theme.palette.customColors.customDropdownColor,
                  borderRadius: 0.5
                }}
              />
            )}
            {species?.species?.sex_data?.undetermined && (
              <Chip
                label={`UD - ${species?.sex_data?.undetermined}`}
                size='small'
                sx={{
                  bgcolor: theme.palette.customColors.SurfaceVariant,
                  color: theme.palette.customColors.Error,
                  borderRadius: 0.5
                }}
              />
            )}
            {species?.sex_data?.indeterminate && (
              <Chip
                label={`ID - ${species?.sex_data?.indeterminate}`}
                size='small'
                sx={{
                  bgcolor: theme.palette.customColors.displaybgSecondary,
                  color: theme.palette.customColors.OnPrimaryContainer,
                  borderRadius: 0.5
                }}
              />
            )}
          </Box>
        </Box>

        {/* Right Section: Total */}
        <Typography
          fontWeight={600}
          sx={{
            color: theme.palette.customColors.onSurfaceVariant,
            mt: 12,
            mr: 2,
            fontSize: '24px',
            fontFamily: 'Inter'
          }}
        >
          {species?.animal_count}
        </Typography>
      </Box>
    )
  }

  return (
    <Card sx={{ p: 3, boxShadow: 'none', border: `1px solid ${theme.palette.customColors.OutlineVariant}` }}>
      <SpeciesInnerCard species={species} />
    </Card>
  )
}

export default HousingSpeciesCard
