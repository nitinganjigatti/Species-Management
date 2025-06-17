import React from 'react'
import {
  Box,
  Typography,
  IconButton,
  useTheme,
  Collapse
} from '@mui/material'
import { Add, Remove } from '@mui/icons-material'

const CustomAccordion = ({
  id,
  title,
  children,
  expanded,
  onChange,
  docsCount = null
}) => {
  const theme = useTheme()
  const isExpanded = expanded === id

  return (
    <Box
      sx={{
        mb: 3,
        borderRadius: 1,
        px: 8,
        boxShadow: isExpanded
          ? `0px 4px 24px rgba(0, 0, 0, 0.1)`
          : `0px 1px 3px rgba(0, 0, 0, 0.06)`,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        backgroundColor: theme.palette.common.white
      }}
    >
      <Box
        onClick={() => onChange(id)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          py: 5,
          borderBottom: isExpanded ? `1px solid ${theme.palette.divider}` : 'none',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="h5" sx={{ fontWeight: 500, color: theme.palette.customColors.OnPrimaryContainer }}>
            {title}
          </Typography>
          {docsCount !== null && (
            <Box
              sx={{
                ml: 2,
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
        </Box>

        <IconButton size="small" sx={{ color: theme.palette.customColors.OnPrimaryContainer }}>
          {isExpanded ? <Remove fontSize="small" /> : <Add fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={isExpanded}>
        <Box sx={{ py: 8 }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  )
}

export default CustomAccordion
