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
  setSelectedMedications
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

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

  useEffect(() => {
    if (open && stopMedicineModalOpen) setStopMedicineModalOpen(false)
  }, [open])

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
      if (checked) {
        return [...prev, medicationId]
      } else {
        return prev.filter(id => id !== medicationId)
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

    console.log('targetDateTime', targetDateTime)
    console.log('now', now)

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

    // Create date object (month is 0-indexed in JavaScript)
    const date = new Date(year, month - 1, day, ...timePart.split(':'))

    // Format date part: 02 Jan 2025
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })

    // Format time part: 12 : 35 PM
    const formattedTime = date
      .toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
      .replace(':', ' : ')

    return `${formattedDate} • ${formattedTime}`
  }

  const renderDosageEntry = entry => (
    <DosageSection key={entry.id} variant={entry.variant}>
      <DosageHeader variant={entry.status}>
        <Box sx={{ display: 'flex', padding: '0 16px', alignItems: 'center', gap: '4px', flex: '1 0 0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {entry.variant === 'administered' ? (
              <CheckCircleIcon sx={{ fontSize: '18px' }} color={'primary'} />
            ) : (
              <DoDisturbIcon
                sx={{
                  fontSize: '18px',
                  color:
                    entry.status?.toLowerCase() === 'stopped'
                      ? theme.palette.customColors.Tertiary
                      : theme.palette.customColors.neutralSecondary,
                  '& path': {
                    strokeWidth: 1.5
                  }
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
                {entry.time}
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
          <Avatar sx={{ width: '34px', height: '34px' }} src='/images/avatars/1.png' />
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
          </Box>
        </Box>
        {/* {entry?.status?.toLowerCase() != 'stopped' && (
          <IconButton size='small' onClick={() => handleRefreshEntry(entry.id)}>
            <Icon icon='mdi:refresh' fontSize='16px' color={theme.palette.customColors.Tertiary} />
          </IconButton>
        )} */}
      </Box>
    </DosageSection>
  )

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
          {/* Header Section - Same as before */}
          {isDetailLoading ? (
            <HeaderShimmer theme={theme} />
          ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: theme.palette.customColors.OnPrimary,
                }}
              >
                {/* Title Bar */}
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
                        Administer medicine
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton size='small' onClick={handleClose} sx={{ color: theme.palette.text.primary, p: 0 }}>
                    <Icon icon='mdi:close' fontSize={24} />
                  </IconButton>
                </Box>

                {/* Medicine Info Section */}
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
                    {medicineData?.data?.name}
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
                  </Box>
                </Box>
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
              px: 6,
              pt: 8,
              overflowY: 'auto',

            //   backgroundColor: theme.palette.customColors.Background
            }}
          >
            {isDetailLoading ? (
              <>
                <DosageEntriesShimmer theme={theme} />
                <ButtonsShimmer theme={theme} />
              </>
            ) : (
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {dosageEntries?.map(item => {
                  const isPending = !item?.status || item?.status?.toLowerCase() === 'pending'
                  const isSelected = selectedMedications.includes(item?.administritive_id)

                  return isPending ? (
                    <MedicationTimeCard
                      key={item?.administritive_id}
                      time={formatTime(item?.scheduled_time)}
                      dosage={`${item?.scheduled_quantity} ${item?.scheduled_unit_name}`}
                      amount={`${item?.scheduled_quantity} ${item?.scheduled_unit_name}`}
                      checked={isSelected}
                      onChange={checked => handleMedicationSelect(item?.administritive_id, checked)}
                    />
                  ) : (
                    renderDosageEntry({
                      id: item?.administritive_id,
                      time: formatTime(item?.administritive_time || item?.scheduled_time),
                      status: item?.status || 'Pending',
                      dosage: `${item?.scheduled_quantity} ${item?.scheduled_unit_name}`,
                      amount: `${item?.quantity_administered || item?.scheduled_quantity} ${item?.scheduled_unit_name}`,
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
                      administeredAt: item?.administritive_date
                        ? new Date(item.administritive_date).toLocaleString()
                        : '',
                      isStrikethrough: item?.status?.toLowerCase() === 'stopped',
                      batch_details: item?.batch_details
                    })
                  )
                })}
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
                mx: '-24px',
                px: 6,
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
                  <LoadingButton
                    variant='outlined'
                    type='button'
                    loading={isSkipLoading}
                    onClick={handleSkipSelected}
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
