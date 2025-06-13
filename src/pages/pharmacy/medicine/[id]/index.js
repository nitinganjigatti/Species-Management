import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Grid,
  Avatar,
  Chip,
  Card,
  CardHeader,
  Drawer,
  IconButton,
  TextField,
  List,
  ListItem,
  Checkbox,
  ListItemText,
  debounce,
  InputAdornment,
  CircularProgress,
  alpha
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import Router from 'next/router'
import { useRouter } from 'next/router'

import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import {
  getMedicineById,
  getProductDashboardList,
  getProductMonthWiseDispatchList,
  getProductMonthWisePurchaseList
} from 'src/lib/api/pharmacy/getMedicineList'
import FallbackSpinner from 'src/@core/components/spinner'
import Overview from 'src/views/pages/pharmacy/product/product-details-list/over-view'
import Purchase from 'src/views/pages/pharmacy/product/product-details-list/purchase'
import Dispatch from 'src/views/pages/pharmacy/product/product-details-list/dispatch'
import Ledger from 'src/views/pages/pharmacy/product/product-details-list/ledger'
import { getVariantFOrProduct, getVariants, mapVariantForProduct } from 'src/lib/api/pharmacy/variant'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import { useTheme } from '@emotion/react'
import Error404 from 'src/pages/404'

