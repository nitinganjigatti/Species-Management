// ** MUI Imports
import { styled } from '@mui/material/styles'
import { Drawer, Box, FormControl, IconButton, Typography, Button } from '@mui/material'
import { LoadingButton } from '@mui/lab'

// ** Third Party Imports
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components Imports
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3, 4),
  justifyContent: 'space-between',
  backgroundColor: theme.palette.background.default
}))

const schema = yup.object().shape({
  selectedUsers: yup.array().min(1, 'Select at least one user').required('User selection is required')
})

const defaultValues = {
  selectedUsers: []
}

const PharmacySettingsDrawer = props => {
  const { open, toggle, onSubmit, isLoading, availableUsers } = props

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    mode: 'onChange',
    resolver: yupResolver(schema)
  })

  const handleClose = () => {
    toggle()
    reset(defaultValues)
  }

  const onFormSubmit = data => {
    const payloadKeys = data.selectedUsers.map(user => user.value)
    onSubmit(payloadKeys)
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <Header>
        <Typography variant='h6'>Add Users</Typography>
        <IconButton size='small' onClick={handleClose} sx={{ color: 'text.primary' }}>
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Header>

      <Box sx={{ p: 5, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <form
          onSubmit={handleSubmit(onFormSubmit)}
          style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          <Box sx={{ flex: 1, my: 4 }}>
            {/* <FormControl fullWidth sx={{ mb: 6 }}> */}
            <ControlledAutocomplete
              control={control}
              name='selectedUsers'
              options={availableUsers || []}
              multiple
              label='Select Users'
              placeholder='Search or Type User'
              isOptionEqualToValue={(option, value) => option?.value === value?.value}
              errors={errors}
              helperText={errors.selectedUsers?.message}
              autocompleteProps={{ limitTags: 3 }}
              maxTagsHeight={200}
            />
            {/* </FormControl> */}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mt: 4 }}>
            <LoadingButton size='large' type='submit' variant='contained' loading={isLoading} sx={{ mr: 3 }}>
              Submit
            </LoadingButton>
            <Button size='large' variant='outlined' color='secondary' onClick={handleClose}>
              Cancel
            </Button>
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default PharmacySettingsDrawer
