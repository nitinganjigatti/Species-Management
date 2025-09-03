import React, { useRef, useState } from 'react'
import Image from 'next/image'

import { Box, Grid, Stack, Typography } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useTheme } from '@mui/material/styles'
import { useDropzone } from 'react-dropzone'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

import Toaster from 'src/components/Toaster'
import Icon from 'src/@core/components/icon'
import imageUploader from 'public/images/gallery_add_Icon.png'
import { UploadLabReports } from 'src/lib/api/lab/getLabRequest'

const UploadReports = ({
  animalID,
  labTestId,
  medicalRecordId,
  type,
  id,
  handleCloseUploader,
  restrictExecutiveFiles = [false],
  fetchRequestDetails,
  buttonText
}) => {
  const theme = useTheme()
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)
  const [imgSrc, setImgSrc] = useState([])
  const [imgArr, setImgArr] = useState([])

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

  const handleInputImageChange = event => {
    const { files } = event.target
    if (!files) return
    const newFileArr = []

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

      try {
        const response = await UploadLabReports(payload)
        if (response?.success) {
          handleCloseUploader(false)
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

  const [key, setKey] = useState(0)

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container>
        <Grid item size={{ md: 12, sm: 12, xs: 12 }} sx={{ m: 5 }}>
          <Box key={key}>
            <Grid container>
              <Grid item size={{ md: 12, sm: 12, xs: 12 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: 'auto', flexWrap: 'wrap' }}>
                  <input
                    multiple
                    type='file'
                    // accept='*/*'
                    accept={allowedTypes}
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
