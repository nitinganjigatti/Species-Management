'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography, useTheme, Button, IconButton, Checkbox, CircularProgress } from '@mui/material'
import Icon from 'src/@core/components/icon'
import Search from 'src/views/utility/Search'
import { debounce } from 'lodash'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import { Check } from '@mui/icons-material'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { useAuth } from 'src/hooks/useAuth'
import { useSelector, useDispatch } from 'react-redux'
import { fetchObservationTypes } from 'src/store/slices/housing/notesSlice'
import type { RootState, AppDispatch } from 'src/store'

const NotesListingFilterDrawer = ({
  open,
  onClose,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions,
  activeTab
}: any) => {
  const { t } = useTranslation()
  const auth = useAuth()
  const dispatch = useDispatch<AppDispatch>()
  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id
  const { observationTypes, observationTypesLoading } = useSelector((state: RootState) => state.notes)

  const PRIORITY_OPTIONS = [
    { label: t('priority_low'), value: 'Low' },
    { label: t('priority_moderate'), value: 'Moderate' },
    { label: t('priority_high'), value: 'High' },
    { label: t('priority_critical'), value: 'Critical' }
  ]

  const LEFT_MENU = useMemo(() => {
    return activeTab === 'all_notes'
      ? [t('notes_module.note_type'), t('priority'), t('created_by'), t('tagged_to')]
      : [t('notes_module.note_type'), t('priority')]
  }, [activeTab])

  const DEFAULT_OPTIONS: { 'Note Type': any[]; Priority: any[]; 'Created By': any[]; 'Tagged To': any[] } = {
    'Note Type': [],
    Priority: [],
    'Created By': [],
    'Tagged To': []
  }

  const theme = useTheme() as any
  const [selectedMenu, setSelectedMenu] = useState<string>('Note Type')
  const [selectedOptions, setSelectedOptions] = useState(DEFAULT_OPTIONS)

  // Multi-parent selection: map of parentId -> { parent, children[] }
  const [selectedNoteTypes, setSelectedNoteTypes] = useState<Record<string, { parent: any; children: any[] }>>({})
  const [noteTypeSearch, setNoteTypeSearch] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [userList, setUserList] = useState<any[]>([])

  // filter count
  const calculateCount = (filters: any) => {
    return (
      (filters['Note Type']?.length || 0) +
      (filters['Priority']?.length || 0) +
      (filters['Created By']?.length || 0) +
      (filters['Tagged To']?.length || 0)
    )
  }

  // Filter observation types by search (matches parent name or child names)
  const filteredObservationTypes = useMemo(() => {
    const types = Array.isArray(observationTypes) ? observationTypes : []
    if (!noteTypeSearch.trim()) return types

    const query = noteTypeSearch.toLowerCase()
    return types
      .map((parent: any) => {
        const parentMatch = (parent.type_name || parent.name || '').toLowerCase().includes(query)
        const filteredChildren = (parent.child_observation || []).filter(
          (child: any) => (child.type_name || child.name || '').toLowerCase().includes(query)
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

  const handleSearch = (query: string) => setSearchQuery(query)

  // Helper: compute all selected type IDs (parent IDs for parent-only, child IDs otherwise)
  const getAllSelectedTypeIds = (noteTypes: Record<string, { parent: any; children: any[] }>) => {
    return Object.values(noteTypes).flatMap(entry =>
      entry.children.length > 0
        ? entry.children.map((c: any) => c.id)
        : [entry.parent.id]
    )
  }

  // Toggle a child type for inline note type filter
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

      setSelectedOptions(prev => ({ ...prev, 'Note Type': getAllSelectedTypeIds(updated) }))
      return updated
    })
  }

  // Toggle parent type — select/deselect parent (and all its children if any)
  const handleParentTypeToggle = (parent: any) => {
    const parentId = String(parent.id)
    const children = parent.child_observation || []

    setSelectedNoteTypes(prev => {
      const updated = { ...prev }
      const entry = updated[parentId]

      if (entry) {
        // Already selected — deselect
        delete updated[parentId]
      } else {
        // Select parent with all children (or empty children if none exist)
        updated[parentId] = { parent, children: [...children] }
      }

      setSelectedOptions(prev => ({ ...prev, 'Note Type': getAllSelectedTypeIds(updated) }))
      return updated
    })
  }

  // handle priority
  const handlePriorityChange = (value: string) => {
    setSelectedOptions(prev => {
      const current = prev?.Priority || []

      const updated = current.includes(value) ? current.filter(x => x !== value) : [...current, value]

      return { ...prev, Priority: updated }
    })
  }

  const filteredPriorityOptions = useMemo(() => {
    if (!searchQuery) return PRIORITY_OPTIONS

    return PRIORITY_OPTIONS.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery])

  const handleUserChange = (id: number, type: 'Created By' | 'Tagged To') => {
    setSelectedOptions(prev => {
      const selected = prev[type]?.includes(id) ? prev[type].filter((item: number) => item !== id) : [...prev[type], id]

      return { ...prev, [type]: selected }
    })
  }

  const fetchUsers = useCallback(
    async (query = '') => {
      try {
        setSearchLoading(true)

        const params: any = { zoo_id: zooId }
        if (query.trim()) params.q = query

        const res = await getUserList(params)

        const data = Array.isArray(res?.data)
          ? res.data.map((item: any) => ({
              label: item.user_name,
              value: item.user_id
            }))
          : []

        setUserList(data)
      } catch (error: any) {
        console.error('Error fetching users:', error?.message || error)
      } finally {
        setSearchLoading(false)
      }
    },
    [zooId]
  )

  const debouncedSearch = useCallback(
    debounce((q: string) => fetchUsers(q), 500),
    [fetchUsers]
  )

  const handleUserSearch = (query: string) => {
    setSearchQuery(query)
    debouncedSearch(query)
  }

  const applyFilters = () => {
    const count = calculateCount(selectedOptions)

    setFilterCount(count)

    onApplyFilters({
      ...selectedOptions,
      selectedNoteTypes
    })

    onClose()
  }

  const handleClearAll = () => {
    setSelectedOptions(DEFAULT_OPTIONS)
    setSelectedNoteTypes({})
  }

  useEffect(() => {
    if (!open) return

    if (initialSelectedOptions) {
      setSelectedOptions({
        'Note Type': initialSelectedOptions['Note Type'] || [],
        Priority: initialSelectedOptions['Priority'] || [],
        'Created By': initialSelectedOptions['Created By'] || [],
        'Tagged To': initialSelectedOptions['Tagged To'] || []
      })
      setSelectedNoteTypes(initialSelectedOptions.selectedNoteTypes || {})
    } else {
      setSelectedOptions(DEFAULT_OPTIONS)
      setSelectedNoteTypes({})
    }

    setSelectedMenu('Note Type') //  always selects default
  }, [open, initialSelectedOptions])

  useEffect(() => {
    if (open) {
      dispatch(fetchObservationTypes())
    }
  }, [open, dispatch])

  useEffect(() => {
    if (open && activeTab === 'all_notes') {
      fetchUsers()
    }
  }, [open, activeTab, fetchUsers])

  return (
    <CustomFilterDrawer
      open={open}
      onClose={onClose}
      onApply={applyFilters}
      onClearAll={handleClearAll}
      filterLists={LEFT_MENU}
      selectedOptions={selectedOptions}
      selectedItem={selectedMenu}
      onSelectItem={(menu: string) => {
        setSelectedMenu(menu)
        setSearchQuery('')
        setNoteTypeSearch('')
      }}
      isSubmitting={onSubmitLoading}
    >
      {selectedMenu === 'Note Type' && (
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
              const allChildrenSelected = isParentSelected && (children.length === 0 || parentEntry.children.length === children.length)
              const someChildrenSelected = isParentSelected && children.length > 0 && parentEntry.children.length > 0 && parentEntry.children.length < children.length

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
                      onClick={(e) => {
                        e.stopPropagation()
                        handleParentTypeToggle(parent)
                      }}
                      sx={{
                        color: theme.palette.customColors?.OutlineVariant,
                        '&.Mui-checked': { color: theme.palette.success.main },
                        '&.MuiCheckbox-indeterminate': { color: theme.palette.success.main }
                      }}
                    />
                  </Box>

                  {/* Child types as full-width items */}
                  {children.length > 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {children.map((child: any) => {
                        const isChildSelected = parentEntry?.children.some((c: any) => String(c.id) === String(child.id))

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
                                ? theme.palette.customColors?.displaybgPrimary
                                : theme.palette.customColors?.mdAntzNeutral,
                              border: isChildSelected
                                ? `1px solid ${theme.palette.success.main}`
                                : `1px solid ${theme.palette.customColors?.OutlineVariant}`,
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
        </Box>
      )}

      {selectedMenu === 'Priority' && (
        <FilterContent
          menuName='Priority'
          searchQuery={searchQuery}
          onSearch={handleSearch}
          selectedOptions={selectedOptions.Priority}
          onOptionChange={handlePriorityChange}
          items={filteredPriorityOptions}
          searchLoading={searchLoading}
          placeholder={`${t('search')} ${t('priority')}`}
        />
      )}

      {selectedMenu === 'Created By' && (
        <FilterContent
          menuName='Created By'
          searchQuery={searchQuery}
          onSearch={handleUserSearch}
          selectedOptions={selectedOptions['Created By']}
          onOptionChange={id => handleUserChange(id, 'Created By')}
          items={userList}
          searchLoading={searchLoading}
          placeholder={t('search_user')}
        />
      )}

      {selectedMenu === 'Tagged To' && (
        <FilterContent
          menuName='Tagged To'
          searchQuery={searchQuery}
          onSearch={handleUserSearch}
          selectedOptions={selectedOptions['Tagged To']}
          onOptionChange={id => handleUserChange(id, 'Tagged To')}
          items={userList}
          searchLoading={searchLoading}
          placeholder={t('search_user')}
        />
      )}
    </CustomFilterDrawer>
  )
}

export default NotesListingFilterDrawer
