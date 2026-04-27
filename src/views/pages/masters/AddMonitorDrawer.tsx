import { useEffect, useState, FC } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Drawer from '@mui/material/Drawer'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { LoadingButton } from '@mui/lab'
import {
  alpha,
  RadioGroup,
  FormLabel,
  FormControlLabel,
  Radio,
  Autocomplete,
  Button,
  Theme,
  useTheme
} from '@mui/material'

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
  drawerWidth = 562
}) => {
  const theme: Theme = useTheme()

  const {
    reset,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange'
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

  const handleClose = () => {
    reset(defaultValues)
    setListValues([{ order: 1, label: '' }])
    handleSidebarClose()
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
      setTimeout(() => {
        reset(defaultValues)
        setListValues([{ order: 1, label: '' }])
      }, 300)
    }
  }, [addEventSidebarOpen, reset])

  const title = editParams?.assessment_type_id ? 'Edit Monitoring Parameter' : 'Add Monitoring Parameter'

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', drawerWidth] } }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          position: 'sticky',
          top: 0,
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 6,
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          backgroundColor: theme.palette.customColors.OnPrimary,
          zIndex: 10
        }}
      >
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Monitor Icon' />
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {title}
          </Typography>
        </Box>

        <IconButton size='small' onClick={handleClose} sx={{ color: theme.palette.text.primary }}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      {/* Body */}
      <Box
        sx={{
          backgroundColor: theme.palette.background.default,
          p: 6,
          flexGrow: 1,
          pb: 16
        }}
      >
        <form autoComplete='off'>
          <Card sx={{ padding: 6, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
            <Grid container spacing={6}>
              {/* Category Name (Disabled) */}
              <Grid size={{ xs: 12 }}>
                <TextField label='Category Name' value={category?.label || ''} disabled fullWidth />
              </Grid>

              {/* Assessment Name */}
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
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
              </Grid>

              {/* Description */}
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
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
              </Grid>

              {/* Response Type */}
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <Controller
                    name='response_type'
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <Autocomplete
                        disablePortal
                        options={responseTypeOption || []}
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
              </Grid>

              {/* Measurement Type (conditional) */}
              {watchedResponseType?.key === 'numeric_value' && (
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <Controller
                      name='measurement_type'
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          disablePortal
                          options={measurementTypeOptions || []}
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
                </Grid>
              )}

              {/* List/Numeric Scale Items (conditional) */}
              {(watchedResponseType?.key === 'list' || watchedResponseType?.key === 'numeric_scale') && (
                <Grid size={{ xs: 12 }}>
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
                </Grid>
              )}

              {/* Status - Only show for edit mode */}
              {editParams?.assessment_type_id ? (
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
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
                    {errors.active && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.active.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              ) : (
                <input type='hidden' {...control.register('active')} value='active' />
              )}
            </Grid>
          </Card>
        </form>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 4,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          boxShadow: `0px -2px 6px ${alpha(theme.palette.customColors.deepDark as string, 0.1)}`,
          bottom: 0,
          position: 'sticky',
          zIndex: 1
        }}
      >
        <LoadingButton
          variant='contained'
          onClick={handleSubmit(onSubmit)}
          loading={submitLoader}
          sx={{ flex: 1, py: 4 }}
          disabled={!isValid || submitLoader}
        >
          {title}
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default AddMonitorDrawer
