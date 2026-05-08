export const measurementDialogPaperSx = (theme: any) => ({
  width: '472.00323486328125px',
  maxWidth: '472.00323486328125px',
  minWidth: '472.00323486328125px',
  height: '259.114990234375px',
  backgroundColor: theme.palette.primary.contrastText,
  borderRadius: '8px',
  border: `1.5px solid ${theme.palette.primary.main}`,
  boxShadow: `0px 4px 18px 0px ${theme.palette.customColors?.shadowColor || '#00000040'}`
})

export const measurementHeaderContainerSx = (theme: any) => ({
  width: '100%',
  height: '72px',
  padding: '24px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '24px',
  borderBottom: `1px solid ${theme.palette.customColors?.SurfaceVariant || '#DAE7DF'}`
})

export const measurementHeaderTitleSx = (theme: any) => ({
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '20px',
  letterSpacing: 0,
  color: theme.palette.customColors?.customHeadingTextColor || theme.palette.text.primary
})

export const measurementHeaderTimeContainerSx = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}

export const measurementHeaderTimeIconSx = (theme: any) => ({
  fontSize: '20px',
  color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
})

export const measurementContentSx = {
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'visible'
}

export const measurementFieldsContainerSx = {
  width: '100%',
  height: '115.11498268331444px',
  borderRadius: '8px',
  padding: '16px',
  gap: '20px',
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'transparent'
}

const baseColumnSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

export const measurementPrimaryFieldColumnSx = {
  ...baseColumnSx,
  flex: 1,
  minWidth: 0
}

export const measurementSecondaryFieldColumnSx = {
  ...baseColumnSx,
  flex: '0 0 132px',
  maxWidth: '132px'
}

export const measurementFieldLabelSx = (theme: any) => ({
  fontFamily: 'Inter',
  fontWeight: 400,
  fontSize: '16px',
  letterSpacing: 0,
  color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
})

export const createMeasurementFieldSx = (theme: any, backgroundColor?: string, textColor?: string) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '4px',
    height: '56px',
    backgroundColor: backgroundColor ?? theme.palette.primary.contrastText,
    padding: 0,
    '& fieldset': {
      borderColor: theme.palette.customColors?.Outline || theme.palette.divider,
      borderWidth: '1px'
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main
    }
  },
  '& .MuiOutlinedInput-input': {
    padding: '6px 8px 6px 12px',
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: '16px',
    letterSpacing: 0,
    color: textColor ?? (theme.palette.customColors?.customHeadingTextColor || theme.palette.text.primary)
  },
  '& .MuiSelect-icon': {
    color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
  },
  '& .MuiInputAdornment-root svg': {
    color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
  }
})

export const measurementActionsSx = {
  height: '72.00000004899489px',
  gap: '16px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  paddingTop: 0,
  paddingRight: '16px',
  paddingBottom: '16px',
  paddingLeft: '16px'
}

export const measurementCancelButtonSx = (theme: any) => ({
  flex: 1,
  minWidth: 0,
  height: '48px',
  borderRadius: '8px',
  borderColor: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.dark,
  color: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.dark,
  fontFamily: 'Inter',
  fontWeight: 600,
  fontSize: '16px',
  letterSpacing: 0
})

export const measurementSubmitButtonSx = (theme: any) => ({
  flex: 1,
  minWidth: 0,
  height: '48px',
  borderRadius: '8px',
  backgroundColor: theme.palette.primary.main,
  boxShadow: `0px 4px 8px -4px ${theme.palette.customColors?.shadowColor || '#4C4E646B'}`,
  fontFamily: 'Inter',
  fontWeight: 600,
  fontSize: '16px',
  letterSpacing: 0,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark || theme.palette.primary.main
  }
})
