import React from 'react'
import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Typography,
  CircularProgress,
  IconButton
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'

export default function SymptomsList({
  symptoms,
  temporarilySelected,
  selectedSymptoms,
  onSelect,
  searchQuery,
  handleSearchChange,
  handleClearSearch,
  handleScroll,
  loading,
  searching
}) {
  const theme = useTheme()

  return (
    <Box sx={{ pt: 1 }}>
      <TextField
        placeholder='Search'
        fullWidth
        size='small'
        sx={{ mb: 2, borderRadius: '8px' }}
        value={searchQuery}
        onChange={handleSearchChange}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' sx={{ color: 'gray' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position='end'>
                <IconButton onClick={handleClearSearch} size='small' sx={{ color: 'gray' }}>
                  <ClearIcon fontSize='small' />
                </IconButton>
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
          background: theme.palette.customColors.mdAntzNeutral
        }}
      >
        SYMPTOMS
      </Typography>

      <Box sx={{ maxHeight: 500, overflowY: 'auto', mt: 0 }} onScroll={handleScroll}>
        {searching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress />
          </Box>
        ) : symptoms.length === 0 && !loading ? (
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
              No Symptoms to show
            </Typography>
          </Box>
        ) : (
          symptoms.map((symptom, index) => {
            const isSelected = selectedSymptoms.includes(symptom?.id)
            const isTemporarilySelected = temporarilySelected?.id === symptom?.id

            return (
              <Box
                key={symptom?.id}
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
                      onChange={() => onSelect(symptom)}
                      sx={{
                        transform: 'scale(0.8)',
                        padding: '4px'
                      }}
                    />
                  }
                  label={symptom?.name}
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
              </Box>
            )
          })
        )}

        {loading && !searching && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
    </Box>
  )
}
