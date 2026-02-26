/* eslint-disable lines-around-comment */
import React, { useCallback, useEffect, useState } from 'react'
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
  Grid,
  CardContent
} from '@mui/material'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import HorizontalDateNav from 'src/views/utility/HorizontalDateNav'
import MedicationTimeCard from './MedicationTimeCard'
import StopMedicine from './StopMedicine'
import CustomButtons from 'src/components/hospital/CustomButtons'
import Utility from 'src/utility'
import { LoadingButton } from '@mui/lab'
import DoDisturbIcon from '@mui/icons-material/DoDisturb'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useRouter } from 'next/router'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import RenderUtility from 'src/utility/render'
// for controlle substance
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
const MedicinePrescriptionCard = ({
  open,
  onClose,
  medicineData = {},
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
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

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
    setValue,
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
  const router = useRouter()
  const { id, date } = router.query

  const [activeTab, setActiveTab] = useState(medicineData?.defaultTab || 1)
  const [stopMedicineModalOpen, setStopMedicineModalOpen] = useState(false)

  // Add state for selected medications
  // const [selectedMedications, setSelectedMedications] = useState([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  const medicine = {
    ...medicineData
  }

  const tabs = dateOptions?.length > 0 ? dateOptions : []

  // Filter pending medications
  const pendingMedications = dosageEntries?.filter(item => !item?.status || item?.status?.toLowerCase() === 'pending')

  // Check if all pending medications are selected
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
    if (!open || isDetailLoading || isDatesLoading) return;

    const pendingMedications = dosageEntries?.filter(
      item => !item?.status || item?.status?.toLowerCase() === 'pending'
    );

    if (pendingMedications?.length === 1) {
      const singlePendingId = pendingMedications[0]?.administritive_id;
      if (!selectedMedications.includes(singlePendingId)) {
        const isControlledSubstance = pendingMedications[0]?.controlled_substance == 1;

        setSelectedMedications(prev => {
          if (isControlledSubstance) {
            return [singlePendingId];
          } else {
            return [...prev, singlePendingId];
          }
        });
      }
    }
  }, [open, dosageEntries, isDetailLoading, isDatesLoading, selectedMedications]);

  useEffect(() => {
    autoSelectSinglePendingMedication();
  }, [autoSelectSinglePendingMedication]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
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
  // const handleMedicationSelect = (medicationId, checked) => {
  //   setSelectedMedications(prev => {
  //     if (checked) {
  //       if (prev.includes(medicationId)) return prev

  //       return [...prev, medicationId]
  //     } else {
  //       return prev.filter(id => String(id) !== String(medicationId))
  //     }
  //   })
  // }

  const handleMedicationSelect = (medicationId, checked, isControlledSubstance) => {
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

  // Handle administer selected
  const handleAdministerSelected = () => {
    if (onAdministerSelected) {
      const selectedItems = dosageEntries?.filter(item => selectedMedications.includes(item?.administritive_id))
      onAdministerSelected(selectedItems, medicineData)

      // setSelectedMedications([])
      setIsSelectionMode(false)
    }
  }

  // Handle skip selected
  const handleSkipSelected = () => {
    if (onSkipSelected) {
      const selectedItems = dosageEntries?.filter(item => selectedMedications.includes(item?.administritive_id))
      onSkipSelected(selectedItems, medicineData)

      // setSelectedMedications([])
      setIsSelectionMode(false)
    }
  }

  // Handle administer selected with form data
  const handleAdministerSelectedControlSubstanceProduct = formData => {
    if (onAdministerSelected) {
      const selectedItems = dosageEntries?.filter(item => selectedMedications.includes(item?.administritive_id))
      onAdministerSelected(selectedItems, medicineData, formData)
      setIsSelectionMode(false)
    }
  }

  // Handle skip selected with form data
  const handleSkipSelectedControlSubstanceProduct = formData => {
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
    onClose()
  }

  const handleAddNewDosageTimeCheck = data => {
    const datePart = selectedDate.split(' ')[0] // e.g., "2025-11-10"
    const targetDateTime = new Date(`${datePart}T${convertTo24Hour(data?.scheduledTime)}`)
    const now = new Date()

    if (isNaN(targetDateTime.getTime())) {
      console.error('Invalid date or time format')

      return false
    }

    // Extract just the date parts for comparison
    const targetDate = new Date(datePart)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    targetDate.setHours(0, 0, 0, 0)

    // Allow if it's today or any future date/time
    if (targetDate.getTime() === today.getTime()) {
      return true // same day → allowed
    } else if (targetDateTime > now) {
      return true // future date/time → allowed
    } else {
      return false // past date/time → not allowed
    }
  }

  // Helper: converts "5 AM"/"1 PM" to "HH:mm:ss"
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

  const isLocalStopDatePassed = stopDateString => {
    if (!stopDateString) return false

    try {
      // Parse the backend date string (YYYY-MM-DD HH:mm:ss format)
      const [datePart, timePart] = stopDateString.split(' ')
      const [year, month, day] = datePart.split('-')
      const [hours, minutes, seconds] = timePart.split(':')

      // Create UTC date from backend string
      const stopDateUTC = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      )

      // Convert to local time
      const stopDateLocal = new Date(stopDateUTC)
      // Get current local time
      const now = new Date()

      // Check if stop date is in the past
      return stopDateLocal < now
    } catch (error) {
      console.error('Error parsing stop date:', error)

      return false
    }
  }

  const isStopDatePassed = stopDateString => {
    if (!stopDateString) return false

    try {
      // Parse the backend date string (YYYY-MM-DD HH:mm:ss format)
      const [datePart, timePart] = stopDateString.split(' ')
      const [year, month, day] = datePart.split('-')
      const [hours, minutes, seconds] = timePart.split(':')

      // Create UTC date from backend string
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

      // Convert to local time
      const stopDateLocal = new Date(stopDateUTC)
      // Get current local time
      const now = new Date()

      // Check if stop date is in the past
      return stopDateLocal < now
    } catch (error) {
      console.error('Error parsing stop date:', error)

      return false
    }
  }

  const formatTimeFromUTC = utcTimeString => {
    return new Date(`1970-01-01 ${utcTimeString} UTC`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleRestartMedicine = async () => {
    onRestartMedicine()
  }

  const handleUpdateMedicine = async () => {
    onUpdateMedicine()
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
                {formatTime(entry?.scheduledTime)}
                {/* time conveertion issue */}
                {/* {entry.time} */}
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
          {/* <Typography
            variant='body2'
            sx={{
              fontSize: '14px',
              color: theme.palette.customColors.OnSurfaceVariant,
              textDecoration: entry.isStrikethrough ? 'line-through' : 'none'
            }}
          >
            {entry.dosage}
          </Typography> */}
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

  const onFormSubmit = data => {
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
              height: '100vh',
              px: '24px',
              py: '0px'
            }
          }
        }}
      >
        <DrawerContent>
          {/* Header Section - Same as before */}
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

          {/* Info Section - Same as before */}
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

              <InfoGroupContainer sx={{ borderRadius: !medicine?.notes && '0 0 8px 8px' }}>
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

          {/* Date Tabs - Same as before */}
          {isDetailLoading || isDatesLoading ? (
            <DateTabsShimmer theme={theme} />
          ) : (
            <Box
              sx={{
                display: 'flex',
                width: '100%',
                backgroundColor: theme.palette.background.paper,
                my: '16px',
                padding: 0,
                mx: '-24px',
                width: 'calc(100% + 48px)'
              }}
            >
              <HorizontalDateNav
                dates={dateOptions}
                onDateSelect={handleDateChange}
                selectedDate={selectedDate}
                showYear={true}
                year={selectedDate ? selectedDate.split(' ')[0].split('-')[0] : ''}
                containerStyle={{
                  backgroundColor: theme.palette.background.paper,
                  borderBottom: `0.5px solid ${theme.palette.customColors.OutlineVariant}`,
                  borderTop: `0.5px solid ${theme.palette.customColors.OutlineVariant}`
                }}
              />
            </Box>
          )}

          {/* Selection Header - Show when there are pending medications */}
          {/* {!isDetailLoading && !isDatesLoading && pendingMedications?.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: selectedMedications.length > 0
                  ? theme.palette.primary.light
                  : theme.palette.customColors.OnBackground,
                borderRadius: '8px',
                mb: 2,
                transition: 'all 0.3s ease'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={selectedMedications.length > 0 && !allSelected}
                  onChange={handleSelectAll}
                  sx={{
                    color: theme.palette.primary.main,
                    '&.Mui-checked': {
                      color: theme.palette.primary.main
                    },
                    '&.MuiCheckbox-indeterminate': {
                      color: theme.palette.primary.main
                    }
                  }}
                />
                <Typography
                  variant='body1'
                  sx={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  {selectedMedications.length > 0
                    ? `${selectedMedications.length} selected`
                    : 'Select medications'}
                </Typography>
              </Box>

              {selectedMedications.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size='small'
                    variant='outlined'
                    onClick={handleSkipSelected}
                    sx={{
                      textTransform: 'none',
                      fontSize: '12px',
                      fontWeight: 500,
                      borderColor: theme.palette.customColors.OnSurfaceVariant,
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    Skip
                  </Button>
                  <Button
                    size='small'
                    variant='contained'
                    onClick={handleAdministerSelected}
                    sx={{
                      textTransform: 'none',
                      fontSize: '12px',
                      fontWeight: 500
                    }}
                  >
                    Administer
                  </Button>
                </Box>
              )}
            </Box>
          )} */}

          {/* Bottom Container */}
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              flex: 1,
              overflowY: 'auto'
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
                  const isSelected = selectedMedications.includes(item?.administritive_id)
                  const isControlledSubstance = item?.controlled_substance == 1 ? true : false

                  const isFutureTime = () => {
                    if (!selectedDate || !item?.scheduled_time) return false

                    const datePart = selectedDate.split(' ')[0] // e.g., "2025-11-10"
                    const [hours, minutes] = item.scheduled_time.split(':')
                    const scheduledDateTime = new Date(`${datePart}T${hours}:${minutes}:00`)
                    const now = new Date()

                    return scheduledDateTime > now
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
                      onChange={checked =>
                        handleMedicationSelect(item?.administritive_id, checked, isControlledSubstance)
                      }
                      // disabled={isFutureTime()}
                      disabled={!isAllowedDate()}
                      isControlledSubstance={isControlledSubstance}
                    />
                  ) : (
                    renderDosageEntry({
                      id: item?.administritive_id,
                      scheduledTime: item?.scheduled_time,
                      time: formatTime(item?.administritive_time), /// added sceduled time not adminster time
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
                                          getOptionLabel={option => option.label}
                                          getOptionValue={option => option.value}
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

                {stopMedicineModalOpen && !isStopDatePassed(medicineData?.stop_date) ? (
                  <StopMedicine
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
                    ) : (isStopDatePassed(medicineData?.stop_date) || isLocalStopDatePassed(medicineData?.stop_date)) &&
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
                      !isStopDatePassed(medicineData?.stop_date) &&
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

          {/* Selection Actions - Show when medications are selected */}
          {selectedMedications?.length > 0 && (
            <Box
              sx={{
                position: 'sticky',
                bottom: 0,
                left: 0,
                right: 0,
                mx: '-24px'
              }}
            >
              {!stopMedicineModalOpen &&
                (isControlledSubstance ? (
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
                      p: 6,
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: '0px -2px 6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: theme.palette.background.paper
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

const InfoSectionShimmer = ({ theme }) => (
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

const DateTabsShimmer = ({ theme }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      px: 1,
      height: '48px',
      backgroundColor: '#E8F4F2',
      borderRadius: 1,
      width: '100%',
      my: '16px',
      mx: '-24px',
      width: 'calc(100% + 48px)'
    }}
  >
    {/* Year Label Shimmer */}
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

    {/* Date Scroll Area Shimmer */}
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        flex: 1,
        height: '100%',
        paddingLeft: '100px', // Space for fixed year label
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        '-ms-overflow-style': 'none',
        'scrollbar-width': 'none'
      }}
    >
      {/* Date Buttons Shimmer */}
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
            {/* Date text shimmer */}
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

    {/* Inject shimmer animation styles */}
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

const DosageEntriesShimmer = ({ theme }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
    {/* Medication Time Card Shimmer */}
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

    {/* Dosage Entries Shimmer */}
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

        {/* Optional wastage section shimmer */}
        {item === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Skeleton variant='text' width='50%' height={20} />
            <Skeleton variant='text' width='80%' height={16} />
          </Box>
        )}

        {/* Optional batch number section shimmer */}
        {item === 2 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Skeleton variant='rectangular' width={48} height={48} sx={{ borderRadius: '6px' }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
              <Skeleton variant='text' width='40%' height={16} />
              <Skeleton variant='text' width='60%' height={20} />
            </Box>
          </Box>
        )}

        {/* Administered by section shimmer */}
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
