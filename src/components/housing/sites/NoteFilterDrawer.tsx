import React, { useState, useMemo, useEffect } from 'react'
import { Box, Checkbox, Typography, CircularProgress } from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import { useSelector, useDispatch } from 'react-redux'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import { useTranslation } from 'react-i18next'
import Search from 'src/views/utility/Search'
import NoDataFound from 'src/views/utility/NoDataFound'
import type { NotesFilters, User } from 'src/types/housing'
import type { RootState, AppDispatch } from 'src/store'
import { fetchObservationTypes } from 'src/store/slices/housing/notesSlice'

type FilterMenuType = 'Note Type' | 'Priority' | 'Noted By' | 'Tagged To'

const FILTER_MENUS: FilterMenuType[] = ['Note Type', 'Priority', 'Noted By', 'Tagged To']

interface FilterOption {
  value: string | number
  label: string
}

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
  const theme = useTheme() as any
  const { t } = useTranslation()
  const dispatch = useDispatch<AppDispatch>()

  const PRIORITY_OPTIONS: FilterOption[] = [
    { value: 'Low', label: t('low') },
    { value: 'Moderate', label: t('moderate') },
    { value: 'High', label: t('high') },
    { value: 'Critical', label: t('critical') }
  ]

  const [selectedItem, setSelectedItem] = useState<FilterMenuType>('Note Type')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [noteTypeSearch, setNoteTypeSearch] = useState<string>('')

  const [localSelectedOptions, setLocalSelectedOptions] = useState<LocalSelectedOptions>({
    'Note Type': [],
    Priority: [],
    'Noted By': [],
    'Tagged To': []
  })

  // Multi-parent selection: map of parentId -> { parent, children[] }
  const [selectedNoteTypes, setSelectedNoteTypes] = useState<Record<string, { parent: any; children: any[] }>>({})

  const { observationTypes, observationTypesLoading, users, usersLoading } = useSelector(
    (state: RootState) => state.notes
  )

  // Split a comma-joined filter string back to an array
  const splitFilter = (val: any): (string | number)[] =>
    val ? String(val).split(',').map(s => s.trim()).filter(Boolean) : []

  // Initialize local state from filters prop when drawer opens
  useEffect(() => {
    if (!open) return

    setLocalSelectedOptions({
      'Note Type': splitFilter(filters.noteType),
      Priority: splitFilter(filters.priority),
      'Noted By': splitFilter(filters.createdBy),
      'Tagged To': splitFilter(filters.taggedTo)
    })
    setSelectedNoteTypes({})
    setSearchQuery('')
    setNoteTypeSearch('')
    setSelectedItem('Note Type') // always open with first menu selected
  }, [open, filters])

  useEffect(() => {
    if (open) {
      dispatch(fetchObservationTypes())
    }
  }, [open, dispatch])

  // Rebuild selectedNoteTypes visual state from filters.noteType once observationTypes loads
  useEffect(() => {
    if (!open || !filters.noteType || !Array.isArray(observationTypes) || observationTypes.length === 0) return

    const ids = String(filters.noteType).split(',').map(s => s.trim())
    const rebuilt: Record<string, { parent: any; children: any[] }> = {}

    for (const parent of observationTypes) {
      const parentId = String(parent.id)
      const children = parent.child_observation || []
      const selectedChildren = children.filter((child: any) => ids.includes(String(child.id)))

      if (selectedChildren.length > 0) {
        rebuilt[parentId] = { parent, children: selectedChildren }
      } else if (ids.includes(parentId) && children.length === 0) {
        rebuilt[parentId] = { parent, children: [] }
      }
    }

    if (Object.keys(rebuilt).length > 0) {
      setSelectedNoteTypes(rebuilt)
    }
  }, [open, observationTypes, filters.noteType])

  // Filter observation types by search (matches parent name or child names)
  const filteredObservationTypes = useMemo(() => {
    const types = Array.isArray(observationTypes) ? observationTypes : []
    if (!noteTypeSearch.trim()) return types

    const query = noteTypeSearch.toLowerCase()
    return types
      .map((parent: any) => {
        const parentMatch = (parent.type_name || parent.name || '').toLowerCase().includes(query)
        const filteredChildren = (parent.child_observation || []).filter((child: any) =>
          (child.type_name || child.name || '').toLowerCase().includes(query)
        )
        if (parentMatch || filteredChildren.length > 0) {
          return {
            ...parent,
            child_observation: parentMatch ? parent.child_observation : filteredChildren
          }
        }
        return null
      })
      .filter(Boolean)
  }, [observationTypes, noteTypeSearch])

  // Helper: compute all selected type IDs (parent IDs for parent-only, child IDs otherwise)
  const getAllSelectedTypeIds = (noteTypes: Record<string, { parent: any; children: any[] }>) => {
    return Object.values(noteTypes).flatMap(entry =>
      entry.children.length > 0 ? entry.children.map((c: any) => c.id) : [entry.parent.id]
    )
  }

  const handleChildTypeToggle = (parent: any, child: any) => {
    const parentId = String(parent.id)
    const childId = String(child.id)

    setSelectedNoteTypes(prev => {
      const updated = { ...prev }
      const entry = updated[parentId]

      if (entry) {
        const alreadySelected = entry.children.some((c: any) => String(c.id) === childId)
        if (alreadySelected) {
          const filteredChildren = entry.children.filter((c: any) => String(c.id) !== childId)
          if (filteredChildren.length === 0) {
            delete updated[parentId]
          } else {
            updated[parentId] = { ...entry, children: filteredChildren }
          }
        } else {
          updated[parentId] = { ...entry, children: [...entry.children, child] }
        }
      } else {
        updated[parentId] = { parent, children: [child] }
      }

      setLocalSelectedOptions(prev => ({ ...prev, 'Note Type': getAllSelectedTypeIds(updated) }))
      return updated
    })
  }

  const handleParentTypeToggle = (parent: any) => {
    const parentId = String(parent.id)
    const children = parent.child_observation || []

    setSelectedNoteTypes(prev => {
      const updated = { ...prev }
      const entry = updated[parentId]

      if (entry) {
        delete updated[parentId]
      } else {
        updated[parentId] = { parent, children: [...children] }
      }

      setLocalSelectedOptions(prev => ({ ...prev, 'Note Type': getAllSelectedTypeIds(updated) }))
      return updated
    })
  }

  // Get items for current selected menu
  const getCurrentItems = useMemo((): FilterOption[] => {
    let items: FilterOption[] = []

    switch (selectedItem) {
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
  }, [selectedItem, users, searchQuery, PRIORITY_OPTIONS])

  const handleSelectItem = (item: string) => {
    setSelectedItem(item as FilterMenuType)
    setSearchQuery('')
    setNoteTypeSearch('')
  }

  const handleOptionChange = (value: string | number, menuName: FilterMenuType) => {
    setLocalSelectedOptions(prev => {
      const currentSelections = prev[menuName] || []
      const isSelected = currentSelections.includes(value)

      return {
        ...prev,
        [menuName]: isSelected ? currentSelections.filter(x => x !== value) : [...currentSelections, value]
      }
    })
  }

  const handleApply = () => {
    const join = (arr: (string | number)[]) => (arr?.length ? arr.join(',') : null)
    const appliedFilters: Partial<NotesFilters> = {
      noteType: join(localSelectedOptions['Note Type']),
      priority: join(localSelectedOptions['Priority']),
      createdBy: join(localSelectedOptions['Noted By']),
      taggedTo: join(localSelectedOptions['Tagged To'])
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
    setSelectedNoteTypes({})
    onClearAll()
    onClose()
  }

  const isLoading =(selectedItem === 'Noted By' || selectedItem === 'Tagged To') && usersLoading

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
      {/* Note Type — hierarchical parent/child UI */}
      {selectedItem === 'Note Type' && (
        <Box
          sx={{
            overflowY: 'auto',
            minHeight: 0,
            maxHeight: '100%',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box sx={{ px: 2, pt: 2, pb: 1, flexShrink: 0 }}>
            <Search
              placeholder={t('notes_module.search_note_types') as string}
              value={noteTypeSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNoteTypeSearch(e.target.value)}
              onClear={() => setNoteTypeSearch('')}
              width='100%'
            />
          </Box>
          <Box sx={{ px: 2, py: 2, flex: 1, overflowY: 'auto' }}>
            {observationTypesLoading ? (
              <Box display='flex' justifyContent='center' py={4}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              filteredObservationTypes.map((parent: any) => {
                const parentId = String(parent.id)
                const children = parent.child_observation || []

                const parentEntry = selectedNoteTypes[parentId]
                const isParentSelected = !!parentEntry
                const allChildrenSelected =
                  isParentSelected && (children.length === 0 || parentEntry.children.length === children.length)
                const someChildrenSelected =
                  isParentSelected &&
                  children.length > 0 &&
                  parentEntry.children.length > 0 &&
                  parentEntry.children.length < children.length

                return (
                  <Box key={parentId} sx={{ mb: 4 }}>
                    {/* Parent header with checkbox */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        mb: 2
                      }}
                      onClick={() => handleParentTypeToggle(parent)}
                    >
                      <Typography
                        sx={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: theme.palette.customColors?.OnSurfaceVariant
                        }}
                      >
                        {parent.string_id
                          ? t(parent.string_id, { defaultValue: parent.type_name || parent.name || '' })
                          : parent.type_name || parent.name || ''}
                      </Typography>
                      <Checkbox
                        checked={allChildrenSelected}
                        indeterminate={someChildrenSelected}
                        onClick={e => {
                          e.stopPropagation()
                          handleParentTypeToggle(parent)
                        }}
                        sx={{
                          color: theme.palette.customColors?.OutlineVariant,
                          '&.Mui-checked': { color: theme.palette.primary.main },
                          '&.MuiCheckbox-indeterminate': { color: theme.palette.primary.main }
                        }}
                      />
                    </Box>

                    {/* Child types as full-width items */}
                    {children.length > 0 && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {children.map((child: any) => {
                          const isChildSelected = parentEntry?.children.some(
                            (c: any) => String(c.id) === String(child.id)
                          )

                          return (
                            <Box
                              key={child.id}
                              onClick={() => handleChildTypeToggle(parent, child)}
                              sx={{
                                px: 3,
                                py: 2.5,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: isChildSelected
                                  ? alpha(theme.palette.customColors?.Secondary, 0.3)
                                  : theme.palette.customColors?.displaybgPrimary
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: '14px',
                                  fontWeight: 400,
                                  color: theme.palette.customColors?.OnSurfaceVariant
                                }}
                              >
                                {child.string_id
                                  ? t(child.string_id, { defaultValue: child.type_name || child.name || '' })
                                  : child.type_name || child.name || ''}
                              </Typography>
                            </Box>
                          )
                        })}
                      </Box>
                    )}
                  </Box>
                )
              })
            )}
          </Box>
          {filteredObservationTypes?.length === 0 && (
            <Box sx={{ mx: 'auto' }}>
              <NoDataFound />
              {t('notes_module.no_note_types_found')}
            </Box>
          )}
        </Box>
      )}

      {/* Priority, Noted By, Tagged To — flat list UI (unchanged) */}
    {selectedItem !== 'Note Type' && (
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
                      color: theme.palette.customColors?.OnSurfaceVarient
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              ))}

              {getCurrentItems?.length === 0 && (
                <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  {t('no_options_available')}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Box>
    )}
  </CustomFilterDrawer>
  )
}

export default NoteFilterDrawer
