import {
  Box,
  Card,
  Drawer,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import imageUploader from 'public/images/imageUploader/imageUploader.png'

import { Controller, useForm } from 'react-hook-form'
import { LoadingButton } from '@mui/lab'
import { GetEggMaster, AddEggStatusAndCondition } from 'src/lib/api/egg/egg'
import Toaster from 'src/components/Toaster'

const DiscardForm = ({ isOpen, setIsOpen, eggID, callApi, getDetails, GetGalleryImgList }) => {
  const theme = useTheme()
  const fileInputRef = useRef(null)
  const [reason, setReason] = useState('')

  const [necropsy, setNecropsy] = useState('')
  const [imgSrc, setImgSrc] = useState('')
  const [discardReason, setDiscardReason] = useState([])
  const [eggStateID, setEggStateId] = useState(null)
  const [loader, setLoader] = useState(false)

  const [imgArr, setImgArr] = useState([])

  // console.log('imgArr :>> ', imgArr)
  const [displayFile, setDisplayFile] = useState('')

  const getEggMasterData = async () => {
    try {
      // const params = {
      //   type: ['length', 'weight'],
      //   page_no: 1,
      //   limit: 50
      // }
      await GetEggMaster().then(res => {
        if (res.success) {
          const eggState = res?.data?.egg_status?.find(state => state?.egg_status === 'Discard')
          const eggStateId = eggState ? eggState.id : null
          setEggStateId(eggStateId)

          if (eggStateId) {
            const filteredEggStatus = res?.data?.egg_state.filter(status => status.egg_status_id === eggStateId)
            setDiscardReason(filteredEggStatus)
          }
        } else {
        }
      })
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    try {
      getEggMasterData()
    } catch (error) {
      console.log('error :>> ', error)
    }
  }, [])

  const handleChange = event => {
    setReason(event.target.value)
  }

  const defaultValues = {
    // reason: '',

    image: '',
    status_radioBtn: '',
    comment: '',
    necropsy_Btn: 0
  }

  const schema = yup.object().shape({
    // status_radioBtn
    // status_radioBtn: yup.string().required('State is required'),
    // comment: yup.string().required('Comments is required'),
    // reason: yup.string().required('Reason is required'),
    // necropsy: yup.string().required('Necropsy decision is required')
  })

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    clearErrors,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

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

  // const handleInputImageChange = file => {
  //   const reader = new FileReader()
  //   const { files } = file.target

  //   if (files && files.length !== 0) {
  //     reader.onload = () => {
  //       setImgSrc(pre => [...pre, reader?.result])
  //     }
  //     setDisplayFile(files[0]?.name)
  //     reader?.readAsDataURL(files[0])
  //     setImgArr(pre => [...pre, files[0]])
  //     setValue('image', files)
  //     clearErrors('image')
  //   }
  // }
  const handleInputImageChange = file => {
    const { files } = file.target

    if (files && files.length !== 0) {
      // Clear existing images and names before adding new ones
      setImgSrc([])
      setImgArr([])

      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader()
        const currentFile = files[i]

        // Closure to capture the current file
        reader.onload = e => {
          // Add the new image source to the state
          setImgSrc(pre => [...pre, e.target.result])
        }

        // Start reading the current file as a data URL
        reader.readAsDataURL(currentFile)
      }

      // Update file display and set form values
      setDisplayFile(files.length > 1 ? `${files.length} files selected` : files[0]?.name)
      setImgArr(pre => [...pre, ...files]) // Store all selected files
      setValue('image', files) // Update your form state
      clearErrors('image')
    }
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

  // ---------------

  const onSubmit = async values => {
    setLoader(true)
    try {
      const payload = {
        egg_id: eggID,
        egg_status_id: eggStateID,
        egg_state_id: reason,
        is_necropsy_needed: values?.necropsy_Btn,
        comment: getValues('comment'),
        egg_attachment: imgArr

        // egg_attachment: [getValues('image')]
      }
      console.log('payload :>> ', payload)

      const res = await AddEggStatusAndCondition(payload)
      if (res.success) {
        setReason('')
        setImgSrc('')
        reset()
        setIsOpen(false)
        setLoader(false)
        Toaster({ type: 'success', message: res?.message })

        if (callApi) {
          callApi('')
        }

        if (getDetails) {
          getDetails(eggID)
        }
        if (GetGalleryImgList) {
          GetGalleryImgList({ ref_id: eggID, ref_type: 'egg' })
        }
      } else {
        // setReason('')
        // setImgSrc('')
        // // reset()
        // setIsOpen(false)
        setLoader(false)
        Toaster({ type: 'error', message: res?.message })
      }

      // Perform any additional operations, e.g., API call
    } catch (error) {
      console.error('Error while :', error)
      setLoader(false)
      Toaster({ type: 'error', message: 'An error occurred while Discard' })
    }
  }

  const handelClose = () => {
    setIsOpen(false)
    setReason('')
    setImgSrc('')
    setNecropsy('')
    reset()
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={isOpen}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        <Box sx={{ bgcolor: theme.palette.customColors.lightBg, width: '100%' }}>
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
              <Typography variant='h6'>Select State For Discard</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={() => handelClose()} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Box
              sx={{
                p: 4,
                m: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                bgcolor: '#fff',
                borderRadius: '8px',
                border: 1,
                borderColor: '#c3cec7'
              }}
            >
              {discardReason?.map(item => (
                <Box
                  key={item?.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: 1,
                    borderColor: '#c5c6cd',
                    p: 2,
                    borderRadius: '5px'

                    // opacity: 0.6
                  }}
                >
                  <Typography>{item?.egg_state}</Typography>

                  <FormControl>
                    <RadioGroup
                      aria-labelledby='demo-controlled-radio-buttons-group'
                      name='status_radioBtn'
                      value={reason}
                      onChange={handleChange}
                    >
                      <FormControlLabel value={item?.id} control={<Radio />} style={{ mr: '0px', mr: '0px' }} />
                    </RadioGroup>
                  </FormControl>
                </Box>
              ))}
            </Box>
            {!reason && <FormHelperText sx={{ color: 'error.main', m: 5 }}>State Is required</FormHelperText>}

            <Typography variant='h6' sx={{ m: 5 }}>
              Add Reason For Discard
            </Typography>

            <Box
              sx={{
                p: 4,
                m: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                bgcolor: '#fff',
                borderRadius: '8px',
                border: 1,
                borderColor: '#c3cec7'
              }}
            >
              <FormControl fullWidth>
                <Controller
                  name='comment'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      onChange={onChange}
                      focused={value !== ''}
                      placeholder='Enter Comments'
                      error={Boolean(errors.comment)}
                      name='comment'
                    />
                  )}
                />
                {errors.comment && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.comment?.message}</FormHelperText>
                )}
              </FormControl>

              <Grid container sx={{ justifyContent: 'space-between' }}>
                <Grid item md={12} sm={12} xs={12}>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={e => handleInputImageChange(e)}
                    style={{ display: 'none' }}
                    name='image'
                    ref={fileInputRef}
                    multiple={true}
                  />

                  <Box
                    {...getRootProps({ className: 'dropzone' })}
                    onClick={handleAddImageClick}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      height: 70,

                      border: `1px dashed #c5c6cd`,
                      borderRadius: 1,

                      padding: 3
                    }}
                  >
                    <Image alt={'filename'} src={imageUploader} width={50} height={50} />

                    <Typography>Drop your image here</Typography>
                  </Box>
                </Grid>

                <Grid item md={12} sm={12} xs={12}>
                  {imgSrc && imgSrc.length > 0 && (
                    <Box sx={{ display: 'flex', mt: 2 }}>
                      {imgSrc.map((src, index) => (
                        <Box
                          key={index}
                          sx={{
                            position: 'relative',
                            backgroundColor: theme.palette.customColors.tableHeaderBg,
                            borderRadius: '10px',
                            height: 121,
                            padding: '10.5px',
                            boxSizing: 'border-box',
                            marginRight: '10px' // Add margin for spacing between images
                          }}
                        >
                          <img
                            style={{
                              aspectRatio: 2 / 2,
                              height: '100%',
                              borderRadius: '5%',
                              objectFit: 'cover'
                            }}
                            alt={`Uploaded image ${index}`}
                            src={typeof src === 'string' ? src : src}
                          />
                          <Box
                            sx={{
                              cursor: 'pointer',
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              zIndex: 1,
                              height: '24px',
                              borderRadius: 0.4,
                              backgroundColor: theme.palette.customColors.secondaryBg
                            }}
                          >
                            <Icon
                              icon='material-symbols-light:close'
                              color='#fff'
                              onClick={() => removeSelectedImage(index)} // Pass the index here
                            />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>

            <Box
              sx={{
                p: 4,
                m: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                mb: 35,
                bgcolor: '#fff',
                borderRadius: '8px',
                border: 1,
                borderColor: '#c3cec7'
              }}
            >
              <Typography variant='h6'>Necropsy Needed ?</Typography>

              <Stack>
                <FormControl>
                  <Controller
                    name='necropsy_Btn'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <RadioGroup
                        row
                        value={value}
                        name='necropsy_Btn'
                        sx={{ display: 'flex', flexDirection: 'row', gap: 3, justifyContent: 'space-between' }}
                        onChange={onChange}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            flexGrow: 1,

                            gap: 2,
                            border: 1,
                            borderColor: '#c5c6cd',
                            p: 2,
                            borderRadius: '5px',

                            // opacity: 0.6,
                            justifyContent: 'space-between'
                          }}
                        >
                          <Typography>Yes</Typography>
                          <FormControlLabel value={1} control={<Radio />} />
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            flexGrow: 1,
                            gap: 2,
                            border: 1,
                            borderColor: '#c5c6cd',
                            p: 2,
                            borderRadius: '5px',

                            // opacity: 0.6,

                            justifyContent: 'space-between'
                          }}
                        >
                          <Typography>No</Typography>

                          <FormControlLabel value={0} control={<Radio />} />
                        </Box>
                      </RadioGroup>
                    )}
                  ></Controller>
                </FormControl>
              </Stack>
            </Box>
            <Box
              sx={{
                height: '122px',
                width: '100%',
                maxWidth: '562px',
                position: 'fixed',
                bottom: 0,
                px: 4,
                bgcolor: 'white',
                alignItems: 'center',
                justifyContent: 'center',
                display: 'flex',
                zIndex: 1
              }}
            >
              <LoadingButton
                loading={loader}
                disabled={loader}
                fullWidth
                variant='contained'
                type='submit'
                size='large'
              >
                Discard
              </LoadingButton>
            </Box>
          </form>
        </Box>
      </Drawer>
    </>
  )
}

export default DiscardForm
