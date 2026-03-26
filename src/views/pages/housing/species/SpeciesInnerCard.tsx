import React from 'react'
import { Box, Chip, Typography } from '@mui/material'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import { useTheme } from '@emotion/react'

interface SexData {
  male?: number
  female?: number
  undetermined?: number
  indeterminate?: number
}

interface SpeciesData {
  complete_name?: string
  common_name?: string
  default_icon?: string
  animal_count?: number
  sex_data?: SexData
}

interface SpeciesInnerCardProps {
  species?: SpeciesData
  completeName?: string
  commonName?: string
  animalCount?: number
  imgUrl?: string
  sex?: SexData
}

const SpeciesInnerCard: React.FC<SpeciesInnerCardProps> = ({ species, completeName, commonName, animalCount, imgUrl, sex }) => {
  const theme = useTheme() as any

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
      }}
    >
      {/* Top Section: Avatar + Species Info */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          ml: 2
        }}
      >
        <SpeciesCard
          species={{
            scientific_name: completeName || species?.complete_name,
            common_name: commonName || species?.common_name,
            default_icon: imgUrl || species?.default_icon
          }}
        />
      </Box>
      {/* Bottom Row: Chips on left, Count on right */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 1,
          px: 2
        }}
      >
        {/* Left: Chips */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            ml: 12
          }}
        >
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
            sx={{
              fontWeight: 600,
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
