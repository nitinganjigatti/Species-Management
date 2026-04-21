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
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: theme => theme.spacing(3, 3.255, 3, 5.255),
            px: '24px',
            borderBottom: `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Icon icon='mdi:pill-multiple' fontSize={28} />
            <Typography
              sx={{
                fontSize: '18px',
                fontWeight: 600,
                color: theme.palette.customColors.OnSurfaceVariant || theme.palette.text.primary
              }}
            >
              Prescriptions
            </Typography>
          </Box>
          <IconButton onClick={onClose} size='small'>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            px: '24px',
            py: 3,
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
      </Box>
    </Drawer>
  )
}

export default PrescriptionSidesheet
