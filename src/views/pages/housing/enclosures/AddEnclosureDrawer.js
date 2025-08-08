import { useTheme } from '@emotion/react'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button, CircularProgress, Drawer, IconButton, TextField, Typography } from '@mui/material'
import { Box, fontSize } from '@mui/system'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import { AuthContext } from 'src/context/AuthContext'
import {
  addEnclosureToHousing,
  getEnclosureSetting,
  getParentEnclosureList,
  getSectionsListingForEnclosure
} from 'src/lib/api/housing'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import * as yup from 'yup'

const schema = yup.object().shape({
  enclosureName: yup.string().required('Enclosure name is required'),
  environmentType: yup.string().required('Environment type is required'),
  enclosureType: yup
    .object({
      value: yup.string().required('Enclosure type is required'),
      label: yup.string().required()
    })
    .required('Enclosure type is required')
    .nullable(),
  section: yup
    .object({
      value: yup.string().required('Section is required'),
      label: yup.string().required()
    })
    .required('Section is required')
    .nullable()

  // movableOrWalkable: yup.string().required('Movable or Walkable is required')
})

const sunlightOptions = [
  { value: 'Moderate', label: 'Moderate' },
  { value: 'God', label: 'God' },
  { value: 'Bad', label: 'Bad' }
]

const AddEnclosureDrawer = ({
  setAddEnclosureDrawerOpen,
  open,
  sectionId,
  zooId,
  refetchEnclosure,
  setRefechEnclosure
}) => {
  const theme = useTheme()

  const authData = useContext(AuthContext)
  const user_id = authData?.userData?.user?.user_id

  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('Single')
  const [movableOrWalkable, setMovableOrWalkable] = useState('')
  const [environmentTypes, setEnvironmentTypes] = useState([])
  const [allEnclosureData, setAllEnclosureData] = useState(null)
  const [filteredEnclosureTypes, setFilteredEnclosureTypes] = useState([])
  const [sectionList, setSectionList] = useState([])
  const [parentEnclosureList, setParentEnclosureList] = useState([])
  const [currentSectionId, setCurrentSectionId] = useState(sectionId)

  const {
    control,
    setValue,
    watch,
    handleSubmit,
    trigger,
    reset,
    getValues,
    formState: { errors }
  } = useForm({
    defaultValues: {
      enclosureName: '',
      environmentType: '',
      enclosureType: null,
      parentEnclosure: '',
      movableOrWalkable: '',
      sunlight: '',
      commissionedDate: new Date().toISOString().split('T')[0],
      images: [],
      batchEnclosureCount: '',
      batchSequenceStart: '',
      section: sectionId || null,
      notes: ''
    },
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    context: { selectedType }
  })

  const resetAllFields = () => {
    reset({
      enclosureName: '',
      environmentType: '',
      enclosureType: null,
      parentEnclosure: '',
      movableOrWalkable: '',
      sunlight: '',
      commissionedDate: '',
      images: [],
      batchEnclosureCount: '',
      batchSequenceStart: '',
      notes: '',
      section: sectionId || null
    })

    setSelectedType('Single')
    setMovableOrWalkable('')
    setFilteredEnclosureTypes([])
    setSectionList([])
    setCurrentSectionId(sectionId)
  }

  const handleDrawerClose = () => {
    resetAllFields()
    const currentImages = getValues('images')
    if (currentImages && currentImages.length > 0) {
      currentImages.forEach(img => {
        if (typeof img !== 'string' && img instanceof File) {
          try {
            URL.revokeObjectURL(img)
          } catch (e) {}
        }
      })
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setAddEnclosureDrawerOpen(false)
  }
  const images = watch('images')
  const selectedSection = watch('section')
  const fileInputRef = useRef()

  const handleSectionChange = newSection => {
    if (newSection && newSection.value !== currentSectionId) {
      setCurrentSectionId(newSection.value)
      setValue('parentEnclosure', null, { shouldValidate: true })
    }
  }

  useEffect(() => {
    if (selectedSection) {
      handleSectionChange(selectedSection)
    }
  }, [selectedSection])

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

  const handleRemoveImage = index => {
    const updatedImages = images.filter((_, i) => i !== index)
    setValue('images', updatedImages, { shouldValidate: true })
  }

  const handleSelectedTypeChange = type => {
    setSelectedType(type)
    setTimeout(() => {
      trigger(['batchEnclosureCount', 'batchSequenceStart'])
    }, 0)
  }

  const handleMovableWalkableChange = type => {
    setMovableOrWalkable(type)
    setValue('movableOrWalkable', type, { shouldValidate: true })
  }

  const fetchEnclosureSettings = async () => {
    try {
      await getEnclosureSetting().then(res => {
        if (res?.success) {
          setEnvironmentTypes(
            res?.data?.environment_type
              ?.filter(item => item?.enabled)
              ?.map(item => ({
                value: item.string_id,
                label: item?.name
              }))
          )
          setAllEnclosureData(res?.data)
        }
      })
    } catch (error) {
      console.error('Error fetching enclosure settings:', error)
    }
  }

  const fetchSectionList = async () => {
    const params = {
      zoo_id: zooId,
      ignore_sys_gen: 1
    }
    try {
      await getSectionsListingForEnclosure(params).then(res => {
        if (res?.success) {
          setSectionList(
            res?.data?.map(section => ({
              value: section?.section_id,
              label: section?.section_name
            }))
          )
        }
      })
    } catch (error) {
      console.error('Error fetching section list:', error)
    }
  }

  const fetchParentEnclosureList = async sectionIdToUse => {
    if (!sectionIdToUse) {
      setParentEnclosureList([])

      return
    }

    const params = {
      section_id: sectionIdToUse,
      ignore_sys_gen: 1
    }

    try {
      await getParentEnclosureList(params).then(res => {
        if (res?.is_success) {
          setParentEnclosureList(
            res?.data?.map(enclosure => ({
              value: enclosure?.enclosure_id,
              label: enclosure?.user_enclosure_name
            }))
          )
        }
      })
    } catch (error) {
      console.error('Error fetching parent enclosure list:', error)
      setParentEnclosureList([])
    }
  }

  useEffect(() => {
    fetchParentEnclosureList(currentSectionId)
  }, [currentSectionId])

  useEffect(() => {
    fetchEnclosureSettings()
    fetchSectionList()
  }, [])

  useEffect(() => {
    if (open && sectionId && sectionList.length > 0) {
      const defaultSection = sectionList.find(option => option.value === sectionId)
      setValue('section', defaultSection || null, { shouldValidate: true })
    }
  }, [open, sectionId, sectionList, setValue])

  const handleEnvironmentTypeChange = selectedEnvironmentType => {
    if (!allEnclosureData) return

    let enclosureData = []

    if (selectedEnvironmentType === 'terrestrial') {
      enclosureData = allEnclosureData.enclosure_type || []
    } else if (selectedEnvironmentType === 'aquatic') {
      enclosureData = allEnclosureData.aquatic_enclosure_type || []
    }

    const transformedEnclosureTypes = enclosureData.map(enclosure => ({
      value: enclosure.string_id,
      label: enclosure.name
    }))

    setFilteredEnclosureTypes(transformedEnclosureTypes)
    setValue('enclosureType', null, { shouldValidate: true })
  }

  const selectedEnvironmentType = watch('environmentType')

  useEffect(() => {
    if (selectedEnvironmentType && allEnclosureData) {
      handleEnvironmentTypeChange(selectedEnvironmentType)
    } else {
      setFilteredEnclosureTypes([])
    }
  }, [selectedEnvironmentType, allEnclosureData])

  const onSubmit = async data => {
    console.log('Form Data:', data)
    setLoading(true)

    const payload = {
      user_enclosure_name: data?.enclosureName,
      section_id: currentSectionId,
      enclosure_desc: data?.notes,
      enclosure_code: '',
      enclosure_environment: data?.environmentType,
      enclosure_is_movable: data?.movableOrWalkable === 'Movable' ? 1 : 0,
      enclosure_is_walkable: data?.movableOrWalkable === 'Walkable' ? 1 : 0,
      enclosure_type: data?.enclosureType?.value,
      enclosure_sunlight: data?.sunlight,
      enclosure_image: data?.images,
      zoo_id: zooId,
      batch_seq: data?.batchSequenceStart,
      batch_count: data?.batchEnclosureCount,
      commistioned_date: data?.commissionedDate,
      user_enclosure_id: user_id,
      enclosure_parent_id: data?.parentEnclosure?.value
    }

    try {
      if (sectionId) {
        const response = await addEnclosureToHousing(payload)
        if (response?.success) {
          Toaster({ type: 'success', message: response?.message })
          resetAllFields()
          setAddEnclosureDrawerOpen(false)
          setRefechEnclosure(!refetchEnclosure)
        } else {
          Toaster({ type: 'error', message: response?.message })
        }
      }
    } catch (error) {
      console.error('Error Adding Enclosure', error)
    } finally {
      setLoading(false)
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
              <Typography variant='h6'>Add New Enclosure</Typography>
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
                <Box>
                  <Typography variant='h6' sx={{ mb: 4, color: 'text.secondary' }}>
                    Single/Batch?
                  </Typography>
                  <Box
                    sx={{
                      p: 4,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      bgcolor: theme.palette.common.white,
                      mb: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}
                  >
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
                            selectedType === 'Single'
                              ? `2px solid ${theme.palette.primary.main}`
                              : `1px solid ${theme.palette.divider}`,
                          bgcolor:
                            selectedType === 'Single' ? theme.palette.action.selected : theme.palette.common.white,
                          cursor: 'pointer',
                          transition: 'border-color 0.2s, background-color 0.2s'
                        }}
                        onClick={() => handleSelectedTypeChange('Single')}
                      >
                        <Typography
                          sx={{ flex: 1, color: selectedType === 'Single' ? 'text.primary' : 'text.secondary' }}
                        >
                          Single
                        </Typography>
                        <input
                          type='radio'
                          name='singleBatch'
                          checked={selectedType === 'Single'}
                          onChange={() => handleSelectedTypeChange('Single')}
                          style={{ display: 'none' }}
                        />
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            border: `2px solid ${
                              selectedType === 'Single' ? theme.palette.primary.main : theme.palette.divider
                            }`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            ml: 2
                          }}
                        >
                          {selectedType === 'Single' && (
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
                            selectedType === 'Batch'
                              ? `2px solid ${theme.palette.primary.main}`
                              : `1px solid ${theme.palette.divider}`,
                          bgcolor:
                            selectedType === 'Batch' ? theme.palette.action.selected : theme.palette.common.white,
                          cursor: 'pointer',
                          transition: 'border-color 0.2s, background-color 0.2s'
                        }}
                        onClick={() => handleSelectedTypeChange('Batch')}
                      >
                        <Typography
                          sx={{ flex: 1, color: selectedType === 'Batch' ? 'text.primary' : 'text.secondary' }}
                        >
                          Batch
                        </Typography>
                        <input
                          type='radio'
                          name='singleBatch'
                          checked={selectedType === 'Batch'}
                          onChange={() => handleSelectedTypeChange('Batch')}
                          style={{ display: 'none' }}
                        />
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            border: `2px solid ${
                              selectedType === 'Batch' ? theme.palette.primary.main : theme.palette.divider
                            }`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            ml: 2
                          }}
                        >
                          {selectedType === 'Batch' && (
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
                    {selectedType === 'Batch' && (
                      <Box
                        sx={{
                          mt: 2
                        }}
                      >
                        <Typography variant='subtitle1' sx={{ mb: 2 }}>
                          Batch Options
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 3 }}>
                          <ControlledTextField
                            name='batchEnclosureCount'
                            control={control}
                            label='Enclosure Count'
                            required={false}
                            inputProps={{ placeholder: 'Enclosure Count' }}
                            errors={errors}
                            sx={{ flex: 1 }}
                          />
                          <ControlledTextField
                            name='batchSequenceStart'
                            control={control}
                            label='Sequence Start'
                            required={false}
                            inputProps={{ placeholder: 'Sequence' }}
                            errors={errors}
                            sx={{ flex: 1 }}
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
                <Box>
                  <Typography variant='h6' sx={{ mb: 4, color: 'text.secondary' }}>
                    Basic Information
                  </Typography>
                  <Box
                    sx={{
                      p: 4,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      bgcolor: theme.palette.common.white,
                      mb: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}
                  >
                    <ControlledTextField
                      name={'enclosureName'}
                      control={control}
                      label={'Enclosure Name/Prefix*'}
                      required={true}
                      inputProps={{ placeholder: 'Enclosure Name/Prefix' }}
                      errors={errors}
                      sx={{ mt: 2 }}
                    />
                    <ControlledSelect
                      name={'environmentType'}
                      control={control}
                      label={'Environment Type*'}
                      required={true}
                      errors={errors}
                      options={environmentTypes}
                      getOptionLabel={option => option.label}
                      getOptionValue={option => option.value}
                      sx={{ mt: 4, mb: 6 }}
                    />
                    <ControlledAutocomplete
                      name={'enclosureType'}
                      control={control}
                      errors={errors}
                      label={'Enclosure Type*'}
                      required={true}
                      options={filteredEnclosureTypes}
                      getOptionLabel={option => option?.label || ''}
                      isOptionEqualToValue={(option, value) => option?.value === value?.value}
                    />
                    <ControlledAutocomplete
                      name={'section'}
                      control={control}
                      errors={errors}
                      label={'Choose Section*'}
                      required={true}
                      options={sectionList}
                      getOptionLabel={option => option?.label || ''}
                      isOptionEqualToValue={(option, value) => option.value === value?.value}
                      value={getValues('section')}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <ControlledAutocomplete
                        name={'parentEnclosure'}
                        control={control}
                        errors={errors}
                        label={'Parent Enclosure'}
                        required={false}
                        options={parentEnclosureList}
                        getOptionLabel={option => option?.label || ''}
                        isOptionEqualToValue={(option, value) => option?.value === value?.value}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Icon icon={'mdi-information-outline'} fontSize={20} />
                        <Typography variant='subtitle2'>Assign your enclosure as child under this</Typography>
                      </Box>
                    </Box>
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
                  </Box>
                </Box>
                <Box>
                  <Typography variant='h6' sx={{ mb: 4, color: 'text.secondary' }}>
                    Additional Information
                  </Typography>
                  <Box
                    sx={{
                      p: 4,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      bgcolor: theme.palette.common.white,
                      mb: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}
                  >
                    <Box>
                      <Typography variant='subtitle1' sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}>
                        Enclosure is Movable/Wakable?
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: theme.palette.common.white,

                          // mb: 6,
                          display: 'flex',
                          flexDirection: 'row',
                          gap: 4
                        }}
                      >
                        {/* Movable Option */}
                        <Box
                          sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            px: 4,
                            py: 4,
                            borderRadius: 0.5,
                            border:
                              movableOrWalkable === 'Movable'
                                ? `2px solid ${theme.palette.primary.main}`
                                : `1px solid ${theme.palette.divider}`,
                            bgcolor:
                              movableOrWalkable === 'Movable'
                                ? theme.palette.action.selected
                                : theme.palette.common.white,
                            cursor: 'pointer',
                            transition: 'border-color 0.2s, background-color 0.2s'
                          }}
                          onClick={() => handleMovableWalkableChange('Movable')}
                        >
                          <Typography
                            sx={{ flex: 1, color: movableOrWalkable === 'Movable' ? 'text.primary' : 'text.secondary' }}
                          >
                            Movable
                          </Typography>
                          <input
                            type='radio'
                            name='movableWalkable'
                            checked={movableOrWalkable === 'Movable'}
                            onChange={() => handleMovableWalkableChange('Movable')}
                            style={{ display: 'none' }}
                          />
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              border: `2px solid ${
                                movableOrWalkable === 'Movable' ? theme.palette.primary.main : theme.palette.divider
                              }`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              ml: 2
                            }}
                          >
                            {movableOrWalkable === 'Movable' && (
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

                        {/* Walkable Option */}
                        <Box
                          sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            px: 4,
                            py: 2,
                            borderRadius: 0.5,
                            border:
                              movableOrWalkable === 'Walkable'
                                ? `2px solid ${theme.palette.primary.main}`
                                : `1px solid ${theme.palette.divider}`,
                            bgcolor:
                              movableOrWalkable === 'Walkable'
                                ? theme.palette.action.selected
                                : theme.palette.common.white,
                            cursor: 'pointer',
                            transition: 'border-color 0.2s, background-color 0.2s'
                          }}
                          onClick={() => handleMovableWalkableChange('Walkable')}
                        >
                          <Typography
                            sx={{
                              flex: 1,
                              color: movableOrWalkable === 'Walkable' ? 'text.primary' : 'text.secondary'
                            }}
                          >
                            Walkable
                          </Typography>
                          <input
                            type='radio'
                            name='movableWalkable'
                            checked={movableOrWalkable === 'Walkable'}
                            onChange={() => handleMovableWalkableChange('Walkable')}
                            style={{ display: 'none' }}
                          />
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              border: `2px solid ${
                                movableOrWalkable === 'Walkable' ? theme.palette.primary.main : theme.palette.divider
                              }`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              ml: 2
                            }}
                          >
                            {movableOrWalkable === 'Walkable' && (
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
                    </Box>
                    <ControlledSelect
                      name={'sunlight'}
                      control={control}
                      label={'Sunlight'}
                      required={false}
                      errors={errors}
                      options={sunlightOptions}
                      getOptionLabel={option => option.label}
                      getOptionValue={option => option.value}
                    />
                    <ControlledTextField
                      name={'commissionedDate'}
                      control={control}
                      label={'Commissioned Date'}
                      required={false}
                      inputProps={{
                        placeholder: 'dd-mm-yyyy'
                      }}
                      errors={errors}
                      type='date'
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <Box
                      sx={{
                        backgroundColor: '#FFF9C4',
                        borderRadius: 1,
                        p: 3,
                        mt: 4,
                        mb: 2
                      }}
                    >
                      <Typography variant='subtitle2' sx={{ color: 'text.secondary', mb: 1 }}>
                        Notes
                      </Typography>
                      <Controller
                        name='notes'
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            placeholder='Type your notes here'
                            variant='standard'
                            fullWidth
                            multiline
                            InputProps={{
                              disableUnderline: true,
                              sx: { fontSize: 16, fontWeight: 500, color: 'text.primary', background: 'transparent' }
                            }}
                            sx={{
                              background: 'transparent',
                              fontSize: 20,
                              fontWeight: 500,
                              color: 'text.primary'
                            }}
                          />
                        )}
                      />
                    </Box>
                  </Box>
                </Box>
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
    </>
  )
}

export default AddEnclosureDrawer
