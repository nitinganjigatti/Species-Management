import { useTheme } from '@emotion/react'
import {
  Button,
  Card,
  Checkbox,
  CircularProgress,
  Drawer,
  FormControlLabel,
  IconButton,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import React, { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useDropzone } from 'react-dropzone'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { getAnimalGetconfigs } from 'src/lib/api/egg/egg/createAnimal'
import { addAnimalIdentifier, deleteAnimalIdentifier, editAnimalIdentifier } from 'src/lib/api/housing'

import { QueryClient } from '@tanstack/react-query'
import Toaster from 'src/components/Toaster'

const schema = yup.object().shape({
  localIdentifierType: yup.string().required('Local Identifier Type is required'),
  localIdentifier: yup.string().required('LocalIdentifier is required')
})

const AddIdentifierDrawer = ({ open, setOpen, identifierData, animalId, localIdentifierTypeData, setIdentifierData, refetch }) => {
  const theme = useTheme()
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      localIdentifierType: '',
      localIdentifier: '',
      images: [],
      makePrimary: false
    },
    resolver: yupResolver(schema)
  })

  // Populate form fields when editing
  useEffect(() => {
    if (identifierData) {
      setValue('localIdentifierType', identifierData.type || '')
      setValue('localIdentifier', identifierData.local_identifier_value || '')
      setValue('makePrimary', identifierData.is_primary === "1")

      if (identifierData.images && identifierData.images.length > 0) {
        setValue('images', identifierData.images)
      }
    } else {
      setValue('localIdentifierType', '')
      setValue('localIdentifier', '')
      setValue('makePrimary', false)
      setValue('images', [])
    }
  }, [identifierData, setValue, localIdentifierTypeData])

  const handleDrawerClose = () => {
    setOpen(false)
    setIdentifierData(null)
  }

  const images = watch('images')

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
      setValue('images', [...images, ...validFiles], { shouldValidate: true })
    }
  }

  const handleRemoveImage = index => {
    const updatedImages = images.filter((_, i) => i !== index)
    setValue('images', updatedImages, { shouldValidate: true })
  }

  const onSubmit = async data => {
    const params = {
      animal_id: animalId,
      type: data?.localIdentifierType,
      value: data?.localIdentifier,
      is_primary: data?.makePrimary ? 1 : 0,
      identifier_attachment: data?.images
    }

    console.log(params, "params")

    try {
      setLoading(true)
      if (identifierData === null) {
        await addAnimalIdentifier(params).then(res => {
          if (res?.success) {
            Toaster({ type: 'success', message: res?.message })
            setLoading(false)
            setOpen(false)
            refetch()
          } else {
            Toaster({ type: 'error', message: res?.message })
            setLoading(false)
          }
        })
      } else {
        const editParams = {
          ...params,
          identifier_id: identifierData.id
        }
        await editAnimalIdentifier(editParams).then(res => {
          if (res?.success) {
            setLoading(false)
            setOpen(false)
            Toaster({ type: 'success', message: res?.message })
            refetch()
          } else {
            Toaster({ type: 'error', message: res?.message })
            setLoading(false)
          }
        })
      }
    } catch (error) {
      console.error(error, `Cannot ${identifierData === null ? 'Add' : 'Edit'} the Local Identifier`)
      setLoading(false)
    }

  }

  const onDeleteDialogClose = () => {
    setOpenDeleteDialog(false)
  }

  const handleDelete = async () => {
    const params = {
      identifier_id: identifierData?.id,
      type: 'delete'
    }

    try {
      setDeleteLoading(true)
      await deleteAnimalIdentifier(params).then(res => {
        if (res?.success === true) {
          setDeleteLoading(false)
          setOpenDeleteDialog(false)
          setOpen(false)
          Toaster({ type: 'success', message: res?.message })
          refetch()
        } else {
          Toaster({ type: 'error', message: res?.message })
          setOpenDeleteDialog(false)
          setDeleteLoading(false)
        }
      })
    } catch (error) {
      console.error(error, "Cannot delete the Identifier")
      setDeleteLoading(false)
    }
  }

  return (
    <>
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
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#EFF5F2',
            px: '1.2rem',
            py: '1rem',
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2 }}>
            <img src='/icons/activity_icon.png' alt='Cluster Icon' width='30px' />
            <Typography variant='h6'>{identifierData !== null ? 'Edit' : 'Add'} Local Identifier</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto', background: '#EFF5F2' }}>
          <Box sx={{ px: 6, py: 4 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Card
                sx={{
                  p: 6,
                  boxShadow: 'none',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
              >
                <ControlledSelect
                  name={'localIdentifierType'}
                  control={control}
                  label={'Local Identifier Type*'}
                  required={true}
                  errors={errors}
                  options={localIdentifierTypeData}
                  getOptionLabel={option => option.label}
                  getOptionValue={option => option.value}
                  disabled={identifierData !== null}
                />
                <ControlledTextField
                  name={'localIdentifier'}
                  control={control}
                  label={'Local Identifier*'}
                  required={true}
                  inputProps={{ placeholder: 'Local Identifier*' }}
                  errors={errors}
                />
                <Controller
                  name='makePrimary'
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={field.value} />}
                      label='Make Primary'
                    />
                  )}
                />
              </Card>
              <Box sx={{ mt: 6 }}>
                <Typography
                  sx={{ mb: 3, color: theme.palette.customColors.OnSurfaceVariant, fontSize: '20px', fontWeight: 500 }}
                >
                  Upload Image
                </Typography>
                <Card
                  sx={{
                    p: 6,
                    boxShadow: 'none',
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                  }}
                >
                  <Box>
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
                                background: '#eaf6f6',
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
                                background: '#F5F5F5',
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
                </Card>
              </Box>
            </form>
          </Box>
        </Box>
        <Box
          sx={{
            py: 8,
            px: 6,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: 'background.paper',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5
          }}
        >
          {identifierData !== null && (
            <Button
              variant='outlined'
              fullWidth
              size='large'
              sx={{
                py: 2,
                border: `1px solid ${theme.palette.customColors.Error}`,
                color: theme.palette.customColors.Error
              }}
              onClick={() => setOpenDeleteDialog(true)}
            >
              DELETE
            </Button>
          )}
          <Button
            variant='contained'
            fullWidth
            size='large'
            sx={{
              py: 2,
              background: '#37BD69'
            }}
            onClick={handleSubmit(onSubmit)}
          >
            {loading ? <CircularProgress size={24} color='inherit' /> : 'SUBMIT'}
          </Button>
        </Box>
      </Drawer>
      {openDeleteDialog && (
        <ConfirmationDialog
          dialogBoxStatus={openDeleteDialog}
          onClose={onDeleteDialogClose}
          title={'Are your sure you want to delete this local identifier?'}
          cancelText={'NO'}
          confirmBtnStyle={{ background: theme.palette.customColors.Error, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          confirmAction={handleDelete}
          loading={deleteLoading}
        />
      )}
    </>
  )
}

export default AddIdentifierDrawer
