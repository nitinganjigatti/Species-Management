import React, { useCallback, useEffect, useState } from 'react'
import { Box, Checkbox, Typography, FormControlLabel, CircularProgress } from '@mui/material'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import Search from 'src/views/utility/Search'
import { getUsersRoleList } from 'src/lib/api/housing'
import { getZooWiseSiteLists } from 'src/lib/api/hospital/inpatient'
import { useAuth } from 'src/hooks/useAuth'

type FilterMenuType = 'Site' | 'Role'

const FILTER_MENUS: FilterMenuType[] = ['Site', 'Role']

interface FilterOption {
  label: string
  value: string | number
}

export interface UserSearchFilters {
  Site: (string | number)[]
  Role: (string | number)[]
}

interface UserSearchFilterDrawerProps {
  open: boolean
  onClose: () => void
  onApplyFilters: (filters: UserSearchFilters) => void
  initialFilters?: UserSearchFilters
}

const DEFAULT_FILTERS: UserSearchFilters = { Site: [], Role: [] }

const UserSearchFilterDrawer: React.FC<UserSearchFilterDrawerProps> = ({
  open,
  onClose,
  onApplyFilters,
  initialFilters
}) => {
  const [selectedMenu, setSelectedMenu] = useState<FilterMenuType>('Site')
  const [selectedOptions, setSelectedOptions] = useState<UserSearchFilters>(DEFAULT_FILTERS)

  const [menuData, setMenuData] = useState<{ Site: FilterOption[]; Role: FilterOption[] }>({
    Site: [],
    Role: []
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { userData }: any = useAuth()
  const zooId = userData?.user?.zoos?.[0]?.zoo_id

  // Fetch sites from API
  const fetchSites = useCallback(async (query?: string) => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (query && query.trim() !== '') {
        params.q = query
      }

      const res = await getZooWiseSiteLists(params)

      const siteList: FilterOption[] =
        res?.data?.result?.length > 0
          ? res.data.result.map((item: { site_name?: string; site_id?: number }) => ({
              label: item?.site_name || '',
              value: item?.site_id || 0
            }))
          : []

      setMenuData(prev => ({ ...prev, Site: siteList }))
    } catch (error: any) {
      console.error('Error fetching sites:', error?.message || error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch roles from API
  const fetchRoles = useCallback(async () => {
    if (!zooId) return
    setLoading(true)
    try {
      const res = await getUsersRoleList()

      const roleList: FilterOption[] = Array.isArray(res?.data)
        ? res.data.map((item: any) => ({
            label: item.role_name,
            value: item.id
          }))
        : []

      setMenuData(prev => ({ ...prev, Role: roleList }))
    } catch (error: any) {
      console.error('Error fetching roles:', error?.message || error)
    } finally {
      setLoading(false)
    }
  }, [zooId])

  // Fetch data when drawer opens or menu changes
  useEffect(() => {
    if (open) {
      setSearchQuery('')
      if (selectedMenu === 'Site') {
        fetchSites()
      } else if (selectedMenu === 'Role') {
        fetchRoles()
      }
    }
  }, [open, selectedMenu, fetchSites, fetchRoles])

  // Initialize filters when drawer opens
  useEffect(() => {
    if (open) {
      const restored = initialFilters || DEFAULT_FILTERS
      setSelectedOptions({
        Site: restored.Site || [],
        Role: restored.Role || []
      })
      setSelectedMenu('Site')
    }
  }, [open, initialFilters])

  // Handle search within current menu
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (selectedMenu === 'Site') {
      fetchSites(query)
    }
  }

  // Get filtered items based on search query
  const getFilteredItems = (): FilterOption[] => {
    const items = menuData[selectedMenu] || []
    if (!searchQuery || selectedMenu === 'Site') {
      return items
    }

    return items.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  // Handle menu selection
  const handleSelectMenu = (menu: string) => {
    setSelectedMenu(menu as FilterMenuType)
    setSearchQuery('')
  }

  // Handle option toggle (multi-select)
  const handleOptionToggle = (value: string | number) => {
    setSelectedOptions(prev => {
      const current = prev[selectedMenu] || []
      const stringValue = String(value)
      const isSelected = current.some(v => String(v) === stringValue)

      const updated = isSelected
        ? current.filter(v => String(v) !== stringValue)
        : [...current, value]

      return { ...prev, [selectedMenu]: updated }
    })
  }

  // Apply filters
  const handleApply = () => {
    onApplyFilters(selectedOptions)
    onClose()
  }

  // Clear all filters
  const handleClearAll = () => {
    setSelectedOptions(DEFAULT_FILTERS)
  }

  const filteredItems = getFilteredItems()

  return (
    <CustomFilterDrawer
      open={open}
      onClose={onClose}
      title='Filter Users'
      onApply={handleApply}
      onClearAll={handleClearAll}
      filterLists={FILTER_MENUS}
      selectedOptions={selectedOptions}
      selectedItem={selectedMenu}
      onSelectItem={handleSelectMenu}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ mb: 3 }}>
          <Search
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            placeholder={`Search ${selectedMenu.toLowerCase()}...`}
            onClear={() => handleSearch('')}
          />
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            filteredItems.map(item => {
              const isSelected = selectedOptions[selectedMenu]?.some(v => String(v) === String(item.value))

              return (
                <FormControlLabel
                  key={item.value}
                  control={
                    <Checkbox
                      checked={!!isSelected}
                      onChange={() => handleOptionToggle(item.value)}
                    />
                  }
                  label={<Typography fontSize='16px'>{item.label}</Typography>}
                  sx={{ mb: 2, display: 'flex' }}
                />
              )
            })
          )}

          {!loading && filteredItems.length === 0 && (
            <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
              No {selectedMenu.toLowerCase()} found
            </Typography>
          )}
        </Box>
      </Box>
    </CustomFilterDrawer>
  )
}

export default UserSearchFilterDrawer
