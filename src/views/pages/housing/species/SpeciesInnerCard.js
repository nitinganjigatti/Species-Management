import { Box, Chip, Typography } from '@mui/material'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import { useTheme } from '@emotion/react'

const SpeciesInnerCard = ({ species, completeName, commonName, animalCount, imgUrl, sex }) => {
  const theme = useTheme()

  return (
    <Box display='flex' flexDirection='column' sx={{ width: '100%' }}>
      {/* Top Section: Avatar + Species Info */}
      <Box display='flex' flexDirection='column' gap={1} sx={{ ml: 2 }}>
        <SpeciesCard
          species={{
            scientific_name: completeName || species?.complete_name,
            common_name: commonName || species?.common_name,
            default_icon: imgUrl || species?.default_icon
          }}
        />
      </Box>

      {/* Bottom Row: Chips on left, Count on right */}
      <Box display='flex' justifyContent='space-between' alignItems='center' sx={{ mt: 1, px: 2 }}>
        {/* Left: Chips */}
        <Box display='flex' flexWrap='wrap' gap={2} sx={{ ml: 8 }}>
          {(sex?.male || species?.sex_data?.male) && (
            <Chip
              label={`M - ${sex?.male ?? species?.sex_data?.male}`}
              size='small'
              sx={{
                bgcolor: `${theme.palette.customColors.SecondaryContainer}80`,
                color: theme.palette.customColors.addPrimary,
                borderRadius: 0.5
              }}
            />
          )}

          {(sex?.female || species?.sex_data?.female) && (
            <Chip
              label={`F - ${sex?.female ?? species?.sex_data?.female}`}
              size='small'
              sx={{
                bgcolor: `${theme.palette.customColors.customDropdownColor}4D`,
                color: theme.palette.customColors.customDropdownColor,
                borderRadius: 0.5
              }}
            />
          )}

          {(sex?.undetermined || species?.sex_data?.undetermined) && (
            <Chip
              label={`UD - ${sex?.undetermined ?? species?.sex_data?.undetermined}`}
              size='small'
              sx={{
                bgcolor: theme.palette.customColors.SurfaceVariant,
                color: theme.palette.customColors.Error,
                borderRadius: 0.5
              }}
            />
          )}

          {(sex?.indeterminate || species?.sex_data?.indeterminate) && (
            <Chip
              label={`ID - ${sex?.indeterminate ?? species?.sex_data?.indeterminate}`}
              size='small'
              sx={{
                bgcolor: theme.palette.customColors.displaybgSecondary,
                color: theme.palette.customColors.OnPrimaryContainer,
                borderRadius: 0.5
              }}
            />
          )}
        </Box>

        {/* Right: Animal Count */}
        {(animalCount ?? species?.animal_count) !== undefined && (
          <Typography
            fontWeight={600}
            sx={{
              color: theme.palette.customColors.onSurfaceVariant,
              fontSize: '24px',
              fontFamily: 'Inter',
              mr: 2
            }}
          >
            {animalCount ?? species?.animal_count}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default SpeciesInnerCard
