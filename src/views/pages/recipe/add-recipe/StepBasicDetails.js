// ** React Imports
import { useState } from 'react'

// ** MUI Components
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'
import FormControl from '@mui/material/FormControl'
import OutlinedInput from '@mui/material/OutlinedInput'
import InputAdornment from '@mui/material/InputAdornment'
import { Divider, CardContent } from '@mui/material'

import CustomFileUploaderSingle from 'src/views/forms/form-elements/file-uploader/CustomFileUploaderSingle'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const StepBasicDetails = ({ handleNext }) => {
  // ** States
  const [values, setValues] = useState({
    showPassword: false,
    showConfirmPassword: false
  })
  const [files, setFiles] = useState([])

  const handleClickShowPassword = () => {
    setValues({ ...values, showPassword: !values.showPassword })
  }

  const handleClickShowConfirmPassword = () => {
    setValues({ ...values, showConfirmPassword: !values.showConfirmPassword })
  }

  const onImageUpload = async imageData => {
    setFiles(imageData)
  }

  return (
    <>
      <Box sx={{ mb: 1, px: 5, mt: 5, float: 'left' }}>
        <Typography variant='h6'>Add basic details</Typography>
      </Box>

      <Grid container spacing={5} sx={{ px: 5 }}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <TextField label='Recipe name' placeholder='johndoe' />
          </FormControl>
        </Grid>
        <Divider sx={{ mb: 4, mx: 3, pb: 1, mt: 7, width: '98%', ml: 5 }} />
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <TextField type='number' label='Enter Standard Unit (Yield)' placeholder='' />
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <TextField type='number' label='Select Unit of Measurement (UOM)' placeholder='' />
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <TextField type='number' label='Total calories for 100 gms' placeholder='' />
          </FormControl>
        </Grid>
        <Divider sx={{ pb: 1, mt: 7, width: '98%', ml: 5 }} />
        <Grid item xs={6}>
          <CardContent sx={{ px: 0 }}>
            <CustomFileUploaderSingle onImageUpload={onImageUpload} />
          </CardContent>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 12 }}>
            <Button
              color='secondary'
              variant='outlined'
              startIcon={<Icon icon='mdi:arrow-left' fontSize={20} />}
              sx={{ mr: 6 }}
            >
              Cancel
            </Button>
            <Button variant='contained' onClick={handleNext} endIcon={<Icon icon='mdi:arrow-right' fontSize={20} />}>
              Next
            </Button>
          </Box>
        </Grid>
      </Grid>
    </>
  )
}

export default StepBasicDetails
