/* eslint-disable lines-around-comment */
import { Box, Button, Card, CardContent, CardHeader, Grid, Input, Stack, Typography } from '@mui/material'
import React, { useRef, useState } from 'react'
import FileUploaderSingle from 'src/views/forms/form-elements/file-uploader/FileUploaderSingle'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'
import { LoadingButton } from '@mui/lab'
import { UploadLabReports } from 'src/lib/api/lab/getLabRequest'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import imageUploader from 'public/images/imageUploader/imageUploader.png'
import Toaster from 'src/components/Toaster'

const UploadReports = ({
  animalID,
  labTestId,
  medicalRecordId,
  type,
  id,
  handleCloseUploader,
  setAlertDefaults,
  handleClosePopover,
  fetchRequestDetails
}) => {
  const theme = useTheme()
  const [uploadedImage, setUploadedImage] = useState()
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)
  const [imgSrc, setImgSrc] = useState([])
  const [displayFile, setDisplayFile] = useState('')
  const [imgArr, setImgArr] = useState([])

  const onImageUpload = async imageData => {
    setFiles(imageData)
  }

  const defaultValues = { image: [] }

  const schema = yup.object().shape({
    image: yup.mixed().required('Please upload a document')
  })

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    setValue,
    getValues,
    clearErrors
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const handleSubmitData = async () => {
    try {
      const errors = await trigger()
      if (errors) {
        handleSubmit(onSubmit)()
      } else {
        scrollToTop()
      }
    } catch (error) {
      console.error(error)
    }
  }

  // image

  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    accept: {
      '*/*': []
    },
    onDrop: acceptedFiles => {
      const reader = new FileReader()
      const files = acceptedFiles
      if (files && files.length !== 0) {
        reader.onload = () => {
          setImgSrc(pre => [...pre, reader?.result])
        }
        setDisplayFile(files[0]?.name)
        reader?.readAsDataURL(files[0])
        setImgArr(pre => [...pre, files[0]])
        setValue('image', files)

        clearErrors('image')
      }
    }
  })

  const handleAddImageClick = () => {
    fileInputRef?.current?.click()
  }

  const handleInputImageChange = file => {
    const reader = new FileReader()
    const { files } = file.target
    // console.log('files :>> ', files)
    if (files && files.length !== 0) {
      reader.onload = () => {
        setImgSrc(pre => [...pre, reader?.result])
      }
      setDisplayFile(files[0]?.name)
      reader?.readAsDataURL(files[0])
      setImgArr(pre => [...pre, files[0]])
      setValue('image', files)
      clearErrors('image')
    }
  }

  // const removeSelectedImage = index => {
  //   setImgSrc(prevImages => prevImages.filter((_, i) => i !== index))
  //   setValue('image', '')
  // }

  const removeSelectedImage = index => {
    setImgSrc(prevImages => {
      const updatedImages = prevImages.filter((_, i) => i !== index)
      if (updatedImages.length === 0) {
        setValue('image', '')
      } else {
        setValue('image', updatedImages)
      }

      return updatedImages
    })

    setImgArr(prevFiles => {
      const updatedFiles = prevFiles.filter((_, i) => i !== index)
      if (updatedFiles.length === 0) {
        setValue('image', '')
      } else {
        setValue('image', updatedFiles)
      }

      return updatedFiles
    })
  }

  // ---------------

  const onSubmit = async params => {
    setSubmitting(true)

    const lab_test_files = []

    if (!imgArr?.length) {
      Toaster({ type: 'error', message: 'File is Required' })

      // setAlertDefaults({ status: true, message: 'Upload File is Required', severity: 'error' })
      setSubmitting(false)
    } else {
      const payload = {
        medical_record_id: medicalRecordId,
        animal_id: animalID,
        lab_test_id: labTestId,
        lab_test_files: imgArr,
        entity_type: type,
        entity_id: id
      }

      // console.log('payload', payload)

      try {
        const response = await UploadLabReports(payload)
        if (response?.success) {
          handleCloseUploader(false)
          handleClosePopover()
          reset(defaultValues)
          setImgSrc('')
          reset()
          setImgArr([])

          // setAlertDefaults({ status: true, message: response?.message, severity: 'success' })
          Toaster({ type: 'success', message: response.message })

          fetchRequestDetails()
          setKey(key + 1)
        } else {
          reset(defaultValues)
          // setAlertDefaults({ status: true, message: response?.message, severity: 'error' })
          Toaster({ type: 'error', message: response.message })
        }
        // Reset the form after successful submission
      } catch (error) {
        console.error(error)
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleCloseSnackBar = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setOpenSnackbar(false)
  }
  //document uploder
  // const handleFileChange = event => {
  //   const file = event.target.files[0]
  //   setSelectedFile(file)
  // }
  const [key, setKey] = useState(0)

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container>
          <Grid item md={12} xs={12} sm={12} sx={{ m: 5 }}>
            <Card key={key}>
              <CardHeader title='Upload File' />
              <CardContent>
                {/* <FileUploaderSingle onImageUpload={onImageUpload} image={uploadedImage} /> */}
                <Grid container>
                  {/* {imgSrc !== '' ? null : ( */}
                  <Grid item md={12} sm={12} xs={12}>
                    <input
                      type='file'
                      accept='*/*'
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
                        height: 100,

                        border: `2px solid ${theme.palette.customColors.trackBg}`,
                        borderRadius: 1,
                        padding: 3
                      }}
                    >
                      <Image alt={'filename'} src={imageUploader} width={50} height={50} />

                      <Typography>Drop your files here</Typography>
                    </Box>
                  </Grid>
                  {/* )} */}
                  <Grid item md={12} sm={12} xs={12} sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Stack direction='row' sx={{ px: 2, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {imgSrc?.length > 0 &&
                        imgSrc?.map((img, index) => (
                          <Box key={index} sx={{ display: 'flex', mt: 3 }}>
                            {/* {console.log('img :>> ', img)} */}
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
                                alt='image'
                                src={img.startsWith('data:image/') ? img : '/icons/document_icon.png'}
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
                                  onClick={() => removeSelectedImage(index)}
                                >
                                  {' '}
                                </Icon>
                              </Box>
                            </Box>
                          </Box>
                        ))}
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* <Grid item md={4} xs={12} sm={12}>
            <Card>
              <CardHeader title='Document Upload' />
              <CardContent>
                <Typography variant='h5' gutterBottom>
                  Drop file here or click to upload
                </Typography>
                <Controller
                  name='document'
                  control={control}
                  defaultValue={null}
                  render={({ field }) => (
                    <>
                      <Input
                        type='file'
                        onChange={e => {
                          handleFileChange(e)
                          field.onChange(e)
                        }}
                      />
                      {errors.document && <Typography color='error'>{errors.document.message}</Typography>}
                    </>
                  )}
                />
                {selectedFile && (
                  <div>
                    <Typography variant='h6' gutterBottom>
                      Uploaded Document
                    </Typography>
                    <Typography>{selectedFile.name}</Typography>
                  </div>
                )}
              </CardContent>
            </Card>
          </Grid> */}
        </Grid>
        {imgArr?.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '10px', gap: 10, marginRight: 15 }}>
            <LoadingButton loading={submitting} onClick={handleSubmitData} type='submit' variant='contained'>
              Submit Reports
            </LoadingButton>
            {/* <LoadingButton
            onClick={() => {
              reset(defaultValues)
              // setUploadedImage('')
              setKey(key + 1)
              setFiles([])
            }}
            variant='outlined'
          >
            Reset
          </LoadingButton> */}
          </div>
        )}
      </form>
    </div>
  )
}

export default UploadReports
