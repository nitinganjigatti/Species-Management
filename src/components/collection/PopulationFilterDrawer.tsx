import React, { useCallback, useState, useEffect } from 'react'
import {
  Avatar,
  Box,
  Button,
  Typography,
  Checkbox,
  Divider,
  IconButton
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import Search from 'src/views/utility/Search'
import Icon from 'src/@core/components/icon'

// Filter categories
const FILTER_MENUS = ['Site, Sec or Encl.', 'Gender', 'Age', 'Life Stage', 'Identifier Type', 'Breed', 'Health Status']

// TODO: Replace with real API data
const FILTER_MASTER_DATA: Record<string, { label: string; value: string }[]> = {
  Gender: [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Undetermined', value: 'undetermined' },
    { label: 'Indeterminate', value: 'indeterminate' }
  ],
  Age: [
    { label: '0-1 years', value: '0-1' },
    { label: '1-3 years', value: '1-3' },
    { label: '3-6 years', value: '3-6' },
    { label: '6-10 years', value: '6-10' },
    { label: '10+ years', value: '10+' }
  ],
  'Life Stage': [
    { label: 'Juvenile', value: 'juvenile' },
    { label: 'Adult', value: 'adult' },
    { label: 'Senior', value: 'senior' }
  ],
  'Identifier Type': [
    { label: 'Ring Number', value: 'ring_number' },
    { label: 'Chip Number', value: 'chip_number' },
    { label: 'Name', value: 'name' }
  ],
  Breed: [
    { label: 'Ouachita Pebblesnail', value: 'ouachita_pebblesnail' },
    { label: 'Golden Pebblesnail', value: 'golden_pebblesnail' },
    { label: 'Angular Pebblesnail', value: 'angular_pebblesnail' },
    { label: 'Knotty Pebblesnail', value: 'knotty_pebblesnail' },
    { label: 'Thick-lipped Pebblesnail', value: 'thick_lipped_pebblesnail' },
    { label: 'Stocky Pebblesnail', value: 'stocky_pebblesnail' },
    { label: 'Tennessee Pebblesnail', value: 'tennessee_pebblesnail' },
    { label: 'Tallapoosa Pebblesnail', value: 'tallapoosa_pebblesnail' }
  ],
  'Health Status': [
    { label: 'Active Complaints', value: 'active_complaints' },
    { label: 'Active Diagnosis', value: 'active_diagnosis' },
    { label: 'Active Prescriptions', value: 'active_prescriptions' },
    { label: 'Active Medicines', value: 'active_medicines' }
  ]
}

// TODO: Replace with real API data
const SITES_DATA = [
  { id: 1, name: 'Gagva Site', image: '' },
  { id: 2, name: 'Form Easy', image: '' },
  { id: 3, name: 'Zoo Birds', image: '' },
  { id: 4, name: 'Queen Site', image: '' }
]

const SECTIONS_DATA = [
  { id: 1, name: 'Section 23', site_id: 1 },
  { id: 2, name: 'Section 24', site_id: 1 },
  { id: 3, name: 'Section 25', site_id: 2 }
]

const ENCLOSURES_DATA = [
  { id: 1, name: 'Encl -23', section_id: 1 },
  { id: 2, name: 'Encl -24', section_id: 1 },
  { id: 3, name: 'Encl -25', section_id: 2 }
]

export interface PopulationFilterOptions {
  sites: string[]
  sections: string[]
  enclosures: string[]
  Gender: string[]
  Age: string[]
  'Life Stage': string[]
  'Identifier Type': string[]
  Breed: string[]
  'Health Status': string[]
}

const EMPTY_FILTERS: PopulationFilterOptions = {
  sites: [],
  sections: [],
  enclosures: [],
  Gender: [],
  Age: [],
  'Life Stage': [],
  'Identifier Type': [],
  Breed: [],
  'Health Status': []
}

interface PopulationFilterDrawerProps {
  open: boolean
  onClose: () => void
  onApplyFilters: (filters: PopulationFilterOptions) => void
  setFilterCount: (count: number) => void
  initialSelectedOptions?: PopulationFilterOptions
}

const PopulationFilterDrawer: React.FC<PopulationFilterDrawerProps> = ({
  open,
  onClose,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}) => {
  const theme = useTheme() as any
  const [selectedMenu, setSelectedMenu] = useState(FILTER_MENUS[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [localFilterCount, setLocalFilterCount] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<PopulationFilterOptions>({ ...EMPTY_FILTERS })

  // Sub-drawer state for "Choose Site/Section/Enclosure"
  const [subDrawerOpen, setSubDrawerOpen] = useState(false)
  const [subDrawerType, setSubDrawerType] = useState<'sites' | 'sections' | 'enclosures'>('sites')
  const [subDrawerSearch, setSubDrawerSearch] = useState('')
  const [tempSelection, setTempSelection] = useState<string[]>([])

  // Calculate total filter count
  const calculateFilterCount = useCallback((options: PopulationFilterOptions) => {
    let count = 0
    count += options.sites.length
    count += options.sections.length
    count += options.enclosures.length
    count += options.Gender.length
    count += options.Age.length
    count += options['Life Stage'].length
    count += options['Identifier Type'].length
    count += options.Breed.length
    count += options['Health Status'].length

    return count
  }, [])

  const handleMenuClick = useCallback((menuName: string) => {
    setSelectedMenu(menuName)
    setSearchQuery('')
  }, [])

  // Toggle checkbox for a category
  const handleCheckbox = useCallback(
    (value: string, menuName: string) => {
      const key = menuName as keyof PopulationFilterOptions
      setSelectedOptions(prev => {
        const current = prev[key] as string[]
        const isSelected = current.includes(value)
        const updated = isSelected ? current.filter(item => item !== value) : [...current, value]
        const newOptions = { ...prev, [key]: updated }
        setLocalFilterCount(calculateFilterCount(newOptions))

        return newOptions
      })
    },
    [calculateFilterCount]
  )

  // Select All for a category
  const handleSelectAll = useCallback(
    (menuName: string) => {
      const key = menuName as keyof PopulationFilterOptions
      const items = getFilteredItems(menuName)
      setSelectedOptions(prev => {
        const current = prev[key] as string[]
        const allValues = items.map(item => item.value)
        const isAllSelected = allValues.every(v => current.includes(v))
        const updated = isAllSelected
          ? current.filter(v => !allValues.includes(v))
          : [...new Set([...current, ...allValues])]
        const newOptions = { ...prev, [key]: updated }
        setLocalFilterCount(calculateFilterCount(newOptions))

        return newOptions
      })
    },
    [calculateFilterCount, searchQuery]
  )

  // Remove a selected chip (for Site/Section/Enclosure)
  const handleRemoveChip = useCallback(
    (value: string, key: keyof PopulationFilterOptions) => {
      setSelectedOptions(prev => {
        const updated = (prev[key] as string[]).filter(item => item !== value)
        const newOptions = { ...prev, [key]: updated }

        // Cascade: removing site clears sections and enclosures
        if (key === 'sites') {
          newOptions.sections = []
          newOptions.enclosures = []
        }
        if (key === 'sections') {
          newOptions.enclosures = []
        }

        setLocalFilterCount(calculateFilterCount(newOptions))

        return newOptions
      })
    },
    [calculateFilterCount]
  )

  const handleClearAll = useCallback(() => {
    setSelectedOptions({ ...EMPTY_FILTERS })
    setLocalFilterCount(0)
    setFilterCount(0)
  }, [setFilterCount])

  const applyFilters = () => {
    setFilterCount(localFilterCount)
    onApplyFilters(selectedOptions)
    onClose()
  }

  // Filter items by search
  const getFilteredItems = (menuName: string) => {
    const items = FILTER_MASTER_DATA[menuName] || []
    if (!searchQuery) return items

    return items.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  const isAllSelected = (menuName: string) => {
    const items = getFilteredItems(menuName)
    const key = menuName as keyof PopulationFilterOptions
    const current = selectedOptions[key] as string[]

    return items.length > 0 && items.every(item => current.includes(item.value))
  }

  // Initialize
  useEffect(() => {
    if (open && initialSelectedOptions) {
      setSelectedOptions(initialSelectedOptions)
      setLocalFilterCount(calculateFilterCount(initialSelectedOptions))
    }
  }, [open, initialSelectedOptions, calculateFilterCount])

  // Badge counts for sidebar
  const badgeSelectedOptions: Record<string, string[]> = {
    'Site, Sec or Encl.': [
      ...selectedOptions.sites,
      ...selectedOptions.sections,
      ...selectedOptions.enclosures
    ],
    Gender: selectedOptions.Gender,
    Age: selectedOptions.Age,
    'Life Stage': selectedOptions['Life Stage'],
    'Identifier Type': selectedOptions['Identifier Type'],
    Breed: selectedOptions.Breed,
    'Health Status': selectedOptions['Health Status']
  }

  // Open sub-drawer for choosing site/section/enclosure
  const openSubDrawer = (type: 'sites' | 'sections' | 'enclosures') => {
    setSubDrawerType(type)
    setTempSelection([...selectedOptions[type]])
    setSubDrawerSearch('')
    setSubDrawerOpen(true)
  }

  const handleSubDrawerToggle = (value: string) => {
    setTempSelection(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]))
  }

  const handleSubDrawerSelectAll = (allValues: string[]) => {
    const isAll = allValues.every(v => tempSelection.includes(v))
    setTempSelection(isAll ? [] : [...allValues])
  }

  const handleSubDrawerContinue = () => {
    setSelectedOptions(prev => {
      const newOptions = { ...prev, [subDrawerType]: tempSelection }
      setLocalFilterCount(calculateFilterCount(newOptions))

      return newOptions
    })
    setSubDrawerOpen(false)
  }

  // Get items for sub-drawer based on type
  const getSubDrawerItems = () => {
    const search = subDrawerSearch.toLowerCase()
    if (subDrawerType === 'sites') {
      return SITES_DATA.filter(s => !search || s.name.toLowerCase().includes(search))
    }
    if (subDrawerType === 'sections') {
      return SECTIONS_DATA.filter(
        s => selectedOptions.sites.includes(String(s.site_id)) && (!search || s.name.toLowerCase().includes(search))
      )
    }

    return ENCLOSURES_DATA.filter(
      e =>
        selectedOptions.sections.includes(String(e.section_id)) && (!search || e.name.toLowerCase().includes(search))
    )
  }

  const subDrawerTitle =
    subDrawerType === 'sites' ? 'Choose Site' : subDrawerType === 'sections' ? 'Choose Section' : 'Choose Enclosure'

  // Render selected chips with remove button
  const renderSelectedChips = (key: 'sites' | 'sections' | 'enclosures') => {
    const dataMap =
      key === 'sites' ? SITES_DATA : key === 'sections' ? SECTIONS_DATA : ENCLOSURES_DATA

    return selectedOptions[key].map(id => {
      const item = dataMap.find(d => String(d.id) === id)

      return (
        <Box
          key={id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            borderRadius: '4px'
          }}
        >
          <Typography variant='body2'>{item?.name || id}</Typography>
          <IconButton size='small' onClick={() => handleRemoveChip(id, key)}>
            <Icon icon='mdi:close-circle' fontSize={18} color={theme.palette.customColors.Tertiary} />
          </IconButton>
        </Box>
      )
    })
  }

  // Render Site, Section, Enclosure cascading filter
  const renderLocationFilter = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%', overflowY: 'auto' }}>
      {/* Select Site button */}
      <Box
        onClick={() => openSubDrawer('sites')}
        sx={{
          border: `1px solid ${selectedOptions.sites.length > 0 ? theme.palette.primary.main : theme.palette.customColors.OutlineVariant}`,
          borderRadius: '4px',
          px: 3,
          py: 2,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.palette.common.white
        }}
      >
        <Typography sx={{ fontSize: '0.875rem', color: selectedOptions.sites.length > 0 ? theme.palette.customColors.OnSurfaceVariant : theme.palette.customColors.Outline }}>
          {selectedOptions.sites.length > 0 ? 'Selected site' : 'Select site'}
        </Typography>
        <Icon icon='mdi:chevron-down' fontSize={20} color={theme.palette.customColors.Outline} />
      </Box>
      {renderSelectedChips('sites')}

      {/* Select Section (after site selected) */}
      {selectedOptions.sites.length > 0 && (
        <>
          <Box
            onClick={() => openSubDrawer('sections')}
            sx={{
              border: `1px solid ${selectedOptions.sections.length > 0 ? theme.palette.primary.main : theme.palette.customColors.OutlineVariant}`,
              borderRadius: '4px',
              px: 3,
              py: 2,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: theme.palette.common.white
            }}
          >
            <Typography sx={{ fontSize: '0.875rem', color: selectedOptions.sections.length > 0 ? theme.palette.customColors.OnSurfaceVariant : theme.palette.customColors.Outline }}>
              {selectedOptions.sections.length > 0 ? 'Selected Section' : 'Select Section'}
            </Typography>
            <Icon icon='mdi:chevron-down' fontSize={20} color={theme.palette.customColors.Outline} />
          </Box>
          {renderSelectedChips('sections')}
        </>
      )}

      {/* Select Enclosure (after section selected) */}
      {selectedOptions.sections.length > 0 && (
        <>
          <Box
            onClick={() => openSubDrawer('enclosures')}
            sx={{
              border: `1px solid ${selectedOptions.enclosures.length > 0 ? theme.palette.primary.main : theme.palette.customColors.OutlineVariant}`,
              borderRadius: '4px',
              px: 3,
              py: 2,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: theme.palette.common.white
            }}
          >
            <Typography sx={{ fontSize: '0.875rem', color: selectedOptions.enclosures.length > 0 ? theme.palette.customColors.OnSurfaceVariant : theme.palette.customColors.Outline }}>
              {selectedOptions.enclosures.length > 0 ? 'Selected Enclosure' : 'Select Enclosure'}
            </Typography>
            <Icon icon='mdi:chevron-down' fontSize={20} color={theme.palette.customColors.Outline} />
          </Box>
          {renderSelectedChips('enclosures')}
        </>
      )}
    </Box>
  )

  // Bottom-half panel inside the filter drawer for choosing sites/sections/enclosures
  const renderSubDrawer = () => {
    if (!subDrawerOpen) return null

    const items = getSubDrawerItems()
    const allValues = items.map(item => String(item.id))
    const isAllSelected = allValues.length > 0 && allValues.every(v => tempSelection.includes(v))

    return (
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60%',
          zIndex: 10,
          backgroundColor: theme.palette.customColors.Background,
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          boxShadow: `0px -4px 20px ${alpha(theme.palette.common.black, 0.15)}`,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 4, px: 5, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Icon icon='mdi:home-outline' fontSize={24} />
            <Typography sx={{ fontSize: '1.125rem', fontWeight: 500 }}>{subDrawerTitle}</Typography>
          </Box>
          <IconButton size='small' onClick={() => setSubDrawerOpen(false)}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>

        {/* Search */}
        <Box sx={{ px: 5, mb: 2 }}>
          <Search
            value={subDrawerSearch}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubDrawerSearch(e.target.value)}
            placeholder='Search'
            onClear={() => setSubDrawerSearch('')}
          />
        </Box>

        {/* All items header + Select all */}
        <Box sx={{ px: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontWeight: 500, fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVariant }}>
            All {subDrawerType === 'sites' ? 'sites' : subDrawerType === 'sections' ? 'sections' : 'enclosures'} ({allValues.length})
          </Typography>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
            onClick={() => handleSubDrawerSelectAll(allValues)}
          >
            <Typography sx={{ fontSize: '0.8rem', color: theme.palette.primary.main, fontWeight: 500 }}>
              Select all
            </Typography>
            <Checkbox
              size='small'
              checked={isAllSelected}
              indeterminate={tempSelection.length > 0 && !isAllSelected}
              onChange={() => handleSubDrawerSelectAll(allValues)}
              sx={{ p: 0 }}
            />
          </Box>
        </Box>

        {/* Items list */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {items.map(item => {
              const itemId = String(item.id)
              const isSelected = tempSelection.includes(itemId)

              return (
                <Box
                  key={itemId}
                  onClick={() => handleSubDrawerToggle(itemId)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2.5,
                    borderRadius: '8px',
                    border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.customColors.OutlineVariant}`,
                    backgroundColor: isSelected ? alpha(theme.palette.primary.main, 0.05) : theme.palette.common.white,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={'image' in item ? (item as any).image : ''}
                      sx={{ width: 32, height: 32, bgcolor: theme.palette.customColors.Surface }}
                    >
                      <Icon icon='mdi:map-marker-outline' fontSize={16} />
                    </Avatar>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
                      {item.name}
                    </Typography>
                  </Box>
                  <Checkbox checked={isSelected} size='small' sx={{ p: 0 }} />
                </Box>
              )
            })}
          </Box>
        </Box>

        {/* Footer: count + Continue */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 3,
            px: 5,
            borderTop: `1px solid ${theme.palette.divider}`,
            flexShrink: 0
          }}
        >
          <Typography sx={{ color: theme.palette.primary.main, fontWeight: 500, fontSize: '0.875rem' }}>
            {tempSelection.length} Selected
          </Typography>
          <Button
            variant='contained'
            onClick={handleSubDrawerContinue}
            sx={{ textTransform: 'uppercase', borderRadius: '4px', px: 5 }}
          >
            Continue
          </Button>
        </Box>
      </Box>
    )
  }

  // Render checkbox list filter (Gender, Age, Life Stage, Identifier Type, Breed, Health Status)
  const renderCheckboxFilter = (menuName: string) => {
    const items = getFilteredItems(menuName)
    const key = menuName as keyof PopulationFilterOptions
    const current = selectedOptions[key] as string[]
    const allSelected = isAllSelected(menuName)

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Search (for Breed which has many options) */}
        {menuName === 'Breed' && (
          <Box sx={{ mb: 4 }}>
            <Search
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder={`Search ${menuName.toLowerCase()}...`}
              onClear={() => setSearchQuery('')}
            />
          </Box>
        )}

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {/* Select All */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Checkbox
              checked={allSelected}
              indeterminate={current.length > 0 && !allSelected}
              onChange={() => handleSelectAll(menuName)}
            />
            <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.Outline }}>Select All</Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {/* Options */}
          <Box sx={{ display: 'flex', gap: 3, flexDirection: 'column' }}>
            {items.length > 0 ? (
              items.map(item => (
                <Box key={item.value} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Checkbox
                    checked={current.includes(item.value)}
                    onChange={() => handleCheckbox(item.value, menuName)}
                  />
                  <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
                    {item.label}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography
                sx={{ fontSize: '14px', color: theme.palette.customColors.Outline, textAlign: 'center', py: 4 }}
              >
                No options found
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    )
  }

  const filterTitle = localFilterCount > 0 ? `Filter - ${localFilterCount}` : 'Filter'

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
      {selectedMenu === 'Site, Sec or Encl.' && renderLocationFilter()}
      {selectedMenu !== 'Site, Sec or Encl.' && renderCheckboxFilter(selectedMenu)}
      {renderSubDrawer()}
    </CustomFilterDrawer>
  )
}

export default PopulationFilterDrawer
