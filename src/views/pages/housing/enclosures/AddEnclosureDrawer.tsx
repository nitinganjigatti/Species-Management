import { useTheme } from '@emotion/react'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button, CircularProgress, Drawer, IconButton, TextField, Typography } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { Box, fontSize } from '@mui/system'
import dayjs, { Dayjs } from 'dayjs'
import moment from 'moment'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { AuthContext } from 'src/context/AuthContext'
import {
  addEnclosureToHousing,
  editEnclosure,
  deleteEnclosure,
  getEnclosureSetting,
  getEnclosureBasicInfo,
  getParentEnclosureList,
  getSectionsListingForEnclosure
} from 'src/lib/api/housing'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import * as yup from 'yup'
import { useRouter } from 'next/router'

interface EnclosureData {
  enclosure_id: number
  user_enclosure_name?: string
  section_id?: number
  section_name?: string
  enclosure_desc?: string
  enclosure_environment?: string
  enclosure_type?: string
  enclosure_type_id?: number
  enclosure_is_movable?: string | number
  enclosure_is_walkable?: string | number
  enclosure_sunlight?: string
  enclosure_parent_id?: number | null
  parent_enclosure_name?: string
  enclosure_lat?: string
  enclosure_long?: string
  commistioned_date?: string
  enclosure_code?: string
  user_enclosure_id?: string
  images?: Array<{ file: string; display_type?: string }>
}

interface AddEnclosureDrawerProps {
  setAddEnclosureDrawerOpen: (open: boolean) => void
  open: boolean
  sectionId: string | null
  zooId: string
  refetchEnclosure: boolean
  setRefechEnclosure: (refetch: boolean) => void
  enclosureData?: EnclosureData | null  // If provided, drawer is in edit mode
  refetch?: () => void
}

interface SelectOption {
  value: string
  label: string
}

interface EnclosureSettingsData {
  environment_type?: Array<{ string_id: string; name: string; enabled: boolean }>
  enclosure_type?: Array<{ string_id: string; name: string }>
  aquatic_enclosure_type?: Array<{ string_id: string; name: string }>
}

interface FormValues {
  enclosureName: string
  environmentType: SelectOption | null
  enclosureType: SelectOption | null
  parentEnclosure: SelectOption | null | string
  movableOrWalkable: string
  sunlight: string
  commissioned_date: Dayjs
  images: (File | string)[]  // Can be File objects or URL strings for existing images
  batchEnclosureCount: string
  batchSequenceStart: string
  section: SelectOption | null
  notes: string
  movable: boolean
  walkable: boolean
}

const schema = yup.object().shape({
  enclosureName: yup.string().required('Enclosure name is required'),
  environmentType: yup
    .object({
      value: yup.string().required('Environment type is required'),
      label: yup.string().required()
    })
    .required('Environment type is required'),
  enclosureType: yup
    .object({
      value: yup.string().required('Enclosure type is required'),
      label: yup.string().required()
    })
    .required('Enclosure type is required'),
  section: yup
    .object({
      value: yup.string().required('Section is required'),
      label: yup.string().required()
    })
    .required('Section is required')
    .nullable()
})

const sunlightOptions: SelectOption[] = [
  { value: 'Moderate', label: 'Moderate' },
  { value: 'Good', label: 'Good' },
  { value: 'Bad', label: 'Bad' }
]

