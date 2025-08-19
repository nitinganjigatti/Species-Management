import React from 'react'
import { Box, Typography, IconButton, alpha } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'

export default function SelectedSymptoms({ selected, onRemove, severity }) {
  const theme = useTheme()
  const severityBgColors = {
    High: alpha(theme.palette.customColors.TertiaryContainer, 0.15),
    Extreme: alpha(theme.palette.customColors.ErrorContainer, 0.4),
    Medium: theme.palette.customColors.antzNotesLight,
    Low: alpha(theme.palette.customColors.SecondaryContainer, 0.4),
    Default: theme.palette.customColors.tableHeaderBg
  }
  const severityColors = {
    High: theme.palette.customColors.customDropdownColor,
    Extreme: theme.palette.customColors.Error,
    Medium: theme.palette.customColors.moderateSecondary,
    Default: theme.palette.customColors.addPrimary
  }
  return (
    <Box
      sx={{
        p: 6,
        textAlign: 'center',
        minHeight: '100%',
        background: theme.palette.customColors.OnBackground,
        borderRadius: '8px'
      }}
    >
      <Typography
        sx={{
          color: theme.palette.customColors.OnSurfaceVariant,
          fontSize: '20px',
          fontWeight: 500,
          textAlign: 'left',
          mb: 5
        }}
      >
        Selected Symptoms
      </Typography>

      {selected.length === 0 ? (
        <Box
          sx={{
            background: theme.palette.common.white,
            height: 500,
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img src='/images/no_data_animal_2.png' alt='No Symptoms' style={{ maxWidth: '250px' }} />
          <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400, fontSize: '16px' }}>
            Selected Symptoms will appear here
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            background: theme.palette.common.white,
            height: 500,
            borderRadius: '8px',
            display: 'flex',
            p: 7
            //py: 10
          }}
        >
          {selected.map((symptom, idx) => (
            <Box
              key={idx}
              sx={{
                backgroundColor: severityBgColors[selected[idx]?.severity] || severityBgColors.Default,
                p: 4,
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box>
                <Typography
                  fontWeight={500}
                  sx={{
                    color: severityColors[selected[idx]?.severity] || severityColors.Default,
                    fontSize: '14px'
                  }}
                >
                  {symptom.name}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    textAlign: 'left',
                    background: theme.palette.common.white,
                    color: severityColors[selected[idx]?.severity] || severityColors.Default,
                    borderRadius: '4px',
                    mt: 2,
                    mb: 1,
                    px: 3.5,
                    py: 0.5,
                    width: 'fit-content',
                    minWidth: 'auto'
                  }}
                >
                  {symptom.severity}
                </Typography>
                {/* <Typography variant='body2'>
                  Duration: {symptom.durationValue} {symptom.durationUnit}
                </Typography>
                {symptom.notes && <Typography variant='body2'>Notes: {symptom.notes}</Typography>} */}
              </Box>
              <IconButton onClick={() => onRemove(symptom.name)}>
                <CloseIcon />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
