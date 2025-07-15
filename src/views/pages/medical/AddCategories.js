import { useEffect, useState } from 'react'
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
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import { useTheme } from '@mui/material/styles'
import Toaster from 'src/components/Toaster'
import { addMedicalCategory } from 'src/lib/api/medical/masters'

const schema = yup.object().shape({
  label_name: yup.string().trim().required('Label is required')
})

const AddCategories = props => {
  const { openDrawer, setOpenDrawer, editParams, resetForm, handleSubmitData, loading, type } = props
  const theme = useTheme()

  const defaultValues = {
    label_name: ''
  }

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

  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
    }
    if (editParams.med_cat_id !== null) {
      setValue('label_name', editParams.label)
    }
  }, [editParams, resetForm, reset])

  const onSubmit = async params => {
    console.log(params)

    const payload = {
      label: params?.label_name
    }
    console.log(payload)
    await handleSubmitData(payload)
  }

  const title = type === 'complaints' ? 'Complaints' : type === 'diagnosis' ? 'Diagnosis' : 'Category'

  return (
    <>
      <Drawer
        anchor='right'
        open={openDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '550px'] },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',

          gap: '24px'
        }}
      >
        <Box sx={{ bgcolor: theme.palette.customColors.lightBg, width: '100%', height: '100%' }}>
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
              <Typography variant='h6'>{editParams?.med_cat_id !== null ? `Edit ${title}` : `Add ${title}`}</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={() => setOpenDrawer(false)} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} onClick={() => setOpenDrawer(false)} />
              </IconButton>
            </Box>
          </Box>

          {/* drower */}

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
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)'
              }}
            >
              <FormControl fullWidth sx={{ mt: 6 }}>
                <Controller
                  name='label_name'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label='Label*'
                      value={value}
                      onChange={onChange}
                      placeholder='Label'
                      error={Boolean(errors.label_name)}
                      name='label_name'
                    />
                  )}
                />
                {errors.label_name && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.label_name.message}</FormHelperText>
                )}
              </FormControl>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    position: 'relative',
                    right: 0,
                    height: '122px',
                    width: '100%',
                    maxWidth: '550px',
                    position: 'fixed',
                    bottom: 0,
                    px: 4,
                    bgcolor: 'white',
                    alignItems: 'center',
                    justifyContent: 'center',
                    display: 'flex',
                    zIndex: 1234
                  }}
                >
                  <LoadingButton fullWidth variant='contained' type='submit' size='large' loading={loading}>
                    {editParams?.med_cat_id !== null ? `Update ${title}` : `Add ${title}`}
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

export default AddCategories
