import { useTheme } from '@emotion/react'
import { Button, Card, Checkbox, CircularProgress, Drawer, IconButton, Switch, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useRef, useState, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import toast from 'react-hot-toast'
import dayjs, { Dayjs } from 'dayjs'
import { editAnimalMortalityReport } from 'src/lib/api/housing'
import Toaster from 'src/components/Toaster'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import { useTranslation } from 'react-i18next'

interface MortalityMedia {
  id: string
  media_path: string
}

interface MortalityData {
  mortality_id?: string
  entity_id?: string
  entity_type?: string
  reason_for_death?: string
  discovered_date?: string
  manner_of_death_id?: string
  carcass_condition_id?: string
  carcass_disposition_id?: string
  notes?: string
  submitted_for_necropsy?: string
  priority?: string
  is_estimate?: string
  total_animal?: number
  necropsy_reason?: string
  antz_animal_mortality_media?: MortalityMedia[]
}

interface SelectOption {
  label: string
  value: string
}

interface ImageItem {
  id?: string
  url?: string
  isExisting?: boolean
}

interface AnimalMortalityEditDrawerProps {
  open: boolean
  setDrawerOpen: (open: boolean) => void
  mortalityData: MortalityData | null
  mannerOfDeath: SelectOption[]
  carcassCondition: SelectOption[]
  carcassDeposition: SelectOption[]
  refetch: boolean
  setRefetch: (refetch: boolean) => void
}

interface FormValues {
  timeOfDiscovery: Dayjs | null
  dateOfDiscovery: Dayjs | null
  images: (ImageItem | File | string)[]
  mannerOfDeath: string
  carcassCondition: string
  carcassDisposition: string
  necropsyNeed: boolean
  priority: string
  notes: string
  isApproximateDate: boolean
}

const AnimalMortalityEditDrawer: React.FC<AnimalMortalityEditDrawerProps> = ({
  open,
  setDrawerOpen,
  mortalityData,
  mannerOfDeath,
  carcassCondition,
  carcassDeposition,
  refetch,
  setRefetch
}) => {
  const theme = useTheme() as any
  const { t } = useTranslation()

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      timeOfDiscovery: null,
      dateOfDiscovery: null,
      images: [],
      mannerOfDeath: '',
      carcassCondition: '',
      carcassDisposition: '',
      necropsyNeed: false,
      priority: '',
      notes: '',
      isApproximateDate: false
    }
  })

  const images = watch('images')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState<boolean>(false)
  const [selectedType, setSelectedType] = useState<string>('')

  useEffect(() => {
    if (mortalityData && Object.keys(mortalityData).length > 0) {
      setValue('mannerOfDeath', mortalityData?.manner_of_death_id || '')
      setValue('carcassCondition', mortalityData?.carcass_condition_id || '')
      setValue('carcassDisposition', mortalityData?.carcass_disposition_id || '')
      setValue('notes', mortalityData?.notes || '')
      setValue('necropsyNeed', mortalityData?.submitted_for_necropsy === '1')
      if (mortalityData.discovered_date) {
        const discoveredDateTime = dayjs(mortalityData?.discovered_date)
        setValue('dateOfDiscovery', discoveredDateTime)
        setValue('timeOfDiscovery', discoveredDateTime)
      }

      if (mortalityData.priority) {
        const capitalizedPriority =
          mortalityData?.priority.charAt(0).toUpperCase() + mortalityData?.priority.slice(1).toLowerCase()
        setSelectedType(capitalizedPriority)
        setValue('priority', capitalizedPriority)
      }

      setValue('isApproximateDate', mortalityData?.is_estimate === '1')

      if (mortalityData?.antz_animal_mortality_media && Array.isArray(mortalityData?.antz_animal_mortality_media)) {
        const existingImages: ImageItem[] = mortalityData?.antz_animal_mortality_media?.map(media => ({
          id: media?.id,
          url: media?.media_path,
          isExisting: true
        }))
        setValue('images', existingImages)
      }
    }
  }, [mortalityData, setValue])

  const handleDrawerClose = (): void => {
    setDrawerOpen(false)
  }

  const handleSelectedTypeChange = (type: string): void => {
    setSelectedType(type)
    setValue('priority', type)
  }

  const handleRemoveImage = (index: number): void => {
    const updatedImages = images.filter((_, i) => i !== index)
    setValue('images', updatedImages, { shouldValidate: true })
  }

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
      // Add new files to existing images (both existing and new)
      setValue('images', [...images, ...validFiles], { shouldValidate: true })
    }
  }

  const onSubmit = async (data: FormValues): Promise<void> => {
    const params = {
      mortality_id: mortalityData?.mortality_id,
      entity_id: mortalityData?.entity_id,
      entity_type: mortalityData?.entity_type,
      reason_for_death: mortalityData?.reason_for_death,
      discovered_date: data?.dateOfDiscovery,
      is_estimate: data?.isApproximateDate === true ? 1 : 0,
      manner_of_death: data?.mannerOfDeath,
      carcass_condition: data?.carcassCondition,
      carcass_disposition: (data as any)?.carcassDeposition,
      notes: data?.notes,
      submitted_for_necropsy: data?.necropsyNeed === true ? 1 : 0,
      total_animal: mortalityData?.total_animal,
      necropsy_reason: mortalityData?.necropsy_reason,
      priority: data?.priority?.toLowerCase(),
      discovered_time: data?.timeOfDiscovery
    }

    try {
      setLoading(true)
      await editAnimalMortalityReport(params).then((res: any) => {
        if (res?.success === true) {
          setDrawerOpen(false)
          setRefetch(!refetch)
          setLoading(false)
          Toaster({ type: 'success', message: res?.message })
        }
      })
    } catch (error) {
      console.error(error, 'Cannot Update Mortality Report')
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
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.palette.customColors?.OnPrimary,
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
        <Box sx={{ flex: 1, overflow: 'auto', background: theme.palette.customColors?.Background }}>
          <Box sx={{ px: 6, py: 4 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography>{t('animals_module.enter_details')}</Typography>
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
                  <Typography
                    sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors?.OnSurfaceVariant }}
                  >
                    {t('animals_module.date_time_discovery')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 4 }}>
                    <ControlledDatePicker
                      name='dateOfDiscovery'
                      control={control}
                      label={t('animals_module.date_of_discovery') as string}
                      required={true}
                    />
                    <ControlledTimePicker
                      name='timeOfDiscovery'
                      control={control}
                      label={t('animals_module.time_of_discovery') as string}
                      required={true}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '2.5px' }}>
                    <Controller
                      name='isApproximateDate'
                      control={control}
                      defaultValue={false}
                      render={({ field }) => <Checkbox checked={field.value} onChange={field.onChange} />}
                    />
                    <Typography
                      sx={{ fontSize: '16px', fontWeight: 400, color: theme.palette.customColors?.OnSurfaceVariant }}
                    >
                      {t('animals_module.mark_date_approximate')}
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
                  <Typography
                    sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors?.OnSurfaceVariant }}
                  >
                    {t('animals_module.manner_of_death')}
                  </Typography>
                  <ControlledSelect
                    name={'mannerOfDeath'}
                    control={control}
                    label={t('animals_module.manner_of_death') as string}
                    required={true}
                    errors={errors}
                    options={mannerOfDeath}
                    getOptionLabel={(option: SelectOption) => option.label}
                    getOptionValue={(option: SelectOption) => option.value}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography
                    sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors?.OnSurfaceVariant }}
                  >
                    {t('animals_module.carcass_condition')}
                  </Typography>
                  <ControlledSelect
                    name={'carcassCondition'}
                    control={control}
                    label={t('animals_module.carcass_condition') as string}
                    required={true}
                    errors={errors}
                    options={carcassCondition}
                    getOptionLabel={(option: SelectOption) => option.label}
                    getOptionValue={(option: SelectOption) => option.value}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography
                    sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors?.OnSurfaceVariant }}
                  >
                    {t('animals_module.carcass_deposition')}
                  </Typography>
                  <ControlledSelect
                    name={'carcassDeposition'}
                    control={control}
                    label={t('animals_module.carcass_deposition') as string}
                    required={true}
                    errors={errors}
                    options={carcassDeposition}
                    getOptionLabel={(option: SelectOption) => option.label}
                    getOptionValue={(option: SelectOption) => option.value}
                  />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 3,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.customColors?.OutlineVariant}`,
                    py: 2,
                    mt: 2
                  }}
                >
                  <Typography sx={{ fontSize: '16px', fontWeight: 400, color: theme.palette.customColors?.Outline }}>
                    {t('animals_module.necropsy_need')}
                  </Typography>
                  <Controller
                    name='necropsyNeed'
                    control={control}
                    render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />}
                  />
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
                <Typography
                  sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.customColors?.OnSurfaceVariant }}
                >
                  {t('animals_module.set_priority')}
                </Typography>
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
                      bgcolor:
                        selectedType === 'Low' ? theme.palette.action.selected : theme.palette.customColors?.OnPrimary,
                      cursor: 'pointer',
                      transition: 'border-color 0.2s, background-color 0.2s'
                    }}
                    onClick={() => handleSelectedTypeChange('Low')}
                  >
                    <Typography sx={{ flex: 1, color: selectedType === 'Low' ? 'text.primary' : 'text.secondary' }}>
                      {t('low')}
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
                      bgcolor:
                        selectedType === 'High' ? theme.palette.action.selected : theme.palette.customColors?.OnPrimary,
                      cursor: 'pointer',
                      transition: 'border-color 0.2s, background-color 0.2s'
                    }}
                    onClick={() => handleSelectedTypeChange('High')}
                  >
                    <Typography sx={{ flex: 1, color: selectedType === 'High' ? 'text.primary' : 'text.secondary' }}>
                      {t('high')}
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
                <ControlledTextArea name={'notes'} control={control} label={'Enter Notes'} />
                <Box>
                  {images.length > 0 && (
                    <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {images.map((img, index) => {
                        let previewUrl: string
                        if ((img as ImageItem)?.url) {
                          previewUrl = (img as ImageItem).url!
                        } else if (typeof img === 'string') {
                          previewUrl = img
                        } else if (img instanceof File) {
                          previewUrl = URL.createObjectURL(img)
                        } else {
                          previewUrl = ''
                        }

                        return (
                          <Box
                            key={(img as ImageItem)?.id || index}
                            sx={{
                              position: 'relative',
                              width: 100,
                              height: 100,
                              borderRadius: 1,
                              background: theme.palette.customColors?.displaybgPrimary,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <img
                              src={previewUrl}
                              alt={`Mortality Image ${index}`}
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
                              background: theme.palette.grey[100],
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
              background: theme.palette.primary.main
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
