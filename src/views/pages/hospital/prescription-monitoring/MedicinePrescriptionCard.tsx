'use client'

/* eslint-disable lines-around-comment */
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Typography,
  IconButton,
  Tab,
  Button,
  Drawer,
  useTheme,
  useMediaQuery,
  Skeleton,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid
} from '@mui/material'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import HorizontalDateNav from 'src/views/utility/HorizontalDateNav'
import MedicationTimeCard from './MedicationTimeCard'
import StopMedicine from './StopMedicine'
import Utility from 'src/utility'
import { LoadingButton } from '@mui/lab'
import DoDisturbIcon from '@mui/icons-material/DoDisturb'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useParams, useSearchParams } from 'next/navigation'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import RenderUtility from 'src/utility/render'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import { AdministerFormData, BatchListState, MedicineDetailState, SelectedItem, SingleOrMultipleDoseAdministerOrSkipTransformedData, StopMedicineFormData } from 'src/components/hospital/prescriptionMonitoring/PrescriptionLayout'
import { Id } from 'src/types/hospital'
import { MedicalMasterFormData } from 'src/components/hospital/prescriptionMonitoring/AddMedicineToPrescription'
import { PrescriptionDetails } from 'src/types/hospital/models/prescription'



  export interface PrescriptionCardDosageEntry extends MedicineDetailState {
    scheduled_time?: string
    scheduled_quantity?: string | number
    scheduled_unit_name?: string
    administritive_time?: string
    quantity_administered?: string | number
    wastage_quantity?: string | number
    status?: string
    user_full_name?: string
    user_profile_pic?: string | null
    modified_at?: string | null
    batch_details?: Array<{ batch_number?: string | number } & Record<string, unknown>>
  }

  export interface MedicinePrescriptionCardData extends PrescriptionDetails {
    defaultTab?: number | string
    medId?: Id
    startDate?: string
    endDate?: string
    dosage?: string
    deliveryRoute?: string
    lastEdited?: string
    prescription_required: string
    name: string
    administritive_ids: Id
  }   
// Custom styled components for drawer content
const DrawerContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  backgroundColor: theme.palette.background.paper
}))

const HeaderSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  width: '100%',
  padding: '24px 0px',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
  position: 'sticky',
  top: 0,
  zIndex: 1
}))

const InfoGroupContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: '20px',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  borderRadius: '8px 8px 0 0',
  backgroundColor: (theme as any).palette.customColors.displaybgPrimary
}))

const InfoItem = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flex: '1 0 0'
})

const NotesContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: '8px 20px',
  alignItems: 'center',
  gap: '4px',
  width: '100%',
  borderRadius: '0 0 8px 8px',
  backgroundColor: (theme as any).palette.customColors.Notes
}))

const DosageSection = styled(Box)<{ variant?: string }>(({ theme, variant }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  width: '100%',
  borderRadius: '8px',
  border:
    variant === 'administered'
      ? `1px solid ${(theme as any).palette.primary.main}80`
      : `1px solid ${(theme as any).palette.customColors.OutlineVariant}`
}))

const DosageHeader = styled(Box)<{ variant?: string }>(({ theme, variant }) => ({
  display: 'flex',
  height: '64px',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  borderRadius: '8px',
  backgroundColor:
    variant === 'administered'
      ? (theme as any).palette.customColors.OnBackground
      : variant === 'withheld'
      ? (theme as any).palette.customColors.neutral05
      : variant === 'stopped'
      ? (theme as any).palette.customColors.Tertiary20
      : (theme as any).palette.customColors.neutral05
}))

interface MedicinePrescriptionCardProps {
  open: boolean
  onClose: () => void
  medicineData: MedicinePrescriptionCardData
  dosageEntries?: PrescriptionCardDosageEntry[]
  dateOptions?: string[]
  onStopMedicine?: (data: StopMedicineFormData) => void
  onAddNewDosage?: (medicine: any) => void
  onRefreshEntry?: (entryId: Id, medicine: MedicineDetailState) => void
  handleDateChange?: (date: string) => void
  isDetailLoading?: boolean
  isDatesLoading?: boolean
  selectedDate: string
  onAdministerSelected?: (items: SelectedItem[], medicineData: MedicineDetailState, formData?: AdministerFormData) => void
  onSkipSelected?: (items: SelectedItem[], medicineData: MedicineDetailState, formData?: AdministerFormData) => void
  isAdministerLoading?: boolean
  isSkipLoading?: boolean
  selectedMedications: Id[]
  isStopMedicineLoading?: boolean
  setSelectedMedications: React.Dispatch<React.SetStateAction<Id[]>>
  onRestartMedicine?: () => void
  batchList?: BatchListState[]
  batchLoading?: boolean
  handleBatchSearch?: (value: string) => void
  isControlledSubstance?: boolean
  medicalMasterData?: MedicalMasterFormData
  mastersDataLoading?: boolean
  onUpdateMedicine?: () => void
}

interface FormValues {
  action: string
  quantity: string
  quantityUnit: string
  wastageQuantity: string
  wastageUnit: string
  notes: string
  batchNumber: any
  attachment: any
  skipReason: string
}

