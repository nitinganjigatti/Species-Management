import { useCallback, useEffect, useState } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import { Box, Drawer, FormControl, FormHelperText, IconButton, TextField, Typography, Button } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { getMortalityReasonsById } from 'src/lib/api/lab/mortality'

const schema = yup.object().shape({
  name: yup.string().trim().required('Test mortality reason is required')
})

const defaultValues = {
  name: ''
}

const AddMortalityReasons = props => {
  const theme = useTheme()
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
      console.log('add state comp', response)
      if (response?.is_success) {
        const data = {
          ...response.data?.result,
          name: response?.data?.name,
          description: response?.data?.description
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
    console.log(params, 'log')
    const { name } = { ...params }

    const payload = {
      name
    }
    console.log(payload, 'Submission Data')

    await handleSubmitData(payload)
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={addEventSidebarOpen}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '500px'] },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',

          gap: '24px'
        }}
      >
        <Box sx={{ backgroundColor: theme.palette.customColors.lightBg, width: '100%', height: '100%' }}>
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              p: theme => theme.spacing(3, 3.255, 3, 5.255),
              px: '24px',

              backgroundColor: theme.palette.customColors.lightBg
            }}
          >
            <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <Typography variant='h6'>
                {editParams?.id !== null ? `Edit Mortality Reason` : ` Add New Mortality Reason`}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={() => setOpenDrawer(false)} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} onClick={() => setOpenDrawer(false)} />
              </IconButton>
            </Box>
          </Box>

          <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
            <Box
              sx={{
                m: 5,
                px: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '2px',
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                maxHeight: '79vh',
                overflow: 'scroll'
              }}
            >
              <FormControl fullWidth sx={{ mt: 6 }}>
                <Controller
                  name='name'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label='Test Name*'
                      value={value}
                      onChange={onChange}
                      placeholder='Test Name'
                      error={Boolean(errors.name)}
                      name='name'
                    />
                  )}
                />
                {errors.name && <FormHelperText sx={{ color: 'error.main' }}>{errors.name.message}</FormHelperText>}
              </FormControl>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    position: 'relative',
                    right: 0,
                    height: '6rem',
                    width: '100%',
                    maxWidth: '500px',
                    position: 'fixed',
                    bottom: 0,
                    px: 4,
                    backgroundColor: 'white',
                    alignItems: 'center',
                    justifyContent: 'center',
                    display: 'flex',
                    zIndex: 1234,
                    gap: 2
                  }}
                >
                  <Button
                    fullWidth
                    onClick={() => setOpenDrawer(false)}
                    size='large'
                    type='reset'
                    color='error'
                    variant='outlined'
                  >
                    Cancel
                  </Button>
                  <LoadingButton fullWidth variant='contained' type='submit' size='large' loading={submitLoader}>
                    {editParams?.id !== null ? `Update` : `Submit`}
                  </LoadingButton>
                </Box>
              </Box>
            </Box>
          </form>
        </Box>
      </Drawer>
    </>
  )
}

export default AddMortalityReasons
