import { LoadingButton } from '@mui/lab'
import {
  Box,
  Card,
  CardContent,
  Drawer,
  FormControl,
  FormControlLabel,
  FormHelperText,
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
import Image from 'next/image'
import { Controller, useForm } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import imageUploader from 'public/images/imageUploader/imageUploader.png'
import { useDropzone } from 'react-dropzone'
import { useTheme } from '@emotion/react'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useEffect, useRef, useState } from 'react'

// const schema = yup.object().shape({
//   necropsy_report: yup.string().required('Please select an option for Necropsy Report'),
//   sample_taken: yup.string().required('Please select an option for Sample Taken'),
//   report_image: yup.mixed().when('necropsy_report', {
//     is: 'Necropsy Report',
//     then: yup
//       .mixed()
//       .required('Please upload an image for the necropsy report.')
//       .test('fileType', 'Unsupported file format', value => {
//         if (!value) return true // If no file is selected, no validation needed
//         return ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'].includes(value.type)
//       })
//   })
// })

const NecropsySlider = ({ setOpenNepoFile }) => {
  const fileInputRef = useRef(null)
  const [imgSrc, setImgSrc] = useState('')
  const [displayFile, setDisplayFile] = useState('')

  const defaultValues = {
    necropsy_report: '',
    sample_taken: '',
    report_image: ''
  }

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues,
    // resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  // Determine initial selectedRadio state based on default values
  const initialSelectedRadio = defaultValues.necropsy_report
    ? 'necropsy_report'
    : defaultValues.sample_taken
    ? 'sample_taken'
    : ''

  const [selectedRadio, setSelectedRadio] = useState(initialSelectedRadio)

  useEffect(() => {
    reset(defaultValues)
  }, [reset])

  const handleRadioChange = value => {
    setSelectedRadio(value)
    if (value === 'sample_taken') {
      setValue('necropsy_report', '')
    } else if (value === 'necropsy_report') {
      setValue('sample_taken', '')
    }
  }

  const theme = useTheme()
  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', 'pdf']
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

  const handleChange = e => {
    console.log('e', e.target.files)
  }

  const handleAddImageClick = () => {
    fileInputRef?.current?.click()
  }

  const handleInputImageChange = file => {
    const reader = new FileReader()
    const { files } = file.target
    if (files && files.length !== 0) {
      reader.onload = () => {
        setImgSrc(reader?.result)
      }
      setDisplayFile(files[0]?.name)
      reader?.readAsDataURL(files[0])
      setValue('report_image', files[0])
    }
  }

  const removeSelectedImage = () => {
    setImgSrc('')
    setValue('report_image', '')
  }

  console.log('Get Val >', getValues())

  const onSubmit = values => {
    debugger
    console.log('Values >', values)
  }
  return (
    <>
      <Drawer anchor='right' open={open} sx={{ '& .MuiDrawer-paper': { width: ['100%', 600] } }}>
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
          <Typography variant='h6' sx={{ mr: 60 }}>
            Attach Necropsy Report
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }}>
              <Icon icon='mdi:close' fontSize={20} onClick={() => setOpenNepoFile(false)} />
            </IconButton>
          </Box>
        </Box>

        {/* drower */}

        <Box className='sidebar-body' sx={{ backgroundColor: 'background.default', p: theme => theme.spacing(5, 6) }}>
          <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
            <Typography sx={{ mt: 4 }} variant='h6'>
              Select Options
            </Typography>
            <Card fullWidth sx={{ mt: 3, mb: 12, cursor: 'pointer' }}>
              <Grid container sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Grid item xs={12}>
                  <Controller
                    name='necropsy_report'
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <Box
                        sx={{
                          width: '94%',
                          border: '1px solid #ccc',
                          borderRadius: '5px',
                          padding: '10px',
                          ml: 4,
                          display: 'flex',
                          alignItems: 'center',
                          mt: 4,
                          mb: 3,
                          cursor: 'pointer' // Add cursor pointer for better UX
                        }}
                        onClick={() => {
                          const updatedValue = value === '1' ? '' : '1' // Toggle the value
                          onChange(updatedValue)
                          handleRadioChange('necropsy_report')
                        }}
                      >
                        <Typography variant='body1' sx={{ flex: 1 }}>
                          Necropsy Report
                        </Typography>
                        <FormControlLabel
                          control={<Radio />}
                          value='1'
                          checked={value === '1'} // Check if value is '1'
                          onChange={() => {
                            onChange('1')
                            handleRadioChange('necropsy_report')
                          }}
                        />
                      </Box>
                    )}
                  />
                </Grid>
              </Grid>

              <Grid container sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Grid item xs={12}>
                  <Controller
                    name='sample_taken'
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <Box
                        sx={{
                          width: '94%',
                          border: '1px solid #ccc',
                          borderRadius: '5px',
                          padding: '10px',
                          ml: 4,
                          display: 'flex',
                          alignItems: 'center',
                          mt: 4,
                          mb: 3,
                          cursor: 'pointer' // Add cursor pointer for better UX
                        }}
                        onClick={() => {
                          const updatedValue = value === '1' ? '' : '1' // Toggle the value
                          onChange(updatedValue)
                          handleRadioChange('sample_taken')
                        }}
                      >
                        <Typography variant='body1' sx={{ flex: 1 }}>
                          Sample Taken
                        </Typography>
                        <FormControlLabel
                          control={<Radio />}
                          value='1'
                          checked={value === '1'} // Check if value is '1'
                          onChange={() => {
                            onChange('1')
                            handleRadioChange('sample_taken')
                          }}
                        />
                      </Box>
                    )}
                  />
                </Grid>
              </Grid>
            </Card>

            <Typography sx={{ mt: 10 }} variant='h6'>
              Upload Document
            </Typography>

            <Card sx={{ mt: 4 }}>
              {imgSrc !== '' ? null : (
                <Grid item xs={6} sm={6} md={5} sx={{ ml: 2, mt: 4 }}>
                  <input
                    type='file'
                    accept='image/*,.pdf,.ppt,.pptx'
                    style={{ display: 'none' }}
                    name='report_image'
                    onChange={e => handleInputImageChange(e)}
                    ref={fileInputRef}
                  />

                  <Box
                    {...getRootProps({ className: 'dropzone' })}
                    onClick={handleAddImageClick}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '520px',
                      ml: 2,
                      gap: 7,
                      height: 120,
                      border: `2px solid ${theme.palette.customColors.trackBg}`,
                      borderRadius: 1,
                      padding: 3,
                      mb: 4
                    }}
                  >
                    <Image
                      alt={'filename'}
                      src={imageUploader}
                      width={100}
                      height={100}
                      onChange={e => handleChange(e)}
                    />

                    <Typography>Drop your image here</Typography>
                  </Box>
                </Grid>
              )}
              <Grid item md={5.9}>
                {imgSrc !== '' && (
                  <Box sx={{ display: 'flex' }}>
                    <Box
                      sx={{
                        position: 'relative',
                        backgroundColor: theme.palette.customColors.tableHeaderBg,
                        borderRadius: '10px',
                        height: 121,
                        padding: '10.5px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <img
                        style={{
                          height: '80%',
                          objectFit: 'cover',
                          borderRadius: '2%'
                        }}
                        alt='Uploaded image'
                        src={typeof imgSrc === 'string' ? imgSrc : imgSrc}
                      />
                      <Box
                        sx={{
                          cursor: 'pointer',
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          zIndex: 10,
                          height: '24px',
                          borderRadius: 0.4,
                          backgroundColor: theme.palette.customColors.secondaryBg
                        }}
                      >
                        <Icon icon='material-symbols-light:close' color='#fff' onClick={() => removeSelectedImage()}>
                          {' '}
                        </Icon>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Grid>
            </Card>

            <Grid
              container
              spacing={2}
              sx={{ position: 'fixed', width: '30%', height: '50px', bottom: '0', mb: 3, ml: 2 }}
            >
              <Grid item xs={6}>
                <LoadingButton fullWidth variant='outlined' sx={{ width: '230px', height: '45px' }}>
                  Cancel
                </LoadingButton>
              </Grid>
              <Grid item xs={6}>
                <LoadingButton fullWidth type='submit' variant='contained' sx={{ width: '230px', height: '45px' }}>
                  Submit
                </LoadingButton>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Drawer>
    </>
  )
}

export default NecropsySlider
