'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  TextField,
  FormControlLabel,
  InputAdornment,
  Typography,
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
import { useSelector } from 'react-redux'
import RenderUtility from 'src/utility/render'
import { useSearchParams } from 'next/navigation'
import { Control, FieldErrors, FieldValues, UseFormSetValue } from 'react-hook-form'
import { MedicineList, PrescriptionList } from 'src/types/hospital/models'
import { Id } from 'src/types/hospital'
import { MedicineIdentifier } from 'src/components/hospital/prescriptionMonitoring/AddMedicineToPrescription'

export interface MedicineListItem extends MedicineList {
  prescription_required?: number | boolean
}

export interface MedicineAutocompleteOption extends MedicineListItem {
  label?: string
  value?: Id
  disabled?: boolean
}

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

interface PrescriptionMedicineListProps {
  medicineList: MedicineListItem[]
  temporarilySelectedMedicine?: MedicineListItem | null
  handleClearMedicine?: () => void
  selectedMedicine?: Id[]
  onSelect?: (medicine: MedicineListItem) => void
  searchQuery?: string
  handleSearchChange?: (e: { target: { value: string } }) => void
  handleClearSearch?: () => void
  handleScroll?: (e: React.UIEvent<HTMLElement>) => void
  loading?: boolean
  paginationLoading?: boolean
  searching?: boolean
  error?: string
  prescribedMedicines?: PrescriptionList[]
  isDirectAdminister?: boolean
  control: Control<FieldValues>
  errors?: FieldErrors<FieldValues>
  setValue?: UseFormSetValue<FieldValues>
}

