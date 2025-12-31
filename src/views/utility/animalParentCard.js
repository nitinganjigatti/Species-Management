import { Radio } from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import React from 'react'
import AnimalCard from './AnimalCard'
import { MedicalIdChip } from 'src/views/pages/hospital/utility/hospitalSnippets'

const AnimalParentCard = ({ data, backgroundColor, size, animal = false, ondelete, radio = false, sx }) => {
  const theme = useTheme()
  const interactive = Boolean(radio)
  const handleSelect = () => {
    radio?.onChange?.()
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
            backgroundColor: radio?.checked ? '#F2FFF8' : backgroundColor || theme.palette.primary.contrastText,
            borderRadius: '8px',
            paddingY: '20px',
            paddingX: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            border: radio?.checked ? `1px solid #37BD69` : 'none',
            cursor: interactive ? 'pointer' : 'default',
            ...sx
          }}
          onClick={interactive ? handleSelect : undefined}
          onKeyDown={interactive ? handleKeyDown : undefined}
          tabIndex={interactive ? 0 : undefined}
          role={interactive ? 'button' : undefined}
        >
          {/* Animal Card Content */}
          <AnimalCard data={data} size={size} animal={animal} />

          {/* Right-aligned Radio Button */}

          {data?.in_transit === '1' ? (
            <Box>
              <MedicalIdChip medId='In Transit' backgroundColor={theme.palette.customColors.mdAntzNeutral} />
            </Box>
          ) : null}

          {radio && (
            <Box>
              <Radio
                checked={radio?.checked}
                onChange={event => {
                  event.stopPropagation()
                  radio?.onChange?.()
                }}
                onClick={event => {
                  event.stopPropagation()
                }}
                sx={{
                  width: 24,
                  height: 24,
                  p: 0,
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
