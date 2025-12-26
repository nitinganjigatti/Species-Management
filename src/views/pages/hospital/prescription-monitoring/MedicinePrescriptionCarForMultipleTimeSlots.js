/* eslint-disable lines-around-comment */
import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Tab,
  Drawer,
  useTheme,
  useMediaQuery,
  Skeleton,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid
} from '@mui/material'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import MedicationTimeCard from './MedicationTimeCard'
import Utility from 'src/utility'
import { LoadingButton } from '@mui/lab'
import DoDisturbIcon from '@mui/icons-material/DoDisturb'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import TreatmentTypeRadioButtons from '../utility/TreatmentTypeRadioButtons'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'

// Custom styled components for drawer content
const DrawerContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100%',
  backgroundColor: theme.palette.background.paper
}))

const HeaderSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  width: '100%',
  padding: '24px 0px',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper
}))

const InfoGroupContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: '20px',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  borderRadius: '8px 8px 0 0',
  backgroundColor: theme.palette.customColors.displaybgPrimary
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
  backgroundColor: theme.palette.customColors.Notes
}))

const DateTab = styled(Tab)(({ theme, selected }) => ({
  padding: '15px 24px',
  borderBottom: selected
    ? `2px solid ${theme.palette.primary.main}`
    : `0.5px solid ${theme.palette.customColors.OutlineVariant}`,
  borderRight: `0.5px solid ${theme.palette.customColors.OutlineVariant}`,
  color: selected ? theme.palette.primary.main : theme.palette.customColors.neutralSecondary,
  fontWeight: 600,
  fontSize: '14px',
  minHeight: 'auto'
}))

const DosageSection = styled(Box)(({ theme, variant }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  width: '100%',
  borderRadius: '8px',
  border:
    variant === 'administered'
      ? `1px solid ${theme.palette.primary.main}80`
      : `1px solid ${theme.palette.customColors.OutlineVariant}`
}))

const DosageHeader = styled(Box)(({ theme, variant }) => ({
  display: 'flex',
  height: '64px',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  borderRadius: '8px',
  backgroundColor:
    variant === 'administered'
      ? theme.palette.customColors.OnBackground
      : variant === 'withheld'
      ? theme.palette.customColors.neutral05
      : variant === 'stopped'
      ? theme.palette.customColors.Tertiary20
      : theme.palette.customColors.neutral05
}))

const LoadingOverlay = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '40px',
  width: '100%'
}))

