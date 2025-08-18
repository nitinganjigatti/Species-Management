import { Drawer, Box, Typography, IconButton, Divider, Card, Button } from '@mui/material'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ProductOption from '../../../utility/ProductOption'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import Icon from 'src/@core/components/icon'
import React from 'react'

const AddAlternativeMedicineDrawer = ({
  open,
  onClose,
  onSubmit,
  handleSubmit,
  control,
  errors,
  alternatives,
  handleProductChange,
  handleAddAlternative,
  handleDeleteLastAlternative,
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
        Add New Alternative Medicine
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
              gap: 6
            }}
          >
            {alternatives?.map((alt, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}
              >
                <ControlledAutocomplete
                  name={`alternatives[${index}].productName`}
                  label='Product Name*'
                  control={control}
                  errors={errors}
                  options={optionsMedicineList}
                  loading={productLoading}
                  onKeyUp={e => searchMedicineData(e.target.value)}
                  onChangeOverride={value => handleProductChange(value, index)}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props

                    return <ProductOption key={option.value} option={option} {...otherProps} />
                  }}
                />
                <ControlledTextField
                  name={`alternatives[${index}].manufacturerName`}
                  label='Manufacturer Name'
                  control={control}
                  errors={errors}
                  required
                  disabled
                />
              </Box>
            ))}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2
              }}
            >
              <Button
                variant='text'
                color='error'
                onClick={handleDeleteLastAlternative}
                disabled={alternatives?.length <= 1}
                startIcon={<Icon icon='mdi:delete' />}
              >
                Delete
              </Button>
              <Button variant='text' onClick={handleAddAlternative} startIcon={<Icon icon='mdi:plus' />}>
                Add Alternative
              </Button>
            </Box>
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

export default React.memo(AddAlternativeMedicineDrawer)
