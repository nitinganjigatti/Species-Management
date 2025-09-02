// ** MUI Imports
import { useTheme, Card, Typography, IconButton, Drawer, Box } from '@mui/material'
import { LoadingButton } from '@mui/lab'

// ** Custom Core Components
import Icon from 'src/@core/components/icon'

// ** Form & Validation Setup
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

// ** Custom Form Components
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'

const schema = yup.object().shape({
  area: yup.object().nullable().required('Area / Zone is required'),

  floor: yup.object().nullable().required('Floor is required'),

  enclosure: yup.string().required('Enclosure name is required'),

  occupancy: yup.object().nullable().required('Occupancy status is required')
})

const defaultValues = {
  area: null,
  floor: null,
  enclosure: '',
  occupancy: null
}

const AddEnclosures = props => {
  const { addEventSidebarOpen, handleSidebarClose, submitLoader, editParams, drawerWidth = 500 } = props
  const theme = useTheme()

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const onSubmit = async params => {
    console.log('data submitted', params)
  }

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', drawerWidth] } }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 6,
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
        }}
      >
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Filter Icon' />
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {editParams?.id !== null ? 'Edit Enclosure' : 'Add New Enclosure'}
          </Typography>
        </Box>
        <IconButton
          size='small'
          onClick={() => {
            handleSidebarClose()
            reset(defaultValues)
          }}
          sx={{ color: theme.palette.text.primary }}
        >
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      <Box
        className='sidebar-body'
        sx={{
          backgroundColor: theme.palette.background.default,
          p: theme => theme.spacing(6),
          flexGrow: 1,
          pb: '100px'
        }}
      >
        <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
          <Card sx={{ p: theme => theme.spacing(6) }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ControlledSelect
                control={control}
                name={'area'}
                errors={errors}
                label={'Select Area / Zone*'}
                options={[]}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
              <ControlledSelect
                control={control}
                name={'floor'}
                errors={errors}
                label={'Enter Floor*'}
                options={[]}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
              <ControlledTextField
                control={control}
                errors={errors}
                label={'Enter Enclosure name*'}
                name={'enclosure'}
                placeholder={'Enter Enclosure name'}
                fullWidth
              />

              <ControlledSelect
                control={control}
                name={'occupancy'}
                errors={errors}
                label={'Enclosure Occupancy Status*'}
                options={[]}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
            </Box>
          </Card>
          {/* Footer button */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              p: 4,
              display: 'flex',
              justifyContent: 'center',
              boxShadow: '0px -2px 6px rgba(0, 0, 0, 0.1)',
              backgroundColor: theme.palette.background.paper
            }}
          >
            <LoadingButton variant='contained' type='submit' loading={submitLoader} sx={{ flex: 1, py: 2 }}>
              {editParams?.id ? 'Update' : 'Add'}
            </LoadingButton>
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddEnclosures
