import { useEffect, useState, FC } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { LoadingButton } from '@mui/lab'
import { RadioGroup, FormLabel, FormControlLabel, Radio, Autocomplete, Button, Theme, useTheme } from '@mui/material'

// ** Form Validation
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'

// ** Icons
import Icon from 'src/@core/components/icon'

// Types and Interfaces
interface Option {
  label: string
  key: string
}

interface ListValue {
  order: number
  label: string
}

interface EditParams {
  assessment_type_id?: number | string | null
  assessment_name?: string | null
  status?: string
  description?: string | null
  response_type?: Option | null
  assessment_category_id?: number | string | null
  measurement_type?: string | null
  list_values?: ListValue[]
}

interface CategoryProps {
  assessment_category_id?: string | number | null
  label?: string | null
}

interface Payload {
  assessment_type_id?: number | string | null
  assessment_name?: string | null
  active?: number
  description?: string | null
  response_type?: string | null
  assessment_category_id?: number | string | null
  measurement_type?: string | null
  list_values?: ListValue[]
  ref_type?: string
}

interface FormValues {
  assessment_name: string
  description: string
  response_type: Option | null
  measurement_type: Option | null
  active: string
  assessment_type_id: string
  category_name: string
}

interface AddMonitorDrawerProps {
  addEventSidebarOpen: boolean
  handleSidebarClose: () => void
  handleSubmitData: (payload: Payload) => Promise<void>
  resetForm: boolean
  submitLoader: boolean
  editParams: EditParams
  responseTypeOption: Option[]
  category: CategoryProps
  measurementTypeOptions: Option[]
  drawerWidth?: number | string
}

// Validation Schema
const schema = yup.object().shape({
  assessment_name: yup.string().required('Monitoring Parameter Name is Required'),
  response_type: yup.object().nullable().required('Response Type is Required'),
  measurement_type: yup
    .object()
    .nullable()
    .when('response_type', {
      is: (value: Option | null) => value?.key === 'numeric_value',
      then: schema => schema.required('Measurement Type is Required'),
      otherwise: schema => schema.nullable()
    }),
  active: yup.string().required('Status is Required')
})

// Default Form Values
const defaultValues: FormValues = {
  assessment_name: '',
  description: '',
  response_type: null,
  measurement_type: null,
  active: 'active',
  assessment_type_id: '',
  category_name: ''
}

