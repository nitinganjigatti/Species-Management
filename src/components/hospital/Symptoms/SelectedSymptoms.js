import React from 'react'
import { Box, Typography, IconButton, alpha } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import useHospitalColorUtils from 'src/hooks/useHospitalColorUtils'

export default function SelectedSymptoms({ selected, onRemove, severity }) {
  const theme = useTheme()
  const { getSymptomsSeverityColor } = useHospitalColorUtils()

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
          fontWeight: 400,
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
            p: 7,
            overflow: 'auto'
            //py: 10
          }}
        >
          {selected.map((symptom, idx) => (
            <Box
              key={idx}
              sx={{
                backgroundColor: getSymptomsSeverityColor(selected[idx]?.severity).bgColor,
                p: 4,
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box>
                <Typography
                  fontWeight={400}
                  sx={{
                    color: getSymptomsSeverityColor(selected[idx]?.severity).color,
                    fontSize: '14px',
                    textAlign: 'left'
                  }}
                >
                  {symptom.name}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    textAlign: 'left',
                    background: theme.palette.common.white,
                    color: getSymptomsSeverityColor(selected[idx]?.severity).color,
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
