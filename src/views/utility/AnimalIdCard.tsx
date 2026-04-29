import React from 'react'
import { Avatar, Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

interface AnimalIdCellProps {
  animalId: string
  uid?: string
  image?: string
  avatarSize?: number
  iconSize?: number
}

const AnimalIdCard: React.FC<AnimalIdCellProps> = ({
  animalId,
  uid,
  image,
  avatarSize = 32,
  iconSize = 16
}) => {
  const theme = useTheme() as any

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Avatar
        src={image}
        sx={{ width: avatarSize, height: avatarSize, bgcolor: theme.palette.customColors.Surface }}
      >
        <Icon icon='mdi:paw' fontSize={iconSize} />
      </Avatar>
      <Box>
        <Typography variant='body2' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurface }}>
          {animalId}
        </Typography>
        {uid && (
          <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>
            {uid}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default React.memo(AnimalIdCard)
