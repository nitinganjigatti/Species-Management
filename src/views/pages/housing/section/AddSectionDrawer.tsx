import { useTheme } from '@emotion/react'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button, Card, CircularProgress, Drawer, IconButton, TextField, Typography } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { Box } from '@mui/system'
import geolocation from 'geolocation'
import React, { useContext, useRef, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { AuthContext } from 'src/context/AuthContext'
import { addSection, editSection, deleteSection } from 'src/lib/api/housing'
import * as yup from 'yup'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

interface SectionData {
  section_id: number
  section_name: string
  section_site_id: number
  section_latitude?: string
  section_longitude?: string
  images?: Array<{ file: string; display_type?: string }>
}

interface AddSectionDrawerProps {
  open: boolean
  setShowAddSectionDrawer: (open: boolean) => void
  selectedSiteId: string
  setAddSuccessCheck: (check: boolean) => void
  addSuccessCheck: boolean
  sectionData?: SectionData | null // If provided, drawer is in edit mode
  refetch?: () => void
}

interface FormValues {
  sectionName: string
  images: (File | string)[] // Can be File objects or URL strings for existing images
  latitude: string
  longitude: string
}

const schema = yup.object().shape({
  sectionName: yup.string().required('Section name is required'),
  latitude: yup.string(),
  longitude: yup.string()
})

const AddSectionDrawer: React.FC<AddSectionDrawerProps> = ({
  open,
  setShowAddSectionDrawer,
  selectedSiteId,
  setAddSuccessCheck,
  addSuccessCheck,
  sectionData,
  refetch
}) => {
  const theme = useTheme() as any
  const router = useRouter()
  const { t } = useTranslation()

  const authData = useContext(AuthContext) as any

  const zooId = authData?.userData?.user?.zoos[0].zoo_id
  const isEditMode = !!sectionData

  const [loading, setLoading] = React.useState<boolean>(false)
  const [deleteLoading, setDeleteLoading] = React.useState<boolean>(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState<boolean>(false)

  const {
    control,
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      sectionName: '',
      images: [],
      latitude: '',
      longitude: ''
    },
    resolver: yupResolver(schema) as any
  })

  // Pre-populate form when in edit mode
  useEffect(() => {
    if (isEditMode && sectionData) {
      reset({
        sectionName: sectionData.section_name || '',
        latitude: sectionData.section_latitude || '',
        longitude: sectionData.section_longitude || '',
        images: sectionData.images?.map(img => img.file) || []
      })
    }
  }, [isEditMode, sectionData, reset])

  const handleDrawerClose = (): void => {
    setValue('sectionName', '')
    setValue('images', [])
    setValue('latitude', '')
    setValue('longitude', '')
    setShowAddSectionDrawer(false)
  }

  const images = watch('images')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const onSubmit = async (data: FormValues): Promise<void> => {
    setLoading(true)

    try {
      if (isEditMode && sectionData) {
        // Edit mode - only send new File objects, not existing URL strings
        const newImages = data.images.filter(img => img instanceof File) as File[]

        const payload = {
          section_id: sectionData.section_id,
          section_name: data.sectionName,
          section_site_id: sectionData.section_site_id,
          section_latitude: data.latitude,
          section_longitude: data.longitude,
          section_image: newImages.length > 0 ? newImages : undefined
        }

        const response = (await editSection(payload)) as any

        if (response?.success) {
          Toaster({ type: 'success', message: t('housing_module.section_updated') })
          setShowAddSectionDrawer(false)
          if (refetch) refetch()
          setAddSuccessCheck(!addSuccessCheck)
        } else {
          Toaster({ type: 'error', message: response?.message || 'Failed to update section' })
        }
      } else {
        // Add mode
        const payload = {
          section_name: data.sectionName,
          section_latitude: data.latitude,
          section_longitude: data.longitude,
          site_id: selectedSiteId,
          zoo_id: zooId,
          section_image: data.images.filter(img => img instanceof File) as File[]
        }

        const response = (await addSection(payload)) as any
        if (response?.success) {
          Toaster({ type: 'success', message: response?.message })
          setShowAddSectionDrawer(false)
          setValue('sectionName', '')
          setValue('images', [])
          setValue('latitude', '')
          setValue('longitude', '')
          setAddSuccessCheck(!addSuccessCheck)
        } else {
          Toaster({ type: 'error', message: response?.message })
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error(
        isEditMode ? 'An error occurred while updating the section' : 'An error occurred while creating the section'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSection = async (): Promise<void> => {
    if (!sectionData) return

    setDeleteLoading(true)
    try {
      const response = (await deleteSection({ section_id: sectionData.section_id })) as any

      if (response?.success) {
        Toaster({ type: 'success', message: t('housing_module.section_deleted') })
        setShowDeleteDialog(false)
        setShowAddSectionDrawer(false)
        router.push(`/housing/sites/${sectionData.section_site_id}`)
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to delete section' })
      }
    } catch (error) {
      console.error('Delete Error:', error)
      toast.error('An error occurred while deleting the section')
    } finally {
      setDeleteLoading(false)
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

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={handleDrawerClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: '562px' },
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'background.default',
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
          backgroundColor: 'background.default',
          px: 5,
          py: 4,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <img src='/icons/activity_icon.png' alt='Section Icon' width='30px' />
          <Typography variant='h6'>{isEditMode ? 'Edit Section' : 'Add New Section'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isEditMode && (
            <IconButton size='small' onClick={() => setShowDeleteDialog(true)} sx={{ color: 'error.main' }}>
              <Icon icon='mdi:delete-outline' fontSize={20} />
            </IconButton>
          )}
          <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
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
          py: 4
        }}
      >
        <form id='section-form' onSubmit={handleSubmit(onSubmit)}>
          <Typography variant='h6' sx={{ mb: 4, color: 'text.secondary' }}>
            {t('housing_module.section_name_image')}
          </Typography>
          <Box
            sx={{
              p: 4,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              bgcolor: theme.palette.customColors?.OnPrimary,
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
                  label={t('housing_module.enter_section_name')}
                  variant='outlined'
                  fullWidth
                  sx={{ mb: 4 }}
                  placeholder={t('housing_module.enter_section_name') as string}
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
                      multiple
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
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 5 }}>
            <Typography variant='h6' sx={{ mb: 4, color: 'text.secondary', mt: 4 }}>
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
                mt: 4,
                color: 'success.main'
              }}
            >
              <Icon icon='ic:baseline-my-location' fontSize={20} />
              <Typography variant='caption' sx={{ fontSize: '16px', color: theme.palette.primary.dark }}>
                {t('housing_module.current_location')}
              </Typography>
            </Box>
          </Box>
          <Card
            sx={{ p: 3, boxShadow: 'none', mt: 3, border: `1px solid ${theme.palette.customColors?.OutlineVariant}` }}
          >
            <Controller
              name='longitude'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={t('housing_module.add_longitude')}
                  variant='outlined'
                  error={!!errors.longitude}
                  helperText={errors.longitude?.message}
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
                      color: theme.palette.customColors?.Outline
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
                  label={t('housing_module.add_latitude')}
                  variant='outlined'
                  error={!!errors.latitude}
                  helperText={errors.latitude?.message}
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
                      color: theme.palette.customColors?.Outline
                    }
                  }}
                />
              )}
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
          form='section-form'
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
          title={t('housing_module.delete_section')}
          description={t('housing_module.confirm_delete_section')}
          image='/images/warning-icon.svg'
          imgStyle={{ background: theme.palette.customColors?.TertiaryLight, p: 4 }}
          confirmAction={handleDeleteSection}
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

export default AddSectionDrawer
