import { useEffect, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { LoadingButton } from '@mui/lab'
import { Autocomplete, FormControl, TextField } from '@mui/material'

// Form Validation
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useForm } from 'react-hook-form'

// Icons
import Icon from 'src/@core/components/icon'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import MUICheckbox from 'src/views/forms/form-fields/MUICheckbox'
import { getMeasurementBaseUOM } from 'src/lib/api/medical/masters'

const schema = yup.object().shape({
  unit_name: yup.string().required('UOM Name is Required'),
  uom_abbr: yup.string().required('Abbreviation is Required'),
  measurement_type: yup.object().nullable().required('Measurement Type is Required'),

  conversion_factor: yup
    .number()
    .typeError('Conversion Factor must be a number')
    .required('Conversion Factor is Required'),

  base_uom_option: yup
    .object()
    .nullable()
    .when('same_base_uom', {
      is: false,
      then: schema => schema.required('Base UOM is Required'),
      otherwise: schema => schema.nullable()
    })
})

const defaultValues = {
  unit_name: '',
  uom_abbr: '',
  same_base_uom: true,
  base_uom_option: null,
  conversion_factor: '',
  measurement_type: null
}

const AddUOMDrawer = ({
  addEventSidebarOpen,
  handleSidebarClose,
  handleSubmitData,
  resetForm,
  submitLoader,
  editParams
}) => {
  const {
    reset,
    control,
    watch,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onBlur'
  })

  const [baseUomOptions, setBaseUomOptions] = useState([])

  const isSameBaseUOM = watch('same_base_uom')

  const measurementOptions = [
    { label: 'Weight', value: 'weight' },
    { label: 'Length', value: 'length' },
    { label: 'Temperature', value: 'temperature' }
  ]

  const selectedMeasurement = measurementOptions.find(item => item.value === editParams?.measurement_type)

  const onSubmit = async values => {
    let base_uom_id = null

    if (!values.same_base_uom) {
      base_uom_id = values.base_uom_option?.value || null
    }

    const payload = {
      unit_name: values.unit_name,
      measurement_type: values?.measurement_type.value,
      uom_abbr: values.uom_abbr,
      conversion_factor: values.conversion_factor,
      base_uom_id: base_uom_id
    }
    {
      if (editParams?.id) {
        payload.id = editParams.id
      }
    }
    await handleSubmitData(payload)
  }

  const fetchBaseUOM = async measurementType => {
    try {
      const res = await getMeasurementBaseUOM({
        params: { measurement_type: measurementType }
      })
      if (res?.success) {
        const formatted = res.data.map(item => ({
          label: item.unit_name,
          value: item.id,
          uom_abbr: item.uom_abbr
        }))

        setBaseUomOptions(formatted)
      } else {
        setBaseUomOptions([])
      }
    } catch (error) {
      console.log(error)
      setBaseUomOptions([])
    }
  }

  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
    }

    if (editParams?.id) {
      reset({
        unit_name: editParams?.unit_name || '',
        uom_abbr: editParams?.uom_abbr || '',
        same_base_uom: editParams?.same_base_uom ?? true,
        base_uom_option: editParams?.base_uom_option || null,
        conversion_factor: editParams?.conversion_factor || '',
        measurement_type: selectedMeasurement || null
      })
    }
  }, [resetForm, editParams, reset])

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] } }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 4 }}>
        <Typography variant='h6'>{editParams?.id ? 'Edit' : 'Add'} UOM</Typography>

        <IconButton size='small' onClick={handleSidebarClose}>
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Box>

      <Box sx={{ p: 6 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ControlledTextField
            sx={{ mb: 6 }}
            name='unit_name'
            label='UOM Name'
            control={control}
            placeholder='UOM Name'
            error={Boolean(errors.unit_name)}
          />

          <ControlledTextField
            sx={{ mb: 6 }}
            name='uom_abbr'
            control={control}
            label='Abbreviation'
            placeholder='Abbreviation'
            error={Boolean(errors.uom_abbr)}
          />
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='measurement_type'
              control={control}
              render={({ field: { value, onChange } }) => (
                <Autocomplete
                  disablePortal
                  options={measurementOptions}
                  getOptionLabel={option => option?.label || ''}
                  value={value}
                  onChange={(event, newValue) => {
                    onChange(newValue)

                    if (newValue?.value) {
                      fetchBaseUOM(newValue.value)
                    }
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label='Select Measurement Type'
                      error={Boolean(errors.measurement_type)}
                      helperText={errors.measurement_type?.message}
                    />
                  )}
                />
              )}
            />
          </FormControl>

          <Controller
            name='same_base_uom'
            error={Boolean(errors.base_uom_option)}
            helperText={errors.base_uom_option?.message}
            control={control}
            render={({ field }) => (
              <MUICheckbox
                checked={!!field.value}
                sx={{ mb: 5 }}
                onChange={(_, checked) => field.onChange(checked)}
                label='Same Base UOM'
                labelStyle={{
                  fontSize: '16px',
                  fontWeight: 400,
                  color: 'rgba(76, 78, 100, 0.87)'
                }}
              />
            )}
          />

          {!isSameBaseUOM && (
            <FormControl fullWidth sx={{ mb: 6 }}>
              <Controller
                name='base_uom_option'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Autocomplete
                    disablePortal
                    options={baseUomOptions}
                    getOptionLabel={option => option?.label || ''}
                    value={value}
                    onChange={(event, newValue) => {
                      onChange(newValue)
                    }}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label='Select Base UOM'
                        error={Boolean(errors.base_uom_option)}
                        helperText={errors.base_uom_option?.message}
                      />
                    )}
                  />
                )}
              />
            </FormControl>
          )}
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='conversion_factor'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label='Conversion Factor'
                  placeholder='Conversion Factor'
                  type='number'
                  error={Boolean(errors.conversion_factor)}
                  helperText={errors.conversion_factor?.message}
                />
              )}
            />
          </FormControl>

          <LoadingButton fullWidth size='large' type='submit' variant='contained' loading={submitLoader}>
            Submit
          </LoadingButton>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddUOMDrawer
