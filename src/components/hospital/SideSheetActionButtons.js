import React from 'react'
import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const SideSheetActionButtons = ({ addLabel, cancelLabel, onAdd, onCancel, width, height }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        position: 'sticky',
        bottom: 1,
        backgroundColor: theme.palette.common.white,
        borderTop: `1px solid ${theme.palette.customColors.OutlineVariant}`,
        px: 4,
        py: 5,
        display: 'flex',
        gap: 3.5
      }}
    >
      <Box
        component='button'
        onClick={onCancel}
        sx={{
          flex: 1,
          width,
          height,
          border: `1px solid ${theme.palette.customColors.OnPrimaryContainer}`,
          borderRadius: '8px',
          backgroundColor: 'transparent',
          color: theme.palette.customColors.OnPrimaryContainer,
          fontWeight: 500,
          fontSize: '15px',
          cursor: 'pointer'
        }}
      >
        {cancelLabel}
      </Box>

      <Box
        component='button'
        onClick={onAdd}
        sx={{
          flex: 1,
          width,
          height,
          borderRadius: '8px',
          backgroundColor: theme.palette.customColors.OnPrimaryContainer,
          color: theme.palette.common.white,
          fontWeight: 500,
          fontSize: '15px',
          cursor: 'pointer',
          border: 'none'
        }}
      >
        {addLabel}
      </Box>
    </Box>
  )
}

export default React.memo(SideSheetActionButtons)
