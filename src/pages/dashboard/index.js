import React, { useEffect, useState, useCallback } from 'react'
import { Box, CircularProgress, Grid, Skeleton } from '@mui/material'
import { useTranslation } from 'react-i18next'
import DashboardStatsPanel from '../../components/dashboard/DashboardStatsPanel'
import DashboardCardHeader from '../../components/dashboard/DashboardCardHeader'
import EggChart from '../../components/dashboard/charts/EggChart'
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'
import AnimalActivityChart from '../../components/dashboard/charts/AnimalActivityChart'
import KeyInsights from '../../components/dashboard/KeyInsights'
import AnimalTransferProgress from '../../components/dashboard/charts/AnimalTransferProgress'
import KeenSliderWrapper from 'src/@core/styles/libs/keen-slider'
import DashboardPharmacyDetails from '../../components/dashboard/DashboardPharmacyDetails'
import PharmacyPendingReqChart from '../../components/dashboard/charts/PharmacyPendingReqChart'
import DashboardNotes from 'src/components/dashboard/charts/DashboardNotes'
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
import DashboardLabRequests from 'src/components/dashboard/DashboardLabRequests'

function Dashboard() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [firstLoad, setFirstLoad] = useState(true)
  const [dashboardAnalyticsData, setDashboardAnalyticsData] = useState([])
  const [keyInsightsData, setKeyInsightsData] = useState([])
  const [eggAnalytics, setEggAnalytics] = useState([])
  const [animalActivityData, setAnimalActivityData] = useState([])

  const [animalTransfer, setAnimalTransfer] = useState({
    totalTransfers: 0,
    transferPercentage: 0,
    transferProgress: []
  })
  const [pharmacyData, setPharmacyData] = useState([])

  const [pendingRequests, setPendingRequests] = useState({
    total_requests: 0,
    completed_requests: 0,
    completed_requests_percentage: 0,
    priority_stats: []
  })
  const [notes, setNotes] = useState([])

  const [labRequests, setLabRequests] = useState({
    total_requests: 0,
    completed_request: 0,
    completed_requests_percentage: 0,
    lab_stats: []
  })

  const fetchAllData = useCallback(async () => {
    try {
      if (firstLoad) setLoading(true)

      // setLoading(true)

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
          total_requests: pendingRequestsRes?.total_requests,
          completed_requests: pendingRequestsRes?.completed_requests,
          completed_requests_percentage: pendingRequestsRes?.completed_requests_percentage,
          priority_stats: pendingRequestsRes?.priority_stats
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
    fetchAllData()
    const interval = setInterval(fetchAllData, 120000) // Refresh every 2 minutes

    return () => clearInterval(interval) // Cleanup on unmount
  }, [fetchAllData])

  return (
    <div style={{ textAlign: 'center' }}>
      {loading ? (
        <>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '80vh'
            }}
          >
            <CircularProgress />
          </Box>
          {/* <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              {Array.from(new Array(6)).map((_, index) => (
                <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
                  <Skeleton variant='rectangular' height={160} width={200} sx={{ borderRadius: 2 }} />
                  <Skeleton variant='text' width={150} height={30} sx={{ mt: 2 }} />
                </Grid>
              ))}
            </Grid>
            <Grid container spacing={3} sx={{ mt: 3 }}>
              {Array.from(new Array(4)).map((_, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Skeleton variant='rectangular' height={400} width={300} sx={{ borderRadius: 2 }} />
                  <Skeleton variant='text' width={150} height={30} sx={{ mt: 2 }} />
                </Grid>
              ))}
            </Grid>
          </Box> */}
        </>
      ) : (
        <>
          <DashboardStatsPanel stats={dashboardAnalyticsData} />
          <Box sx={{ mt: 3 }}>
            <ApexChartWrapper>
              <KeenSliderWrapper>
                <Grid container spacing={3} className='match-height'>
                  <Grid item size={{ xs: 12, md: 3, sm: 6 }}>
                    <DashboardCardHeader title={t('dashboard.key_insights')}>
                      <Box sx={{ p: 6 }}>
                        <KeyInsights insights={keyInsightsData} />
                      </Box>
                    </DashboardCardHeader>
                  </Grid>
                  <Grid item size={{ xs: 12, md: 3, sm: 6 }}>
                    <DashboardCardHeader title={t('dashboard.animal_activity')}>
                      <AnimalActivityChart animalActivityData={animalActivityData} />
                    </DashboardCardHeader>
                  </Grid>
                  <Grid item size={{ xs: 12, md: 3, sm: 6 }}>
                    <DashboardCardHeader title={t('dashboard.animal_transfer')}>
                      <Box sx={{ p: 6 }}>
                        <AnimalTransferProgress animalTransfer={animalTransfer} />
                      </Box>
                    </DashboardCardHeader>
                  </Grid>
                  <Grid item size={{ xs: 12, md: 3, sm: 6 }}>
                    <DashboardCardHeader title={t('dashboard.eggs')}>
                      <EggChart eggAnalytics={eggAnalytics} height={332} />
                    </DashboardCardHeader>
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4.5, sm: 6 }}>
                    <DashboardPharmacyDetails pharmacyData={pharmacyData} />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 2.5, sm: 6 }}>
                    <DashboardCardHeader title={t('dashboard.pending_requests_pharmacy')} isSmall={true}>
                      <PharmacyPendingReqChart pendingRequests={pendingRequests} />
                    </DashboardCardHeader>
                  </Grid>
                  <Grid item size={{ xs: 12, md: 2.5, sm: 6 }}>
                    <DashboardCardHeader title={t('dashboard.notes')}>
                      <DashboardNotes notesData={notes} />
                    </DashboardCardHeader>
                  </Grid>
                  <Grid item size={{ xs: 12, md: 2.5, sm: 6 }}>
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
  )
}

