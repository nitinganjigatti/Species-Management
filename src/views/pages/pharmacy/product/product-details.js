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

            <Grid container spacing={6} sx={{ mb: '30px' }}>
              {selectedPharmacy.type === 'central' && (
                <Grid item xs={6}>
                  <Typography>From Store</Typography>
                  {productDetails?.to_store_name}
                </Grid>
              )}
              <Grid item xs={6}>
                <Typography>Product Type</Typography>
                {item?.product_type}
              </Grid>
              <Grid item xs={6}>
                <Typography>Product Name</Typography>
                {item?.product_name}
              </Grid>
              <Grid item xs={6}>
                <Typography>Generic Name</Typography>
                {item?.generic_name}
              </Grid>
              <Grid item xs={6}>
                <Typography>Quantity</Typography>
                {item?.quantity}
              </Grid>

              {item?.product_image && (
                <Grid item xs={6}>
                  <Typography>Product Image</Typography>

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
                <Typography>Priority</Typography>
                {item?.priority}
              </Grid>
              {prescriptionImages && (
                <Grid item xs={6}>
                  <Typography>Prescription Images</Typography>

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
              <Grid item xs={6}>
                <Typography>Comments</Typography>
                {productDetails?.comments}
              </Grid>
            </Grid>
          </div>
        )
      })}
    </Grid>
  )
}
