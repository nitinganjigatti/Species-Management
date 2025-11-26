import { Radio } from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import React from 'react'
import AnimalCard from './AnimalCard'

const AnimalParentCard = ({ data, backgroundColor, size, animal = false, ondelete, radio = false, sx }) => {
  const theme = useTheme()
  console.log(data)

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
            ...sx
          }}
        >
          {/* Animal Card Content */}
          <AnimalCard data={data} size={size} animal={animal} />

          {/* Right-aligned Radio Button */}
          {radio && (
            <Box>
              <Radio
                checked={radio?.checked}
                onChange={radio?.onChange}
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