export default Dashboard

// import React, { useCallback, useEffect, useState } from 'react'
// import Image from 'next/image'
// import welcomeToAntz from 'public/images/intro_antz_all.jpg'
// import DashboardStatsPanel from '../../components/dashboard/DashboardStatsPanel'
// import { Typography, Box, Grid } from '@mui/material'
// import DashboardCardHeader from '../../components/dashboard/DashboardCardHeader'
// import EggChart from '../../components/dashboard/charts/EggChart'
// import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'
// import AnimalActivityChart from '../../components/dashboard/charts/AnimalActivityChart'
// import KeyInsights from '../../components/dashboard/KeyInsights'
// import AnimalTransferProgress from '../../components/dashboard/charts/AnimalTransferProgress'
// import KeenSliderWrapper from 'src/@core/styles/libs/keen-slider'
// import DashboardPharmacyDetails from '../../components/dashboard/DashboardPharmacyDetails'
// import PharmacyPendingReqChart from '../../components/dashboard/charts/PharmacyPendingReqChart'
// import AdministerMedicineChart from '../../components/dashboard/charts/AdministerMedicineChart'
// import DashboardLabRequests from '../../components/dashboard/DashboardLabRequests'
// import {
//   getDashboardAnalytics,
//   getKeyInsights,
//   getEggAnalytics,
//   getAnimalActivity,
//   getAnimalTransfer,
//   getPendingRequests,
//   getNotes,
//   getDashboardPharmacy,
//   getLabRequests
// } from 'src/lib/api/dashboard'
// import DashboardNotes from 'src/components/dashboard/charts/DashboardNotes'

// function Dashboard() {
//   const [loading, setLoading] = useState(false)
//   const [dashboardAnalyticsData, setDashboardAnalyticsData] = useState([])
//   const [keyInsightsData, setKeyInsightsData] = useState([])
//   const [eggAnalytics, setEggAnalytics] = useState([])
//   const [animalActivityData, setAnimalActivityData] = useState([])

//   const [animalTransfer, setAnimalTransfer] = useState({
//     totalTransfers: 0,
//     transferPercentage: 0,
//     transferProgress: []
//   })
//   const [pharmacyData, setPharmacyData] = useState([])

