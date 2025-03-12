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
import Toaster from 'src/components/Toaster'

import { Controller, useForm } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import imageUploader from 'public/images/imageUploader/imageUploader.png'
import { useDropzone } from 'react-dropzone'
import { useTheme } from '@emotion/react'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useEffect, useRef, useState } from 'react'
import { AddEggNecropsy } from 'src/lib/api/egg/egg'

const NecropsySlider = ({ eggID, setOpenNecropsy, openNecropsy, fetchTableData }) => {
  const theme = useTheme()
  const fileInputRef = useRef(null)
  const [imgSrc, setImgSrc] = useState('')

  const [fileSize, setFileSize] = useState('')
  const [displayFile, setDisplayFile] = useState('')

  const [isSampleTaken, setIsSampleTaken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fileError, setFileError] = useState(false)

  const defaultValues = {
    sample_taken: '',
    report_file: ''
  }

  const schema = yup.object().shape({
    report_file: yup.mixed().when('isSampleTaken', {
      is: false,
      then: yup.mixed().required('Report file is required')
    })
  })

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
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    onDrop: acceptedFiles => {
      const reader = new FileReader()
      const files = acceptedFiles
      if (files && files.length !== 0) {
        const file = files[0]
        reader.onload = () => {
          setImgSrc(reader.result)
        }
        setDisplayFile(file.name)

        reader.readAsDataURL(file)
        setValue('report_file', file)

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

      const size = (files[0]?.size / (1024 * 1024)).toFixed(2)
      setFileSize(size)
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

  const handleClose = () => {
    setOpenNecropsy(false)
    setIsSampleTaken(false)
    setImgSrc('')
    setValue('report_file', '')
  }

  const onSubmit = async values => {
    if (!isSampleTaken) {
      setFileError(true) // show error if no file is uploaded

      return
    }

    setLoading(true)
    setFileError(false)

    const payload = {
      egg_id: eggID,
      egg_attachment: [getValues('report_file')],
      is_sample_collected: isSampleTaken === true ? '1' : '0'
    }

    //  console.log('payload :>> ', payload)

    try {
      const response = await AddEggNecropsy(payload)

      // console.log('response :>> ', response)

      if (response?.success) {
        setLoading(false)

        Toaster({ type: 'success', message: response.message })
        if (fetchTableData) {
          fetchTableData()
        }
        handleClose()
      } else {
        setLoading(false)

        Toaster({ type: 'error', message: response.message })
      }
    } catch (error) {
      setLoading(false)

      console.log('error :>> ', error)
    }
  }

  return (
    <>
      <Drawer anchor='right' open={openNecropsy} sx={{ '& .MuiDrawer-paper': { width: ['100%', '562px'] } }}>
        {/* drawer */}

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
              <IconButton size='small' onClick={() => handleClose()} sx={{ color: 'text.primary' }}>
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
                  borderColor: fileError ? 'red' : '#c3cec7',
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
                    <Grid item xs={12} sm={12} md={12}>
                      <input
                        type='file'
                        accept='*/*'
                        onChange={e => handleInputImageChange(e)}
                        style={{ display: 'none' }}
                        name='report_file'
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
                      {errors?.report_file && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors?.report_file?.message}</FormHelperText>
                      )}
                    </Grid>
                  )}
                  <Grid item md={12}>
                    {imgSrc !== '' && (
                      <Stack direction='row' gap={'24px'}>
                        <Box sx={{ display: 'flex', width: '48px', height: '48px' }}>
                          <img
                            style={{
                              aspectRatio: 2 / 2,
                              height: '100%',
                              width: '100%',
                              borderRadius: '8px'
                            }}
                            alt='Uploaded image'
                            src='/icons/Upload_doc_icon.png'
                          />
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '422px',

                              // gap: 50,
                              mt: -2
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography
                                sx={{
                                  fontSize: '16px',
                                  fontWeight: 500,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                Uploaded{' '}
                              </Typography>
                              <Typography
                                style={{
                                  fontSize: '15px',
                                  fontWeight: 400,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {fileSize}MB
                              </Typography>
                            </Box>

                            <IconButton sx={{ alignItems: 'flex-end' }} onClick={() => removeSelectedImage()}>
                              <Icon icon='material-symbols-light:close' fontSize={20} />
                            </IconButton>
                          </Box>
                          <Typography
                            sx={{ mt: -1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            File Name : {displayFile}
                          </Typography>
                        </Box>
                      </Stack>
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
                loading={loading}
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
