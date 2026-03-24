import {
  Box,
  Button,
  Card,
  Drawer,
  IconButton,
  Typography,
  Divider,
  Chip
} from '@mui/material'
import { useTheme } from '@emotion/react'
import Icon from 'src/@core/components/icon'
import { LoadingButton } from '@mui/lab'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { addDropPointToMealGroup, getDropPointList } from 'src/lib/api/diet/mealgroup'
import toast from 'react-hot-toast'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'

const AddDropPointDrawer = ({
  openDrawer,
  handleCloseSideBar,
  selectedOption,
  selectedMealGroups,
  mealGroupsList,
  siteName,
  fetchEnclosure,
  onRemoveMealGroup
}) => {
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [dropPointList, setDropPointList] = useState([])
  const [dropPointLoading, setDropPointLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const {
    control,
    handleSubmit: handleFormSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      drop_point_name: null
    }
  })

  // Get selected meal group details
  const selectedMealGroupDetails = mealGroupsList.filter(group => selectedMealGroups.includes(group.id))

  // Fetch drop point list on mount
  useEffect(() => {
    if (openDrawer && selectedOption) {
      fetchDropPoints()
    }
  }, [openDrawer, selectedOption])

  const fetchDropPoints = async () => {
    setDropPointLoading(true)
    try {
      const response = await getDropPointList({
        site_id: selectedOption,
        page_no: 1,
        limit: 100
      })

      if (response?.success) {
        const dropPoints = response?.data?.result || []
        console.log('Drop Points Response:', dropPoints)
        setDropPointList(dropPoints)
      } else {
        console.error('Failed to fetch drop points:', response?.message || 'Unknown error')
      }
    } catch (error) {
      console.error('Error fetching drop points:', error)
    } finally {
      setDropPointLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setInputValue('')
    handleCloseSideBar()
  }

  const handleSubmit = async data => {
    const dropPointValue = data.drop_point_name

    console.log('Form Data:', data)
    console.log('Drop Point Value:', dropPointValue)
    console.log('Drop Point List:', dropPointList)

    if (!dropPointValue) {
      toast.error('Please enter drop point name')

      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('site_id', selectedOption)

      // Check if dropPointValue has a valid value that exists in the list
      const selectedDropPoint = dropPointList.find(
        item => item.id === dropPointValue.value || item.drop_point_id === dropPointValue.value
      )

      if (selectedDropPoint) {
        // Selected from existing drop points - pass the ID as drop_point_name
        const dropPointId = selectedDropPoint.id || selectedDropPoint.drop_point_id
        formData.append('drop_point_name', dropPointId)
        console.log('Selected existing drop point - sending ID:', dropPointId)
      } else if (dropPointValue.value && dropPointValue.value !== dropPointValue.label) {
        // Value exists and is different from label, likely a numeric ID
        formData.append('drop_point_name', dropPointValue.value)
        console.log('Using drop point ID from value:', dropPointValue.value)
      } else {
        // Custom text entered - pass the text as drop_point_name
        const dropPointName = dropPointValue.label || dropPointValue.value
        formData.append('drop_point_name', dropPointName)
        console.log('Custom drop point name entered:', dropPointName)
      }

      formData.append('meal_group_ids', JSON.stringify(selectedMealGroups))

      const response = await addDropPointToMealGroup(formData)

      if (response?.success) {
        toast.success('Drop point added successfully')
        handleClose()
        if (fetchEnclosure) {
          fetchEnclosure()
        }
      } else {
        toast.error(response?.message || 'Failed to add drop point')
      }
    } catch (error) {
      toast.error('Server error. Please try again.')
      console.error('Add Drop Point Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      open={openDrawer}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 500 } } }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography variant='h6' sx={{ fontWeight: 600, fontFamily: 'Inter' }}>
          Add Drop Point
        </Typography>
        <IconButton onClick={handleClose}>
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Box>

      <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
        {/* Site Preview */}
        <Card
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: theme.palette.customColors.lightBg,
            boxShadow: 'none',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '4px'
          }}
        >
          <Typography
            variant='caption'
            sx={{
              fontWeight: 600,
              fontSize: '12px',
              fontFamily: 'Inter',
              color: theme.palette.customColors.OnSurfaceVariant,
              textTransform: 'uppercase',
              mb: 1,
              display: 'block'
            }}
          >
            Selected Site
          </Typography>
          <Typography
            variant='body1'
            sx={{
              fontWeight: 500,
              fontSize: '16px',
              fontFamily: 'Inter',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {siteName || 'N/A'}
          </Typography>
        </Card>

        {/* Meal Groups Preview */}
        <Card
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: theme.palette.customColors.lightBg,
            boxShadow: 'none',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '4px'
          }}
        >
          <Typography
            variant='caption'
            sx={{
              fontWeight: 600,
              fontSize: '12px',
              fontFamily: 'Inter',
              color: theme.palette.customColors.OnSurfaceVariant,
              textTransform: 'uppercase',
              mb: 1,
              display: 'block'
            }}
          >
            Selected Meal Groups ({selectedMealGroups.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {selectedMealGroupDetails.map(group => (
              <Chip
                key={group.id}
                label={group.group_name}
                onDelete={onRemoveMealGroup ? () => onRemoveMealGroup(group.id) : undefined}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: '#fff',
                  fontFamily: 'Inter',
                  fontSize: '14px',
                  '& .MuiChip-deleteIcon': {
                    color: '#fff',
                    '&:hover': {
                      color: 'rgba(255, 255, 255, 0.8)'
                    }
                  }
                }}
              />
            ))}
          </Box>
        </Card>

        <Divider sx={{ my: 3 }} />

        {/* Drop Point Name Input */}
        <Box sx={{ mb: 2 }}>
          <ControlledAutocomplete
            name='drop_point_name'
            label='Drop Point Name *'
            control={control}
            errors={errors}
            options={dropPointList.map(item => {
              console.log('Mapping drop point item:', item)
              return {
                label: item.drop_point_name || item.name,
                value: item.id || item.drop_point_id
              }
            })}
            loading={dropPointLoading}
            required={{
              value: true,
              message: 'Drop point name is required'
            }}
            showIcons={true}
            onChangeOverride={value => {
              console.log('ControlledAutocomplete onChange:', value)
              // User selected from dropdown
              if (value && value.value) {
                setInputValue('')
              }
            }}
            onInputChange={(value, reason) => {
              console.log('Input change - Value:', value, 'Reason:', reason)
              // Track the typed value
              if (reason === 'input') {
                setInputValue(value)
              }
            }}
            onBlur={() => {
              console.log('Blur event - Input Value:', inputValue)
              // On blur, if there's typed text and no selection, set it as custom value
              if (inputValue && inputValue.trim()) {
                const customValue = {
                  label: inputValue.trim(),
                  value: inputValue.trim()
                }
                console.log('Setting custom value on blur:', customValue)
                setValue('drop_point_name', customValue, { shouldValidate: true })
              }
            }}
            getOptionLabel={option => option?.label || ''}
            isOptionEqualToValue={(option, value) => option?.value === value?.value}
            textFieldProps={{
              placeholder: 'Search or enter drop point name'
            }}
            autocompleteProps={{
              selectOnFocus: true,
              clearOnBlur: false,
              handleHomeEndKeys: true,
              freeSolo: true
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '4px'
              }
            }}
          />
        </Box>
      </Box>

      {/* Footer Actions */}
      <Box
        sx={{
          p: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          gap: 2,
          justifyContent: 'flex-end'
        }}
      >
        <Button
          onClick={handleClose}
          variant='outlined'
          sx={{
            borderRadius: '4px',
            color: theme.palette.customColors.OnSurfaceVariant,
            borderColor: theme.palette.customColors.Outline,
            '&:hover': {
              borderColor: theme.palette.customColors.Outline,
              backgroundColor: 'transparent'
            }
          }}
        >
          Cancel
        </Button>
        <LoadingButton
          loading={loading}
          onClick={handleFormSubmit(handleSubmit)}
          variant='contained'
          sx={{
            backgroundColor: theme.palette.primary.main,
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark
            }
          }}
        >
          Add Drop Point
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default AddDropPointDrawer
