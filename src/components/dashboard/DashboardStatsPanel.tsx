import React from 'react'
import { Box, Card, Typography, Grid, Avatar } from '@mui/material'
import Utility from 'src/utility'
import type { StatCardProps, DashboardStatsPanelProps } from 'src/types/dashboard/components'

const iconMap: Record<string, string> = {
  pets: '/dashboard/all_animal.svg',
  enclosures: '/dashboard/insights/Enclosure.svg',
  medicalRecords: '/dashboard/medical_record.svg',
  labRequests: '/dashboard/lab_req.svg',
  activeUsers: '/dashboard/user.svg',
  lowStockMedicines: '/dashboard/medicines.svg'
}

const bgColors: Record<string, string> = {
  pets: '#E1F9ED',
  enclosures: '#FCF4AE99',
  medicalRecords: '#FFBDA84D',
  labRequests: '#AFEFEB66',
  activeUsers: '#E8F4F2',
  lowStockMedicines: '#FFD3D366'
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, bgColor }) => (
  <Card
    sx={{
      p: 4,
      height: '100%',
      borderRadius: '10px',
      boxShadow: '0px 2px 10px 0px #4C4E6438'
    }}
  >
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Avatar
        variant='square'
        sx={{ bgcolor: bgColor, width: 48, height: 48, borderRadius: '8px', p: 2.5 }}
        src={icon}
      />
      <Box sx={{ textAlign: 'start' }}>
        <Typography sx={{ fontSize: '34px', fontWeight: 600, color: '#44544A' }}>
          {Utility.formatAmountCompactDisplay(value)}
        </Typography>
        <Typography sx={{ fontSize: '14px', fontWeight: 400, color: '#44544A' }}>{label}</Typography>
      </Box>
    </Box>
  </Card>
)

const DashboardStatsPanel: React.FC<DashboardStatsPanelProps> = ({ stats }) => (
  <Grid container spacing={3}>
    {stats?.map(({ key, value, label, bgColor, icon }) => (
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={key}>
        <StatCard icon={icon ?? iconMap[key]} value={value} label={label} bgColor={bgColor ?? bgColors[key]} />
      </Grid>
    ))}
  </Grid>
)

export default DashboardStatsPanel
