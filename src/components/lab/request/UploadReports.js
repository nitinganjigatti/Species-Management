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
import imageUploader from 'public/images/gallery_add_Icon.png'
import Toaster from 'src/components/Toaster'

const UploadReports = ({
  animalID,
  labTestId,
  medicalRecordId,
  type,
  id,
  handleCloseUploader,
  restrictExecutiveFiles = [false],
  handleClosePopover,
  fetchRequestDetails,
  buttonText
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
      const newImgArr = []

      acceptedFiles.forEach(file => {
        const reader = new FileReader()
        reader.onload = () => {
          setImgSrc(prev => [...prev, reader.result])
        }
        reader.readAsDataURL(file)
        newImgArr.push(file)
      })

      setImgArr(prev => [...prev, ...newImgArr])
      setValue('image', newImgArr)
      clearErrors('image')
    }
  })

  const handleAddImageClick = () => {
    fileInputRef?.current?.click()
  }

  // const handleInputImageChange = event => {
  //   const { files } = event.target

  //   const newImgArr = []

  //   Array.from(files).forEach(file => {
  //     const reader = new FileReader()
  //     reader.onload = () => {
  //       setImgSrc(prev => [...prev, reader.result])
  //     }
  //     reader.readAsDataURL(file)
  //     newImgArr.push(file)
  //   })

  //   setImgArr(prev => [...prev, ...newImgArr])
  //   setValue('image', newImgArr)
  //   clearErrors('image')
  // }

  // const handleInputImageChange = event => {
  //   const { files } = event.target

  //   const newFileArr = []
  //   const allowedTypes = [
  //     'image/png',
  //     'image/jpeg', // PNG, JPG
  //     'application/pdf', // PDF
  //     'application/msword', // DOC
  //     'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  //     'application/vnd.ms-excel', // XLS
  //     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
  //     'text/csv' // CSV
  //   ]

  //   Array.from(files).forEach(file => {
  //     if (!allowedTypes.includes(file.type)) {
  //       Toaster({ type: 'error', message: 'Please select a valid file.' })
  //       return
  //     }

  //     const reader = new FileReader()
  //     reader.onload = () => {
  //       setImgSrc(prev => [...prev, reader.result])
  //     }
  //     reader.readAsDataURL(file)
  //     newFileArr.push(file)
  //   })

  //   setImgArr(prev => [...prev, ...newFileArr])
  //   setValue('image', newFileArr)
  //   clearErrors('image')
  // }

  const handleInputImageChange = event => {
    const { files } = event.target
    if (!files) return
    const newFileArr = []

    const allowedTypes = [
      'image/png',
      'image/jpeg', // PNG, JPG
      'application/pdf', // PDF
      'application/msword', // DOC
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/vnd.ms-excel', // XLS
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
      'text/csv' // CSV
    ]

    if (restrictExecutiveFiles) {
      Array.from(files).forEach(file => {
        if (!allowedTypes.includes(file.type)) {
          Toaster({ type: 'error', message: 'Executive files are not valid.' })

          return
        }

        const reader = new FileReader()
        reader.onload = () => {
          setImgSrc(prev => [...prev, reader.result])
        }
        reader.readAsDataURL(file)
        newFileArr.push(file)
      })
    } else {
      Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onload = () => {
          setImgSrc(prev => [...prev, reader.result])
        }
        reader.readAsDataURL(file)
        newFileArr.push(file)
      })
    }

    setImgArr(prev => [...prev, ...newFileArr])
    setValue('image', newFileArr)
    clearErrors('image')
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

          Toaster({ type: 'success', message: response.message })

          fetchRequestDetails()
          setKey(key + 1)
        } else {
          reset(defaultValues)

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
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container>
        <Grid item size={{ md: 12, sm: 12, xs: 12 }} sx={{ m: 5 }}>
          <Box key={key}>
            <Grid container>
              {/* {imgSrc !== '' ? null : ( */}
              <Grid item size={{ md: 12, sm: 12, xs: 12 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: 'auto', flexWrap: 'wrap' }}>
                  <input
                    multiple
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
                      height: 60,
                      borderRadius: '8px',
                      border: `2px dotted ${theme.palette.customColors.OutlineSecondary}`,
                      padding: 3,
                      width: '414px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <Image alt={'filename'} src={imageUploader} width={32} height={32} />
                    <Typography>Drop your lab files here</Typography>
                  </Box>
                </Box>
              </Grid>
              {/* )} */}
              <Grid item size={{ md: 12, sm: 12, xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Stack
                  direction='row'
                  sx={{
                    width: '100%',
                    px: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    gap: 3
                  }}
                >
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
                              color={theme.palette.primary.contrastText}
                              onClick={() => removeSelectedImage(index)}
                            >
                              {' '}
                            </Icon>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  {imgArr?.length > 0 && (
                    <Box sx={{ marginLeft: 'auto', paddingRight: 2 }}>
                      <LoadingButton loading={submitting} onClick={handleSubmitData} type='submit' variant='contained'>
                        {buttonText || 'Upload'}
                      </LoadingButton>
                    </Box>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </form>
  )
}

export default UploadReports
