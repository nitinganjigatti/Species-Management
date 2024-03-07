import {
  Button,
  FormControl,
  FormHelperText,
  Grid,
  Icon,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import React, { useRef, useState, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box } from '@mui/system'

import { usePharmacyContext } from 'src/context/PharmacyContext'

export const ProductDetail = ({ detailsData, imgUrl, handleEdit, itemId, prescriptionImages, productDetails }) => {
  const base_url = `${process.env.NEXT_PUBLIC_BASE_URL}`

  const { selectedPharmacy } = usePharmacyContext()

  return (
    <Grid>
      {detailsData?.map((item, index) => {
        return (
          <div key={index}>
            {selectedPharmacy.type === 'local' &&
              (selectedPharmacy.permission.key === 'allow_full_access' ||
                selectedPharmacy.permission.key === 'ADD') && (
                <Grid sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                  <Button variant='contained' onClick={() => handleEdit(itemId)}>
                    Edit
                  </Button>
                </Grid>
              )}

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

              {item?.product_image && (
                <Grid item xs={6}>
                  <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                    Product Image
                  </Typography>

                  <a href={`${base_url}${imgUrl}${item?.product_image}`} target='_blank'>
                    <img
                      alt='Product Image'
                      style={{ borderRadius: '10px' }}
                      width='50px'
                      height='50px'
                      src={`${base_url}${imgUrl}${item?.product_image}`}
                    />
                  </a>
                </Grid>
              )}
              <Grid item xs={6}>
                <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                  Priority
                </Typography>
                {item?.priority}
              </Grid>
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
                              <a href={`${base_url}${imgUrl}${item}`} target='_blank'>
                                <img
                                  alt='Prescription Image'
                                  style={{ width: '50px', height: '50px', borderRadius: '10px', margin: '10px' }}
                                  src={`${base_url}${imgUrl}${item}`}
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
            </Grid>
          </div>
        )
      })}
    </Grid>
  )
}
