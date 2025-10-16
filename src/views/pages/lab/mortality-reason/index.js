import { useCallback, useEffect, Fragment, useRef } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import { Box, Drawer, FormControl, FormHelperText, IconButton, TextField, Typography } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import { getMortalityReasonsById } from 'src/lib/api/lab/mortality'

const schema = yup.object().shape({
  name: yup.string().trim().required('Test mortality reason is required')
})

const defaultValues = {
  name: '',
  description: '',
  active: false
}

const AddMortalityReasons = props => {
  const inputRef = useRef()
  const { addEventSidebarOpen, setOpenDrawer, handleSubmitData, resetForm, submitLoader, editParams } = props

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const getMortalityReasonById = useCallback(
    async id => {
      const response = await getMortalityReasonsById(id)
      if (response?.is_success) {
        const data = {
          ...response.data?.result,
          name: response?.data?.name,
          description: response?.data?.description,
          active: response?.data?.active
        }
        reset(data)
      } else {
      }
    },
    [reset]
  )

  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
    }

    if (editParams?.id !== null) {
      getMortalityReasonById(editParams?.id)
    }
  }, [resetForm, editParams, reset, getMortalityReasonById])

  const onSubmit = async params => {
    const { name, description, active } = { ...params }

    const payload = {
      name

      // description,
      // active
    }

    await handleSubmitData(payload)
  }

  useEffect(() => {
    if (inputRef.current && control._formValues.name) {
      inputRef.current.focus()
    }
  }, [control._formValues.name])

  const RenderSidebarFooter = () => {
    return (
      <Fragment>
        <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader}>
          {editParams?.id ? 'Update' : 'Add'}
        </LoadingButton>
      </Fragment>
    )
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={addEventSidebarOpen}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] } }}
      >
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: 'background.default',
            p: theme => theme.spacing(3, 3.255, 3, 5.255)
          }}
        >
          <Typography variant='h6'>
            {editParams?.id !== null ? 'Edit Mortality Reason' : 'Add  Mortality Reason'}{' '}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size='small' onClick={() => setOpenDrawer(false)} sx={{ color: 'text.primary' }}>
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
        </Box>
        <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
          <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
            <FormControl fullWidth sx={{ mb: 6 }}>
              <Controller
                name='name'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    label='Reason*'
                    value={value}
                    inputRef={inputRef}
                    onChange={onChange}
                    placeholder='Reason'
                    error={Boolean(errors.name)}
                    name='name'
                  />
                )}
              />
              {errors.name && <FormHelperText sx={{ color: 'error.main' }}>{errors.name.message}</FormHelperText>}
            </FormControl>
            {/* <FormControl fullWidth sx={{ mb: 6 }}>
              <Controller
                name='description'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    label='Description'
                    value={value}
                    onChange={onChange}
                    placeholder='Description'
                    error={Boolean(errors.description)}
                    name='description'
                  />
                )}
              />
              {errors.description && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.description.message}</FormHelperText>
              )}
            </FormControl> */}

            {/* {editParams?.id !== null ? (
              <FormControl fullWidth sx={{ mb: 6 }} error={Boolean(errors.radio)}>
                <FormLabel>Status</FormLabel>
                <Controller
                  name='active'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <RadioGroup row {...field} name='validation-basic-radio'>
                      <FormControlLabel
                        value='1'
                        label='Active'
                        sx={errors.active ? { color: 'error.main' } : null}
                        control={<Radio sx={errors.active ? { color: 'error.main' } : null} />}
                      />
                      <FormControlLabel
                        value='0'
                        label='Inactive'
                        sx={errors.active ? { color: 'error.main' } : null}
                        control={<Radio sx={errors.active ? { color: 'error.main' } : null} />}
                      />
                    </RadioGroup>
                  )}
                />
                {errors.radio && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-radio'>
                    This field is required
                  </FormHelperText>
                )}
              </FormControl>
            ) : null} */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <RenderSidebarFooter />
            </Box>
          </form>
        </Box>
      </Drawer>
    </>
  )
}

export default AddMortalityReasons
