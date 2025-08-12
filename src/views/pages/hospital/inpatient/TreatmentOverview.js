import React from 'react'
import { Box, Typography, Grid, Avatar, Divider } from '@mui/material'
import {
  MonitorHeart,
  Assignment,
  LocalPharmacy,
  Image,
  PictureAsPdf,
  Add
} from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'

// Reusable Stats Card Component
const StatsCard = ({ icon: Icon, count, label, color = 'primary' }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        padding: '1rem 1rem 1rem 2rem', // extra left padding for icon overlap
        minHeight: '80px', // adjust as needed
        borderRadius: '8px',
        backgroundColor: '#FCF4AE99'
      }}
    >
      {/* Overlapping Icon Box */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#fff', // optional for background
          padding: '0.25rem',
          zIndex: 1,
          boxShadow: '0px 4px 10px #0000001A', // Add subtle drop shadow
          borderRadius: '8px' // optional: for smoother look
        }}
      >
        <Icon sx={{ fontSize: 40, color: `${color}.main` }} />
      </Box>

      {/* Text Content */}
      <Box sx={{ pl: 2 }}>
        <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '20px', fontWeight: 500 }}>
          {count}
        </Typography>
        <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px' }}>{label}</Typography>
      </Box>
    </Box>
  )
}

// Reusable File Attachment Component
const FileAttachment = ({ type, filename, timestamp, onClick }) => {
  const getIcon = () => {
    switch (type) {
      case 'image':
        return <Image sx={{ color: '#666' }} />
      case 'pdf':
        return <PictureAsPdf sx={{ color: '#d32f2f' }} />
      default:
        return <Assignment sx={{ color: '#666' }} />
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 2,
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: '#f5f5f5'
        }
      }}
      onClick={onClick}
    >
      <Box sx={{ mb: 1 }}>{getIcon()}</Box>
      <Typography variant='caption' color='text.secondary' textAlign='center'>
        {filename}
      </Typography>
      <Typography variant='caption' color='text.secondary' textAlign='center'>
        {timestamp}
      </Typography>
    </Box>
  )
}

// Reusable Section Header Component
const SectionHeader = ({ title, children }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant='h6' component='h2' gutterBottom>
      {title}
    </Typography>
    {children}
  </Box>
)

// Main Healthcare Overview Component
const HealthcareOverview = () => {
  const statsData = [
    {
      icon: MonitorHeart,
      count: 12,
      label: 'Treatment Monitoring',
      color: 'error'
    },
    {
      icon: MonitorHeart,
      count: 12,
      label: 'Active Clinical assessment',
      color: 'success'
    },
    {
      icon: Assignment,
      count: 12,
      label: 'Active Symptoms',
      color: 'success'
    },
    {
      icon: LocalPharmacy,
      count: 12,
      label: 'Prescription',
      color: 'info'
    }
  ]

  const fileAttachments = [
    {
      type: 'image',
      filename: 'Antz Yelahanka Site...',
      timestamp: '12:23 PM'
    },
    {
      type: 'pdf',
      filename: 'Antz Yelahanka Site...',
      timestamp: '12:23 PM'
    }
  ]

  const handleFileClick = filename => {
    console.log('File clicked:', filename)
  }

  return (
    <Box sx={{ py: 3, px: 4, maxWidth: 1200, mx: 'auto' }}>
      {/* Stats Cards */}
      <Grid container spacing={9}>
        {statsData.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <StatsCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Reason for Admission Section */}
      <SectionHeader title='Reason for Admission'>
        <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
          magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
          consequat. Duis aute irure dolor
        </Typography>
       
      </SectionHeader>
    </Box>
  )
}

export default HealthcareOverview
