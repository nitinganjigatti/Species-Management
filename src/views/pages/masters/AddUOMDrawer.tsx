import { useEffect, useState, FC, useCallback } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Drawer from '@mui/material/Drawer'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { LoadingButton } from '@mui/lab'
import { alpha, Autocomplete, FormControl, TextField, Theme, useTheme } from '@mui/material'

// Form Validation
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useForm } from 'react-hook-form'

// Icons
import Icon from 'src/@core/components/icon'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import MUICheckbox from 'src/views/forms/form-fields/MUICheckbox'
import { getMeasurementBaseUOM } from 'src/lib/api/medical/masters'

// Types and Interfaces
interface MeasurementOption {
  label: string
  value: string
}

interface BaseUOMOption {
  label: string
  value: number | string
  uom_abbr?: string
}

interface EditParams {
  id?: number | string | null
  unit_name?: string | null
  uom_abbr?: string | null
  measurement_type?: string | null
  conversion_factor?: number | null
  same_base_uom?: boolean | null
  base_uom_option?: BaseUOMOption | null
}

interface Payload {
  id?: number | string | null
  unit_name?: string | null
  uom_abbr?: string | null
  measurement_type?: string | null
  conversion_factor?: number | null
  base_uom_id?: number | string | null
}

interface FormValues {
  unit_name: string
  uom_abbr: string
  measurement_type: MeasurementOption | null
  same_base_uom: boolean
  base_uom_option: BaseUOMOption | null
  conversion_factor: string
}

interface AddUOMDrawerProps {
  addEventSidebarOpen: boolean
  handleSidebarClose: () => void
  handleSubmitData: (payload: Payload) => Promise<void>
  resetForm: boolean
  submitLoader: boolean
  editParams: EditParams
  drawerWidth?: number | string
}

interface ApiResponse {
  success?: boolean
  data?: any[]
  message?: string
}

// Validation Schema
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

// Default Form Values
const defaultValues: FormValues = {
  unit_name: '',
  uom_abbr: '',
  same_base_uom: true,
  base_uom_option: null,
  conversion_factor: '',
  measurement_type: null
}

