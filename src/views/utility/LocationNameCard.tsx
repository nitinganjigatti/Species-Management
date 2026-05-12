import React from 'react'
import { Avatar, Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

interface LocationNameCardProps {
  name: string
  image?: string
  icon?: string
  avatarSize?: number
  iconSize?: number
}

const LocationNameCard: React.FC<LocationNameCardProps> = ({
  name,
  image,
  icon = 'mdi:map-marker-outline',
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
        <Icon icon={icon} fontSize={iconSize} />
      </Avatar>
      <Typography variant='body2' sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
        {name}
      </Typography>
    </Box>
  )
}

export default React.memo(LocationNameCard)
