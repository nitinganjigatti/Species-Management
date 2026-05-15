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
import { AddNewSite, editSite, deleteSite } from 'src/lib/api/housing'
import toast from 'react-hot-toast'
import { AuthContext } from 'src/context/AuthContext'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import Toaster from 'src/components/Toaster'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

interface SiteData {
  site_id: number
  site_name: string
  site_description?: string
  latitude?: string
  longitude?: string
  images?: Array<{ file: string; display_type?: string }>
}

interface AddSiteDrawerProps {
  open: boolean
  setSiteDrawer: (open: boolean) => void
  refetch: () => void
  siteData?: SiteData | null // If provided, drawer is in edit mode
}

interface FormValues {
  siteName: string
  siteDescription: string
  latitude: string
  longitude: string
  images: (File | string)[] // Can be File objects or URL strings for existing images
  image?: { file: File; preview: string }
}

// Schema
const schema = yup.object().shape({
  siteName: yup.string().required('Site name is required'),
  siteDescription: yup.string(),
  latitude: yup.string(),
  longitude: yup.string()
})

const AddSiteDrawer: React.FC<AddSiteDrawerProps> = ({ open, setSiteDrawer, refetch, siteData }) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false)
  const theme = useTheme() as any
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const authData = useContext(AuthContext) as any
  const router = useRouter()

  const zooId = authData?.userData?.user?.zoos[0].zoo_id
  const isEditMode = !!siteData

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      siteName: '',
      siteDescription: '',
      latitude: '',
      longitude: '',
      images: []
    },
    resolver: yupResolver(schema) as any
  })

  // Pre-populate form when in edit mode
  useEffect(() => {
    if (isEditMode && siteData) {
      reset({
        siteName: siteData.site_name || '',
        siteDescription: siteData.site_description || '',
        latitude: siteData.latitude || '',
        longitude: siteData.longitude || '',
        images: siteData.images?.map(img => img.file) || []
      })
    }
  }, [isEditMode, siteData, reset])

  const images = watch('images')

  const { getRootProps } = useDropzone({
    multiple: false,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    onDrop: (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = () => {
          setValue('image', { file, preview: reader.result as string })
        }
        reader.readAsDataURL(file)
      }
    }
  })

  const handleAddImageClick = (): void => {
    fileInputRef.current?.click()
  }

  const handleFilesChange = (files: FileList | null): void => {
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

  const handleRemoveImage = (index: number): void => {
    const updatedImages = images.filter((_, i) => i !== index)
    setValue('images', updatedImages, { shouldValidate: true })
  }

  const handleInputImageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setValue('image', { file, preview: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClick = (): void => {
    geolocation.getCurrentPosition((err: GeolocationPositionError | null, position: GeolocationPosition) => {
      if (!err) {
        const { latitude, longitude } = position.coords
        setValue('latitude', latitude.toString())
        setValue('longitude', longitude.toString())
      }
    })
  }

  const onSubmit = async (data: FormValues): Promise<void> => {
    setLoading(true)

    try {
      if (isEditMode && siteData) {
        // Edit mode - only send new File objects, not existing URL strings
        const newImages = data.images.filter(img => img instanceof File) as File[]

        const params = {
          zoo_id: zooId,
          site_id: siteData.site_id,
          site_name: data.siteName,
          site_description: data.siteDescription,
          site_latitude: data.latitude,
          site_longitude: data.longitude,
          site_image: newImages.length > 0 ? newImages : undefined
        }

        const response = (await editSite(params)) as any

        if (response?.success) {
          Toaster({ type: 'success', message: t('housing_module.site_updated') })
          setSiteDrawer(false)
          refetch()
        } else {
          Toaster({ type: 'error', message: response?.message || 'Failed to update site' })
        }
      } else {
        // Add mode
        const params = {
          zoo_id: zooId,
          site_name: data.siteName,
          site_description: data.siteDescription,
          site_latitude: data.latitude,
          site_longitude: data.longitude,
          site_image: data.images.filter(img => img instanceof File) as File[]
        }

        const response = (await AddNewSite(params)) as any

        if (response?.success) {
          Toaster({ type: 'success', message: t('housing_module.site_created') })
          setSiteDrawer(false)
          refetch()
        } else {
          Toaster({ type: 'error', message: response?.message })
        }
      }
    } catch (error) {
      console.error('Submission Error:', error)
      toast.error(
        isEditMode ? 'An error occurred while updating the site' : 'An error occurred while creating the site'
      )
      setSiteDrawer(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSite = async (): Promise<void> => {
    if (!siteData) return

    setDeleteLoading(true)
    try {
      const response = (await deleteSite({ site_id: siteData.site_id })) as any

      if (response?.success) {
        Toaster({ type: 'success', message: t('housing_module.site_deleted') })
        setShowDeleteDialog(false)
        setSiteDrawer(false)
        router.push('/housing/sites')
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to delete site' })
      }
    } catch (error) {
      console.error('Delete Error:', error)
      toast.error('An error occurred while deleting the site')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: '562px' },
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.customColors.lightBg,
            p: 0
          }
        }
      }}
    >
      {/* Header - Sticky */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: theme.palette.customColors.lightBg,
          px: 5,
          py: 4,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <img src='/icons/activity_icon.png' alt='Site Icon' width='30px' />
          <Typography variant='h6'>{isEditMode ? 'Edit Site' : 'Add New Site'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isEditMode && (
            <IconButton size='small' onClick={() => setShowDeleteDialog(true)} sx={{ color: 'error.main' }}>
              <Icon icon='mdi:delete-outline' fontSize={20} />
            </IconButton>
          )}
          <IconButton size='small' onClick={() => setSiteDrawer(false)} sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
      </Box>

      {/* Body - Scrollable */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          px: 5,
          py: 4,
          bgcolor: theme.palette.customColors.lightBg
        }}
      >
        <form id='site-form' onSubmit={handleSubmit(onSubmit)}>
          {/* Site Name & Image */}
          <Typography sx={{ fontFamily: 'Inter', fontSize: '20px', fontWeight: 500 }}>
            {t('housing_module.site_name_image')}
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
                        borderColor: theme.palette.customColors?.OutlineVariant
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.customColors?.OutlineVariant
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.customColors?.OutlineVariant
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
              label={t('housing_module.site_name') as string}
              control={control}
              errors={errors}
              required={false}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.customColors?.OutlineVariant
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.customColors?.OutlineVariant
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.customColors?.OutlineVariant
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
              name='siteDescription'
              label={t('housing_module.site_description') as string}
              control={control}
              errors={errors}
              required={false}
              multiline
              rows={3}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.customColors?.OutlineVariant
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.customColors?.OutlineVariant
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.customColors?.OutlineVariant
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
                        bgcolor: theme.palette.customColors?.displaybgPrimary,
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
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation()
                          handleRemoveImage(index)
                        }}
                        sx={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          background: theme.palette.customColors?.secondaryBg,
                          color: theme.palette.customColors?.OnPrimary,
                          width: 24,
                          height: 24,
                          zIndex: 1,
                          '&:hover': {
                            background: theme.palette.customColors?.OnSurfaceVariant
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
                      border: `2px dashed ${
                        error ? theme.palette.error.main : theme.palette.customColors?.OutlineVariant
                      }`,
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
                        bgcolor: theme.palette.grey[100],
                        borderColor: error ? theme.palette.error.main : theme.palette.grey[400]
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={(e: React.DragEvent<HTMLDivElement>) => {
                      e.preventDefault()
                      handleFilesChange(e.dataTransfer.files)
                    }}
                    onDragOver={(e: React.DragEvent<HTMLDivElement>) => e.preventDefault()}
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
                        {t('drop_images_here')}
                      </Typography>
                    </Box>

                    <input
                      type='file'
                      accept='image/*'
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilesChange(e.target.files)}
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
            <Typography sx={{ fontFamily: 'Inter', ml: 1, fontSize: '20px', fontWeight: 500 }}>
              {t('housing_module.add_location')}
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
                mt: 2,
                color: theme.palette.primary.OnSurface
              }}
            >
              <Icon icon='ic:baseline-my-location' fontSize={20} />
              <Typography variant='caption' sx={{ fontSize: '16px', color: theme.palette.primary.OnSurface }}>
                {t('housing_module.current_location')}
              </Typography>
            </Box>
          </Box>

          <Card
            sx={{ p: 3, boxShadow: 'none', mt: 3, border: `1px solid ${theme.palette.customColors.OutlineVariant}` }}
          >
            <ControlledTextField
              name='longitude'
              label={t('housing_module.add_longitude') as string}
              control={control}
              errors={errors}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.customColors?.OutlineVariant
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
              label={t('housing_module.add_latitude') as string}
              control={control}
              errors={errors}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.customColors?.OutlineVariant
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
        </form>
      </Box>

      {/* Footer - Sticky */}
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          width: '100%',
          p: 5,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          zIndex: 1,
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)',
          flexShrink: 0
        }}
      >
        <LoadingButton
          loading={loading}
          fullWidth
          variant='contained'
          type='submit'
          form='site-form'
          sx={{ height: '50px' }}
        >
          {isEditMode ? 'Update' : 'Add'}
        </LoadingButton>
      </Box>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <ConfirmationDialog
          dialogBoxStatus={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          title={t('housing_module.delete_site')}
          description={t('housing_module.confirm_delete_site')}
          image='/images/warning-icon.svg'
          imgStyle={{ background: theme.palette.customColors?.TertiaryLight, p: 4 }}
          confirmAction={handleDeleteSite}
          loading={deleteLoading}
          ConfirmationText='DELETE'
          cancelText='CANCEL'
          confirmBtnStyle={{ background: theme.palette.customColors?.Error, py: 2 }}
          cancelBtnStyle={{
            borderColor: theme.palette.customColors?.OnPrimaryContainer,
            color: theme.palette.customColors?.OnPrimaryContainer
          }}
        />
      )}
    </Drawer>
  )
}

export default AddSiteDrawer
