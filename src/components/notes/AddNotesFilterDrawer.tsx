'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Radio, Typography, FormControlLabel, RadioGroup } from '@mui/material'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import Utility from 'src/utility'

const LEFT_MENU = ['Gender', 'Accession Date', 'Animal Type']

interface SelectedOptions {
  Gender: string[]
  'Animal Type': string[]
  'Accession Date': string[]
}

interface AddNotesFilterDrawerProps {
  open: boolean
  onClose: () => void
  onSubmitLoading: boolean
  onApplyFilters: (filters: any) => void
  setFilterCount: (count: number) => void
  initialSelectedOptions?: SelectedOptions
}

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Undetermined', value: 'undetermined' },
  { label: 'Indeterminate', value: 'indeterminate' }
]

const ANIMAL_TYPE_OPTIONS = [
  { label: 'Single', value: 'single' },
  { label: 'Group', value: 'group' }
]

const ACCESSION_DATE_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last_7_days' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last 3 Months', value: 'last_3_months' },
  { label: 'Last 6 Months', value: 'last_6_months' },
  { label: 'All time data', value: 'all_time' }
]

const DEFAULT_OPTIONS: SelectedOptions = {
  Gender: [],
  'Animal Type': [],
  'Accession Date': []
}

// Helper function to convert date preset to start and end dates
const getDateRangeFromPreset = (preset: string) => {
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  switch (preset) {
    case 'today':
      return {
        start_date: Utility.formatDate(startOfToday),
        end_date: Utility.formatDate(endOfToday)
      }
    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const endYesterday = new Date(yesterday)
      endYesterday.setDate(endYesterday.getDate() + 1)
      return {
        start_date: Utility.formatDate(yesterday),
        end_date: Utility.formatDate(endYesterday)
      }
    }
    case 'last_7_days': {
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return {
        start_date: Utility.formatDate(sevenDaysAgo),
        end_date: Utility.formatDate(endOfToday)
      }
    }
    case 'this_month':
      return {
        start_date: Utility.formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
        end_date: Utility.formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 0))
      }
    case 'last_3_months': {
      const threeMonthsAgo = new Date(today)
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      return {
        start_date: Utility.formatDate(threeMonthsAgo),
        end_date: Utility.formatDate(endOfToday)
      }
    }
    case 'last_6_months': {
      const sixMonthsAgo = new Date(today)
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      return {
        start_date: Utility.formatDate(sixMonthsAgo),
        end_date: Utility.formatDate(endOfToday)
      }
    }
    case 'all_time':
      return {
        start_date: null,
        end_date: null
      }
    default:
      return { start_date: null, end_date: null }
  }
}

const AddNotesFilterDrawer = ({
  open,
  onClose,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}: AddNotesFilterDrawerProps) => {
  const [selectedMenu, setSelectedMenu] = useState<string>('Gender')
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>(DEFAULT_OPTIONS)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)

  // ================= FILTER COUNT =================
  const calculateCount = (filters: SelectedOptions): number => {
    return (
      (filters.Gender?.length || 0) +
      (filters['Animal Type']?.length ? 1 : 0) +
      (filters['Accession Date']?.length ? 1 : 0)
    )
  }

  // ================= SEARCH =================
  const handleSearch = (query: string): void => {
    setSearchQuery(query)
  }

  // ================= GENDER CHECKBOX =================
  const handleGenderChange = (id: string): void => {
    setSelectedOptions(prev => {
      const current = prev?.Gender || []

      const updated = current.includes(id) ? current.filter(x => x !== id) : [...current, id]

      return { ...prev, Gender: updated }
    })
  }
  // Filter gender options based on search query
  const filteredGenderOptions = useMemo(() => {
    if (!searchQuery) return GENDER_OPTIONS

    return GENDER_OPTIONS.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery])

  // ================= RADIO HANDLER =================
  const handleRadioChange = (menu: string, value: string): void => {
    setSelectedOptions(prev => ({
      ...prev,
      [menu]: value ? [value] : []
    }))
  }

  // ================= APPLY =================
  const applyFilters = () => {
    const count = calculateCount(selectedOptions)

    setFilterCount(count)

    // Convert accession date preset to start/end dates
    const accessionDatePreset = selectedOptions['Accession Date']?.[0]
    const dateRange = accessionDatePreset
      ? getDateRangeFromPreset(accessionDatePreset)
      : { start_date: null, end_date: null }

    onApplyFilters({
      gender: selectedOptions.Gender,
      animal_type: selectedOptions['Animal Type']?.[0] || null,
      accession_date: accessionDatePreset || null, // Send the preset value
      accession_start_date: dateRange.start_date,
      accession_end_date: dateRange.end_date
    })

    onClose()
  }

  // ================= CLEAR =================
  const handleClearAll = () => {
    setSelectedOptions(DEFAULT_OPTIONS)
    setFilterCount(0)
  }

  // ================= INIT =================
  useEffect(() => {
    if (!open) return

    const restored = initialSelectedOptions || DEFAULT_OPTIONS
    setSelectedOptions(restored)

    //  always selects default
    setSelectedMenu('Gender')
  }, [open])

  // ================= UI =================
  return (
    <CustomFilterDrawer
      open={open}
      onClose={onClose}
      onApply={applyFilters}
      onClearAll={handleClearAll}
      filterLists={LEFT_MENU}
      selectedOptions={selectedOptions}
      selectedItem={selectedMenu}
      onSelectItem={setSelectedMenu}
      isSubmitting={onSubmitLoading}
    >
      {/* ================= GENDER ================= */}
      {selectedMenu === 'Gender' && (
        <FilterContent
          menuName='Gender'
          searchQuery={searchQuery}
          onSearch={handleSearch}
          selectedOptions={selectedOptions.Gender}
          onOptionChange={handleGenderChange}
          items={filteredGenderOptions}
          searchLoading={searchLoading}
          placeholder='Search gender...'
        />
      )}

      {/* ================= ANIMAL TYPE ================= */}
      {selectedMenu === 'Animal Type' && (
        <RadioGroup
          value={selectedOptions['Animal Type']?.[0] ?? ''}
          onChange={e => handleRadioChange('Animal Type', e.target.value)}
        >
          {ANIMAL_TYPE_OPTIONS.map(item => (
            <FormControlLabel
              key={item.value}
              value={item.value}
              control={<Radio />}
              label={<Typography fontSize='16px'>{item.label}</Typography>}
            />
          ))}
        </RadioGroup>
      )}

      {/* ================= ACCESSION DATE ================= */}
      {selectedMenu === 'Accession Date' && (
        <RadioGroup
          value={selectedOptions['Accession Date']?.[0] ?? ''}
          onChange={e => handleRadioChange('Accession Date', e.target.value)}
        >
          {ACCESSION_DATE_OPTIONS.map(item => (
            <FormControlLabel
              key={item.value}
              value={item.value}
              control={<Radio />}
              label={<Typography fontSize='16px'>{item.label}</Typography>}
            />
          ))}
        </RadioGroup>
      )}
    </CustomFilterDrawer>
  )
}

export default AddNotesFilterDrawer
