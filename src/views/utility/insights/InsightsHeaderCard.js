import React from 'react'
import { Box, Typography, IconButton, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import AddIcon from '@mui/icons-material/Add'
import AccessTimeIcon from '@mui/icons-material/AccessTime'

const HeaderCard = ({
  title,
  subtitle,
  onEdit,
  onDelete,
  onAddNew,
  onTimeClick
}) => {
  const theme = useTheme()

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <Box>
        {title && (
          <Typography sx={{ color: theme.palette.common.white, fontSize: '1.5rem', fontWeight: '600' }}>
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography sx={{ mt: 0.5, color: theme.palette.common.white, fontSize: '0.875rem' }}>{subtitle}</Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
        {onTimeClick && (
          <IconButton
            sx={{
              color: theme.palette.common.white,
              transition: 'color 0.2s'
            }}
            size='small'
            onClick={onTimeClick}
          >
            <AccessTimeIcon sx={{ color: theme.palette.common.white }} />
          </IconButton>
        )}

        {onEdit && (
          <IconButton
            sx={{
              color: theme.palette.common.white,
              transition: 'color 0.2s'
            }}
            size='small'
            onClick={onEdit}
          >
            <ModeEditOutlineOutlinedIcon sx={{ color: theme.palette.common.white }} />
          </IconButton>
        )}

        {onDelete && (
          <IconButton
            sx={{
              color: theme.palette.common.white,
              transition: 'color 0.2s'
            }}
            size='small'
            onClick={onDelete}
          >
            <DeleteOutlineOutlinedIcon sx={{ color: theme.palette.common.white }} />
          </IconButton>
        )}

        {onAddNew && (
          <Stack direction='row' spacing={2} alignItems='center'>
            <Typography sx={{ color: theme.palette.customColors.PrimaryContainer, fontSize: '0.875rem' }}>
              Add new
            </Typography>
            <IconButton
              onClick={onAddNew}
              sx={{
                border: '1px solid',
                borderColor: theme.palette.customColors.PrimaryContainer,
                color: theme.palette.customColors.PrimaryContainer,
                transition: 'color 0.2s',
                borderRadius: 0.5,
                padding: 0
              }}
            >
              <AddIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Stack>
        )}
      </Box>
    </Box>
  )
}

export default React.memo(HeaderCard)
