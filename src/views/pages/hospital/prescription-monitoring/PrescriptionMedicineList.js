import React, { useState, useEffect, useRef, useCallback } from 'react'
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

export default function PrescriptionMedicineList({
  medicineList,
  temporarilySelectedMedicine,
  selectedMedicine,
  onSelect,
  searchQuery,
  handleSearchChange,
  handleClearSearch,
  handleScroll,
  loading,
  searching,
  error
}) {
  const theme = useTheme()

  return (
    <Box sx={{ pt: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
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

      {error && (
        <Typography
          sx={{
            color: theme.palette.error.main,
            fontSize: '0.75rem',
            mt: 1,
            mb: 1,
            ml: 1
          }}
        >
          {error}
        </Typography>
      )}
      <Box
        sx={{
          color: theme.palette.customColors.deepDark,
          fontSize: '12px',
          fontWeight: 600,
          p: 3.7,
          borderRadius: '4px',
          mt: 3,
          background: theme.palette.customColors.mdAntzNeutral,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Typography sx={{ flex: 1 }}>MEDICINE NAME </Typography>
        <Typography sx={{ minWidth: '192px', textAlign: 'left' }}>GENERIC NAME</Typography>
      </Box>

      <Box sx={{ maxHeight: 650, overflowY: 'auto', mt: 0 }} onScroll={handleScroll}>
        {searching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress />
          </Box>
        ) : medicineList.length === 0 && !loading ? (
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
            <img src='/images/no_data_animal_2.png' alt='No Medicine' style={{ maxWidth: '250px' }} />
            <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400, fontSize: '16px' }}>
              No Medicine to show
            </Typography>
          </Box>
        ) : (
          medicineList.map((medicine, index) => {
            const isSelected = selectedMedicine?.includes(medicine?.id)
            const isTemporarilySelected = temporarilySelectedMedicine?.id === medicine?.id

            return (
              <Box
                key={medicine?.id}
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
                      onChange={() => onSelect(medicine)}
                      sx={{
                        transform: 'scale(0.8)',
                        padding: '4px'
                      }}
                    />
                  }
                  label={medicine?.name}
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
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    fontStyle: 'italic',
                    fontSize: '14px',
                    lineHeight: '100%',
                    letterSpacing: '0.1px',
                    verticalAlign: 'middle'
                  }}
                >
                  {medicine?.generic_name || 'N/A'}
                </Typography>
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