const AddMonitorDrawer: FC<AddMonitorDrawerProps> = ({
  addEventSidebarOpen,
  handleSidebarClose,
  handleSubmitData,
  resetForm,
  submitLoader,
  editParams,
  responseTypeOption,
  category,
  measurementTypeOptions,
  drawerWidth = 500
}) => {
  const theme: Theme = useTheme()

  const {
    reset,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onBlur'
  })

  const watchedResponseType = watch('response_type')

  const [listValues, setListValues] = useState<ListValue[]>([{ order: 1, label: '' }])

  const handleAddField = (): void => {
    const newOrder = listValues.length + 1
    setListValues([...listValues, { order: newOrder, label: '' }])
  }

  const handleDeleteField = (orderToDelete: number): void => {
    if (listValues.length > 1) {
      const filteredFields = listValues.filter(field => field.order !== orderToDelete)

      const reorderedFields = filteredFields.map((field, index) => ({
        ...field,
        order: index + 1
      }))

      setListValues(reorderedFields)
    }
  }

  const handleFieldChange = (order: number, newValue: string): void => {
    setListValues(listValues.map(field => (field.order === order ? { ...field, label: newValue } : field)))
  }

  const onSubmit = async (values: FormValues): Promise<void> => {
    const payload: Payload = {
      assessment_name: values.assessment_name,
      description: values.description,
      response_type: values.response_type?.key,
      active: values.active === 'active' ? 1 : 0,
      assessment_category_id: category.assessment_category_id,
      ref_type: 'animal',
      measurement_type: '',
      list_values: []
    }

    if (values.measurement_type?.key) {
      payload.measurement_type = values.measurement_type.key
    }

    if (watchedResponseType?.key === 'list' || watchedResponseType?.key === 'numeric_scale') {
      payload.list_values = listValues
    }

    if (editParams?.assessment_type_id) {
      payload.assessment_type_id = editParams.assessment_type_id
    }

    await handleSubmitData(payload)
  }

  // Reset form when resetForm prop changes (for add mode)
  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
      setListValues([{ order: 1, label: '' }])
    }
  }, [resetForm, reset])

  // Set form values when editing - only if not in reset mode
  useEffect(() => {
    if (editParams?.assessment_type_id && !resetForm) {
      const responseType = editParams.response_type
      const measurementType = editParams.measurement_type

      reset({
        category_name: category?.label || '',
        assessment_name: editParams?.assessment_name || '',
        assessment_type_id: editParams?.assessment_type_id?.toString() || '',
        description: editParams?.description || '',
        active: editParams?.status === '1' ? 'active' : 'inactive',
        response_type: responseType ? { label: responseType.label, key: responseType.key } : null,
        measurement_type: measurementType
          ? {
              label: measurementTypeOptions?.find(opt => opt.key === measurementType)?.label || measurementType,
              key: measurementType
            }
          : null
      })

      if (editParams.list_values && Array.isArray(editParams.list_values) && editParams.list_values.length > 0) {
        setListValues(
          editParams.list_values.map((item, index) => ({
            order: item.order || index + 1,
            label: item.label || ''
          }))
        )
      } else {
        setListValues([{ order: 1, label: '' }])
      }
    }
  }, [editParams, reset, category, measurementTypeOptions, resetForm])

  // Clear form when drawer closes
  useEffect(() => {
    if (!addEventSidebarOpen) {
      // Small delay to avoid flicker
      setTimeout(() => {
        reset(defaultValues)
        setListValues([{ order: 1, label: '' }])
      }, 300)
    }
  }, [addEventSidebarOpen, reset])

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', drawerWidth] } }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          p: '12px 24px',
          backgroundColor: theme.palette.customColors.displaybgPrimary
        }}
      >
        <Typography variant='h6'>{editParams?.assessment_type_id ? 'Edit' : 'Add'} Monitoring Parameter</Typography>
        <IconButton size='small' onClick={handleSidebarClose}>
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ p: 6 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Category Name (Disabled) */}
          <TextField label='Category Name' value={category?.label || ''} disabled fullWidth sx={{ mb: 6 }} />

          {/* Assessment Name */}
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='assessment_name'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label='Monitoring Parameter Name *'
                  placeholder='Enter Monitoring Parameter Name'
                  error={Boolean(errors.assessment_name)}
                  helperText={errors.assessment_name?.message}
                  fullWidth
                />
              )}
            />
          </FormControl>

          {/* Description */}
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='description'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label='Description'
                  placeholder='Enter Description'
                  multiline
                  rows={3}
                  fullWidth
                />
              )}
            />
          </FormControl>

          {/* Response Type */}
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='response_type'
              control={control}
              render={({ field: { value, onChange } }) => (
                <Autocomplete
                  disablePortal
                  options={responseTypeOption || []}
                  sx={{ width: '100%' }}
                  getOptionLabel={(option: Option) => option?.label || ''}
                  value={value}
                  onChange={(event, newValue) => {
                    onChange(newValue)
                    setListValues([{ order: 1, label: '' }])
                    setValue('measurement_type', null)
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label='Response Type *'
                      placeholder='Select Response Type'
                      error={Boolean(errors.response_type)}
                      helperText={errors.response_type?.message}
                    />
                  )}
                />
              )}
            />
          </FormControl>

          {/* Measurement Type (conditional) */}
          {watchedResponseType?.key === 'numeric_value' && (
            <FormControl fullWidth sx={{ mb: 6 }}>
              <Controller
                name='measurement_type'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Autocomplete
                    disablePortal
                    options={measurementTypeOptions || []}
                    sx={{ width: '100%' }}
                    getOptionLabel={(option: Option) => option?.label || ''}
                    value={value}
                    onChange={(event, newValue) => onChange(newValue)}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label='Measurement Type *'
                        placeholder='Select Measurement Type'
                        error={Boolean(errors.measurement_type)}
                        helperText={errors.measurement_type?.message}
                      />
                    )}
                  />
                )}
              />
            </FormControl>
          )}

          {/* List/Numeric Scale Items (conditional) */}
          {(watchedResponseType?.key === 'list' || watchedResponseType?.key === 'numeric_scale') && (
            <Box sx={{ mb: 4 }}>
              <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500 }}>
                {watchedResponseType?.key === 'list' ? 'List Items' : 'Numeric Scale Items'}
              </Typography>
              <Box sx={{ pt: 4, border: '1px solid #7676764d', py: 4, px: 2, borderRadius: '8px' }}>
                {listValues.map(field => (
                  <Box
                    key={field.order}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 2
                    }}
                  >
                    <Typography sx={{ minWidth: '20px', fontWeight: 500, pl: 1 }}>{field.order}.</Typography>

                    <TextField
                      fullWidth
                      size='small'
                      placeholder={`Enter ${watchedResponseType?.key === 'list' ? 'value' : 'scale item'}`}
                      value={field.label}
                      onChange={e => handleFieldChange(field.order, e.target.value)}
                    />

                    {listValues.length > 1 && (
                      <IconButton
                        size='small'
                        onClick={() => handleDeleteField(field.order)}
                        sx={{ color: 'error.main' }}
                      >
                        <Icon icon='mdi:close' fontSize={20} />
                      </IconButton>
                    )}
                  </Box>
                ))}

                <Button
                  variant='outlined'
                  startIcon={<Icon icon='mdi:plus' />}
                  onClick={handleAddField}
                  sx={{ mt: 2, ml: '27px' }}
                  size='medium'
                >
                  {watchedResponseType?.key === 'list' ? 'Add List Item' : 'Add Scale Item'}
                </Button>
              </Box>
            </Box>
          )}

          {/* Status - Only show for edit mode */}
          {editParams?.assessment_type_id ? (
            <FormControl fullWidth sx={{ mb: 6 }}>
              <FormLabel sx={{ mb: 1 }}>Status</FormLabel>
              <Controller
                name='active'
                control={control}
                render={({ field }) => (
                  <RadioGroup row {...field}>
                    <FormControlLabel value='active' control={<Radio />} label='Active' />
                    <FormControlLabel value='inactive' control={<Radio />} label='Inactive' />
                  </RadioGroup>
                )}
              />
              {errors.active && <FormHelperText sx={{ color: 'error.main' }}>{errors.active.message}</FormHelperText>}
            </FormControl>
          ) : (
            // Hidden field for add mode to satisfy validation
            <input type='hidden' {...control.register('active')} value='active' />
          )}

          {/* Submit Button */}
          <LoadingButton fullWidth size='large' type='submit' variant='contained' loading={submitLoader}>
            {editParams?.assessment_type_id ? 'Edit' : 'Add'} Monitoring Parameter
          </LoadingButton>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddMonitorDrawer
