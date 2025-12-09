import React, { useCallback, useEffect, useState } from 'react'
import { Box, Radio, Typography, FormControlLabel, RadioGroup } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import { toast } from 'react-hot-toast'

// Hospital Room Filters Drawer with Radio Buttons
const RoomFilterDrawer = ({
  openFilterDrawer,
  onCloseFilterDrawer,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}) => {
  const leftMenu = ['Availability', 'Status']
  const [selectedMenu, setSelectedMenu] = useState('Availability')
  const [localFilterCount, setLocalFilterCount] = useState(0)

  // Static filter options
  const [menuData, setMenuData] = useState({
    Availability: [
      { label: 'Available', value: 'Available' },
      { label: 'Occupied', value: 'Occupied' },
      { label: 'Unavailable', value: 'Unavailable' }
    ],
    Status: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' }
    ]
  })

  // Selected filters
  const [selectedOptions, setSelectedOptions] = useState({
    Availability: [],
    Status: []
  })

  // Fetch static data
  const fetchMenuData = useCallback(menuName => {
    try {
      if (menuName === 'Availability') {
        setMenuData(prev => ({
          ...prev,
          Availability: [
            { label: 'Available', value: 'Available' },
            { label: 'Occupied', value: 'Occupied' },
            { label: 'Unavailable', value: 'Unavailable' }
          ]
        }))
      } else if (menuName === 'Status') {
        setMenuData(prev => ({
          ...prev,
          Status: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' }
          ]
        }))
      }
    } catch (error) {
      console.error(`Error loading ${menuName}:`, error?.message || error)
    }
  }, [])

  useEffect(() => {
    if (openFilterDrawer) {
      setSelectedMenu('Availability')
      fetchMenuData('Availability')
    }
  }, [openFilterDrawer, fetchMenuData])

  // Clear all filters
  const handleClearAll = useCallback(() => {
    setSelectedOptions({
      Availability: [],
      Status: []
    })
    setLocalFilterCount(0)
    setFilterCount(0)
  }, [setFilterCount])

  // Drawer open
  const handleFilterDrawerOpen = useCallback(() => {
    fetchMenuData(selectedMenu)
  }, [selectedMenu, fetchMenuData])

  // Menu click (switch between Availability and Status)
  const handleMenuClick = useCallback(
    menuName => {
      setSelectedMenu(menuName)
      fetchMenuData(menuName)
    },
    [fetchMenuData]
  )

  // Radio selection (only one option per menu)
  const handleRadioChange = useCallback((id, menuName) => {
    setSelectedOptions(prev => {
      const newOptions = {
        ...prev,
        [menuName]: [id] // Single selection
      }

      const count = Object.values(newOptions).reduce((acc, arr) => acc + arr.length, 0)
      setLocalFilterCount(count)

      return newOptions
    })
  }, [])

  // Apply filters
  const applyFilters = () => {
    setFilterCount(localFilterCount)
    onApplyFilters(selectedOptions)
  }

  useEffect(() => {
    if (openFilterDrawer) {
      handleFilterDrawerOpen()
    }
  }, [openFilterDrawer, handleFilterDrawerOpen])

  useEffect(() => {
    if (initialSelectedOptions) {
      setSelectedOptions(initialSelectedOptions)
      const count = Object.values(initialSelectedOptions).reduce((acc, arr) => acc + arr.length, 0)
      setLocalFilterCount(count)
    }
  }, [initialSelectedOptions])

  //  FilterContent Component
  const FilterContent = ({ menuName, selectedOption = [], onOptionChange, items }) => {
    const theme = useTheme()

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <RadioGroup value={selectedOption[0] || ''} onChange={e => onOptionChange(e.target.value, menuName)}>
          {items?.map(item => (
            <FormControlLabel
              key={item?.value}
              value={item?.value}
              control={<Radio />}
              label={
                <Typography sx={{ fontSize: '1rem', color: theme.palette.customColors?.Outline }}>
                  {item?.label}
                </Typography>
              }
            />
          ))}
        </RadioGroup>
      </Box>
    )
  }

  return (
    <CustomFilterDrawer
      open={openFilterDrawer}
      onClose={onCloseFilterDrawer}
      onApply={applyFilters}
      onClearAll={handleClearAll}
      filterLists={leftMenu}
      selectedOptions={selectedOptions}
      isSubmitting={onSubmitLoading}
      selectedItem={selectedMenu}
      onSelectItem={handleMenuClick}
    >
      {selectedMenu === 'Availability' && (
        <FilterContent
          menuName='Availability'
          selectedOption={selectedOptions['Availability']}
          onOptionChange={handleRadioChange}
          items={menuData['Availability']}
        />
      )}

      {selectedMenu === 'Status' && (
        <FilterContent
          menuName='Status'
          selectedOption={selectedOptions['Status']}
          onOptionChange={handleRadioChange}
          items={menuData['Status']}
        />
      )}
    </CustomFilterDrawer>
  )
}

export default RoomFilterDrawer
