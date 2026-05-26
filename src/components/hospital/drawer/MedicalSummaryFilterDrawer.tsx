'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Radio, Typography, FormControlLabel, RadioGroup } from '@mui/material'
import { debounce } from 'lodash'
import { useTranslation } from 'react-i18next'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { readAsync } from 'src/lib/windows/utils'
import type { BaseDrawerProps } from 'src/types/hospital'
import { MedicalSummarySelectedOptions } from '../inpatient/InpatientMedicalSummary'
import { Id } from 'src/types/compliance'

const LEFT_MENU = ['Medical Type', 'User']

const DEFAULT_OPTIONS: MedicalSummarySelectedOptions = { 'Medical Type': [], User: [] }

interface MedicalSummaryFilterDrawerProps extends BaseDrawerProps {
  onSubmitLoading?: boolean
  onApplyFilters: (filters: MedicalSummarySelectedOptions) => void
  setFilterCount: (count: number) => void
  initialSelectedOptions?: MedicalSummarySelectedOptions
}

const MedicalSummaryFilterDrawer = ({
  open,
  onClose,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}: MedicalSummaryFilterDrawerProps) => {
  const { t } = useTranslation()
  const [selectedMenu, setSelectedMenu] = useState('Medical Type')
  const [selectedOptions, setSelectedOptions] = useState<MedicalSummarySelectedOptions>(DEFAULT_OPTIONS)
  const [menuData, setMenuData] = useState<MedicalSummarySelectedOptions>({ User: [] })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [drawerCount, setDrawerCount] = useState(0)

  // Medical Type Options with translations
  const MEDICAL_TYPE_OPTIONS = [
    { label: t('hospital_module.all_activities'), value: '' },
    { label: t('hospital_module.vaccination'), value: 'vaccination' },
    { label: t('hospital_module.prescription'), value: 'prescription' },
    { label: t('hospital_module.clinical_assessment'), value: 'clinical_assessment' },
    { label: t('hospital_module.symptoms'), value: 'symptoms' }
  ]

  // Count active filters
  const calculateFilterCount = (filters: MedicalSummarySelectedOptions) => {
    const type = filters['Medical Type']?.[0]
    const hasMedicalType = type && type !== '' // ignore "All Activities"
    const userCount = filters.User?.length || 0

    return (hasMedicalType ? 1 : 0) + userCount
  }

  // Fetch Users
  const fetchUsers = useCallback(async (query = '') => {
    try {
      setSearchLoading(true)
      const userDetails: any = await readAsync('userDetails')

      let data: any[] = []
      if (userDetails?.user?.zoos?.length) {
        const zoo_id = userDetails.user.zoos[0].zoo_id
        const params: any = { zoo_id }
        if (query.trim()) params.q = query

        const res: any = await getUserList(params)

        data = Array.isArray(res?.data)
          ? res.data.map((item: any) => ({
              label: item.user_name,
              value: item.user_id

              // image: item.user_profile_pic
            }))
          : []
      }

      setMenuData({ User: data })
    } catch (error) {
      const err = error as Error
      console.error('Error fetching users:', err?.message || error)
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // Debounced user search
  const debouncedSearch = useCallback(
    debounce((q: string) => fetchUsers(q), 500),
    [fetchUsers]
  )

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    debouncedSearch(query)
  }

  // Clear All Filters
  const handleClearAll = () => {
    setSelectedOptions(DEFAULT_OPTIONS)
    setDrawerCount(0) // local reset
  }

  // User Selection
  const handleCheckbox = (id: Id) => {
  setSelectedOptions((prev: MedicalSummarySelectedOptions) => {
    const selected = prev.User.includes(id)
      ? prev.User.filter((item: Id) => item !== id)
      : [...prev.User, id]

    const updated: MedicalSummarySelectedOptions = {
      ...prev,
      User: selected
    }

    setDrawerCount(calculateFilterCount(updated))

    return updated
  })
}

  const handleSelectAll = () => {
    setSelectedOptions((prev) => {
      const allIds = menuData.User.map((item: any) => item.value)
      const isAllSelected = prev.User.length === allIds.length
      const updatedUsers = isAllSelected ? [] : allIds

      const updated = { ...prev, User: updatedUsers }
      setDrawerCount(calculateFilterCount(updated)) // local only

      return updated
    })
  }

  // Medical Type Selection
  const handleRadioChange = (value: string) => {
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
          placeholder={(t('hospital_module.search_user') as string)}
        />
      )}
    </CustomFilterDrawer>
  )
}

export default MedicalSummaryFilterDrawer
