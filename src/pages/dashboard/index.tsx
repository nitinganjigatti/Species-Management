import { useEffect, useState, useCallback, useContext } from 'react'
import Image from 'next/image'
import { Box, CircularProgress, Grid } from '@mui/material'
import { AuthContext } from 'src/context/AuthContext'
import { useTranslation } from 'react-i18next'
import welcomeToAntz from 'public/images/intro_antz_all.jpg'
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'
import KeenSliderWrapper from 'src/@core/styles/libs/keen-slider'
import DashboardStatsPanel from 'src/components/dashboard/DashboardStatsPanel'
import DashboardCardHeader from 'src/components/dashboard/DashboardCardHeader'
import KeyInsights from 'src/components/dashboard/KeyInsights'
import AnimalActivityChart from 'src/components/dashboard/charts/AnimalActivityChart'
import AnimalTransferProgress from 'src/components/dashboard/charts/AnimalTransferProgress'
import EggChart from 'src/components/dashboard/charts/EggChart'
import DashboardPharmacyDetails from 'src/components/dashboard/DashboardPharmacyDetails'
import PharmacyPendingReqChart from 'src/components/dashboard/charts/PharmacyPendingReqChart'
import DashboardNotes from 'src/components/dashboard/charts/DashboardNotes'
import DashboardLabRequests from 'src/components/dashboard/DashboardLabRequests'
import {
  getDashboardAnalytics,
  getKeyInsights,
  getEggAnalytics,
  getAnimalActivity,
  getAnimalTransfer,
  getPendingRequests,
  getNotes,
  getDashboardPharmacy,
  getLabRequests
} from 'src/lib/api/dashboard'
import type {
  DashboardStatItem,
  KeyInsightItem,
  ChartDataItem,
  AnimalTransfer,
  PendingRequests,
  PharmacySlide,
  LabRequests
} from 'src/types/dashboard'

const DEFAULT_ANIMAL_TRANSFER: AnimalTransfer = {
  totalTransfers: 0,
  transferPercentage: 0,
  transferProgress: []
}

const DEFAULT_PENDING_REQUESTS: PendingRequests = {
  total_requests: 0,
  completed_requests: 0,
  completed_requests_percentage: 0,
  priority_stats: []
}

const DEFAULT_LAB_REQUESTS: LabRequests = {
  total_requests: 0,
  completed_request: 0,
  completed_requests_percentage: 0,
  lab_stats: []
}

