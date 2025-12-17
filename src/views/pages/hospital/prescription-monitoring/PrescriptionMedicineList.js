import React from 'react'
import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Typography,
  CircularProgress,
  IconButton,
  Radio,
  Tooltip,
  useMediaQuery
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'

import { keyframes } from '@emotion/react'
import { useDynamicStateContext } from 'src/context/DynamicStatesContext'
import { useRouter } from 'next/router'

// Shimmer animation
const shimmerAnimation = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`

const commonFieldStyles = {
  textAlign: 'left',
  borderRadius: '4px',
  '& .MuiOutlinedInput-root': {
    borderRadius: '4px'
  }
}

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
  error,
  prescribedMedicines = [],
  isDirectAdminister,

  // New props for autocomplete
  control,
  errors: formErrors,
  setValue
}) {
  const theme = useTheme()
  const router = useRouter()
  const { fromPage, medicine_edit_id, tab } = router.query
  const editIdStr = medicine_edit_id?.toString()
  const { data } = useDynamicStateContext()
  const enclosureMedicines = data.enclosure_medicines || []

  // Check if mobile/tablet view
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // If editing  show only the selected medicine
  const filteredList = editIdStr ? enclosureMedicines?.filter(med => med.id.toString() == editIdStr) : medicineList
  const isEnclosureMedicineAdded = idStr => enclosureMedicines.some(m => m.id === idStr)

  const isMedicinePrescribed = medicineId => {
    const isPrescribed = prescribedMedicines.some(
      prescription =>
        prescription?.schedule?.[0]?.medicine_id === medicineId.toString() && prescription?.status !== 'stopped'
    )

    return isPrescribed
  }

  // Determine if a medicine should be disabled
  const isMedicineDisabled = medicine => {
    if (medicine_edit_id) return false

    const isPrescribed =
      tab === 'discharge'
        ? isEnclosureMedicineAdded(medicine.id.toString())
        : isDirectAdminister
        ? false
        : isMedicinePrescribed(medicine?.id)

    return isPrescribed
  }

  // For autocomplete, filter out disabled medicines
  const availableMedicines = filteredList?.filter(medicine => !isMedicineDisabled(medicine))

  // const availableMedicines = medicineList.filter(medicine => !isMedicineDisabled(medicine))

  const autocompleteOptions = availableMedicines?.map(medicine => ({
    label: medicine?.name,
    value: medicine?.id,
    generic_name: medicine?.generic_name,
    disabled: isMedicineDisabled(medicine),
    ...medicine
  }))

  // Render autocomplete for mobile/tablet
  if (isMobile) {
    return (
      <Box sx={{ pt: 1, width: '100%' }}>
        <ControlledAutocomplete
          name='selectedMedicine'
          label='Search Medicine'
          control={control}
          errors={formErrors}
          options={autocompleteOptions}
          loading={searching || loading}
          required={true}
          sx={commonFieldStyles}
          showIcons={false}
          onChangeOverride={value => {
            if (value && !value.disabled) {
              onSelect(value)
            }
          }}
          onInputChange={value => {
            handleSearchChange({ target: { value } })
          }}
          onItemClear={() => {
            handleClearSearch()
            setValue('selectedMedicine', null)
            setValue('selectedMedicineId', '')
          }}
          getOptionDisabled={option => option.disabled}
          getOptionLabel={option => {
            if (typeof option === 'string') return option

            return option?.label || option?.name || ''
          }}
          isOptionEqualToValue={(option, value) => {
            if (!option || !value) return false

            return option.id === value.id || option.value === value.value
          }}
          renderOption={(props, option) => (
            <Box
              key={option.value}
              component='li'
              {...props}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start !important',
                py: 2,
                opacity: option.disabled ? 0.6 : 1,
                borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                '&:last-child': {
                  borderBottom: 'none'
                }
              }}
            >
              <Box
                sx={{
                  fontWeight: 600,
                  fontSize: '16px',
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {option.label || option.name}
              </Box>
              <Box
                sx={{
                  fontWeight: 500,
                  fontStyle: 'italic',
                  fontSize: '14px',
                  color: theme.palette.customColors.OnSurfaceVariant,
                  mt: 0.5
                }}
              >
                {option.generic_name || 'N/A'}
              </Box>
            </Box>
          )}
          textFieldProps={{
            placeholder: 'Search & Select Medicine',
            helperText: error
          }}
        />
      </Box>
    )
  }

  // Render list view for desktop
  return (
    <Box
      sx={{
        pt: fromPage === 'prescriptionDetail' || medicine_edit_id ? 0 : 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {fromPage === 'prescriptionDetail' || medicine_edit_id ? null : (
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
                <InputAdornment position='end' disabled={fromPage === 'prescriptionDetail' || medicine_edit_id}>
                  <IconButton onClick={handleClearSearch} size='small' sx={{ color: 'gray' }}>
                    <ClearIcon fontSize='small' />
                  </IconButton>
                </InputAdornment>
              )
            }
          }}
        />
      )}
      <Box
        sx={{
          color: theme.palette.customColors.deepDark,
          fontSize: '12px',
          fontWeight: 600,
          p: 3.7,
          borderRadius: '4px',
          mt: fromPage === 'prescriptionDetail' || medicine_edit_id ? 0 : 3,
          background: theme.palette.customColors.mdAntzNeutral,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Typography sx={{ flex: 1 }}>MEDICINE NAME </Typography>
        {/* <Typography sx={{ minWidth: '192px', textAlign: 'left' }}>GENERIC NAME</Typography> */}
      </Box>

      <Box sx={{ maxHeight: 650, overflowY: 'auto', mt: 0 }} onScroll={handleScroll}>
        {searching ? (
          <MedicineShimmer count={8} />
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
          (medicine_edit_id ? filteredList : medicineList).map((medicine, index) => {
            // const isSelected = selectedMedicine?.includes(medicine?.id)
            // const isTemporarilySelected = temporarilySelectedMedicine?.id === medicine?.id
            // const isPrescribed = isMedicinePrescribed(medicine?.id)
            // const isDisabled = isPrescribed

            const isSelected = selectedMedicine?.includes(medicine?.id)
            const isTemporarilySelected = temporarilySelectedMedicine?.id === medicine?.id

            const isPrescribed =
              tab == 'discharge'
                ? medicine_edit_id
                  ? isEnclosureMedicineAdded(medicine.id.toString())
                  : isMedicinePrescribed(medicine?.id) || isEnclosureMedicineAdded(medicine.id.toString())
                : isDirectAdminister
                ? false
                : isMedicinePrescribed(medicine?.id)
            const isDisabled = medicine_edit_id ? false : isPrescribed

            const MedicineRow = (
              <Box
                key={medicine?.id}
                sx={{
                  background:
                    isSelected || isTemporarilySelected ? theme.palette.customColors.OnBackground : 'transparent',
                  borderRadius: '1px',
                  px: 4,
                  py: 3.7,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  opacity: isDisabled ? 0.5 : 1,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  pointerEvents: isDisabled ? 'none' : 'auto'
                }}
              >
                <FormControlLabel
                  control={
                    <Radio
                      checked={isSelected || isTemporarilySelected}
                      onChange={() => !isDisabled && onSelect(medicine)}
                      disabled={isDisabled}
                      sx={{
                        transform: 'scale(0.8)',
                        padding: '4px'
                      }}
                    />
                  }

                  // label={medicine?.name}
                  // sx={{
                  //   flex: 1,
                  //   m: 0,
                  //   '& .MuiFormControlLabel-label': {
                  //     color: isDisabled ? theme.palette.text.disabled : theme.palette.customColors.OnSurfaceVariant,
                  //     fontSize: '16px',
                  //     fontWeight: 600
                  //   }
                  // }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Typography
                    sx={{
                      width: '200px',
                      color: isDisabled ? theme.palette.text.disabled : theme.palette.customColors.OnSurfaceVariant,
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '0.1px',
                      verticalAlign: 'middle'
                    }}
                  >
                    {medicine?.name || ''}
                  </Typography>
                  <Typography
                    sx={{
                      width: '200px',
                      color: isDisabled ? theme.palette.text.disabled : theme.palette.customColors.OnSurfaceVariant,
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
              </Box>
            )

            if (isDisabled) {
              return (
                <Tooltip key={medicine?.id} title='This medicine is already prescribed' placement='left' arrow>
                  {MedicineRow}
                </Tooltip>
              )
            }

            return MedicineRow
          })
        )}

        {loading && !searching && <MedicineShimmer count={8} />}
      </Box>
    </Box>
  )
}

// Shimmer Loading Component
// Shimmer Loading Component
const MedicineShimmer = ({ count = 8 }) => {
  const theme = useTheme()

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          sx={{
            background: 'transparent',
            borderRadius: '1px',
            px: 4,
            py: 3.7,
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
          }}
        >
          {/* Radio shimmer */}
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: `linear-gradient(90deg, 
                ${theme.palette.customColors.OutlineVariant} 25%, 
                ${theme.palette.customColors.mdAntzNeutral} 50%, 
                ${theme.palette.customColors.OutlineVariant} 75%)`,
              backgroundSize: '200% 100%',
              animation: `${shimmerAnimation} 1.5s infinite`,
              marginRight: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: theme.palette.background.paper
              }}
            />
          </Box>

          {/* Medicine name and generic name container */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px',
              ml: 1
            }}
          >
            {/* Medicine name shimmer */}
            <Box
              sx={{
                width: `${Math.random() * 100 + 150}px`,
                height: '16px',
                background: `linear-gradient(90deg, 
                  ${theme.palette.customColors.OutlineVariant} 25%, 
                  ${theme.palette.customColors.mdAntzNeutral} 50%, 
                  ${theme.palette.customColors.OutlineVariant} 75%)`,
                backgroundSize: '200% 100%',
                animation: `${shimmerAnimation} 1.5s infinite`,
                borderRadius: '4px'
              }}
            />
            
            {/* Generic name shimmer */}
            <Box
              sx={{
                width: `${Math.random() * 80 + 120}px`,
                height: '14px',
                background: `linear-gradient(90deg, 
                  ${theme.palette.customColors.OutlineVariant} 25%, 
                  ${theme.palette.customColors.mdAntzNeutral} 50%, 
                  ${theme.palette.customColors.OutlineVariant} 75%)`,
                backgroundSize: '200% 100%',
                animation: `${shimmerAnimation} 1.5s infinite`,
                borderRadius: '4px',
                opacity: 0.8
              }}
            />
          </Box>
        </Box>
      ))}
    </>
  )
}