export default function PrescriptionMedicineList({
  medicineList,
  temporarilySelectedMedicine,
  handleClearMedicine,
  selectedMedicine,
  onSelect,
  searchQuery,
  handleSearchChange,
  handleClearSearch,
  handleScroll,
  loading,
  paginationLoading,
  searching,
  error,
  prescribedMedicines = [],
  isDirectAdminister,
  control,
  errors: formErrors,
  setValue
}: PrescriptionMedicineListProps) {
  const theme: any = useTheme()
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const fromPage = searchParams?.get('fromPage')
  const medicine_edit_id = searchParams?.get('medicine_edit_id')
  const tab = searchParams?.get('tab')
  const discharge_tab = searchParams?.get('discharge_tab')
  const editIdStr = medicine_edit_id?.toString()
  const hospitalData: any = useSelector((state: any) => state.hospital.data)
  const enclosureMedicines: MedicineListItem[] = hospitalData.enclosure_medicines || []

  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const filteredList = editIdStr
    ? enclosureMedicines?.filter((med) => med.id?.toString() == editIdStr)
    : medicineList
  const isEnclosureMedicineAdded = (idStr: Id) => enclosureMedicines.some(m => m.id === idStr)

  const isMedicinePrescribed = (medicineId: Id) => {
    const isPrescribed = prescribedMedicines.some(
      (prescription) =>
        prescription?.schedule?.[0]?.medicine_id === medicineId.toString() && prescription?.status !== 'stopped'
    )

    return isPrescribed
  }

  const isMedicineDisabled = (medicine: MedicineListItem) => {
    if (medicine_edit_id) return false

    const isPrescribed =
      tab === 'discharge'
        ? isEnclosureMedicineAdded(medicine.id.toString()) || isMedicinePrescribed(medicine?.id)
        : isDirectAdminister
        ? isMedicinePrescribed(medicine?.id)
        : isMedicinePrescribed(medicine?.id)

    return isPrescribed
  }

  const availableMedicines = filteredList?.filter((medicine) => !isMedicineDisabled(medicine))

  const autocompleteOptions = availableMedicines?.map(medicine => ({
    label: medicine?.name,
    value: medicine?.id,
    generic_name: medicine?.generic_name,
    disabled: isMedicineDisabled(medicine),
    ...medicine
  }))

  if (isMobile) {
    return (
      <Box sx={{ pt: 1, width: '100%' }}>
        <ControlledAutocomplete
          name='selectedMedicine'
          label={(t('hospital_module.search_medicine') as string)}
          control={control}
          errors={formErrors}
          options={autocompleteOptions}
          loading={searching || loading}
          required={true}
          sx={commonFieldStyles}
          {...({
            showIcons: false,
            onChangeOverride: (value: MedicineAutocompleteOption) => {
              if (value && !value.disabled && !loading) {
                onSelect?.(value)
              }
            },
            onItemClear: () => {
              handleClearSearch?.()
              handleClearMedicine?.()
              setValue?.('selectedMedicine', null)
              setValue?.('selectedMedicineId', '')
            },
            getOptionDisabled: (option: MedicineAutocompleteOption) => option.disabled || loading,
            renderOption: (props: React.HTMLAttributes<HTMLLIElement>, option: MedicineAutocompleteOption) => (
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
                    color: theme.palette.customColors.OnSurfaceVariant,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {RenderUtility?.renderControlLabel(option?.controlled_substance, 'CS')}
                  {RenderUtility?.renderPrescriptionLabel(option?.prescription_required, 'PR')}
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
            ),
            textFieldProps: {
              placeholder: 'Search & Select Medicine',
              helperText: error
            }
          })}
          onInputChange={(value: string) => {
            handleSearchChange?.({ target: { value } })
          }}
          getOptionLabel={(option: unknown) => {
            if (typeof option === 'string') return option
            const opt = option as MedicineAutocompleteOption | undefined

            return opt?.label || opt?.name || ''
          }}
          isOptionEqualToValue={(option: unknown, value: unknown) => {
            if (!option || !value) return false
            const o = option as MedicineAutocompleteOption
            const v = value as MedicineAutocompleteOption

            return o.id === v.id || o.value === v.value
          }}
        />
      </Box>
    )
  }

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
          placeholder={(t('search') as string)}
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
            <Box component='img' src='/images/no_data_animal_2.png' alt='No Medicine' sx={{ maxWidth: '250px' }} />
            <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400, fontSize: '16px' }}>
              No Medicine to show
            </Typography>
          </Box>
        ) : (
          (medicine_edit_id ? filteredList : medicineList).map((medicine: any, index: number) => {
            const isSelected = selectedMedicine?.includes(medicine?.id)
            const isTemporarilySelected = temporarilySelectedMedicine?.id === medicine?.id

            const isPrescribed =
              tab == 'discharge'
                ? medicine_edit_id
                  ? isEnclosureMedicineAdded(medicine.id.toString())
                  : isMedicinePrescribed(medicine?.id) || isEnclosureMedicineAdded(medicine.id.toString())
                : isDirectAdminister
                ? isMedicinePrescribed(medicine?.id)
                : isMedicinePrescribed(medicine?.id)
            const isDisabled = medicine_edit_id ? false : isPrescribed

            const MedicineRow = (
              <Box
                key={medicine?.id}
                onClick={() => !isDisabled && !loading && onSelect?.(medicine)}
                sx={{
                  background:
                    isSelected || isTemporarilySelected ? theme.palette.customColors.OnBackground : 'transparent',
                  borderRadius: '1px',
                  px: 4,
                  py: 3.7,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  opacity: isDisabled || loading ? 0.5 : 1,
                  cursor: isDisabled || loading ? 'not-allowed' : 'pointer',
                  pointerEvents: isDisabled || loading ? 'none' : 'auto',
                  '&:hover': {
                    backgroundColor:
                      !isDisabled && !loading
                        ? isSelected || isTemporarilySelected
                          ? theme.palette.customColors.OnBackground
                          : theme.palette.action.hover
                        : 'transparent'
                  },
                  transition: 'background-color 0.2s ease'
                }}
              >
                <FormControlLabel
                  control={
                    <Radio
                      checked={isSelected || isTemporarilySelected}
                      disabled={isDisabled}
                      sx={{
                        transform: 'scale(0.8)',
                        padding: '4px',
                        pointerEvents: 'none'
                      }}
                    />
                  }
                  label={''}
                  sx={{ pointerEvents: 'none' }}
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
                      verticalAlign: 'middle',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {RenderUtility?.renderControlLabel(medicine?.controlled_substance, 'CS')}
                    {RenderUtility?.renderPrescriptionLabel(medicine?.prescription_required, 'PR')}
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

        {paginationLoading && !searching && <MedicineShimmer count={8} />}
      </Box>
    </Box>
  )
}

// Shimmer Loading Component
const MedicineShimmer = ({ count = 8 }: { count?: number }) => {
  const theme: any = useTheme()

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

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              ml: 1
            }}
          >
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