//   const [pendingRequests, setPendingRequests] = useState({
//     total_requests: 0,
//     completed_requests: 0,
//     completed_requests_percentage: 0,
//     priority_stats: []
//   })
//   const [notes, setNotes] = useState([])

//   const [labRequests, setLabRequests] = useState({
//     total_requests: 0,
//     completed_request: 0,
//     completed_requests_percentage: 0,
//     lab_stats: []
//   })

//   const fetchAnalyticsData = useCallback(async () => {
//     try {
//       setLoading(true)

//       const params = {}
//       await getDashboardAnalytics({ params: params }).then(res => {
//         if (res.length > 0) {
//           setDashboardAnalyticsData(res)
//         }

//         console.log(res, 'getDashboardAnalytics')
//       })
//       setLoading(false)
//     } catch (e) {
//       console.log(e)
//       setLoading(false)
//     }
//   }, [])

//   const fetchKeyInsightsData = useCallback(async () => {
//     try {
//       setLoading(true)

//       const params = {}
//       await getKeyInsights({ params: params }).then(res => {
//         if (res.length > 0) {
//           setKeyInsightsData(res)
//         }

//         console.log(res, 'getKeyInsights')
//       })
//       setLoading(false)
//     } catch (e) {
//       console.log(e)
//       setLoading(false)
//     }
//   }, [])

//   const fetchAnimalActivityData = useCallback(async () => {
//     try {
//       setLoading(true)

//       const params = {}
//       await getAnimalActivity({ params: params }).then(res => {
//         if (res.length > 0) {
//           setAnimalActivityData(res)
//         }

//         // console.log(res, 'getAnimalActivity')
//       })
//       setLoading(false)
//     } catch (e) {
//       console.log(e)
//       setLoading(false)
//     }
//   }, [])

//   const fetchAnimalTransferData = useCallback(async () => {
//     try {
//       setLoading(true)

//       const params = {}
//       await getAnimalTransfer({ params: params }).then(res => {
//         if (res && Object.keys(res).length > 0) {
//           setAnimalTransfer({
//             totalTransfers: res.totalTransfers,
//             transferPercentage: res.transferPercentage,
//             transferProgress: res.transferProgress
//           })
//         }
//       })
//       setLoading(false)
//     } catch (e) {
//       console.log(e)
//       setLoading(false)
//     }
//   }, [])

//   const fetchPharmacyData = useCallback(async () => {
//     try {
//       setLoading(true)

//       const params = {}
//       await getDashboardPharmacy({ params: params }).then(res => {
//         if (res.length > 0) {
//           setPharmacyData(res)
//         }
//       })
//       setLoading(false)
//     } catch (e) {
//       console.log(e)
//       setLoading(false)
//     }
//   }, [])

//   useEffect(() => {
//     fetchAnalyticsData()
//     fetchKeyInsightsData()
//     fetchAnimalActivityData()
//     fetchEggAnalytics()
//     fetchAnimalTransferData()
//     fetchPendingRequests()
//     fetchNotes()
//     fetchPharmacyData()
//     fetchLabRequests()
//   }, [])

//   const fetchEggAnalytics = useCallback(async () => {
//     try {
//       setLoading(true)

//       const params = {}
//       await getEggAnalytics({ params: params }).then(res => {
//         if (res.length > 0) {
//           setEggAnalytics(res)
//         }

//         console.log(res, 'getEggAnalytics')
//       })
//       setLoading(false)
//     } catch (e) {
//       console.log(e)
//       setLoading(false)
//     }
//   }, [])

//   const fetchPendingRequests = useCallback(async () => {
//     try {
//       setLoading(true)

//       const params = {}
//       await getPendingRequests({ params: params }).then(res => {
//         if (res && Object.keys(res).length > 0) {
//           console.log(res, 'getPendingRequests')
//           setPendingRequests({
//             total_requests: res?.total_requests,
//             completed_requests: res?.completed_requests,
//             completed_requests_percentage: res?.completed_requests_percentage,
//             priority_stats: res?.priority_stats
//           })
//         }
//       })
//       setLoading(false)
//     } catch (e) {
//       console.log(e)
//       setLoading(false)
//     }
//   }, [])

