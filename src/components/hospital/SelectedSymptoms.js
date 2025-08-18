import React from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

export default function SelectedSymptoms({ selected, onRemove }) {
  return (
    <Box sx={{ p: 6, textAlign: 'center', minHeight: '100%', background: '#E1F9ED', borderRadius: '8px' }}>
      <Typography sx={{ color: '#44544A', fontSize: '20px', fontWeight: 500, textAlign: 'left', mb: 5 }}>
        Selected Symptoms
      </Typography>

      {selected.length === 0 ? (
        <Box
          sx={{
            background: '#fff',
            height: 500,
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img src='/seal-placeholder.png' alt='No Symptoms' style={{ maxWidth: '120px', marginBottom: '10px' }} />
          <Typography variant='body2' color='text.secondary'>
            Selected Symptoms will appear here
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {selected.map((symptom, idx) => (
            <Box
              key={idx}
              sx={{
                background: '#fff',
                p: 3,
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box>
                <Typography variant='body1' fontWeight={600}>
                  {symptom.name}
                </Typography>
                <Typography variant='body2'>Severity: {symptom.severity}</Typography>
                <Typography variant='body2'>
                  Duration: {symptom.durationValue} {symptom.durationUnit}
                </Typography>
                {symptom.notes && <Typography variant='body2'>Notes: {symptom.notes}</Typography>}
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
