'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Box,
  Typography,
  Drawer,
  IconButton,
  Button,
  Checkbox,
  Skeleton
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useAuth } from 'src/hooks/useAuth'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import Search from 'src/views/utility/Search'
import NoDataFound from 'src/views/utility/NoDataFound'
import Icon from 'src/@core/components/icon'

export interface SelectedUser {
  user_id: number | string
  user_name: string
  full_name?: string
  user_profile_pic?: string
  role_name?: string
}

interface SearchUsersDrawerProps {
  open: boolean
  onClose: () => void
  selectedUsers: SelectedUser[]
  onUsersSelected: (users: SelectedUser[]) => void
}

const SearchUsersDrawer: React.FC<SearchUsersDrawerProps> = ({
  open,
  onClose,
  selectedUsers,
  onUsersSelected
}) => {
  const theme = useTheme()
  const auth = useAuth() as any
  const zooId = auth?.userData?.user?.zoos?.[0]?.zoo_id || auth?.user?.zoo_id

  // Local state
  const [users, setUsers] = useState<SelectedUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [localSelectedUsers, setLocalSelectedUsers] = useState<SelectedUser[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Track if drawer was previously open to avoid re-fetching on every render
  const prevOpenRef = useRef(false)

  // Fetch users from API
  const fetchUsers = async () => {
    if (!zooId) return

    try {
      setUsersLoading(true)
      const response = await getUserList({ zoo_id: zooId, q: '' })

      const usersList: SelectedUser[] = response?.data?.map((item: any) => ({
        user_id: item.user_id,
        user_name: item.user_name,
        full_name: item.full_name,
        user_profile_pic: item.user_profile_pic || '',
        role_name: item.role_name || ''
      })) || []
      setUsers(usersList)
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }

  // Initialize local state when drawer opens (only on open transition)
  useEffect(() => {
    // Only run when drawer transitions from closed to open
    if (open && !prevOpenRef.current) {
      setLocalSelectedUsers([...selectedUsers])
      setSearchQuery('')
      fetchUsers()
    }
    prevOpenRef.current = open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, zooId])

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

  const isUserSelected = (userId: number | string): boolean => {
    return localSelectedUsers.some(m => m.user_id === userId)
  }

  const isAllSelected = useMemo((): boolean => {
    if (filteredUsers.length === 0) return false

    return filteredUsers.every(user => isUserSelected(user.user_id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredUsers, localSelectedUsers])

  const handleToggleUser = (user: SelectedUser) => {
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
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={handleDrawerClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '560px'],
          height: '100%'
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
                fontSize: '1.25rem',
                fontWeight: 600,
                color: theme.palette.customColors?.OnSurfaceVariant
              }}
            >
              Search Users
            </Typography>
          </Box>
          <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>

        {/* Search */}
        <Box sx={{ px: 5, pt: 5, pb: 3, flexShrink: 0 }}>
          <Search
            placeholder='Search Users'
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            inputStyle={{ py: '12px', px: '12px' }}
            width='100%'
          />
        </Box>

        {/* Select All Toggle */}
        {!usersLoading && filteredUsers.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 5,
              py: 2,
              flexShrink: 0,
              cursor: 'pointer',
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
            onClick={handleToggleAll}
          >
            <Typography
              sx={{
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: theme.palette.customColors?.OnSurfaceVariant
              }}
            >
              {isAllSelected ? 'Deselect all' : 'Select all'}
            </Typography>
            <Checkbox checked={isAllSelected} />
          </Box>
        )}

        {/* Users List */}
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <Box sx={{ py: 3, px: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {usersLoading ? (
              <>
                {[1, 2, 3, 4, 5, 6].map(item => (
                  <Skeleton
                    key={item}
                    variant='rectangular'
                    height={72}
                    sx={{
                      borderRadius: '8px',
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
                    <NoDataFound variant='Meerkat' height={200} width={200} />
                    <Typography
                      sx={{
                        mt: 2,
                        color: theme.palette.text.secondary,
                        fontSize: '0.875rem'
                      }}
                    >
                      {searchQuery ? 'No users found' : 'No users available'}
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
                          p: 3,
                          border: isSelected
                            ? `1px solid ${theme.palette.primary.main}`
                            : `1px solid ${theme.palette.customColors?.OutlineVariant}`,
                          backgroundColor: isSelected
                            ? theme.palette.primary.light + '15'
                            : theme.palette.customColors?.OnPrimary,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: theme.palette.primary.main
                          }
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
              fontSize: '1rem',
              fontWeight: 500,
              color: theme.palette.customColors?.OnSurface
            }}
          >
            Selected - {localSelectedUsers.length}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant='outlined'
              onClick={handleDrawerClose}
              sx={{
                borderColor: theme.palette.customColors?.OnPrimaryContainer,
                color: theme.palette.customColors?.OnPrimaryContainer,
                height: '48px',
                px: 4,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Cancel
            </Button>
            <Button
              variant='contained'
              onClick={handleAdd}
              sx={{
                height: '48px',
                px: 4,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Add
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default SearchUsersDrawer
