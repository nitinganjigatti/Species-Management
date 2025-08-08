import { useTheme } from '@emotion/react'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button, Card, CircularProgress, Drawer, IconButton, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import geolocation from 'geolocation'
import React, { useContext, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import { AuthContext } from 'src/context/AuthContext'
import { addSection } from 'src/lib/api/housing'
import * as yup from 'yup'

const schema = yup.object().shape({
  sectionName: yup.string().required('Section name is required'),
  latitude: yup.string().required('Latitude is required'),
  longitude: yup.string().required('Longitude is required')

  // image: yup.mixed().required('Image is required')
})

const AddSectionDrawer = ({ open, setShowAddSectionDrawer, selectedSiteId, setAddSuccessCheck, addSuccessCheck }) => {
  const theme = useTheme()

  const authData = useContext(AuthContext)

  const zooId = authData?.userData?.user?.zoos[0].zoo_id

  const [loading, setLoading] = React.useState(false)

  const {
    control,
    setValue,
    watch,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      sectionName: '',
      images: [],
      latitude: '',
      longitude: ''
    },
    resolver: yupResolver(schema)
  })

  const handleDrawerClose = () => {
    setValue('sectionName', '')
    setValue('images', [])
    setValue('latitude', '')
    setValue('longitude', '')
    setShowAddSectionDrawer(false)
  }

  const images = watch('images')
  const fileInputRef = useRef()

  // const handleFilesChange = files => {
  //   if (!files || files.length === 0) return

  //   const newImages = Array.from(files)
  //     .map(file => {
  //       if (!file.type.startsWith('image/')) {
  //         alert('Please select only image files')

  //         return null
  //       }
  //       if (file.size > 5 * 1024 * 1024) {
  //         alert('File size should be less than 5MB')

  //         return null
  //       }

  //       return URL.createObjectURL(file)
  //     })
  //     .filter(Boolean)

  //   if (newImages.length > 0) {
  //     setValue('images', [...images, ...newImages], { shouldValidate: true })
  //   }
  // }

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

  const onSubmit = async data => {
    setLoading(true)

    const payload = {
      section_name: data?.sectionName,
      section_latitude: data?.latitude,
      section_longitude: data?.longitude,
      site_id: selectedSiteId,
      zoo_id: zooId,
      section_image: data?.images
    }

    // const payload = new FormData()
    // payload.append('section_name', data.sectionName)
    // payload.append('section_latitude', data.latitude)
    // payload.append('section_longitude', data.longitude)
    // payload.append('site_id', selectedSiteId)
    // payload.append('zoo_id', zooId)

    // // Append each file individually
    // data.images.forEach((file, index) => {
    //   payload.append('section_image', file)
    // })

    try {
      const response = await addSection(payload)
      if (response?.success) {
        setLoading(false)
        Toaster({ type: 'success', message: response?.message })
        setShowAddSectionDrawer(false)
        setValue('sectionName', '')
        setValue('images', [])
        setValue('latitude', '')
        setValue('longitude', '')
        setAddSuccessCheck(!addSuccessCheck)
      } else {
        setLoading(false)

        // setShowAddSectionDrawer(false)
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
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

  return (
    <Drawer
      anchor='right'
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '562px'],
          height: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
      open={open}
      onClose={handleDrawerClose}
    >
      <Box
        sx={{
          backgroundColor: 'background.default',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'background.default',
            px: '1.2rem',
            py: '1rem',
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2 }}>
            <img src='/icons/activity_icon.png' alt='Cluster Icon' width='30px' />
            <Typography variant='h6'>Add New Section</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Box sx={{ px: 5, py: 4 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Typography variant='h6' sx={{ mb: 4, color: 'text.secondary' }}>
                Section Name & Image
              </Typography>
              <Box
                sx={{
                  p: 4,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  bgcolor: theme.palette.common.white,
                  mb: 6
                }}
              >
                <Controller
                  name='sectionName'
                  control={control}
                  rules={{
                    required: 'Section Name is required'
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label='Enter Section Name'
                      variant='outlined'
                      fullWidth
                      sx={{ mb: 4 }}
                      placeholder='Enter Section Name'
                      error={!!error}
                      helperText={error ? error.message : null}
                    />
                  )}
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
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 5 }}>
                <Typography variant='h6' sx={{ mb: 4, color: 'text.secondary', mt: 4 }}>
                  Add Location
                </Typography>

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
                    mt: 4,
                    color: 'success.main'
                  }}
                >
                  <Icon icon='ic:baseline-my-location' fontSize={20} />
                  <Typography variant='caption' sx={{ fontSize: '16px', color: '#006D35' }}>
                    Current Location
                  </Typography>
                </Box>
              </Box>
              <Card sx={{ p: 3, boxShadow: 'none', mt: 3, border: '1px solid #C3CEC7' }}>
                <Controller
                  name='longitude'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='Add Longitude'
                      variant='outlined'
                      error={!!errors.longitude}
                      helperText={errors.longitude?.message}
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
                          color: '#839D8D'
                        }
                      }}
                    />
                  )}
                />

                <Controller
                  name='latitude'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='Add Latitude'
                      variant='outlined'
                      error={!!errors.latitude}
                      helperText={errors.latitude?.message}
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
                          color: '#839D8D'
                        }
                      }}
                    />
                  )}
                />
              </Card>
            </form>
          </Box>
        </Box>
        <Box
          sx={{
            p: 5,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: 'background.paper',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10
          }}
        >
          <Button
            variant='contained'
            fullWidth
            size='large'
            sx={{
              py: 1.8,
              bgcolor: '#37BD69'
            }}
            onClick={handleSubmit(onSubmit)}
          >
            {loading ? <CircularProgress size={24} color='inherit' /> : 'ADD'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AddSectionDrawer
