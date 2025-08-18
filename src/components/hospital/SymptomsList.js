import React, { useState } from 'react'
import { Box, TextField, FormControlLabel, Checkbox, InputAdornment, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

export default function SymptomsList({ symptoms, temporarilySelected, selectedSymptoms, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredSymptoms = symptoms.filter(symptom => symptom.toLowerCase().includes(searchTerm.toLowerCase()))

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
          color: '#000000',
          fontSize: '12px',
          fontWeight: 600,
          p: 3.7,
          borderRadius: '4px',
          mt: 3,
          background: '#0000000D'
        }}
      >
        Symptoms
      </Typography>

      <Box sx={{ maxHeight: 500, overflowY: 'auto', mt: 0 }}>
        {filteredSymptoms.map((symptom, index) => {
          const isSelected = selectedSymptoms.includes(symptom)
          const isTemporarilySelected = temporarilySelected === symptom

          return (
            <Box
              key={index}
              sx={{
                background: isSelected || isTemporarilySelected ? '#E1F9ED' : 'transparent',
                borderRadius: '1px',
                px: 1,
                py: 3.7,
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid #C3CEC7'
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isSelected || isTemporarilySelected}
                    onChange={() => onSelect(symptom)}
                    sx={{
                      transform: 'scale(0.8)',
                      padding: '4px'
                    }}
                  />
                }
                label={symptom}
                sx={{
                  flex: 1,
                  m: 0,
                  '& .MuiFormControlLabel-label': {
                    color: '#44544A',
                    fontSize: '16px',
                    fontWeight: 600
                  }
                }}
              />
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