const ProductDetailsList = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id, action, tab } = router.query

  const { selectedPharmacy } = usePharmacyContext()
  const [uploadedImage, setUploadedImage] = useState()
  const [loader, setLoader] = useState(false)
  const [productDetails, setProductDetails] = useState()
  const [variantProductList, setVariantProductList] = useState([])
  const [listAllVariant, setListAllVariant] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [mainLoader, setMainLoader] = useState(false)

  const defaultTab = 'overview'
  const [value, setValue] = React.useState(tab || defaultTab)

  const updateUrlParams = useCallback(
    params => {
      const query = { ...router.query, ...params }
      router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
    },
    [router.query.tab] // Only depend on router.query
  )

  const handleChange = (event, newValue) => {
    setValue(newValue)

    // updateUrlParams({ tab: newValue })
  }

  const handleEdit = async row => {
    if (
      selectedPharmacy.type === 'central' &&
      (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD')
    ) {
      Router.push({
        pathname: '/pharmacy/medicine/add-product',
        query: { id: id, action: 'edit' }
      })
    }
  }

  const getMedicine = async id => {
    setLoader(true)
    try {
      const response = await getMedicineById(id)
      if (response.success) {
        console.log(response, 'res123')
        setProductDetails(response?.data)
        setUploadedImage(response?.data?.image ? response?.data?.image : '/images/tablet.png')
      }
      setLoader(false)
    } catch (e) {
      console.log(e)
      setLoader(false)
    }
  }

  useEffect(() => {
    if (id != undefined) {
      getMedicine(id)
    }
  }, [id, action])

  const getVariantProductList = async id => {
    setLoader(true)
    try {
      const response = await getVariantFOrProduct(id)
      if (response.success) {
        setVariantProductList(response?.data)
        console.log(response?.data, 'Variant')
      }
      setLoader(false)
    } catch (e) {
      console.log(e)
      setLoader(false)
    }
  }

  useEffect(() => {
    if (id != undefined) {
      getVariantProductList(id)
    }
  }, [id])

  const getAllVariantList = async (query = '') => {
    setMainLoader(true)
    const params = query ? { q: query } : {}
    try {
      const response = await getVariants({ params })
      if (response.success) {
        setListAllVariant(response?.data?.list_items)
      }
      setMainLoader(false)
    } catch (e) {
      console.log(e)
      setMainLoader(false)
    }
  }

  const searchVariant = useCallback(
    debounce(async searchText => {
      try {
        await getAllVariantList(searchText)
      } catch (error) {
        console.error(error)
      }
    }, 1000), // 1000ms delay
    []
  )

  const handleSearchChange = event => {
    const query = event.target.value
    setSearchQuery(query)
    searchVariant(query) // Trigger debounced function
  }

  useEffect(() => {
    getAllVariantList()
  }, [])

  console.log(productDetails, 'details')

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedVariants, setSelectedVariants] = useState([])

  const handleDrawerOpen = () => setIsDrawerOpen(true)
  const handleDrawerClose = () => setIsDrawerOpen(false)

  // const handleToggle = id => {
  //   setCheckedItems(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]))
  // }

  const handleToggle = variant => {
    setSelectedVariants(prev => {
      if (prev.some(item => item.id === variant.id)) {
        // If the variant is already selected, remove it
        return prev.filter(item => item.id !== variant.id)
      } else {
        // Otherwise, add it
        return [...prev, variant]
      }
    })
  }

  const handleAddVariants = async () => {
    setLoader(true)
    try {
      const payload = {
        stock_item_id: productDetails?.id,
        variant: selectedVariants.map(variant => ({
          id: variant?.id,
          is_default: variant?.is_default || 0
        }))
      }

      const response = await mapVariantForProduct(payload)
      if (response.success) {
        handleDrawerClose()
        setSelectedVariants([])
        await getVariantProductList(productDetails?.id)
        console.log('Variants added successfully:', response)
      } else {
        console.error('Failed to add variants:', response.message)
        handleDrawerClose()
        setSelectedVariants([])
      }
      setLoader(false)
    } catch (e) {
      console.log('Error while adding variants:', e)
      setLoader(false)
    }
  }

  // const filteredListAllVariant = listAllVariant?.filter(
  //   variant => !variantProductList.some(item => item.variant_id === variant.id)
  // )
  const filteredListAllVariant = listAllVariant?.filter(
    variant => variant.active !== '0' && !variantProductList.some(item => item.variant_id === variant.id)
  )

  // console.log(listAllVariant, 'listAllVariant')
  // console.log(variantProductList, 'variantProductList')
  // console.log(filteredListAllVariant, 'filteredListAllVariant')

  const [productDashboardData, setProductDashboardData] = useState()
  const [purchaseData, setPurchaseData] = useState({ purchase_count: [], purchase_value: [] })
  const [dispatchData, setDispatchData] = useState({ dispatch_count: [], dispatch_value: [] })

  const productDashboardList = async id => {
    try {
      const response = await getProductDashboardList(id)
      if (response.success) {
        console.log(response?.data, 'productDashboardList')
        setProductDashboardData(response?.data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchPurchaseData = async id => {
    try {
      const result = await getProductMonthWisePurchaseList(id)
      if (result?.success === true && result?.data) {
        // console.log(result.data, 'purchase')

        const adjustedData = {
          purchase_count: result.data.purchase_count,
          purchase_value: result.data.purchase_value
        }
        setPurchaseData(result.data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const fetchDispatchData = async id => {
    try {
      const result = await getProductMonthWiseDispatchList(id)
      if (result?.success === true && result?.data) {
        // console.log(result.data, 'dispatch')

        const adjustedData = {
          dispatch_count: result.data.dispatch_count,
          dispatch_value: result.data.dispatch_value
        }
        setDispatchData(result.data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (id != undefined) {
      productDashboardList(id)
      fetchPurchaseData(id)
      fetchDispatchData(id)
    }
  }, [id])

  return (
    <>
      {selectedPharmacy.type === 'central' ? (
        <>
          {loader ? (
            <FallbackSpinner />
          ) : (
            <>
              <Card sx={{ p: 6, mb: 4 }}>
                <Grid container spacing={2}>
                  <Grid
                    item
                    size={{ xs: 12 }}
                    sx={{
                      mb: 6
                    }}
                  >
                    <CardHeader
                      sx={{ p: 0, m: 0 }}
                      avatar={
                        <Icon
                          icon='ep:back'
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            router.back()
                          }}
                        />
                      }
                      action={
                        <>
                          {selectedPharmacy.type === 'central' &&
                            (selectedPharmacy.permission.key === 'allow_full_access' ||
                              selectedPharmacy.permission.key === 'ADD') && (
                              <Button
                                variant='contained'
                                startIcon={<Icon icon='material-symbols:edit-outline' />}
                                onClick={handleEdit}
                              >
                                Edit
                              </Button>
                            )}
                        </>
                      }
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={4}>
                  {/* Image Section */}
                  <Grid
                    item
                    size={{ xs: 12, sm: 3 }}
                    sx={{
                      mb: 6
                    }}
                  >
                    <Avatar
                      variant='square'
                      src={uploadedImage}
                      alt='Medicine Image'
                      sx={{
                        objectFit: 'contain',
                        width: 'auto',
                        height: 'auto',
                        maxHeight: 200,
                        borderRadius: 2
                      }}
                    />
                  </Grid>

                  {/* Details Section */}
                  <Grid item size={{ xs: 12, sm: 9 }}>
                    <Grid
                      container
                      spacing={4}
                      sx={{
                        mb: 6
                      }}
                    >
                      <Grid item size={{ xs: 6 }}>
                        <Box>
                          <Typography sx={{ color: 'secondary.dark', fontWeight: 500, fontSize: '20px' }}>
                            {productDetails?.name}
                          </Typography>
                          <Typography
                            variant='body2'
                            component='div'
                            sx={{
                              color: 'text.secondary'
                            }}
                          >
                            <Box
                              component='span'
                              sx={{ color: 'customColors.neutralSecondary', fontWeight: 400, fontSize: '14px' }}
                            >
                              Generic Name
                            </Box>{' '}
                            -{' '}
                            <Box
                              component='span'
                              sx={{ color: 'customColors.customHeadingTextColor', fontWeight: 500, fontSize: '14px' }}
                            >
                              {productDetails?.generic_name || 'NA'}
                            </Box>
                          </Typography>
                          <Typography
                            variant='body2'
                            sx={{
                              mt: 0.5,
                              color: 'customColors.customHeadingTextColor',
                              fontWeight: 400,
                              fontSize: '14px'
                            }}
                          >
                            Composition -{' '}
                            {productDetails?.salts && productDetails?.salts?.length > 0
                              ? productDetails?.salts?.map((salt, index) => (
                                  <span key={salt?.id}>
                                    {salt?.label} {salt?.qty}
                                    {index < productDetails?.salts?.length - 1 && ', '}
                                  </span>
                                ))
                              : 'NA'}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Package Options */}
                      <Grid item size={{ xs: 12, sm: 6 }}>
                        <Box>
                          {/* Row with Available Packages and Add Variant Button */}
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mb: 2
                            }}
                          >
                            <Typography variant='body2' component='div'>
                              <Box
                                component='span'
                                sx={{
                                  color: 'customColors.neutralSecondary',
                                  fontWeight: 400,
                                  fontSize: '14px'
                                }}
                              >
                                Available Packages:
                              </Box>{' '}
                              <Box
                                component='span'
                                sx={{
                                  color: 'primary.light',
                                  fontWeight: 500,
                                  fontSize: '14px'
                                }}
                              >
                                ({productDetails?.package}) of
                              </Box>
                            </Typography>
                            {selectedPharmacy.type === 'central' &&
                              (selectedPharmacy.permission.key === 'allow_full_access' ||
                                selectedPharmacy.permission.key === 'ADD') && (
                                <Button
                                  variant='outlined'
                                  color='primary'
                                  onClick={handleDrawerOpen}
                                  sx={{
                                    ml: 1
                                  }}
                                  size='small'
                                >
                                  Add Variant
                                </Button>
                              )}
                          </Box>
                          {/* Chips for Variant List */}
                          <Box
                            sx={{
                              mt: 1,
                              display: 'flex',
                              gap: 1,
                              flexWrap: 'wrap'
                            }}
                          >
                            {variantProductList.map((option, inx) => (
                              <Chip
                                key={option?.id}
                                label={`${option?.unit_multiplier}  ${productDetails?.product_form_label}`}
                                variant='outlined'
                                clickable
                                sx={{
                                  '&.MuiChip-outlined': {
                                    // borderColor: '#006D3566',
                                    borderColor: theme => alpha(theme.palette.primary.OnSurface, 0.4),
                                    backgroundColor: 'customColors.displaybgPrimary'
                                  },
                                  marginBottom: '8px'
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Additional Info */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        bgcolor: 'customColors.tableHeaderBg',
                        p: 3,
                        borderRadius: '8px'
                      }}
                    >
                      <Grid container spacing={2}>
                        <Grid item size={{ xs: 12, sm: 4 }}>
                          <Typography
                            variant='caption'
                            sx={{ color: 'customColors.neutralSecondary', fontWeight: 400, fontSize: '14px' }}
                          >
                            Manufacturer
                          </Typography>
                          <Typography
                            variant='body2'
                            sx={{ color: 'customColors.customHeadingTextColor', fontWeight: 500, fontSize: '14px' }}
                          >
                            {productDetails?.manufacturer_name}
                          </Typography>
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 4 }}>
                          <Typography
                            variant='caption'
                            sx={{ color: 'customColors.neutralSecondary', fontWeight: 400, fontSize: '14px' }}
                          >
                            Drugs Class
                          </Typography>
                          <Typography
                            variant='body2'
                            sx={{ color: 'customColors.customHeadingTextColor', fontWeight: 500, fontSize: '14px' }}
                          >
                            {/* Non-steroidal anti-inflammatory */}
                            {productDetails?.drug_class_label || 'NA'}
                          </Typography>
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 4 }}>
                          <Typography
                            variant='caption'
                            sx={{ color: 'customColors.neutralSecondary', fontWeight: 400, fontSize: '14px' }}
                          >
                            Storage
                          </Typography>
                          <Typography
                            variant='body2'
                            sx={{ color: 'customColors.customHeadingTextColor', fontWeight: 500, fontSize: '14px' }}
                          >
                            {/* Below 25°C */}
                            {productDetails?.storage_value || 'NA'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              </Card>
              <Card sx={{ p: 6 }}>
                {/* <TabsSimple productDetails={productDetails} /> */}
                <TabContext value={value}>
                  <TabList
                    onChange={handleChange}
                    sx={{
                      '& .MuiTabs-flexContainer': {
                        borderBottom: '1px solid',
                        borderColor: 'customColors.neutral05'
                      }
                    }}
                  >
                    <Tab value='overview' label='Overview' />
                    <Tab value='purchase' label='Purchase' />
                    <Tab value='dispatch' label='Dispatch' />
                    <Tab value='ledger' label='Ledger' />
                  </TabList>
                  <TabPanel value='overview' sx={{ p: 0 }}>
                    <Overview
                      productDetails={productDetails}
                      tabValue={value}
                      productDashboardData={productDashboardData}
                      purchaseData={purchaseData}
                      dispatchData={dispatchData}
                      updateUrlParams={updateUrlParams}
                    />
                  </TabPanel>
                  <TabPanel value='purchase' sx={{ p: 0 }}>
                    <Purchase tabValue={value} updateUrlParams={updateUrlParams} />
                  </TabPanel>
                  <TabPanel value='dispatch' sx={{ p: 0 }}>
                    <Dispatch tabValue={value} updateUrlParams={updateUrlParams} />
                  </TabPanel>
                  <TabPanel value='ledger' sx={{ p: 0 }}>
                    <Ledger tabValue={value} updateUrlParams={updateUrlParams} />
                  </TabPanel>
                </TabContext>
              </Card>
            </>
          )}
          <Drawer
            anchor='right'
            open={isDrawerOpen}
            onClose={handleDrawerClose}
            slotProps={{
              paper: {
                sx: {
                  width: 460,
                  backgroundColor: '#F5F9F6',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }
              }
            }}
          >
            {/* Sticky Header */}
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                backgroundColor: '#F5F9F6',
                px: 4,
                py: 2
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Typography variant='h6'>Select Variants</Typography>
                <IconButton onClick={handleDrawerClose}>
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={{ mt: 4 }}>
                <TextField
                  fullWidth
                  variant='outlined'
                  size='small'
                  placeholder='Search Variants...'
                  value={searchQuery}
                  onChange={handleSearchChange}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position='start'>
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Box>
            </Box>
            {/* Scrollable Content */}
            <Box sx={{ p: 4, overflowY: 'auto', height: 'calc(100vh - 80px)' }}>
              <Card sx={{ p: 4 }}>
                {mainLoader ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
                    <CircularProgress />
                  </Box>
                ) : filteredListAllVariant.length > 0 ? (
                  <List>
                    {filteredListAllVariant.map(variant => (
                      <ListItem
                        key={variant.id}
                        disablePadding
                        sx={{
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          marginBottom: '8px',
                          px: 4
                        }}
                      >
                        <Checkbox
                          edge='start'
                          checked={selectedVariants.some(item => item.id === variant.id)}
                          tabIndex={-1}
                          disableRipple
                          onChange={() => handleToggle(variant)}
                        />
                        <ListItemText
                          primary={`Unit Multiplier: ${variant.unit_multiplier}`}
                          secondary={`${variant.description}` ? `Description: ${variant.description}` : null}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', m: 4 }}>
                    <Typography
                      variant='body2'
                      sx={{
                        color: 'text.secondary'
                      }}
                    >
                      No data found
                    </Typography>
                  </Box>
                )}
              </Card>
            </Box>
            <Box
              sx={{
                position: 'sticky',
                bottom: 0,
                zIndex: 1,
                px: 4,
                py: 4,
                boxShadow: '0px -1px 5px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Button
                variant='contained'
                color='primary'
                fullWidth
                onClick={handleAddVariants}
                sx={{
                  textTransform: 'capitalize'
                }}
                disabled={selectedVariants.length === 0}
              >
                Add Variant
              </Button>
            </Box>
          </Drawer>
        </>
      ) : (
        <Error404></Error404>
      )}
    </>
  )
}

export default ProductDetailsList