const AddEnclosureDrawer: React.FC<AddEnclosureDrawerProps> = ({
  setAddEnclosureDrawerOpen,
  open,
  sectionId,
  zooId,
  refetchEnclosure,
  setRefechEnclosure,
  enclosureData,
  refetch
}) => {
  const theme = useTheme() as any
  const router = useRouter()

  const authData = useContext(AuthContext) as any
  const user_id = authData?.userData?.user?.user_id

  const isEditMode = !!enclosureData

  const [loading, setLoading] = useState<boolean>(false)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false)
  const [selectedType, setSelectedType] = useState<string>('Single')
  const [movable, setMovable] = useState<boolean>(false)
  const [walkable, setWalkable] = useState<boolean>(false)
  const [environmentTypes, setEnvironmentTypes] = useState<SelectOption[]>([])
  const [allEnclosureData, setAllEnclosureData] = useState<EnclosureSettingsData | null>(null)
  const [filteredEnclosureTypes, setFilteredEnclosureTypes] = useState<SelectOption[]>([])
  const [sectionList, setSectionList] = useState<SelectOption[]>([])
  const [parentEnclosureList, setParentEnclosureList] = useState<SelectOption[]>([])
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(sectionId)

  const {
    control,
    setValue,
    watch,
    handleSubmit,
    trigger,
    reset,
    getValues,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      enclosureName: '',
      environmentType: null,
      enclosureType: null,
      parentEnclosure: '',
      movableOrWalkable: '',
      sunlight: '',
      commissioned_date: dayjs(),
      images: [],
      batchEnclosureCount: '',
      batchSequenceStart: '',
      section: (sectionId as any) || null,
      notes: '',
      movable: false,
      walkable: false
    },
    resolver: yupResolver(schema) as any,
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    context: { selectedType }
  })

  const resetAllFields = (): void => {
    reset({
      enclosureName: '',
      environmentType: '' as any,
      enclosureType: null,
      parentEnclosure: '',
      movable: false,
      walkable: false,
      sunlight: '',
      commissioned_date: '' as any,
      images: [],
      batchEnclosureCount: '',
      batchSequenceStart: '',
      notes: '',
      section: (sectionId as any) || null
    })

    setSelectedType('Single')
    setFilteredEnclosureTypes([])
    setSectionList([])
    setCurrentSectionId(sectionId)
  }

  const handleDrawerClose = (): void => {
    resetAllFields()
    const currentImages = getValues('images')
    if (currentImages && currentImages.length > 0) {
      currentImages.forEach(img => {
        if (typeof img !== 'string' && img instanceof File) {
          try {
            URL.revokeObjectURL(img as any)
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSectionChange = (newSection: SelectOption | null): void => {
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

  const handleFilesChange = (files: FileList | null): void => {
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

  const handleRemoveImage = (index: number): void => {
    const updatedImages = images.filter((_, i) => i !== index)
    setValue('images', updatedImages, { shouldValidate: true })
  }

  const handleSelectedTypeChange = (type: string): void => {
    setSelectedType(type)
    setTimeout(() => {
      trigger(['batchEnclosureCount', 'batchSequenceStart'])
    }, 0)
  }

  const fetchEnclosureSettings = async (): Promise<void> => {
    try {
      await getEnclosureSetting().then((res: any) => {
        if (res?.success) {
          setEnvironmentTypes(
            res?.data?.environment_type
              ?.filter((item: any) => item?.enabled)
              ?.map((item: any) => ({
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

  const fetchSectionList = async (): Promise<void> => {
    const params = {
      zoo_id: zooId,
      ignore_sys_gen: 1
    }
    try {
      await getSectionsListingForEnclosure(params).then((res: any) => {
        if (res?.success) {
          setSectionList(
            res?.data?.map((section: any) => ({
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

  const fetchParentEnclosureList = async (sectionIdToUse: string | null): Promise<void> => {
    if (!sectionIdToUse) {
      setParentEnclosureList([])

      return
    }

    const params = {
      section_id: sectionIdToUse,
      ignore_sys_gen: 1
    }

    try {
      await getParentEnclosureList(params).then((res: any) => {
        if (res?.is_success) {
          setParentEnclosureList(
            res?.data?.map((enclosure: any) => ({
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
    if (open && sectionId && sectionList.length > 0 && !isEditMode) {
      const defaultSection = sectionList.find(option => option.value === sectionId)
      setValue('section', defaultSection || null, { shouldValidate: true })
    }
  }, [open, sectionId, sectionList, setValue, isEditMode])

  // Pre-populate form when in edit mode
  useEffect(() => {
    if (isEditMode && enclosureData && open && sectionList.length > 0 && environmentTypes.length > 0) {
      // Set section
      const sectionOption = sectionList.find(s => s.value === String(enclosureData.section_id))
      if (sectionOption) {
        setValue('section', sectionOption, { shouldValidate: true })
        setCurrentSectionId(String(enclosureData.section_id))
      }

      // Set environment type
      const envType = environmentTypes.find(e =>
        e.label?.toLowerCase() === enclosureData.enclosure_environment?.toLowerCase()
      )
      if (envType) {
        setValue('environmentType', envType, { shouldValidate: true })
      }

      // Set other form values
      setValue('enclosureName', enclosureData.user_enclosure_name || '')
      setValue('notes', enclosureData.enclosure_desc || '')
      setValue('sunlight', enclosureData.enclosure_sunlight || '')
      setValue('movable', enclosureData.enclosure_is_movable === '1' || enclosureData.enclosure_is_movable === 1)
      setValue('walkable', enclosureData.enclosure_is_walkable === '1' || enclosureData.enclosure_is_walkable === 1)
      setMovable(enclosureData.enclosure_is_movable === '1' || enclosureData.enclosure_is_movable === 1)
      setWalkable(enclosureData.enclosure_is_walkable === '1' || enclosureData.enclosure_is_walkable === 1)

      if (enclosureData.commistioned_date) {
        setValue('commissioned_date', dayjs(enclosureData.commistioned_date))
      }

      // Set images
      if (enclosureData.images && enclosureData.images.length > 0) {
        setValue('images', enclosureData.images.map(img => img.file))
      }
    }
  }, [isEditMode, enclosureData, open, sectionList, environmentTypes, setValue])

  // Set enclosure type after environment types are filtered
  useEffect(() => {
    if (isEditMode && enclosureData && filteredEnclosureTypes.length > 0) {
      const encType = filteredEnclosureTypes.find(e =>
        e.value === enclosureData.enclosure_type_id ||
        e.label?.toLowerCase() === enclosureData.enclosure_type?.toLowerCase()
      )
      if (encType) {
        setValue('enclosureType', encType, { shouldValidate: true })
      }
    }
  }, [isEditMode, enclosureData, filteredEnclosureTypes, setValue])

  // Set parent enclosure after parent enclosure list is loaded
  useEffect(() => {
    if (isEditMode && enclosureData && parentEnclosureList.length > 0 && enclosureData.enclosure_parent_id) {
      const parentEnc = parentEnclosureList.find(p => p.value === enclosureData.enclosure_parent_id)
      if (parentEnc) {
        setValue('parentEnclosure', parentEnc, { shouldValidate: true })
      }
    }
  }, [isEditMode, enclosureData, parentEnclosureList, setValue])

  const handleEnvironmentTypeChange = (selectedEnvironmentType: string): void => {
    if (!allEnclosureData) return

    let enclosureTypeData: Array<{ string_id: string; name: string }> = []

    if (selectedEnvironmentType === 'terrestrial') {
      enclosureTypeData = allEnclosureData.enclosure_type || []
    } else if (selectedEnvironmentType === 'aquatic') {
      enclosureTypeData = allEnclosureData.aquatic_enclosure_type || []
    }

    const transformedEnclosureTypes = enclosureTypeData.map(enclosure => ({
      value: enclosure.string_id,
      label: enclosure.name
    }))

    setFilteredEnclosureTypes(transformedEnclosureTypes)
    // Don't reset enclosure type in edit mode (will be set by the edit useEffect)
    if (!isEditMode) {
      setValue('enclosureType', null, { shouldValidate: true })
    }
  }

  const selectedEnvironmentType = watch('environmentType')

  useEffect(() => {
    if (selectedEnvironmentType && allEnclosureData) {
      handleEnvironmentTypeChange(selectedEnvironmentType?.value)
    } else {
      setFilteredEnclosureTypes([])
    }
  }, [selectedEnvironmentType, allEnclosureData])

  const onSubmit = async (data: FormValues): Promise<void> => {
    setLoading(true)

    try {
      if (isEditMode && enclosureData) {
        // Edit mode - only send new File objects, not existing URL strings
        const newImages = data.images.filter(img => img instanceof File) as File[]

        const payload = {
          enclosure_id: enclosureData.enclosure_id,
          user_enclosure_name: data?.enclosureName,
          section_id: currentSectionId ? Number(currentSectionId) : enclosureData.section_id,
          enclosure_desc: data?.notes,
          enclosure_environment: data?.environmentType?.value || data?.environmentType?.label,
          enclosure_is_movable: data?.movable ? 1 : 0,
          enclosure_is_walkable: data?.walkable ? 1 : 0,
          enclosure_type: data?.enclosureType?.value,
          enclosure_sunlight: data?.sunlight,
          enclosure_parent_id: (data?.parentEnclosure as SelectOption)?.value || null,
          enclosure_lat: '',
          enclosure_long: '',
          commistioned_date: moment(data?.commissioned_date).format('YYYY-MM-DD'),
          enclosure_status: 'active',
          enclosure_code: enclosureData.enclosure_code || '',
          user_enclosure_id: enclosureData.user_enclosure_id || user_id,
          enclosure_image: newImages.length > 0 ? newImages : undefined
        }

        const response = await editEnclosure(payload) as any

        if (response?.success) {
          Toaster({ type: 'success', message: 'Enclosure Updated Successfully' })
          setAddEnclosureDrawerOpen(false)
          if (refetch) refetch()
          setRefechEnclosure(!refetchEnclosure)
        } else {
          Toaster({ type: 'error', message: response?.message || 'Failed to update enclosure' })
        }
      } else {
        // Add mode
        const payload = {
          user_enclosure_name: data?.enclosureName,
          section_id: currentSectionId,
          enclosure_desc: data?.notes,
          enclosure_code: '',
          enclosure_environment: data?.environmentType?.value,
          enclosure_is_movable: data?.movable ? 1 : 0,
          enclosure_is_walkable: data?.walkable ? 1 : 0,
          enclosure_type: data?.enclosureType?.value,
          enclosure_sunlight: data?.sunlight,
          enclosure_image: data?.images,
          zoo_id: zooId,
          batch_seq: data?.batchSequenceStart,
          batch_count: data?.batchEnclosureCount,
          commistioned_date: moment((data as any)?.data?.commissioned_date).format('YYYY-MM-DD'),
          user_enclosure_id: user_id,
          enclosure_parent_id: (data?.parentEnclosure as SelectOption)?.value
        }

        if (sectionId || currentSectionId) {
          const response = await addEnclosureToHousing(payload) as any
          if (response?.success) {
            Toaster({ type: 'success', message: response?.message })
            resetAllFields()
            setAddEnclosureDrawerOpen(false)
            setRefechEnclosure(!refetchEnclosure)
          } else {
            Toaster({ type: 'error', message: response?.message })
          }
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error(isEditMode ? 'An error occurred while updating the enclosure' : 'An error occurred while creating the enclosure')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEnclosure = async (): Promise<void> => {
    if (!enclosureData) return

    setDeleteLoading(true)
    try {
      const response = await deleteEnclosure({ enclosure_id: enclosureData.enclosure_id }) as any

      if (response?.success) {
        Toaster({ type: 'success', message: 'Enclosure Deleted Successfully' })
        setShowDeleteDialog(false)
        setAddEnclosureDrawerOpen(false)
        // Navigate back to section details page
        if (enclosureData.section_id) {
          router.push(`/housing/sections/${enclosureData.section_id}`)
        } else {
          router.push('/housing/sites')
        }
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to delete enclosure' })
      }
    } catch (error) {
      console.error('Delete Error:', error)
      toast.error('An error occurred while deleting the enclosure')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      <Drawer
        anchor='right'
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
        open={open}
        onClose={handleDrawerClose}
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
            <img src='/icons/activity_icon.png' alt='Enclosure Icon' width='30px' />
            <Typography variant='h6'>{isEditMode ? 'Edit Enclosure' : 'Add New Enclosure'}</Typography>
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
          <form id="enclosure-form" onSubmit={handleSubmit(onSubmit)}>
                {/* Single/Batch section - only show in add mode */}
                {!isEditMode && (
                <Box>
                  <Typography variant='h6' sx={{ mb: 4, color: 'text.secondary' }}>
                    Single/Batch?
                  </Typography>
                  <Box
                    sx={{
                      p: 4,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      bgcolor: theme.palette.customColors?.OnPrimary,
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
                            selectedType === 'Single' ? theme.palette.action.selected : theme.palette.customColors?.OnPrimary,
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
                            selectedType === 'Batch' ? theme.palette.action.selected : theme.palette.customColors?.OnPrimary,
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
                )}
                <Box>
                  <Typography variant='h6' sx={{ mb: 4, color: 'text.secondary' }}>
                    Basic Information
                  </Typography>
                  <Box
                    sx={{
                      p: 4,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      bgcolor: theme.palette.customColors?.OnPrimary,
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
                    <ControlledAutocomplete
                      name={'environmentType'}
                      control={control}
                      label={'Environment Type*'}
                      required={true}
                      errors={errors}
                      options={environmentTypes}
                      getOptionLabel={(option: unknown) => (option as SelectOption).label}
                      isOptionEqualToValue={(option: unknown, value: unknown) => (option as SelectOption)?.value === (value as SelectOption)?.value}
                    />
                    <ControlledAutocomplete
                      name={'enclosureType'}
                      control={control}
                      errors={errors}
                      label={'Enclosure Type*'}
                      required={true}
                      options={filteredEnclosureTypes}
                      getOptionLabel={(option: unknown) => (option as SelectOption)?.label}
                      isOptionEqualToValue={(option: unknown, value: unknown) => (option as SelectOption)?.value === (value as SelectOption)?.value}
                    />
                    <ControlledAutocomplete
                      name={'section'}
                      control={control}
                      errors={errors}
                      label={'Choose Section*'}
                      required={true}
                      options={sectionList}
                      getOptionLabel={(option: unknown) => (option as SelectOption)?.label || ''}
                      isOptionEqualToValue={(option: unknown, value: unknown) => (option as SelectOption).value === (value as SelectOption)?.value}
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
                        getOptionLabel={(option: unknown) => (option as SelectOption)?.label || ''}
                        isOptionEqualToValue={(option: unknown, value: unknown) => (option as SelectOption)?.value === (value as SelectOption)?.value}
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
                                border: `2px dashed ${error ? theme.palette.error.main : theme.palette.customColors?.OutlineVariant}`,
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
                                  Drop your images here
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
                      bgcolor: theme.palette.customColors?.OnPrimary,
                      mb: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}
                  >
                    <Box>
                      <Typography variant='subtitle1' sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}>
                        Enclosure is Movable / Walkable?
                      </Typography>

                      <Box
                        sx={{
                          bgcolor: theme.palette.customColors?.OnPrimary,
                          display: 'flex',
                          flexDirection: 'row',
                          gap: 4
                        }}
                      >
                        {/* Movable Checkbox */}
                        <Box
                          sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            px: 4,
                            py: 4,
                            borderRadius: 0.5,
                            border: movable
                              ? `2px solid ${theme.palette.primary.main}`
                              : `1px solid ${theme.palette.divider}`,
                            bgcolor: movable ? theme.palette.action.selected : theme.palette.customColors?.OnPrimary,
                            cursor: 'pointer',
                            transition: 'border-color 0.2s, background-color 0.2s'
                          }}
                          onClick={() => {
                            setMovable(prev => !prev)
                            setValue('movable', !movable, { shouldValidate: true })
                          }}
                        >
                          <Typography sx={{ flex: 1, color: movable ? 'text.primary' : 'text.secondary' }}>
                            Movable
                          </Typography>
                          <input type='checkbox' checked={movable} onChange={() => {}} style={{ display: 'none' }} />
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '4px',
                              border: `2px solid ${movable ? theme.palette.primary.main : theme.palette.divider}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              ml: 2
                            }}
                          >
                            {movable && (
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '2px',
                                  bgcolor: theme.palette.primary.main
                                }}
                              />
                            )}
                          </Box>
                        </Box>

                        {/* Walkable Checkbox */}
                        <Box
                          sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            px: 4,
                            py: 4,
                            borderRadius: 0.5,
                            border: walkable
                              ? `2px solid ${theme.palette.primary.main}`
                              : `1px solid ${theme.palette.divider}`,
                            bgcolor: walkable ? theme.palette.action.selected : theme.palette.customColors?.OnPrimary,
                            cursor: 'pointer',
                            transition: 'border-color 0.2s, background-color 0.2s'
                          }}
                          onClick={() => {
                            setWalkable(prev => !prev)
                            setValue('walkable', !walkable, { shouldValidate: true })
                          }}
                        >
                          <Typography sx={{ flex: 1, color: walkable ? 'text.primary' : 'text.secondary' }}>
                            Walkable
                          </Typography>
                          <input type='checkbox' checked={walkable} onChange={() => {}} style={{ display: 'none' }} />
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '4px',
                              border: `2px solid ${walkable ? theme.palette.primary.main : theme.palette.divider}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              ml: 2
                            }}
                          >
                            {walkable && (
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '2px',
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
                      getOptionLabel={(option: unknown) => (option as SelectOption).label}
                      getOptionValue={(option: SelectOption) => option.value}
                    />
                    <ControlledDatePicker
                      control={control}
                      label='Commissioned Date'
                      name={'commissioned_date'}
                      required
                    />
                    <Box
                      sx={{
                        backgroundColor: theme.palette.warning.light,
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
            form='enclosure-form'
            sx={{ height: '50px' }}
          >
            {isEditMode ? 'Update' : 'Add'}
          </LoadingButton>
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <ConfirmationDialog
          dialogBoxStatus={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          title='Delete Enclosure'
          description='Are you sure you want to delete this enclosure? This action cannot be undone.'
          image='/images/warning-icon.svg'
          imgStyle={{ background: theme.palette.customColors?.TertiaryLight, p: 4 }}
          confirmAction={handleDeleteEnclosure}
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
    </>
  )
}

export default AddEnclosureDrawer
