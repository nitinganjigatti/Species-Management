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

export const ProductDetail = ({ detailsData, imgUrl, handleEdit, itemId, prescriptionImages }) => {
  const base_url = `${process.env.NEXT_PUBLIC_BASE_URL}`

  console.log('detailsData???', detailsData)

  const defaultValues = {
    from_store: '',
    comment: '',
    prescription_images: [],
    product_type: '',
    product_name: '',
    generic_name: '',
    product_image: '',
    quantity: '1',
    priority: 'Normal'
  }

  const schema = yup.object().shape({
    from_store: yup.string().required('please select from store'),
    product_type: yup.string().required('product type is required'),
    product_name: yup.string().required('product name is required'),
    generic_name: yup.string().required('generic name is required'),
    quantity: yup.number().required('Quantity is required').moreThan(0, 'Quantity must be greater than 0')
  })
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onBlur'
  })
  return (
    <Grid>
      {detailsData?.map((item, index) => {
        return (
          <>
            <Grid sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
              <Button variant='contained' onClick={() => handleEdit(itemId)}>
                Edit
              </Button>
            </Grid>

            <Grid container spacing={6}>
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
              <Grid item xs={6}>
                <Typography>Selected Image</Typography>
                {item?.product_image ? (
                  <img
                    style={{ borderRadius: '10px' }}
                    width='50px'
                    height='50px'
                    src={`${base_url}${imgUrl}${item?.product_image}`}
                  />
                ) : (
                  'No Image Found'
                )}
              </Grid>
              <Grid item xs={6}>
                <Typography>Priority</Typography>
                {item?.priority}
              </Grid>
            </Grid>
            {prescriptionImages && (
              <Grid sx={{ display: 'flex', padding: '10px' }}>
                <Typography>Prescription Images</Typography>
                {prescriptionImages &&
                  prescriptionImages?.map((item, index) => {
                    return (
                      <>
                        <Grid>
                          <img
                            style={{ width: '50px', height: '50px', borderRadius: '10px', margin: '10px' }}
                            src={`${base_url}${imgUrl}${item}`}
                          />
                        </Grid>
                      </>
                    )
                  })}
              </Grid>
            )}
          </>
        )
      })}
    </Grid>
  )
}
