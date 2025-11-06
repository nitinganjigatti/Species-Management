export const measurementDialogPaperSx = {
  width: '472.00323486328125px',
  maxWidth: '472.00323486328125px',
  minWidth: '472.00323486328125px',
  height: '259.114990234375px',
  backgroundColor: '#FFFFFF',
  borderRadius: '8px',
  border: '1.5px solid #37BD69',
  boxShadow: '0px 4px 18px 0px #00000040'
}

export const measurementHeaderContainerSx = {
  width: '100%',
  height: '72px',
  padding: '24px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '24px',
  borderBottom: '1px solid #DAE7DF'
}

export const measurementHeaderTitleSx = {
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '20px',
  letterSpacing: 0,
  color: '#44544A'
}

export const measurementHeaderTimeContainerSx = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}

export const measurementHeaderTimeIconSx = {
  fontSize: '20px',
  color: '#44544A'
}

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
  backgroundColor: '#FFFFFF'
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

export const measurementFieldLabelSx = {
  fontFamily: 'Inter',
  fontWeight: 400,
  fontSize: '16px',
  letterSpacing: 0,
  color: '#44544A'
}

export const createMeasurementFieldSx = (backgroundColor, textColor = '#133020') => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '4px',
    height: '56px',
    backgroundColor,
    padding: 0,
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#839D8D',
      borderWidth: '1px'
    },
    '& fieldset': {
      borderColor: '#839D8D',
      borderWidth: '1px'
    },
    '&:hover fieldset': {
      borderColor: '#37BD69'
    },
    '&.Mui-focused fieldset': {
      borderColor: '#37BD69'
    }
  },
  '& .MuiOutlinedInput-input': {
    padding: '6px 8px 6px 12px',
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: '16px',
    letterSpacing: 0,
    color: textColor
  },
  '& .MuiSelect-icon': {
    color: '#44544A'
  },
  '& .MuiInputAdornment-root svg': {
    color: '#44544A'
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

export const measurementCancelButtonSx = {
  flex: 1,
  minWidth: 0,
  height: '48px',
  borderRadius: '8px',
  borderColor: '#1F515B',
  color: '#1F515B',
  fontFamily: 'Inter',
  fontWeight: 600,
  fontSize: '16px',
  letterSpacing: 0
}

export const measurementSubmitButtonSx = {
  flex: 1,
  minWidth: 0,
  height: '48px',
  borderRadius: '8px',
  backgroundColor: '#37BD69',
  boxShadow: '0px 4px 8px -4px #4C4E646B',
  fontFamily: 'Inter',
  fontWeight: 600,
  fontSize: '16px',
  letterSpacing: 0,
  '&:hover': {
    backgroundColor: '#2BA35A'
  }
}
