import React, { useCallback, useEffect, useState } from 'react'
import { Box, Radio, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import LineageEntityFilter, { type LocalSelections } from './LineageEntityFilter'

export interface LineageFilters {
  localSelections: LocalSelections
  statusFilter: string
}

export const DEFAULT_LINEAGE_FILTERS: LineageFilters = {
  localSelections: {
    Sites: [],
    Sections: [],
    Enclosures: []
  },
  statusFilter: 'alive'
}

interface LineageFilterDrawerProps {
  open: boolean
  onClose: () => void
  onApply: (filters: LineageFilters) => void
  initialFilters?: LineageFilters
  setFilterCount: (count: number) => void
}

const STATUS_OPTIONS = [
  { label: 'Alive', value: 'alive' },
  { label: 'Dead', value: 'dead' },
  { label: 'Missing', value: 'missing' },
  { label: 'Transferred', value: 'transferred' }
]

const LEFT_MENU = ['Entity', 'Status']

const LineageFilterDrawer: React.FC<LineageFilterDrawerProps> = ({
  open,
  onClose,
  onApply,
  initialFilters = DEFAULT_LINEAGE_FILTERS,
  setFilterCount
}) => {
  const theme = useTheme() as any

  const [selectedMenu, setSelectedMenu] = useState('Entity')
  const [localSelections, setLocalSelections] = useState<LocalSelections>(initialFilters.localSelections)
  const [statusFilter, setStatusFilter] = useState<string>(initialFilters.statusFilter)

  // Reset state when drawer opens
  useEffect(() => {
    if (open) {
      setSelectedMenu('Entity')
      setLocalSelections(initialFilters.localSelections)
      setStatusFilter(initialFilters.statusFilter)
    }
  }, [open, initialFilters])

  // Calculate selected options for badge display
  const selectedOptions: Record<string, any[]> = {
    Entity: [...localSelections.Sites, ...localSelections.Sections, ...localSelections.Enclosures],
    Status: statusFilter !== 'alive' ? [statusFilter] : [] // Don't count 'alive' as it's default
  }

  const handleMenuClick = useCallback((menuName: string) => {
    setSelectedMenu(menuName)
  }, [])

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
  }

  const handleClearAll = useCallback(() => {
    setLocalSelections({
      Sites: [],
      Sections: [],
      Enclosures: []
    })
    setStatusFilter('alive')
    setFilterCount(0)
  }, [setFilterCount])

  const calculateFilterCount = () => {
    let count = 0
    if (localSelections.Sites.length > 0) count += localSelections.Sites.length
    if (localSelections.Sections.length > 0) count += localSelections.Sections.length
    if (localSelections.Enclosures.length > 0) count += localSelections.Enclosures.length
    // Count status filter if it differs from default (alive)
    if (statusFilter !== 'alive') count++

    return count
  }

  const handleApply = () => {
    const count = calculateFilterCount()
    setFilterCount(count)
    onApply({
      localSelections,
      statusFilter
    })
    onClose()
  }

  return (
    <CustomFilterDrawer
      open={open}
      onClose={onClose}
      onApply={handleApply}
      onClearAll={handleClearAll}
      filterLists={LEFT_MENU}
      selectedOptions={selectedOptions}
      selectedItem={selectedMenu}
      onSelectItem={handleMenuClick}
      zIndex={1400}
    >
      {selectedMenu === 'Entity' && (
        <LineageEntityFilter localSelections={localSelections} setLocalSelections={setLocalSelections} />
      )}

      {selectedMenu === 'Status' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Status Options - Single Select */}
          <Box sx={{ display: 'flex', gap: 3, flexDirection: 'column' }}>
            {STATUS_OPTIONS.map(option => (
              <Box
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  p: 2,
                  borderRadius: 1,
                  backgroundColor: statusFilter === option.value ? theme.palette.primary.main + '10' : 'transparent',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  }
                }}
              >
                <Radio
                  checked={statusFilter === option.value}
                  onChange={() => handleStatusChange(option.value)}
                  sx={{ p: 0 }}
                />
                <Typography sx={{ fontSize: '16px', color: theme.palette.text.primary }}>{option.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </CustomFilterDrawer>
  )
}

export default LineageFilterDrawer
