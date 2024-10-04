import { Button, Card, CardContent, CardHeader, Grid, TextField, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { Box } from '@mui/system'
import { useRouter } from 'next/router'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import { addNonExistingProductStatus } from 'src/lib/api/pharmacy/newMedicine'
import toast from 'react-hot-toast'
import { LoadingButton } from '@mui/lab'
import NewProductList from 'src/pages/pharmacy/new-product-request'

export const ProductDetail = ({
  setShow,
  detailsData,
  prescriptionImages,
  productDetails,
  submitLoader,
  handleRequestStatus,
  statusCall,
  savedText,
  setReasonText,
  reasonText
}) => {
  console.log('product data????', productDetails, reasonText)

  const { selectedPharmacy } = usePharmacyContext()
  const [visibleArea, setVisibleArea] = useState(false)

  const router = useRouter()

  // useEffect(() => {
  //   if (statusCall) {
  //     ;<NewProductList />
  //   }
  // }, [statusCall])

  // const handlePopup = () => {
  //   ;() => {
  //     setStatusCall(prev => !prev)
  //   }
  // }

  return (
    <Grid sx={{ cursor: 'pointer' }}>
      {detailsData?.map((item, index) => {
        return (
          <div key={index}>
            <Grid container spacing={6} sx={{ mb: '30px' }} xs={12}>
              {selectedPharmacy.type === 'central' && (
                <Grid item xs={6}>
                  <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                    From Store
                  </Typography>
                  {productDetails?.to_store_name}
                </Grid>
              )}
              <Grid item xs={6}>
                <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                  Product Type
                </Typography>
                <Typography variant='body2'>
                  {item.product_type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                  Product Name
                </Typography>
                <Typography variant='body2'>{item.product_name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                  Generic Name
                </Typography>
                <Typography variant='body2'>{item.generic_name ? item.generic_name : 'NA'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                  Quantity
                </Typography>
                <Typography variant='body2'>{item.quantity}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                  Priority
                </Typography>
                {item?.priority}
              </Grid>
              {productDetails?.status !== 'Pending' && (
                <Grid item xs={6} key={statusCall}>
                  <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                    Status
                  </Typography>
                  <Typography variant='body2'>{productDetails?.status}</Typography>
                </Grid>
              )}
              {item?.product_image && (
                <Grid item xs={6}>
                  <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                    Product Image
                  </Typography>

                  <a href={`${item?.product_image}`} target='_blank'>
                    <img
                      alt='Product Image'
                      style={{ borderRadius: '10px' }}
                      width='50px'
                      height='50px'
                      src={`${item?.product_image}`}
                    />
                  </a>
                </Grid>
              )}

              {prescriptionImages && (
                <Grid item xs={12}>
                  <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                    Prescription Images
                  </Typography>

                  <Grid item xs={6} sx={{ display: 'flex', flexDirection: 'row' }}>
                    {prescriptionImages &&
                      prescriptionImages?.map((item, index) => {
                        return (
                          <Box key={index}>
                            <Grid>
                              <a href={`${item}`} target='_blank'>
                                <img
                                  alt='Prescription Image'
                                  style={{ width: '50px', height: '50px', borderRadius: '10px', margin: '10px' }}
                                  src={`${item}`}
                                />
                              </a>
                            </Grid>
                          </Box>
                        )
                      })}
                  </Grid>
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                  Comments
                </Typography>
                <Typography sx={{ m: '2px' }} variant='body2'>
                  {productDetails?.comments ? productDetails?.comments : 'NA'}
                </Typography>
              </Grid>

              <Grid
                item
                xs={12}
                sm={12}
                sx={{
                  position: 'relative',
                  top: '52px',
                  left: '33px'
                }}
              >
                {selectedPharmacy.type === 'local'
                  ? (selectedPharmacy.permission.key === 'allow_full_access' ||
                      selectedPharmacy.permission.key === 'ADD') && (
                      <Grid sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', mb: '20px' }}>
                        {productDetails?.status === 'Pending' && (
                          <Button
                            variant='outlined'
                            sx={{ color: 'error' }}
                            color='error'
                            onClick={() => {
                              handleRequestStatus('Cancelled', productDetails.id, productDetails)
                            }}
                          >
                            Cancel Request
                          </Button>
                        )}
                      </Grid>
                    )
                  : !visibleArea && (
                      <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mb: '20px' }}>
                        {productDetails?.status === 'Pending' && (
                          <LoadingButton
                            loading={submitLoader}
                            sx={{ margin: '2px' }}
                            variant='outlined'
                            onClick={() => {
                              handleRequestStatus('Approved', productDetails.id, productDetails)
                            }}
                          >
                            Approve Request
                          </LoadingButton>
                        )}
                        {productDetails?.status === 'Pending' && (
                          <LoadingButton
                            sx={{ margin: '2px', color: 'error' }}
                            variant='outlined'
                            color='error'
                            onClick={() => {
                              setVisibleArea(true)
                            }}
                          >
                            Reject Request
                          </LoadingButton>
                        )}
                      </Grid>
                    )}
              </Grid>
              {visibleArea && (
                <Card sx={{ width: '100%', ml: '30px' }}>
                  <CardContent>
                    {/* <Typography sx={{ mb: '10px' }}>Reason of Rejection</Typography> */}
                    <Grid item xs={12} sm={12}>
                      {visibleArea && (
                        <>
                          <TextField
                            fullWidth
                            id='outlined-basic'
                            label='Reason of Rejecting'
                            multiline
                            rows={4}
                            onChange={e => setReasonText(e.target.value)}
                          />
                          <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: '10px' }}>
                            <Button
                              sx={{ margin: '3px' }}
                              variant='outlined'
                              size='large'
                              onClick={() => {
                                setVisibleArea(false)
                              }}
                            >
                              Cancel
                            </Button>

                            <LoadingButton
                              sx={{ margin: '3px' }}
                              size='large'
                              variant='contained'
                              loading={submitLoader}
                              onClick={() => {
                                handleRequestStatus('Rejected', productDetails.id, productDetails)
                              }}
                            >
                              Submit
                            </LoadingButton>
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </div>
        )
      })}
    </Grid>
  )
}
