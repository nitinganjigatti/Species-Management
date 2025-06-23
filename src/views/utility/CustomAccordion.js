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
        px: 8,
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
          borderBottom: isExpanded ? `1px solid ${theme.palette.divider}` : 'none'
        }}
      >
        <Box display='flex' alignItems='center' gap={1}>
          <Typography variant='h5' sx={{ fontWeight: 500, color: theme.palette.customColors.OnPrimaryContainer }}>
            {title}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {docsCount !== null && (
            <Box
              sx={{
                mr: 2,
                px: 1.5,
                py: 0.5,
                borderRadius: 10,
                fontSize: '0.75rem',
                backgroundColor: theme.palette.grey[200],
                color: theme.palette.text.secondary
              }}
            >
              {docsCount}
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
      </Box>

      <Collapse in={isExpanded}>
        <Box sx={{ py: 8 }}>{children}</Box>
      </Collapse>
    </Box>
  )
}

export default CustomAccordion
