import React, { ReactNode, ReactElement } from 'react'
import { Drawer, Box, Typography, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useTheme } from '@mui/material/styles'

interface CustomDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  icon?: string | ReactElement
  iconColor?: string
  children: ReactNode
  backgroundColor?: string
}

const CustomDrawer: React.FC<CustomDrawerProps> = ({ open, onClose, title, icon, iconColor, children, backgroundColor }) => {
  const theme = useTheme()

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor='right'
      variant='temporary'
      slotProps={{
        paper: {
          sx: {
            backgroundColor: backgroundColor ?? (theme.palette as any).customColors?.Background
          }
        }
      }}
    >
      <Box
        sx={{
          width: 570,
          maxWidth: '100vw',
          minHeight: '100vh',
          p: theme.spacing(4, 5)
        }}
      >
        {/* Header */}
        <Box
          sx={{
            position: 'relative'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {icon &&
                (typeof icon === 'string' ? (
                  <Box component='img' src={icon} alt='Drawer Icon' sx={{ width: 32, height: 32 }} />
                ) : (
                  React.cloneElement(icon, {
                    sx: { fontSize: 32, color: 'inherit', ...((icon.props as any)?.sx || {}) }
                  } as any)
                ))}
              <Typography
                sx={{ fontSize: '1.5rem', fontWeight: 500, color: (theme.palette as any).customColors?.OnSurfaceVariant }}
              >
                {title}
              </Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon sx={{ color: (theme.palette as any).customColors?.OnSurfaceVariant }} />
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Box
          sx={{
            mt: 3
          }}
        >
          {children}
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(CustomDrawer)
