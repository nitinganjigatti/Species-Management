import {
  Box,
  Button,
  Card,
  CardContent,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  TextField,
  Typography,
  Divider,
  Grid
} from '@mui/material'
import { useTheme } from '@emotion/react'
import Icon from 'src/@core/components/icon'
import { useDropzone } from 'react-dropzone'
import imageUploader from 'public/images/imageUploader/imageUploader.png'
import Image from 'next/image'
import { useRef, useState, useEffect, useContext } from 'react'
import { LoadingButton } from '@mui/lab'
import geolocation from 'geolocation'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { AddNewSite } from 'src/lib/api/housing'
import toast from 'react-hot-toast'
import { AuthContext } from 'src/context/AuthContext'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import Toaster from 'src/components/Toaster'

// Schema
const schema = yup.object().shape({
  siteName: yup.string().required('Site name is required'),
  latitude: yup.string(),
  longitude: yup.string()

  // image: yup.mixed().required('Image is required')
})

const AddSiteDrawer = ({ open, setSiteDrawer, refetch }) => {
  const [loading, setLoading] = useState(false)
  const theme = useTheme()
  const fileInputRef = useRef(null)
  const authData = useContext(AuthContext)

  const zooId = authData?.userData?.user?.zoos[0].zoo_id

  console.log('Auth >', authData, zooId)

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      siteName: '',
      latitude: '',
      longitude: '',
      images: []
    },
    resolver: yupResolver(schema)
  })

  const images = watch('images')

  const { getRootProps } = useDropzone({
    multiple: false,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    onDrop: acceptedFiles => {
      const file = acceptedFiles[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = () => {
          setValue('image', { file, preview: reader.result })
        }
        reader.readAsDataURL(file)
      }
    }
  })

  const handleAddImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFilesChange = files => {
    if (!files || files.length === 0) return

    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        alert('Please select only image files')

        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB')

        return false
      }

      return true
    })

    if (validFiles.length > 0) {
      // Store File objects, not URLs
      setValue('images', [...images, ...validFiles], { shouldValidate: true })
    }
  }

  const handleRemoveImage = index => {
    const updatedImages = images.filter((_, i) => i !== index)
    setValue('images', updatedImages, { shouldValidate: true })
  }

  const handleInputImageChange = e => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setValue('image', { file, preview: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClick = () => {
    geolocation.getCurrentPosition((err, position) => {
      if (!err) {
        const { latitude, longitude } = position.coords
        setValue('latitude', latitude.toString())
        setValue('longitude', longitude.toString())
      }
    })
  }

  const onSubmit = async data => {
    setLoading(true)

    const params = {
      zoo_id: zooId,
      site_name: data?.siteName,
      site_latitude: data?.latitude,
      site_longitude: data?.longitude,
      site_image: data?.images
    }

    try {
      const response = await AddNewSite(params)

      if (response?.success) {
        Toaster({ type: 'success', message: 'New Site Is Created Successfully' })
        setSiteDrawer(false)
        refetch()
      } else {
        Toaster({ type: 'error', message: response?.message })

        // setSiteDrawer(false)
      }
    } catch (error) {
      console.error('Submission Error:', error)
      toast.error('An error occurred while creating the site')
      setSiteDrawer(false)
    } finally {
      setLoading(false)
    }

    // Send `data` to backend
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: theme.palette.customColors.lightBg,
          px: '1.2rem',
          py: '1rem',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2 }}>
          <img src='/icons/activity_icon.png' alt='Site Icon' width='30px' />
          <Typography variant='h6'>Add New</Typography>
        </Box>
        <IconButton size='small' onClick={() => setSiteDrawer(false)} sx={{ color: 'text.primary' }}>
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Box
          className='sidebar-body'
          sx={{ px: 4, flexGrow: 1, height: '700px', bgcolor: theme.palette.customColors.lightBg }}
        >
          {/* Site Name & Image */}
          <Typography sx={{ fontFamily: 'Inter', fontSize: '20px', fontWeight: 500, pt: '1rem' }}>
            Site Name & Image
          </Typography>

          <Card
            sx={{ p: 3, mt: 3, boxShadow: 'none', border: `1px solid ${theme.palette.customColors.OutlineVariant}` }}
          >
            {/* <Controller
              name='siteName'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Site Name'
                  variant='outlined'
                  error={!!errors.siteName}
                  helperText={errors.siteName?.message}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0'
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      fontWeight: 400,
                      fontFamily: 'Inter',
                      color: theme.palette.customColors.Outline
                    }
                  }}
                />
              )}
            /> */}
            <ControlledTextField
              name='siteName'
              label='Site Name'
              control={control}
              errors={errors}
              required={false} // or true if required
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E0E0E0'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E0E0E0'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E0E0E0'
                  }
                },
                '& .MuiInputBase-input': {
                  fontSize: '16px',
                  fontWeight: 400,
                  fontFamily: 'Inter',
                  color: theme.palette.customColors.Outline
                }
              }}
            />

            {images.length > 0 && (
              <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {images.map((img, index) => {
                  const previewUrl = typeof img === 'string' ? img : URL.createObjectURL(img)

                  return (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        width: 100,
                        height: 100,
                        borderRadius: 1,
                        bgcolor: '#eaf6f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <img
                        src={previewUrl}
                        alt={`Cluster ${index}`}
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: '50%',
                          display: 'block'
                        }}
                      />
                      <IconButton
                        size='small'
                        onClick={e => {
                          e.stopPropagation()
                          handleRemoveImage(index)
                        }}
                        sx={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          background: '#979797',
                          color: '#fff',
                          width: 24,
                          height: 24,
                          zIndex: 1,
                          '&:hover': {
                            background: '#757575'
                          }
                        }}
                      >
                        <Icon icon='mdi:close' fontSize={18} />
                      </IconButton>
                    </Box>
                  )
                })}
              </Box>
            )}
            <Controller
              name='images'
              control={control}
              render={({ fieldState: { error } }) => (
                <Box>
                  <Box
                    sx={{
                      border: `2px dashed ${error ? theme.palette.error.main : '#E0E0E0'}`,
                      borderRadius: 1.2,
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      '&:hover': {
                        bgcolor: '#F5F5F5',
                        borderColor: error ? theme.palette.error.main : '#BDBDBD'
                      }
                    }}
                    onClick={() => fileInputRef.current.click()}
                    onDrop={e => {
                      e.preventDefault()
                      handleFilesChange(e.dataTransfer.files)
                    }}
                    onDragOver={e => e.preventDefault()}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.6,
                        gap: 2
                      }}
                    >
                      <img src='/images/housing/gallery-add.svg' alt='Add Image Icon' width='30px' />
                      <Typography variant='body2' color='textSecondary' sx={{ fontWeight: 400 }}>
                        Drop your images here
                      </Typography>
                    </Box>

                    <input
                      type='file'
                      accept='image/*'
                      multiple
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={e => handleFilesChange(e.target.files)}
                    />
                  </Box>
                  {error && (
                    <Typography variant='caption' color='error' sx={{ mt: 1, display: 'block' }}>
                      {error.message}
                    </Typography>
                  )}
                </Box>
              )}
            />
          </Card>

          {/* Add Location */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 5 }}>
            <Typography sx={{ fontFamily: 'Inter', ml: 1, fontSize: '20px', fontWeight: 500 }}>Add Location</Typography>

            <Box
              onClick={handleClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                fontFamily: 'Inter',
                fontSize: '14px',
                fontWeight: 500,
                mt: 2,
                color: theme.palette.primary.OnSurface
              }}
            >
              <Icon icon='ic:baseline-my-location' fontSize={20} />
              <Typography variant='caption' sx={{ fontSize: '16px', color: theme.palette.primary.OnSurface }}>
                Current Location
              </Typography>
            </Box>
          </Box>

          <Card
            sx={{ p: 3, boxShadow: 'none', mt: 3, border: `1px solid ${theme.palette.customColors.OutlineVariant}` }}
          >
            <ControlledTextField
              name='longitude'
              label='Add Longitude'
              control={control}
              errors={errors}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E0E0E0'
                  }
                },
                '& .MuiInputBase-input': {
                  fontSize: '16px',
                  fontWeight: 400,
                  fontFamily: 'Inter',
                  color: theme.palette.customColors.Outline
                }
              }}
            />

            <ControlledTextField
              name='latitude'
              label='Add Latitude'
              control={control}
              errors={errors}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E0E0E0'
                  }
                },
                '& .MuiInputBase-input': {
                  fontSize: '16px',
                  fontWeight: 400,
                  fontFamily: 'Inter',
                  color: theme.palette.customColors.Outline
                }
              }}
            />
          </Card>
        </Box>

        {/* Footer Button */}
        <Card>
          <Box
            sx={{
              height: '100px',
              width: '100%',
              maxWidth: '562px',
              position: 'fixed',
              bottom: 0,
              zIndex: 1,
              px: 4,
              bgcolor: 'white',
              alignItems: 'center',
              justifyContent: 'center',
              display: 'flex'
            }}
          >
            <LoadingButton loading={loading} fullWidth variant='contained' type='submit' sx={{ height: '50px' }}>
              Add
            </LoadingButton>
          </Box>
        </Card>
      </form>
    </Drawer>
  )
}

export default AddSiteDrawer
