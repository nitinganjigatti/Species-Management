import {
  Autocomplete,
  Avatar,
  Card,
  Checkbox,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  TextField,
  Typography
} from '@mui/material'
import { border, borderRadius, borderRight, Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { LoadingButton } from '@mui/lab'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

// Form validation schema
const anaesthesiaSchema = yup.object().shape({
  anaesthesia: yup.object().nullable(),
  date: yup.date().nullable(),
  notes: yup.string().optional(),
  type: yup.string().optional(),
  duration: yup.number().optional(),
  dosage: yup.string().optional()
})

// Default form values
const defaultValues = {
  anaesthesia: null,
  date: null,
  notes: '',
  type: '',
  duration: '',
  dosage: ''
}

const AddAnaesthesiaRecordDrawer = ({ openAddAnaesthesiaDrawer, setOpenAddAnaesthesiaDrawer }) => {
  const theme = useTheme()

  // Form setup with validation and default values
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues,
    resolver: yupResolver(anaesthesiaSchema),
    mode: 'onChange'
  })

  // const [searchValue, setSearchValue] = useState('')
  // const [tempSelectedSites, setTempSelectedSites] = useState([])

  // Form submission handler
  const onSubmit = data => {
    console.log('Form submitted:', data)

    // Handle form submission here
    // You can add API call here
  }

  // Reset form when drawer closes
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
        '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
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

      <Box sx={{ p: '24px', backgroundColor: 'background.default', height: '100vh' }}>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 400,
                letterSpacing: 0,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              Select existing anaesthesia
            </Typography>

            {/* <Autocomplete /> */}
            <ControlledAutocomplete
              name='anaesthesia'
              control={control}
              errors={errors}
              label='Select'
              options={[]}
              // Add your anaesthesia options here
              loading={false}
              // Add loading state if needed
              required={false}
              fullWidth={true}
              getOptionLabel={option => option.name || option.label || ''}
              isOptionEqualToValue={(option, value) => option.id === value?.id || option.value === value?.value}
              onChangeOverride={value => {
                console.log('Selected anaesthesia:', value)
              }}
              onItemClear={() => {
                console.log('Anaesthesia cleared')
              }}
              textFieldProps={{
                placeholder: 'Search anaesthesia records...',
                sx: {
                  '& .MuiOutlinedInput-root': {
                    height: '56px',
                    borderRadius: '4px',
                    borderWidth: '1px',
                    paddingRight: '12px',
                    paddingLeft: '12px',
                    // border: '1px solid #C3CEC7',
                    '&.Mui-focused': {
                      border: 'none'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: theme.palette.customColors.Outline
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: theme.palette.primary.main
                  }
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px'
                }
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 400,
                letterSpacing: 0,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              Recent anaesthesia
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                height: '40px',
                borderRadius: '4px',
                backgroundColor: theme.palette.customColors.mdAntzNeutral
              }}
            >
              <Typography
                sx={{
                  paddingRight: '12px',
                  borderRight: `1px solid ${theme.palette.customColors.Outline}`,
                  fontSize: '16px',
                  fontWeight: 400,
                  letterSpacing: 0,
                  color: theme.palette.primary.deepDark
                }}
              >
                AN123466
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Avatar
                  variant='square'
                  src='/icons/calendar.svg'
                  sx={{ height: '20px', width: '20px', objectFit: 'cover' }}
                />
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: 400,
                    letterSpacing: 0,
                    color: theme.palette.primary.deepDark
                  }}
                >
                  1 APR 2024
                </Typography>
              </Box>
            </Box>
          </Box>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 400,
              letterSpacing: 0,
              color: theme.palette.customColors.Outline,
              textAlign: 'center'
            }}
          >
            or
          </Typography>

          <LoadingButton
            type='submit'
            loading={isSubmitting}
            disabled={isSubmitting}
            sx={{ border: `1px solid ${theme.palette.primary.main}`, height: '56px' }}
            variant='outlined'
          >
            CREATE new
          </LoadingButton>
        </Card>
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
          boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 123
        }}
      >
        <LoadingButton
          fullWidth
          variant='contained'
          size='large'
          // onClick={() => handleConfirmSelection()}
        >
          Add
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default AddAnaesthesiaRecordDrawer
