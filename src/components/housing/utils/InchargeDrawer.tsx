import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Drawer, Typography, IconButton, CircularProgress, alpha } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import Search from 'src/views/utility/Search'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { debounce } from 'lodash'
import { useInView } from 'react-intersection-observer'
import { useInfiniteQuery } from '@tanstack/react-query'
import {  addIncharge } from 'src/lib/api/housing'
import Toaster from 'src/components/Toaster'
import { useRouter } from 'next/router'
import NoDataFound from 'src/views/utility/NoDataFound'
import { FilterButton } from 'src/views/utility/render-snippets'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { useAuth } from 'src/hooks/useAuth'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import InchargeRoleFilterDrawer from './InchargeRoleFilterDrawer'
import { Incharge, InchargeDrawerProps, InchargeRoleFilters, User } from 'src/types/housing/incharge'

const InchargeDrawer: React.FC<InchargeDrawerProps> = ({
  openDrawer,
  closeDrawer,
  onSelect,
  selectedUsers = [],
  title = 'Select Site Manager',
  confirmLabel = 'Choose Site Manager',
  showFilter = true
}) => {
  const router = useRouter()
  const { id } = router.query
  const theme: any = useTheme()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchInput, setSearchInput] = useState<string>('')
  const [selectedIncharges, setSelectedIncharges] = useState<Incharge[]>([])
  const [submitLoader, setSubmitLoader] = useState<boolean>(false)

  const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false)
  const [selectedFilterOptions, setSelectedFilterOptions] = useState<InchargeRoleFilters>({ Role: '' })
  const [filterCount, setFilterCount] = useState<number>(0)

  const authData: any = useAuth()
  const zooId = authData?.userData?.user?.zoos?.[0]?.zoo_id

  // Intersection observer for infinite scroll
  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  // Debounce search to reduce API calls
  const debouncedSearch = useMemo(() => debounce(setSearchQuery, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // Infinite query to fetch user list with search and filters
  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['user-list-incharge-drawer', searchQuery, id, selectedFilterOptions],
    initialPageParam: 1,
    enabled: !!openDrawer,
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        zoo_id: zooId,
        page_no: pageParam,
        q: searchQuery,
        isActive: true,
        type: 'site_incharge',
        length: 10,
        ...(selectedFilterOptions.Role && { role_id: selectedFilterOptions.Role }),
        site_id: id
      }
      const res = await getUserList(params)
      const incharges = (res?.data as User[]) || []

      return {
        users: incharges,
        nextPage: incharges?.length === 10 ? (pageParam as number) + 1 : undefined,
        total_count: (res?.total_count as number) || 0
      }
    },
    getNextPageParam: (lastPage: any, allPages: any) => {
      const fetchedCount = allPages.reduce((sum: number, page: any) => sum + (page.users?.length || 0), 0)
      const totalCount = lastPage?.total_count || 0

      return fetchedCount < totalCount ? allPages.length + 1 : undefined
    }
  })

  // Reset state when drawer opens
  useEffect(() => {
    if (openDrawer) {
      setSearchInput('')
      setSearchQuery('')
      setSelectedIncharges(selectedUsers)
      setSelectedFilterOptions({ Role: '' })
      setFilterCount(0)
    }
  }, [openDrawer, selectedUsers])

  // Flatten infinite query pages into a single list
  const list: User[] = useMemo(() => data?.pages?.flatMap(page => page.users) || [], [data])

  const cooldownRef = useRef<boolean>(false)

  // Load more data when scrolling to bottom
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

  // Trigger loadMore based on intersection observer
  useEffect(() => {
    if (inView) {
      loadMore()
    }
  }, [inView, loadMore])

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchInput(value)
    debouncedSearch(value)
  }

  // Clear search input
  const handleSearchClear = () => {
    setSearchInput('')
    debouncedSearch('')
  }

  // Toggle user selection
  const handleToggleSelection = (user: User) => {
    setSelectedIncharges((prev: Incharge[]) => {
      const isSelected = prev.some((item: Incharge) => item.user_id === user.user_id)
      if (isSelected) {
        return prev.filter((item: Incharge) => item.user_id !== user.user_id)
      } else {
        return [...prev, user as unknown as Incharge]
      }
    })
  }

  // Submit selected users 
  const handleConfirm = async () => {
    const payload = {
      ref_id: id,
      ref_type: 'site',
      user_id: selectedIncharges.map(user => user.user_id).join(',')
    }
    setSubmitLoader(true)
    try {
      const res = await addIncharge(payload)
      if (res?.success) {
        Toaster({ type: 'success', message: res?.message || 'Incharge added successfully' })
        onSelect(selectedIncharges)
        closeDrawer()
      } else {
        Toaster({ type: 'error', message: res?.message || 'Failed to add incharge' })
      }
    } catch (error: any) {
      console.error(error?.message)
    } finally {
      setSubmitLoader(false)
    }
  }

  return (
    <Drawer
      anchor='right'
      open={openDrawer}
      onClose={closeDrawer}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '562px'],
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.customColors.bodyBg
        }
      }}
    >
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box
          sx={{
            p: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.palette.customColors.OnPrimary
          }}
        >
          <Typography
            sx={{
              fontSize: '24px',
              fontWeight: 500,
              fontFamily: 'Inter',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {title}
          </Typography>
          <IconButton onClick={closeDrawer}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 4,
            backgroundColor: theme.palette.customColors.OnPrimary,
            pb: 4
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Search
              width='100%'
              placeholder='Search by name and email'
              value={searchInput}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
              inputStyle={{ py: '12px', px: '12px' }}
            />
          </Box>
          {showFilter && (
            <FilterButtonWithNotification onClick={() => setOpenFilterDrawer(true)} appliedFiltersCount={filterCount} />
          )}
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 4,
            py: 4,
            bgcolor: theme.palette.customColors.bodyBg,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            minHeight: 0,
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
            '-ms-overflow-style': 'none'
          }}
        >
          {isFetching && list.length === 0 ? (
            <Box display='flex' justifyContent='center' alignItems='center' flex={1}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {list.map(user => {
                const isSelected = selectedIncharges.some(item => item.user_id === user.user_id)

                return (
                  <Box
                    key={user.user_id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 3,
                      background: theme.palette.customColors.OnPrimary,
                      borderRadius: 1,
                      cursor: 'pointer',
                      //   border: isSelected ? `2px solid ${theme.palette.primary.main}` : `2px solid transparent`,
                      transition: 'border-color 0.2s'
                    }}
                    onClick={() => handleToggleSelection(user)}
                  >
                    <UserAvatarDetails
                      user_name={user.user_name}
                      profile_image={user.user_profile_pic}
                      role={user.role_name}
                      size='large'
                    />
                    {isSelected && (
                      <Icon icon='mdi:check-circle' color={theme.palette.primary.main} style={{ fontSize: 20 }} />
                    )}
                  </Box>
                )
              })}

              {!isFetching && list.length === 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 200,
                    flexDirection: 'column'
                  }}
                >
                  <NoDataFound variant='Meerkat' height={250} width={250} />
                </Box>
              )}

              {/* Load more spinner or end of list message */}
              {hasNextPage ? (
                <Box ref={loaderRef} display='flex' justifyContent='center' py={2}>
                  <CircularProgress />
                </Box>
              ) : (
                list.length > 0 && (
                  <Typography variant='body2' sx={{ textAlign: 'center', py: 4, color: theme.palette.text.secondary }}>
                    No more data to load
                  </Typography>
                )
              )}
            </>
          )}
        </Box>
      </Box>

      {selectedIncharges.length > 0 && (
        <Box
          sx={{
            p: 4,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            boxShadow: `0px -2px 6px ${alpha(theme.palette.customColors.deepDark, 0.1)}`,
            bottom: 0,
            position: 'sticky',
            zIndex: 1
          }}
        >
          <LoadingButton
            variant='outlined'
            onClick={closeDrawer}
            loading={submitLoader}
            sx={{ flex: 1, py: 4 }}
            disabled={submitLoader}
          >
            Cancel
          </LoadingButton>
          <LoadingButton
            variant='contained'
            onClick={handleConfirm}
            loading={submitLoader}
            sx={{ flex: 1, py: 4 }}
            disabled={submitLoader}
          >
            {confirmLabel} {`(${selectedIncharges.length})`}
          </LoadingButton>
        </Box>
      )}
      <InchargeRoleFilterDrawer
        open={openFilterDrawer}
        onClose={() => setOpenFilterDrawer(false)}
        onApplyFilters={setSelectedFilterOptions}
        setFilterCount={setFilterCount}
        initialSelectedOptions={selectedFilterOptions}
      />
    </Drawer>
  )
}

export default InchargeDrawer
