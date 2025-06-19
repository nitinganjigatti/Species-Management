import { useEffect, useState } from 'react'

import { Box, Drawer, FormControl, FormHelperText, IconButton, TextField, Typography } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useTheme } from '@mui/material/styles'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'

import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import { EditEgg } from 'src/lib/api/egg/egg'

const EditEggInfo = ({ eggDetails, openEditDrawer, closeEditDrawer, getDetails }) => {
  const [loader, setLoader] = useState(false)
  const theme = useTheme()

  const schema = yup.object().shape({
    egg_number: yup.string().required('Egg number is required').min(1, 'Egg number is required')
  })

  const defaultValues = {
    egg_number: ''
  }

  useEffect(() => {
    debugger
    if (eggDetails?.egg_number !== null) {
      reset({
        egg_number: eggDetails?.egg_number
      })
    }
  }, [])

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const onSubmit = async values => {
    const payload = {
      egg_id: eggDetails?.egg_id,
      egg_no: values?.egg_number?.trim()
    }

    try {
      setLoader(true)
      const response = await EditEgg(payload)
      if (response.success) {
        debugger
        getDetails(eggDetails?.egg_id)
        setLoader(false)
        reset()

        closeEditDrawer()
        Toaster({ type: 'success', message: response.message })
      } else {
        setLoader(false)
        Toaster({ type: 'error', message: response.message })
      }
    } catch (e) {
      setLoader(false)
      console.error(e)
    }
  }

  return (
    <Drawer
      anchor='right'
      open={openEditDrawer}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'] },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}
    >
      <Box sx={{ bgcolor: theme.palette.customColors.lightBg, width: '100%', height: '100%', overflowY: 'auto' }}>
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: theme => theme.spacing(3, 3.255, 3, 5.255),
            px: '24px'
          }}
        >
          <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <Icon
              style={{ marginLeft: -8 }}
              icon='material-symbols-light:add-comment-outline-rounded'
              fontSize={'32px'}
            />
            <Typography variant='h6'>
              {eggDetails?.egg_number !== null ? 'Edit Egg Identifier' : 'Add Egg Identifier'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size='small' onClick={() => closeEditDrawer()} sx={{ color: 'text.primary' }}>
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
        </Box>

        <Box>
          <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
            <Box
              sx={{
                px: '16px',
                py: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}
            >
              <FormControl fullWidth>
                <Controller
                  name='egg_number'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label='Egg Identifier*'
                      value={value}
                      onChange={onChange}
                      focused={value !== ''}
                      placeholder='Egg Identifier'
                      error={Boolean(errors.egg_number)}
                      name='egg_number'
                    />
                  )}
                />
                {errors?.egg_number && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.egg_number?.message}</FormHelperText>
                )}
              </FormControl>
            </Box>
            <Box
              sx={{
                height: '122px',
                width: '100%',
                maxWidth: '562px',
                position: 'fixed',
                bottom: 0,
                px: 4,
                bgcolor: 'white',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                display: 'flex',
                zIndex: 123
              }}
            >
              <LoadingButton disabled={loader} fullWidth variant='contained' loader={loader} type='submit' size='large'>
                SUBMIT
              </LoadingButton>
            </Box>
          </form>
        </Box>
      </Box>
    </Drawer>
  )
}

export default EditEggInfo
