import React, { useCallback, useEffect, useState } from 'react'
import { Box, Radio, Typography, FormControlLabel, RadioGroup } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { debounce } from 'lodash'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import Toaster from 'src/components/Toaster'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { readAsync } from 'src/lib/windows/utils'

const medicalTypeOptions = [
  { label: 'All Activities', value: '' },
  { label: 'Vaccination', value: 'vaccination' },
  { label: 'Prescription', value: 'prescription' },
  { label: 'Clinical Assessment', value: 'clinical_assessment' },
  { label: 'Symptoms', value: 'symptoms' }
]

const MedicalSummaryFilterDrawer = ({
  open,
  onClose,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}) => {
  const leftMenu = ['Medical Type', 'User']
  const [selectedMenu, setSelectedMenu] = useState('Medical Type')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [localFilterCount, setLocalFilterCount] = useState(0)
  const [menuData, setMenuData] = useState({ User: [] })

  const [selectedOptions, setSelectedOptions] = useState({
    'Medical Type': [],
    User: []
  })

  // Fetch users for checkbox list
  const fetchMenuData = useCallback(async (query = '') => {
    try {
      setSearchLoading(true)
      const userDetails = await readAsync('userDetails')
      let data = []

      if (userDetails?.user?.zoos?.length > 0) {
        const zoo_id = userDetails.user.zoos[0].zoo_id
        const params = { zoo_id }
        if (query.trim() !== '') params.q = query

        const res = await getUserList(params)
        data = Array.isArray(res?.data)
          ? res.data.map(item => ({
              label: item?.user_name,
              value: item?.user_id,
              image: item?.user_profile_pic
            }))
          : []
      }

      setMenuData({ User: data })
    } catch (error) {
      console.error('Error fetching users:', error)
      Toaster({ type: 'error', message: 'Failed to load users' })
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // Clear all filters
  const handleClearAll = useCallback(() => {
    setSelectedOptions({ 'Medical Type': [], User: [] })
    setLocalFilterCount(0)
    setFilterCount(0)
  }, [setFilterCount])

  // Search debounce for user list
  const debouncedMenuSearch = useCallback(
    debounce(async query => {
      await fetchMenuData(query)
    }, 500),
    [fetchMenuData]
  )

  const handleSearch = useCallback(
    query => {
      setSearchQuery(query)
      debouncedMenuSearch(query)
    },
    [debouncedMenuSearch]
  )

  // Checkbox handlers (User)
  const handleCheckbox = useCallback(id => {
    setSelectedOptions(prev => {
      const prevMedicalType = prev?.['Medical Type'] || []
      const isSelected = prev.User.includes(id)

      const newSelected = isSelected ? prev.User.filter(item => item !== id) : [...prev.User, id]
      const total = newSelected.length + (prevMedicalType[0] ? 1 : 0)
      setLocalFilterCount(total)

      return { ...prev, User: newSelected }
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedOptions(prev => {
      const prevMedicalType = prev?.['Medical Type'] || []
      const allIds = menuData.User?.map(item => item.value) || []
      const isAllSelected = prev.User.length === allIds.length
      const newSelected = isAllSelected ? [] : allIds
      const total = newSelected.length + (prevMedicalType[0] ? 1 : 0)
      setLocalFilterCount(total)

      return { ...prev, User: newSelected }
    })
  }, [menuData])

  // Radio handler (Medical Type)
  const handleRadioChange = useCallback((value, menuName) => {
    setSelectedOptions(prev => {
      const prevUser = prev?.User || []

      const newOptions = {
        ...prev,
        [menuName]: value ? [value] : []
      }
      const isMedicalTypeActive = newOptions['Medical Type'][0] && newOptions['Medical Type'][0] !== ''
      const total = (isMedicalTypeActive ? 1 : 0) + prevUser.length
      setLocalFilterCount(total)

      return newOptions
    })
  }, [])

  // Apply filters
  const applyFilters = () => {
    setFilterCount(localFilterCount)
    onApplyFilters(selectedOptions)
  }

  // On open / initial
  useEffect(() => {
    if (open) {
      fetchMenuData()
    }
    if (initialSelectedOptions) {
      setSelectedOptions(initialSelectedOptions)

      const isMedicalTypeActive =
        initialSelectedOptions['Medical Type']?.[0] && initialSelectedOptions['Medical Type'][0] !== ''

      const total = (isMedicalTypeActive ? 1 : 0) + (initialSelectedOptions.User?.length || 0)
      setLocalFilterCount(total)
    }
  }, [open, fetchMenuData, initialSelectedOptions])

  // Radio section UI
  const FilterContentRadio = ({ menuName, selectedOption = [], onOptionChange, items }) => {
    const theme = useTheme()

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <RadioGroup value={selectedOption[0] || ''} onChange={e => onOptionChange(e.target.value, menuName)}>
          {items?.map(item => (
            <FormControlLabel
              key={item.value}
              value={item.value}
              control={<Radio />}
              label={
                <Typography sx={{ fontSize: '16px', color: theme.palette.customColors?.Outline }}>
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
      open={open}
      onClose={onClose}
      onApply={applyFilters}
      onClearAll={handleClearAll}
      filterLists={leftMenu}
      selectedOptions={selectedOptions}
      isSubmitting={onSubmitLoading}
      selectedItem={selectedMenu}
      onSelectItem={setSelectedMenu}
    >
      {selectedMenu === 'Medical Type' && (
        <FilterContentRadio
          menuName='Medical Type'
          selectedOption={selectedOptions['Medical Type']}
          onOptionChange={handleRadioChange}
          items={medicalTypeOptions}
        />
      )}

      {selectedMenu === 'User' && (
        <FilterContent
          menuName='User'
          searchQuery={searchQuery}
          onSearch={handleSearch}
          selectedOptions={selectedOptions.User}
          onOptionChange={handleCheckbox}
          selectAllHandler={handleSelectAll}
          items={menuData.User}
          isAllSelected={menuData.User?.length > 0 && selectedOptions.User?.length === menuData.User?.length}
          searchLoading={searchLoading}
          placeholder='Search User'
        />
      )}
    </CustomFilterDrawer>
  )
}

export default MedicalSummaryFilterDrawer
