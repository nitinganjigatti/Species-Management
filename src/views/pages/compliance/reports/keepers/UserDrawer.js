import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  TextField,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Radio,
  CircularProgress,
  Grid
} from '@mui/material'
import { useTheme } from '@emotion/react'
import AnimalParentCard from 'src/views/utility/animalParentCard'
import { getAnimalListing } from 'src/lib/api/report'
import useInfiniteScroll from 'src/hooks/useInfiniteScroll'
import { getUserListing } from 'src/lib/api/compliance/reports'
import Search from 'src/views/utility/Search'
import { FilterButton } from 'src/views/utility/render-snippets'
import UserCard from 'src/views/utility/UserCard'
import { LoadingButton } from '@mui/lab'
import { useInView } from 'react-intersection-observer'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { debounce } from 'lodash'
import Icon from 'src/@core/components/icon'

const UserDrawer = ({
  open,
  onClose,
  setUserDetail,
  roleFilter = 'all_users',
  queryKey = 'user-keeper-Report',
  headerText = 'Select the Keeper',
  footerText = 'generate keeper’s Diary REPORT'
}) => {
  const theme = useTheme()
  const PAGE_SIZE = 10
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(false)
  const [search, setSearch] = useState('')
  const [localSearch, setLocalSearch] = useState('')

  const queryClient = useQueryClient()

  const cooldownRef = useRef(false)

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })
  const debouncedSearch = useMemo(() => debounce(setSearch, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, remove } = useInfiniteQuery({
    queryKey: [queryKey, search],
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        page_no: pageParam,
        limit: PAGE_SIZE,
        q: search,
        ref_type: 'total_user',
        role_key: roleFilter
      }

      const res = await getUserListing(params)

      return {
        users: res?.data?.result || [],
        nextPage: res?.data?.result?.length === PAGE_SIZE ? pageParam + 1 : undefined,
        total_count: res?.data?.total_count || 0
      }
    },
    getNextPageParam: lastPage => lastPage.nextPage
  })

  const list = useMemo(() => data?.pages?.flatMap(page => page.users) || [], [data])
  const total = useMemo(() => Number(data?.pages?.[0]?.total_count) || 0, [data])

  useEffect(() => {
    if (open) {
      setLocalSearch('')
      setSearch('')
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      queryClient.cancelQueries(['user-keeper-Report', search])
      remove()
      cooldownRef.current = false
    }
  }, [open, search, queryClient, remove])

  const loadMore = useCallback(() => {
    if (cooldownRef.current) return
    if (!isFetchingNextPage && hasNextPage) {
      cooldownRef.current = true
      fetchNextPage().finally(() => {
        setTimeout(() => {
          cooldownRef.current = false
        }, 300)
      })
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage])

  useEffect(() => {
    if (inView) {
      loadMore()
    }
  }, [inView, loadMore])

  const handleSearchChange = e => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    debouncedSearch('')
  }

  const handleGenerateUser = () => {
    const selectedUser = list.find(user => user.user_id === selected)
    setUserDetail(selectedUser)
    onClose()
    console.log('Selected user data:', selectedUser)
  }

  const RenderSidebarFooter = () => {
    return (
      <Box
        sx={{
          position: 'relative',
          right: 0,
          height: '122px',
          width: '100%',
          maxWidth: '562px',
          position: 'fixed',
          bottom: 0,
          px: 4,
          py: '24px',
          bgcolor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          display: 'flex',
          zIndex: 1234
        }}
      >
        <LoadingButton
          sx={{ height: '58px' }}
          fullWidth
          onClick={handleGenerateUser}
          variant='contained'
          type='submit'
          size='large'
          loading={loading}
        >
          {footerText}
        </LoadingButton>
      </Box>
    )
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'] },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.customColors.bodyBg,
        gap: '24px'
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

        <Grid
          container
          gap={1}
          sx={{
            px: 5,
            pt: 2,
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Grid size={{ xs: 12 }}>
            <Search width={'100%'} onChange={handleSearchChange} onClear={handleSearchClear} />
          </Grid>
        </Grid>

        {isFetching && list.length === 0 ? (
          <Box display='flex' justifyContent='center' alignItems='center' flex={1}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: 2,
              bgcolor: theme.palette.customColors.bodyBg,
              mt: 6,
              p: 5,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              maxHeight: '650px'
            }}
          >
            {list.map(user => (
              <UserCard
                name={user?.user_name}
                uid={user?.user_id}
                role={user?.role_name}
                image={user?.user_profile_pic} // example image
                radio={{
                  checked: selected === user.user_id,
                  onChange: () => setSelected(user.user_id)
                }}
              />
            ))}

            {hasNextPage && (
              <Box ref={loaderRef} display='flex' justifyContent='center' py={2}>
                <CircularProgress />
              </Box>
            )}

            {!hasNextPage && list.length === 0 && (
              <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.secondary }}>
                No user found
              </Typography>
            )}
          </Box>
        )}
        <RenderSidebarFooter />
      </Box>
    </Drawer>
  )
}

export default UserDrawer
