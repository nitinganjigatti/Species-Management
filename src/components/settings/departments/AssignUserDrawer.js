import { useState, useEffect, useMemo, useRef } from 'react'
import { Box, Typography, Drawer, IconButton, Button, Checkbox, Skeleton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { assignDepartmentUser } from 'src/lib/api/request-department'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import Search from 'src/views/utility/Search'

const AssignUserDrawer = ({ open, onClose, onSuccess, departmentId, existingUserIds = [] }) => {
  const theme = useTheme()
  const auth = useAuth()
  const zooId = auth?.userData?.user?.zoos?.[0]?.zoo_id || auth?.user?.zoo_id

  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [localSelectedUsers, setLocalSelectedUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const prevOpenRef = useRef(false)

  const fetchUsers = async () => {
    if (!zooId) return
    try {
      setUsersLoading(true)
      const response = await getUserList({ zoo_id: zooId, q: '' })
      const usersList =
        response?.data?.map(item => ({
          user_id: item.user_id,
          user_name: item.user_name,
          full_name: item.full_name,
          user_profile_pic: item.user_profile_pic || '',
          role_name: item.role_name || ''
        })) || []
      setUsers(usersList)
    } catch {
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setLocalSelectedUsers([])
      setSearchQuery('')
      fetchUsers()
    }
    prevOpenRef.current = open
  }, [open, zooId])

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

  const isUserSelected = userId => {
    return localSelectedUsers.some(m => m.user_id === userId)
  }

  const isAlreadyAssigned = userId => {
    return existingUserIds.includes(String(userId))
  }

  const isAllSelected = useMemo(() => {
    const selectableUsers = filteredUsers.filter(u => !isAlreadyAssigned(u.user_id))
    if (selectableUsers.length === 0) return false
    return selectableUsers.every(user => isUserSelected(user.user_id))
  }, [filteredUsers, localSelectedUsers, existingUserIds])

  const handleToggleUser = user => {
    if (isAlreadyAssigned(user.user_id)) return
    if (isUserSelected(user.user_id)) {
      setLocalSelectedUsers(prev => prev.filter(m => m.user_id !== user.user_id))
    } else {
      setLocalSelectedUsers(prev => [...prev, user])
    }
  }

  const handleToggleAll = () => {
    const selectableUsers = filteredUsers.filter(u => !isAlreadyAssigned(u.user_id))
    if (isAllSelected) {
      const userIdsToRemove = selectableUsers.map(u => u.user_id)
      setLocalSelectedUsers(prev => prev.filter(u => !userIdsToRemove.includes(u.user_id)))
    } else {
      const newSelections = selectableUsers.filter(user => !isUserSelected(user.user_id))
      setLocalSelectedUsers(prev => [...prev, ...newSelections])
    }
  }

  const handleAdd = async () => {
    if (localSelectedUsers.length === 0) {
      toast.error('Please select at least one user')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        department_id: departmentId,
        users: localSelectedUsers.map(u => ({ user_id: String(u.user_id) }))
      }
      const response = await assignDepartmentUser(payload)
      if (response?.success || response?.status) {
        toast.success(`${localSelectedUsers.length} user(s) assigned successfully`)
        onSuccess?.()
        handleDrawerClose()
      } else {
        toast.error(response?.message || 'Failed to assign users')
      }
    } catch (error) {
      console.error('Error assigning users:', error)
      toast.error('Failed to assign users')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDrawerClose = () => {
    onClose()
    setSearchQuery('')
    setLocalSelectedUsers([])
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={handleDrawerClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '580px'],
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
              Assign Users
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
            onChange={e => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            inputStyle={{ py: '12px', px: '12px' }}
            width='100%'
          />
        </Box>

        {/* Select All */}
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

        {/* User List */}
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
                    const assigned = isAlreadyAssigned(user.user_id)

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
                          cursor: assigned ? 'default' : 'pointer',
                          opacity: assigned ? 0.5 : 1,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: assigned ? theme.palette.customColors?.OutlineVariant : theme.palette.primary.main
                          }
                        }}
                        onClick={() => handleToggleUser(user)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <UserAvatarDetails
                            profile_image={user.user_profile_pic}
                            user_name={user.user_name || user.full_name || 'NA'}
                            role={assigned ? `${user.role_name || 'NA'} · Already assigned` : (user.role_name || 'NA')}
                            size='medium'
                          />
                        </Box>
                        <Checkbox checked={isSelected} disabled={assigned} />
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
              disabled={submitting}
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
              disabled={localSelectedUsers.length === 0 || submitting}
              sx={{
                height: '48px',
                px: 4,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              {submitting ? 'Assigning...' : `Assign ${localSelectedUsers.length > 0 ? localSelectedUsers.length : ''} User${localSelectedUsers.length !== 1 ? 's' : ''}`}
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AssignUserDrawer
