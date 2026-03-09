/* eslint-disable lines-around-comment */
import { useEffect } from 'react'
import { Grid, Divider, Typography, Box, Button, Chip } from '@mui/material'
import { useTheme } from '@emotion/react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
// Custom Components
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledFileUpload from 'src/views/forms/form-fields/ControlledFileUpload'
import Utility from 'src/utility'
import RenderUtility from 'src/utility/render'

// Validation Schema
const schema = yup.object().shape({
  medicine: yup.object().nullable().required('Please select a product'),
  quantity: yup
    .number()
    .typeError('Quantity is required')
    .positive('Quantity must be greater than 0')
    .integer('Quantity must be a whole number')
    .required('Quantity is required'),
  priority: yup.string().required('Please select priority'),
  prescription_file: yup.mixed().when(['control_substance', 'prescription_required'], {
    is: (control_substance, prescription_required) => control_substance || prescription_required,
    then: schema => schema.required('Prescription is required'),
    otherwise: schema => schema.nullable()
  }),
  notes: yup.string().nullable()
})

const defaultValues = {
  medicine: null,
  quantity: '',
  priority: 'normal',
  prescription_file: null,
  notes: '',
  // Hidden fields for tracking
  control_substance: false,
  prescription_required: false
}

const RequestItemsForm = ({
  // Tab state
  tabStatus,
  setTabStatus,

  // Options lists
  optionsMedicineList = [],
  optionsGenericMedicineList = [],

  // Search handlers
  searchMedicineData,
  searchGenericMedicineData,
  fetchMedicineData,
  medicineSearchLoading = false,

  // Pending products
  requestPendingProducts,
  showWarning = {},
  setShowWarning,

  // Existing items for duplicate check
  existingMedicineIds = [],

  // Actions
  isEditMode = false,
  initialData = null,
  onClose,
  onSubmit,
  onUpdate
}) => {
  const theme = useTheme()

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues,
    mode: 'onChange',
    resolver: yupResolver(schema)
  })

  // Watch values for conditional rendering
  const selectedMedicine = watch('medicine')
  const quantity = watch('quantity')
  const priority = watch('priority')
  const controlSubstance = watch('control_substance')
  const prescriptionRequired = watch('prescription_required')

  // Set initial data for edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      // Convert existing file URL to object format for ControlledFileUpload
      const existingFile = (() => {
        const file = initialData?.prescription_required_file
        if (!file) return null
        if (file instanceof File) return file

        if (typeof file === 'string' && file !== '') {
          // Extract filename from URL if no explicit filename
          const fileName =
            initialData?.prescription_required_filename || file.split('/').pop().split('?')[0] || 'Prescription'

          return {
            file_path: file,
            file_original_name: fileName,
            name: fileName
          }
        }

        if (typeof file === 'object' && file?.file_path) {
          return {
            file_path: file?.file_path,
            file_original_name: file?.file_original_name || file?.name || 'Prescription',
            name: file?.file_original_name || file?.name || 'Prescription'
          }
        }

        return file
      })()

      reset({
        medicine: {
          value: initialData?.request_item_medicine_id,
          name: initialData?.medicine_name,
          genericName: initialData?.genericName,
          package: initialData?.package,
          manufacture: initialData?.manufacture,
          unit_price: initialData?.unit_price,
          control_substance: initialData?.control_substance,
          prescription_required: initialData?.prescription_required
        },
        quantity: initialData?.request_item_qty,
        priority: initialData?.priority_item || 'normal',
        prescription_file: existingFile,
        notes: initialData?.notes || '',
        control_substance: initialData?.control_substance,
        prescription_required: initialData?.prescription_required
      })
    }
  }, [isEditMode, initialData, reset])

  // Handle medicine selection
  const handleMedicineChange = newValue => {
    if (newValue?.value) {
      requestPendingProducts?.(newValue.value)
    }

    // Update hidden fields
    setValue('control_substance', newValue?.control_substance || false)
    setValue('prescription_required', newValue?.prescription_required || false)

    setShowWarning?.({})
  }

  // Form submission
  const handleFormSubmit = data => {
    // Duplicate check (only when adding, not editing)
    if (!isEditMode && existingMedicineIds?.includes(data?.medicine?.value)) {
      setError('medicine', { type: 'manual', message: 'This medicine already exists in the request' })

      return
    }

    const file = data.prescription_file

    const payload = {
      request_item_medicine_id: data?.medicine?.value,
      medicine_name: data?.medicine?.name,
      genericName: data?.medicine?.genericName,
      package: data?.medicine?.package,
      manufacture: data?.medicine?.manufacture,
      unit_price: data?.medicine?.unit_price,
      request_item_qty: data?.quantity,
      priority_item: data?.priority,
      control_substance: data?.control_substance,
      prescription_required: data?.prescription_required,
      prescription_required_file: file instanceof File ? file : file?.file_path || '',
      prescription_required_filename: file instanceof File ? file.name : file?.file_original_name || '',
      notes: data?.notes
    }

    if (isEditMode) {
      onUpdate?.(payload)
    } else {
      onSubmit?.(payload)
    }
  }

  // Render medicine option
  const renderMedicineOption = (props, option) => {
    const { key, ...otherProps } = props

    return (
      <li
        key={`${option?.id || ''}-${option?.name || option?.genericName}-${option?.package}-${option?.manufacture}`}
        {...otherProps}
        style={{ opacity: option?.status ? 1 : 0.5, pointerEvents: option?.status ? 'auto' : 'none' }}
      >
        <Box>
          <Typography>{tabStatus === 'By product' ? option?.name : option?.genericName}</Typography>
          <Typography variant='body2'>{option?.package}</Typography>
          <Typography variant='body2'>{option?.manufacture}</Typography>
          {RenderUtility?.renderControlLabel(option?.control_substance === true, 'CS')}
          {RenderUtility?.renderPrescriptionLabel(option?.prescription_required === true, 'PR')}
        </Box>
      </li>
    )
  }

  // Priority button styles
  const getPriorityButtonStyle = (priorityValue, activeColor, borderColor) => ({
    width: { xs: '100%', sm: '192px' },
    height: '46px',
    borderRadius: '8px',
    boxShadow: 'none',
    backgroundColor: priority === priorityValue ? `${activeColor}30` : 'white',
    border:
      priority === priorityValue
        ? `1px solid ${borderColor}`
        : `1.5px solid ${theme.palette.customColors.OutlineVariant}60 !important`,
    '&:hover': {
      backgroundColor: priority === priorityValue ? `${activeColor}30 !important` : 'transparent !important'
    }
  })

  return (
    <Box component='form' onSubmit={handleSubmit(handleFormSubmit)} sx={{ width: { xs: '100%', sm: '100%', md: 700 } }}>
      <Divider sx={{ mt: -6 }} />

      {/* Tab Switch */}
      <Grid sx={{ my: 6 }} size={{ xs: 12 }}>
        <Grid
          item
          sx={{ display: 'flex', justifyItems: 'center', justifyContent: 'center', gap: 4 }}
          size={{ xs: 12, sm: 12 }}
        >
          <Typography
            variant='button'
            onClick={() => setTabStatus('By product')}
            sx={{
              cursor: 'pointer',
              borderBottom: tabStatus === 'By product' ? '5px solid' : '',
              color: tabStatus === 'By product' ? 'primary.main' : 'customColors.OnSurfaceVariant',
              padding: '8px 16px'
            }}
          >
            By Product Name
          </Typography>
          <Typography
            variant='button'
            onClick={() => setTabStatus('By generic')}
            sx={{
              cursor: 'pointer',
              borderBottom: tabStatus === 'By generic' ? '5px solid' : '',
              color: tabStatus === 'By generic' ? 'primary.main' : 'customColors.OnSurfaceVariant',
              padding: '8px 16px'
            }}
          >
            By Generic Name
          </Typography>
        </Grid>
      </Grid>

      <Grid container sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }} item size={{ xs: 12 }}>
        {/* Medicine Search */}
        <Grid item size={{ xs: 12, sm: 12 }}>
          <ControlledAutocomplete
            key={tabStatus}
            name='medicine'
            control={control}
            label={tabStatus === 'By product' ? 'Search by Product Name*' : 'Search by Generic Name*'}
            options={tabStatus === 'By product' ? optionsMedicineList : optionsGenericMedicineList}
            getOptionLabel={option => (tabStatus === 'By product' ? option?.name || '' : option?.genericName || '')}
            isOptionEqualToValue={(option, value) => option?.value === value?.value}
            renderOption={renderMedicineOption}
            onChangeOverride={handleMedicineChange}
            loading={medicineSearchLoading}
            showLoader
            onInputChange={(value, reason) => {
              if (reason !== 'input') return

              if (tabStatus === 'By product') {
                searchMedicineData?.(value)
              } else {
                searchGenericMedicineData?.(value)
              }
            }}
            onBlur={() => {
              if (tabStatus === 'By product') {
                fetchMedicineData?.('')
              } else {
                searchGenericMedicineData?.('')
              }
            }}
            autocompleteProps={{ filterOptions: options => options }}
            errors={errors}
          />
        </Grid>

        {/* Selected Medicine Info */}
        {(selectedMedicine?.name || selectedMedicine?.genericName) && (
          <Box
            sx={{
              backgroundColor: 'customColors.Surface',
              padding: '16px',
              borderRadius: '8px',
              marginTop: '5px',
              border: '0.5px solid',
              borderColor: 'primary.main'
            }}
          >
            <Typography sx={{ fontWeight: 500, fontFamily: 'Inter', fontSize: '12px', mb: 1 }}>
              {tabStatus === 'By product' ? 'Product Name' : 'Generic Name'}:{' '}
              <span style={{ fontWeight: 400, fontSize: '12px' }}>
                {tabStatus === 'By product' ? selectedMedicine?.name : selectedMedicine?.genericName}
              </span>
            </Typography>
            <Typography sx={{ fontWeight: 400, fontFamily: 'Inter', fontSize: '12px', mb: 1 }}>
              Package: <span style={{ fontWeight: 400, fontSize: '12px' }}>{selectedMedicine?.package}</span>
            </Typography>
            <Typography sx={{ fontWeight: 400, fontFamily: 'Inter', fontSize: '12px', mb: 1 }}>
              Manufactured by:{' '}
              <span style={{ fontWeight: 400, fontSize: '12px' }}>{selectedMedicine?.manufacture}</span>
            </Typography>
          </Box>
        )}

        {/* Pending Request Warning */}
        {showWarning?.count > 0 && (
          <Grid item size={{ xs: 12, sm: 12 }} sx={{ maxWidth: '80%' }}>
            <Typography
              sx={{
                mb: 2,
                fontSize: '12px',
                fontWeight: 400,
                color: 'customColors.Tertiary'
              }}
            >
              *You have{' '}
              <Box component='span' sx={{ fontWeight: 600 }}>
                {showWarning?.count || 0} ongoing requests
              </Box>{' '}
              for this product (Qty: {showWarning?.total_pending_quantity || 0}). Please review before proceeding to
              avoid duplicate requests.
            </Typography>
          </Grid>
        )}

        {/* Quantity Input */}
        <Grid item size={{ xs: 12, sm: 12 }}>
          <Typography sx={{ mb: 2, fontSize: '16px', fontWeight: 500, color: 'customColors.customTextColorGray2' }}>
            Quantity *
          </Typography>
          <ControlledTextField
            name='quantity'
            control={control}
            label='Quantity*'
            type='number'
            errors={errors}
            onWheel={event => event.target.blur()}
          />

          {selectedMedicine?.unit_price > 0 && quantity > 0 && (
            <Box sx={{ mx: 1, my: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Chip
                label={`Unit Price - ${Utility?.formatAmountToReadableDigit(Number(selectedMedicine?.unit_price))}`}
                variant='outlined'
                size='small'
                sx={{
                  fontSize: '13px',
                  height: '32px',
                  fontWeight: 400,
                  backgroundColor: 'customColors.Surface',
                  color: 'customColors.OnSurfaceVariant',
                  border: `0.5px solid ${theme.palette.primary.main} !important`
                }}
              />
              <Chip
                label={`Cost of requested medicine - ${Utility?.formatAmountToReadableDigit(
                  Number(selectedMedicine?.unit_price * quantity)
                )}`}
                variant='outlined'
                size='small'
                sx={{
                  fontSize: '13px',
                  height: '32px',
                  fontWeight: 400,
                  backgroundColor: 'customColors.Surface',
                  color: 'customColors.OnSurfaceVariant',
                  border: `0.5px solid ${theme.palette.primary.main} !important`
                }}
              />
            </Box>
          )}
        </Grid>

        {/* Priority Selection */}
        <Grid>
          <Typography
            sx={{
              mb: 3,
              mt: 1,
              fontSize: '16px',
              fontWeight: 500,
              color: 'customColors.customTextColorGray2'
            }}
          >
            Set Priority
          </Typography>
          <Grid
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              gap: 5,
              mt: 2
            }}
          >
            {/* Normal Priority */}
            <Button
              type='button'
              sx={getPriorityButtonStyle(
                'normal',
                theme.palette.primary.main,
                theme.palette.customColors.displaybgSecondary
              )}
              onClick={() => setValue('priority', 'normal')}
            >
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color:
                    priority === 'normal'
                      ? theme.palette.customColors.customHeadingTextColor
                      : theme.palette.customColors.neutral_50
                }}
              >
                Normal
              </Typography>
            </Button>

            {/* High Priority */}
            <Button
              type='button'
              sx={getPriorityButtonStyle(
                'high',
                theme.palette.customColors.TertiaryContainer,
                theme.palette.customColors.Tertiary
              )}
              onClick={() => setValue('priority', 'high')}
            >
              <img width={20} src='/images/HighPriority.png' alt='high priority' style={{ marginRight: '5px' }} />
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color:
                    priority === 'high'
                      ? theme.palette.customColors.customHeadingTextColor
                      : theme.palette.customColors.neutral_50
                }}
              >
                High
              </Typography>
            </Button>

            {/* Emergency Priority */}
            <Button
              type='button'
              sx={getPriorityButtonStyle(
                'emergency',
                theme.palette.customColors.TertiaryContainer,
                theme.palette.customColors.Error
              )}
              onClick={() => setValue('priority', 'emergency')}
            >
              <img
                width={20}
                src='/images/EmergencyPriority.png'
                alt='emergency priority'
                style={{ marginRight: '5px' }}
              />
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color:
                    priority === 'emergency'
                      ? theme.palette.customColors.customHeadingTextColor
                      : theme.palette.customColors.neutral_50
                }}
              >
                Emergency
              </Typography>
            </Button>
          </Grid>
          {errors.priority && (
            <Typography sx={{ color: 'error.main', fontSize: '12px', mt: 1 }}>{errors.priority.message}</Typography>
          )}
        </Grid>

        {/* Prescription Upload */}
        {(controlSubstance || prescriptionRequired) && (
          <Grid item size={{ xs: 12, sm: 12 }}>
            <Typography
              sx={{ mb: 2, mt: 2, fontSize: '16px', fontWeight: 500, color: 'customColors.customTextColorGray2' }}
            >
              Add prescription*
            </Typography>
            <ControlledFileUpload
              name='prescription_file'
              control={control}
              label='Add Prescription *'
              errors={errors}
              acceptFileTypes='.pdf,.jpeg,.jpg,.png'
            />
          </Grid>
        )}

        {/* Notes */}
        <Grid item size={{ xs: 12, sm: 12 }}>
          <Typography
            sx={{ mb: 2, mt: 2, fontSize: '16px', fontWeight: 500, color: 'customColors.customTextColorGray2' }}
          >
            Add Notes
          </Typography>
          <ControlledTextField name='notes' control={control} label='Notes' multiline rows={2} errors={errors} />
        </Grid>

        {/* Action Buttons */}
        <Grid item size={{ xs: 12 }}>
          <Box sx={{ float: 'right', mt: 4 }}>
            <Button sx={{ mr: 2 }} onClick={onClose} size='large' variant='outlined'>
              Cancel
            </Button>
            <Button type='submit' size='large' variant='contained'>
              {isEditMode ? 'Update' : 'Add'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

export default RequestItemsForm
