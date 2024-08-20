import React, { useState } from 'react'
import { FormControl, FormHelperText, TextField, Grid } from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import toast from 'react-hot-toast'
import { CardContent, Card } from '@mui/material'
import Typography from '@mui/material/Typography'

import { useForm, Controller } from 'react-hook-form'
import { rejectMedicine } from 'src/lib/api/pharmacy/getRequestItemsList'
import { LoadingButton } from '@mui/lab'

function RejectRequestItem({ parentId, updateRequestItems }) {
  const defaultValues = {
    comments: ''
  }

  const schema = yup.object().shape({
    comments: yup.string().required('comments is required')
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset

    // eslint-disable-next-line react-hooks/rules-of-hooks
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })
  const [submitLoader, setSubmitLoader] = useState(false)

  const onSubmit = async params => {
    if (parentId) {
      try {
        const response = await rejectMedicine(params, parentId?.request_item_id)
        if (response?.success) {
          toast.success(response?.message)
          reset(defaultValues)
          setSubmitLoader(false)
          updateRequestItems()
        } else {
          setSubmitLoader(false)
          toast.error(response?.message)
        }
      } catch (error) {
        setSubmitLoader(false)
        console.log('error', error)
      }
    }
  }

  return (
    <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
      <Card sx={{ mb: 10, width: { lg: '45%', xs: '100%' } }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography>
                <strong>Product:</strong>
                {parentId?.product}
              </Typography>
              <Typography>
                <strong>Quantity requested:</strong>
                {parentId?.qty_requested}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={12}>
          <FormControl fullWidth>
            <Controller
              name='comments'
              control={control}
              defaultValue=''
              rows={2}
              render={({ field }) => (
                <TextField multiline rows={2} {...field} label='Comment*' error={Boolean(errors.comments)} />
              )}
            />
            {errors.comments && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors?.comments?.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <LoadingButton
            sx={{ my: 6, float: 'right' }}
            size='large'
            type='submit'
            variant='contained'
            loading={submitLoader}
          >
            Save
          </LoadingButton>
        </Grid>
      </Grid>
    </form>
  )
}

export default RejectRequestItem
