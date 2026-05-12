import React, { useCallback, useState, useEffect } from 'react'
import { Box, Typography, Checkbox, Divider, IconButton, Avatar } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import Search from 'src/views/utility/Search'
import Icon from 'src/@core/components/icon'

const FILTER_MENUS = [
  'Site, Sec or Encl.',
  'Gender',
  'Breed',
  'Cause of Death',
  'Approval Status',
  'Necropsy Taken',
  'Necropsy Status',
  'Reported by'
]

// TODO: Replace with real API data
const FILTER_MASTER_DATA: Record<string, { label: string; value: string }[]> = {
  Gender: [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Undetermined', value: 'undetermined' },
    { label: 'Indeterminate', value: 'indeterminate' }
  ],
  Breed: [
    { label: 'Military Macaw', value: 'military_macaw' },
    { label: 'Blue Morph', value: 'blue_morph' },
    { label: 'Red Macaw', value: 'red_macaw' }
  ],
  'Cause of Death': [
    { label: 'Natural', value: 'natural' },
    { label: 'Organ Failure', value: 'organ_failure' },
    { label: 'Old Age', value: 'old_age' },
    { label: 'Disease', value: 'disease' },
    { label: 'Euthanasia', value: 'euthanasia' }
  ],
  'Approval Status': [
    { label: 'Approved', value: 'approved' },
    { label: 'Pending', value: 'pending' },
    { label: 'Rejected', value: 'rejected' }
  ],
  'Necropsy Taken': [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' }
  ],
  'Necropsy Status': [
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Draft', value: 'draft' }
  ],
  'Reported by': [
    { label: 'Jordan Stevenson', value: 'jordan_stevenson' },
    { label: 'Admin User', value: 'admin_user' }
  ]
}

const SITES_DATA = [
  { id: 1, name: 'Pine Valley', image: '' },
  { id: 2, name: 'Hillcrest Center', image: '' }
]

export interface MortalityFilterOptions {
  sites: string[]
  Gender: string[]
  Breed: string[]
  'Cause of Death': string[]
  'Approval Status': string[]
  'Necropsy Taken': string[]
  'Necropsy Status': string[]
  'Reported by': string[]
}

const EMPTY_FILTERS: MortalityFilterOptions = {
  sites: [],
  Gender: [],
  Breed: [],
  'Cause of Death': [],
  'Approval Status': [],
  'Necropsy Taken': [],
  'Necropsy Status': [],
  'Reported by': []
}

interface MortalityFilterDrawerProps {
  open: boolean
  onClose: () => void
  onApplyFilters: (filters: MortalityFilterOptions) => void
  setFilterCount: (count: number) => void
  initialSelectedOptions?: MortalityFilterOptions
}

