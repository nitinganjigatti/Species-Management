import React from 'react'
import { Box, Avatar, Typography, Radio, Card } from '@mui/material'
import { useTheme } from '@emotion/react'

const UserCard = ({ name, uid, image, radio, role }) => {
  const theme = useTheme()
  const handleSelect = () => {
    radio?.onChange?.()
  }

  return (
    <Card
      sx={{
        boxShadow: 'none',
        backgroundColor: radio?.checked ? '#F2FFF8' : 'white', // slightly off-white greenish tone
        display: 'flex',
        border: radio?.checked ? '1px solid #37BD69' : 'white',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        minHeight: 80, // to increase overall height
        px: 4,
        py: 7,
        pb: 7,
        cursor: 'pointer'
      }}
      onClick={handleSelect}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleSelect()
        }
      }}
      tabIndex={0}
      role='button'
    >
      <Box display='flex' alignItems='center' gap={4}>
        <Avatar
          alt={name}
          src={image || '/default-avatar.png'} // use a default image if none provided
          sx={{ width: 48, height: 48 }}
        />
        <Box>
          <Typography
            sx={{
              fontSize: '20px',
              fontWeight: 500,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {name || '-'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
              {role || '-'}
            </Typography>
          </Box>
        </Box>
      </Box>
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
