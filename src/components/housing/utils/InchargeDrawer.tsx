import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Drawer, Typography, IconButton, CircularProgress, alpha } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import Search from 'src/views/utility/Search'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { debounce } from 'lodash'
import { useInView } from 'react-intersection-observer'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { addIncharge } from 'src/lib/api/housing'
import { assignAnimalIncharges } from 'src/lib/api/caretaker'
import Toaster from 'src/components/Toaster'
import useSafeRouter from 'src/hooks/useSafeRouter'
import NoDataFound from 'src/views/utility/NoDataFound'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { useAuth } from 'src/hooks/useAuth'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import InchargeRoleFilterDrawer from './InchargeRoleFilterDrawer'
import { Incharge, InchargeDrawerProps, InchargeRoleFilters, User } from 'src/types/housing/incharge'
import { useTranslation } from 'react-i18next'

const InchargeDrawer: React.FC<InchargeDrawerProps> = ({
  openDrawer,
  closeDrawer,
  onSelect,
  selectedUsers = [],
  title = 'Select Site Manager',
  confirmLabel = 'Choose Site Manager',
  showFilter = true,
  onSubmit,
  refType = 'site'
}) => {
  const router = useSafeRouter()
  const { id } = router.query
  const theme: any = useTheme()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchInput, setSearchInput] = useState<string>('')
  const [selectedIncharges, setSelectedIncharges] = useState<Incharge[]>([])
  const [submitLoader, setSubmitLoader] = useState<boolean>(false)

  const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false)
  const [selectedFilterOptions, setSelectedFilterOptions] = useState<InchargeRoleFilters>({ Role: '' })
  const [filterCount, setFilterCount] = useState<number>(0)

  const authData: any = useAuth()
  const zooId = authData?.userData?.user?.zoos?.[0]?.zoo_id

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  // Debounce search to reduce API calls
  const debouncedSearch = useMemo(() => debounce(setSearchQuery, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // Get the correct type and ID field based on refType
  const getApiTypeAndIdField = () => {
    switch (refType) {
      case 'site':
        return { type: 'site_incharge', idField: 'site_id' }
      case 'section':
        return { type: 'section_incharge', idField: 'site_id' }
      case 'enclosure':
        return { type: 'enclosure_incharge', idField: 'site_id' }
      case 'cluster':
        return { type: 'cluster_incharge', idField: 'site_id' }
      case 'animal':
        return { type: 'animal', idField: 'animal_id' }
      default:
        return { type: 'site_incharge', idField: 'site_id' }
    }
  }

  const { type: apiType, idField } = getApiTypeAndIdField()

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['user-list-incharge-drawer', searchQuery, id, selectedFilterOptions.Role, refType],
    initialPageParam: 1,
    enabled: !!openDrawer,
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        zoo_id: zooId,
        page_no: pageParam,
        q: searchQuery,
        isActive: true,
        type: apiType,
        length: 10,
        ...(selectedFilterOptions.Role && { role_id: selectedFilterOptions.Role }),
        [idField]: id
      }
      const res = await getUserList(params)
      const users = (res?.data as User[]) || []

      return {
        users,
        total_count: (res?.total_count as number) || 0
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      const fetchedCount = allPages.reduce((sum, page) => sum + (page.users?.length || 0), 0)
      const totalCount = lastPage?.total_count || 0

      return fetchedCount < totalCount ? allPages.length + 1 : undefined
    }
  })

  const list: User[] = useMemo(() => data?.pages?.flatMap(page => page.users) || [], [data])

  // Reset selection state when drawer opens
  useEffect(() => {
    if (openDrawer) {
      setSearchInput('')
      setSearchQuery('')
      setSelectedIncharges(selectedUsers)
      setSelectedFilterOptions({ Role: '' })
      setFilterCount(0)
    }
  }, [openDrawer, selectedUsers])

  // Cancel in-flight queries when the drawer closes
  useEffect(() => {
    if (!openDrawer) {
      queryClient.cancelQueries({ queryKey: ['user-list-incharge-drawer'] })
    }
  }, [openDrawer, queryClient])

  // Slight delay before fetching the next page lets the previous render settle,
  // avoiding rapid-fire triggers on hard scroll.
  const loadMore = useCallback(() => {
    setTimeout(() => {
      fetchNextPage()
    }, 300)
  }, [fetchNextPage])

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
    const isSelected = selectedIncharges.some((item: Incharge) => item.user_id === user.user_id)
    if (!isSelected && selectedIncharges.length >= 10) {
      Toaster({ type: 'error', message: t('housing_module.max_users_selected') })

      return
    }

    setSelectedIncharges((prev: Incharge[]) => {
      const currentlySelected = prev.some((item: Incharge) => item.user_id === user.user_id)
      if (currentlySelected) {
        return prev.filter((item: Incharge) => item.user_id !== user.user_id)
      } else {
        return [...prev, user as unknown as Incharge]
      }
    })
  }

  // Submit selected users
  const handleConfirm = async () => {
    if (selectedIncharges.length > 10) {
      Toaster({ type: 'error', message: t('housing_module.max_users_selected') })

      return
    }

    setSubmitLoader(true)
    try {
      let res: { success?: boolean; message?: string }

      // Use custom onSubmit if provided, otherwise use default addIncharge
      if (onSubmit) {
        res = await onSubmit(selectedIncharges)
      } else if (refType === 'animal') {
        // Use animal-specific API for assigning incharges
        const userIdsString = selectedIncharges.map(user => user.user_id).join(',')
        res = await assignAnimalIncharges(Number(id), userIdsString)
      } else {
        // Build payload based on refType for housing entities
        const getPayload = () => {
          const userIds = selectedIncharges.map(user => user.user_id).join(',')
          switch (refType) {
            case 'site':
              return {
                ref_id: Number(id),
                ref_type: 'site',
                user_id: userIds
              }
            case 'section':
              return {
                ref_id: String(id),
                ref_type: 'section',
                user_id: userIds
              }
            case 'enclosure':
              return {
                ref_id: String(id),
                ref_type: 'enclosure',
                user_id: userIds
              }
            case 'cluster':
              return {
                ref_id: String(id),
                ref_type: 'cluster',
                user_id: userIds
              }
            default:
              return {
                ref_id: String(id),
                ref_type: 'site',
                user_id: userIds
              }
          }
        }
        res = await addIncharge(getPayload())
      }

      if (res?.success) {
        Toaster({ type: 'success', message: res?.message || t('housing_module.added_successfully') })
        onSelect(selectedIncharges)
        closeDrawer()
      } else {
        Toaster({ type: 'error', message: res?.message || t('housing_module.failed_to_add') })
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
              placeholder={t('housing_module.search_by_name_email') as string}
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
            minHeight: 0
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

              {/* Sentinel only renders after the first page has items — prevents premature triggers on hard scroll */}
              {(isFetchingNextPage || hasNextPage) && list.length > 0 && (
                <Box ref={loaderRef} display='flex' justifyContent='center' p={4}>
                  <CircularProgress size={24} />
                </Box>
              )}

              {!hasNextPage && list.length > 0 && (
                <Typography variant='body2' sx={{ textAlign: 'center', py: 4, color: theme.palette.text.secondary }}>
                  {t('no_more_data')}
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>

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
          {t('cancel')}
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
