import React, { useCallback, useEffect, useState } from 'react'
import { Box, Radio, Typography, FormControlLabel, RadioGroup } from '@mui/material'
import { debounce } from 'lodash'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { readAsync } from 'src/lib/windows/utils'

const LEFT_MENU = ['Medical Type', 'User']

const MEDICAL_TYPE_OPTIONS = [
  { label: 'All Activities', value: '' },
  { label: 'Vaccination', value: 'vaccination' },
  { label: 'Prescription', value: 'prescription' },
  { label: 'Clinical Assessment', value: 'clinical_assessment' },
  { label: 'Symptoms', value: 'symptoms' }
]

const DEFAULT_OPTIONS = { 'Medical Type': [], User: [] }

const MedicalSummaryFilterDrawer = ({
  open,
  onClose,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}) => {
  const [selectedMenu, setSelectedMenu] = useState('Medical Type')
  const [selectedOptions, setSelectedOptions] = useState(DEFAULT_OPTIONS)
  const [menuData, setMenuData] = useState({ User: [] })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [drawerCount, setDrawerCount] = useState(0)

  // Count active filters
  const calculateFilterCount = filters => {
    const type = filters['Medical Type']?.[0]
    const hasMedicalType = type && type !== '' // ignore "All Activities"
    const userCount = filters.User?.length || 0

    return (hasMedicalType ? 1 : 0) + userCount
  }

  // Fetch Users
  const fetchUsers = useCallback(async (query = '') => {
    try {
      setSearchLoading(true)
      const userDetails = await readAsync('userDetails')

      let data = []
      if (userDetails?.user?.zoos?.length) {
        const zoo_id = userDetails.user.zoos[0].zoo_id
        const params = { zoo_id }
        if (query.trim()) params.q = query

        const res = await getUserList(params)

        data = Array.isArray(res?.data)
          ? res.data.map(item => ({
              label: item.user_name,
              value: item.user_id,
              image: item.user_profile_pic
            }))
          : []
      }

      setMenuData({ User: data })
    } catch (error) {
      console.error('Error fetching users:', error?.message || error)
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // Debounced user search
  const debouncedSearch = useCallback(
    debounce(q => fetchUsers(q), 500),
    [fetchUsers]
  )

  const handleSearch = query => {
    setSearchQuery(query)
    debouncedSearch(query)
  }

  // Clear All Filters
  const handleClearAll = () => {
    setSelectedOptions(DEFAULT_OPTIONS)
    setDrawerCount(0) // local reset
  }

  // User Selection
  const handleCheckbox = id => {
    setSelectedOptions(prev => {
      const selected = prev.User.includes(id) ? prev.User.filter(item => item !== id) : [...prev.User, id]

      const updated = { ...prev, User: selected }
      setDrawerCount(calculateFilterCount(updated)) // local only

      return updated
    })
  }

  const handleSelectAll = () => {
    setSelectedOptions(prev => {
      const allIds = menuData.User.map(item => item.value)
      const isAllSelected = prev.User.length === allIds.length
      const updatedUsers = isAllSelected ? [] : allIds

      const updated = { ...prev, User: updatedUsers }
      setDrawerCount(calculateFilterCount(updated)) // local only

      return updated
    })
  }

  // Medical Type Selection
  const handleRadioChange = value => {
    const updated = {
      ...selectedOptions,
      'Medical Type': value === '' ? [] : [value] // remove empty value for counting
    }

    setSelectedOptions(updated)
    setDrawerCount(calculateFilterCount(updated)) // local only
  }

  const applyFilters = () => {
    if (JSON.stringify(selectedOptions) === JSON.stringify(initialSelectedOptions)) {
      onClose()

      return
    }
    const newCount = calculateFilterCount(selectedOptions)
    setFilterCount(newCount) // update only when Apply is clicked
    onApplyFilters(selectedOptions)
    onClose()
  }

  useEffect(() => {
    if (!open) return

    fetchUsers()

    const restored = initialSelectedOptions || DEFAULT_OPTIONS

    const normalized = {
      ...restored,
      'Medical Type': restored['Medical Type']?.[0] ? restored['Medical Type'] : []
    }

    setSelectedOptions(normalized)
    setDrawerCount(calculateFilterCount(normalized)) // local only
  }, [open, initialSelectedOptions, fetchUsers])

  const MedicalTypeContent = () => (
    <RadioGroup value={selectedOptions['Medical Type']?.[0] ?? ''} onChange={e => handleRadioChange(e.target.value)}>
      {MEDICAL_TYPE_OPTIONS.map(item => (
        <FormControlLabel
          key={item.value}
          value={item.value}
          control={<Radio />}
          label={<Typography fontSize='16px'>{item.label}</Typography>}
        />
      ))}
    </RadioGroup>
  )

  return (
    <CustomFilterDrawer
      open={open}
      onClose={onClose}
      onApply={applyFilters}
      onClearAll={handleClearAll}
      filterLists={LEFT_MENU}
      selectedOptions={selectedOptions}
      isSubmitting={onSubmitLoading}
      selectedItem={selectedMenu}
      onSelectItem={setSelectedMenu}
    >
      {selectedMenu === 'Medical Type' && <MedicalTypeContent />}

      {selectedMenu === 'User' && (
        <FilterContent
          menuName='User'
          searchQuery={searchQuery}
          onSearch={handleSearch}
          selectedOptions={selectedOptions.User}
          onOptionChange={handleCheckbox}
          selectAllHandler={handleSelectAll}
          items={menuData.User}
          isAllSelected={menuData.User.length > 0 && selectedOptions.User.length === menuData.User.length}
          searchLoading={searchLoading}
          placeholder='Search User'
        />
      )}
    </CustomFilterDrawer>
  )
}

export default MedicalSummaryFilterDrawer
