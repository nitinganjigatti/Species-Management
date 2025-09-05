import React, { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  Divider,
  Avatar,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  CardHeader,
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
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import ProductsChart from 'src/components/pharmacy/medicine/ProductsChart'
import StyleWithIconCardComponent from 'src/views/utility/style-with-icon-card'
import { useTheme } from '@emotion/react'
import { useRouter } from 'next/router'
import {
  getMedicineList,
  getProductAboutToExpireList,
  getProductExpiredBatchesList,
  getProductQuantityInStoresList
} from 'src/lib/api/pharmacy/getMedicineList'

// getAvailableMedicineByMedicineId
import { getAvailableMedicineByMedicineId } from 'src/lib/api/pharmacy/getRequestItemsList'
import FallbackSpinner from 'src/@core/components/spinner'
import Utility from 'src/utility'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import {
  addNewAlternativeMedicineProducts,
  editNewAlternativeMedicineProducts,
  getAlternativeMedicineProducts
} from 'src/lib/api/pharmacy/alternateMedicines'
import { debounce } from 'lodash'
import EditIcon from '@mui/icons-material/Edit'
import EditAlternativeMedicineDrawer from './EditAlternativeMedicineDrawer'
import AddAlternativeMedicineDrawer from './AddAlternativeMedicineDrawer'
import AlternativeMedicinesTabs from './AlternativeMedicinesTabs'
import toast from 'react-hot-toast'
import NoDataFound from 'src/views/utility/NoDataFound'

const addValidationSchema = yup.object().shape({
  alternatives: yup.array().of(
    yup.object().shape({
      productName: yup
        .object()
        .shape({
          label: yup.string().required('Product Name is required'),
          value: yup
            .string()
            .required('Product Name is required')
            .test('is-unique', 'Duplicate Product Name selected', function (value) {
              const { options, parent, path } = this

              if (!parent || !path) return true

              const allAlternatives = options?.from?.[2]?.value?.alternatives || []
              const currentIndex = Number(path.match(/\d+/)?.[0])

              const duplicates = allAlternatives.filter((item, idx) => {
                const isSameProduct = item?.productName?.value === value

                return isSameProduct && idx !== currentIndex // exclude the current field itself
              })

              const hasDuplicates = duplicates.length > 0

              return !hasDuplicates
            })
        })
        .required('Product Name is required'),
      manufacturerName: yup.string().min(3, 'Manufacturer Name is required').required('Manufacturer Name is required')
    })
  )
})

const editValidationSchema = yup.object().shape({
  productName: yup
    .object()
    .shape({
      label: yup.string().required('Product Name is required'),
      value: yup.string().required('Product Name is required')
    })
    .required('Product Name is required'),
  manufacturerName: yup.string().min(3, 'Manufacturer Name is required').required('Manufacturer Name is required')
})

const Overview = props => {
  const { productDetails, productDashboardData, purchaseData, dispatchData, tabValue, updateUrlParams } = props
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query
  const { selectedPharmacy } = usePharmacyContext()

  const limit = 10

  // const [productDashboardData, setProductDashboardData] = useState()
  // const [purchaseData, setPurchaseData] = useState({ dispatch_count: [], dispatch_value: [] })
  // const [dispatchData, setDispatchData] = useState({ dispatch_count: [], dispatch_value: [] })
  const [isAlternativeMedicinesDrawerOpen, setAlternativeMedicinesDrawerOpen] = useState(false)
  const [addMedicinesDrawerOpen, setAddMedicinesDrawerOpen] = useState(false)
  const [editMedicinesDrawerOpen, setEditMedicinesDrawerOpen] = useState(false)

  const [alternativeMedicinesList, setAlternativeMedicinesList] = useState({
    active: { list_items: [], total_count: 0, page: 1, hasMore: true },
    inactive: { list_items: [], total_count: 0, page: 1, hasMore: true }
  })
  const [optionsMedicineList, setOptionsMedicineList] = useState([])
  const [productLoading, setProductLoading] = useState(false)

  const searchMedicineData = useCallback(
    debounce(async searchText => {
      try {
        await fetchMedicineData(searchText)
      } catch (error) {
        console.error(error)
      }
    }, 500),
    []
  )

  const handleProductChange = (selectedOption, index) => {
    setValue(`alternatives[${index}].productName`, selectedOption)

    setValue(`alternatives[${index}].manufacturerName`, selectedOption?.manufacture || '')

    trigger(undefined, {
      shouldFocus: false,
      context: {
        alternatives: getValues('alternatives')
      }
    })
  }

  const handleEditProductChange = option => {
    if (option) {
      setValue('manufacturerName', option.manufacture || '')
      setValue('status', option.status == 1 ? 'active' : 'inactive')
    } else {
      setValue('manufacturerName', '')
      setValue('status', 'inactive')
    }
  }

  const fetchMedicineData = async searchText => {
    try {
      setProductLoading(true)

      const params = {
        sort: 'asc',
        q: searchText,
        limit: 20
      }

      const searchResults = await getMedicineList({ params: params })
      if (searchResults?.data?.list_items?.length > 0) {
        setOptionsMedicineList(
          searchResults?.data?.list_items
            ?.filter(item => item?.id !== id && item?.active === '1')
            ?.map(item => ({
              value: item.id,
              label: item.name,
              status: item?.active === '0' ? 0 : 1,
              control_substance: item.controlled_substance === '1' ? true : false,
              stock_type: item.stock_type,
              packageDetails: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
              manufacture: item?.manufacturer_name
            }))
        )
      }
    } catch (e) {
      console.error('error', e)
    } finally {
      setProductLoading(false)
    }
  }

  useEffect(() => {
    fetchMedicineData()
  }, [])

  useEffect(() => {
    if (router.query.tab !== tabValue) {
      updateUrlParams({
        tab: tabValue
      })
    }
  }, [tabValue, updateUrlParams])

  const getAlternativeMedicineList = async (tab = 'active', pageNum = 1) => {
    setIsLoading(true)
    try {
      const payload = {
        page: pageNum,
        limit,
        status: tab === 'active' ? 1 : 0
      }

      const response = await getAlternativeMedicineProducts(id, payload)

      if (response.success) {
        const newItems = response.data?.list_items || []
        const totalCount = response?.data?.total_count || 0

        setAlternativeMedicinesList(prev => {
          const prevTabData = prev[tab] || {}

          const updatedList = pageNum === 1 ? newItems : [...(prevTabData.list_items || []), ...newItems]

          const totalPages = Math.ceil(totalCount / limit)
          const hasMore = pageNum < totalPages

          return {
            ...prev,
            [tab]: {
              list_items: updatedList,
              total_count: totalCount,
              page: pageNum,
              hasMore
            }
          }
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      getAlternativeMedicineList('active', 1)
      getAlternativeMedicineList('inactive', 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

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
              <Box>
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
              </Box>
            </Box>

            {/* Table Section */}
            <Card sx={{ p: 4 }}>
              <Typography
                variant='subtitle1'
                sx={{
                  marginBottom: 2,
                  color: 'customColors.customHeadingTextColor',
                  fontWeight: 500,
                  fontSize: '14px'
                }}
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
                          {data?.local?.map(store => (
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

  const BatchQuantitiesContent = ({ data, isLoading }) => (
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
              <TableHead>
                <TableRow>
                  <TableCell sx={{ p: '6px' }}>BATCH ID</TableCell>
                  <TableCell sx={{ p: '6px' }}>EXPIRY DATE</TableCell>
                  <TableCell sx={{ p: '6px' }}>QUANTITY</TableCell>
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
      name: 'batchQuantities',
      title: 'Batch Details',
      style: 'customColors.Background',
      bgColor: theme.palette.customColors.neutral05,
      icon: '/images/batchIcon.svg',
      value: productDashboardData?.batch_count,
      description: 'Batch Details',
      totalBatches: productDashboardData?.batch_count

      // totalQuantity: totalValue?.totalQuantity
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
    ...(productDetails?.stock_type !== 'non_medical'
      ? [
          {
            name: 'expiredBatches',
            title: 'Expired Batches',
            style: 'customColors.Background',
            bgColor: theme => alpha(theme.palette.customColors.Error, 0.1),
            icon: '/images/Incubator_ICON.svg',
            value: productDashboardData?.expired,
            description: 'Expired Quantity',
            totalBatches: totalValue?.totalBatches,
            totalValue: totalValue?.totalValue
          }
        ]
      : [])
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

      if (name === 'aboutToExpire') {
        result = await getProductAboutToExpireList(id)
      } else if (name === 'expiredBatches') {
        result = await getProductExpiredBatchesList(id)
      } else if (name === 'quantityInStores') {
        result = await getProductQuantityInStoresList(id)
      } else if (name === 'batchQuantities') {
        result = await getAvailableMedicineByMedicineId(id)
      }
      if (result?.success && result?.data) {
        setIsLoading(false)

        // setDrawerDataArray(result?.data)
        if (name === 'batchQuantities') {
          setDrawerDataArray(result?.data.items)
        } else if (name === 'quantityInStores') {
          setDrawerDataArray(result?.data)

          const allStores = [...(result?.data?.central || []), ...(result?.data?.local || [])]

          const totalQuantity = allStores.reduce((sum, store) => sum + Number(store.total_qty), 0)
          const totalStores = allStores.length

          setTotalValue({
            totalQuantity,
            totalStores,
            totalBatches: 0,
            totalValue: 0
          })
        } else {
          setDrawerDataArray(result?.data)

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
      } else {
        setIsLoading(false)
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
      return (
        productDetails?.stock_type !== 'non_medical' && (
          <ExpiredBatchesContent data={drawerDataArray} isLoading={isLoading} />
        )
      )
    }

    if (activeDrawer === 'batchQuantities') {
      return <BatchQuantitiesContent data={drawerDataArray} isLoading={isLoading} />
    }

    return null
  }

  const handleAddAlternativeMedicine = () => {
    reset(addDefaultValues)
    setAddMedicinesDrawerOpen(true)
  }

  const addDefaultValues = {
    alternatives: [{ productName: {}, manufacturerName: '' }]
  }

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    getValues,
    reset,
    setError,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(editMedicinesDrawerOpen ? editValidationSchema : addValidationSchema),
    defaultValues: addDefaultValues
  })

  const alternatives = watch('alternatives')

  const handleAddAlternative = () => {
    setValue('alternatives', [...alternatives, { productName: { value: '', label: '' }, manufacturerName: '' }])
  }

  const handleDeleteLastAlternative = () => {
    if (alternatives.length > 1) {
      setValue('alternatives', alternatives.slice(0, -1))
    }
  }

  const onSubmit = async data => {
    try {
      const body = data?.alternatives?.map(item => ({
        stock_item_id: id,
        alternate_stock_item_id: item?.productName?.value,
        status: item?.productName?.status
      }))

      const response = await addNewAlternativeMedicineProducts(JSON.stringify(body))
      if (response.success) {
        toast.success(response?.message)
        await getAlternativeMedicineList('active', 1)
        setAddMedicinesDrawerOpen(false)
        reset()
      } else if (response.errors?.length) {
        response.errors.forEach(error => {
          const errorIndex = error.index

          if (typeof errorIndex === 'number' && error.exists) {
            setError(`alternatives.${errorIndex}.productName`, {
              type: 'manual',
              message: error.exists
            })
          }
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const onEditAlternativeMedicineSubmit = async data => {
    try {
      const body = {
        stock_item_id: +id,
        alternate_stock_item_id: +data?.productName?.value,
        status: data.status === 'active' ? 1 : 0
      }

      const response = await editNewAlternativeMedicineProducts(+data?.id, JSON.stringify(body))
      if (response.success) {
        toast.success(response?.message)

        await getAlternativeMedicineList('active', 1)
        await getAlternativeMedicineList('inactive', 1)
        setEditMedicinesDrawerOpen(false)
        reset()
      } else if (response.errors?.length) {
        response.errors.forEach(error => {
          const errorIndex = error.index

          if (typeof errorIndex === 'number' && error.exists) {
            setError(`productName`, {
              type: 'manual',
              message: error.exists
            })
          }
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleEditAlternativeMedicine = medicine => {
    const defaultValues = {
      productName: { ...medicine, value: medicine.alternate_stock_item_id || '', label: medicine.stock_name } || {
        value: '',
        label: ''
      },
      manufacturerName: medicine.manufacturer_name || '',
      status: medicine.status == 1 ? 'active' : 'inactive',
      id: medicine.id
    }

    reset(defaultValues)
    setEditMedicinesDrawerOpen(true)
  }

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

  return (
    <>
      <Grid
        container
        spacing={2}
        sx={{
          pt: 5,
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        {drawerData.map(card => (
          <Grid
            key={card.name}
            item
            size={{
              xs: 6,
              md: productDetails?.stock_type !== 'non_medical' ? 6 : 4,
              sm: 6,
              lg: productDetails?.stock_type !== 'non_medical' ? 3 : 4
            }}
          >
            <StyleWithIconCardComponent
              key={card.name}
              value={card.value}
              description={card.description}
              icon={card.icon}
              bgColor={card.bgColor}
              onClick={() => openDrawer(card.name)}
              showIcon={true}
            />
          </Grid>
        ))}
      </Grid>
      <Divider sx={{ my: 5 }} />
      <Grid container spacing={4} sx={{ display: 'flex', alignItems: 'stretch' }}>
        <Grid item size={{ xs: 12, md: 6 }} sx={{ flexDirection: 'column' }}>
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

        <Grid item size={{ xs: 12, md: 6 }} sx={{ flexDirection: 'column' }}>
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

        <Grid item size={{ xs: 12, md: 6 }} sx={{ flexDirection: 'column' }}>
          <Card sx={{ height: '100%', width: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box
                  sx={{
                    color: 'customColors.customHeadingTextColor',
                    fontSize: '16px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
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
                      style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 'bold' }}
                    />
                  </Box>
                  Alternative Medicines{' '}
                  {alternativeMedicinesList?.active?.total_count
                    ? `(${alternativeMedicinesList?.active?.total_count})`
                    : null}
                </Box>

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

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                {isLoading && !alternativeMedicinesList?.active?.list_items?.length ? (
                  <Typography
                    style={{
                      fontWeight: 400,
                      fontSize: '0.875rem',
                      color: 'customColors.OnPrimaryContainer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                    sx={{
                      color: 'primary.light'
                    }}
                  >
                    <CircularProgress />
                  </Typography>
                ) : alternativeMedicinesList?.active?.list_items?.length > 0 ? (
                  <>
                    <List>
                      {alternativeMedicinesList?.active?.list_items?.slice(0, 5)?.map((medicine, index) => (
                        <ListItem sx={{ display: 'flex', justifyContent: 'space-between' }} key={index} disableGutters>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography sx={{ color: 'primary.dark', fontWeight: 500, fontSize: '14px' }}>
                              {medicine.stock_name}
                            </Typography>
                            <Typography
                              component='span'
                              sx={{ color: 'customColors.neutralSecondary', fontWeight: 400, fontSize: '12px' }}
                            >
                              {medicine.manufacturer_name}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                              cursor: 'pointer',
                              ':hover': { color: 'primary.main' }
                            }}
                            onClick={() => handleEditAlternativeMedicine(medicine)}
                          >
                            <EditIcon />
                          </Box>
                        </ListItem>
                      ))}
                    </List>

                    {alternativeMedicinesList?.active?.total_count > 5 && (
                      <Box>
                        <Button
                          variant='text'
                          sx={{ color: 'primary.main', cursor: 'pointer', textTransform: 'none', fontSize: '13px' }}
                          onClick={() => setAlternativeMedicinesDrawerOpen(true)}
                        >
                          +{alternativeMedicinesList?.active?.total_count - 5} More
                        </Button>
                      </Box>
                    )}
                  </>
                ) : (
                  <NoDataFound variant='Seal' height={200} width={200} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item size={{ xs: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Card sx={{ height: '100%', width: '100%' }}>
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
          title={activeDrawerData?.title}
          totalStores={activeDrawerData?.totalStores}
          totalQuantity={activeDrawerData?.totalQuantity}
          totalBatches={activeDrawerData?.totalBatches}
          totalValue={activeDrawerData?.totalValue}
          drawerStatus={Boolean(activeDrawer)}
          close={closeDrawer}
          contentComponent={renderDrawerContent()}
          style={activeDrawerData?.style}
          width={700}
        />
      )}
      <CommonDrawerBox
        imageUrl={productDetails?.image}
        title={productDetails?.name}
        drawerStatus={isAlternativeMedicinesDrawerOpen}
        close={() => setAlternativeMedicinesDrawerOpen(false)}
        contentComponent={
          <AlternativeMedicinesTabs
            data={alternativeMedicinesList}
            isLoading={isLoading}
            onLoadMore={tab => getAlternativeMedicineList(tab, alternativeMedicinesList[tab].page + 1)}
            onEdit={handleEditAlternativeMedicine}
          />
        }
        style='customColors.Background'
      />
      {addMedicinesDrawerOpen && (
        <AddAlternativeMedicineDrawer
          open={addMedicinesDrawerOpen}
          onClose={() => setAddMedicinesDrawerOpen(false)}
          onSubmit={onSubmit}
          handleSubmit={handleSubmit}
          control={control}
          errors={errors}
          alternatives={alternatives}
          handleProductChange={handleProductChange}
          handleAddAlternative={handleAddAlternative}
          handleDeleteLastAlternative={handleDeleteLastAlternative}
          optionsMedicineList={optionsMedicineList}
          productLoading={productLoading}
          searchMedicineData={searchMedicineData}
        />
      )}
      {editMedicinesDrawerOpen && (
        <EditAlternativeMedicineDrawer
          open={editMedicinesDrawerOpen}
          onClose={() => setEditMedicinesDrawerOpen(false)}
          onSubmit={onEditAlternativeMedicineSubmit}
          handleSubmit={handleSubmit}
          control={control}
          errors={errors}
          handleProductChange={handleEditProductChange}
          optionsMedicineList={optionsMedicineList}
          productLoading={productLoading}
          searchMedicineData={searchMedicineData}
        />
      )}
    </>
  )
}

export default React.memo(Overview)