//   const fetchNotes = useCallback(async () => {
//     try {
//       setLoading(true)

//       const params = {}
//       await getNotes({ params: params }).then(res => {
//         if (res.length > 0) {
//           setNotes(res)
//         }

//         console.log(res, 'getNotes')
//       })
//       setLoading(false)
//     } catch (e) {
//       console.log(e)
//       setLoading(false)
//     }
//   }, [])

//   const fetchLabRequests = useCallback(async () => {
//     try {
//       setLoading(true)

//       const params = {}
//       await getLabRequests({ params: params }).then(res => {
//         if (res) {
//           setLabRequests(res)
//         }

//         console.log(res, 'getLabRequests')
//       })
//       setLoading(false)
//     } catch (e) {
//       console.log(e)
//       setLoading(false)
//     }
//   }, [])

//   return (
//     <div style={{ textAlign: 'center' }}>
//       {/* <Image
//         src={welcomeToAntz}
//         style={{ maxWidth: '600px', width: '100%', height: 'calc(100vh - 180px)', objectFit: 'contain' }}
//         alt='Welcome to Antz'
//       /> */}

//       <DashboardStatsPanel stats={dashboardAnalyticsData} />
//       <Box sx={{ mt: 3 }}>
//         <ApexChartWrapper>
//           <KeenSliderWrapper>
//             <Grid container spacing={3} className='match-height'>
//               <Grid item xs={12} sm={6} md={3}>
//                 <DashboardCardHeader title='Key insights'>
//                   <Box sx={{ p: 6 }}>
//                     <KeyInsights insights={keyInsightsData} />
//                     {/* <KeyInsightsContent /> */}
//                   </Box>
//                 </DashboardCardHeader>
//               </Grid>
//               <Grid item xs={12} sm={6} md={3}>
//                 <DashboardCardHeader title='Animal activity'>
//                   <AnimalActivityChart animalActivityData={animalActivityData} />
//                 </DashboardCardHeader>
//               </Grid>
//               <Grid item xs={12} sm={6} md={3}>
//                 <DashboardCardHeader title='Animal transfer'>
//                   <Box sx={{ p: 6 }}>
//                     <AnimalTransferProgress animalTransfer={animalTransfer} />
//                     {/* <AnimalTransferContent /> */}
//                   </Box>
//                 </DashboardCardHeader>
//               </Grid>
//               <Grid item xs={12} sm={6} md={3}>
//                 <DashboardCardHeader title='Eggs'>
//                   <EggChart eggAnalytics={eggAnalytics} height={332} />
//                 </DashboardCardHeader>
//               </Grid>
//               <Grid item xs={12} sm={6} md={4.5} sx={{ order: [2, 2, 1] }}>
//                 <DashboardPharmacyDetails pharmacyData={pharmacyData} />
//               </Grid>
//               <Grid item xs={12} sm={6} md={2.5} sx={{ order: [1, 1, 2] }}>
//                 <DashboardCardHeader title='Pending requests(Pharmacy)' isSmall={true}>
//                   <PharmacyPendingReqChart pendingRequests={pendingRequests} />
//                 </DashboardCardHeader>
//               </Grid>
//               <Grid item xs={12} sm={6} md={2.5} sx={{ order: [1, 1, 2] }}>
//                 <DashboardCardHeader title='Notes'>
//                   {/* <AdministerMedicineChart /> */}
//                   {/* <Grid> */}
//                   <DashboardNotes notesData={notes} />
//                   {/* <EggChart eggAnalytics={notes} height={240} /> */}
//                   {/* </Grid> */}
//                 </DashboardCardHeader>
//               </Grid>
//               <Grid item xs={12} sm={6} md={2.5} sx={{ order: [1, 1, 2] }}>
//                 <DashboardCardHeader title='Lab requests'>
//                   <DashboardLabRequests labRequests={labRequests} />
//                 </DashboardCardHeader>
//               </Grid>
//             </Grid>
//           </KeenSliderWrapper>
//         </ApexChartWrapper>
//       </Box>
//     </div>
//   )
// }

// export default Dashboard
