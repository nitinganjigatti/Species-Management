import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Drawer,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Card,
  Autocomplete
} from '@mui/material'
import { useContext, useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'

import Icon from 'src/@core/components/icon'
import { AuthContext } from 'src/context/AuthContext'
import { useTheme } from '@mui/material/styles'
import Toaster from 'src/components/Toaster'
import { EditEgg } from 'src/lib/api/egg/egg'

const EditEggInfo = ({ egg_id, closeEditDrawer, egg_number, getDetails }) => {
  // console.log(egg_number)
  const [loader, setLoader] = useState(false)
  const authData = useContext(AuthContext)

  const schema = yup.object().shape({
    egg_number: yup
      .string()
      .required('Egg number is required')
      .trim()
      .strict(true)
      .min(1, 'Egg number is required')
      .matches(/^[a-zA-Z0-9]*$/, 'Egg number can only contain alphabets and alphanumeric values')
  })

  const defaultValues = {
    egg_number: ''
  }

  useEffect(() => {
    debugger
    if (egg_number !== null) {
      reset({
        egg_number: egg_number
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
      egg_id: egg_id,
      egg_no: values.egg_number
    }

    try {
      setLoader(true)
      const response = await EditEgg(payload)
      if (response.success) {
        debugger
        getDetails(egg_id)
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
      console.log(e)
    }
  }

  return (
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
          {/* <LoadingButton fullWidth variant='outlined' size='large' onClick={handleCancel}>
            CANCEL
          </LoadingButton> */}
          <LoadingButton disabled={loader} fullWidth variant='contained' loader={loader} type='submit' size='large'>
            SUBMIT
          </LoadingButton>
        </Box>
      </form>
    </Box>
  )
}

export default EditEggInfo
