import React from 'react'
import { Box, Avatar } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'

const AnimalCardBasic = ({ image, name, scientificName, age, gender }) => {
  const theme = useTheme()
  const fallBackImage = '/icons/antz.svg'

  const capitalize = str => (str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '-')

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        maxWidth: '100%'
      }}
    >
      <Avatar
        src={image || fallBackImage}
        alt={name}
        sx={{
          width: 56,
          height: 56,
          borderRadius: '8px',
          objectFit: 'cover'
        }}
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TextEllipsisWithModal
          enableDialog={false}
          text={capitalize(name)}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 600,
            maxWidth: '100%'
          }}
        />
        <TextEllipsisWithModal
          enableDialog={false}
          text={scientificName}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 400,
            fontStyle: 'italic',
            maxWidth: '100%'
          }}
        />

        <TextEllipsisWithModal
          enableDialog={false}
          text={`${age} ${age && gender ? '•' : ''} ${capitalize(gender)}`}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 400,
            maxWidth: '100%'
          }}
        />
      </Box>
    </Box>
  )
}

export default AnimalCardBasic
