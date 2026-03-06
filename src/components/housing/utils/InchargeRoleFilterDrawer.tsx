import React, { useCallback, useEffect, useState } from 'react'
import { Box, Radio, Typography, FormControlLabel, RadioGroup, CircularProgress } from '@mui/material'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import { getUsersRoleList } from 'src/lib/api/housing'
import { useAuth } from 'src/hooks/useAuth'
import { InchargeRole, InchargeRoleFilterDrawerProps, InchargeRoleFilters } from 'src/types/housing/incharge'

const LEFT_MENU = ['Role']

const DEFAULT_OPTIONS: InchargeRoleFilters = { Role: '' }

const InchargeRoleFilterDrawer: React.FC<InchargeRoleFilterDrawerProps> = ({
  open,
  onClose,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}) => {
  const [selectedMenu, setSelectedMenu] = useState<string>('Role')
  const [selectedOptions, setSelectedOptions] = useState<InchargeRoleFilters>(DEFAULT_OPTIONS)
  const [menuData, setMenuData] = useState<{ Role: InchargeRole[] }>({ Role: [] })
  const [searchLoading, setSearchLoading] = useState<boolean>(false)

  const { userData }: any = useAuth()
  const zooId = userData?.user?.zoos?.[0]?.zoo_id

  // Count active filters
  const calculateFilterCount = (filters: InchargeRoleFilters) => {
    return filters.Role ? 1 : 0
  }

  // Fetch Roles
  const fetchRoles = useCallback(async () => {
    if (!zooId) return
    setSearchLoading(true)
    try {
      const res = await getUsersRoleList()
      const roles: InchargeRole[] = Array.isArray(res?.data)
        ? res.data.map((item: any) => ({
            label: item.role_name,
            value: item.id
          }))
        : []

      // Add "All users" at the beginning
      const dataWithAll: InchargeRole[] = [{ label: 'All users', value: '' } as any, ...roles]

      setMenuData({ Role: dataWithAll })
    } catch (error: any) {
      console.error('Error fetching roles:', error?.message || error)
    } finally {
      setSearchLoading(false)
    }
  }, [zooId])

  useEffect(() => {
    if (open) {
      fetchRoles()
    }
  }, [open, fetchRoles])

  // Clear All Filters
  const handleClearAll = () => {
    setSelectedOptions(DEFAULT_OPTIONS)
  }

  // Role Selection
  const handleOptionChange = (value: string | number) => {
    setSelectedOptions({ Role: value })
  }

  const applyFilters = () => {
    if (JSON.stringify(selectedOptions) === JSON.stringify(initialSelectedOptions)) {
      onClose()

      return
    }
    const newCount = calculateFilterCount(selectedOptions)
    setFilterCount(newCount)
    onApplyFilters(selectedOptions)
    onClose()
  }

  useEffect(() => {
    if (!open) return
    const restored = initialSelectedOptions || DEFAULT_OPTIONS
    const normalized: InchargeRoleFilters = {
      ...restored,
      Role: Array.isArray(restored.Role) ? restored.Role[0] || '' : restored.Role || ''
    }
    setSelectedOptions(normalized)
  }, [open, initialSelectedOptions])

  return (
    <CustomFilterDrawer
      open={open}
      onClose={onClose}
      onApply={applyFilters}
      onClearAll={handleClearAll}
      filterLists={LEFT_MENU}
      selectedOptions={selectedOptions}
      isSubmitting={onSubmitLoading}
      selectedItem={selectedMenu}
      onSelectItem={setSelectedMenu}
    >
      {selectedMenu === 'Role' && (
        <Box sx={{ p: '0px 16px', height: '100%', overflowY: 'auto' }}>
          {searchLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <RadioGroup value={selectedOptions.Role || ''} onChange={e => handleOptionChange(e.target.value)}>
              {menuData.Role.map(item => (
                <FormControlLabel
                  key={item.value}
                  value={String(item.value)}
                  control={<Radio />}
                  label={<Typography fontSize='16px'>{item.label as string}</Typography>}
                  sx={{ mb: 2 }}
                />
              ))}
            </RadioGroup>
          )}
        </Box>
      )}
    </CustomFilterDrawer>
  )
}

export default InchargeRoleFilterDrawer
