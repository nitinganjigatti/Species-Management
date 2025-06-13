// ** MUI Imports
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import { useEffect, useState } from 'react'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Component Import
import CardStatisticsVertical from 'src/@core/components/card-statistics/card-stats-vertical'
import { getAllLists } from 'src/lib/api/pharmacy/dashboard'

// ** Styled Component Import
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'

// ** Demo Components Imports

import AnalyticsCongratulations from 'src/components/pharmacy/dashBoard/AnalyticsCongratulations'
import CardStatsVertical from 'src/@core/components/card-statistics/card-stats-vertical'
import CriticalInfoCards from 'src/components/pharmacy/dashBoard/CriticalInfoCards'
import TotalListCard from 'src/components/pharmacy/dashBoard/TotalListCard'
import RequestCompletedChart from 'src/components/pharmacy/dashBoard/RequestCompletedChart'
import PendingRequestsChart from 'src/components/pharmacy/dashBoard/PendingRequestsChart'
import StoreWisePendingRequestsChart from 'src/components/pharmacy/dashBoard/StoreWisePendingRequestsChart'
import MonthlyDispatchChart from 'src/components/pharmacy/dashBoard/MonthlyDispatchChart'
import MonthlyPurchaseChart from 'src/components/pharmacy/dashBoard/MonthlyPurchaseChart'
import FastMovingProducts from 'src/components/pharmacy/dashBoard/FastMovingpProducts'

import StoreWiseNewRequests from 'src/components/pharmacy/dashBoard/StoreWiseNewRequests'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Card from '@mui/material/Card'

import Divider from '@mui/material/Divider'
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import OptionsMenu from 'src/@core/components/option-menu'
import { bgcolor, color } from '@mui/system'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import StoreWiseDispatch from '../reports/store-wise-dispatch'
import RequestChart from 'src/components/pharmacy/dashBoard/RequestChart'
import { LoadingButton } from '@mui/lab'
import ReceievedMedicines from 'src/components/pharmacy/dashBoard/ReceievedMedicines'
import ExpiredProducts from 'src/components/pharmacy/dashBoard/ExpiredProducts'
import RequestSentChart from 'src/components/pharmacy/dashBoard/RequestSentChart'
import DoctorWiseRequest from '../reports/doctor-wise-request'

