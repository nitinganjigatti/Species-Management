import React, { useState } from 'react'
import { Box, TextField, FormControlLabel, Checkbox, InputAdornment, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import SearchIcon from '@mui/icons-material/Search'

export default function PrescriptionMedicineList({
  medicineList,
  temporarilySelectedMedicine,
  selectedMedicine,
  onSelect,
  error
}) {
  const theme = useTheme()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredMedicines = medicineList.filter(medicine =>
    medicine.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Box
      sx={{
        pt: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
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

      <Box
        sx={{
          flex: 1,
          maxHeight: 650,
          overflowY: 'auto',
          mt: 0,
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.customColors.OutlineVariant,
            borderRadius: '3px'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: theme.palette.customColors.OnSurfaceVariant
          }
        }}
      >
        {filteredMedicines.length === 0 ? (
          <Box
            sx={{
              background: theme.palette.common.white,
              maxHeight: 650,
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img src='/images/no_data_animal_2.png' alt='No Medicines' style={{ maxWidth: '250px' }} />
            <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400, fontSize: '16px' }}>
              No Medicine to show
            </Typography>
          </Box>
        ) : (
          filteredMedicines.map((medicine, index) => {
            // If selectedMedicine is an object, compare by label
            const actuallySelected =
              (selectedMedicine && selectedMedicine.label === medicine.label) || selectedMedicine === medicine.label

            const isTemporarilySelected =
              temporarilySelectedMedicine && temporarilySelectedMedicine.label === medicine.label

            return (
              <Box
                key={index}
                sx={{
                  background:
                    actuallySelected || isTemporarilySelected ? theme.palette.customColors.OnBackground : 'transparent',
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
                      checked={actuallySelected || isTemporarilySelected}
                      onChange={() => onSelect(medicine)}
                      sx={{
                        transform: 'scale(0.8)',
                        padding: '4px'
                      }}
                    />
                  }
                  label={medicine.label}
                  sx={{
                    flex: 1,
                    m: 0,
                    color:
                      actuallySelected || isTemporarilySelected
                        ? theme.palette.primary.OnSurface
                        : theme.palette.customColors.OnSurfaceVariant,
                    '& .MuiFormControlLabel-label': {
                      color:
                        actuallySelected || isTemporarilySelected
                          ? theme.palette.primary.OnSurface
                          : theme.palette.customColors.OnSurfaceVariant,

                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '0px',
                      verticalAlign: 'middle'
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
                  {medicine.genericName}
                </Typography>
              </Box>
            )
          })
        )}
      </Box>
    </Box>
  )
}
