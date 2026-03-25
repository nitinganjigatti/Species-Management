import { Radio, Checkbox } from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import React from 'react'
import AnimalCard from './AnimalCard'
import { MedicalIdChip } from 'src/views/pages/hospital/utility/hospitalSnippets'

const AnimalParentCard = ({
  data,
  backgroundColor,
  size,
  animal = false,
  ondelete,
  radio = false,
  checkbox = false,
  onClick,
  sx
}) => {
  const theme = useTheme()
  const interactive = Boolean(radio) || Boolean(checkbox) || Boolean(onClick)
  const isChecked = radio?.checked || checkbox?.checked

  const handleSelect = () => {
    // If explicit onClick prop is provided, use that
    if (onClick) {
      onClick()

      return
    }

    // Otherwise use radio/checkbox onChange
    if (radio) {
      radio?.onChange?.()
    } else if (checkbox) {
      checkbox?.onChange?.()
    }
  }

  const handleKeyDown = event => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleSelect()
    }
  }

  return (
    <>
      {data && (
        <Box
          sx={{
            width: '100%',
            backgroundColor: isChecked ? '#F2FFF8' : backgroundColor || theme.palette.primary.contrastText,
            borderRadius: '8px',
            paddingY: '20px',
            paddingX: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            border: isChecked ? `1px solid #37BD69` : 'none',
            cursor: interactive ? 'pointer' : 'default',
            '&:hover': interactive
              ? {
                  borderColor: '#37BD69',
                  background: '#F2FFF8'
                }
              : {},
            ...sx
          }}
          onClick={interactive ? handleSelect : undefined}
          onKeyDown={interactive ? handleKeyDown : undefined}
          tabIndex={interactive ? 0 : undefined}
          role={interactive ? 'button' : undefined}
        >
          {/* Animal Card Content */}
          <AnimalCard data={data} size={size} animal={animal} />

          {/* Right-aligned status chips */}

          {data?.in_transit === '1' ? (
            <Box>
              <MedicalIdChip
                medId='In Transit'
                backgroundColor={theme.palette.customColors.TertiaryContainer}
                fontWeight={400}
                textColor={theme.palette.customColors.OnSurfaceVariant}
              />
            </Box>
          ) : null}

          {data?.is_hospitalized === '1' ? (
            <Box>
              <MedicalIdChip
                medId='Hospitalized'
                backgroundColor={theme.palette.customColors.addPrimary}
                fontWeight={400}
                textColor={theme.palette.customColors.OnPrimary}
              />
            </Box>
          ) : null}

          {/* Radio Button for single selection */}
          {radio && (
            <Box>
              <Radio
                checked={radio?.checked}
                sx={{
                  width: 24,
                  height: 24,
                  p: 0,
                  pointerEvents: 'none',
                  '& .MuiSvgIcon-root': {
                    fontSize: 24
                  }
                }}
              />
            </Box>
          )}

          {/* Checkbox for multi selection */}
          {checkbox && (
            <Box>
              <Checkbox
                checked={checkbox?.checked}
                sx={{
                  width: 24,
                  height: 24,
                  p: 0,
                  pointerEvents: 'none',
                  color: theme.palette.customColors?.OutlineVariant,
                  '&.Mui-checked': {
                    color: '#37BD69'
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: 24
                  }
                }}
              />
            </Box>
          )}
        </Box>
      )}
    </>
  )
}

export default AnimalParentCard