const MortalityFilterDrawer: React.FC<MortalityFilterDrawerProps> = ({
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
  const [selectedOptions, setSelectedOptions] = useState<MortalityFilterOptions>({ ...EMPTY_FILTERS })

  // Sub-drawer for site selection
  const [subDrawerOpen, setSubDrawerOpen] = useState(false)
  const [subDrawerSearch, setSubDrawerSearch] = useState('')
  const [tempSelection, setTempSelection] = useState<string[]>([])

  const calculateFilterCount = useCallback((options: MortalityFilterOptions) => {
    return Object.values(options).reduce((count, arr) => count + arr.length, 0)
  }, [])

  const handleMenuClick = useCallback((menuName: string) => {
    setSelectedMenu(menuName)
    setSearchQuery('')
  }, [])

  const handleCheckbox = useCallback(
    (value: string, menuName: string) => {
      const key = menuName as keyof MortalityFilterOptions
      setSelectedOptions(prev => {
        const current = prev[key]
        const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
        const newOptions = { ...prev, [key]: updated }
        setLocalFilterCount(calculateFilterCount(newOptions))

        return newOptions
      })
    },
    [calculateFilterCount]
  )

  const handleSelectAll = useCallback(
    (menuName: string) => {
      const key = menuName as keyof MortalityFilterOptions
      const items = getFilteredItems(menuName)
      setSelectedOptions(prev => {
        const allValues = items.map(item => item.value)
        const isAll = allValues.every(v => prev[key].includes(v))
        const updated = isAll ? prev[key].filter(v => !allValues.includes(v)) : [...new Set([...prev[key], ...allValues])]
        const newOptions = { ...prev, [key]: updated }
        setLocalFilterCount(calculateFilterCount(newOptions))

        return newOptions
      })
    },
    [calculateFilterCount, searchQuery]
  )

  const handleRemoveChip = useCallback(
    (value: string) => {
      setSelectedOptions(prev => {
        const updated = prev.sites.filter(v => v !== value)
        const newOptions = { ...prev, sites: updated }
        setLocalFilterCount(calculateFilterCount(newOptions))

        return newOptions
      })
    },
    [calculateFilterCount]
  )

  // Site sub-drawer
  const openSiteDrawer = () => {
    setTempSelection([...selectedOptions.sites])
    setSubDrawerSearch('')
    setSubDrawerOpen(true)
  }

  const handleSubDrawerToggle = (value: string) => {
    setTempSelection(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]))
  }

  const handleSubDrawerContinue = () => {
    setSelectedOptions(prev => {
      const newOptions = { ...prev, sites: tempSelection }
      setLocalFilterCount(calculateFilterCount(newOptions))

      return newOptions
    })
    setSubDrawerOpen(false)
  }

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

  const getFilteredItems = (menuName: string) => {
    const items = FILTER_MASTER_DATA[menuName] || []
    if (!searchQuery) return items

    return items.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  const isAllSelected = (menuName: string) => {
    const items = getFilteredItems(menuName)
    const key = menuName as keyof MortalityFilterOptions

    return items.length > 0 && items.every(item => selectedOptions[key].includes(item.value))
  }

  useEffect(() => {
    if (open && initialSelectedOptions) {
      setSelectedOptions(initialSelectedOptions)
      setLocalFilterCount(calculateFilterCount(initialSelectedOptions))
    }
  }, [open, initialSelectedOptions, calculateFilterCount])

  const badgeSelectedOptions: Record<string, string[]> = {
    'Site, Sec or Encl.': selectedOptions.sites,
    Gender: selectedOptions.Gender,
    Breed: selectedOptions.Breed,
    'Cause of Death': selectedOptions['Cause of Death'],
    'Approval Status': selectedOptions['Approval Status'],
    'Necropsy Taken': selectedOptions['Necropsy Taken'],
    'Necropsy Status': selectedOptions['Necropsy Status'],
    'Reported by': selectedOptions['Reported by']
  }

  // Render site selection
  const renderLocationFilter = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%', overflowY: 'auto' }}>
      <Box
        onClick={openSiteDrawer}
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
      {selectedOptions.sites.map(siteId => {
        const site = SITES_DATA.find(s => String(s.id) === siteId)

        return (
          <Box
            key={siteId}
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
            <Typography variant='body2'>{site?.name || siteId}</Typography>
            <IconButton size='small' onClick={() => handleRemoveChip(siteId)}>
              <Icon icon='mdi:close-circle' fontSize={18} color={theme.palette.customColors.Tertiary} />
            </IconButton>
          </Box>
        )
      })}
    </Box>
  )

  // Render checkbox filter
  const renderCheckboxFilter = (menuName: string) => {
    const items = getFilteredItems(menuName)
    const key = menuName as keyof MortalityFilterOptions
    const current = selectedOptions[key]
    const allSelected = isAllSelected(menuName)

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Checkbox
              checked={allSelected}
              indeterminate={current.length > 0 && !allSelected}
              onChange={() => handleSelectAll(menuName)}
            />
            <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.Outline }}>Select All</Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', gap: 3, flexDirection: 'column' }}>
            {items.map(item => (
              <Box key={item.value} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox checked={current.includes(item.value)} onChange={() => handleCheckbox(item.value, menuName)} />
                <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    )
  }

  // Site sub-drawer (bottom half panel)
  const renderSubDrawer = () => {
    if (!subDrawerOpen) return null
    const filtered = SITES_DATA.filter(s => !subDrawerSearch || s.name.toLowerCase().includes(subDrawerSearch.toLowerCase()))
    const allValues = filtered.map(s => String(s.id))
    const isAll = allValues.length > 0 && allValues.every(v => tempSelection.includes(v))

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 4, px: 5, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Icon icon='mdi:home-outline' fontSize={24} />
            <Typography sx={{ fontSize: '1.125rem', fontWeight: 500 }}>Choose Site</Typography>
          </Box>
          <IconButton size='small' onClick={() => setSubDrawerOpen(false)}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>
        <Box sx={{ px: 5, mb: 2 }}>
          <Search
            value={subDrawerSearch}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubDrawerSearch(e.target.value)}
            placeholder='Search'
            onClear={() => setSubDrawerSearch('')}
          />
        </Box>
        <Box sx={{ px: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontWeight: 500, fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVariant }}>
            All sites ({allValues.length})
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => setTempSelection(isAll ? [] : [...allValues])}>
            <Typography sx={{ fontSize: '0.8rem', color: theme.palette.primary.main, fontWeight: 500 }}>Select all</Typography>
            <Checkbox size='small' checked={isAll} indeterminate={tempSelection.length > 0 && !isAll} sx={{ p: 0 }} />
          </Box>
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto', px: 5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map(site => {
              const sid = String(site.id)
              const sel = tempSelection.includes(sid)

              return (
                <Box
                  key={sid}
                  onClick={() => handleSubDrawerToggle(sid)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2.5,
                    borderRadius: '8px',
                    border: `1px solid ${sel ? theme.palette.primary.main : theme.palette.customColors.OutlineVariant}`,
                    backgroundColor: sel ? alpha(theme.palette.primary.main, 0.05) : theme.palette.common.white,
                    cursor: 'pointer'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.customColors.Surface }}>
                      <Icon icon='mdi:map-marker-outline' fontSize={16} />
                    </Avatar>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>{site.name}</Typography>
                  </Box>
                  <Checkbox checked={sel} size='small' sx={{ p: 0 }} />
                </Box>
              )
            })}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, px: 5, borderTop: `1px solid ${theme.palette.divider}`, flexShrink: 0 }}>
          <Typography sx={{ color: theme.palette.primary.main, fontWeight: 500, fontSize: '0.875rem' }}>{tempSelection.length} Selected</Typography>
          <Box
            onClick={handleSubDrawerContinue}
            sx={{ backgroundColor: theme.palette.primary.main, color: theme.palette.common.white, px: 5, py: 1.5, borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
          >
            CONTINUE
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <CustomFilterDrawer
      open={open}
      onClose={onClose}
      title={localFilterCount > 0 ? `Filter - ${localFilterCount}` : 'Filter'}
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

export default MortalityFilterDrawer
