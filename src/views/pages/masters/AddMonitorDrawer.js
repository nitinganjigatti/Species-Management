import { useEffect, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { LoadingButton } from '@mui/lab'
import { RadioGroup, FormLabel, FormControlLabel, Radio, Autocomplete, Button } from '@mui/material'

// ** Form Validation
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'

// ** Icons
import Icon from 'src/@core/components/icon'

// Validation Schema
const schema = yup.object().shape({
  assessment_name: yup.string().required('Assessment Name is Required'),
  response_type: yup.object().required('Response Type is Required'),
  measurement_type: yup.object().when('response_type', {
    is: value => value?.key === 'numeric_value',
    then: () => yup.object().required('Measurement Type is Required'),
    otherwise: () => yup.object().nullable()
  }),
  active: yup.string().required('Status is Required')
})

// Default Form Values
const defaultValues = {
  assessment_name: '',
  description: '',
  response_type: null,
  measurement_type: null,
  active: 'active',
  assessment_type_id: '',
  category_name: ''
}

const AddMonitorDrawer = ({
  addEventSidebarOpen,
  handleSidebarClose,
  handleSubmitData,
  resetForm,
  submitLoader,
  editParams,
  responseTypeOption,
  category,
  measurementTypeOptions
}) => {
  const {
    reset,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onBlur'
  })

  const watchedResponseType = watch('response_type')

  const [listValues, setListValues] = useState([{ order: 1, label: '' }])

  const handleAddField = () => {
    const newOrder = listValues.length + 1
    setListValues([...listValues, { order: newOrder, label: '' }])
  }

  const handleDeleteField = orderToDelete => {
    if (listValues.length > 1) {
      const filteredFields = listValues.filter(field => field.order !== orderToDelete)

      const reorderedFields = filteredFields.map((field, index) => ({
        ...field,
        order: index + 1
      }))

      setListValues(reorderedFields)
    }
  }

  const handleFieldChange = (order, newValue) => {
    setListValues(listValues.map(field => (field.order === order ? { ...field, label: newValue } : field)))
  }

  const onSubmit = async values => {
    const payload = {
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

  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
      setListValues([{ order: 1, label: '' }])
    }

    if (editParams?.assessment_type_id) {
      const responseType = editParams.response_type
      const measurementType = editParams.measurement_type
      reset({
        category_name: category?.label,
        assessment_name: editParams?.assessment_name || '',
        assessment_type_id: editParams?.assessment_type_id || '',
        description: editParams?.description || '',
        active: editParams?.active === '1' ? 'active' : 'inactive',
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
  }, [resetForm, editParams, reset, category, measurementTypeOptions])

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] } }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 4 }}>
        <Typography variant='h6'>
          {editParams?.assessment_type_id ? 'Edit' : 'Add'} {category?.label}
        </Typography>
        <IconButton size='small' onClick={handleSidebarClose}>
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Box>
      <Box sx={{ p: 6 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField label='Category Name' value={category?.label || ''} disabled fullWidth sx={{ mb: 6 }} />
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='assessment_name'
              control={control}
              render={({ field }) => (
                <TextField {...field} label='Assessment Name*' error={Boolean(errors.assessment_name)} />
              )}
            />
            {errors.assessment_name && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors.assessment_name.message}</FormHelperText>
            )}
          </FormControl>
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='description'
              control={control}
              render={({ field }) => <TextField {...field} label='Description' />}
            />
          </FormControl>
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='response_type'
              control={control}
              render={({ field: { value, onChange } }) => (
                <Autocomplete
                  disablePortal
                  options={responseTypeOption || []}
                  sx={{ width: '100%' }}
                  getOptionLabel={option => option?.label || ''}
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
                      error={Boolean(errors.response_type)}
                      helperText={errors.response_type?.message}
                    />
                  )}
                />
              )}
            />
          </FormControl>
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
                    getOptionLabel={option => option?.label || ''}
                    value={value}
                    onChange={(event, newValue) => onChange(newValue)}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label='Measurement Type *'
                        error={Boolean(errors.measurement_type)}
                        helperText={errors.measurement_type?.message}
                      />
                    )}
                  />
                )}
              />
            </FormControl>
          )}

          {(watchedResponseType?.key === 'list' || watchedResponseType?.key === 'numeric_scale') && (
            <Box sx={{ mb: 4 }}>
              <Typography variant='subtitle1' sx={{ mb: 2 }}>
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
                      placeholder='Enter value'
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
                  {watchedResponseType?.key === 'list' ? 'Add List Items' : 'Add Numeric Item'}
                </Button>
              </Box>
            </Box>
          )}

          {editParams?.assessment_type_id && (
            <FormControl fullWidth sx={{ mb: 6 }}>
              <FormLabel>Status</FormLabel>
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
          )}

          <LoadingButton fullWidth size='large' type='submit' variant='contained' loading={submitLoader}>
            Submit
          </LoadingButton>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddMonitorDrawer
