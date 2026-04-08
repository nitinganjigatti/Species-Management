'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Radio, Typography, FormControlLabel, RadioGroup, Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import Utility from 'src/utility'
import { useTranslation } from 'react-i18next'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'

const LEFT_MENU = ['Gender', 'Accession Date', 'Animal Type']

interface FilterDates {
  startDate: Date | string | null
  endDate: Date | string | null
}

interface SelectedOptions {
  Gender: string[]
  'Animal Type': string[]
  'Accession Date': FilterDates
}

interface AddNotesFilterDrawerProps {
  open: boolean
  onClose: () => void
  onSubmitLoading: boolean
  onApplyFilters: (filters: any) => void
  setFilterCount: (count: number) => void
  initialSelectedOptions?: any
}

const DEFAULT_OPTIONS: SelectedOptions = {
  Gender: [],
  'Animal Type': [],
  'Accession Date': { startDate: null, endDate: null }
}

const AddNotesFilterDrawer = ({
  open,
  onClose,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}: AddNotesFilterDrawerProps) => {
  const { t } = useTranslation()
  const theme = useTheme()

  const [selectedMenu, setSelectedMenu] = useState('Gender')
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>(DEFAULT_OPTIONS)
  const [searchQuery, setSearchQuery] = useState('')
  const [localFilterCount, setLocalFilterCount] = useState(0)

  const filterLabels: Record<string, string> = {
    Gender: t('gender'),
    'Accession Date': t('accession_date'),
    'Animal Type': t('animal_type')
  }

  const GENDER_OPTIONS = [
    { label: t('male'), value: 'male' },
    { label: t('female'), value: 'female' },
    { label: t('undetermined'), value: 'undetermined' },
    { label: t('indeterminate'), value: 'indeterminate' }
  ]

  const ANIMAL_TYPE_OPTIONS = [
    { label: t('single'), value: 'single' },
    { label: t('group'), value: 'group' }
  ]

  const calculateCount = useCallback((filters: SelectedOptions) => {
    let count = 0
    count += filters.Gender?.length || 0
    if (filters['Animal Type']?.length) count += 1
    if (filters['Accession Date']?.startDate && filters['Accession Date']?.endDate) {
      count += 1
    }
    return count
  }, [])

  const handleSearch = (query: string) => setSearchQuery(query)

  const handleGenderChange = (id: string) => {
    setSelectedOptions(prev => {
      const updated = prev.Gender.includes(id) ? prev.Gender.filter(x => x !== id) : [...prev.Gender, id]

      const newOptions = { ...prev, Gender: updated }
      setLocalFilterCount(calculateCount(newOptions))
      return newOptions
    })
  }

  const filteredGenderOptions = useMemo(() => {
    if (!searchQuery) return GENDER_OPTIONS

    return GENDER_OPTIONS.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery])

  const handleRadioChange = (menu: string, value: string) => {
    setSelectedOptions(prev => {
      const newOptions = {
        ...prev,
        [menu]: value ? [value] : []
      }
      setLocalFilterCount(calculateCount(newOptions))
      return newOptions
    })
  }

  const handleDateRangeChange = (startDate: Date | string, endDate: Date | string) => {
    setSelectedOptions(prev => {
      const newOptions = {
        ...prev,
        'Accession Date': { startDate, endDate }
      }
      setLocalFilterCount(calculateCount(newOptions))
      return newOptions
    })
  }

  const applyFilters = () => {
    setFilterCount(localFilterCount)

    const accessionDatePreset = selectedOptions['Accession Date']

    onApplyFilters({
      gender: selectedOptions.Gender,
      animal_type: selectedOptions['Animal Type']?.[0] || null,
      accession_start_date: accessionDatePreset.startDate
        ? Utility.formatDate(new Date(accessionDatePreset.startDate))
        : null,
      accession_end_date: accessionDatePreset.endDate ? Utility.formatDate(new Date(accessionDatePreset.endDate)) : null
    })

    onClose()
  }

  const handleClearAll = () => {
    setSelectedOptions(DEFAULT_OPTIONS)
    setLocalFilterCount(0)
    setFilterCount(0)
  }

  const badgeSelectedOptions: Record<string, string[]> = {
    Gender: selectedOptions.Gender,
    'Animal Type': selectedOptions['Animal Type'],
    'Accession Date':
      selectedOptions['Accession Date']?.startDate && selectedOptions['Accession Date']?.endDate ? ['selected'] : []
  }

  useEffect(() => {
    if (!open) return

    const restored = initialSelectedOptions || {}

    const normalized: SelectedOptions = {
      Gender: restored?.Gender || [],
      'Animal Type': restored?.['Animal Type'] || [],
      'Accession Date': {
        startDate: restored?.['Accession Date']?.startDate || restored?.accession_start_date || null,
        endDate: restored?.['Accession Date']?.endDate || restored?.accession_end_date || null
      }
    }

    setSelectedOptions(normalized)
    setLocalFilterCount(calculateCount(normalized))
    setSelectedMenu('Gender')
  }, [open, initialSelectedOptions, calculateCount])

  return (
    <CustomFilterDrawer
      open={open}
      onClose={onClose}
      onApply={applyFilters}
      onClearAll={handleClearAll}
      filterLists={LEFT_MENU}
      filterLabels={filterLabels}
      selectedOptions={badgeSelectedOptions}
      selectedItem={selectedMenu}
      onSelectItem={setSelectedMenu}
      isSubmitting={onSubmitLoading}
    >
      {selectedMenu === 'Gender' && (
        <FilterContent
          menuName='Gender'
          searchQuery={searchQuery}
          onSearch={handleSearch}
          selectedOptions={selectedOptions.Gender}
          onOptionChange={handleGenderChange}
          items={filteredGenderOptions}
          placeholder={t('search_gender')}
        />
      )}

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

      {selectedMenu === 'Accession Date' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.Outline, mb: 3 }}>
            {t('select_date_range_accession')}
          </Typography>

          <CommonDateRangePickers
            key={`${selectedOptions['Accession Date']?.startDate}-${selectedOptions['Accession Date']?.endDate}`}
            onChange={handleDateRangeChange}
            filterDates={{
              startDate: selectedOptions['Accession Date']?.startDate,
              endDate: selectedOptions['Accession Date']?.endDate
            }}
            showFutureDates={false}
            showAllTime={true}
          />

          {selectedOptions['Accession Date']?.startDate && selectedOptions['Accession Date']?.endDate && (
            <Box sx={{ mt: 4, p: 3, backgroundColor: theme.palette.customColors.Background, borderRadius: 1 }}>
              <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}>
                {t('selected_range')}:{' '}
                <strong>
                  {Utility.formatDate(selectedOptions['Accession Date'].startDate)} -{' '}
                  {Utility.formatDate(selectedOptions['Accession Date'].endDate)}
                </strong>
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </CustomFilterDrawer>
  )
}

export default AddNotesFilterDrawer
