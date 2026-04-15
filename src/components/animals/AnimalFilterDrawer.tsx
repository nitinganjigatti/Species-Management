import React, { useCallback, useState, useEffect } from 'react'
import { Box, Typography, Checkbox } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import Search from 'src/views/utility/Search'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'

// Filter configuration matching mobile implementation
const FILTER_MASTER_DATA = {
  Gender: [
    { id: 1, labelKey: 'male', value: 'male' },
    { id: 2, labelKey: 'female', value: 'female' },
    { id: 3, labelKey: 'undetermined', value: 'undetermined' },
    { id: 4, labelKey: 'indeterminate', value: 'indeterminate' }
  ],
  'Animal Type': [
    { id: 1, labelKey: 'single', value: 'single' },
    { id: 2, labelKey: 'group', value: 'group' }
  ]
}

interface FilterDates {
  startDate: Date | string | null
  endDate: Date | string | null
}

interface SelectedOptions {
  Gender: string[]
  'Accession Date': FilterDates
  'Animal Type': string
}

interface AnimalFilterDrawerProps {
  open: boolean
  onClose: () => void
  onApplyFilters: (filters: SelectedOptions) => void
  setFilterCount: (count: number) => void
  initialSelectedOptions?: SelectedOptions
}

const AnimalFilterDrawer: React.FC<AnimalFilterDrawerProps> = ({
  open,
  onClose,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const [selectedMenu, setSelectedMenu] = useState('Gender')
  const [searchQuery, setSearchQuery] = useState('')
  const [localFilterCount, setLocalFilterCount] = useState(0)

  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
    Gender: [],
    'Accession Date': { startDate: null, endDate: null },
    'Animal Type': ''
  })

  const leftMenu = ['Gender', 'Accession Date', 'Animal Type']
  const filterLabels: Record<string, string> = {
    Gender: t('gender'),
    'Accession Date': t('accession_date'),
    'Animal Type': t('animal_type')
  }

  // Calculate filter count
  const calculateFilterCount = useCallback((options: SelectedOptions) => {
    let count = 0
    count += options.Gender.length
    if (options['Accession Date'].startDate && options['Accession Date'].endDate) {
      count += 1
    }
    if (options['Animal Type']) {
      count += 1
    }
    return count
  }, [])

  // Handle menu click
  const handleMenuClick = useCallback((menuName: string) => {
    setSelectedMenu(menuName)
    setSearchQuery('')
  }, [])

  // Handle checkbox for Gender filter
  const handleCheckbox = useCallback(
    (value: string) => {
      setSelectedOptions(prevOptions => {
        const isSelected = prevOptions.Gender.includes(value)
        const newGender = isSelected
          ? prevOptions.Gender.filter(item => item !== value)
          : [...prevOptions.Gender, value]

        const newOptions = {
          ...prevOptions,
          Gender: newGender
        }
        setLocalFilterCount(calculateFilterCount(newOptions))
        return newOptions
      })
    },
    [calculateFilterCount]
  )

  // Handle radio for Animal Type filter
  const handleAnimalTypeChange = useCallback(
    (value: string) => {
      setSelectedOptions(prevOptions => {
        const newOptions = {
          ...prevOptions,
          'Animal Type': prevOptions['Animal Type'] === value ? '' : value
        }
        setLocalFilterCount(calculateFilterCount(newOptions))
        return newOptions
      })
    },
    [calculateFilterCount]
  )

  // Handle date range change
  const handleDateRangeChange = useCallback(
    (startDate: Date | string, endDate: Date | string) => {
      setSelectedOptions(prevOptions => {
        const newOptions = {
          ...prevOptions,
          'Accession Date': { startDate, endDate }
        }
        setLocalFilterCount(calculateFilterCount(newOptions))
        return newOptions
      })
    },
    [calculateFilterCount]
  )

  // Handle clear all
  const handleClearAll = useCallback(() => {
    const emptyOptions: SelectedOptions = {
      Gender: [],
      'Accession Date': { startDate: null, endDate: null },
      'Animal Type': ''
    }
    setSelectedOptions(emptyOptions)
    setLocalFilterCount(0)
    setFilterCount(0)
  }, [setFilterCount])

  // Apply filters
  const applyFilters = () => {
    setFilterCount(localFilterCount)
    onApplyFilters(selectedOptions)
    onClose()
  }

  // Filter items by search query
  const getFilteredItems = (menuName: 'Gender' | 'Animal Type') => {
    const items = FILTER_MASTER_DATA[menuName]
    if (!searchQuery) return items
    return items.filter(item => t(item.labelKey).toLowerCase().includes(searchQuery.toLowerCase()))
  }

  // Initialize with initial options
  useEffect(() => {
    if (open && initialSelectedOptions) {
      setSelectedOptions(initialSelectedOptions)
      setLocalFilterCount(calculateFilterCount(initialSelectedOptions))
    }
  }, [open, initialSelectedOptions, calculateFilterCount])

  // Build custom selectedOptions object for badge display
  const badgeSelectedOptions: Record<string, string[]> = {
    Gender: selectedOptions.Gender,
    'Accession Date':
      selectedOptions['Accession Date'].startDate && selectedOptions['Accession Date'].endDate ? ['selected'] : [],
    'Animal Type': selectedOptions['Animal Type'] ? [selectedOptions['Animal Type']] : []
  }

  return (
    <CustomFilterDrawer
      open={open}
      onClose={onClose}
      onApply={applyFilters}
      onClearAll={handleClearAll}
      filterLists={leftMenu}
      filterLabels={filterLabels}
      selectedOptions={badgeSelectedOptions}
      selectedItem={selectedMenu}
      onSelectItem={handleMenuClick}
    >
      {/* Gender Filter */}
      {selectedMenu === 'Gender' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ mb: 4 }}>
            <Search
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder={`${t('search_gender')}...`}
              onClear={() => setSearchQuery('')}
            />
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            <Box sx={{ display: 'flex', gap: 3, flexDirection: 'column' }}>
              {getFilteredItems('Gender').map(item => (
                <Box key={item.value} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Checkbox
                    checked={selectedOptions.Gender.includes(item.value)}
                    onChange={() => handleCheckbox(item.value)}
                  />
                  <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
                    {t(item.labelKey)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* Accession Date Filter */}
      {selectedMenu === 'Accession Date' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.Outline, mb: 3 }}>
            {t('animals_module.select_date_range_accession')}
          </Typography>
          <CommonDateRangePickers
            onChange={handleDateRangeChange}
            filterDates={{
              startDate: selectedOptions['Accession Date'].startDate,
              endDate: selectedOptions['Accession Date'].endDate
            }}
            showFutureDates={false}
            showAllTime={true}
          />
          {selectedOptions['Accession Date'].startDate && selectedOptions['Accession Date'].endDate && (
            <Box sx={{ mt: 4, p: 3, backgroundColor: theme.palette.customColors.Background, borderRadius: 1 }}>
              <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}>
                {t('animals_module.selected_range')}:{' '}
                <strong>
                  {format(new Date(selectedOptions['Accession Date'].startDate), 'dd MMM yyyy')} -{' '}
                  {format(new Date(selectedOptions['Accession Date'].endDate), 'dd MMM yyyy')}
                </strong>
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Animal Type Filter */}
      {selectedMenu === 'Animal Type' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ mb: 4 }}>
            <Search
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder={`${t('search_animal_type')}...`}
              onClear={() => setSearchQuery('')}
            />
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            <Box sx={{ display: 'flex', gap: 3, flexDirection: 'column' }}>
              {getFilteredItems('Animal Type').map(item => (
                <Box key={item.value} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Checkbox
                    checked={selectedOptions['Animal Type'] === item.value}
                    onChange={() => handleAnimalTypeChange(item.value)}
                  />
                  <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
                    {t(item.labelKey)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </CustomFilterDrawer>
  )
}

export default AnimalFilterDrawer
