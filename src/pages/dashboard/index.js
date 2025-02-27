import React, { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import welcomeToAntz from 'public/images/intro_antz_all.jpg'
import DashboardStatsPanel from '../../components/dashboard/DashboardStatsPanel'
import { Typography, Box, Grid } from '@mui/material'
import DashboardCardHeader from '../../components/dashboard/DashboardCardHeader'
import EggChart from '../../components/dashboard/charts/EggChart'
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'
import AnimalActivityChart from '../../components/dashboard/charts/AnimalActivityChart'
import KeyInsights from '../../components/dashboard/KeyInsights'
import AnimalTransferProgress from '../../components/dashboard/charts/AnimalTransferProgress'
import KeenSliderWrapper from 'src/@core/styles/libs/keen-slider'
import DashboardPharmacyDetails from '../../components/dashboard/DashboardPharmacyDetails'
import PharmacyPendingReqChart from '../../components/dashboard/charts/PharmacyPendingReqChart'
import AdministerMedicineChart from '../../components/dashboard/charts/AdministerMedicineChart'
import DashboardLabRequests from '../../components/dashboard/DashboardLabRequests'
import {
  getDashboardAnalytics,
  getKeyInsights,
  getEggAnalytics,
  getAnimalActivity,
  getAnimalTransfer
} from 'src/lib/api/dashboard'

function Dashboard() {
  const [loading, setLoading] = useState(false)
  const [dashboardAnalyticsData, setDashboardAnalyticsData] = useState([])
  const [keyInsightsData, setKeyInsightsData] = useState([])
  const [eggAnalytics, setEggAnalytics] = useState([])
  const [animalActivityData, setAnimalActivityData] = useState([])
  const [animalTransfer, setAnimalTransfer] = useState({
    totalTransfers: 0,
    transferPercentage: 0,
    transferProgress: []
  })

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)

      const params = {}
      await getDashboardAnalytics({ params: params }).then(res => {
        if (res.length > 0) {
          setDashboardAnalyticsData(res)
        }

        console.log(res, 'res')
      })
      setLoading(false)
    } catch (e) {
      console.log(e)
      setLoading(false)
    }
  }, [])

  const fetchKeyInsightsData = useCallback(async () => {
    try {
      setLoading(true)

      const params = {}
      await getKeyInsights({ params: params }).then(res => {
        if (res.length > 0) {
          setKeyInsightsData(res)
        }

        console.log(res, 'getKeyInsights')
      })
      setLoading(false)
    } catch (e) {
      console.log(e)
      setLoading(false)
    }
  }, [])

  const fetchAnimalActivityData = useCallback(async () => {
    try {
      setLoading(true)

      const params = {}
      await getAnimalActivity({ params: params }).then(res => {
        if (res.length > 0) {
          setAnimalActivityData(res)
        }

        // console.log(res, 'getAnimalActivity')
      })
      setLoading(false)
    } catch (e) {
      console.log(e)
      setLoading(false)
    }
  }, [])

  const fetchAnimalTransferData = useCallback(async () => {
    try {
      setLoading(true)

      const params = {}
      await getAnimalTransfer({ params: params }).then(res => {
        if (res && Object.keys(res).length > 0) {
          setAnimalTransfer({
            totalTransfers: res.totalTransfers,
            transferPercentage: res.transferPercentage,
            transferProgress: res.transferProgress
          })
        }
      })
      setLoading(false)
    } catch (e) {
      console.log(e)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalyticsData()
    fetchKeyInsightsData()
    fetchAnimalActivityData()
    fetchEggAnalytics()
    fetchAnimalTransferData()
  }, [])

  const fetchEggAnalytics = useCallback(async () => {
    try {
      setLoading(true)

      const params = {}
      await getEggAnalytics({ params: params }).then(res => {
        if (res.length > 0) {
          setEggAnalytics(res)
        }

        console.log(res, 'getEggAnalytics')
      })
      setLoading(false)
    } catch (e) {
      console.log(e)
      setLoading(false)
    }
  }, [])

  console.log(dashboardAnalyticsData, 'dashboardAnalyticsData')

  return (
    <div style={{ textAlign: 'center' }}>
      {/* <Image
        src={welcomeToAntz}
        style={{ maxWidth: '600px', width: '100%', height: 'calc(100vh - 180px)', objectFit: 'contain' }}
        alt='Welcome to Antz'
      /> */}

      <DashboardStatsPanel stats={dashboardAnalyticsData} />
      <Box sx={{ mt: 3 }}>
        <ApexChartWrapper>
          <KeenSliderWrapper>
            <Grid container spacing={3} className='match-height'>
              <Grid item xs={12} sm={6} md={3}>
                <DashboardCardHeader title='Key insights'>
                  <Box sx={{ p: 6 }}>
                    <KeyInsights insights={keyInsightsData} />
                    {/* <KeyInsightsContent /> */}
                  </Box>
                </DashboardCardHeader>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DashboardCardHeader title='Animal activity'>
                  <AnimalActivityChart animalActivityData={animalActivityData} />
                </DashboardCardHeader>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DashboardCardHeader title='Animal transfer'>
                  <Box sx={{ p: 6 }}>
                    <AnimalTransferProgress animalTransfer={animalTransfer} />
                    {/* <AnimalTransferContent /> */}
                  </Box>
                </DashboardCardHeader>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DashboardCardHeader title='Eggs'>
                  <EggChart eggAnalytics={eggAnalytics} />
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
