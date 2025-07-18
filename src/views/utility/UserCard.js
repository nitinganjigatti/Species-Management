import React from 'react'
import { Box, Avatar, Typography, Radio, Card } from '@mui/material'
import { useTheme } from '@emotion/react'

const UserCard = ({ name, uid, image, radio }) => {
  const theme = useTheme()
  return (
    <Card
      sx={{
        boxShadow: 'none',
        backgroundColor: 'white', // slightly off-white greenish tone
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        minHeight: 80, // to increase overall height
        px: 3,
        py: 9,
        pb: 7
      }}
    >
      <Box display='flex' alignItems='center' gap={2}>
        <Avatar
          alt={name}
          src={image || '/default-avatar.png'} // use a default image if none provided
          sx={{ width: 48, height: 48 }}
        />
        <Box>
          <Typography
            sx={{
              fontFamily: 'Inter',
              fontWeight: 400,
              fontSize: '14px',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            UID: {uid}
          </Typography>
          <Typography variant='subtitle1' fontWeight={600}>
            {name}
          </Typography>
        </Box>
      </Box>
      <Radio
        checked={radio?.checked}
        onChange={radio?.onChange}
        sx={{
          p: 0,
          color: '#64748B',
          '&.Mui-checked': {
            color: '#4CAF50'
          }
        }}
      />
    </Card>
  )
}

export default UserCard
