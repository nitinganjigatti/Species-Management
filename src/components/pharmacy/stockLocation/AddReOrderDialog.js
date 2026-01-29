import { yupResolver } from '@hookform/resolvers/yup'
import {
  Button,
  Card,
  CircularProgress,
  Drawer,
  FormControl,
  FormHelperText,
  IconButton,
  TextField,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import React, { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import { addMedicineMinQuantity } from 'src/lib/api/pharmacy/getMedicineList'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'
import * as Yup from 'yup'

const defaultValues = {
  reorder_level: ''
}

const schema = Yup.object().shape({
  reorder_level: Yup.number()
    .typeError('Reorder Level is required')
    .min(0, 'Reorder Level cannot be negative')
    .required('Reorder Level is required')
})

const AddReOrderDialog = ({
  openDrawer,
  setOpenDrawer,
  stockDetails,
  setStockDetails,
  dialogCheck,
  setDialogCheck
}) => {
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const [submitLoader, setSubmitLoader] = useState(false)

  const inputRef = useRef(null)

  useEffect(() => {
    if (openDrawer) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [openDrawer])

  const handleSave = async minQty => {
    setSubmitLoader(true)
    try {
      const stockId = stockDetails?.stock_item_id || stockDetails?.id

      const payload = {
        min_qty: minQty.reorder_level
      }
      const result = await addMedicineMinQuantity(payload, stockId)
      if (result.success == true) {
        console.log('result', result)

        toast.success(result.data)
        reset(defaultValues)
        close()
        setOpenDrawer(false)
        setStockDetails(null)
        setDialogCheck(!dialogCheck)
      } else {
        toast.error(result.data.config)
      }
      setSubmitLoader(false)
    } catch (error) {
      console.error('Error saving reorder level:', error)
    }
  }

  const handleCancel = () => {
    reset()
    setOpenDrawer(false)
    setStockDetails(null)
  }

  return (
    <Drawer
      anchor='right'
      open={openDrawer}
      onClose={() => {
        setOpenDrawer(false)
        setStockDetails(null)
      }}
      slotProps={{
        paper: {
          sx: {
            width: {
              xs: '100%',
              sm: '80%',
              md: 560
            },
            backgroundColor: 'customColors.Background',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }
        }
      }}
    >
      <Box
        sx={{
          p: 4,
          position: 'sticky',
          top: 0,
          backgroundColor: 'customColors.Background',
          zIndex: 1,
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography
            variant='h6'
            sx={{
              fontWeight: 'bold'
            }}
          >
            Add Reorder Level
          </Typography>
          <IconButton
            onClick={() => {
              setOpenDrawer(false)
              setStockDetails(null)
            }}
          >
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ p: 4, overflowY: 'auto', flexGrow: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px',
            borderRadius: '8px',
            mt: 1,
            backgroundColor: 'customColors.neutral05'
          }}
        >
          <PharmacyProductCard
            title={stockDetails?.stock_name || stockDetails?.stock_items_name || stockDetails?.name || 'NA'}
            subTitle={stockDetails?.generic_name ? stockDetails?.generic_name : 'NA'}
            icon={stockDetails?.image}
          />
          <Typography sx={{ fontSize: '14px' }}>
            Reorder-Level: <strong>{stockDetails?.min_qty ? stockDetails?.min_qty : 0}</strong>
          </Typography>
        </Box>

        <Card
          sx={{
            p: 4,
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            marginBottom: 2,
            marginTop: 6,

            boxShadow: 'none'
          }}
        >
          <form onSubmit={handleSubmit(handleSave)}>
            <FormControl fullWidth>
              <Controller
                name='reorder_level'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='Reorder Level *'
                    error={Boolean(errors.reorder_level)}
                    fullWidth
                    type='number'
                    inputRef={inputRef}
                    inputProps={{ min: 0 }}
                  />
                )}
                rules={{
                  required: 'Reorder Level is required',
                  min: {
                    value: 0,
                    message: 'Reorder Level cannot be negative'
                  }
                }}
              />

              {errors.reorder_level && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.reorder_level?.message}</FormHelperText>
              )}
            </FormControl>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
              <Button variant='outlined' color='secondary' onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant='contained' color='primary' type='submit'>
                {submitLoader ? <CircularProgress size={20} /> : ' Save'}
              </Button>
            </Box>
          </form>
        </Card>
      </Box>
    </Drawer>
  )
}

export default AddReOrderDialog
