import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  Divider,
  Avatar,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  List,
  ListItem,
  ListItemText,
  CardHeader,
  Drawer,
  TextField,
  Autocomplete,
  alpha,
  CircularProgress
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import InfoIcon from '@mui/icons-material/Info'
import CommonDrawerBox from 'src/components/CommonDrawerBox'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import { Controller, useForm } from 'react-hook-form'
import IconButton from '@mui/material/IconButton'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import ProductsChart from 'src/components/pharmacy/medicine/ProductsChart'
import StyleWithIconCardComponent from 'src/views/utility/style-with-icon-card'
import { useTheme } from '@emotion/react'
import { useRouter } from 'next/router'
import {
  getProductAboutToExpireList,
  getProductDashboardList,
  getProductExpiredBatchesList,
  getProductMonthWiseDispatchList,
  getProductMonthWisePurchaseList,
  getProductQuantityInStoresList
} from 'src/lib/api/pharmacy/getMedicineList'
import FallbackSpinner from 'src/@core/components/spinner'
import Utility from 'src/utility'
import MonthlyChart from 'src/views/utility/monthlychart'
import { usePharmacyContext } from 'src/context/PharmacyContext'

const validationSchema = yup.object().shape({
  alternatives: yup.array().of(
    yup.object().shape({
      productName: yup.string().required('Product Name is required'),
      manufacturerName: yup
        .string()
        .min(3, 'Manufacturer Name must be at least 3 characters')
        .required('Manufacturer Name is required')
    })
  )
})

