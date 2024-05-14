import { Checkbox, FormControlLabel, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'
import { useTheme } from '@mui/material/styles'

const ConfirmationCheckBox = ({ color, label, value, setValue, title, description }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        backgroundColor: color ? color + '0D' : theme.palette.formContent?.bg,
        padding: '16px',
        borderRadius: '4px'
      }}
    >
      {title ? (
        <Typography
          sx={{ mb: '0px', fontSize: '14px', color: color ? color : null, fontWeight: 600, fontSize: '14px' }}
        >
          {title}
        </Typography>
      ) : null}
      <FormControlLabel
        control={
          <Checkbox
            onClick={e => {
              setValue(e.target.checked)
              console.log('first', e.target.checked)
            }}
            checked={value}
          />
        }
        label={<Typography sx={{ fontWeight: 500, fontSize: '14px', mt: '2px' }}>{label}</Typography>}
      />
      {description ? <Typography sx={{ ml: 8, fontWeight: 400, fontSize: '12px' }}>{description}</Typography> : null}
    </Box>
  )
}

export default ConfirmationCheckBox
