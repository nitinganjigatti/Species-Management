import { useTheme } from '@emotion/react'
import { Button, Card, Checkbox, CircularProgress, Drawer, IconButton, Switch, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import SingleDatePicker from 'src/components/SingleDatePicker'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import toast from 'react-hot-toast'

const AnimalMortalityEditDrawer = ({ open, setDrawerOpen }) => {
  const theme = useTheme()

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      timeOfDiscovery: '',
      dateOfDiscovery: '',
      images: [],
      mannerOfDeath: '',
      carcassCondition: '',
      carcassDisposition: '',
      necropsyNeed: '',
      priority: '',
      notes: ''
    }
  })

  const images = watch('images')
  const fileInputRef = useRef()

  const [mannerOfDeath, setMannerOfDeath] = useState([])
  const [carcassCondition, setCarcassCondition] = useState([])
  const [carcassDeposition, setCarcassDeposition] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('')

  const handleDrawerClose = () => {
    setDrawerOpen(false)
  }

  const handleSelectedTypeChange = type => {
    setSelectedType(type)
  }

  const handleRemoveImage = index => {
    const updatedImages = images.filter((_, i) => i !== index)
    setValue('images', updatedImages, { shouldValidate: true })
  }

  const handleFilesChange = files => {
    if (!files || files.length === 0) return

    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select only image files')

        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB')

        return false
      }

      return true
    })

    if (validFiles.length > 0) {
      setValue('images', [...images, ...validFiles], { shouldValidate: true })
    }
  }

  const onSubmit = async data => {}

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
            py: '1rem'
          }}
        >
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2 }}>
            <img src='/icons/activity_icon.png' alt='Cluster Icon' width='30px' />
            <Typography variant='h6'> Edit Mortality</Typography>
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography>Enter Details</Typography>
                <Card
                  sx={{
                    p: 6,
                    boxShadow: 'none',
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}
                >
                  <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#44544A' }}>
                    Date and Time of Discovery
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 4 }}>
                    <SingleDatePicker />
                    <SingleDatePicker />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '2.5px' }}>
                    <Checkbox />
                    <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#44544A' }}>
                      Mark this Date as Approximate
                    </Typography>
                  </Box>
                </Card>
              </Box>
              <Card
                sx={{
                  p: 6,
                  boxShadow: 'none',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  mt: 6
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#44544A' }}>Manner of Death</Typography>
                  <ControlledSelect
                    name={'mannerOfDeath'}
                    control={control}
                    label={'Manner Of Death'}
                    required={true}
                    errors={errors}
                    options={mannerOfDeath}
                    getOptionLabel={option => option.label}
                    getOptionValue={option => option.value}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#44544A' }}>
                    Carcass Condition
                  </Typography>
                  <ControlledSelect
                    name={'carcassCondition'}
                    control={control}
                    label={'Carcass Condition'}
                    required={true}
                    errors={errors}
                    options={carcassCondition}
                    getOptionLabel={option => option.label}
                    getOptionValue={option => option.value}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#44544A' }}>
                    Carcass Deposition
                  </Typography>
                  <ControlledSelect
                    name={'carcassDeposition'}
                    control={control}
                    label={'Carcass Deposition'}
                    required={true}
                    errors={errors}
                    options={carcassDeposition}
                    getOptionLabel={option => option.label}
                    getOptionValue={option => option.value}
                  />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 3,
                    borderRadius: 1,
                    border: `1px solid #C3CEC7`,
                    py: 2,
                    mt: 2
                  }}
                >
                  <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>Necropsy Need</Typography>
                  <Switch />
                </Box>
              </Card>
              <Card
                sx={{
                  p: 6,
                  boxShadow: 'none',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  mt: 6
                }}
              >
                <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#44544A' }}>Set Priority</Typography>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row', gap: 4 }}>
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      px: 4,
                      py: 2,
                      borderRadius: 0.5,
                      border:
                        selectedType === 'Low'
                          ? `2px solid ${theme.palette.primary.main}`
                          : `1px solid ${theme.palette.divider}`,
                      bgcolor: selectedType === 'Low' ? theme.palette.action.selected : theme.palette.common.white,
                      cursor: 'pointer',
                      transition: 'border-color 0.2s, background-color 0.2s'
                    }}
                    onClick={() => handleSelectedTypeChange('Low')}
                  >
                    <Typography sx={{ flex: 1, color: selectedType === 'Low' ? 'text.primary' : 'text.secondary' }}>
                      Low
                    </Typography>
                    <input
                      type='radio'
                      name='priority'
                      checked={selectedType === 'Low'}
                      onChange={() => handleSelectedTypeChange('Low')}
                      style={{ display: 'none' }}
                    />
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: `2px solid ${
                          selectedType === 'Low' ? theme.palette.primary.main : theme.palette.divider
                        }`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ml: 2
                      }}
                    >
                      {selectedType === 'Low' && (
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: theme.palette.primary.main
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Batch Option */}
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      px: 4,
                      py: 2,
                      borderRadius: 0.5,
                      border:
                        selectedType === 'High'
                          ? `2px solid ${theme.palette.primary.main}`
                          : `1px solid ${theme.palette.divider}`,
                      bgcolor: selectedType === 'High' ? theme.palette.action.selected : theme.palette.common.white,
                      cursor: 'pointer',
                      transition: 'border-color 0.2s, background-color 0.2s'
                    }}
                    onClick={() => handleSelectedTypeChange('High')}
                  >
                    <Typography sx={{ flex: 1, color: selectedType === 'High' ? 'text.primary' : 'text.secondary' }}>
                      High
                    </Typography>
                    <input
                      type='radio'
                      name='priority'
                      checked={selectedType === 'High'}
                      onChange={() => handleSelectedTypeChange('High')}
                      style={{ display: 'none' }}
                    />
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: `2px solid ${
                          selectedType === 'High' ? theme.palette.primary.main : theme.palette.divider
                        }`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ml: 2
                      }}
                    >
                      {selectedType === 'High' && (
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: theme.palette.primary.main
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              </Card>
              <Card
                sx={{
                  p: 6,
                  boxShadow: 'none',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  mt: 6
                }}
              >
                <ControlledTextField name={'notes'} control={control} label={'Enter Notes'} />
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
    </>
  )
}

export default AnimalMortalityEditDrawer
