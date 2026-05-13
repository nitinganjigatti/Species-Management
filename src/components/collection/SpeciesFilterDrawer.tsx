import React, { useCallback, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Checkbox, Divider } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import Search from 'src/views/utility/Search'

// Filter UI per design — value-list filters for Gender / Class / Order / Family / Genus.
// NOTE: /v1/species/reportv1 does not currently accept these as data filters. UI captures the
// selection so the design matches; wiring to the API is pending a backend change.
// TODO: Replace mocked option lists with real master-data API once available.
type FilterItem = { id: string | number; label: string; value: string }

const FILTER_MASTER_DATA: Record<string, FilterItem[]> = {
  Gender: [
    { id: 1, label: 'Male', value: 'male' },
    { id: 2, label: 'Female', value: 'female' },
    { id: 3, label: 'Undetermined', value: 'undetermined' },
    { id: 4, label: 'Indeterminate', value: 'indeterminate' }
  ],
  Class: [
    { id: 1, label: 'Mammalia', value: 'Mammalia' },
    { id: 2, label: 'Aves', value: 'Aves' },
    { id: 3, label: 'Reptilia', value: 'Reptilia' },
    { id: 4, label: 'Amphibia', value: 'Amphibia' },
    { id: 5, label: 'Insecta', value: 'Insecta' }
  ],
  Order: [
    { id: 1, label: 'Carnivora', value: 'Carnivora' },
    { id: 2, label: 'Primates', value: 'Primates' },
    { id: 3, label: 'Psittaciformes', value: 'Psittaciformes' },
    { id: 4, label: 'Testudines', value: 'Testudines' },
    { id: 5, label: 'Crocodilia', value: 'Crocodilia' }
  ],
  Family: [
    { id: 1, label: 'Felidae', value: 'Felidae' },
    { id: 2, label: 'Canidae', value: 'Canidae' },
    { id: 3, label: 'Elephantidae', value: 'Elephantidae' },
    { id: 4, label: 'Corvidae', value: 'Corvidae' },
    { id: 5, label: 'Ranidae', value: 'Ranidae' }
  ],
  Genus: [
    { id: 1, label: 'Panthera', value: 'Panthera' },
    { id: 2, label: 'Elephas', value: 'Elephas' },
    { id: 3, label: 'Corvus', value: 'Corvus' },
    { id: 4, label: 'Crocodylus', value: 'Crocodylus' },
    { id: 5, label: 'Aquila', value: 'Aquila' }
  ]
}

const FILTER_MENUS = ['Gender', 'Class', 'Order', 'Family', 'Genus']

export interface SpeciesFilterOptions {
  Gender: string[]
  Class: string[]
  Order: string[]
  Family: string[]
  Genus: string[]
}

export const DEFAULT_SPECIES_FILTERS: SpeciesFilterOptions = {
  Gender: [],
  Class: [],
  Order: [],
  Family: [],
  Genus: []
}

const EMPTY_FILTERS: SpeciesFilterOptions = { ...DEFAULT_SPECIES_FILTERS }

interface SpeciesFilterDrawerProps {
  open: boolean
  onClose: () => void
  onApplyFilters: (filters: SpeciesFilterOptions) => void
  setFilterCount: (count: number) => void
  initialSelectedOptions?: SpeciesFilterOptions
}