function Dashboard() {
  const { t } = useTranslation()
  const authData = useContext(AuthContext) as unknown as { userData?: { roles?: { role_name?: string } } } | null
  const [loading, setLoading] = useState(false)
  const [firstLoad, setFirstLoad] = useState(true)
  const [dashboardAnalyticsData, setDashboardAnalyticsData] = useState<DashboardStatItem[]>([])
  const [keyInsightsData, setKeyInsightsData] = useState<KeyInsightItem[]>([])
  const [eggAnalytics, setEggAnalytics] = useState<ChartDataItem[]>([])
  const [animalActivityData, setAnimalActivityData] = useState<ChartDataItem[]>([])
  const [animalTransfer, setAnimalTransfer] = useState<AnimalTransfer>(DEFAULT_ANIMAL_TRANSFER)
  const [pharmacyData, setPharmacyData] = useState<PharmacySlide[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequests>(DEFAULT_PENDING_REQUESTS)
  const [notes, setNotes] = useState<ChartDataItem[]>([])
  const [labRequests, setLabRequests] = useState<LabRequests>(DEFAULT_LAB_REQUESTS)

  const userRole = authData?.userData?.roles?.role_name

  const fetchAllData = useCallback(async () => {
    try {
      if (firstLoad) setLoading(true)

      const params = {}

      const [
        dashboardAnalyticsRes,
        keyInsightsRes,
        eggAnalyticsRes,
        animalActivityRes,
        animalTransferRes,
        pendingRequestsRes,
        notesRes,
        pharmacyRes,
        labRequestsRes
      ] = await Promise.all([
        getDashboardAnalytics({ params }),
        getKeyInsights({ params }),
        getEggAnalytics({ params }),
        getAnimalActivity({ params }),
        getAnimalTransfer({ params }),
        getPendingRequests({ params }),
        getNotes({ params }),
        getDashboardPharmacy({ params }),
        getLabRequests({ params })
      ])

      if (dashboardAnalyticsRes.length > 0) setDashboardAnalyticsData(dashboardAnalyticsRes)
      if (keyInsightsRes.length > 0) setKeyInsightsData(keyInsightsRes)
      if (eggAnalyticsRes.length > 0) setEggAnalytics(eggAnalyticsRes)
      if (animalActivityRes.length > 0) setAnimalActivityData(animalActivityRes)

      if (animalTransferRes && Object.keys(animalTransferRes).length > 0) {
        setAnimalTransfer({
          totalTransfers: animalTransferRes.totalTransfers,
          transferPercentage: animalTransferRes.transferPercentage,
          transferProgress: animalTransferRes.transferProgress
        })
      }

      if (pendingRequestsRes && Object.keys(pendingRequestsRes).length > 0) {
        setPendingRequests({
          total_requests: pendingRequestsRes.total_requests,
          completed_requests: pendingRequestsRes.completed_requests,
          completed_requests_percentage: pendingRequestsRes.completed_requests_percentage,
          priority_stats: pendingRequestsRes.priority_stats
        })
      }

      if (notesRes.length > 0) setNotes(notesRes)
      if (pharmacyRes.length > 0) setPharmacyData(pharmacyRes)
      if (labRequestsRes) setLabRequests(labRequestsRes)

      if (firstLoad) setFirstLoad(false)
      setLoading(false)
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }, [firstLoad])

  useEffect(() => {
    if (userRole === 'Super Admin') {
      fetchAllData()
      const interval = setInterval(fetchAllData, 120000)
      return () => clearInterval(interval)
    }
  }, [fetchAllData, userRole])

  return (
    <>
      {userRole === 'Super Admin' ? (
        <div style={{ textAlign: 'center' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <DashboardStatsPanel stats={dashboardAnalyticsData} />
              <Box sx={{ mt: 3 }}>
                <ApexChartWrapper>
                  <KeenSliderWrapper>
                    <Grid container spacing={3} className='match-height'>
                      <Grid size={{ xs: 12, md: 3, sm: 6 }}>
                        <DashboardCardHeader title={t('dashboard.key_insights')}>
                          <Box sx={{ p: 6 }}>
                            <KeyInsights insights={keyInsightsData} />
                          </Box>
                        </DashboardCardHeader>
                      </Grid>
                      <Grid size={{ xs: 12, md: 3, sm: 6 }}>
                        <DashboardCardHeader title={t('dashboard.animal_activity')}>
                          <AnimalActivityChart animalActivityData={animalActivityData} />
                        </DashboardCardHeader>
                      </Grid>
                      <Grid size={{ xs: 12, md: 3, sm: 6 }}>
                        <DashboardCardHeader title={t('dashboard.animal_transfer')}>
                          <Box sx={{ p: 6 }}>
                            <AnimalTransferProgress animalTransfer={animalTransfer} />
                          </Box>
                        </DashboardCardHeader>
                      </Grid>
                      <Grid size={{ xs: 12, md: 3, sm: 6 }}>
                        <DashboardCardHeader title={t('dashboard.eggs')}>
                          <EggChart eggAnalytics={eggAnalytics} height={332} />
                        </DashboardCardHeader>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4.5, sm: 6 }}>
                        <DashboardPharmacyDetails pharmacyData={pharmacyData} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2.5, sm: 6 }}>
                        <DashboardCardHeader title={t('dashboard.pending_requests_pharmacy')} isSmall={true}>
                          <PharmacyPendingReqChart pendingRequests={pendingRequests} />
                        </DashboardCardHeader>
                      </Grid>
                      <Grid size={{ xs: 12, md: 2.5, sm: 6 }}>
                        <DashboardCardHeader title={t('dashboard.notes')}>
                          <DashboardNotes notesData={notes} />
                        </DashboardCardHeader>
                      </Grid>
                      <Grid size={{ xs: 12, md: 2.5, sm: 6 }}>
                        <DashboardCardHeader title={t('dashboard.lab_requests')}>
                          <DashboardLabRequests labRequests={labRequests} />
                        </DashboardCardHeader>
                      </Grid>
                    </Grid>
                  </KeenSliderWrapper>
                </ApexChartWrapper>
              </Box>
            </>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <Image
            src={welcomeToAntz}
            style={{ maxWidth: '600px', width: '100%', height: 'calc(100vh - 180px)', objectFit: 'contain' }}
            alt='Welcome to Antz'
          />
        </div>
      )}
    </>
  )
}

export default Dashboard
