import React from 'react'
import Image from 'next/image'
import welcomeToAntz from 'public/images/intro_antz_all.jpg'
import DashboardStatsPanel from './DashboardStatsPanel'
import PetsIcon from '@mui/icons-material/Pets'

import { Typography, Box, Grid } from '@mui/material'
import DashboardCardHeader from './DashboardCardHeader'
import EggChart from './EggChart'
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'
import AnimalActivityChart from './AnimalActivityChart'
import KeyInsights from './KeyInsights'
import AnimalTransferProgress from './AnimalTransferProgress'
import KeenSliderWrapper from 'src/@core/styles/libs/keen-slider'
import DashboardPharmacyDetails from './DashboardPharmacyDetails'
import PharmacyPendingReqChart from './PharmacyPendingReqChart'
import AdministerMedicineChart from './AdministerMedicineChart'
import DashboardLabRequests from './DashboardLabRequests'

function Dashboard() {
  return (
    <div style={{ textAlign: 'center' }}>
      {/* <Image
        src={welcomeToAntz}
        style={{ maxWidth: '600px', width: '100%', height: 'calc(100vh - 180px)', objectFit: 'contain' }}
        alt='Welcome to Antz'
      /> */}

      <DashboardStatsPanel
        stats={[
          { key: 'pets', value: 107400, label: 'All animals', bgColor: '#E1F9ED', icon: '/dashboard/all_animal.svg' },
          { key: 'eggs', value: 245, label: 'Eggs collected', bgColor: '#FCF4AE99', icon: '/dashboard/Egg.svg' },
          {
            key: 'medicalRecords',
            value: 512,
            label: 'Medical records',
            bgColor: '#FFBDA84D',
            icon: '/dashboard/medical_record.svg'
          },
          {
            key: 'labRequests',
            value: 345,
            label: 'Lab requests',
            bgColor: '#AFEFEB66',
            icon: '/dashboard/lab_req.svg'
          },
          { key: 'activeUsers', value: 192, label: 'Active users', bgColor: '#E8F4F2', icon: '/dashboard/user.svg' },
          {
            key: 'lowStockMedicines',
            value: 54,
            label: 'Low stock medicines',
            bgColor: '#FFD3D366',
            icon: '/dashboard/medicines.svg'
          }
        ]}
      />
      <Box sx={{ mt: 3 }}>
        <ApexChartWrapper>
          <KeenSliderWrapper>
            <Grid container spacing={3} className='match-height'>
              <Grid item xs={12} sm={6} md={3}>
                <DashboardCardHeader title='Key insights'>
                  <Box sx={{ p: 6 }}>
                    <KeyInsights
                      insights={[
                        {
                          icon: '/dashboard/insights/paws.svg',
                          title: 'Natality',
                          subtitle: 'Total births recorded',
                          value: '54',
                          bgColor: '#E1F9ED'
                        },
                        {
                          icon: '/dashboard/insights/bones.svg',
                          title: 'Mortality',
                          subtitle: 'Total deaths recorded',
                          value: '16',
                          bgColor: '#FFBDA866'
                        },
                        {
                          icon: '/dashboard/insights/Enclosure.svg',
                          title: 'Transferred but unallocated',
                          subtitle: 'Animals awaiting enclosure assignment',
                          value: '32',
                          bgColor: '#FCF4AE66'
                        },
                        {
                          icon: '/dashboard/insights/health.svg',
                          title: 'Animals under treatment',
                          subtitle: 'Latest health issues',
                          value: '05',
                          bgColor: '#AFEFEB66'
                        },
                        {
                          icon: '/dashboard/insights/cases.svg',
                          title: 'New medical cases',
                          subtitle: 'Latest health issues',
                          value: '12',
                          bgColor: '#EFF5F2'
                        }
                      ]}
                    />
                    {/* <KeyInsightsContent /> */}
                  </Box>
                </DashboardCardHeader>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DashboardCardHeader title='Animal activity'>
                  <AnimalActivityChart />
                </DashboardCardHeader>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DashboardCardHeader title='Animal transfer'>
                  <Box sx={{ p: 6 }}>
                    <AnimalTransferProgress />
                    {/* <AnimalTransferContent /> */}
                  </Box>
                </DashboardCardHeader>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DashboardCardHeader title='Eggs'>
                  <EggChart />
                </DashboardCardHeader>
              </Grid>
              <Grid item xs={12} sm={6} md={4.5} sx={{ order: [2, 2, 1] }}>
                <DashboardPharmacyDetails />
              </Grid>
              <Grid item xs={12} sm={6} md={2.5} sx={{ order: [1, 1, 2] }}>
                <DashboardCardHeader title='Pharmacy - Pending requests'>
                  <PharmacyPendingReqChart />
                </DashboardCardHeader>
              </Grid>
              <Grid item xs={12} sm={6} md={2.5} sx={{ order: [1, 1, 2] }}>
                <DashboardCardHeader title='Administer medicine'>
                  <AdministerMedicineChart />
                </DashboardCardHeader>
              </Grid>
              <Grid item xs={12} sm={6} md={2.5} sx={{ order: [1, 1, 2] }}>
                <DashboardCardHeader title='Lab requests'>
                  <DashboardLabRequests />
                </DashboardCardHeader>
              </Grid>
            </Grid>
          </KeenSliderWrapper>
        </ApexChartWrapper>
      </Box>
    </div>
  )
}

export default Dashboard
