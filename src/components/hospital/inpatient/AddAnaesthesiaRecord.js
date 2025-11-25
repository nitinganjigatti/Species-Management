import { Card, Drawer, IconButton, Typography } from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { LoadingButton } from '@mui/lab'

import BasicDetails from './Anesthesia/BasicDetails'

const anaesthesiaSchema = yup.object().shape({})

const defaultValues = {
  basicDetails: {
    location: '',
    anaesthesia_datetime: '',
    estimated_time_required: '',
    estimated_time_unit: 'hr',
    veterinarian_id: '',
    anesthetist_id: '',
    selected: [],
    custom: [],
    notes: ''
  }
}

const AddAnaesthesiaRecordDrawer = ({ openAddAnaesthesiaDrawer, setOpenAddAnaesthesiaDrawer }) => {
  const theme = useTheme()

  const methods = useForm({
    defaultValues,
    resolver: yupResolver(anaesthesiaSchema),
    mode: 'onChange'
  })

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = methods

  const onSubmit = data => {
    console.log('Anaesthesia basic details:', data)
  }

  useEffect(() => {
    if (!openAddAnaesthesiaDrawer) {
      reset(defaultValues)
    }
  }, [openAddAnaesthesiaDrawer, reset])

  return (
    <Drawer
      anchor='right'
      open={openAddAnaesthesiaDrawer}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '920px'], height: '100vh' },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: 'background.default'
      }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: theme => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center', maxHight: '80px' }}>
          <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Filter Icon' />
          <Typography sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            Add anaesthesia
          </Typography>
        </Box>
        <IconButton size='small' sx={{ color: 'text.primary' }} onClick={() => setOpenAddAnaesthesiaDrawer(false)}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      <Box sx={{ p: '24px', backgroundColor: 'background.default', height: '100vh', overflowY: 'auto' }}>
        <FormProvider {...methods}>
          <Card
            component='form'
            onSubmit={handleSubmit(onSubmit)}
            sx={{
              backgroundColor: theme.palette.primary.contrastText,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'none',
              gap: '24px',
              border: `1px solid ${theme.palette.customColors.customTableBorderBg}`
            }}
          >
            <BasicDetails vetOptions={[]} anesthetistOptions={[]} purposeOptions={[]} />
            <LoadingButton
              type='submit'
              variant='contained'
              loading={isSubmitting}
              sx={{ mt: 3, height: '56px', borderRadius: '8px', fontWeight: 600, letterSpacing: '0.5px' }}
            >
              Submit
            </LoadingButton>
          </Card>
        </FormProvider>
      </Box>
    </Drawer>
  )
}

export default AddAnaesthesiaRecordDrawer