const SpeciesFilterDrawer: React.FC<SpeciesFilterDrawerProps> = ({
  open,
  onClose,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const [selectedMenu, setSelectedMenu] = useState<string>('Gender')
  const [searchQuery, setSearchQuery] = useState('')
  const [localFilterCount, setLocalFilterCount] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<SpeciesFilterOptions>({ ...EMPTY_FILTERS })

  // Calculate total filter count
  const calculateFilterCount = useCallback((options: SpeciesFilterOptions) => {
    return FILTER_MENUS.reduce((count, menu) => count + (options[menu as keyof SpeciesFilterOptions]?.length || 0), 0)
  }, [])

  // Handle menu click
  const handleMenuClick = useCallback((menuName: string) => {
    setSelectedMenu(menuName)
    setSearchQuery('')
  }, [])

  // Handle checkbox toggle
  const handleCheckbox = useCallback(
    (value: string, menuName: string) => {
      setSelectedOptions(prev => {
        const key = menuName as keyof SpeciesFilterOptions
        const current = prev[key]
        const isSelected = current.includes(value)
        const updated = isSelected ? current.filter(item => item !== value) : [...current, value]
        const newOptions = { ...prev, [key]: updated }

        setLocalFilterCount(calculateFilterCount(newOptions))

        return newOptions
      })
    },
    [calculateFilterCount]
  )

  // Filter items by search query
  const getFilteredItems = useCallback(
    (menuName: string): FilterItem[] => {
      const items = FILTER_MASTER_DATA[menuName] || []
      if (!searchQuery) return items

      return items.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
    },
    [searchQuery]
  )

  // Check if all visible items are selected
  const isAllSelected = (menuName: string) => {
    const items = getFilteredItems(menuName)
    const key = menuName as keyof SpeciesFilterOptions

    return items.length > 0 && items.every((item: FilterItem) => selectedOptions[key].includes(item.value))
  }

  // Handle select all
  const handleSelectAll = useCallback(
    (menuName: string) => {
      setSelectedOptions(prev => {
        const key = menuName as keyof SpeciesFilterOptions
        const allValues = getFilteredItems(menuName).map((item: FilterItem) => item.value)
        const allSelected = allValues.every((v: string) => prev[key].includes(v))
        const updated = allSelected
          ? prev[key].filter((v: string) => !allValues.includes(v))
          : [...new Set([...prev[key], ...allValues])]
        const newOptions = { ...prev, [key]: updated }

        setLocalFilterCount(calculateFilterCount(newOptions))

        return newOptions
      })
    },
    [calculateFilterCount, getFilteredItems]
  )

  // Handle clear all
  const handleClearAll = useCallback(() => {
    setSelectedOptions({ ...EMPTY_FILTERS })
    setLocalFilterCount(0)
    setFilterCount(0)
  }, [setFilterCount])

  // Apply filters
  const applyFilters = () => {
    setFilterCount(localFilterCount)
    onApplyFilters(selectedOptions)
    onClose()
  }

  // Initialize with initial options
  useEffect(() => {
    if (open && initialSelectedOptions) {
      setSelectedOptions(initialSelectedOptions)
      setLocalFilterCount(calculateFilterCount(initialSelectedOptions))
    }
  }, [open, initialSelectedOptions, calculateFilterCount])

  // Build badge count object
  const badgeSelectedOptions: Record<string, string[]> = FILTER_MENUS.reduce(
    (acc, menu) => {
      acc[menu] = selectedOptions[menu as keyof SpeciesFilterOptions]

      return acc
    },
    {} as Record<string, string[]>
  )

  // Render filter content for current menu
  const renderFilterContent = () => {
    const items = getFilteredItems(selectedMenu)
    const key = selectedMenu as keyof SpeciesFilterOptions
    const allSelected = isAllSelected(selectedMenu)

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ mb: 4 }}>
          <Search
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            placeholder={`Search ${selectedMenu.toLowerCase()}...`}
            onClear={() => setSearchQuery('')}
          />
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {/* Select All */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Checkbox
              checked={allSelected}
              indeterminate={selectedOptions[key].length > 0 && !allSelected}
              onChange={() => handleSelectAll(selectedMenu)}
            />
            <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.Outline }}>{t('species_module.select_all')}</Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {/* Options */}
          <Box sx={{ display: 'flex', gap: 3, flexDirection: 'column' }}>
            {items.length > 0 ? (
              items.map(item => (
                <Box key={item.value} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Checkbox
                    checked={selectedOptions[key].includes(item.value)}
                    onChange={() => handleCheckbox(item.value, selectedMenu)}
                  />
                  <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
                    {item.label}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.Outline, textAlign: 'center', py: 4 }}>
                No options found
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    )
  }

  const filterTitle = localFilterCount > 0 ? `${t('filter')} - ${localFilterCount}` : t('filter')

  return (
    <CustomFilterDrawer
      open={open}
      onClose={onClose}
      title={filterTitle}
      onApply={applyFilters}
      onClearAll={handleClearAll}
      filterLists={FILTER_MENUS}
      selectedOptions={badgeSelectedOptions}
      selectedItem={selectedMenu}
      onSelectItem={handleMenuClick}
    >
      {renderFilterContent()}
    </CustomFilterDrawer>
  )
}

export default SpeciesFilterDrawer
