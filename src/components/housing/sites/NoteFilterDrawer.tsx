import React, { useState, useMemo, useEffect } from 'react'
import { Box, Checkbox, Typography, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useSelector } from 'react-redux'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import Search from 'src/views/utility/Search'
import type { NotesFilters, User, ObservationMasterItem } from 'src/types/housing'
import type { RootState } from 'src/store'

type FilterMenuType = 'Note Type' | 'Priority' | 'Noted By' | 'Tagged To'

const FILTER_MENUS: FilterMenuType[] = ['Note Type', 'Priority', 'Noted By', 'Tagged To']

interface FilterOption {
  value: string | number
  label: string
}

const PRIORITY_OPTIONS: FilterOption[] = [
  { value: 'Low', label: 'Low' },
  { value: 'Moderate', label: 'Moderate' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' }
]

interface LocalSelectedOptions {
  'Note Type': (string | number)[]
  Priority: (string | number)[]
  'Noted By': (string | number)[]
  'Tagged To': (string | number)[]
}

interface NoteFilterDrawerProps {
  open: boolean
  onClose: () => void
  filters: NotesFilters
  onApply: (filters: Partial<NotesFilters>) => void
  onClearAll: () => void
}

const NoteFilterDrawer: React.FC<NoteFilterDrawerProps> = ({ open, onClose, filters, onApply, onClearAll }) => {
  const theme = useTheme()
  const [selectedItem, setSelectedItem] = useState<FilterMenuType>('Note Type')
  const [searchQuery, setSearchQuery] = useState('')
  const [localSelectedOptions, setLocalSelectedOptions] = useState<LocalSelectedOptions>({
    'Note Type': [],
    Priority: [],
    'Noted By': [],
    'Tagged To': []
  })

  const { observationMasterList, observationMasterListLoading, users, usersLoading } = useSelector(
    (state: RootState) => state.notes
  )

  // Initialize local state from filters prop when drawer opens
  useEffect(() => {
    if (open) {
      setLocalSelectedOptions({
        'Note Type': filters.noteType ? [filters.noteType] : [],
        Priority: filters.priority ? [filters.priority] : [],
        'Noted By': filters.createdBy ? [filters.createdBy] : [],
        'Tagged To': filters.taggedTo ? [filters.taggedTo] : []
      })
      setSearchQuery('')
    }
  }, [open, filters])

  // Get items for current selected menu
  const getCurrentItems = useMemo((): FilterOption[] => {
    let items: FilterOption[] = []

    switch (selectedItem) {
      case 'Note Type':
        items =
          observationMasterList?.map((type: ObservationMasterItem) => ({
            value: type.id,
            label: (type as any).type_name || type.name
          })) || []
        break
      case 'Priority':
        items = PRIORITY_OPTIONS
        break
      case 'Noted By':
      case 'Tagged To':
        items =
          users?.map((user: User) => ({
            value: user.user_id,
            label: user.user_name || ''
          })) || []
        break
      default:
        items = []
    }

    // Filter by search query
    if (searchQuery) {
      items = items.filter(item => item.label?.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    return items
  }, [selectedItem, observationMasterList, users, searchQuery])

  const handleSelectItem = (item: string) => {
    setSelectedItem(item as FilterMenuType)
    setSearchQuery('')
  }

  const handleOptionChange = (value: string | number, menuName: FilterMenuType) => {
    setLocalSelectedOptions(prev => {
      const currentSelections = prev[menuName] || []
      const isSelected = currentSelections.includes(value)

      // For single selection (radio-like behavior)
      return {
        ...prev,
        [menuName]: isSelected ? [] : [value]
      }
    })
  }

  const handleApply = () => {
    const appliedFilters: Partial<NotesFilters> = {
      noteType: (localSelectedOptions['Note Type']?.[0] as string) || null,
      priority: (localSelectedOptions['Priority']?.[0] as string) || null,
      createdBy: (localSelectedOptions['Noted By']?.[0] as string) || null,
      taggedTo: (localSelectedOptions['Tagged To']?.[0] as string) || null
    }
    onApply(appliedFilters)
    onClose()
  }

  const handleClearAll = () => {
    setLocalSelectedOptions({
      'Note Type': [],
      Priority: [],
      'Noted By': [],
      'Tagged To': []
    })
    onClearAll()
    onClose()
  }

  const isLoading =
    (selectedItem === 'Note Type' && observationMasterListLoading) ||
    ((selectedItem === 'Noted By' || selectedItem === 'Tagged To') && usersLoading)

  return (
    <CustomFilterDrawer
      open={open}
      onClose={onClose}
      title='Filter Notes'
      filterLists={FILTER_MENUS}
      selectedOptions={localSelectedOptions}
      selectedItem={selectedItem}
      onSelectItem={handleSelectItem}
      onApply={handleApply}
      onClearAll={handleClearAll}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ mb: 4 }}>
          <Search
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            placeholder={`Search ${selectedItem.toLowerCase()}...`}
            onClear={() => setSearchQuery('')}
          />
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            <Box sx={{ display: 'flex', gap: 3, flexDirection: 'column' }}>
              {getCurrentItems?.map(item => (
                <Box key={item.value} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Checkbox
                    checked={localSelectedOptions[selectedItem]?.includes(item.value)}
                    onChange={() => handleOptionChange(item.value, selectedItem)}
                  />
                  <Typography
                    sx={{
                      fontSize: '16px',
                      color: theme.palette.customColors?.OnSurfaceVarient                     }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              ))}

              {getCurrentItems?.length === 0 && (
                <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  No options available
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </CustomFilterDrawer>
  )
}

export default NoteFilterDrawer
