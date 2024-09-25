import { useContext, useEffect, useState } from 'react'
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Drawer,
  FormControl,
  FormHelperText,
  IconButton,
  TextField,
  Typography,
  Autocomplete
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import { AuthContext } from 'src/context/AuthContext'
import { AddNursery, UpdateNursery } from 'src/lib/api/egg/nursery'

const defaultValues = {
  nursery_name: '',
  site_id: ''
}

const schema = yup.object().shape({
  nursery_name: yup.string().trim().required('Nursery name is required'),
  site_id: yup.string().required('Site is required')
})

const NurseryAddComponent = ({
  openDrawer,
  setOpenDrawer,
  loading,
  editNurseryId,
  editName,
  editSite,
  editSiteName,
  callApi,
  fetchTableData
}) => {
  const [defaultSite, setDefaultSite] = useState(null)
  const [loader, setLoader] = useState(null)
  const authData = useContext(AuthContext)
  const theme = useTheme()

  const {
    control,
    handleSubmit,
    getValues,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const RenderSidebarFooter = () => {
    return (
      <Box
        sx={{
          position: 'relative',
          right: 0,
          height: '122px',
          width: '100%',
          maxWidth: '562px',
          position: 'fixed',
          bottom: 0,
          px: 4,
          py: '24px',
          bgcolor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          display: 'flex',
          zIndex: 1234
        }}
      >
        <LoadingButton
          sx={{ height: '58px' }}
          fullWidth
          disabled={loader || watch('nursery_name') === '' || watch('site_id') === ''}
          variant='contained'
          type='submit'
          size='large'
          loading={loading}
        >
          {editNurseryId ? 'Update Nursery' : 'Add Nursery'}
        </LoadingButton>
      </Box>
    )
  }

  useEffect(() => {
    if (editNurseryId) {
      setValue('nursery_name', editName)
      setValue('site_id', editSite)
      if (editSite && editSiteName) {
        setDefaultSite({ site_name: editSiteName, site_id: editSite })
      }
    }
  }, [editNurseryId, editName, editSite, editSiteName, setValue])

  const onSubmit = async values => {
    try {
      setLoader(true)
      const payload = {
        nursery_name: values.nursery_name,
        site_id: values.site_id
      }
      const response = editNurseryId ? await UpdateNursery(editNurseryId, payload) : await AddNursery(payload)

      setLoader(false)
      setOpenDrawer(false)

      if (fetchTableData) fetchTableData()
      if (callApi) callApi()

      Toaster({
        type: response.success ? 'success' : 'error',
        message: response.message || (editNurseryId ? 'Nursery updated successfully' : 'Nursery added successfully')
      })
    } catch (error) {
      setLoader(false)
      console.error('Error while adding/updating nursery:', error)
      Toaster({ type: 'error', message: 'An error occurred while adding/updating nursery' })
    }
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={openDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',

          gap: '24px'
        }}
      >
        <Box
          sx={{
            bgcolor: theme.palette.customColors.lightBg,
            width: '100%',
            height: '100%'
          }}
        >
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
              <Typography variant='h6'>{editNurseryId ? 'Edit Nursery' : 'Add Nursery'}</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={() => setOpenDrawer(false)} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          </Box>

          {/* drower */}
          <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
            <Box
              sx={{
                m: '20px',
                px: '16px',
                py: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: 1,
                borderColor: '#c3cec7'
              }}
            >
              <FormControl fullWidth>
                <Controller
                  name='nursery_name'
                  control={control}
                  rules={{ required: !editNurseryId }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label='Nursery Name*'
                      value={value}
                      onChange={onChange}
                      focused={value !== ''}
                      placeholder='Nursery Name'
                      error={Boolean(errors.nursery_name)}
                      name='nursery_name'
                    />
                  )}
                />
                {errors?.nursery_name && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.nursery_name?.message}</FormHelperText>
                )}
              </FormControl>

              {/* {authData?.userData?.user?.zoos[0]?.sites.length > 0 && ( */}
              <FormControl fullWidth>
                <Controller
                  name='site_id'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Autocomplete
                      name='site_id'
                      value={defaultSite}
                      disablePortal
                      id='site_id'
                      options={authData?.userData?.user?.zoos[0].sites}
                      getOptionLabel={option => option.site_name}
                      isOptionEqualToValue={(option, value) => option?.site_id === value?.site_id}
                      onChange={(e, val) => {
                        if (val === null) {
                          setDefaultSite(null)

                          return onChange('')
                        } else {
                          setDefaultSite(val)
                          setValue('site_id', '')

                          return onChange(val.site_id)
                        }
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label='Site *'
                          placeholder='Search & Select'
                          error={Boolean(errors.site_id)}
                        />
                      )}
                    />
                  )}
                />
                {errors && <FormHelperText sx={{ color: 'error.main' }}>{errors?.site_id?.message}</FormHelperText>}
              </FormControl>
              {/* )} */}

              <RenderSidebarFooter />
            </Box>
          </form>
        </Box>
      </Drawer>
    </>
  )
}

export default NurseryAddComponent
