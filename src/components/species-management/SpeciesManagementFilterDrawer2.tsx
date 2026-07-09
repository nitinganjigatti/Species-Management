'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Box, Typography, Checkbox, Divider } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import Search from 'src/views/utility/Search'
import Icon from 'src/@core/components/icon'
import {
  DRAWER_FILTER_KEYS,
  EMPTY_FILTERS,
  PARKED_FILTER_KEYS,
  type FilterInsights,
  type SpeciesFilters
} from 'src/views/pages/species-management/list2/speciesListing.utils'

export interface FilterOption {
  value: string
  label: string
  count: number
  /** Total animals across the species matching this option. */
  animals: number
  insights?: FilterInsights
  note?: string
}

interface SpeciesManagementFilterDrawerProps {
  open: boolean
  onClose: () => void
  /** Option lists (with counts) per live filter key, built from the loaded dataset. */
  options: Partial<Record<keyof SpeciesFilters, FilterOption[]>>
  initialFilters: SpeciesFilters
  onApply: (filters: SpeciesFilters) => void
  setFilterCount: (count: number) => void
}

const FILTER_LABELS: Record<keyof SpeciesFilters, string> = {
  Class: 'Class',
  Order: 'Order',
  Family: 'Family',
  Genus: 'Genus',
  Population: 'Population',
  Readiness: 'Breeding Readiness',
  Site: 'Site',
  Sex: 'Sex',
  Category: 'Category',
  Conservation: 'Conservation',
  CITES: 'CITES'
}

// Major facets (Category/Class/Readiness/Sex) are surfaced as upfront pills, not in the drawer.
const MENU_KEYS: (keyof SpeciesFilters)[] = [...DRAWER_FILTER_KEYS, ...PARKED_FILTER_KEYS]

/** Count only the drawer's own facets — major-facet pills carry their own state. */
const countDrawerFilters = (filters: SpeciesFilters): number =>
  DRAWER_FILTER_KEYS.reduce((n, k) => n + filters[k].length, 0)

const SpeciesManagementFilterDrawer: React.FC<SpeciesManagementFilterDrawerProps> = ({
  open,
  onClose,
  options,
  initialFilters,
  onApply,
  setFilterCount
}) => {
  const theme = useTheme()
  const cc = theme.palette.customColors as Record<string, string>

  const [selectedMenu, setSelectedMenu] = useState<keyof SpeciesFilters>(DRAWER_FILTER_KEYS[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [selected, setSelected] = useState<SpeciesFilters>({ ...EMPTY_FILTERS })

  useEffect(() => {
    if (open) {
      setSelected({ ...EMPTY_FILTERS, ...initialFilters })
      setSearchQuery('')
    }
  }, [open, initialFilters])

  const isParked = PARKED_FILTER_KEYS.includes(selectedMenu)

  const currentOptions = useMemo(() => {
    const opts = options[selectedMenu] || []
    if (!searchQuery) return opts

    return opts.filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [options, selectedMenu, searchQuery])

  const toggleOption = (value: string) => {
    setSelected(prev => {
      const current = prev[selectedMenu]
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]

      return { ...prev, [selectedMenu]: next }
    })
  }

  const allVisibleSelected =
    currentOptions.length > 0 && currentOptions.every(o => selected[selectedMenu].includes(o.value))

  const handleSelectAll = () => {
    setSelected(prev => {
      const values = currentOptions.map(o => o.value)
      const allSelected = values.every(v => prev[selectedMenu].includes(v))
      const next = allSelected
        ? prev[selectedMenu].filter(v => !values.includes(v))
        : Array.from(new Set([...prev[selectedMenu], ...values]))

      return { ...prev, [selectedMenu]: next }
    })
  }

  const handleClearAll = () => {
    // Clear only the drawer's own facets — leave the upfront pill selections intact.
    setSelected(prev => {
      const next = { ...prev }
      DRAWER_FILTER_KEYS.forEach(k => {
        next[k] = []
      })

      return next
    })
    setFilterCount(0)
  }

  const handleApply = () => {
    setFilterCount(countDrawerFilters(selected))
    onApply(selected)
    onClose()
  }

  const badgeSelectedOptions = MENU_KEYS.reduce((acc, key) => {
    acc[key] = selected[key]

    return acc
  }, {} as Record<string, string[]>)

  const renderContent = () => {
    if (isParked) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: 1.5,
            py: 8
          }}
        >
          <Icon icon='mdi:database-clock-outline' fontSize={36} color={cc.Outline} />
          <Typography variant='subtitle1' sx={{ fontWeight: 600, color: cc.OnSurfaceVariant }}>
            Data not available yet
          </Typography>
          <Typography variant='body2' sx={{ color: cc.neutralSecondary, maxWidth: 320 }}>
            {FILTER_LABELS[selectedMenu]} filtering will activate once this data is available.
          </Typography>
        </Box>
      )
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ mb: 4 }}>
          <Search
            value={searchQuery}
            placeholder={`Search ${FILTER_LABELS[selectedMenu].toLowerCase()}...`}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {currentOptions.length > 0 ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Checkbox
                  checked={allVisibleSelected}
                  indeterminate={selected[selectedMenu].length > 0 && !allVisibleSelected}
                  onChange={handleSelectAll}
                />
                <Typography variant='body1' sx={{ color: cc.Outline }}>
                  Select all
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {currentOptions.map(opt => (
                  <Box key={opt.value} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Checkbox
                        checked={selected[selectedMenu].includes(opt.value)}
                        onChange={() => toggleOption(opt.value)}
                      />
                      <Typography variant='body1' sx={{ color: cc.OnSurfaceVariant }}>
                        {opt.label}
                      </Typography>
                    </Box>
                    <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
                      {opt.count.toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          ) : (
            <Typography variant='body2' sx={{ color: cc.Outline, textAlign: 'center', py: 4 }}>
              No options found
            </Typography>
          )}
        </Box>
      </Box>
    )
  }

  const appliedCount = countDrawerFilters(selected)
  const title = appliedCount > 0 ? `Filter - ${appliedCount}` : 'Filter'

  return (
    <CustomFilterDrawer
      open={open}
      onClose={onClose}
      title={title}
      onApply={handleApply}
      onClearAll={handleClearAll}
      filterLists={MENU_KEYS as string[]}
      filterLabels={FILTER_LABELS as Record<string, string>}
      selectedOptions={badgeSelectedOptions}
      selectedItem={selectedMenu}
      onSelectItem={(item: string) => {
        setSelectedMenu(item as keyof SpeciesFilters)
        setSearchQuery('')
      }}
    >
      {renderContent()}
    </CustomFilterDrawer>
  )
}

export default SpeciesManagementFilterDrawer
