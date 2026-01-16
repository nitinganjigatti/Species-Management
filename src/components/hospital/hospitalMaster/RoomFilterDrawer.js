import React, { useCallback, useEffect, useState } from 'react'
import { Box, Radio, Typography, FormControlLabel, RadioGroup } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'

const MENU_DATA = {
  Availability: [
    { label: 'Available', value: 'Available' },
    { label: 'Occupied', value: 'Occupied' },
    { label: 'Unavailable', value: 'Unavailable' }
  ],
  Status: [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ]
}

const DEFAULT_OPTIONS = { Availability: [], Status: [] }

const RoomFilterDrawer = ({
  openFilterDrawer,
  onCloseFilterDrawer,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}) => {
  const theme = useTheme()

  const [selectedMenu, setSelectedMenu] = useState('Availability')
  const [selectedOptions, setSelectedOptions] = useState(DEFAULT_OPTIONS)
  const [localFilterCount, setLocalFilterCount] = useState(0)

  const isFilterEmpty = filters => {
    if (!filters) return true

    for (const value of Object.values(filters)) {
      if (Array.isArray(value) && value.length > 0) {
        return false
      }
    }

    return true
  }

  const checkFiltersEqual = (a = {}, b = {}) => {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])

    for (const key of keys) {
      const valA = a[key]?.[0] || ''
      const valB = b[key]?.[0] || ''

      if (valA !== valB) return false
    }

    return true
  }

  const handleRadioChange = useCallback((value, menu) => {
    setSelectedOptions(prev => {
      const updated = { ...prev, [menu]: [value] }
      const count = Object.values(updated).reduce((acc, arr) => acc + arr.length, 0)

      setLocalFilterCount(count)

      return updated
    })
  }, [])

  const handleClearAll = useCallback(() => {
    setSelectedOptions(DEFAULT_OPTIONS)
    setLocalFilterCount(0)
  }, [])

  const applyFilters = () => {
    if (isFilterEmpty(selectedOptions) && isFilterEmpty(initialSelectedOptions)) {
      onCloseFilterDrawer()

      return
    }

    if (checkFiltersEqual(selectedOptions, initialSelectedOptions)) {
      onCloseFilterDrawer()

      return
    }

    setFilterCount(localFilterCount)
    onApplyFilters(selectedOptions)
  }

  // Restore applied filters on close (Cancel button and icon close)
  useEffect(() => {
    if (!openFilterDrawer) {
      const restored = initialSelectedOptions || DEFAULT_OPTIONS
      setSelectedOptions(restored)
      setLocalFilterCount(Object.values(restored).reduce((acc, arr) => acc + arr.length, 0))
    }
  }, [openFilterDrawer, initialSelectedOptions])

  const FilterContent = ({ menu }) => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <RadioGroup value={selectedOptions[menu]?.[0] || ''} onChange={e => handleRadioChange(e.target.value, menu)}>
          {MENU_DATA[menu].map(item => (
            <FormControlLabel
              key={item.value}
              value={item.value}
              control={<Radio />}
              label={
                <Typography sx={{ fontSize: '1rem', color: theme.palette.customColors?.Outline }}>
                  {item.label}
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
      filterLists={['Availability', 'Status']}
      selectedOptions={selectedOptions}
      isSubmitting={onSubmitLoading}
      selectedItem={selectedMenu}
      onSelectItem={setSelectedMenu}
    >
      <FilterContent menu={selectedMenu} />
    </CustomFilterDrawer>
  )
}

export default RoomFilterDrawer