// Main Component
const MedicinePrescriptionCardForMultipleTimeSlots = ({
  open,
  onClose,
  medicineData = {},
  dosageEntries = [],
  dateOptions = [],
  onStopMedicine,
  onAddNewDosage,
  onRefreshEntry,
  isDetailLoading = false,
  selectedDate,
  onAdministerSelected,
  onSkipSelected,
  isAdministerLoading = false,
  isSkipLoading = false,
  selectedMedications,
  setSelectedMedications,
  medicalMasterData,
  mastersDataLoading,
  batchList = [],
  batchLoading,
  handleBatchSearch,
  isControlledSubstance = false
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [activeTab, setActiveTab] = useState(medicineData?.defaultTab || 1)
  const [stopMedicineModalOpen, setStopMedicineModalOpen] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  const medicine = {
    ...medicineData
  }

  const tabs = dateOptions?.length > 0 ? dateOptions : []

  // Filter pending medications
  const pendingMedications = dosageEntries?.filter(item => !item?.status || item?.status?.toLowerCase() === 'pending')

  // Check if all pending medications are selected
  const allSelected = pendingMedications?.length > 0 && selectedMedications.length === pendingMedications.length

  // Check if only one medication is selected
  const isSingleSelection = selectedMedications.length === 1

  // Validation schema for accordion form
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
          is: wastageUnit => wastageUnit && wastageUnit.length > 0,
          then: schema => schema.required('Wastage quantity is required when wastage unit is provided'),
          otherwise: schema => schema.notRequired()
        }),

      wastageUnit: yup.string().when('wastageQuantity', {
        is: wastageQuantity => wastageQuantity && wastageQuantity.length > 0,
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
                .test('valid-batch-object', 'Please select a valid batch', value => {
                  if (!value) return false

                  return value && value.batch_no && typeof value.batch_no === 'string'
                })
            : schema.nullable().notRequired(),
        otherwise: schema => schema.nullable().notRequired()
      })
    },
    [['wastageQuantity', 'wastageUnit']]
  )

  const defaultValues = {
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
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: defaultValues,
    resolver: yupResolver(validationSchema),
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

  useEffect(() => {
    if (open && stopMedicineModalOpen) setStopMedicineModalOpen(false)
  }, [open])

  useEffect(() => {
    if (!isSingleSelection) {
      reset(defaultValues)
    }
  }, [isSingleSelection, reset])

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const onSubmit = data => {
    console.log('Form data:', data)
  }

  const handleStopMedicine = () => {
    setStopMedicineModalOpen(true)
  }

  const handleStopMedicineConfirm = data => {
    if (onStopMedicine) {
      onStopMedicine(data)
    }
  }

  const handleAddNewDosage = () => {
    if (onAddNewDosage) {
      onAddNewDosage(medicine)
    }
  }

  const handleRefreshEntry = entryId => {
    if (onRefreshEntry) {
      onRefreshEntry(entryId, medicine)
    }
  }

  // Handle individual medication selection
  const handleMedicationSelect = (medicationId, checked) => {
    setSelectedMedications(prev => {
      // For controlled substances, only allow single selection (radio behavior)
      if (isControlledSubstance) {
        return checked ? [medicationId] : []
      } else {
        // For non-controlled substances, allow multiple selection (checkbox behavior)
        if (checked) {
          return [...prev, medicationId]
        } else {
          return prev.filter(id => id !== medicationId)
        }
      }
    })
  }

  // Handle select all
  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedMedications([])
    } else {
      const allPendingIds = pendingMedications?.map(item => item?.administritive_id) || []
      setSelectedMedications(allPendingIds)
    }
  }

  // Handle administer selected with form data
  const handleAdministerSelected = formData => {
    if (onAdministerSelected) {
      const selectedItems = dosageEntries?.filter(item => selectedMedications.includes(item?.administritive_id))
      onAdministerSelected(selectedItems, medicineData, formData)
      setIsSelectionMode(false)
    }
  }

  // Handle skip selected with form data
  const handleSkipSelected = formData => {
    if (onSkipSelected) {
      const selectedItems = dosageEntries?.filter(item => selectedMedications.includes(item?.administritive_id))
      onSkipSelected(selectedItems, medicineData, formData)
      setIsSelectionMode(false)
    }
  }

  // Format time from API response
  const formatTime = timeString => {
    if (!timeString) return ''
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12

    return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`
  }

  // Reset selection when closing
  const handleClose = () => {
    setSelectedMedications([])
    setIsSelectionMode(false)
    reset(defaultValues)
    onClose()
  }

  const handleAddNewDosageTimeCheck = data => {
    const datePart = selectedDate.split(' ')[0]
    const targetDateTime = new Date(`${datePart}T${convertTo24Hour(data?.scheduledTime)}`)
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

  function convertTo24Hour(time12h) {
    if (!time12h) return '00:00:00'
    let [hour, modifier] = time12h.split(' ')
    hour = parseInt(hour, 10)

    if (modifier.toUpperCase() === 'PM' && hour !== 12) hour += 12
    if (modifier.toUpperCase() === 'AM' && hour === 12) hour = 0

    return `${hour.toString().padStart(2, '0')}:00:00`
  }

  if (!open) return null

  const formatDisplayDateTime = dateTimeString => {
    // Parse the date string properly (DD/MM/YYYY format)
    const [datePart, timePart] = dateTimeString.split(', ')
    const [day, month, year] = datePart.split('/')

    // Create date object in UTC (month is 0-indexed in JavaScript)
    const utcDate = new Date(Date.UTC(year, month - 1, day, ...timePart.split(':')))

    // Convert UTC to local time
    const localDate = new Date(
      utcDate.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })
    )

    // Format date part: 02 Jan 2025
    const formattedDate = localDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })

    // Format time part: 12 : 35 PM
    const formattedTime = localDate
      .toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
      .replace(':', ' : ')

    return `${formattedDate} • ${formattedTime}`
  }

  const formatTimeFromUTC = utcTimeString => {
    return new Date(`1970-01-01 ${utcTimeString} UTC`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const renderDosageEntry = entry => (
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
                {formatTimeFromUTC(entry.time)}
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
                  ? 'Skipped'
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

      {entry?.batch_details?.length > 0 && (
        <Box sx={{ display: 'flex', padding: '0 16px', flexDirection: 'column', gap: '4px' }}>
          <Typography
            variant='body1'
            sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnPrimaryContainer }}
          >
            {entry.wastage}
          </Typography>
          <Typography variant='body2' sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}>
            {entry.wastageNote}
          </Typography>
        </Box>
      )}
      {entry?.batch_details?.length > 0 && (
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
            <Icon icon='mdi:package-variant' fontSize='24px' color={theme.palette.grey[600]} />
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
            user_name={entry.administeredBy}
            profile_image={entry.administeredBy}
            date={entry.administeredAt}
            show_time={true}
          />
          {/* <Avatar sx={{ width: '34px', height: '34px' }} src='/images/avatars/1.png' />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Typography
              variant='body2'
              sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
            >
              {entry.administeredBy}
            </Typography>
            <Typography variant='caption' sx={{ fontSize: '12px', color: theme.palette.customColors.neutralSecondary }}>
              {formatDisplayDateTime(entry.administeredAt)}
            </Typography>
          </Box> */}
        </Box>
      </Box>
    </DosageSection>
  )

  const onFormSubmit = data => {
    if (actionType === 'administer') {
      handleAdministerSelected(data)
    } else {
      handleSkipSelected(data)
    }
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={handleClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: '562px' },
            maxWidth: '100%',
            background: theme.palette.customColors.Background
          }
        }}
      >
        <DrawerContent>
          {isDetailLoading ? (
            <HeaderShimmer theme={theme} />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: theme.palette.customColors.OnPrimary
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 4,
                  px: 6,
                  justifyContent: 'space-between',
                  borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Filter Icon' />
                    <Typography
                      sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      Administer / Skip
                    </Typography>
                  </Box>
                </Box>
                <IconButton size='small' onClick={handleClose} sx={{ color: theme.palette.text.primary, p: 0 }}>
                  <Icon icon='mdi:close' fontSize={24} />
                </IconButton>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexFlow: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 4,
                  px: 6,
                  backgroundColor: theme.palette.customColors.OnPrimary
                }}
              >
                <Typography
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: theme.palette.primary.deepDark
                  }}
                >
                  {medicineData?.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarTodayIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      {Utility?.formatDisplayDate(selectedDate)}
                    </Typography>
                  </Box>
                  {medicineData?.scheduledTime && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                      <AccessTimeIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        {medicineData?.scheduledTime}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          )}

          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              flex: 1,
              px: 6,
              pt: 6,
              overflowY: 'auto',
              backgroundColor: theme.palette.customColors.Background
            }}
          >
            {isDetailLoading ? (
              <>
                <DosageEntriesShimmer theme={theme} />
                <ButtonsShimmer theme={theme} />
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  mb: 12,
                  backgroundColor: theme.palette.customColors.OnPrimary,
                  border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                  borderRadius: '8px'
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    p: '24px'
                  }}
                >
                  <Controller
                    name='action'
                    control={control}
                    render={({ field }) => (
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TreatmentTypeRadioButtons
                          label='Administer'
                          isSelected={field.value === 'administer'}
                          onClick={() => field.onChange('administer')}
                          radioPosition='right'
                          sx={{ flex: 1 }}
                        />
                        <TreatmentTypeRadioButtons
                          label='Skipped'
                          isSelected={field.value === 'skipped'}
                          onClick={() => field.onChange('skipped')}
                          radioPosition='right'
                          borderColor={theme.palette.customColors.OutlineVariant}
                          sx={{ flex: 1 }}
                        />
                      </Box>
                    )}
                  />
                </Box>

                {/* Dosage Entries Section */}
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    px: '24px',
                    pb: selectedMedications?.length == 1 ? 0 : 6
                  }}
                >
                  {dosageEntries?.map(item => {
                    const isPending = !item?.status || item?.status?.toLowerCase() === 'pending'
                    const isSelected = selectedMedications.includes(item?.administritive_id)

                    const isFutureTime = () => {
                      if (!selectedDate || !item?.scheduled_time) return false

                      const datePart = selectedDate.split(' ')[0] // e.g., "2025-11-10"
                      const [hours, minutes] = item.scheduled_time.split(':')
                      const scheduledDateTime = new Date(`${datePart}T${hours}:${minutes}:00`)
                      const now = new Date()
                      const result = scheduledDateTime > now

                      return result
                    }

                    // added only day validation we can give enable for fast and future time only on present day

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
                        time={formatTime(item?.scheduled_time)}
                        dosage={`${item?.scheduled_quantity} ${item?.scheduled_unit_name}`}
                        amount={`${item?.scheduled_quantity} ${item?.scheduled_unit_name}`}
                        checked={isSelected}
                        onChange={checked => handleMedicationSelect(item?.administritive_id, checked)}
                        isControlledSubstance={isControlledSubstance}
                        // disabled={isFutureTime()}

                        disabled={!isAllowedDate()}
                      />
                    ) : (
                      renderDosageEntry({
                        id: item?.administritive_id,
                        time: formatTime(item?.administritive_time || item?.scheduled_time),
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
                        batch_details: item?.batch_details
                      })
                    )
                  })}
                </Box>

                {/* Form Fields - Show only when single selection */}
                {isSingleSelection && (
                  <Box>
                    <CardContent sx={{ p: 6 }}>
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
                                          getOptionLabel={option => option.label}
                                          getOptionValue={option => option.value}
                                          loading={mastersDataLoading}
                                        />
                                      </Grid>

                                      <Grid size={{ xs: 12 }}>
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
                                          getOptionLabel={option => {
                                            if (typeof option === 'string') return option

                                            return option?.label || option?.batch_no || ''
                                          }}
                                          getOptionValue={option => {
                                            if (typeof option === 'string') return option

                                            return option
                                          }}
                                          isOptionEqualToValue={(option, value) => {
                                            if (!option || !value) return false
                                            const optionId = option?.id
                                            const valueId = value?.id

                                            return optionId === valueId
                                          }}
                                          loading={batchLoading}
                                          onInputChange={handleBatchSearch}
                                          required={isControlledSubstance}
                                          autocompleteProps={{
                                            filterOptions: x => x,
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
                                          maxFiles={5}
                                          maxFileSize={5 * 1024 * 1024}
                                          acceptedFileTypes='image,pdf'
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
                    </CardContent>
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Action Buttons */}
          {selectedMedications?.length > 0 && (
            <Box
              sx={{
                position: 'sticky',
                bottom: 0,
                left: 0,
                right: 0,
                mx: '-24px',
                px: 6
              }}
            >
              {!stopMedicineModalOpen && (
                <Box
                  sx={{
                    p: 6,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0px -2px 6px rgba(0, 0, 0, 0.1)',
                    backgroundColor: theme.palette.background.paper
                  }}
                >
                  {isSingleSelection ? (
                    <>
                      <LoadingButton
                        variant='outlined'
                        type='button'
                        onClick={handleClose}
                        sx={{ flex: 1, py: 2, height: '48px' }}
                      >
                        CANCEL
                      </LoadingButton>
                      <LoadingButton
                        variant='contained'
                        type='submit'
                        loading={actionType === 'administer' ? isAdministerLoading : isSkipLoading}
                        onClick={handleSubmit(onFormSubmit)}
                        sx={{ flex: 1, py: 2, height: '48px' }}
                      >
                        {actionType === 'administer' ? 'ADMINISTER' : 'SKIPPED'}
                      </LoadingButton>
                    </>
                  ) : (
                    <>
                      <LoadingButton
                        variant='outlined'
                        type='button'
                        loading={isSkipLoading}
                        onClick={() => handleSkipSelected({})}
                        disabled={selectedMedications.length === 0}
                        sx={{ flex: 1, py: 2, height: '48px' }}
                      >
                        SKIPPED
                      </LoadingButton>
                      <LoadingButton
                        variant='contained'
                        type='button'
                        loading={isAdministerLoading}
                        onClick={() => handleAdministerSelected({})}
                        disabled={selectedMedications.length === 0}
                        sx={{ flex: 1, py: 2, height: '48px' }}
                      >
                        ADMINISTER
                      </LoadingButton>
                    </>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default MedicinePrescriptionCardForMultipleTimeSlots

// Shimmer Components
const HeaderShimmer = ({ theme }) => (
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

const DosageEntriesShimmer = ({ theme }) => (
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

const ButtonsShimmer = ({ theme }) => (
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
