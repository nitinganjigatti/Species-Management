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
import toast from 'react-hot-toast'
import { GetEggMaster, AddToDiscard } from 'src/lib/api/egg/egg'
import { width } from '@mui/system'

const DiscardForm = ({ isOpen, setIsOpen, eggID, callApi }) => {
  const theme = useTheme()
  const fileInputRef = useRef(null)
  const [reason, setReason] = useState('')
  console.log('reason :>> ', reason)
  const [necropsy, setNecropsy] = useState('')
  const [imgSrc, setImgSrc] = useState('')
  const [discardReason, setDiscardReason] = useState([])

  console.log('discardReason :>> ', discardReason)

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
          console.log('res?.data? master :>> ', res?.data)
          const eggState = res?.data?.egg_status?.find(state => state?.egg_status === 'Discard')
          const eggStateId = eggState ? eggState.id : null
          console.log('eggState :>> ', eggState)
          console.log('eggStateId :>> ', eggStateId)

          if (eggStateId) {
            const filteredEggStatus = res?.data?.egg_state.filter(status => status.egg_status_id === eggStateId)
            setDiscardReason(filteredEggStatus)
            console.log('filteredEggStatus :>> ', filteredEggStatus)
          }
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
    necropsy_Btn: ''
  }

  const schema = yup.object().shape({
    // status_radioBtn
    // status_radioBtn: yup.string().required('State Is Required'),
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
        setValue('image', files[0])

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
    if (files && files.length !== 0) {
      reader.onload = () => {
        setImgSrc(reader?.result)
      }
      setDisplayFile(files[0]?.name)
      reader?.readAsDataURL(files[0])
      setValue('image', files[0])
      clearErrors('image')
    }
  }

  const removeSelectedImage = () => {
    setImgSrc('')
    setValue('image', '')
  }

  const onSubmit = async values => {
    // console.log('values :>> ', values)
    try {
      const payload = {
        egg_id: JSON.stringify([785]),
        discard_reason_id: reason,
        necropsy_needed: necropsy,
        comment: getValues('comment'),
        egg_attachment: [getValues('image')]
      }

      console.log('payload :>> ', payload)

      const res = await AddToDiscard(payload)
      if (res.success) {
        console.log('res on submit :>> ', res)
        setReason('')
        setImgSrc('')
        reset()
        setIsOpen(false)
        toast.success('Discarded Successfully')
      }

      // Perform any additional operations, e.g., API call
    } catch (error) {
      console.error('Error while adding room:', error)
      toast.error('An error occurred while adding room')
    }
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
              <IconButton size='small' onClick={() => setIsOpen(false)} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Card sx={{ p: 4, m: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                      <FormControlLabel value={item?.id} control={<Radio />} />
                    </RadioGroup>
                  </FormControl>
                </Box>
              ))}
            </Card>
            {!reason && <FormHelperText sx={{ color: 'error.main', m: 5 }}>State Is Required</FormHelperText>}

            <Typography variant='h6' sx={{ m: 5 }}>
              Add Reason For Discard
            </Typography>

            <Card sx={{ p: 4, m: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                          <Icon icon='material-symbols-light:close' color='#fff' onClick={() => removeSelectedImage()}>
                            {' '}
                          </Icon>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Card>

            <Card sx={{ p: 4, m: 4, display: 'flex', flexDirection: 'column', gap: 3, mb: 35 }}>
              <Typography variant='h6'>Necropsy Needed ?</Typography>

              <Stack>
                <FormControl>
                  <RadioGroup
                    row
                    aria-labelledby='demo-row-radio-buttons-group-label'
                    name='necropsy_Btn'
                    sx={{ display: 'flex', gap: 4, justifyContent: 'center' }}
                    value={necropsy}
                    onChange={e => setNecropsy(e.target.value)}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 2,
                        border: 1,
                        borderColor: '#c5c6cd',
                        p: 2,
                        borderRadius: '5px',

                        // opacity: 0.6,
                        width: 230,
                        justifyContent: 'space-between'
                      }}
                    >
                      <Typography>Yes</Typography>
                      <FormControlLabel value={true} control={<Radio />} />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 2,
                        border: 1,
                        borderColor: '#839D8D',
                        p: 2,
                        borderRadius: '5px',

                        // opacity: 0.6,
                        width: 230,
                        justifyContent: 'space-between'
                      }}
                    >
                      <Typography>No</Typography>

                      <FormControlLabel value={false} control={<Radio />} />
                    </Box>
                  </RadioGroup>
                </FormControl>
              </Stack>
            </Card>
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
                display: 'flex'
              }}
            >
              <LoadingButton fullWidth variant='contained' type='submit' size='large'>
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
