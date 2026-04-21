import React from 'react'
import { Box, Drawer, IconButton, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import PrescriptionList from 'src/components/necropsy/PrescriptionList'

const PrescriptionSidesheet = ({ open, onClose, animalId }) => {
  const theme = useTheme()

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: '85%', md: 600 },
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.background.paper,
            p: 0
          }
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          flexShrink: 0,
          backgroundColor: theme.palette.background.paper
        }}
      >
        <Typography
          sx={{
            fontSize: '18px',
            fontWeight: 600,
            color: theme.palette.customColors.OnSurfaceVariant || theme.palette.text.primary
          }}
        >
          Prescriptions
        </Typography>
        <IconButton onClick={onClose} size='small'>
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Box>

      {/* Scrollable Body */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          p: 2.5,
          backgroundColor: theme.palette.background.paper,
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.divider,
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: theme.palette.action.hover
            }
          }
        }}
      >
        {animalId ? <PrescriptionList animalId={animalId} /> : null}
      </Box>
    </Drawer>
  )
}

export default PrescriptionSidesheet
