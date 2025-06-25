import React from 'react'
import { Box, Typography, IconButton, useTheme, Collapse, Button, alpha } from '@mui/material'
import { Add, Remove, EditOutlined } from '@mui/icons-material'

const CustomAccordion = ({ id, title, children, expanded, onChange, docsCount = null, editable, handleEditClick }) => {
  const theme = useTheme()
  const isExpanded = expanded === id

  return (
    <Box
      sx={{
        mb: 3,
        borderRadius: 1,
        px: { xs: 4, sm: 6, md: 8 },
        boxShadow: isExpanded ? `0px 4px 24px rgba(0, 0, 0, 0.1)` : `0px 1px 3px rgba(0, 0, 0, 0.06)`,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        backgroundColor: theme.palette.common.white
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          py: 5,
          borderBottom: isExpanded ? { sm: `1px solid ${theme.palette.divider}` } : 'none'
        }}
      >
        <Box display='flex' alignItems='center' gap={1}>
          <Typography variant='h5' sx={{ fontWeight: 500, color: theme.palette.customColors.OnPrimaryContainer }}>
            {title}
          </Typography>
        </Box>

        {/* Desktop-only controls */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
          {docsCount !== null && (
            <Box
              sx={{
                mr: 2,
                px: 3,
                py: 1,
                borderRadius: 10,
                backgroundColor: theme.palette.grey[200],
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <Typography sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
                {docsCount}
              </Typography>
              <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>Documents added</Typography>
            </Box>
          )}
          {editable && (
            <Button
              variant='contained'
              startIcon={<EditOutlined color={theme.palette.primary.OnSurface} />}
              onClick={handleEditClick}
              sx={{
                backgroundColor: theme => theme.palette.customColors.OnBackground,
                color: theme.palette.primary.OnSurface,
                boxShadow: 'none',
                mr: 2,
                '&:hover': {
                  backgroundColor: theme => alpha(theme.palette.customColors.OnBackground, 0.8),
                  boxShadow: 'none'
                }
              }}
            >
              Edit
            </Button>
          )}

          <IconButton
            size='small'
            sx={{ color: theme.palette.customColors.OnPrimaryContainer }}
            onClick={() => onChange(id)}
          >
            {isExpanded ? <Remove fontSize='small' /> : <Add fontSize='small' />}
          </IconButton>
        </Box>

        {/* Mobile-only expand button (no other controls) */}
        <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center' }}>
          <IconButton
            size='small'
            sx={{ color: theme.palette.customColors.OnPrimaryContainer }}
            onClick={() => onChange(id)}
          >
            {isExpanded ? <Remove fontSize='small' /> : <Add fontSize='small' />}
          </IconButton>
        </Box>
      </Box>

      {/* Mobile-only controls row */}
      <Box
        sx={{
          display: { xs: 'flex', sm: 'none' },
          alignItems: 'center',
          px: 4,
          py: 2,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        {docsCount !== null && (
          <Box
            sx={{
              mr: 2,
              px: 3,
              py: 1,
              borderRadius: 10,
              backgroundColor: theme.palette.grey[200],
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 4
            }}
          >
            <Typography sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
              {docsCount}
            </Typography>
            <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>Documents added</Typography>
          </Box>
        )}
        {editable && (
          <Button
            variant='contained'
            startIcon={<EditOutlined color={theme.palette.primary.OnSurface} />}
            onClick={handleEditClick}
            sx={{
              backgroundColor: theme => theme.palette.customColors.OnBackground,
              color: theme.palette.primary.OnSurface,
              boxShadow: 'none',
              mb: 4,
              '&:hover': {
                backgroundColor: theme => alpha(theme.palette.customColors.OnBackground, 0.8),
                boxShadow: 'none'
              }
            }}
          >
            Edit
          </Button>
        )}
      </Box>

      <Collapse in={isExpanded}>
        <Box sx={{ py: 8 }}>{children}</Box>
      </Collapse>
    </Box>
  )
}

export default CustomAccordion
