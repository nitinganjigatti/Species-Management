import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Drawer, IconButton, Button, Checkbox, Skeleton, Badge, Chip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useSelector, useDispatch } from 'react-redux'
import { useAuth } from 'src/hooks/useAuth'
import { fetchUsers } from 'src/store/slices/housing/notesSlice'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import Search from 'src/views/utility/Search'
import NoDataFound from 'src/views/utility/NoDataFound'
import Icon from 'src/@core/components/icon'
import UserSearchFilterDrawer, { UserSearchFilters } from './UserSearchFilterDrawer'
import type { User } from 'src/types/housing'
import type { RootState, AppDispatch } from 'src/store'

interface SearchUsersDrawerProps {
  open: boolean
  onClose: () => void
  selectedUsers: User[]
  onUsersSelected: (users: User[]) => void
}

const DEFAULT_FILTERS: UserSearchFilters = { Site: '', Role: '' }

const SearchUsersDrawer: React.FC<SearchUsersDrawerProps> = ({ open, onClose, selectedUsers, onUsersSelected }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const dispatch = useDispatch<AppDispatch>()
  const auth = useAuth()

  const { users, usersLoading } = useSelector((state: RootState) => state.notes)
  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

  // Local state
  const [localSelectedUsers, setLocalSelectedUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<UserSearchFilters>(DEFAULT_FILTERS)

  // Track if drawer was previously open to avoid re-fetching on every render
  const prevOpenRef = useRef(false)

  // Calculate filter count
  const filterCount = (appliedFilters.Site ? 1 : 0) + (appliedFilters.Role ? 1 : 0)

  // Fetch users with filters
  const fetchUsersWithFilters = (filters: UserSearchFilters) => {
    if (zooId) {
      dispatch(
        fetchUsers({
          zoo_id: zooId,
          site_id: filters.Site ? String(filters.Site) : undefined,
          role_id: filters.Role ? String(filters.Role) : undefined
        })
      )
    }
  }

  // Initialize local state when drawer opens (only on open transition)
  useEffect(() => {
    // Only run when drawer transitions from closed to open
    if (open && !prevOpenRef.current) {
      setLocalSelectedUsers([...selectedUsers])
      setSearchQuery('')
      setAppliedFilters(DEFAULT_FILTERS)
      if (zooId) {
        dispatch(fetchUsers({ zoo_id: zooId }))
      }
    }
    prevOpenRef.current = open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, zooId, dispatch])

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (searchQuery.trim().length < 2) return users

    const query = searchQuery.toLowerCase()

    return users.filter(user => {
      const userName = (user.user_name || '').toLowerCase()
      const fullName = (user.full_name || '').toLowerCase()
      const roleName = (user.role_name || '').toLowerCase()

      return userName.includes(query) || fullName.includes(query) || roleName.includes(query)
    })
  }, [searchQuery, users])

  const isUserSelected = (userId: number): boolean => {
    return localSelectedUsers.some(m => m.user_id === userId)
  }

  const isAllSelected = useMemo((): boolean => {
    if (filteredUsers.length === 0) return false

    return filteredUsers.every(user => isUserSelected(user.user_id))
  }, [filteredUsers, localSelectedUsers])

  const handleToggleUser = (user: User) => {
    if (isUserSelected(user.user_id)) {
      setLocalSelectedUsers(prev => prev.filter(m => m.user_id !== user.user_id))
    } else {
      setLocalSelectedUsers(prev => [...prev, user])
    }
  }

  const handleToggleAll = () => {
    if (isAllSelected) {
      const userIdsToRemove = filteredUsers.map(u => u.user_id)
      setLocalSelectedUsers(prev => prev.filter(u => !userIdsToRemove.includes(u.user_id)))
    } else {
      const newSelections = filteredUsers.filter(user => !isUserSelected(user.user_id))
      setLocalSelectedUsers(prev => [...prev, ...newSelections])
    }
  }

  const handleAdd = () => {
    onUsersSelected(localSelectedUsers)
    handleDrawerClose()
  }

  const handleDrawerClose = () => {
    onClose()
    setSearchQuery('')
    setAppliedFilters(DEFAULT_FILTERS)
  }

  // Handle filter apply
  const handleApplyFilters = (filters: UserSearchFilters) => {
    setAppliedFilters(filters)
    fetchUsersWithFilters(filters)
  }

  // Handle clear all filters
  const handleClearAllFilters = () => {
    setAppliedFilters(DEFAULT_FILTERS)
    if (zooId) {
      dispatch(fetchUsers({ zoo_id: zooId }))
    }
  }

  return (
    <>
      {/* Filter Drawer */}
      <UserSearchFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={appliedFilters}
      />
      <Drawer
        open={open}
        anchor='right'
        onClose={handleDrawerClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 560 },
              backgroundColor: theme.palette.customColors?.Background,
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }
          }
        }}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.customColors?.OnPrimary,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: theme.palette.customColors?.OnPrimary,
              px: 5,
              py: 4,
              borderBottom: `1px solid ${theme.palette.divider}`,
              flexShrink: 0
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
              <Icon icon='mdi:account-search-outline' fontSize={28} color={theme.palette.primary.main} />
              <Typography
                sx={{
                  fontSize: '24px',
                  fontWeight: 500,
                  color: theme.palette.customColors?.OnSurfaceVariant
                }}
              >
                {t('housing_module.search_users')}
              </Typography>
            </Box>
            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
              <Icon icon='mdi:close' fontSize={30} />
            </IconButton>
          </Box>

          {/* Search and Filter */}
          <Box sx={{ px: 6, pt: 6, pb: 3, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Search
                  placeholder={t('housing_module.search_users') as string}
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                  inputStyle={{ py: '12px', px: '12px' }}
                  width='100%'
                  autoFocus
                />
              </Box>
              {/* Filter Button */}
              <IconButton
                onClick={() => setFilterDrawerOpen(true)}
                sx={{
                  border: `1px solid ${filterCount > 0 ? theme.palette.primary.main : theme.palette.divider}`,
                  borderRadius: 1,
                  width: 48,
                  height: 48,
                  backgroundColor: filterCount > 0 ? theme.palette.primary.main : 'transparent',
                  '&:hover': {
                    backgroundColor: filterCount > 0 ? theme.palette.primary.dark : theme.palette.action.hover
                  }
                }}
              >
                <Badge badgeContent={filterCount} color='error' invisible={filterCount === 0}>
                  <Icon
                    icon='mdi:filter-variant'
                    fontSize={24}
                    color={filterCount > 0 ? theme.palette.common.white : theme.palette.text.secondary}
                  />
                </Badge>
              </IconButton>
            </Box>

            {/* Active Filter Chips */}
            {filterCount > 0 && (
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {appliedFilters.Site && (
                  <Chip
                    label={t('housing_module.site_filter')}
                    onDelete={() => {
                      const newFilters = { ...appliedFilters, Site: '' }
                      setAppliedFilters(newFilters)
                      fetchUsersWithFilters(newFilters)
                    }}
                    size='small'
                    color='primary'
                    variant='outlined'
                  />
                )}
                {appliedFilters.Role && (
                  <Chip
                    label={t('housing_module.role_filter')}
                    onDelete={() => {
                      const newFilters = { ...appliedFilters, Role: '' }
                      setAppliedFilters(newFilters)
                      fetchUsersWithFilters(newFilters)
                    }}
                    size='small'
                    color='primary'
                    variant='outlined'
                  />
                )}
              </Box>
            )}
          </Box>

          {/* Select All Toggle */}
          {!usersLoading && filteredUsers.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 6,
                py: 2,
                flexShrink: 0,
                cursor: 'pointer'
              }}
              onClick={handleToggleAll}
            >
              <Typography
                sx={{
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: theme.palette.customColors?.OnSurfaceVariant
                }}
              >
                {isAllSelected ? t('deselect_all') : t('select_all')}
              </Typography>
              <Checkbox checked={isAllSelected} />
            </Box>
          )}

          {/* Users List */}
          <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <Box sx={{ py: 3, px: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {usersLoading ? (
                <>
                  {[1, 2, 3, 4, 5, 6].map(item => (
                    <Skeleton
                      key={item}
                      variant='rectangular'
                      height={72}
                      sx={{
                        borderRadius: 1,
                        bgcolor: theme.palette.action.hover
                      }}
                    />
                  ))}
                </>
              ) : (
                <>
                  {filteredUsers.length === 0 ? (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 200,
                        flexDirection: 'column',
                        p: 4,
                        mt: 6
                      }}
                    >
                      <NoDataFound variant='Meerkat' height={250} width={250} />
                      <Typography
                        sx={{
                          mt: 2,
                          color: theme.palette.text.secondary,
                          fontSize: '0.875rem'
                        }}
                      >
                        {searchQuery ? t('housing_module.no_users_found') : t('housing_module.no_users_available')}
                      </Typography>
                    </Box>
                  ) : (
                    filteredUsers.map(user => {
                      const isSelected = isUserSelected(user.user_id)

                      return (
                        <Box
                          key={user.user_id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 4,
                            border: isSelected
                              ? `1px solid ${theme.palette.primary.main}`
                              : `1px solid ${theme.palette.customColors?.SurfaceVariant}`,
                            backgroundColor: isSelected
                              ? theme.palette.customColors?.Surface
                              : theme.palette.customColors?.OnPrimary,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'background 0.2s, border-color 0.2s'
                          }}
                          onClick={() => handleToggleUser(user)}
                        >
                          <UserAvatarDetails
                            profile_image={user.user_profile_pic}
                            user_name={user.user_name || user.full_name || 'NA'}
                            role={user.role_name || 'NA'}
                            size='medium'
                          />
                          <Checkbox checked={isSelected} />
                        </Box>
                      )
                    })
                  )}
                </>
              )}
            </Box>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              p: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.customColors?.OnPrimary,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
              boxShadow: '0px -1px 10px 0px rgba(0, 0, 0, 0.05)'
            }}
          >
            <Typography
              sx={{
                fontSize: '1.25rem',
                fontWeight: 500,
                color: theme.palette.customColors?.OnSurface
              }}
            >
              {t('selected')} - {localSelectedUsers.length}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '50%' }}>
              <Button
                variant='outlined'
                fullWidth
                onClick={handleDrawerClose}
                sx={{
                  borderColor: theme.palette.customColors?.OnPrimaryContainer,
                  color: theme.palette.customColors?.OnPrimaryContainer,
                  height: '56px'
                }}
              >
                {t('cancel')}
              </Button>
              <Button variant='contained' fullWidth onClick={handleAdd} sx={{ height: '56px' }}>
                {t('add')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default SearchUsersDrawer
