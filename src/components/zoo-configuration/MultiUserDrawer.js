import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Drawer, Typography, IconButton, Avatar, Card, Checkbox, CircularProgress } from '@mui/material'
import { useTheme } from '@emotion/react'
import { LoadingButton } from '@mui/lab'
import { useInView } from 'react-intersection-observer'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { debounce } from 'lodash'
import Icon from 'src/@core/components/icon'
import Search from 'src/views/utility/Search'
import { getUserListing } from 'src/lib/api/compliance/reports'

const PAGE_SIZE = 10

const MultiUserCard = ({ name, image, role, checked, onChange }) => {
  const theme = useTheme()

  return (
    <Card
      sx={{
        boxShadow: 'none',
        backgroundColor: checked ? theme.palette.customColors.Surface : 'white',
        display: 'flex',
        border: checked ? `1px solid ${theme.palette.primary.main}` : '1px solid white',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        minHeight: 80,
        px: 4,
        py: 3,
        cursor: 'pointer'
      }}
      onClick={onChange}
      tabIndex={0}
      role='button'
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onChange()
        }
      }}
    >
      <Box display='flex' alignItems='center' gap={4}>
        <Avatar alt={name} src={image || '/default-avatar.png'} sx={{ width: 48, height: 48 }} />
        <Box>
          <Typography sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {name || '-'}
          </Typography>
          <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
            {role || '-'}
          </Typography>
        </Box>
      </Box>
      <Checkbox
        checked={checked}
        onChange={e => {
          e.stopPropagation()
          onChange()
        }}
        onClick={e => e.stopPropagation()}
        sx={{
          p: 0,
          color: theme.palette.customColors.neutralSecondary,
          '&.Mui-checked': { color: theme.palette.primary.main }
        }}
      />
    </Card>
  )
}

const MultiUserDrawer = ({
  open,
  onClose,
  onConfirm,
  selectedUsers = [],
  headerText = 'Select Users',
  placeholder = 'Search by name',
  queryKey = 'multi-user-select',
  confirmText = 'Confirm Selection'
}) => {
  const theme = useTheme()
  const [search, setSearch] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const [selected, setSelected] = useState([]) // array of user objects

  const queryClient = useQueryClient()
  const cooldownRef = useRef(false)
  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const debouncedSearch = useMemo(() => debounce(setSearch, 500), [])
  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch])

  // Sync incoming selectedUsers when drawer opens
  useEffect(() => {
    if (open) {
      setSelected(selectedUsers)
      setLocalSearch('')
      setSearch('')
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      queryClient.cancelQueries([queryKey, search])
      cooldownRef.current = false
    }
  }, [open, search, queryClient, queryKey])

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, remove } = useInfiniteQuery({
    queryKey: [queryKey, search],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getUserListing({
        page_no: pageParam,
        limit: PAGE_SIZE,
        q: search,
        ref_type: 'total_user',
        role_key: 'all_users'
      })

      return {
        users: res?.data?.result || [],
        nextPage: res?.data?.result?.length === PAGE_SIZE ? pageParam + 1 : undefined,
        total_count: res?.data?.total_count || 0
      }
    },
    getNextPageParam: lastPage => lastPage.nextPage,
    enabled: open
  })

  const list = useMemo(() => data?.pages?.flatMap(p => p.users) || [], [data])

  const loadMore = useCallback(() => {
    if (cooldownRef.current || isFetchingNextPage || !hasNextPage) return
    cooldownRef.current = true
    fetchNextPage().finally(() =>
      setTimeout(() => {
        cooldownRef.current = false
      }, 300)
    )
  }, [isFetchingNextPage, hasNextPage, fetchNextPage])

  useEffect(() => {
    if (inView) loadMore()
  }, [inView, loadMore])

  const handleSearchChange = e => {
    setLocalSearch(e.target.value)
    debouncedSearch(e.target.value)
  }

  const isSelected = uid => selected.some(u => String(u.user_id) === String(uid))

  const toggleUser = user => {
    setSelected(prev =>
      isSelected(user.user_id) ? prev.filter(u => String(u.user_id) !== String(user.user_id)) : [...prev, user]
    )
  }

  const handleConfirm = () => {
    onConfirm(selected)
    onClose()
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', '562px'] } }}
    >
      <Box
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: theme.palette.customColors.bodyBg }}
      >
        {/* Header */}
        <Box sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            sx={{
              fontSize: '24px',
              fontWeight: 500,
              fontFamily: 'Inter',
              color: theme.palette.customColors.OnSurfaceVariant,
              ml: 2
            }}
          >
            {headerText}
          </Typography>
          <IconButton onClick={onClose}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>

        {/* Search */}
        <Box sx={{ px: 4, pb: 4 }}>
          <Search
            width='100%'
            onChange={handleSearchChange}
            placeholder={placeholder}
            onClear={() => {
              setLocalSearch('')
              debouncedSearch('')
            }}
            inputStyle={{ py: '18px', px: '12px' }}
          />
        </Box>

        {/* User list */}
        {isFetching && list.length === 0 ? (
          <Box display='flex' justifyContent='center' alignItems='center' flex={1}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minHeight: 0,
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
              pb: selected.length ? '122px' : 4
            }}
          >
            {list.map(user => (
              <MultiUserCard
                key={user?.user_id}
                name={user?.user_name}
                image={user?.user_profile_pic}
                role={user?.role_name}
                checked={isSelected(user.user_id)}
                onChange={() => toggleUser(user)}
              />
            ))}
            {hasNextPage && (
              <Box ref={loaderRef} display='flex' justifyContent='center' py={2}>
                <CircularProgress size={24} />
              </Box>
            )}
            {!isFetching && list.length === 0 && (
              <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>No users found</Typography>
            )}
          </Box>
        )}

        {/* Footer CTA */}
        {selected.length > 0 && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              right: 0,
              width: ['100%', '562px'],
              px: 4,
              py: '24px',
              bgcolor: 'white',
              zIndex: 1234,
              borderTop: `1px solid ${theme.palette.customColors.SurfaceVariant}`
            }}
          >
            <LoadingButton fullWidth onClick={handleConfirm} variant='contained' size='large' sx={{ height: '58px' }}>
              {confirmText} ({selected.length} selected)
            </LoadingButton>
          </Box>
        )}
      </Box>
    </Drawer>
  )
}

export default MultiUserDrawer
