import { LoadingButton } from '@mui/lab'
import {
  Box,
  Card,
  Drawer,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography
} from '@mui/material'
import { useDropzone } from 'react-dropzone'
import { Controller, useForm } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import Image from 'next/image'

import imageUploader from 'public/images/imageUploader/imageUploader.png'
import { useState } from 'react'

const ConditionSlider = ({ setOpenDrawer }) => {
  const [selectedOption, setSelectedOption] = useState('')

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const theme = useTheme()

  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    onDrop: acceptedFiles => {
      const reader = new FileReader()
      const files = acceptedFiles
      if (files && files.length !== 0) {
        reader.onload = () => {
          setImgSrc(reader?.result)
        }
        setDisplayFile(files[0]?.name)
        reader?.readAsDataURL(files[0])
        setValue('ingredientImg', files[0])
        clearErrors('ingredientImg')
      }
    }
  })

  const handleRadioChange = event => {
    setSelectedOption(event.target.value)
  }

  return (
    <>
      <Drawer anchor='right' open={open} sx={{ '& .MuiDrawer-paper': { width: ['100%', 500] } }}>
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'background.default',
            p: theme => theme.spacing(3, 3.255, 3, 5.255)
          }}
        >
          <Box sx={{ mt: 2 }}>
            <img src='/icons/activity_icon.png' alt='Grocery Icon' width='30px' />
          </Box>
          <Typography variant='h6' sx={{ mr: 50 }}>
            State & Condition
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }}>
              <Icon icon='mdi:close' fontSize={20} onClick={() => setOpenDrawer(false)} />
            </IconButton>
          </Box>
        </Box>

        <Box className='sidebar-body' sx={{ backgroundColor: 'background.default', p: theme => theme.spacing(5, 6) }}>
          <form autoComplete='off'>
            <Card fullWidth>
              <FormControl sx={{ width: '95%', ml: 3, mt: 5 }}>
                <InputLabel id='current_state'>Select State</InputLabel>
                <Controller
                  name='current_state'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      name='current_state'
                      value={value}
                      label='Current State'
                      onChange={onChange}
                      labelId='current_state'
                    >
                      <MenuItem value='Intract'>Intract</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>

              <FormControl sx={{ width: '95%', ml: 3, mt: 5, mb: 4 }}>
                <InputLabel id='site_id'>Select Stage</InputLabel>
                <Controller
                  name='condition'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      name='condition'
                      value={value}
                      label='Condition Egg'
                      onChange={onChange}
                      labelId='condition'
                    >
                      <MenuItem value='Intract'>Intract</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Card>

            <Typography variant='h6' sx={{ mt: 5 }}>
              Change Conditions
            </Typography>

            <Card fullWidth sx={{ mt: 3 }}>
              <Grid container sx={{ display: 'flex', justifyContent: 'space-between' }}>
                {/* Text field with radio button for "Warm" */}
                <Grid item xs={5.5}>
                  <TextField
                    id='warm-textfield'
                    label='Warm'
                    variant='outlined'
                    sx={{ mt: 5, ml: 6 }}
                    InputProps={{
                      endAdornment: (
                        <FormControlLabel
                          value='warm'
                          control={<Radio checked={selectedOption === 'warm'} onChange={handleRadioChange} />}
                          label=''
                          sx={{ position: 'relative', left: '30px' }} // Adjust margin to align radio button with text
                        />
                      )
                    }}
                  />
                </Grid>

                {/* Text field with radio button for "Cold" */}
                <Card fullWidth sx={{ mt: 3 }}>
                  <Grid container sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    {/* Text field with radio button for "Warm" */}
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel id='cold-label'>Cold</InputLabel>
                        <Select
                          labelId='cold-label'
                          value={selectedOption}
                          onChange={handleRadioChange}
                          sx={{ mt: 5, mr: 4, mb: 4 }}
                          endAdornment={
                            <RadioGroup row name='cold-radio-group' value={selectedOption} onChange={handleRadioChange}>
                              <FormControlLabel value='cold' control={<Radio />} label='' />
                            </RadioGroup>
                          }
                        >
                          <MenuItem value=''>Cold</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            </Card>

            <Card fullWidth sx={{ mt: 6 }}>
              <FormControl sx={{ m: 2, width: '410px', mb: 4 }}>
                <Controller
                  name='notes'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      label='Enter Notes'
                      name='notes'
                      onChange={onChange}
                      placeholder=''
                      multiline
                      rows={4}
                      sx={{ width: '100%', mt: 2, mr: 12 }} // Adjusted sx prop
                    />
                  )}
                />
                {errors.safety_advice && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.safety_advice?.message}</FormHelperText>
                )}
              </FormControl>
              <Grid item xs={6} sm={6} md={5.5} sx={{ ml: 2 }}>
                <input type='file' accept='image/*' style={{ display: 'none' }} name='ingredientImg' />

                <Box
                  {...getRootProps({ className: 'dropzone' })}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '410px',
                    gap: 7,
                    height: 120,
                    border: `2px solid ${theme.palette.customColors.trackBg}`,
                    borderRadius: 1,
                    padding: 3,
                    mb: 4
                  }}
                >
                  <Image alt={'filename'} src={imageUploader} width={100} height={100} />

                  <Typography>Drop your image here</Typography>
                </Box>
              </Grid>
            </Card>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto', mt: 5 }}>
              <LoadingButton fullWidth variant='outlined' sx={{ height: '50px', width: '45%' }}>
                Cancel
              </LoadingButton>
              <LoadingButton fullWidth variant='contained' sx={{ height: '50px', width: '45%' }}>
                Submit
              </LoadingButton>
            </Box>
          </form>
        </Box>
      </Drawer>
    </>
  )
}
export default ConditionSlider
