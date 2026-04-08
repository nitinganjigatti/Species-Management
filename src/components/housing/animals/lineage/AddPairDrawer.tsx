import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Button, CircularProgress, IconButton, Drawer, Card } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import {
  Add as AddIcon,
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  Link as LinkIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import dayjs, { Dayjs } from 'dayjs'

import Toaster from 'src/components/Toaster'
import { addLineagePair, editLineagePair } from 'src/lib/api/housing'
import type { AddPairPayload, EditPairPayload, LineagePair } from 'src/types/housing'
import AnimalCard from 'src/views/utility/AnimalCard'
import MultiSelectAnimalDrawer, { Animal } from './MultiSelectAnimalDrawer'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledSwitch from 'src/views/forms/form-fields/ControlledSwitch'

interface AddPairDrawerProps {
  open: boolean
  onClose: () => void
  animalId: number | string
  animalSex: string
  taxonomyId?: number | string
  onSuccess: () => void
  editMode?: boolean
  editData?: LineagePair | null
}

interface PairFormData {
  isCurrentlyPaired: boolean
  startDate: Dayjs | null
  endDate: Dayjs | null
}

interface SelectedAnimal {
  animal_id?: number
  default_common_name?: string
  common_name?: string
  scientific_name?: string
  complete_name?: string
  vernacular_name?: string
  user_enclosure_name?: string
  enclosure_name?: string
  section_name?: string
  site_name?: string
  type?: string
  sex?: string
  gender?: string
  default_icon?: string
  image_url?: string
  total_animal?: number
  local_identifier_name?: string
  local_identifier_value?: string
}

const AddPairDrawer: React.FC<AddPairDrawerProps> = ({
  open,
  onClose,
  animalId,
  animalSex,
  taxonomyId,
  onSuccess,
  editMode = false,
  editData = null
}) => {
  const theme = useTheme() as any
  const { t } = useTranslation()

  // Form state
  const [selectedAnimal, setSelectedAnimal] = useState<SelectedAnimal | null>(null)
  const [loading, setLoading] = useState(false)

  // Animal selection drawer state
  const [animalDrawerOpen, setAnimalDrawerOpen] = useState(false)

  // Determine opposite sex for pair selection
  const oppositeSex = animalSex?.toLowerCase() === 'male' ? 'female' : 'male'

  // Extra params for animal drawer matching mobile implementation
  const animalDrawerParams = useMemo(
    () => ({
      type: 'single',
      gender: [oppositeSex],
      include_dead_animal: 1,
      ignore_permission: 1,
      tsn_id: taxonomyId ? [taxonomyId] : [],
      relevant_animal_id: animalId,
      list_type: 'animals',
      animal_list_type: 'all_animals'
    }),
    [oppositeSex, taxonomyId, animalId]
  )

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PairFormData>({
    defaultValues: {
      isCurrentlyPaired: false,
      startDate: null,
      endDate: null
    }
  })

  const isCurrentlyPaired = watch('isCurrentlyPaired')
  const startDate = watch('startDate')

  // Reset form when drawer opens/closes or editMode changes
  useEffect(() => {
    if (open) {
      if (editMode && editData) {
        const parsedStartDate =
          editData.start_date && editData.start_date !== '0000-00-00' ? dayjs(editData.start_date) : null

        const parsedEndDate = editData.end_date && editData.end_date !== '0000-00-00' ? dayjs(editData.end_date) : null

        const isPaired = !editData.end_date || editData.end_date === '0000-00-00'

        // Build selected animal from edit data
        const pairedAnimalId = editData.animal_id || editData.pair_animal_id
        if (pairedAnimalId) {
          setSelectedAnimal({
            animal_id: Number(pairedAnimalId),
            common_name: editData.common_name || editData.pair_common_name,
            default_common_name: editData.default_common_name,
            sex: editData.sex || editData.pair_sex,
            default_icon: editData.default_icon || editData.image_url,
            image_url: editData.image_url || editData.pair_image_url,
            local_identifier_value: editData.local_identifier_value || editData.local_identifier,
            local_identifier_name: editData.local_identifier_name,
            user_enclosure_name: editData.user_enclosure_name || editData.enclosure_name,
            section_name: editData.section_name,
            site_name: editData.site_name
          })
        }

        reset({
          isCurrentlyPaired: isPaired,
          startDate: parsedStartDate,
          endDate: parsedEndDate
        })
      } else {
        setSelectedAnimal(null)
        reset({
          isCurrentlyPaired: false,
          startDate: null,
          endDate: null
        })
      }
    }
  }, [open, editMode, editData, reset])

  // Clear end date when "Currently Paired" is toggled on
  useEffect(() => {
    if (isCurrentlyPaired) {
      setValue('endDate', null)
    }
  }, [isCurrentlyPaired, setValue])

  // Handle animal selection from drawer (receives array from MultiSelectAnimalDrawer)
  const handleAnimalSelect = (animals: Animal[]) => {
    if (animals && animals.length > 0) {
      setSelectedAnimal(animals[0])
    }
    setAnimalDrawerOpen(false)
  }

  // Handle remove selected animal
  const handleRemoveAnimal = () => {
    setSelectedAnimal(null)
  }

  // Handle form submit
  const onSubmit = async (data: PairFormData) => {
    if (!selectedAnimal && !editMode) {
      Toaster({ type: 'error', message: 'Please select an animal' })

      return
    }

    // Validate dates
    if (data.startDate || data.endDate || data.isCurrentlyPaired) {
      if (!data.startDate) {
        Toaster({ type: 'error', message: 'Please select start date' })

        return
      }

      if (!data.isCurrentlyPaired && !data.endDate) {
        Toaster({ type: 'error', message: 'Please select end date' })

        return
      }
    }

    setLoading(true)
    try {
      // Use id (mobile API) or pair_id (legacy)
      const pairId = editData?.id || editData?.pair_id

      if (editMode && pairId) {
        const payload: EditPairPayload = {
          pair_id: pairId,
          animal_id: animalId,
          start_date: data.startDate ? data.startDate.format('YYYY-MM-DD') : '',
          end_date: data.isCurrentlyPaired ? '' : data.endDate ? data.endDate.format('YYYY-MM-DD') : '',
          primary_animal_type: 'internal',
          paired_animal_type: 'internal'
        }

        const res = await editLineagePair(payload)
        if (res?.success) {
          Toaster({ type: 'success', message: res?.message || 'Pair updated successfully' })
          onSuccess()
          onClose()
        } else {
          Toaster({ type: 'error', message: res?.message || 'Failed to update pair' })
        }
      } else {
        // Mobile API uses primary_animal_id and paired_animal_id
        const payload: AddPairPayload = {
          primary_animal_id: animalId,
          paired_animal_id: selectedAnimal?.animal_id,
          start_date: data.startDate ? data.startDate.format('YYYY-MM-DD') : '',
          end_date: data.isCurrentlyPaired ? '' : data.endDate ? data.endDate.format('YYYY-MM-DD') : ''
        }

        const res = await addLineagePair(payload)
        if (res?.success) {
          Toaster({ type: 'success', message: res?.message || 'Pair added successfully' })
          onSuccess()
          onClose()
        } else {
          Toaster({ type: 'error', message: res?.message || 'Failed to add pair' })
        }
      }
    } catch (error: any) {
      Toaster({ type: 'error', message: error?.message || 'An error occurred' })
    } finally {
      setLoading(false)
    }
  }

  // Transform animal data for AnimalCard
  const getAnimalCardData = (animal: SelectedAnimal) => ({
    animal_id: animal.animal_id,
    local_identifier_name: animal.local_identifier_name,
    local_identifier_value: animal.local_identifier_value,
    default_icon: animal.default_icon || animal.image_url,
    common_name: animal.common_name || animal.vernacular_name,
    default_common_name: animal.default_common_name,
    scientific_name: animal.complete_name || animal.scientific_name,
    sex: animal.sex || animal.gender,
    gender: animal.sex || animal.gender,
    type: animal.type,
    user_enclosure_name: animal.user_enclosure_name || animal.enclosure_name,
    section_name: animal.section_name,
    site_name: animal.site_name
  })

  const title = editMode ? t('animals_module.edit_pair') : t('animals_module.add_pair')
  const isFormValid = selectedAnimal || editMode

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: '80%', md: 560 },
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.palette.customColors?.Background || theme.palette.background.default,
              p: 0
            }
          }
        }}
      >
        {/* Header */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            p: 5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.customColors?.OutlineVariant || theme.palette.divider}`,
            backgroundColor: theme.palette.customColors?.OnPrimary
          }}
        >
          <Typography sx={{ fontWeight: 500, fontSize: '24px', color: theme.palette.customColors?.OnSurfaceVariant }}>
            {title}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon sx={{ color: theme.palette.customColors?.OnSurfaceVariant }} />
          </IconButton>
        </Box>

        {/* Scrollable Content */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            minHeight: 0,
            p: 5
          }}
        >
          {/* Pair Selection Section */}
          <Card
            sx={{
              p: 4,
              borderRadius: '8px'
            }}
          >
            {/* Section Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <LinkIcon sx={{ color: theme.palette.customColors?.OnSurfaceVariant, fontSize: 20 }} />
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: theme.palette.customColors?.OnSurfaceVariant
                }}
              >
                {selectedAnimal ? t('animals_module.paired_with') : t('animals_module.pair')}
              </Typography>
            </Box>

            {/* No animal selected - Show Select Animal Button */}
            {!selectedAnimal ? (
              <Box
                onClick={() => {
                  if (!editMode) {
                    setAnimalDrawerOpen(true)
                  }
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 4,
                  border: `2px dashed ${theme.palette.primary.main}`,
                  borderRadius: '8px',
                  cursor: editMode ? 'not-allowed' : 'pointer',
                  opacity: editMode ? 0.5 : 1,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  '&:hover': editMode
                    ? {}
                    : {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1)
                      }
                }}
              >
                <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.primary.main }}>{t('animals_module.select_animal')}</Typography>
                <AddIcon sx={{ color: theme.palette.primary.main }} />
              </Box>
            ) : (
              <Card
                elevation={0}
                sx={{
                  borderRadius: '8px',
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.customColors?.OutlineVariant || theme.palette.divider}`,
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 3
                  }}
                >
                  {/* Animal Card */}
                  <AnimalCard data={getAnimalCardData(selectedAnimal)} />

                  {/* Remove Button - only in add mode */}
                  {!editMode && (
                    <IconButton
                      onClick={handleRemoveAnimal}
                      sx={{ color: theme.palette.error.main, p: 0.5, alignSelf: 'center' }}
                    >
                      <CancelIcon />
                    </IconButton>
                  )}
                </Box>
              </Card>
            )}
          </Card>

          {/* Paired Duration Section */}
          <Card
            sx={{
              p: 4,
              borderRadius: '8px'
            }}
          >
            {/* Section Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <CalendarIcon sx={{ color: theme.palette.customColors?.OnSurfaceVariant, fontSize: 20 }} />
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: theme.palette.customColors?.OnSurfaceVariant
                }}
              >
                {t('animals_module.paired_duration')}
              </Typography>
            </Box>

            {/* Currently Paired Toggle */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 3,
                mb: 3,
                backgroundColor: theme.palette.customColors?.Surface || theme.palette.background.paper,
                borderRadius: '8px',
                border: `1px solid ${theme.palette.customColors?.OutlineVariant || theme.palette.divider}`
              }}
            >
              <ControlledSwitch
                name='isCurrentlyPaired'
                control={control}
                label={t('animals_module.currently_paired') as string}
                labelPosition='start'
                spaceBetween
                sx={{ width: '100%', m: 0 }}
                labelStyle={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.customColors?.OnSurfaceVariant
                }}
              />
            </Box>

            {/* Date Pickers - Side by Side */}
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <ControlledDatePicker name='startDate' control={control} label={t('start_date') as string} size='medium' />
              </Box>
              <Box sx={{ flex: 1 }}>
                <ControlledDatePicker
                  name='endDate'
                  control={control}
                  label={t('end_date') as string}
                  disabled={isCurrentlyPaired}
                  minDate={startDate || undefined}
                  size='medium'
                />
              </Box>
            </Box>
          </Card>
        </Box>

        {/* Sticky Footer Button */}
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
            flexShrink: 0,
            display: 'flex',
            gap: 4
          }}
        >
          <Button
            variant='outlined'
            fullWidth
            color='primary'
            sx={{
              p: 3,
              fontWeight: 600,
              color: theme.palette.customColors?.OnPrimaryContainer,
              borderColor: theme.palette.customColors?.OnPrimaryContainer
            }}
            onClick={onClose}
          >
            {t('cancel')}
          </Button>
          <Button
            variant='contained'
            fullWidth
            color='primary'
            onClick={handleSubmit(onSubmit)}
            disabled={loading || !isFormValid}
            sx={{ p: 3, fontWeight: 600, backgroundColor: theme.palette.customColors?.OnPrimaryContainer }}
          >
            {loading ? <CircularProgress size={24} color='inherit' /> : t('done')}
          </Button>
        </Box>
      </Drawer>

      {/* Animal Selection Drawer */}
      <MultiSelectAnimalDrawer
        open={animalDrawerOpen}
        onClose={() => setAnimalDrawerOpen(false)}
        onSelect={handleAnimalSelect}
        title={t('animals_module.select_animal') as string}
        btnText={t('select') as string}
        selectionMode='single'
        extraParams={animalDrawerParams}
        zIndex={1300}
      />
    </>
  )
}

export default React.memo(AddPairDrawer)
