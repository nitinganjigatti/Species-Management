import { Button, Grid, TextField, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { Box } from '@mui/system'
import { useRouter } from 'next/router'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import { addNonExistingProductStatus } from 'src/lib/api/pharmacy/newMedicine'
import toast from 'react-hot-toast'

export const ProductDetail = ({ setShow, detailsData, prescriptionImages, productDetails }) => {
  console.log('product data????', productDetails, detailsData)

  const { selectedPharmacy } = usePharmacyContext()
  const [visibleArea, setVisibleArea] = useState(false)
  const [reasonText, setReasonText] = useState('')
  const [statusCall, setStatusCall] = useState('')

  const router = useRouter()

  const handleRequestStatus = async (status, id, productDetails) => {
    const payload = {
      status: status,
      comments: reasonText ? reasonText : ''
    }

    try {
      const response = await addNonExistingProductStatus(payload, id)
      if (response?.success) {
        const toastMessage = id ? 'Product Status Updated Successfully' : 'Unable to Update the Product Status'
        toast.success(toastMessage)
        setShow(false)

        if (status === 'Cancelled') {
          router.push('/pharmacy/new-product-request/')
        } else {
          router.push({
            pathname: '/pharmacy/medicine/add-product/'
          })
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <Grid>
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
                <Typography variant='body2'>{item.product_type}</Typography>
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
                <Typography variant='body2'>{item.generic_name}</Typography>
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
                        console.log('Item????', item)

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
                <Typography variant='body2'>{productDetails?.comments}</Typography>
              </Grid>

              {productDetails?.status !== 'Pending' && (
                <Grid item xs={12}>
                  <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                    Status
                  </Typography>
                  <Typography variant='body2'>{productDetails?.status}</Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                {selectedPharmacy.type === 'local'
                  ? (selectedPharmacy.permission.key === 'allow_full_access' ||
                      selectedPharmacy.permission.key === 'ADD') && (
                      <Grid sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                        {productDetails?.status === 'Pending' && (
                          <Button
                            variant='contained'
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
                      <Grid sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                        {productDetails?.status === 'Pending' && (
                          <Button
                            sx={{ margin: '2px' }}
                            variant='contained'
                            onClick={() => {
                              handleRequestStatus('Approved', productDetails.id, productDetails)
                            }}
                          >
                            Approve Request
                          </Button>
                        )}
                        {productDetails?.status === 'Pending' && (
                          <Button
                            sx={{ margin: '2px' }}
                            variant='contained'
                            onClick={() => {
                              setVisibleArea(true)
                            }}
                          >
                            Reject Request
                          </Button>
                        )}
                      </Grid>
                    )}
              </Grid>
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

                    <Button
                      onClick={() => {
                        setVisibleArea(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        handleRequestStatus('Rejected', productDetails.id, productDetails)
                      }}
                    >
                      Submit
                    </Button>
                  </>
                )}
              </Grid>
            </Grid>
          </div>
        )
      })}
    </Grid>
  )
}