const Overview = props => {
  console.log(props, 'props')
  const { productDetails, productDashboardData, purchaseData, dispatchData, tabValue, updateUrlParams } = props
  const theme = useTheme()

  const router = useRouter()
  const { id } = router.query
  const { selectedPharmacy } = usePharmacyContext()

  // const [productDashboardData, setProductDashboardData] = useState()
  // const [purchaseData, setPurchaseData] = useState({ dispatch_count: [], dispatch_value: [] })
  // const [dispatchData, setDispatchData] = useState({ dispatch_count: [], dispatch_value: [] })
  const [isAlternativeMedicinesDrawerOpen, setAlternativeMedicinesDrawerOpen] = useState(false)
  const [addMedicinesDrawerOpen, setAddMedicinesDrawerOpen] = useState(false)

  console.log(selectedPharmacy, 'selectedPharmacy')

  useEffect(() => {
    if (router.query.tab !== tabValue) {
      updateUrlParams({
        tab: tabValue
      })
    }
  }, [tabValue, updateUrlParams])

  const medicines = [
    {
      name: 'Genimol 650 Tablet',
      manufacturer: 'Geneda Pharma'
    },
    {
      name: 'Duramol Advanced Tablet',
      manufacturer: 'Makers Laboratories Ltd'
    },
    {
      name: 'Calpol 650 + Tablet',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd'
    },
    {
      name: 'Opara Semi Tablet',
      manufacturer: '10 tablets'
    },
    {
      name: 'Pyregesic 650mg Tablet',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd'
    },
    {
      name: 'Calpol 650 + Tablet',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd'
    },
    {
      name: 'Pyregesic 650mg Tablet',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd'
    },
    {
      name: 'Genimol 650 Tablet',
      manufacturer: 'Geneda Pharma'
    },
    {
      name: 'Pyregesic 650mg Tablet',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd'
    },
    {
      name: 'Calpol 650 + Tablet',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd'
    }
  ]

  const alternativeMedicines = (
    <>
      <Typography
        variant='h6'
        gutterBottom
        sx={{ color: 'customColors.customHeadingTextColor', fontSize: '16px', fontWeight: 500 }}
      >
        Alternative Medicines (10)
      </Typography>
      <Paper elevation={3}>
        <List>
          {medicines.map((medicine, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={medicine.name}
                secondary={medicine.manufacturer}
                primaryTypographyProps={{
                  sx: { color: 'primary.dark', fontWeight: 500, fontSize: '14px' } // Customize primary text
                }}
                secondaryTypographyProps={{
                  sx: { color: 'customColors.neutralSecondary', fontWeight: 400, fontSize: '12px' }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </>
  )

  const QuantityInStoresContent = ({ data, isLoading }) => {
    const totalCentralQty = Array.isArray(data?.central)
      ? data.central.reduce((sum, store) => sum + Number(store.total_qty), 0)
      : 0

    const totalLocalQty = Array.isArray(data?.local)
      ? data.local.reduce((sum, store) => sum + Number(store.total_qty), 0)
      : 0

    return (
      <>
        {isLoading ? (
          <FallbackSpinner />
        ) : (
          <>
            <Box
              sx={{
                padding: '16px',
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                marginBottom: 2,
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Typography
                variant='subtitle1'
                sx={{ color: 'customColors.customHeadingTextColor', fontWeight: 600, fontSize: '16px' }}
              >
                {selectedPharmacy.name}
                {/* Central Pharmacy */}
              </Typography>
              <Typography variant='body1' component='div'>
                <Typography
                  component='span'
                  sx={{ color: 'customColors.neutralSecondary', fontSize: '14px', fontWeight: 400 }}
                >
                  Total Quantity:
                </Typography>
                <Typography
                  component='span'
                  sx={{ color: 'customColors.customHeadingTextColor', fontWeight: 600, fontSize: '16px', ml: 1 }}
                >
                  {totalCentralQty}
                </Typography>
              </Typography>{' '}
            </Box>

            {/* Table Section */}
            <Card sx={{ p: 4 }}>
              <Typography
                variant='subtitle1'
                marginBottom={2}
                sx={{ color: 'customColors.customHeadingTextColor', fontWeight: 500, fontSize: '14px' }}
              >
                Other Pharmacy Quantity Details
              </Typography>
              <Card
                sx={{
                  // m: 6,
                  border: '1px solid',
                  borderColor: 'customColors.customTableBorderBg',
                  boxShadow: 'none'
                }}
              >
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead sx={{ borderColor: 'customColors.customTableBorderBg' }}>
                      <TableRow
                        sx={{
                          backgroundColor: theme => alpha(theme.palette.customColors.SecondaryContainer, 0.6),
                          padding: '4px 8px'
                        }}
                      >
                        <TableCell sx={{ p: '6px' }}>Store Name</TableCell>
                        <TableCell sx={{ p: '6px' }}>Quantity in Store</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody
                      sx={{
                        borderColor: 'customColors.customTableBorderBg'
                      }}
                    >
                      {data?.local?.length === 0 ? (
                        <TableRow
                          sx={{
                            '&:last-child td, &:last-child th': {
                              border: 0
                            }
                          }}
                        >
                          <TableCell colSpan={6} sx={{ textAlign: 'center' }}>
                            No data found
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {data?.local.map(store => (
                            <TableRow
                              key={store?.store_id}
                              sx={{
                                '&:last-child td, &:last-child th': {
                                  border: 0
                                }
                              }}
                            >
                              {/* <TableCell>Local</TableCell> */}
                              <TableCell>{store?.store_name}</TableCell>
                              <TableCell>{store?.total_qty}</TableCell>
                            </TableRow>
                          ))}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Card>
          </>
        )}
      </>
    )
  }

  const AboutToExpireContent = ({ data, isLoading }) => (
    <>
      {isLoading ? (
        <FallbackSpinner />
      ) : (
        <Card
          sx={{
            border: '1px solid',
            borderColor: 'customColors.customTableBorderBg',
            boxShadow: 'none'
          }}
        >
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ borderColor: 'customColors.customTableBorderBg' }}>
                <TableRow sx={{ backgroundColor: theme => alpha(theme.palette.customColors.TertiaryContainer, 0.6) }}>
                  <TableCell sx={{ p: '6px' }}>BATCH ID</TableCell>
                  <TableCell sx={{ p: '6px' }}>EXPIRY DATE</TableCell>
                  <TableCell sx={{ p: '6px' }}>QUANTITY</TableCell>
                  <TableCell sx={{ p: '6px' }}>UNIT PRICE</TableCell>
                  <TableCell sx={{ p: '6px' }}>VALUE</TableCell>
                  <TableCell sx={{ p: '6px' }}>DAYS LEFT</TableCell>
                </TableRow>
              </TableHead>
              <TableBody sx={{ borderColor: 'customColors.customTableBorderBg' }}>
                {data.length === 0 ? (
                  <TableRow
                    sx={{
                      '&:last-child td, &:last-child th': {
                        border: 0 // Removes borders for the last row
                      }
                    }}
                  >
                    <TableCell colSpan={6} align='center'>
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row, index) => {
                    const value = (parseFloat(row.qty) * parseFloat(row.unit_price)).toFixed(2)

                    const formattedValue = Number(value).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })
                    const newValue = parseInt(row.qty) * parseInt(row.unit_price)

                    // formatAmountToReadableDigit
                    return (
                      <TableRow
                        key={index}
                        sx={{
                          '&:last-child td, &:last-child th': {
                            border: 0 // Removes borders for the last row
                          }
                        }}
                      >
                        <TableCell>{row.batch_no}</TableCell>
                        <TableCell>
                          {/* {row.expiry_date} */}
                          {Utility.formatDisplayDate(Utility.convertUTCToLocal(row.expiry_date))}
                        </TableCell>
                        <TableCell>{row.qty}</TableCell>
                        <TableCell>{Utility.formatAmountToReadableDigit(row.unit_price)}</TableCell>
                        {/* <TableCell>₹{row.unit_price}</TableCell> */}
                        {/* <TableCell>₹{formattedValue}</TableCell> */}
                        <TableCell>{Utility.formatAmountToReadableDigit(newValue)}</TableCell>
                        <TableCell sx={{ color: 'customColors.Tertiary' }}>{row.days_left} Days</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </>
  )

  const ExpiredBatchesContent = ({ data, isLoading }) => (
    <>
      {isLoading ? (
        <FallbackSpinner />
      ) : (
        <Card
          sx={{
            border: '1px solid',
            borderColor: 'customColors.customTableBorderBg',
            boxShadow: 'none'
          }}
        >
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ borderColor: 'customColors.customTableBorderBg' }}>
                <TableRow sx={{ backgroundColor: '#FFD3D3CC' }}>
                  <TableCell sx={{ p: '6px' }}>BATCH ID</TableCell>
                  <TableCell sx={{ p: '6px' }}>EXPIRY DATE</TableCell>
                  <TableCell sx={{ p: '6px' }}>QUANTITY</TableCell>
                  <TableCell sx={{ p: '6px' }}>UNIT PRICE</TableCell>
                  <TableCell sx={{ p: '6px' }}>VALUE</TableCell>
                  <TableCell sx={{ p: '6px' }}>OVERDUE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody sx={{ borderColor: 'customColors.customTableBorderBg' }}>
                {data.length === 0 ? (
                  <TableRow
                    sx={{
                      '&:last-child td, &:last-child th': {
                        border: 0
                      }
                    }}
                  >
                    <TableCell colSpan={6} sx={{ textAlign: 'center' }}>
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item, index) => {
                    const value = (parseFloat(item.qty) * parseFloat(item.unit_price)).toFixed(2)

                    const formattedValue = Number(value).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })
                    const newValue = parseInt(item.qty) * parseInt(item.unit_price)

                    return (
                      <TableRow
                        key={index}
                        sx={{
                          '&:last-child td, &:last-child th': {
                            border: 0
                          }
                        }}
                      >
                        <TableCell>{item.batch_no}</TableCell>
                        <TableCell>{Utility.formatDisplayDate(Utility.convertUTCToLocal(item.expiry_date))}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>{Utility.formatAmountToReadableDigit(item.unit_price)}</TableCell>
                        {/* <TableCell>₹{item.unit_price}</TableCell> */}
                        {/* <TableCell>₹{formattedValue}</TableCell> */}
                        <TableCell>{Utility.formatAmountToReadableDigit(newValue)}</TableCell>
                        <TableCell sx={{ color: 'customColors.Error' }}>{item.days_overdue} Days</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </>
  )

  const [activeDrawer, setActiveDrawer] = useState(null)
  const [drawerDataArray, setDrawerDataArray] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const [totalValue, setTotalValue] = useState({
    totalValue: 0,
    totalBatches: 0,
    totalStores: 0,
    totalQuantity: 0
  })

  const drawerData = [
    {
      name: 'quantityInStores',
      title: 'Quantity in Stores',
      style: 'customColors.Background',
      bgColor: theme => alpha(theme.palette.customColors.SecondaryContainer, 0.3),
      icon: '/images/medicare.svg',
      value: productDashboardData?.quantity,
      description: 'Quantity in Store',
      totalStores: totalValue?.totalStores,
      totalQuantity: totalValue?.totalQuantity
    },
    {
      name: 'aboutToExpire',
      title: 'About to Expire',
      style: 'customColors.Background',
      bgColor: theme => alpha(theme.palette.customColors.Tertiary, 0.1),
      icon: '/images/calendar.svg',
      value: productDashboardData?.about_to_expire,
      description: 'About to Expire Quantity',
      totalBatches: totalValue?.totalBatches,
      totalValue: totalValue?.totalValue
    },
    {
      name: 'expiredBatches',
      title: 'Expired Batches',
      style: 'customColors.Background',

      // bgColor: '#E933531A',
      bgColor: theme => alpha(theme.palette.customColors.Error, 0.1),
      icon: '/images/Incubator_ICON.svg',
      value: productDashboardData?.expired,
      description: 'Expired Quantity',
      totalBatches: totalValue?.totalBatches,
      totalValue: totalValue?.totalValue
    }
  ]

  const closeDrawer = () => {
    setActiveDrawer(null)
    setDrawerDataArray([])
    setTotalValue({
      totalQuantity: 0,
      totalStores: 0,
      totalBatches: 0,
      totalValue: 0
    })
  }

  const openDrawer = async name => {
    setActiveDrawer(name)

    try {
      setIsLoading(true)
      let result

      // Fetch data based on selected drawer ID
      if (name === 'aboutToExpire') {
        result = await getProductAboutToExpireList(id)
      } else if (name === 'expiredBatches') {
        result = await getProductExpiredBatchesList(id)
      } else if (name === 'quantityInStores') {
        result = await getProductQuantityInStoresList(id)
      }

      if (result?.success && result?.data) {
        setIsLoading(false)
        setDrawerDataArray(result.data)
        if (name === 'quantityInStores') {
          const allStores = [...(result?.data?.central || []), ...(result?.data?.local || [])]
          console.log(allStores, 'allStores')

          const totalQuantity = allStores.reduce((sum, store) => sum + Number(store.total_qty), 0)
          const totalStores = allStores.length

          // Set only totalValue and totalStores
          setTotalValue({
            totalQuantity,
            totalStores,
            totalBatches: 0,
            totalValue: 0
          })
          console.log('Calculated Totals:', { totalQuantity, totalStores })
        } else {
          const totalValue = result.data.reduce((acc, item) => {
            return acc + parseInt(item.qty) * parseInt(item.unit_price)
          }, 0)

          // const totalValue = formattedTotalValue.toLocaleString('en-IN', {
          //   minimumFractionDigits: 2,
          //   maximumFractionDigits: 2
          // })
          const totalBatches = new Set(result.data.map(item => item.batch_no)).size
          setTotalValue({
            totalQuantity: 0,
            totalStores: 0,
            totalBatches,
            totalValue
          })
        }
      }
    } catch (error) {
      setIsLoading(false)
      console.error('Error fetching data:', error)
    }
  }

  const activeDrawerData = drawerData.find(data => data.name === activeDrawer)

  const renderDrawerContent = () => {
    if (activeDrawer === 'quantityInStores') {
      return <QuantityInStoresContent data={drawerDataArray} isLoading={isLoading} />
    }
    if (activeDrawer === 'aboutToExpire') {
      return <AboutToExpireContent data={drawerDataArray} isLoading={isLoading} />
    }
    if (activeDrawer === 'expiredBatches') {
      return <ExpiredBatchesContent data={drawerDataArray} isLoading={isLoading} />
    }

    return null
  }

  const handleAddAlternativeMedicine = () => {
    setAddMedicinesDrawerOpen(true)
  }

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      alternatives: [{ productName: '', manufacturerName: '' }]
    }
  })

  const productOptions = [
    { label: 'Paracetamol', value: 'paracetamol' },
    { label: 'Ibuprofen', value: 'ibuprofen' },
    { label: 'Aspirin', value: 'aspirin' },
    { label: 'Amoxicillin', value: 'amoxicillin' }
  ]

  // Watch alternatives field
  const alternatives = watch('alternatives', [])

  const handleAddAlternative = () => {
    setValue('alternatives', [...alternatives, { productName: '', manufacturerName: '' }])
  }

  const handleDeleteLastAlternative = () => {
    if (alternatives.length > 1) {
      // Only remove if more than one alternative exists
      setValue('alternatives', alternatives.slice(0, -1))
    }
  }

  const onSubmit = data => {
    console.log('Submitted Alternatives:', data.alternatives)
    reset()
  }

  console.log(productDetails, 'overview')

  // const productDashboardList = async id => {
  //   try {
  //     const response = await getProductDashboardList(id)
  //     if (response.success) {
  //       console.log(response?.data, 'productDashboardList')
  //       setProductDashboardData(response?.data)
  //     }
  //   } catch (e) {
  //     console.error(e)
  //   }
  // }

  // const fetchPurchaseData = async id => {
  //   try {
  //     const result = await getProductMonthWisePurchaseList(id)
  //     if (result?.success === true && result?.data) {
  //       console.log(result, 'result')
  //       const adjustedData = {
  //         purchase_count: result.data.purchase_count,
  //         purchase_value: result.data.purchase_value
  //       }

  //       setPurchaseData(adjustedData)
  //     }
  //   } catch (error) {
  //     console.error(error)
  //   }
  // }

  // const fetchDispatchData = async id => {
  //   try {
  //     const result = await getProductMonthWiseDispatchList(id)
  //     if (result?.success === true && result?.data) {
  //       console.log(result, 'dispatch_count')
  //       const adjustedData = {
  //         dispatch_count: result.data.dispatch_count,
  //         dispatch_value: result.data.dispatch_value
  //       }
  //       setDispatchData(adjustedData)
  //     }
  //   } catch (error) {
  //     console.error(error)
  //   }
  // }

  // useEffect(() => {
  //   if (id != undefined) {
  //     productDashboardList(id)
  //     fetchPurchaseData(id)
  //     fetchDispatchData(id)
  //   }
  // }, [id])

  console.log(purchaseData, 'purchaseData')

  return (
    <>
      <Grid container spacing={4} pt={5}>
        {drawerData.map(card => (
          <StyleWithIconCardComponent
            key={card.name}
            value={card.value}
            description={card.description}
            icon={card.icon}
            bgColor={card.bgColor}
            onClick={() => openDrawer(card.name)}
            showIcon={true}
          />
        ))}
      </Grid>

      <Divider sx={{ my: 5 }} />

      <Grid container spacing={4} sx={{ display: 'flex', alignItems: 'stretch' }}>
        <Grid item xs={12} md={6} sx={{ flexDirection: 'column' }}>
          <Card sx={{ height: '100%' }}>
            {/* <MonthlyChart
              title='Dispatch'
              data={dispatchData}
              barColor='#006D35'
              lineColor='#37BD69'
              barName='Dispatch Value'
              lineName='Dispatch Count'
              viewMorePath=''
            /> */}
            <ProductsChart
              title='Dispatch'
              data={dispatchData}
              locations={['Central Pharmacy', 'East Pharmacy']}
              frequencies={['Monthly', 'Weekly']}
              barColor={'#006D35'}
              lineColor={'#37BD69'}
              seriesBarName='Dispatch Value'
              seriesLineName='Dispatch Count'
              barLabel='Show Dispatch Value'
              lineLabel='Show Dispatch Count'
            />
          </Card>
        </Grid>

        <Grid item xs={12} md={6} sx={{ flexDirection: 'column' }}>
          <Card sx={{ height: '100%' }}>
            <ProductsChart
              title='Purchases'
              data={purchaseData}
              frequencies={['Monthly', 'Weekly']}
              barColor={'#00AFD699'}
              lineColor={'#AFEFEB'}
              seriesBarName='Purchase Value'
              seriesLineName='Purchase Count'
              barLabel='Show Purchase Value'
              lineLabel='Show Purchase Count'
            />
          </Card>
        </Grid>

        {/* Apply similar structure to the rest of the cards */}
        <Grid item xs={12} md={6} sx={{ display: 'none', flexDirection: 'column' }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Header Section */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                  variant='body1'
                  sx={{
                    color: 'customColors.customHeadingTextColor',
                    fontSize: '16px',
                    fontWeight: 500
                  }}
                >
                  <Box display='flex' alignItems='center'>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        bgcolor: 'customColors.Tertiary',
                        borderRadius: '4px',
                        width: '30px',
                        height: '24px',
                        marginRight: '8px'
                      }}
                    >
                      <Icon
                        icon='clarity:child-arrow-line'
                        style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 'bold' }} // Icon color and size
                      />
                    </Box>
                    Alternative Medicines (10)
                  </Box>
                </Typography>

                <CardHeader
                  sx={{ p: 0, m: 0 }}
                  action={
                    <Button
                      variant='text'
                      startIcon={<Icon icon='material-symbols-light:add' />}
                      onClick={handleAddAlternativeMedicine}
                    >
                      Add Alternative
                    </Button>
                  }
                />
              </Box>

              {/* Divider */}
              <Divider sx={{ my: 2 }} />

              {/* Medicine List */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                <Typography variant='body2'>
                  <List>
                    {medicines.slice(0, 5).map((medicine, index) => (
                      <ListItem key={index}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography sx={{ color: 'primary.dark', fontWeight: 500, fontSize: '14px' }}>
                            {medicine.name}
                          </Typography>
                          <Typography
                            component='span'
                            sx={{ color: 'customColors.neutralSecondary', fontWeight: 400, fontSize: '12px' }}
                          >
                            {medicine.manufacturer}
                          </Typography>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Typography>
              </Box>

              {/* More Section - Always at the bottom */}
              <Box>
                <Button
                  variant='text'
                  sx={{ color: 'primary.main', cursor: 'pointer' }}
                  onClick={() => setAlternativeMedicinesDrawerOpen(true)}
                >
                  +5 More
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InfoIcon sx={{ mr: 2, color: theme.palette.customColors.addPrimary, fontWeight: 'bold' }} />
                <Typography sx={{ color: 'customColors.customHeadingTextColor', fontSize: '16px', fontWeight: 500 }}>
                  Additional Information
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {/* <MedicationIcon color='success' sx={{ mr: 1 }} /> */}
                  <Avatar
                    variant='square'
                    alt=''
                    src={'/images/uses.svg'}
                    sx={{ width: '26px', height: '28px', mr: 2 }}
                  />
                  <Typography
                    variant='subtitle1'
                    sx={{ color: 'custoColors.neutralSecondary', fontSize: '12px', fontWeight: 400 }}
                  >
                    Uses
                  </Typography>
                </Box>
                <Typography
                  variant='body2'
                  sx={{ color: 'customColors.customHeadingTextColor', fontSize: '15px', fontWeight: 500, ml: 8.6 }}
                >
                  {productDetails?.uses || 'NA'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {/* <WarningIcon color='error' sx={{ mr: 1 }} /> */}
                  <Avatar
                    variant='square'
                    alt=''
                    src={'/images/side_effect.svg'}
                    sx={{ width: '28px', height: '28px', mr: 2 }}
                  />
                  <Typography
                    variant='subtitle1'
                    sx={{ color: 'customColors.neutralSecondary', fontSize: '12px', fontWeight: 400 }}
                  >
                    Side Effects
                  </Typography>
                </Box>
                <Typography
                  variant='body2'
                  sx={{ color: 'customColors.customHeadingTextColor', fontSize: '15px', fontWeight: 500, ml: 9 }}
                >
                  {productDetails?.side_effects || 'NA'}
                </Typography>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {/* <ShieldIcon color='info' sx={{ mr: 1 }} /> */}
                  <Avatar
                    variant='square'
                    alt=''
                    src={'/images/safety.svg'}
                    sx={{ width: '20px', height: '24px', mr: 2 }}
                  />
                  <Typography
                    variant='subtitle1'
                    sx={{ color: 'customColors.neutralSecondary', fontSize: '12px', fontWeight: 400 }}
                  >
                    Safety Advice
                  </Typography>
                </Box>
                <List dense>
                  {productDetails?.safety_advice ? (
                    productDetails.safety_advice.split(',').map((advice, index) => {
                      const trimmedAdvice = advice.trim()
                      if (!trimmedAdvice) return null

                      return (
                        <ListItem key={index}>
                          <Typography
                            variant='body2'
                            sx={{
                              color: 'customColors.customHeadingTextColor',
                              fontSize: '15px',
                              fontWeight: 500,
                              ml: 4
                            }}
                          >
                            {`${index + 1}. ${trimmedAdvice}`}
                          </Typography>
                        </ListItem>
                      )
                    })
                  ) : (
                    <ListItem>
                      <Typography
                        variant='body2'
                        sx={{
                          color: 'customColors.customHeadingTextColor',
                          fontSize: '15px',
                          fontWeight: 500,
                          ml: 3
                        }}
                      >
                        NA
                      </Typography>
                    </ListItem>
                  )}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {activeDrawerData && (
        <CommonDrawerBox
          title={activeDrawerData.title}
          totalStores={activeDrawerData.totalStores}
          totalQuantity={activeDrawerData.totalQuantity}
          totalBatches={activeDrawerData.totalBatches}
          totalValue={activeDrawerData.totalValue}
          drawerStatus={Boolean(activeDrawer)}
          close={closeDrawer}
          contentComponent={renderDrawerContent()}
          style={activeDrawerData.style}
          width={700}
        />
      )}

      <CommonDrawerBox
        imageUrl={'https://img.freepik.com/free-photo/colorful-design-with-spiral-design_188544-9588.jpg'}
        title='Dolo 650 Tablet'
        drawerStatus={isAlternativeMedicinesDrawerOpen}
        close={() => setAlternativeMedicinesDrawerOpen(false)}
        contentComponent={alternativeMedicines}
        style='customColors.Background'
      />

      <Drawer
        anchor='right'
        open={addMedicinesDrawerOpen}
        onClose={() => setAddMedicinesDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 500,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'customColors.Background'
          }
        }}
      >
        {/* Drawer Header */}
        <Box display='flex' justifyContent='space-between' alignItems='center' sx={{ p: 4 }}>
          <Box display='flex' alignItems='center' gap={2}>
            <Typography variant='h6' fontWeight='bold'>
              Add New Alternative Medicine
            </Typography>
          </Box>
          <IconButton onClick={() => setAddMedicinesDrawerOpen(false)}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>
        <Divider />

        {/* Drawer Content */}
        <Box
          p={4}
          sx={{
            flex: 1, // Allow content to grow and shrink
            overflowY: 'auto' // Enable scrolling for content if it overflows
          }}
        >
          <Card sx={{ p: 4 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box display='flex' flexDirection='column' gap={2}>
                {/* Map through alternatives */}
                {alternatives.map((alt, index) => (
                  <Box key={index} display='flex' flexDirection='column' gap={2}>
                    {/* Product Name */}
                    <FormControl fullWidth sx={{ mb: 4 }}>
                      <Controller
                        name={`alternatives[${index}].productName`}
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            {...field}
                            options={productOptions}
                            getOptionLabel={option => (typeof option === 'string' ? option : option?.label || '')}
                            value={productOptions.find(option => option.value === field.value) || null}
                            onChange={(_, selectedOption) => field.onChange(selectedOption?.value || '')}
                            renderInput={params => (
                              <TextField
                                {...params}
                                label='Product Name'
                                variant='outlined'
                                error={!!errors?.alternatives?.[index]?.productName}
                                helperText={errors?.alternatives?.[index]?.productName?.message}
                                fullWidth
                              />
                            )}
                          />
                        )}
                      />
                    </FormControl>

                    {/* Manufacturer Name */}
                    <FormControl fullWidth sx={{ mb: 4 }}>
                      <Controller
                        name={`alternatives[${index}].manufacturerName`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label='Manufacturer Name'
                            variant='outlined'
                            error={!!errors?.alternatives?.[index]?.manufacturerName}
                            helperText={errors?.alternatives?.[index]?.manufacturerName?.message}
                            fullWidth
                          />
                        )}
                      />
                    </FormControl>
                  </Box>
                ))}

                {/* Common Action Buttons */}
                <Box display='flex' justifyContent='flex-end' gap={2}>
                  {/* Delete Last Alternative */}
                  <Button
                    variant='text'
                    color='error'
                    onClick={handleDeleteLastAlternative}
                    disabled={alternatives.length <= 1}
                    startIcon={<Icon icon='mdi:delete' />}
                  >
                    Delete
                  </Button>

                  {/* Add Alternative */}
                  <Button variant='text' onClick={handleAddAlternative} startIcon={<Icon icon='mdi:plus' />}>
                    Add Alternative
                  </Button>
                </Box>
              </Box>
            </form>
          </Card>
        </Box>

        {/* Drawer Footer */}
        <Box
          sx={{
            p: 4,
            borderTop: '1px solid #ddd'
          }}
        >
          <Button
            type='submit'
            variant='contained'
            fullWidth
            onClick={handleSubmit(onSubmit)} // Ensure form submission is handled
          >
            Save
          </Button>
        </Box>
      </Drawer>
    </>
  )
}

export default Overview
