'use client'

import { FC, useEffect, useRef, useState } from 'react'

import Image from 'next/image'
import imageUploader from 'public/images/imageUploader/imageUploader.png'

import {
  Box,
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
import { LoadingButton } from '@mui/lab'
import { useTheme } from '@mui/material/styles'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useForm } from 'react-hook-form'

import { useDropzone } from 'react-dropzone'
import Toaster from 'src/components/Toaster'

import Icon from 'src/@core/components/icon'
import { GetEggMaster, AddEggStatusAndCondition } from 'src/lib/api/egg/egg'
import type { DiscardFormProps } from 'src/types/egg/components'

interface DiscardReason {
  id: string | number
  egg_status: string
  egg_status_id?: string | number
  egg_state?: string
}

interface ImgSrcType {
  [key: string]: string | ArrayBuffer | null
}

const DiscardForm: FC<DiscardFormProps> = ({ open, onClose, eggId, onSuccess, refetch }) => {
  const theme = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [discardReason, setDiscardReason] = useState<DiscardReason[]>([])
  const [eggStateID, setEggStateId] = useState<string | number | null>(null)
  const [loader, setLoader] = useState<boolean>(false)
  const [imgSrc, setImgSrc] = useState<(string | ArrayBuffer)[]>([])
  const [imgArr, setImgArr] = useState<File[]>([])
  const [displayFile, setDisplayFile] = useState<string>('')

  const getEggMasterData = async () => {
    try {
      const res = await GetEggMaster()
      if (res.success) {
        const eggState = res?.data?.egg_status?.find((state: any) => state?.egg_status === 'Discard')
        const eggStateId = eggState ? eggState.id : null
        setEggStateId(eggStateId)

        if (eggStateId) {
          const filteredEggStatus = res?.data?.egg_state.filter((status: any) => status.egg_status_id === eggStateId)
          setDiscardReason(filteredEggStatus)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    getEggMasterData()
  }, [])

  const defaultValues = {
    reason: '',
    image: '',
    status_radioBtn: '',
    comment: '',
    necropsy_Btn: 0
  }

  const schema = yup.object().shape({
    status_radioBtn: yup.string().required('State is required'),
    necropsy_Btn: yup.number().required('Necropsy decision is required')
  })

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    clearErrors,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const reason = watch('status_radioBtn')

  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    onDrop: (acceptedFiles: File[]) => {
      acceptedFiles.forEach(file => {
        const reader = new FileReader()

        reader.onload = () => {
          setImgSrc(prev => [...prev, reader.result as string | ArrayBuffer])
        }

        reader.readAsDataURL(file)
      })

      const fileNames = acceptedFiles.map(file => file.name).join(', ')
      setDisplayFile(fileNames)

      setImgArr(prev => [...prev, ...acceptedFiles])

      setValue('image', acceptedFiles)
      clearErrors('image')
    }
  })

  const handleAddImageClick = () => {
    fileInputRef?.current?.click()
  }

  const handleInputImageChange = (file: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = file.target

    if (files && files.length !== 0) {
      Array.from(files).forEach(fileItem => {
        const reader = new FileReader()

        reader.onload = () => {
          setImgSrc(prev => [...prev, reader.result as string | ArrayBuffer])
        }

        reader.readAsDataURL(fileItem)

        setImgArr(prev => [...prev, fileItem])
      })

      const fileNames = Array.from(files)
        .map(f => f.name)
        .join(', ')
      setDisplayFile(fileNames)

      setValue('image', files)
      clearErrors('image')
    }
  }

  const removeSelectedImage = (index: number) => {
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

  const onSubmit = async (values: typeof defaultValues) => {
    setLoader(true)
    try {
      const payload = {
        egg_id: eggId,
        egg_status_id: eggStateID,
        egg_state_id: values.status_radioBtn,
        is_necropsy_needed: values?.necropsy_Btn,
        comment: values?.comment,
        egg_attachment: imgArr
      }

      const res = await AddEggStatusAndCondition(payload)
      if (res.success) {
        reset()
        setImgSrc([])
        onClose()
        setLoader(false)

        Toaster({ type: 'success', message: 'Egg discarded successfully' })

        if (onSuccess) onSuccess()
        if (refetch) refetch()
      } else {
        setLoader(false)
        Toaster({ type: 'error', message: 'Failed to discard the egg' })
      }
    } catch (error) {
      console.error('Error while :', error)
      setLoader(false)
      Toaster({ type: 'error', message: 'An error occurred while Discard' })
    }
  }

  const handelClose = () => {
    onClose()
    reset()
    setImgSrc([])
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
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
                bgcolor: theme.palette.primary.contrastText,
                borderRadius: '8px',
                border: 1,
                borderColor: theme.palette.customColors.OutlineVariant
              }}
            >
              <FormControl error={Boolean(errors.status_radioBtn)}>
                <Controller
                  name='status_radioBtn'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <>
                      {discardReason?.map((item: any, index: any) => (
                        <Box
                          key={item?.id}
                          role='button'
                          tabIndex={0}
                          onClick={() => field.onChange(item?.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              field.onChange(item?.id)
                            }
                          }}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            border: 1,
                            borderColor:
                              field.value === item?.id
                                ? theme.palette.primary.main
                                : theme.palette.customColors.OutlineVariant,
                            backgroundColor: field.value === item?.id ? theme.palette.action.hover : 'transparent',
                            cursor: 'pointer',
                            p: 2,
                            mb: discardReason.length - 1 === index ? 0 : 4,
                            borderRadius: '5px'
                          }}
                        >
                          <Typography>{item?.egg_state}</Typography>
                          <FormControl>
                            <RadioGroup
                              aria-labelledby='demo-controlled-radio-buttons-group'
                              name='status_radioBtn'
                              value={field.value}
                              onChange={field.onChange}
                            >
                              <FormControlLabel label="" value={item?.id} control={<Radio />} sx={{ mr: '0px' }} />
                            </RadioGroup>
                          </FormControl>
                        </Box>
                      ))}
                    </>
                  )}
                />
                {errors.status_radioBtn && (
                  <FormHelperText sx={{ color: 'error.main', m: 5 }}>{(errors.status_radioBtn as any)?.message}</FormHelperText>
                )}
              </FormControl>
            </Box>
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
                bgcolor: theme.palette.primary.contrastText,
                borderRadius: '8px',
                border: 1,
                borderColor: theme.palette.customColors.OutlineVariant
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
                  <FormHelperText sx={{ color: 'error.main' }}>{(errors.comment as any)?.message}</FormHelperText>
                )}
              </FormControl>

              <Grid container sx={{ justifyContent: 'space-between' }}>
                <Grid size={{ md: 12, sm: 12, xs: 12 }}>
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
                      border: `1px dashed ${theme.palette.customColors.OutlineVariant}`,
                      borderRadius: 1,
                      padding: 3
                    }}
                  >
                    <Image alt={'filename'} src={imageUploader} width={50} height={50} />
                    <Typography>Drop your image here</Typography>
                  </Box>
                </Grid>

                <Grid size={{ md: 12, sm: 12, xs: 12 }}>
                  {imgSrc && imgSrc.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mt: 2 }}>
                      {imgSrc.map((src: any, index: any) => (
                        <Box
                          key={index}
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
                              borderRadius: '5%',
                              objectFit: 'cover'
                            }}
                            alt={`Uploaded image ${index}`}
                            src={typeof src === 'string' ? src : String(src)}
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
                              color={theme.palette.primary.contrastText}
                              onClick={() => removeSelectedImage(index)}
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
                bgcolor: theme.palette.primary.contrastText,
                borderRadius: '8px',
                border: 1,
                borderColor: theme.palette.customColors.OutlineVariant
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
                            borderColor: theme.palette.customColors.OutlineVariant,
                            p: 2,
                            borderRadius: '5px',
                            justifyContent: 'space-between'
                          }}
                        >
                          <Typography>Yes</Typography>
                          <FormControlLabel label="" value={1} control={<Radio />} />
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            flexGrow: 1,
                            gap: 2,
                            border: 1,
                            borderColor: theme.palette.customColors.OutlineVariant,
                            p: 2,
                            borderRadius: '5px',
                            justifyContent: 'space-between'
                          }}
                        >
                          <Typography>No</Typography>
                          <FormControlLabel label="" value={0} control={<Radio />} />
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
