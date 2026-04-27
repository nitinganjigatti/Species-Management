import { Box, Button, Drawer, IconButton, Typography, Chip } from '@mui/material'
import { useTheme } from '@emotion/react'
import Icon from 'src/@core/components/icon'
import { LoadingButton } from '@mui/lab'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { addDropPointToMealGroup, getDropPointList } from 'src/lib/api/diet/mealgroup'
import toast from 'react-hot-toast'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
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
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 562 },
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: theme => theme.spacing(3, 4),
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '24px',
            fontWeight: 500
          }}
        >
          {t('diet_module.add_drop_point')}
        </Typography>
        <IconButton size='small' onClick={handleClose} sx={{ color: theme.palette.primary.light }}>
          <Icon icon='mdi:close' fontSize={25} />
        </IconButton>
      </Box>

      <Box sx={{ p: 4, flex: 1, overflowY: 'auto' }}>
        {/* Site Preview */}
        <Box
          sx={{
            p: 3,
            mb: 3,
            backgroundColor: theme.palette.customColors.Surface,
            borderRadius: '8px'
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
            {t('diet_module.selected_site')}
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
        </Box>

        {/* Meal Groups Preview */}
        <Box
          sx={{
            p: 3,
            mb: 4,
            backgroundColor: theme.palette.customColors.Surface,
            borderRadius: '8px'
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
              mb: 2,
              display: 'block'
            }}
          >
            {t('diet_module.selected_meal_groups')} ({selectedMealGroups.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {selectedMealGroupDetails.map(group => (
              <Chip
                key={group.id}
                label={group.group_name}
                onDelete={onRemoveMealGroup ? () => onRemoveMealGroup(group.id) : undefined}
              />
            ))}
          </Box>
        </Box>

        {/* Drop Point Name Input */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography
            sx={{
              fontFamily: 'Inter',
              fontSize: '14px',
              fontWeight: 500,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {t('diet_module.drop_point_name')}
            <span style={{ color: theme.palette.error.main, marginLeft: 4 }}>*</span>
          </Typography>
          <ControlledAutocomplete
            name='drop_point_name'
            label=''
            control={control}
            errors={errors}
            options={dropPointList.map(item => ({
              label: item.drop_point_name || item.name,
              value: item.id || item.drop_point_id
            }))}
            loading={dropPointLoading}
            required={{
              value: true,
              message: 'Drop point name is required'
            }}
            showIcons={true}
            onChangeOverride={value => {
              if (value && value.value) {
                setInputValue('')
              }
            }}
            onInputChange={(value, reason) => {
              if (reason === 'input') {
                setInputValue(value)
              }
            }}
            onBlur={() => {
              if (inputValue && inputValue.trim()) {
                const customValue = {
                  label: inputValue.trim(),
                  value: inputValue.trim()
                }
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
                borderRadius: '8px',
                backgroundColor: theme.palette.background.paper
              }
            }}
          />
        </Box>
      </Box>

      {/* Footer Actions */}
      <Box
        sx={{
          p: 5,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          display: 'flex',
          gap: 4,
          flexShrink: 0
        }}
      >
        <Button
          fullWidth
          variant='outlined'
          color='primary'
          onClick={handleClose}
          sx={{
            p: 3,
            fontWeight: 600,
            borderRadius: '4px',
            color: theme.palette.customColors.OnSurfaceVariant,
            borderColor: theme.palette.customColors.Outline,
            '&:hover': {
              borderColor: theme.palette.customColors.Outline,
              backgroundColor: 'transparent'
            }
          }}
        >
          {t('cancel')}
        </Button>
        <LoadingButton
          fullWidth
          loading={loading}
          variant='contained'
          color='primary'
          onClick={handleFormSubmit(handleSubmit)}
          sx={{
            p: 3,
            fontWeight: 600,
            borderRadius: '4px',
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark
            }
          }}
        >
          {t('diet_module.add_drop_point')}
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default AddDropPointDrawer
