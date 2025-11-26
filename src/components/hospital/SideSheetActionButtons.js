import React from 'react'
import { Box, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const SideSheetActionButtons = ({
  addLabel,
  cancelLabel,
  onAdd,
  onCancel,
  width,
  height,
  isSubmitLoading,
  isDisabled
}) => {
  const theme = useTheme()

  return (
    <Box
      // sx={{
      //   position: 'sticky',
      //   bottom: 1,
      //   backgroundColor: theme.palette.common.white,
      //   borderTop: `1px solid ${theme.palette.customColors.OutlineVariant}`,
      //   px: 4,
      //   py: 5,
      //   display: 'flex',
      //   gap: 3.5
      // }}
      sx={{
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
        disabled={isDisabled || isSubmitLoading}
        sx={{
          flex: 1,
          width,
          height,
          borderRadius: '8px',
          backgroundColor:
            isSubmitLoading || isDisabled
              ? theme.palette.customColors.neutralSecondary
              : theme.palette.customColors.OnPrimaryContainer,
          color: theme.palette.common.white,
          fontWeight: 500,
          fontSize: '15px',
          cursor: isSubmitLoading || isDisabled ? 'not-allowed' : 'pointer',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}
      >
        {isSubmitLoading ? <CircularProgress size={20} color='inherit' /> : addLabel}
      </Box>
    </Box>
  )
}

export default React.memo(SideSheetActionButtons)
