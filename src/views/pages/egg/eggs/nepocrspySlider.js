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
  Stack,
  Switch,
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

const NecropsySlider = ({ setOpenNecropsy, openNecropsy }) => {
  const theme = useTheme()
  const fileInputRef = useRef(null)
  const [imgSrc, setImgSrc] = useState('')
  const [displayFile, setDisplayFile] = useState('')
  const [isSampleTaken, setIsSampleTaken] = useState(false)

  const defaultValues = {
    sample_taken: '',
    report_file: ''
  }

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    clearErrors,
    formState: { errors }
  } = useForm({
    defaultValues,

    // resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

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
        setValue('report_file', files[0])

        clearErrors('report_file')
      }
    }
  })

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
      setValue('report_file', files[0])
      clearErrors('report_file')
    }
  }

  const removeSelectedImage = () => {
    setImgSrc('')
    setValue('report_file', '')
  }

  const handleChangeSwitch = event => {
    setIsSampleTaken(event.target.checked)
  }

  const onSubmit = values => {
    debugger
    console.log('Values >', values)
  }

  return (
    <>
      <Drawer anchor='right' open={openNecropsy} sx={{ '& .MuiDrawer-paper': { width: ['100%', '562px'] } }}>
        {/* drower */}

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
              <Typography variant='h6'> Egg Necropsy</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={() => setOpenNecropsy(false)} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          </Box>

          <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
            <>
              <Box
                sx={{
                  m: 4,
                  bgcolor: '#fff',
                  borderRadius: '8px',
                  border: 1,
                  borderRadius: '8px',
                  border: 1,
                  borderColor: '#c3cec7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: '20px',
                  py: '16px'
                }}
              >
                <Typography>Have you taken sample?</Typography>
                <>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isSampleTaken}
                        onChange={handleChangeSwitch}
                        name='Sample_Taken'
                        color='primary'
                      />
                    }
                  />
                </>
              </Box>

              <Box
                sx={{
                  m: 4,
                  bgcolor: '#fff',
                  borderRadius: '8px',
                  border: 1,
                  borderRadius: '8px',
                  border: 1,
                  borderColor: '#c3cec7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: '20px',
                  py: '16px'
                }}
              >
                {' '}
                <Grid container sx={{ justifyContent: 'space-between' }}>
                  {imgSrc !== '' ? null : (
                    <Grid item md={12}>
                      <input
                        type='file'
                        accept='image/*'
                        onChange={e => handleInputImageChange(e)}
                        style={{ display: 'none' }}
                        name='image'
                        ref={fileInputRef}
                      />

                      <Box
                        {...getRootProps({ className: 'dropzone' })}
                        onClick={handleAddImageClick}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7,
                          height: 70,

                          border: `2px solid ${theme.palette.customColors.trackBg}`,
                          borderRadius: 1,

                          padding: 3
                        }}
                      >
                        <Image alt={'filename'} src={imageUploader} width={50} height={50} />

                        <Typography>Drop your image here</Typography>
                      </Box>
                    </Grid>
                  )}
                  <Grid item md={12}>
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
                              aspectRatio: 2 / 2,
                              height: '100%',
                              borderRadius: '5%'
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
                            <Icon
                              icon='material-symbols-light:close'
                              color='#fff'
                              onClick={() => removeSelectedImage()}
                            >
                              {' '}
                            </Icon>
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Box>
            </>
            <Box
              sx={{
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
                zIndex: 123
              }}
            >
              <LoadingButton
                sx={{ height: '58px' }}
                fullWidth
                variant='contained'
                type='submit'
                size='large'

                // loading={loader}
              >
                submit
              </LoadingButton>
            </Box>
          </form>
        </Box>
      </Drawer>
    </>
  )
}

export default NecropsySlider
