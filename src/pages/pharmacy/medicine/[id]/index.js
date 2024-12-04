import React, { useEffect, useState } from 'react'
import { Box, Typography, Button, Grid, Avatar, Chip, Card, CardHeader } from '@mui/material'
import Icon from 'src/@core/components/icon'
import Router from 'next/router'
import { useRouter } from 'next/router'

import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { getMedicineById } from 'src/lib/api/pharmacy/getMedicineList'
import FallbackSpinner from 'src/@core/components/spinner'
import Overview from 'src/views/pages/pharmacy/product/product-details-list/over-view'
import Purchase from 'src/views/pages/pharmacy/product/product-details-list/purchase'
import Dispatch from 'src/views/pages/pharmacy/product/product-details-list/dispatch'
import Ledger from 'src/views/pages/pharmacy/product/product-details-list/ledger'

const TabsSimple = () => {
  const [value, setValue] = useState('overview')

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  return (
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
        <Overview />
      </TabPanel>
      <TabPanel value='purchase'>
        <Purchase />
      </TabPanel>
      <TabPanel value='dispatch'>
        <Dispatch />
      </TabPanel>
      <TabPanel value='ledger'>
        <Ledger />
      </TabPanel>
    </TabContext>
  )
}

const ProductDetailsList = () => {
  const router = useRouter()
  const { id, action } = router.query
  const { selectedPharmacy } = usePharmacyContext()
  const [uploadedImage, setUploadedImage] = useState()
  const [loader, setLoader] = useState(false)
  const [productDetails, setProductDetails] = useState([])

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

  console.log(productDetails, 'details')

  //   {
  //     "id": "5488",
  //     "name": " Avian Influenza Virus H5 Subtype Vaccine",
  //     "generic_name": "Reassortant Avian Influenza Virus H5 Inactivated Vaccine  250 ml",
  //     "generic_id": "1603",
  //     "zoo_id": "11",
  //     "stock_type": "allopathy",
  //     "manufacturer": "7824",
  //     "manufacturer_name": "Mankind",
  //     "package_type": "2",
  //     "package": "Bottle",
  //     "package_qty": "20.000",
  //     "package_uom": "2",
  //     "package_uom_label": "ml",
  //     "product_form": "175",
  //     "product_form_label": "vaccine",
  //     "drug_class": null,
  //     "drug_class_label": null,
  //     "gst_slab": null,
  //     "gst_value": null,
  //     "storage": null,
  //     "storage_value": null,
  //     "prescription_required": "0",
  //     "controlled_substance": "0",
  //     "url": null,
  //     "part_out_of_stock": "0",
  //     "side_effects": null,
  //     "uses": null,
  //     "safety_advice": null,
  //     "active": "1",
  //     "created_at": "2024-04-22 10:56:44",
  //     "image": null,
  //     "created_by": "58",
  //     "salts": null
  // }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Card sx={{ p: 6, mb: 4 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} mb={6}>
                <CardHeader
                  sx={{ p: 0, m: 0 }}
                  avatar={<Icon icon='ep:back' style={{ cursor: 'pointer' }} onClick={() => Router.back()} />}
                  action={
                    <Button
                      variant='contained'
                      startIcon={<Icon icon='material-symbols:edit-outline' />}
                      onClick={handleEdit}
                    >
                      Edit
                    </Button>
                  }
                />
              </Grid>
            </Grid>

            <Grid container spacing={4}>
              {/* Image Section */}
              <Grid item xs={12} sm={3} mb={6}>
                <Avatar
                  variant='square'
                  src={uploadedImage}
                  alt='Medicine Image'
                  sx={{ width: 'auto', height: 180, borderRadius: 2 }}
                />
              </Grid>

              {/* Details Section */}
              <Grid item xs={12} sm={9}>
                <Grid container spacing={4} mb={6}>
                  <Grid item xs={7}>
                    <Box>
                      <Typography sx={{ color: 'secondary.dark', fontWeight: 500, fontSize: '20px' }}>
                        {productDetails?.name}
                      </Typography>
                      <Typography variant='body2' component='div' color='text.secondary'>
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
                          {productDetails?.generic_name}
                        </Box>
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{ color: 'customColors.customHeadingTextColor', fontWeight: 400, fontSize: '14px' }}
                        mt={0.5}
                      >
                        Composition - {productDetails?.salts || 'NA'}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Package Options */}
                  <Grid item xs={12} sm={5}>
                    <Box>
                      <Typography variant='body2' mt={2} component='div'>
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
                          (Strips)
                        </Box>
                      </Typography>
                      <Box mt={1} display='flex' gap={1} flexWrap='wrap'>
                        {['10 Tablets', '15 Tablets', '20 Tablets'].map(option => (
                          <Chip
                            key={option}
                            label={option}
                            variant='outlined'
                            clickable
                            sx={{
                              '&.MuiChip-outlined': {
                                borderColor: '#006D3566',
                                backgroundColor: 'customColors.tableHeaderBg'
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
                    <Grid item xs={12} sm={4}>
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
                    <Grid item xs={12} sm={4}>
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
                        {productDetails?.drug_class || 'NA'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
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
                        {productDetails?.storage || 'NA'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Card>
          <Card sx={{ p: 6 }}>
            <TabsSimple />
          </Card>
        </>
      )}
    </>
  )
}

export default ProductDetailsList
