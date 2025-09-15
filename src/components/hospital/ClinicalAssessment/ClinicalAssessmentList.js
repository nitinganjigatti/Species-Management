import React, { useState } from 'react'
import { Box, TextField, FormControlLabel, Checkbox, InputAdornment, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import SearchIcon from '@mui/icons-material/Search'

export default function ClinicalAssessmentList({ symptoms, temporarilySelected, selectedSymptoms, onSelect }) {
  const theme = useTheme()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredSymptoms = symptoms.filter(symptom => symptom.label.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <Box sx={{ pt: 1 }}>
      <TextField
        placeholder='Search'
        fullWidth
        size='small'
        sx={{ mb: 2, borderRadius: '8px' }}
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' sx={{ color: 'gray' }} />
              </InputAdornment>
            )
          }
        }}
      />

      <Typography
        sx={{
          color: theme.palette.customColors.deepDark,
          fontSize: '12px',
          fontWeight: 600,
          p: 3.7,
          borderRadius: '4px',
          mt: 3,
          background: theme.palette.customColors.mdAntzNeutral,
          display: 'flex',
          //justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ flex: 1 }}>CLINICAL ASSESSMENT</Box>
        <Box sx={{ minWidth: '192px', textAlign: 'left' }}>TYPE</Box>
      </Typography>

      <Box sx={{ maxHeight: 500, overflowY: 'auto', mt: 0 }}>
        {filteredSymptoms.length === 0 ? (
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
              No Clinical Assessment to show
            </Typography>
          </Box>
        ) : (
          filteredSymptoms.map((symptom, index) => {
            const isSelected = selectedSymptoms.includes(symptom.label)
            const isTemporarilySelected = temporarilySelected === symptom.label

            return (
              <Box
                key={index}
                sx={{
                  background:
                    isSelected || isTemporarilySelected ? theme.palette.customColors.OnBackground : 'transparent',
                  borderRadius: '1px',
                  px: 1,
                  py: 3.7,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isSelected || isTemporarilySelected}
                      onChange={() => onSelect(symptom.label)}
                      sx={{
                        transform: 'scale(0.8)',
                        padding: '4px'
                      }}
                    />
                  }
                  label={symptom.label}
                  sx={{
                    flex: 1,
                    m: 0,
                    '& .MuiFormControlLabel-label': {
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontSize: '16px',
                      fontWeight: 600
                    }
                  }}
                />
                <Typography
                  sx={{
                    width: '200px',
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '14px',
                    fontWeight: 400
                  }}
                >
                  {symptom.type}
                </Typography>
              </Box>
            )
          })
        )}
      </Box>
    </Box>
  )
}