const NewDashboard = () => {
  const [totalList, setTotalList] = useState([])
  const [value, setValue] = useState('1')
  const { selectedPharmacy } = usePharmacyContext()

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const getAllTotalLists = async () => {
    try {
      const result = await getAllLists()

      console.log('total list', result)

      if (result?.success === true && result?.data) {
        const dataArray = Object.keys(result?.data).map(key => ({ name: key, value: result?.data[key] }))

        setTotalList(dataArray)
      }
    } catch (error) {}
  }

  const modifiedProperties = name => {
    switch (name) {
      case 'pharmacyCount':
        return { name: 'Pharmacies', icon: 'bx:clinic', color: '#37BD69', bgColor: '#F2FFF8' }
      case 'medicineCount':
        return { name: 'Total SKU’s', icon: 'ic:sharp-content-paste', color: '#00AFD6', bgColor: '#E4F9F8' }

      case 'inStockCount':
        return { name: 'In-Stock SKU', icon: 'tdesign:task-checked', color: '#006D35', bgColor: '#F2FFF8' }
      case 'supplierCount':
        return {
          name: 'Total suppliers',
          icon: 'fluent:people-toolbox-16-filled',
          color: '#1F515B',
          bgColor: '#E1EFF2'
        }
      case 'productRequestCount':
        return { name: 'New product requests', icon: 'fluent-mdl2:add-notes', color: '#E4B819', bgColor: '#F9F5D0' }
      case 'expireValue':
        return { name: 'Value of expired medicine', icon: 'bi:capsule-pill', color: '#E93353', bgColor: '#FFEBEF' }
      case 'outOfStockCount':
        return { name: 'Medicines out of stock', icon: 'tabler:pill-off', color: '#E93353', bgColor: '#FFEBEF' }
      case 'todayDispatchedValue':
        return { name: 'Todays Dispatched Value', icon: 'mage:package-box', color: '#006D35', bgColor: '#F2FFF8' }
      case 'todayShipmentCount':
        return { name: 'Todays Shipments', icon: 'hugeicons:ambulance', color: '#00AFD6', bgColor: '#E4F9F8' }
      case 'todayRequestCount':
        return { name: 'No. of Requests Today', icon: 'tdesign:task-checked', color: '#1F515B', bgColor: '#E1EFF2' }
      default:
        return ''
    }
  }

  const expiredMedicine = totalList.find(item => item.name === 'expireValue')
  const outOfStockMedicine = totalList.find(item => item.name === 'outOfStockCount')

  useEffect(() => {
    getAllTotalLists()
  }, [selectedPharmacy.type])

  // {selectedPharmacy.type === 'central' &&
  return (
    <ApexChartWrapper>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 5 }}>
        <Typography variant='h5' sx={{
          color: '#44544A'
        }}>
          Welcome to your pharmacy's control center!
        </Typography>
        {/* <LoadingButton size='medium' variant='contained' endIcon={<Icon icon='material-symbols:download' />}>
          Download Report
        </LoadingButton> */}
      </Box>
      <Grid container spacing={6} className='match-height'>
        <Grid item size={{ xs: 12, md: selectedPharmacy.type === 'central' ? 8 : 12 }}>
          <AnalyticsCongratulations />
        </Grid>
        {selectedPharmacy.type === 'central' ? (
          <Grid item size={{ xs: 12, md: 4 }}>
            <Card>
              <CardHeader
                title={'Critical info'}
                action={
                  <OptionsMenu
                    options={['Refresh']}
                    iconButtonProps={{ size: 'small', className: 'card-more-options' }}
                  />
                }
              />
              <CardContent sx={{ marginTop: -6 }}>
                <Grid container sx={{ display: 'flex', justifyContent: 'space-between' }} className='match-height'>
                  <Grid item size={{ xs: 6, sm: 11 / 2 }}>
                    <CriticalInfoCards
                      title={expiredMedicine?.value ? '₹ ' + expiredMedicine?.value : '0'}
                      subTitle={expiredMedicine?.name}
                      modifiedProperties={modifiedProperties}
                    />
                  </Grid>
                  <Divider orientation='vertical' variant='middle' flexItem />

                  <Grid item size={{ xs: 11 / 2 }}>
                    <CriticalInfoCards
                      title={outOfStockMedicine?.value ? outOfStockMedicine?.value : '0'}
                      subTitle={outOfStockMedicine?.name}
                      modifiedProperties={modifiedProperties}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          ''
        )}
        {selectedPharmacy.type === 'central' ? (
          <Grid item size={{ xs: 12, md: 12 }}>
            {console.log(totalList, 'totalList')}
            <TotalListCard
              data={
                selectedPharmacy.type === 'central'
                  ? totalList?.filter(el =>
                      ['todayDispatchedValue', 'todayRequestCount', 'todayShipmentCount'].includes(el.name)
                    )
                  : ''

                //totalList?.filter(el => el.name === 'medicineCount' || el.name === 'inStockCount')
              }
              modifiedProperties={modifiedProperties}
            />
          </Grid>
        ) : null}
        {/* <Grid item xs={12} md={4}>
          <PendingRequestsChart />
        </Grid>
        {selectedPharmacy.type === 'central' ? (
          <>
            <Grid item xs={12} md={4}>
              <StoreWisePendingRequestsChart />
            </Grid>
            <Grid item xs={12} md={4}>
              <RequestCompletedChart />
            </Grid>
          </>
        ) : null} */}
        {selectedPharmacy.type !== 'central' ? (
          <>
            <Grid item size={{ xs: 12, md: 12 }} sx={{ mb: 0 }}>
              <ReceievedMedicines />
            </Grid>
          </>
        ) : null}
        {selectedPharmacy.type === 'central' ? (
          <>
            <Grid item size={{ xs: 12, md: 6 }}>
              <MonthlyDispatchChart />
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
              <MonthlyPurchaseChart />
            </Grid>
          </>
        ) : null}
        {selectedPharmacy.type !== 'central' ? (
          <>
            <Grid item size={{ xs: 12, md: 12 }} sx={{ mb: 0 }}>
              <RequestSentChart />
            </Grid>
          </>
        ) : null}

        {selectedPharmacy.type !== 'central' ? (
          <Grid container item spacing={6} size={{ xs: 12, md: 12 }} sx={{ display: 'flex' }}>
            <Grid item size={{ xs: 12, md: 12 }} sx={{ mb: 0 }}>
              <DoctorWiseRequest />
            </Grid>

            <Grid item size={{ xs: 12, md: 7.5 }}>
              <StoreWiseNewRequests />
            </Grid>
            <Grid item size={{ xs: 12, md: 4.5 }}>
              <Card>
                <CardHeader
                  title='Products'
                  action={
                    <OptionsMenu
                      options={['Refresh']}
                      iconButtonProps={{ size: 'small', className: 'card-more-options' }}
                    />
                  }
                  slotProps={{
                    title: { sx: { lineHeight: '2rem !important', letterSpacing: '0.15px !important' } }
                  }}
                />
                <TabContext value={value}>
                  <TabList onChange={handleChange} aria-label='card navigation example'>
                    <Tab value='1' label='Expired products' />
                    <Tab value='2' label='Fast moving products' />
                  </TabList>
                  <CardContent sx={{ height: '630px', msOverflowY: 'scroll' }}>
                    <TabPanel value='1' sx={{ p: 0 }}>
                      <ExpiredProducts />
                    </TabPanel>
                    <TabPanel value='2' sx={{ p: 0 }}>
                      <FastMovingProducts />
                    </TabPanel>
                  </CardContent>
                </TabContext>
              </Card>
            </Grid>
          </Grid>
        ) : null}
        {selectedPharmacy.type === 'central' ? (
          <Grid container item spacing={6} size={{ xs: 12, md: 12 }} sx={{ display: 'flex' }}>
            <Grid item size={{ xs: 12, md: 12 }} sx={{ mb: 0 }}>
              <StoreWiseDispatch />
            </Grid>

            <Grid item size={{ xs: 12, md: 12 }} sx={{ mb: 0 }}>
              <RequestChart />
            </Grid>

            <Grid item size={{ xs: 12, md: 7.5 }}>
              <StoreWiseNewRequests />
            </Grid>
            <Grid item size={{ xs: 12, md: 4.5 }}>
              <Card>
                <CardHeader
                  title='Products'
                  action={
                    <OptionsMenu
                      options={['Refresh']}
                      iconButtonProps={{ size: 'small', className: 'card-more-options' }}
                    />
                  }
                  slotProps={{
                    title: { sx: { lineHeight: '2rem !important', letterSpacing: '0.15px !important' } }
                  }}
                />
                <TabContext value={value}>
                  <TabList onChange={handleChange} aria-label='card navigation example'>
                    <Tab value='1' label='Expired products' />
                    <Tab value='2' label='Fast moving products' />
                  </TabList>
                  <CardContent sx={{ height: '630px', msOverflowY: 'scroll' }}>
                    <TabPanel value='1' sx={{ p: 0 }}>
                      <ExpiredProducts />
                    </TabPanel>
                    <TabPanel value='2' sx={{ p: 0 }}>
                      <FastMovingProducts />
                    </TabPanel>
                  </CardContent>
                </TabContext>
              </Card>
            </Grid>
          </Grid>
        ) : null}
      </Grid>
    </ApexChartWrapper>
  );
}

export default NewDashboard
