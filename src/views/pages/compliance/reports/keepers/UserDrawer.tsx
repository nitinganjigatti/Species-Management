import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Radio,
  CircularProgress,
  Grid
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import AnimalParentCard from 'src/views/utility/animalParentCard'
import { getUserListing } from 'src/lib/api/compliance/reports'
import Search from 'src/views/utility/Search'
import { FilterButton } from 'src/views/utility/render-snippets'
import UserCard from 'src/views/utility/UserCard'
import { LoadingButton } from '@mui/lab'
import { useInView } from 'react-intersection-observer'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { debounce } from 'lodash'
import Icon from 'src/@core/components/icon'
import type { UserListing } from 'src/types/compliance'
import { useTranslation } from 'react-i18next'

interface UserDrawerProps {
  open: boolean
  onClose: () => void
  setUserDetail: (user: UserListing | undefined) => void
  placeholder?: string
  title?: string
  roleFilter?: string
  queryKey?: string
  headerText?: string
  footerText?: string
}

const UserDrawer = ({
  open,
  onClose,
  setUserDetail,
  placeholder,
  title,
  roleFilter = 'all_users',
  queryKey = 'user-keeper-Report',
  headerText,
  footerText
}: UserDrawerProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const PAGE_SIZE = 10
  const [loading, setLoading] = useState<boolean>(false)
  const [selected, setSelected] = useState<string | number | false>(false)
  const [search, setSearch] = useState<string>('')
  const [localSearch, setLocalSearch] = useState<string>('')

  const queryClient = useQueryClient()

  const cooldownRef = useRef<boolean>(false)

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })
  const debouncedSearch = useMemo(() => debounce(setSearch, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [queryKey, search],
    initialPageParam: 1,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const params = {
        page_no: pageParam,
        limit: PAGE_SIZE,
        q: search,
        ref_type: 'total_user',
        role_key: roleFilter
      }

      const res = (await getUserListing(params)) as any

      return {
        users: res?.data?.result || [],
        nextPage: res?.data?.result?.length === PAGE_SIZE ? pageParam + 1 : undefined,
        total_count: res?.data?.total_count || 0
      }
    },
    getNextPageParam: (lastPage: any) => lastPage.nextPage
  })

  const list = useMemo(() => data?.pages?.flatMap((page: any) => page.users) || [], [data])
  const total = useMemo(() => Number((data?.pages?.[0] as any)?.total_count) || 0, [data])

  useEffect(() => {
    if (open) {
      setLocalSearch('')
      setSearch('')
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      queryClient.cancelQueries({ queryKey: ['user-keeper-Report', search] })
      queryClient.removeQueries({ queryKey: [queryKey] })
      cooldownRef.current = false
    }
  }, [open, search, queryClient, queryKey])

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    debouncedSearch('')
  }

  const handleGenerateUser = () => {
    const selectedUser = list.find((user: UserListing) => user.user_id === selected)
    setUserDetail(selectedUser)
    onClose()

    // console.log('Selected user data:', selectedUser)
  }

  const RenderSidebarFooter = () => {
    return (
      <>
        {selected && (
          <>
            <Box
              sx={{
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
                {footerText || t('compliance_module.generate_keeper_diary_report')}
              </LoadingButton>
            </Box>
          </>
        )}
      </>
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
            {headerText || t('compliance_module.select_the_keeper')}
          </Typography>
          <IconButton onClick={onClose}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>

        <Grid
          container
          gap={1}
          sx={{
            px: 4,
            pt: 0,
            pb: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Grid size={{ xs: 12 }}>
            <Search
              width={'100%'}
              onChange={handleSearchChange}
              placeholder={placeholder}
              onClear={handleSearchClear}
              inputStyle={{ py: '18px', px: '12px' }}
            />
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
              px: 4,
              bgcolor: theme.palette.customColors.bodyBg,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minHeight: 0,
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
              '-ms-overflow-style': 'none',
              py: 4
            }}
          >
            {title && (
              <Typography
                sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {' '}
                {`${title}(${total})`}
              </Typography>
            )}

            {list.map((user: UserListing) => (
              <UserCard
                key={String(user?.user_id || user?.uid || '')}
                name={user?.user_name}
                uid={user?.user_id}
                role={user?.role_name}
                image={user?.user_profile_pic} // example image
                radio={{
                  checked: selected === user.user_id,
                  onChange: () => setSelected(user.user_id as string | number)
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
                {t('compliance_module.no_user_found')}
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
