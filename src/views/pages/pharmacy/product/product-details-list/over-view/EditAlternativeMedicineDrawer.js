import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Card,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ProductOption from '../../../utility/ProductOption'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import { Controller } from 'react-hook-form'
import React from 'react'

const EditAlternativeMedicineDrawer = ({
  open,
  onClose,
  onSubmit,
  handleSubmit,
  control,
  errors,
  handleProductChange,
  optionsMedicineList,
  productLoading,
  searchMedicineData
}) => (
  <Drawer
    anchor='right'
    open={open}
    onClose={onClose}
    slotProps={{
      paper: {
        sx: {
          width: 500,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'customColors.Background'
        }
      }
    }}
  >
  
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 4
      }}
    >
      <Typography
        variant='h6'
        sx={{
          fontWeight: 'bold'
        }}
      >
        Edit Alternative Medicine
      </Typography>
      <IconButton onClick={onClose}>
        <Icon icon='mdi:close' />
      </IconButton>
    </Box>
    <Divider />

   
    <Box
      sx={{
        p: 4,
        flex: 1,
        overflowY: 'auto'
      }}
    >
      <Card sx={{ p: 4 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <ControlledAutocomplete
              name='productName'
              label='Product Name*'
              control={control}
              errors={errors}
              options={optionsMedicineList}
              loading={productLoading}
              onKeyUp={e => searchMedicineData(e.target.value)}
              onChangeOverride={handleProductChange}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props

                return <ProductOption key={option.value} option={option} {...otherProps} />
              }}
            />
            <ControlledTextField
              name='manufacturerName'
              label='Manufacturer Name'
              control={control}
              errors={errors}
              required
              disabled
            />
            <FormControl fullWidth error={Boolean(errors.status)}>
              <FormLabel>Status</FormLabel>
              <Controller
                name='status'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <RadioGroup row {...field}>
                    <FormControlLabel value='active' control={<Radio />} label='Active' />
                    <FormControlLabel value='inactive' control={<Radio />} label='Inactive' />
                  </RadioGroup>
                )}
              />
            </FormControl>
          </Box>
        </form>
      </Card>
    </Box>

   
    <Box sx={{ p: 4, borderTop: '1px solid #ddd' }}>
      <Button type='submit' variant='contained' fullWidth onClick={handleSubmit(onSubmit)}>
        Save
      </Button>
    </Box>
  </Drawer>
)

export default React.memo(EditAlternativeMedicineDrawer)
