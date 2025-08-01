import { useTheme } from '@mui/material/styles'
import { Typography, Box, Divider, Menu, MenuItem, IconButton, Avatar } from '@mui/material'
import React, { useState } from 'react'
import Icon from 'src/@core/components/icon'
import AnimalMortalityEditDrawer from 'src/views/pages/housing/animals/AnimalMortalityEditDrawer'
import RenderUtility from 'src/utility/render'

const AnimalMortality = () => {
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState(null)
  const [openEditMortalityDrawer, setOpenMortalityDrawer] = useState(false)

  // Open menu
  const handleMenuOpen = event => {
    setAnchorEl(event.currentTarget)
  }

  // Close menu
  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const mortalityData = [
    {
      label: 'Suspected Cause of Death',
      value: 'Natural'
    },
    {
      label: 'Discovered Time and Date',
      value: (
        <>
          03:42 PM
          <span style={{ margin: '0 8px', color: '#aaa' }}>•</span>
          24 Apr 2024
        </>
      )
    },
    {
      label: 'Carcass Condition',
      value: 'Body was found intact with no visible injuries. Minor signs of natural decomposition were present.'
    },
    {
      label: 'Carcass Disposition',
      value: 'Carcass was securely bagged and transferred to the veterinary facility for examination.'
    },
    {
      label: 'Notes',
      value:
        'Animal had shown signs of fatigue and reduced mobility over the past few weeks. No incidents of aggression or trauma reported.'
    },
    {
      label: 'Necropsy Requested',
      value: 'Yes'
    }
  ]

  const createdBy = 'Sourav tambe'
  const createdAt = '14 Apr 2024 | 12:35 PM'

  const handleMortalityEdit = () => {
    setOpenMortalityDrawer(true)
    handleMenuClose()
  }

  return (
    <>
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            Mortality Report
          </Typography>
          <IconButton
            size='small'
            aria-controls={anchorEl ? 'mortality-menu' : undefined}
            aria-haspopup='true'
            onClick={handleMenuOpen}
          >
            <Icon icon='mdi:dots-vertical' />
          </IconButton>
          <Menu
            id='mortality-menu'
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                border: '1px solid #37BD69',
                borderRadius: 2,
                minWidth: 120,
                boxShadow: 2,
                px: 1
              }
            }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
          >
            <MenuItem
              onClick={handleMortalityEdit}
              sx={{ fontWeight: 500, p: 3, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
            >
              Edit
            </MenuItem>
            <MenuItem
              sx={{ fontWeight: 500, p: 3, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
            >
              Revoke
            </MenuItem>
          </Menu>
        </Box>
        <Box
          sx={{
            background: '#FFBDA833',
            borderRadius: 1,
            px: { xs: 3, sm: 6 },
            py: { xs: 2, sm: 6 },
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            mt: 4
          }}
        >
          {mortalityData.map(({ label, value }) => (
            <Box key={label} sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography
                component='div'
                sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant, mb: 1, fontSize: '16px' }}
              >
                {label}
              </Typography>
              <Typography
                sx={{ fontSize: '16px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {value}
              </Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                backgroundColor: theme.palette.customColors.displaybgPrimary
              }}
            >
              <img src={''} alt='user-profile' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Avatar>
            <Box>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  letterSpacing: '0.1px',
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {createdBy}
              </Typography>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 400,
                  letterSpacing: 0,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {createdAt}
              </Typography>
            </Box>
          </Box>
          {/* <Box>
            {RenderUtility.renderUserAvatarDetails(
              '',
              createdBy,
              createdAt,
              theme.palette.customColors.OnSurfaceVariant,
              '14px'
            )}
          </Box> */}
        </Box>
      </Box>
      {openEditMortalityDrawer && (
        <AnimalMortalityEditDrawer open={openEditMortalityDrawer} setDrawerOpen={setOpenMortalityDrawer} />
      )}
    </>
  )
}

export default AnimalMortality
