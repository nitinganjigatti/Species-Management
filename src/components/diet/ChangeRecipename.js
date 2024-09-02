import { Box, Drawer, FormControl, FormHelperText, Grid, IconButton, TextField, Typography } from '@mui/material'
import React, { useEffect, Fragment } from 'react'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Router from 'next/router'
import { useRouter } from 'next/router'
import { Controller, useForm } from 'react-hook-form'
import { LoadingButton } from '@mui/lab'
import Toaster from 'src/components/Toaster'

const schema = yup.object().shape({
  label: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .required('Recipe Name is Required')
})

const defaultValues = {
  label: ''
}

const ChangeRecipeName = ({ isOpen, setIsOpen, recipeid, recipename }) => {
  const theme = useTheme()
  const router = useRouter()
  const handelClose = () => {
    setIsOpen(false)
  }

  const {
    reset,
    control,
    setValue,
    watch,
    getValues,
    clearErrors,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  useEffect(() => {
    if (recipename) {
      setValue('label', recipename + ' copy')
    }
  }, [recipename, setValue, isOpen])

  const onSubmit = () => {
    const updatedRecipeName = getValues('label')

    // Check if the updated recipe name is the same as the original recipe name
    if (updatedRecipeName === recipename) {
      Toaster({ type: 'error', message: 'Recipe name should be unique. Please enter a different name.' })

      return
    }
    Router.push({
      pathname: '/diet/recipe/add-recipe',
      query: { id: recipeid, action: 'copy', name: updatedRecipeName }
    })
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={isOpen}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        <Box sx={{ bgcolor: theme.palette.customColors.lightBg, width: '100%' }}>
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              p: theme => theme.spacing(3, 3.255, 3, 5.255),
              px: '24px',

              bgcolor: theme.palette.customColors.lightBg
            }}
          >
            <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <Icon
                style={{ marginLeft: -8 }}
                icon='material-symbols-light:add-notes-outline-rounded'
                fontSize={'32px'}
              />
              <Typography variant='h6'>Update Recipe Name</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={() => handelClose()} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          </Box>
        </Box>
        <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
          <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
            <FormControl fullWidth sx={{ mb: 6 }}>
              <Controller
                name='label'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    label='Recipe Name'
                    value={value}
                    onChange={onChange}
                    focused={value !== ''}
                    placeholder='Recipe Name'
                    error={Boolean(errors.label)}
                    name='label'
                  />
                )}
              />
              {errors.label && <FormHelperText sx={{ color: 'error.main' }}>{errors.label.message}</FormHelperText>}
            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Fragment>
                <LoadingButton disabled={watch('label') === ''} size='large' type='submit' variant='contained'>
                  Update
                </LoadingButton>
              </Fragment>
            </Box>
          </form>
        </Box>
      </Drawer>
    </>
  )
}

export default ChangeRecipeName
