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
  enclosureName?: string
  sectionName?: string
  // When true, render every sex chip even if the value is 0 — matches the species listing table,
  // which shows all four columns regardless. Default keeps the original truthy gate (hides zeros).
  alwaysShowSexChips?: boolean
}

const SpeciesInnerCard: React.FC<SpeciesInnerCardProps> = ({
  species,
  completeName,
  commonName,
  animalCount,
  imgUrl,
  sex,
  enclosureName,
  sectionName,
  alwaysShowSexChips = false
}) => {
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
        {(enclosureName || sectionName) && (
          <Box sx={{ ml: 12, display: 'flex', flexDirection: 'column' }}>
            {enclosureName && (
              <Typography
                variant='body2'
                sx={{ color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {enclosureName}
              </Typography>
            )}
            {sectionName && (
              <Typography
                variant='body2'
                sx={{ color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {sectionName}
              </Typography>
            )}
          </Box>
        )}
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
          {(() => {
            const maleVal = sex?.male ?? species?.sex_data?.male
            const femaleVal = sex?.female ?? species?.sex_data?.female
            const undeterminedVal = sex?.undetermined ?? species?.sex_data?.undetermined
            const indeterminateVal = sex?.indeterminate ?? species?.sex_data?.indeterminate
            const showAll = alwaysShowSexChips
            const visible = (v: number | undefined) => (showAll ? v !== undefined && v !== null : !!v)
            const safe = (v: number | undefined) => (v ?? 0)

            return (
              <>
                {visible(maleVal) && (
                  <Chip
                    label={`M - ${safe(maleVal)}`}
                    size='small'
                    sx={{
                      bgcolor: `${theme.palette.customColors.SecondaryContainer}80`,
                      color: theme.palette.customColors.addPrimary,
                      borderRadius: 0.5
                    }}
                  />
                )}

                {visible(femaleVal) && (
                  <Chip
                    label={`F - ${safe(femaleVal)}`}
                    size='small'
                    sx={{
                      bgcolor: `${theme.palette.customColors.customDropdownColor}4D`,
                      color: theme.palette.customColors.customDropdownColor,
                      borderRadius: 0.5
                    }}
                  />
                )}

                {visible(undeterminedVal) && (
                  <Chip
                    label={`UD - ${safe(undeterminedVal)}`}
                    size='small'
                    sx={{
                      bgcolor: theme.palette.customColors.SurfaceVariant,
                      color: theme.palette.customColors.Error,
                      borderRadius: 0.5
                    }}
                  />
                )}

                {visible(indeterminateVal) && (
                  <Chip
                    label={`ID - ${safe(indeterminateVal)}`}
                    size='small'
                    sx={{
                      bgcolor: theme.palette.customColors.displaybgSecondary,
                      color: theme.palette.customColors.OnPrimaryContainer,
                      borderRadius: 0.5
                    }}
                  />
                )}
              </>
            )
          })()}
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