const AddUOMDrawer: FC<AddUOMDrawerProps> = ({
  addEventSidebarOpen,
  handleSidebarClose,
  handleSubmitData,
  resetForm,
  submitLoader,
  editParams,
  drawerWidth = 562
}) => {
  const theme: Theme = useTheme()
  const {
    reset,
    control,
    watch,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const [baseUomOptions, setBaseUomOptions] = useState<BaseUOMOption[]>([])

  const isSameBaseUOM = watch('same_base_uom')

  const measurementOptions: MeasurementOption[] = [
    { label: 'Weight', value: 'weight' },
    { label: 'Length', value: 'length' },
    { label: 'Temperature', value: 'temperature' }
  ]

  // Find selected measurement only when editing
  const selectedMeasurement = useCallback((): MeasurementOption | undefined => {
    if (!editParams?.id || !editParams?.measurement_type) return undefined
    return measurementOptions.find(item => item.value === editParams.measurement_type)
  }, [editParams?.id, editParams?.measurement_type])

  const onSubmit = async (values: FormValues): Promise<void> => {
    let base_uom_id: number | string | null = null

    if (!values.same_base_uom && values.base_uom_option) {
      base_uom_id = values.base_uom_option.value
    }

    const payload: Payload = {
      unit_name: values.unit_name,
      measurement_type: values.measurement_type?.value,
      uom_abbr: values.uom_abbr,
      conversion_factor: parseFloat(values.conversion_factor),
      base_uom_id: base_uom_id
    }

    if (editParams?.id) {
      payload.id = editParams.id
    }

    await handleSubmitData(payload)
  }

  const handleClose = () => {
    reset(defaultValues)
    setBaseUomOptions([])
    handleSidebarClose()
  }

  const fetchBaseUOM = async (measurementType: string): Promise<void> => {
    try {
      const res: ApiResponse = await getMeasurementBaseUOM({
        params: { measurement_type: measurementType }
      })
      if (res?.success && res?.data) {
        const formatted: BaseUOMOption[] = res.data.map(item => ({
          label: item.unit_name,
          value: item.id,
          uom_abbr: item.uom_abbr
        }))

        setBaseUomOptions(formatted)
      } else {
        setBaseUomOptions([])
      }
    } catch (error) {
      console.error('Error fetching base UOM:', error)
      setBaseUomOptions([])
    }
  }

  // Reset form when resetForm prop changes
  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
      setBaseUomOptions([])
    }
  }, [resetForm, reset])

  // Set form values only when editing (id exists)
  useEffect(() => {
    if (editParams?.id) {
      const measurementOption = selectedMeasurement()

      reset({
        unit_name: editParams.unit_name || '',
        uom_abbr: editParams.uom_abbr || '',
        same_base_uom: editParams.same_base_uom ?? true,
        base_uom_option: editParams.base_uom_option || null,
        conversion_factor: editParams.conversion_factor?.toString() || '',
        measurement_type: measurementOption || null
      })

      // Fetch base UOM options if measurement type exists and not same base UOM
      if (editParams.measurement_type && !editParams.same_base_uom) {
        fetchBaseUOM(editParams.measurement_type)
      }
    }
  }, [editParams?.id, reset, selectedMeasurement])

  // Clear form when drawer is closed
  useEffect(() => {
    if (!addEventSidebarOpen) {
      reset(defaultValues)
      setBaseUomOptions([])
    }
  }, [addEventSidebarOpen, reset])

  const title = editParams?.id ? 'Edit UOM' : 'Add UOM'

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
          <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='UOM Icon' />
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
              <Grid size={{ xs: 12 }}>
                <ControlledTextField
                  control={control}
                  errors={errors}
                  name='unit_name'
                  label='UOM Name*'
                  placeholder='Enter UOM Name'
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <ControlledTextField
                  control={control}
                  errors={errors}
                  name='uom_abbr'
                  label='Abbreviation*'
                  placeholder='Enter Abbreviation'
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <Controller
                    name='measurement_type'
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <Autocomplete
                        disablePortal
                        options={measurementOptions}
                        getOptionLabel={(option: MeasurementOption) => option?.label || ''}
                        value={value}
                        onChange={(event, newValue) => {
                          onChange(newValue)
                          if (newValue?.value) {
                            fetchBaseUOM(newValue.value)
                          } else {
                            setBaseUomOptions([])
                          }
                        }}
                        renderInput={params => (
                          <TextField
                            {...params}
                            label='Select Measurement Type*'
                            error={Boolean(errors.measurement_type)}
                            helperText={errors.measurement_type?.message}
                          />
                        )}
                      />
                    )}
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name='same_base_uom'
                  control={control}
                  render={({ field }) => (
                    <MUICheckbox
                      checked={!!field.value}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>, checked: boolean) =>
                        field.onChange(checked)
                      }
                      label='Same Base UOM'
                      gap={1}
                      checkboxStyle={{}}
                      labelStyle={{
                        fontSize: '16px',
                        fontWeight: 400,
                        color: 'rgba(76, 78, 100, 0.87)'
                      }}
                    />
                  )}
                />
              </Grid>

              {!isSameBaseUOM && (
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <Controller
                      name='base_uom_option'
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          disablePortal
                          options={baseUomOptions}
                          getOptionLabel={(option: BaseUOMOption) => option?.label || ''}
                          value={value}
                          onChange={(event, newValue) => {
                            onChange(newValue)
                          }}
                          isOptionEqualToValue={(option, value) => option.value === value?.value}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label='Select Base UOM*'
                              error={Boolean(errors.base_uom_option)}
                              helperText={errors.base_uom_option?.message}
                            />
                          )}
                        />
                      )}
                    />
                  </FormControl>
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <Controller
                    name='conversion_factor'
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label='Conversion Factor*'
                        placeholder='Enter Conversion Factor'
                        type='number'
                        error={Boolean(errors.conversion_factor)}
                        helperText={errors.conversion_factor?.message}
                      />
                    )}
                  />
                </FormControl>
              </Grid>
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

export default AddUOMDrawer
