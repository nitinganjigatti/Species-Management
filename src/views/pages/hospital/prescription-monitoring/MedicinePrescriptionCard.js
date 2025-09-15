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
  useMediaQuery
} from '@mui/material'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import HorizontalDateNav from 'src/views/utility/HorizontalDateNav'

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

  // padding: '24px',
  padding: '24px 0px',
  flexDirection: 'column',

  gap: '20px',

  // borderBottom: `0.5px solid ${theme.palette.customColors.OutlineVariant}`,

  backgroundColor: theme.palette.background.paper

  // backgroundColor: 'red'
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

  // padding: '0 16px 16px 16px',
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

const MedicinePrescriptionCard = ({
  open,
  onClose,
  medicineData = {},
  dosageEntries = [],
  dateOptions = [],
  onStopMedicine,
  onAddNewDosage,
  onRefreshEntry
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm()
  const [activeTab, setActiveTab] = useState(medicineData?.defaultTab || 1)

  // Default data fallbacks
  const medicine = {
    name: 'Dolo 650 tablet',
    medId: 'MED - 12345/25',
    startDate: '1 Jan 2025',
    endDate: '04 Jan 2025',
    dosage: '3 Times',
    frequency: 'Everyday',
    duration: '3 days',
    deliveryRoute: 'Oral',
    notes: 'Lorem ipsum dolor sit amet consectetur adipiscin ipsum dolor...',
    lastEdited: 'Last edited on 10:34 AM • 02 Jan 2025',
    ...medicineData
  }

  const defaultDosageEntries = [
    {
      id: 1,
      time: '07:00 AM',
      status: 'Administered',
      variant: 'administered',
      dosage: '10 mg/kg',
      amount: '310 mg',
      wastage: 'Wastage - 200 mg',
      wastageNote: 'Lorem impsum doal sit amet sit lip alu lorem ipsum dolar',
      batchNumber: 'BTC2345',
      administeredBy: 'Jordan Stevenson',
      administeredAt: '02 Jan 2025 • 12 : 35 PM',

      icon: 'mdi:check-circle'
    },
    {
      id: 2,
      time: '11:00 AM',
      status: 'Skipped',
      variant: 'skipped',
      dosage: '10 mg/kg',
      amount: '310 mg',
      administeredBy: 'Jordan Stevenson',
      administeredAt: '02 Jan 2025 • 12 : 35 PM',
      icon: 'jam:stop-sign'
    },
    {
      id: 3,
      time: '04:00 PM',
      status: 'Stoppedddd',
      variant: 'stopped',
      dosage: '10 mg/kg',
      amount: '310 mg',
      administeredBy: 'Jordan Stevenson',
      administeredAt: '02 Jan 2025 • 12 : 35 PM',

      icon: 'jam:stop-sign',
      isStrikethrough: true
    }
  ]

  const defaultDateOptions = [
    { label: '2025', value: 0, isYear: true },
    { label: 'Sun 01 Jan', value: 1 },
    { label: 'Mon 02 Jan', value: 2, hasStatus: true },
    { label: 'Tue 03 Jan', value: 3 },
    { label: 'Wed 04 Jan', value: 4 }
  ]

  const entries = dosageEntries.length > 0 ? dosageEntries : defaultDosageEntries
  const tabs = dateOptions.length > 0 ? dateOptions : defaultDateOptions

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const onSubmit = data => {
    console.log('Form data:', data)
  }

  const handleStopMedicine = () => {
    if (onStopMedicine) {
      onStopMedicine(medicine)
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

            // padding: '24px'
            px: '24px',
            py: '0px'
          }
        }
      }}
    >
      <DrawerContent>
        {/* Header Section */}
        <HeaderSection>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',

              gap: '12px',
              height: '54px'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 0 0' }}>
              <Typography
                variant='h5'
                sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {medicine.name}
              </Typography>
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
            </Box>
            <IconButton onClick={onClose}>
              <Icon icon='mdi:close' fontSize='24px' color={theme.palette.customColors.OnPrimaryContainer} />
            </IconButton>
          </Box>
        </HeaderSection>

        {/* Info Section */}
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
              <Icon icon='majesticons:pulse-line' fontSize='32px' color={theme.palette.customColors.OnSurfaceVariant} />
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

        {/* Date Tabs */}
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            backgroundColor: theme.palette.background.paper,
            my: '16px',
            padding: 0,
            mx: '-24px', // negative margin to counter parent padding
            width: 'calc(100% + 48px)' // increase width to account for negative margins
          }}
        >
          <HorizontalDateNav
            numberOfDays={7}
            showYear={true}
            containerStyle={{
              backgroundColor: theme.palette.background.paper,
              borderBottom: `0.5px solid ${theme.palette.customColors.OutlineVariant}`,
              borderTop: `0.5px solid ${theme.palette.customColors.OutlineVariant}`
            }}
          />
          {/* {tabs.map((option, index) => (
            <DateTab
              key={option.value}
              selected={activeTab === option.value}
              onClick={() => handleTabChange(null, option.value)}
              sx={{
                borderRight:
                  index < tabs.length - 1 ? `0.5px solid ${theme.palette.customColors.OutlineVariant}` : 'none',
                position: 'relative'
              }}
            >
              {option.hasStatus && (
                <Box
                  sx={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: theme.palette.customColors.Tertiary,
                    position: 'absolute',
                    top: '15px',
                    left: '24px'
                  }}
                />
              )}
              {option.label}
            </DateTab>
          ))} */}
        </Box>

        {/* Bottom Container */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',

            // padding: '24px',
            flexDirection: 'column',
            gap: '16px',
            flex: 1

            // overflowY: 'auto'

            // border: '1px solid red'
          }}
        >
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {entries.map(renderDosageEntry)}
          </Box>

          {/* Action Buttons */}
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
        </Box>
      </DrawerContent>
    </Drawer>
  )
}

export default MedicinePrescriptionCard
