'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography, useTheme, Button, IconButton } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { debounce } from 'lodash'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import SelectNoteTypeDrawer from 'src/components/housing/sites/SelectNoteTypeDrawer'
import { Check } from '@mui/icons-material'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { useAuth } from 'src/hooks/useAuth'

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
  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

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

  const [observationType, setObservationType] = useState<any>(null)
  const [childTypes, setChildTypes] = useState<any[]>([])
  const [openSelectNoteTypeDrawer, setOpenSelectNoteTypeDrawer] = useState<boolean>(false)

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

  const handleSearch = (query: string) => setSearchQuery(query)
  const handleNoteTypeSelect = (result: any) => {
    const { observationType: parent, childTypes: children } = result
    setObservationType(parent)
    setChildTypes(children || [])

    const childIds = children?.map((c: any) => c.id) || []
    setSelectedOptions(prev => ({
      ...prev,
      'Note Type': childIds
    }))
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
      observationType,
      childTypes
    })

    onClose()
  }

  const handleClearAll = () => {
    setSelectedOptions(DEFAULT_OPTIONS)
    setObservationType(null)
    setChildTypes([])
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
      setObservationType(initialSelectedOptions.observationType || null)
      setChildTypes(initialSelectedOptions.childTypes || [])
    } else {
      setSelectedOptions(DEFAULT_OPTIONS)
      setObservationType(null)
      setChildTypes([])
    }

    setSelectedMenu('Note Type') //  always selects default
  }, [open, initialSelectedOptions])

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
      onSelectItem={setSelectedMenu}
      isSubmitting={onSubmitLoading}
    >
      {selectedMenu === 'Note Type' && (
        <Box
          sx={{
            // p: 4,
            overflowY: 'auto',
            minHeight: 0,
            maxHeight: '100%',
            flexGrow: 1
          }}
        >
          {observationType ? (
            <Box
              sx={{
                borderRadius: '8px',
                border: `1px solid ${theme.palette.customColors?.OutlineVariant}`,
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onClick={() => setOpenSelectNoteTypeDrawer(true)}
            >
              <Box
                sx={{
                  bgcolor: theme.palette.customColors?.Background,
                  px: 3,
                  py: 2,
                  borderBottom: `1px solid ${theme.palette.customColors?.OutlineVariant}`
                }}
              >
                <Typography
                  sx={{
                    color: theme.palette.customColors?.OnSurfaceVariant,
                    fontSize: '1rem'
                  }}
                >
                  {observationType?.type_name || observationType?.name}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {childTypes?.length > 0 && (
                  <Box sx={{ px: 2, py: 1 }}>
                    {childTypes.map(childType => (
                      <Box key={childType.id} sx={{ px: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton size='small' sx={{ color: theme.palette.primary.main }}>
                          <Check />
                        </IconButton>
                        <Typography
                          sx={{
                            color: theme.palette.customColors?.OnSurfaceVariant,
                            fontSize: '14px'
                          }}
                        >
                          {(childType as any).type_name || childType.name}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <Button
              fullWidth
              variant='contained'
              onClick={() => setOpenSelectNoteTypeDrawer(true)}
              sx={{
                py: 3
              }}
              startIcon={<Icon icon='mdi:plus' fontSize='20px' />}
            >
              {t('notes_module.select_note_type')}
            </Button>
          )}

          <SelectNoteTypeDrawer
            open={openSelectNoteTypeDrawer}
            onClose={() => setOpenSelectNoteTypeDrawer(false)}
            selectedTypes={{
              observationType: observationType || undefined,
              childTypes: childTypes
            }}
            onAddSelected={handleNoteTypeSelect}
          />
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