// Main Component
const MedicinePrescriptionCard = ({
  open,
  onClose,
  medicineData = {} as MedicinePrescriptionCardData,
  dosageEntries = [],
  dateOptions = [],
  onStopMedicine,
  onAddNewDosage,
  onRefreshEntry,
  handleDateChange,
  isDetailLoading = false,
  isDatesLoading = false,
  selectedDate,
  onAdministerSelected,
  onSkipSelected,
  isAdministerLoading = false,
  isSkipLoading = false,
  selectedMedications,
  isStopMedicineLoading,
  setSelectedMedications,
  onRestartMedicine,
  batchList = [],
  batchLoading,
  handleBatchSearch,
  isControlledSubstance = false,
  medicalMasterData,
  mastersDataLoading,
  onUpdateMedicine
}: MedicinePrescriptionCardProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const validationSchema = yup.object().shape(
    {
      action: yup.string().oneOf(['administer', 'skipped']).required('Action is required'),

      skipReason: yup.string().when('action', {
        is: 'skipped',
        then: schema =>
          schema
            .required('Skip reason is required when skipping medication')
            .min(5, 'Skip reason must be at least 5 characters long')
            .max(500, 'Skip reason cannot exceed 500 characters'),
        otherwise: schema => schema.notRequired()
      }),

      wastageQuantity: yup
        .string()
        .test('is-valid-number', 'Wastage quantity must be a valid number', value => {
          if (!value) return true
          const num = parseFloat(value)

          return !isNaN(num) && num >= 0
        })
        .when('wastageUnit', {
          is: (wastageUnit: string) => wastageUnit && wastageUnit.length > 0,
          then: schema => schema.required('Wastage quantity is required when wastage unit is provided'),
          otherwise: schema => schema.notRequired()
        }),

      wastageUnit: yup.string().when('wastageQuantity', {
        is: (wastageQuantity: string) => wastageQuantity && wastageQuantity.length > 0,
        then: schema => schema.required('Wastage unit is required when wastage quantity is provided'),
        otherwise: schema => schema.notRequired()
      }),

      notes: yup.string().max(10000, 'Notes cannot exceed 10000 characters'),

      batchNumber: yup.mixed().when('action', {
        is: 'administer',
        then: schema =>
          isControlledSubstance
            ? schema
                .required('Batch number is required for controlled substances')
                .test('valid-batch-object', 'Please select a valid batch', (value: any) => {
                  if (!value) return false

                  return value && value.batch_no && typeof value.batch_no === 'string'
                })
            : schema.nullable().notRequired(),
        otherwise: schema => schema.nullable().notRequired()
      })
    },
    [['wastageQuantity', 'wastageUnit']]
  )

  const defaultValues: FormValues = {
    action: 'administer',
    quantity: '',
    quantityUnit: '',
    wastageQuantity: '',
    wastageUnit: '',
    notes: '',
    batchNumber: null,
    attachment: null,
    skipReason: ''
  }

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: defaultValues,
    resolver: yupResolver(validationSchema) as any,
    mode: 'onChange'
  })

  const commonFieldStyles = {
    textAlign: 'left',
    borderRadius: '4px',
    '& .MuiOutlinedInput-root': {
      borderRadius: '4px'
    }
  }

  const actionType = watch('action')
  const params = useParams()
  const searchParams = useSearchParams()
  const { id } = params as any
  const date = searchParams?.get('date')
  const [activeTab, setActiveTab] = useState<any>(medicineData?.defaultTab || 1)
  const [stopMedicineModalOpen, setStopMedicineModalOpen] = useState<boolean>(false)

  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false)

  const medicine = {
    ...medicineData
  }

  const tabs = dateOptions?.length > 0 ? dateOptions : []

  const pendingMedications = dosageEntries?.filter(
    (item) => !item?.status || item?.status?.toLowerCase() === 'pending'
  )

  const allSelected = pendingMedications?.length > 0 && selectedMedications.length === pendingMedications.length
  const isSingleSelection = selectedMedications.length === 1

  useEffect(() => {
    if (open && stopMedicineModalOpen) setStopMedicineModalOpen(false)
  }, [open])

  useEffect(() => {
    if (!isSingleSelection) {
      reset(defaultValues)
    }
  }, [isSingleSelection, reset])

  const autoSelectSinglePendingMedication = useCallback(() => {
    if (!open || isDetailLoading || isDatesLoading) return

    const pendingMedications = dosageEntries?.filter(
      (item) => !item?.status || item?.status?.toLowerCase() === 'pending'
    )

    if (pendingMedications?.length === 1) {
      const singlePendingId = pendingMedications[0]?.administritive_id
      if (!selectedMedications.includes(singlePendingId ?? '')) {
        const isControlledSubstance = pendingMedications[0]?.controlled_substance == 1

        setSelectedMedications((prev: Id[]) => {
          if (isControlledSubstance) {
            return [singlePendingId ?? '']
          } else {
            return [...prev, singlePendingId ?? '']
          }
        })
      }
    }
  }, [open, dosageEntries, isDetailLoading, isDatesLoading, selectedMedications])

  useEffect(() => {
    autoSelectSinglePendingMedication()
  }, [autoSelectSinglePendingMedication])

  const handleTabChange = (event: React.SyntheticEvent, newValue: any) => {
    setActiveTab(newValue)
  }

  const handleStopMedicine = () => {
    setStopMedicineModalOpen(true)
  }

  const handleStopMedicineConfirm = (data: StopMedicineFormData) => {
    if (onStopMedicine) {
      onStopMedicine(data)
    }
  }

  const handleAddNewDosage = () => {
    if (onAddNewDosage) {
      onAddNewDosage(medicine)
    }
  }

  const handleRefreshEntry = (entryId: Id) => {
    if (onRefreshEntry) {
      onRefreshEntry(entryId, medicine)
    }
  }

  const handleMedicationSelect = (medicationId: Id, checked: boolean, isControlledSubstance: boolean) => {
    setSelectedMedications(prev => {
      if (isControlledSubstance) {
        return checked ? [medicationId] : []
      } else {
        if (checked) {
          return [...prev, medicationId]
        } else {
          return prev.filter(id => id !== medicationId)
        }
      }
    })
  }

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedMedications([])
    } else {
      const allPendingIds = pendingMedications?.map((item) => item?.administritive_id ?? '') || []
      setSelectedMedications(allPendingIds)
    }
  }

  const handleAdministerSelected = () => {
    if (onAdministerSelected) {
      const selectedItems = dosageEntries?.filter((item) =>
        selectedMedications.includes(item?.administritive_id ?? '')
      )
      onAdministerSelected(selectedItems, medicineData)

      setIsSelectionMode(false)
    }
  }

  const handleSkipSelected = () => {
    if (onSkipSelected) {
      const selectedItems = dosageEntries?.filter(item =>
        selectedMedications.includes(item?.administritive_id ?? '')
      )
      onSkipSelected(selectedItems, medicineData)

      setIsSelectionMode(false)
    }
  }

  const handleAdministerSelectedControlSubstanceProduct = (formData: AdministerFormData) => {
    if (onAdministerSelected) {
      const selectedItems = dosageEntries?.filter(item =>
        selectedMedications.includes(item?.administritive_id ?? '')
      )
      onAdministerSelected(selectedItems, medicineData, formData)
      setIsSelectionMode(false)
    }
  }

  const handleSkipSelectedControlSubstanceProduct = (formData: AdministerFormData) => {
    if (onSkipSelected) {
      const selectedItems = dosageEntries?.filter(item =>
        selectedMedications.includes(item?.administritive_id ?? '')
      )
      onSkipSelected(selectedItems, medicineData, formData)
      setIsSelectionMode(false)
    }
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ''
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12

    return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`
  }

  const handleClose = () => {
    setSelectedMedications([])
    setIsSelectionMode(false)
    onClose()
  }

  const handleAddNewDosageTimeCheck = (data: Pick<SingleOrMultipleDoseAdministerOrSkipTransformedData, 'scheduledTime'> | string) => {
    const scheduledTime = typeof data === 'string' ? '' : data?.scheduledTime ?? ''
    const datePart = selectedDate.split(' ')[0]
    const targetDateTime = new Date(`${datePart}T${convertTo24Hour(scheduledTime)}`)
    const now = new Date()

    if (isNaN(targetDateTime.getTime())) {
      console.error('Invalid date or time format')

      return false
    }

    const targetDate = new Date(datePart)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    targetDate.setHours(0, 0, 0, 0)

    if (targetDate.getTime() === today.getTime()) {
      return true
    } else if (targetDateTime > now) {
      return true
    } else {
      return false
    }
  }

  function convertTo24Hour(time12h: string) {
    if (!time12h) return '00:00:00'
    let [hour, modifier]: any = time12h.split(' ')
    hour = parseInt(hour, 10)

    if (modifier.toUpperCase() === 'PM' && hour !== 12) hour += 12
    if (modifier.toUpperCase() === 'AM' && hour === 12) hour = 0

    return `${hour.toString().padStart(2, '0')}:00:00`
  }

  if (!open) return null

  const isLocalStopDatePassed = (stopDateString: string) => {
    if (!stopDateString) return false

    try {
      const [datePart, timePart] = stopDateString.split(' ')
      const [year, month, day] = datePart.split('-')
      const [hours, minutes, seconds] = timePart.split(':')

      const stopDateUTC = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      )

      const stopDateLocal = new Date(stopDateUTC)
      const now = new Date()

      return stopDateLocal < now
    } catch (error) {
      console.error('Error parsing stop date:', error)

      return false
    }
  }

  const isStopDatePassed = (stopDateString: string) => {
    if (!stopDateString) return false

    try {
      const [datePart, timePart] = stopDateString.split(' ')
      const [year, month, day] = datePart.split('-')
      const [hours, minutes, seconds] = timePart.split(':')

      const stopDateUTC = new Date(
        Date.UTC(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          parseInt(seconds)
        )
      )

      const stopDateLocal = new Date(stopDateUTC)
      const now = new Date()

      return stopDateLocal < now
    } catch (error) {
      console.error('Error parsing stop date:', error)

      return false
    }
  }

  const handleRestartMedicine = async () => {
    if (onRestartMedicine) onRestartMedicine()
  }

  const handleUpdateMedicine = async () => {
    if (onUpdateMedicine) onUpdateMedicine()
  }

  const renderDosageEntry = (entry: any) => (
    <DosageSection key={entry.id} variant={entry.variant}>
      <DosageHeader variant={entry.status}>
        <Box sx={{ display: 'flex', padding: '0 16px', alignItems: 'center', gap: '4px', flex: '1 0 0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {entry.variant === 'administered' ? (
              <Box
                component='img'
                src='/images/hospital/check.svg'
                alt='Administered'
                sx={{
                  width: '18px',
                  height: '18px'
                }}
              />
            ) : (
              <Box
                component='img'
                src={
                  entry.status?.toLowerCase() === 'stopped' ? '/images/hospital/stop.svg' : '/images/hospital/skip.svg'
                }
                alt='Not Administered'
                sx={{
                  width: '18px',
                  height: '18px'
                }}
              />
            )}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '2px',
                flex: '1 0 0'
              }}
            >
              <Typography
                variant='h6'
                sx={{
                  fontWeight: 600,
                  fontSize: '16px',
                  color:
                    entry.status?.toLowerCase() === 'stopped'
                      ? theme.palette.customColors.OnTertiaryContainer
                      : theme.palette.common.black,
                  textDecoration: entry.isStrikethrough ? 'line-through' : 'none'
                }}
              >
                {formatTime(entry?.scheduledTime)}
              </Typography>
              <Typography
                variant='body2'
                sx={{
                  fontSize: '14px',
                  color:
                    entry.status?.toLowerCase() === 'stopped'
                      ? theme.palette.customColors.OnTertiaryContainer
                      : theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {entry?.status?.toLowerCase() === 'withheld'
                  ? t('hospital_module.skipped')
                  : entry.status?.charAt(0).toUpperCase() + entry.status?.slice(1)}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', paddingRight: '16px', alignItems: 'center', gap: '20px' }}>
          <Typography
            variant='body1'
            sx={{
              fontSize: '16px',
              fontWeight: 500,
              color: theme.palette.customColors.OnSurfaceVariant,
              textDecoration: entry.isStrikethrough ? 'line-through' : 'none'
            }}
          >
            {entry.amount}
          </Typography>
        </Box>
      </DosageHeader>

      {entry?.batch_details?.length > 0 &&
        (entry.batch_details?.[0]?.wastage_qty || entry?.batch_details?.[0]?.batch_note) && (
          <Box sx={{ display: 'flex', padding: '0 16px', flexDirection: 'column', gap: '4px' }}>
            {entry.batch_details?.[0]?.wastage_qty && entry.batch_details?.[0]?.wastage_unit_name ? (
              <Typography
                variant='body1'
                sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnPrimaryContainer }}
              >
                Wastage - {entry.batch_details?.[0]?.wastage_qty} {entry.batch_details?.[0]?.wastage_unit_name}
              </Typography>
            ) : null}
            {entry?.batch_details?.[0]?.batch_note && (
              <Typography variant='body2' sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}>
                {entry?.batch_details?.[0]?.batch_note}
              </Typography>
            )}
          </Box>
        )}
      {entry?.batch_details?.length > 0 && entry?.batch_details?.[0]?.batch_no && (
        <Box sx={{ display: 'flex', padding: '0 16px', alignItems: 'center', gap: '8px' }}>
          <Box
            sx={{
              width: '48px',
              height: '48px',
              borderRadius: '6px',
              backgroundColor: theme.palette.grey[300],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {entry?.batch_details?.[0]?.batch_no_image ? (
              <Avatar
                src={entry?.batch_details?.[0]?.batch_no_image}
                alt='Hospital Icon'
                sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '6px'
                }}
                slotProps={{
                  img: {
                    style: {
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%'
                    }
                  }
                }}
              />
            ) : (
              <Icon icon='mdi:package-variant' fontSize='24px' color={theme.palette.grey[600]} />
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', flex: '1 0 0' }}>
            <Typography variant='body2' sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}>
              Batch Number
            </Typography>
            <Typography
              variant='body1'
              sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
            >
              {entry?.batch_details?.[0]?.batch_no}
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', padding: '0 16px', alignItems: 'center', gap: '10px', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 0 0' }}>
          <UserAvatarDetails
            user_name={entry?.administeredBy}
            profile_image={entry?.user_profile_pic}
            date={entry?.administeredAt}
            show_time={true}
          />
        </Box>

        {entry?.status?.toLowerCase() != 'stopped' && (
          <IconButton size='small' sx={{ width: '2rem', height: '2rem' }} onClick={() => handleRefreshEntry(entry.id)}>
            <Icon icon='mdi:refresh' fontSize='20px' color={theme.palette.customColors.Tertiary} />
          </IconButton>
        )}
      </Box>
    </DosageSection>
  )

  const onFormSubmit = (data: FormValues) => {
    if (actionType === 'administer') {
      handleAdministerSelectedControlSubstanceProduct(data)
    } else {
      handleSkipSelectedControlSubstanceProduct(data)
    }
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              width: isMobile ? '100vw' : 600,
              maxWidth: '100vw',
              display: 'flex',
              flexDirection: 'column',
              px: '24px',
              py: '0px'
            }
          }
        }}
      >
        <DrawerContent>
          {/* Header Section */}
          {isDetailLoading || isDatesLoading ? (
            <HeaderShimmer theme={theme} />
          ) : (
            <HeaderSection>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 0 0' }}>
                  <Typography
                    variant='h5'
                    sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                  >
                    {medicine?.controlled_substance == 1 &&
                      RenderUtility?.renderControlLabel(medicine?.controlled_substance, 'CS')}
                    {RenderUtility?.renderPrescriptionLabel(medicine?.prescription_required, 'PR')} {medicine?.name}
                  </Typography>
                </Box>
                <Box>
                  {!medicineData?.stop_date && (
                    <IconButton onClick={handleUpdateMedicine}>
                      <Icon icon='mdi:edit' fontSize='24px' color={theme.palette.customColors.OnPrimaryContainer} />
                    </IconButton>
                  )}
                  <IconButton onClick={handleClose}>
                    <Icon icon='mdi:close' fontSize='24px' color={theme.palette.customColors.OnPrimaryContainer} />
                  </IconButton>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '1 0 0' }}>
                  <Box
                    sx={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '30px',
                      backgroundColor: theme.palette.customColors.OnSurface,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon icon='material-symbols:ecg-heart-outline-sharp' fontSize='10px' color='white' />
                  </Box>
                  <Typography
                    variant='body2'
                    sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.customColors.OnSurface }}
                  >
                    {medicine.medId}
                  </Typography>
                  <Box
                    sx={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '10px',
                      backgroundColor: theme.palette.primary.main
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon
                      icon='material-symbols:line-start-circle'
                      fontSize='20px'
                      color={theme.palette.primary.main}
                    />
                    <Typography
                      variant='body2'
                      sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      {Utility.formatDisplayDate(medicine.startDate)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon
                      icon='material-symbols:line-end-square'
                      fontSize='20px'
                      color={theme.palette.customColors.Error}
                    />
                    <Typography
                      variant='body2'
                      sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      {Utility.formatDisplayDate(medicine.endDate)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </HeaderSection>
          )}

          {/* Info Section */}
          {isDetailLoading || isDatesLoading ? (
            <InfoSectionShimmer theme={theme} />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <InfoGroupContainer>
                <InfoItem>
                  <Icon
                    icon='material-symbols:timer-outline'
                    fontSize='32px'
                    color={theme.palette.customColors.OnSurfaceVariant}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 0 0' }}>
                    <Typography
                      variant='body1'
                      sx={{ fontSize: '16px', fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      {medicine.dosage}
                    </Typography>
                    <Typography
                      variant='body2'
                      sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      Dosage
                    </Typography>
                  </Box>
                </InfoItem>
                <InfoItem>
                  <Icon
                    icon='majesticons:pulse-line'
                    fontSize='32px'
                    color={theme.palette.customColors.OnSurfaceVariant}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 0 0' }}>
                    <Typography
                      variant='body1'
                      sx={{ fontSize: '16px', fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      {medicine.frequency}
                    </Typography>
                    <Typography
                      variant='body2'
                      sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      Frequency
                    </Typography>
                  </Box>
                </InfoItem>
              </InfoGroupContainer>

              <InfoGroupContainer sx={{ borderRadius: !medicine?.notes ? '0 0 8px 8px' : undefined }}>
                <InfoItem>
                  <Icon icon='uil:calender' fontSize='32px' color={theme.palette.customColors.OnSurfaceVariant} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 0 0' }}>
                    <Typography
                      variant='body1'
                      sx={{ fontSize: '16px', fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      {medicine?.frequency === 'One Time' ? '1 Day' : medicine?.duration}
                    </Typography>
                    <Typography
                      variant='body2'
                      sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      Duration
                    </Typography>
                  </Box>
                </InfoItem>
                <InfoItem>
                  <Icon
                    icon='icon-park-outline:medicine-bottle-one'
                    fontSize='32px'
                    color={theme.palette.customColors.OnSurfaceVariant}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 0 0' }}>
                    <Typography
                      variant='body1'
                      sx={{ fontSize: '16px', fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      {medicine.deliveryRoute}
                    </Typography>
                    <Typography
                      variant='body2'
                      sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      Delivery route
                    </Typography>
                  </Box>
                </InfoItem>
              </InfoGroupContainer>

              {medicine?.notes && (
                <NotesContainer>
                  <Icon icon='mdi:note-text' fontSize='24px' color={theme.palette.warning.main} />
                  <Typography
                    variant='body2'
                    sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant, flex: '1 0 0' }}
                  >
                    {medicine.notes}
                  </Typography>
                </NotesContainer>
              )}

              <Typography
                variant='caption'
                sx={{
                  fontSize: '12px',
                  fontStyle: 'italic',
                  color: theme.palette.customColors.neutralSecondary,
                  padding: '8px 20px 0'
                }}
              >
                {medicine.lastEdited}
              </Typography>
            </Box>
          )}

          {/* Date Tabs */}
          {isDetailLoading || isDatesLoading ? (
            <DateTabsShimmer theme={theme} />
          ) : (
            <Box
              sx={{
                display: 'flex',
                backgroundColor: theme.palette.background.paper,
                my: '16px',
                padding: 0,
                mx: '-24px',
                width: 'calc(100% + 48px)'
              }}
            >
              <HorizontalDateNav
                {...({
                  dates: dateOptions,
                  onDateSelect: handleDateChange,
                  selectedDate: selectedDate,
                  showYear: true,
                  year: selectedDate ? selectedDate.split(' ')[0].split('-')[0] : '',
                  containerStyle: {
                    backgroundColor: theme.palette.background.paper,
                    borderBottom: `0.5px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderTop: `0.5px solid ${theme.palette.customColors.OutlineVariant}`
                  }
                } as any)}
              />
            </Box>
          )}

          {/* Bottom Container */}
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              flex: 1,
              overflowY: 'auto',
              minHeight: 0
            }}
          >
            {isDetailLoading || isDatesLoading ? (
              <>
                <DosageEntriesShimmer theme={theme} />
                <ButtonsShimmer theme={theme} />
              </>
            ) : (
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {dosageEntries?.map(item => {
                  const isPending = !item?.status || item?.status?.toLowerCase() === 'pending'
                  const isSelected = selectedMedications.includes(item?.administritive_id ?? '')
                  const isControlledSubstance = item?.controlled_substance == 1 ? true : false

                  const isFutureTime = () => {
                    if (!selectedDate || !item?.scheduled_time) return false

                    const datePart = selectedDate.split(' ')[0]
                    const [hours, minutes] = item.scheduled_time.split(':')
                    const scheduledDateTime = new Date(`${datePart}T${hours}:${minutes}:00`)
                    const now = new Date()

                    return scheduledDateTime > now
                  }

                  const isAllowedDate = () => {
                    if (!selectedDate) return false

                    const today = new Date()
                    today.setHours(0, 0, 0, 0)

                    const selected = new Date(selectedDate.split(' ')[0])
                    selected.setHours(0, 0, 0, 0)
                    const result = selected <= today

                    return result
                  }

                  return isPending ? (
                    <MedicationTimeCard
                      key={item?.administritive_id}
                      time={formatTime(item?.scheduled_time ?? '')}
                      dosage={`${item?.scheduled_quantity} ${item?.scheduled_unit_name}`}
                      amount={`${item?.scheduled_quantity} ${item?.scheduled_unit_name}`}
                      checked={isSelected}
                      onChange={(checked: boolean) =>
                        handleMedicationSelect(item?.administritive_id ?? '', checked, isControlledSubstance)
                      }
                      disabled={!isAllowedDate()}
                      isControlledSubstance={isControlledSubstance}
                    />
                  ) : (
                    renderDosageEntry({
                      id: item?.administritive_id,
                      scheduledTime: item?.scheduled_time,
                      time: formatTime(item?.administritive_time ?? ''),
                      status: item?.status || 'Pending',
                      dosage: `${item?.scheduled_quantity} ${item?.scheduled_unit_name}`,
                      amount:
                        item?.status?.toLowerCase() === 'administered'
                          ? `${item?.quantity_administered || item?.scheduled_quantity}`
                          : `${item?.quantity_administered || item?.scheduled_quantity} ${item?.scheduled_unit_name}`,
                      variant:
                        item?.status?.toLowerCase() === 'administered'
                          ? 'administered'
                          : item?.status?.toLowerCase() === 'skipped'
                          ? 'skipped'
                          : 'stopped',
                      icon:
                        item?.status?.toLowerCase() === 'administered'
                          ? CheckCircleIcon
                          : item?.status?.toLowerCase() === 'skipped'
                          ? DoDisturbIcon
                          : DoDisturbIcon,
                      wastage: item?.wastage_quantity ? `Wastage: ${item?.wastage_quantity}` : null,
                      wastageNote: item?.notes || '',
                      batchNumber: item?.batch_details?.[0]?.batch_number || null,
                      administeredBy: item?.user_full_name || 'Unknown',
                      administeredAt: item?.modified_at ? item.modified_at : '',
                      isStrikethrough: item?.status?.toLowerCase() === 'stopped',
                      batch_details: item?.batch_details,
                      user_profile_pic: item?.user_profile_pic
                    })
                  )
                })}

                {isSingleSelection && isControlledSubstance && (
                  <Box sx={{ backgroundColor: 'white' }}>
                    <Box sx={{ py: 6 }}>
                      <form onSubmit={handleSubmit(onFormSubmit)}>
                        <Grid container spacing={4}>
                          {actionType === 'administer' ? (
                            <>
                              {/* Wastage Section with Accordion */}
                              <Grid size={{ xs: 12 }}>
                                <Accordion
                                  defaultExpanded={isControlledSubstance}
                                  disableGutters
                                  sx={{
                                    border: 'none',
                                    boxShadow: 'none'
                                  }}
                                >
                                  <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls='wastage-content'
                                    id='wastage-header'
                                    sx={{
                                      px: 0,
                                      minHeight: 'auto',
                                      '& .MuiAccordionSummary-content': {
                                        margin: '0.5rem 0'
                                      },
                                      '& .MuiAccordionSummary-content.Mui-expanded': {
                                        margin: '0.5rem 0 1rem'
                                      }
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontSize: '1rem',
                                        fontWeight: 500,
                                        color: theme.palette.customColors.OnSurfaceVariant
                                      }}
                                    >
                                      Add wastage if any
                                      <Typography
                                        component='span'
                                        sx={{
                                          fontSize: '1rem',
                                          color: theme.palette.customColors.neutralSecondary,
                                          ml: 1
                                        }}
                                      >
                                        (Optional)
                                      </Typography>
                                    </Typography>
                                  </AccordionSummary>
                                  <AccordionDetails sx={{ px: 0, py: 1 }}>
                                    <Grid container spacing={4}>
                                      <Grid size={{ xs: 12, md: 6 }}>
                                        <ControlledTextField
                                          name='wastageQuantity'
                                          control={control}
                                          errors={errors}
                                          sx={commonFieldStyles}
                                          label='Quantity'
                                          placeholder='Enter Quantity'
                                          type='number'
                                        />
                                      </Grid>

                                      <Grid size={{ xs: 12, md: 6 }}>
                                        <ControlledSelect
                                          name='wastageUnit'
                                          label='Unit'
                                          control={control}
                                          errors={errors}
                                          sx={commonFieldStyles}
                                          options={medicalMasterData?.prescriptionDosageMeasurementType}
                                          getOptionLabel={(option: any) => option.label}
                                          getOptionValue={(option: any) => option.value}
                                          loading={mastersDataLoading}
                                        />
                                      </Grid>

                                      <Grid size={{ xs: 12 }}>
                                        <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, mb: 2 }}>
                                          Notes
                                        </Typography>
                                        <ControlledTextArea
                                          name='notes'
                                          control={control}
                                          errors={errors}
                                          sx={commonFieldStyles}
                                          placeholder='Enter Notes'
                                          rows={3}
                                        />
                                      </Grid>

                                      <Grid size={{ xs: 12 }}>
                                        <ControlledAutocomplete
                                          name='batchNumber'
                                          control={control}
                                          errors={errors}
                                          sx={commonFieldStyles}
                                          label={
                                            isControlledSubstance
                                              ? 'Enter batch number (required)'
                                              : 'Enter batch number if any (optional)'
                                          }
                                          options={batchList}
                                          getOptionLabel={(option: any) => {
                                            if (typeof option === 'string') return option

                                            return option?.label || option?.batch_no || ''
                                          }}
                                          getOptionValue={(option: any) => {
                                            if (typeof option === 'string') return option

                                            return option
                                          }}
                                          isOptionEqualToValue={(option: any, value: any) => {
                                            if (!option || !value) return false
                                            const optionId = option?.id
                                            const valueId = value?.id

                                            return optionId === valueId
                                          }}
                                          loading={batchLoading}
                                          onInputChange={handleBatchSearch}
                                          required={isControlledSubstance}
                                          autocompleteProps={{
                                            filterOptions: (x: any) => x,
                                            noOptionsText: batchLoading ? 'Loading...' : 'Type to search batches'
                                          }}
                                        />
                                      </Grid>

                                      <Grid size={{ xs: 12 }}>
                                        <ControlledMultiFileUpload
                                          name='attachment'
                                          control={control}
                                          errors={errors}
                                          sx={commonFieldStyles}
                                          label='Batch Image'
                                          maxFiles={1}
                                          maxFileSize={5 * 1024 * 1024}
                                          acceptedFileTypes='images'
                                        />
                                      </Grid>
                                    </Grid>
                                  </AccordionDetails>
                                </Accordion>
                              </Grid>
                            </>
                          ) : (
                            <>
                              {/* Reason for Skip Section */}
                              <Grid size={{ xs: 12 }}>
                                <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, mb: 2 }}>
                                  Reason for Skipping
                                </Typography>
                                <ControlledTextArea
                                  name='skipReason'
                                  control={control}
                                  errors={errors}
                                  sx={commonFieldStyles}
                                  placeholder='Enter reason for skipping'
                                  rows={4}
                                  required={actionType === 'skipped'}
                                />
                              </Grid>
                            </>
                          )}
                        </Grid>
                      </form>
                    </Box>
                  </Box>
                )}

                {stopMedicineModalOpen && !isStopDatePassed(medicineData?.stop_date ?? '') ? (
                  <StopMedicine
                    open={stopMedicineModalOpen}
                    onClose={() => setStopMedicineModalOpen(false)}
                    onConfirm={handleStopMedicineConfirm}
                    medicineData={medicineData}
                    isLoading={isStopMedicineLoading}
                  />
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                      marginTop: 'auto',
                      mt: 2,
                      mb: 12
                    }}
                  >
                    {(new Date().toISOString().split('T')[0] === selectedDate || medicineData?.show_stop_button) &&
                    !medicineData?.stop_date ? (
                      <Button
                        variant='text'
                        startIcon={
                          <Box
                            component='img'
                            src='/images/hospital/stop.svg'
                            alt='Stop'
                            sx={{
                              width: '18px',
                              height: '18px'
                            }}
                          />
                        }
                        onClick={handleStopMedicine}
                        disabled={isDetailLoading}
                        sx={{
                          color: theme.palette.customColors.Tertiary,
                          fontSize: '16px',
                          fontWeight: 500,
                          justifyContent: 'left',
                          transform: 'none',
                          textTransform: 'none',
                          width: 'auto'
                        }}
                      >
                        Stop Medicine
                      </Button>
                    ) : (isStopDatePassed(medicineData?.stop_date ?? '') ||
                        isLocalStopDatePassed(medicineData?.stop_date ?? '')) &&
                      medicineData?.will_restart != 0 ? (
                      <Button
                        variant='text'
                        startIcon={
                          <Box
                            component='img'
                            src='/images/hospital/stop.svg'
                            alt='Restart'
                            sx={{ width: '18px', height: '18px' }}
                          />
                        }
                        onClick={handleRestartMedicine}
                        disabled={isDetailLoading}
                        sx={{
                          color: theme.palette.customColors.OnSurface,
                          fontSize: '16px',
                          fontWeight: 500,
                          justifyContent: 'left',
                          transform: 'none',
                          textTransform: 'none',
                          width: 'auto'
                        }}
                      >
                        Restart Medicine
                      </Button>
                    ) : (
                      <Box></Box>
                    )}
                    {handleAddNewDosageTimeCheck(selectedDate) &&
                      !isStopDatePassed(medicineData?.stop_date ?? '') &&
                      medicineData?.prescription_frequency !== 'one_time' &&
                      medicineData?.prescription_created_for !== 'direct_administer' && (
                        <Button
                          variant='text'
                          startIcon={<Icon icon='mdi:plus' />}
                          onClick={handleAddNewDosage}
                          disabled={isDetailLoading}
                          sx={{
                            color: theme.palette.customColors.OnSurface,
                            fontSize: '16px',
                            fontWeight: 500,
                            transform: 'none',
                            textTransform: 'none'
                          }}
                        >
                          Add New Dosage
                        </Button>
                      )}
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Selection Actions */}
          {selectedMedications?.length > 0 && (
            <Box
              sx={{
                position: 'sticky',
                bottom: 0,
                left: 0,
                right: 0,
                mx: '-24px',
                px: 6,
                flexShrink: 0,
                zIndex: 10,
                backgroundColor: theme.palette.background.paper,
                boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.06)'
              }}
            >
              {!stopMedicineModalOpen &&
                (isControlledSubstance ? (
                  <Box
                    sx={{
                      py: 6,
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <LoadingButton
                      variant='outlined'
                      name='actionType'
                      type='button'
                      loading={isSkipLoading}
                      onClick={() => {
                        setValue('action', 'skipped')
                        handleSkipSelected()
                      }}
                      disabled={selectedMedications.length === 0}
                      sx={{ flex: 1, py: 2, height: '48px' }}
                    >
                      SKIPPED
                    </LoadingButton>
                    <LoadingButton
                      variant='contained'
                      type='submit'
                      loading={isAdministerLoading}
                      onClick={handleSubmit(onFormSubmit)}
                      disabled={selectedMedications.length === 0}
                      sx={{ flex: 1, py: 2, height: '48px' }}
                    >
                      ADMINISTER
                    </LoadingButton>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      py: 6,
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <LoadingButton
                      variant='outlined'
                      type='button'
                      loading={isSkipLoading}
                      onClick={() => {
                        setValue('action', 'skipped')
                        handleSkipSelected()
                      }}
                      disabled={selectedMedications.length === 0}
                      sx={{ flex: 1, py: 2, height: '48px' }}
                    >
                      SKIPPED
                    </LoadingButton>
                    <LoadingButton
                      variant='contained'
                      type='button'
                      loading={isAdministerLoading}
                      onClick={handleAdministerSelected}
                      disabled={selectedMedications.length === 0}
                      sx={{ flex: 1, py: 2, height: '48px' }}
                    >
                      ADMINISTER
                    </LoadingButton>
                  </Box>
                ))}
            </Box>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default MedicinePrescriptionCard

// Shimmer Components
const HeaderShimmer = ({ theme }: { theme: any }) => (
  <HeaderSection>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 0 0' }}>
        <Skeleton variant='text' width='70%' height={32} />
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '1 0 0' }}>
            <Skeleton variant='circular' width={16} height={16} />
            <Skeleton variant='text' width='100px' height={20} />
            <Skeleton variant='circular' width={8} height={8} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Skeleton variant='circular' width={20} height={20} />
              <Skeleton variant='text' width='80px' height={20} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Skeleton variant='circular' width={20} height={20} />
              <Skeleton variant='text' width='80px' height={20} />
            </Box>
          </Box>
        </Box>
      </Box>
      <Skeleton variant='circular' width={32} height={32} />
    </Box>
  </HeaderSection>
)

const InfoSectionShimmer = ({ theme }: { theme: any }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
    <InfoGroupContainer>
      <InfoItem>
        <Skeleton variant='circular' width={32} height={32} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 0 0' }}>
          <Skeleton variant='text' width='60%' height={24} />
          <Skeleton variant='text' width='40%' height={20} />
        </Box>
      </InfoItem>
      <InfoItem>
        <Skeleton variant='circular' width={32} height={32} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 0 0' }}>
          <Skeleton variant='text' width='60%' height={24} />
          <Skeleton variant='text' width='40%' height={20} />
        </Box>
      </InfoItem>
    </InfoGroupContainer>

    <InfoGroupContainer sx={{ borderRadius: '0' }}>
      <InfoItem>
        <Skeleton variant='circular' width={32} height={32} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 0 0' }}>
          <Skeleton variant='text' width='60%' height={24} />
          <Skeleton variant='text' width='40%' height={20} />
        </Box>
      </InfoItem>
      <InfoItem>
        <Skeleton variant='circular' width={32} height={32} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 0 0' }}>
          <Skeleton variant='text' width='60%' height={24} />
          <Skeleton variant='text' width='40%' height={20} />
        </Box>
      </InfoItem>
    </InfoGroupContainer>

    <NotesContainer>
      <Skeleton variant='circular' width={24} height={24} />
      <Skeleton variant='text' width='100%' height={20} />
    </NotesContainer>

    <Skeleton variant='text' width='40%' height={16} sx={{ margin: '8px 20px 0' }} />
  </Box>
)

const DateTabsShimmer = ({ theme }: { theme: any }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      px: 1,
      height: '48px',
      backgroundColor: '#E8F4F2',
      borderRadius: 1,
      my: '16px',
      mx: '-24px',
      width: 'calc(100% + 48px)'
    }}
  >
    <Box
      sx={{
        fontSize: '20px',
        fontWeight: 500,
        backgroundColor: theme.palette.grey[300],
        color: 'transparent',
        height: '100%',
        borderRadius: 1,
        minWidth: '82px',
        flexShrink: 0,
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'shimmer 1.5s infinite linear',
        background: `linear-gradient(90deg, ${theme.palette.grey[300]} 25%, ${theme.palette.grey[200]} 50%, ${theme.palette.grey[300]} 75%)`,
        backgroundSize: '200% 100%'
      }}
    >
      2024
    </Box>

    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        flex: 1,
        height: '100%',
        paddingLeft: '100px',
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none'
      }}
    >
      {[1, 2, 3, 4, 5].map(item => (
        <Box
          key={item}
          sx={{
            width: 120,
            minWidth: 120,
            height: '32px',
            borderRadius: 1,
            marginLeft: 0.5,
            backgroundColor: theme.palette.grey[300],
            animation: 'shimmer 1.5s infinite linear',
            background: `linear-gradient(90deg, ${theme.palette.grey[300]} 25%, ${theme.palette.grey[200]} 50%, ${theme.palette.grey[300]} 75%)`,
            backgroundSize: '200% 100%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Box
              sx={{
                width: '60px',
                height: '16px',
                backgroundColor: theme.palette.grey[400],
                borderRadius: '2px',
                animation: 'shimmer 1.5s infinite linear',
                background: `linear-gradient(90deg, ${theme.palette.grey[400]} 25%, ${theme.palette.grey[300]} 50%, ${theme.palette.grey[400]} 75%)`,
                backgroundSize: '200% 100%'
              }}
            />
          </Box>
        </Box>
      ))}
    </Box>

    <style>
      {`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}
    </style>
  </Box>
)

const DosageEntriesShimmer = ({ theme }: { theme: any }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        borderRadius: '8px',
        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
        padding: '16px'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Skeleton variant='circular' width={24} height={24} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <Skeleton variant='text' width='40%' height={24} />
          <Skeleton variant='text' width='30%' height={20} />
        </Box>
        <Skeleton variant='text' width='15%' height={20} />
        <Skeleton variant='text' width='10%' height={20} />
      </Box>
    </Box>

    {[1, 2, 3].map(item => (
      <Box
        key={item}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          borderRadius: '8px',
          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          padding: '16px'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Skeleton variant='circular' width={24} height={24} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <Skeleton variant='text' width='40%' height={24} />
            <Skeleton variant='text' width='30%' height={20} />
          </Box>
          <Skeleton variant='text' width='15%' height={20} />
          <Skeleton variant='text' width='10%' height={20} />
        </Box>

        {item === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Skeleton variant='text' width='50%' height={20} />
            <Skeleton variant='text' width='80%' height={16} />
          </Box>
        )}

        {item === 2 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Skeleton variant='rectangular' width={48} height={48} sx={{ borderRadius: '6px' }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
              <Skeleton variant='text' width='40%' height={16} />
              <Skeleton variant='text' width='60%' height={20} />
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 0 0' }}>
            <Skeleton variant='circular' width={34} height={34} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Skeleton variant='text' width='100px' height={16} />
              <Skeleton variant='text' width='80px' height={12} />
            </Box>
          </Box>
          <Skeleton variant='circular' width={24} height={24} />
        </Box>
      </Box>
    ))}
  </Box>
)

const ButtonsShimmer = ({ theme }: { theme: any }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
      marginTop: 'auto',
      mt: 2,
      mb: 12
    }}
  >
    <Skeleton variant='rounded' width={120} height={36} />
    <Skeleton variant='rounded' width={140} height={36} />
  </Box>
)
