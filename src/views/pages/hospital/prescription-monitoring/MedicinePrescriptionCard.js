import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Tab,
  Tabs,
  Button,
  Drawer,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Skeleton
} from '@mui/material'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import HorizontalDateNav from 'src/views/utility/HorizontalDateNav'
import MedicationTimeCard from './MedicationTimeCard'
import StopMedicine from './StopMedicine'

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
      : variant === 'skipped'
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
  selectedDate
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm()

  const [activeTab, setActiveTab] = useState(medicineData?.defaultTab || 1)
  const [stopMedicineModalOpen, setStopMedicineModalOpen] = useState(false)

  const medicine = {
    ...medicineData
  }

  const tabs = dateOptions?.length > 0 ? dateOptions : []

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
    setStopMedicineModalOpen(false)
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

  if (!open) return null

  const renderDosageEntry = entry => (
    <DosageSection key={entry.id} variant={entry.variant}>
      <DosageHeader variant={entry.variant}>
        <Box sx={{ display: 'flex', padding: '0 16px', alignItems: 'center', gap: '4px', flex: '1 0 0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon
              icon={entry?.icon}
              fontSize='24px'
              color={
                entry.variant === 'administered'
                  ? theme.palette.primary.main
                  : entry.variant === 'stopped'
                  ? theme.palette.customColors.Tertiary
                  : theme.palette.customColors.neutralSecondary
              }
            />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
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
                    entry.variant === 'stopped'
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
                    entry.variant === 'stopped'
                      ? theme.palette.customColors.OnTertiaryContainer
                      : theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {entry.status}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', paddingRight: '16px', alignItems: 'center', gap: '20px' }}>
          <Typography
            variant='body2'
            sx={{
              fontSize: '14px',
              color: theme.palette.customColors.OnSurfaceVariant,
              textDecoration: entry.isStrikethrough ? 'line-through' : 'none'
            }}
          >
            {entry.dosage}
          </Typography>
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

      {entry.wastage && (
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

      {entry.batchNumber && (
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: '1 0 0' }}>
            <Typography variant='body2' sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}>
              Batch Number
            </Typography>
            <Typography
              variant='body1'
              sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
            >
              {entry.batchNumber}
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
              {entry.administeredAt}
            </Typography>
          </Box>
        </Box>
        <IconButton size='small' onClick={() => handleRefreshEntry(entry.id)}>
          <Icon icon='mdi:refresh' fontSize='16px' color={theme.palette.customColors.Tertiary} />
        </IconButton>
      </Box>
    </DosageSection>
  )

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: isMobile ? '100vw' : 562,
              maxWidth: '100vw',
              height: '100vh',
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
                    {medicine.name}
                  </Typography>
                </Box>
                <IconButton onClick={onClose}>
                  <Icon icon='mdi:close' fontSize='24px' color={theme.palette.customColors.OnPrimaryContainer} />
                </IconButton>
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
                      {medicine.startDate}
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
                      {medicine.endDate}
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

              <InfoGroupContainer sx={{ borderRadius: '0' }}>
                <InfoItem>
                  <Icon icon='uil:calender' fontSize='32px' color={theme.palette.customColors.OnSurfaceVariant} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 0 0' }}>
                    <Typography
                      variant='body1'
                      sx={{ fontSize: '16px', fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      {medicine.duration}
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

              <NotesContainer>
                <Icon icon='mdi:note-text' fontSize='24px' color={theme.palette.warning.main} />
                <Typography
                  variant='body2'
                  sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant, flex: '1 0 0' }}
                >
                  {medicine.notes}
                </Typography>
              </NotesContainer>

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
                containerStyle={{
                  backgroundColor: theme.palette.background.paper,
                  borderBottom: `0.5px solid ${theme.palette.customColors.OutlineVariant}`,
                  borderTop: `0.5px solid ${theme.palette.customColors.OutlineVariant}`
                }}
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
                <MedicationTimeCard
                  key={1}
                  time={'07:00 AM'}
                  dosage={'10 mg/kg'}
                  amount={'310 mg'}
                  checked={false}
                  onChange={checked => console.log(1, checked)}
                />
                {dosageEntries?.map(item => renderDosageEntry(item))}
                {stopMedicineModalOpen ? (
                  <StopMedicine
                    onClose={() => setStopMedicineModalOpen(false)}
                    onConfirm={handleStopMedicineConfirm}
                    medicineData={medicineData}
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
                    <Button
                      variant='text'
                      startIcon={<Icon icon='jam:stop-sign' />}
                      onClick={handleStopMedicine}
                      disabled={isDetailLoading}
                      sx={{
                        color: theme.palette.customColors.OnTertiaryContainer,
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
                  </Box>
                )}
              </Box>
            )}
          </Box>
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