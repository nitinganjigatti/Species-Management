import React, { FC, useCallback, useContext, useEffect, useState } from 'react'
import { Box, Button, CircularProgress, IconButton, Skeleton, Typography, useTheme } from '@mui/material'
import { Icon } from '@iconify/react'
import { alpha } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { useInView } from 'react-intersection-observer'
import useSafeRouter from 'src/hooks/useSafeRouter'
import { AuthContext } from 'src/context/AuthContext'
import AnimalCard from 'src/views/utility/AnimalCard'
import NoDataFound from 'src/views/utility/NoDataFound'
import { DeleteOffspringPayload, OffspringListItem, TabProps } from 'src/types/housing/animalsOffspring'
import { getNewAnimalListWithFilters } from 'src/lib/api/hospital/inpatient'
import { deleteOffspring } from 'src/lib/api/housing'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import BottomActionBar from 'src/views/utility/BottomActionBar'
import AddOffspringDrawer from './AddOffspringDrawer'
import Toaster from 'src/components/Toaster'

const AllOffspring: FC<TabProps> = props => {
  const router = useSafeRouter()
  const { id } = router.query
  const theme = useTheme() as any
  const { t } = useTranslation()
  const authData = useContext(AuthContext)
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false)
  const [selectedOffspring, setSelectedOffspring] = useState<string[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [offspringList, setOffspringList] = useState<OffspringListItem[]>([])
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const hasPermission = (authData as any)?.userData?.roles?.settings?.collection_animal_record_access

  const fetchOffspringList = async (pageNo: number = 1) => {
    if (!props.animalId) return

    setIsLoading(true)

    if (pageNo === 1) {
      setHasMore(true)
    }

    try {
      const payload = {
        parent_id: props.animalId,
        is_mother: props.isMother,
        use_case: 'offspring',
        ignore_permission: 1,
        include_dead_animal: 1,
        page_no: pageNo
      }
      const response = await getNewAnimalListWithFilters(payload)

      if (response?.success) {
        const newData: OffspringListItem[] = response?.data || []

        if (pageNo === 1) {
          setOffspringList(newData)
        } else {
          setOffspringList(prev => [...prev, ...newData])
        }

        if (newData?.length < 10) {
          setHasMore(false)
        }
      } else {
        if (pageNo === 1) {
          setOffspringList([])
        }
        setHasMore(false)
      }
    } catch (error: any) {
      console.error('Error fetching offspring list:', error?.message || error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadMore = useCallback(() => {
    if (isLoading || !hasMore) return

    const nextPage = page + 1
    setPage(nextPage)
    fetchOffspringList(nextPage)
  }, [isLoading, page, hasMore])

  useEffect(() => {
    if (inView && !isLoading && hasMore) {
      handleLoadMore()
    }
  }, [inView])

  useEffect(() => {
    setPage(1)
    setOffspringList([])
    setHasMore(true)
    fetchOffspringList(1)
  }, [props.animalId, props.isMother])

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const payload: DeleteOffspringPayload = {
        parent_id: props.animalId,
        is_mother: props.isMother,
        offspring_ids: JSON.stringify(selectedOffspring),
        confirm_delete: 1
      }
      const response = await deleteOffspring(payload)
      if (!response?.success) throw new Error(response?.message || 'Failed to delete offspring')
      return response
    },
    onSuccess: response => {
      setPage(1)
      setOffspringList([])
      setHasMore(true)
      fetchOffspringList(1)
      queryClient.invalidateQueries({ queryKey: ['offspring-stats', id, props.isMother] })
      setIsEditing(false)
      setSelectedOffspring([])
      Toaster({ type: 'success', message: response?.message || 'Offspring deleted successfully' })
    },
    onError: (error: any) => {
      Toaster({ type: 'error', message: error?.message || 'Failed to delete offspring' })
    },
    onSettled: () => {
      setConfirmOpen(false)
    }
  })

  const isDeleting = deleteMutation.isPending

  const onEdit = () => {
    setIsEditing(!isEditing)
    setSelectedOffspring([])
  }
  const onAdd = () => setIsDrawerOpen(true)

  const handleCancel = () => {
    setConfirmOpen(false)
  }

  const toggleSelection = (id: string) => {
    setSelectedOffspring(prev => (prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]))
  }

  const handleRouteToAnimalDetails = (animalId: string) => {
    router.push(`/animals/${animalId}`)
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', minHeight: '100%' }}>
      {isLoading && offspringList?.length === 0 && <LoadingSkeleton />}

      {/* Empty State */}
      {!isLoading && offspringList?.length === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button startIcon={<Icon icon='mdi:add' />} variant='contained' onClick={onAdd}>
              {t('animals_module.add_offspring')}
            </Button>
          </Box>

          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <NoDataFound />
          </Box>
        </Box>
      )}

      {offspringList?.length > 0 && (
        <>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 4,
              py: 3,
              mb: 2,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.customColors.addPrimary, 0.1)
            }}
          >
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
              {t('animals_module.offspring')}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {hasPermission !== 'VIEW' && (
                <IconButton size='small' onClick={onAdd} sx={{ color: theme.palette.customColors.addPrimary }}>
                  <Icon icon='gala:add' fontSize={24} />
                </IconButton>
              )}

              {hasPermission === 'DELETE' && (
                <IconButton
                  size='small'
                  onClick={onEdit}
                  sx={{ color: isEditing ? theme.palette.error.main : theme.palette.customColors.OnSurfaceVariant }}
                >
                  <Icon icon='fluent:edit-28-regular' fontSize={24} />
                </IconButton>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {offspringList?.map(item => {
              const isSelected = selectedOffspring?.includes(item?.animal_id)

              return (
                <Box
                  key={item?.animal_id}
                  sx={{
                    p: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative',
                    backgroundColor: isSelected ? alpha(theme.palette.error.main, 0.05) : 'inherit',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: isSelected
                        ? alpha(theme.palette.error.main, 0.08)
                        : alpha(theme.palette.action.hover, 0.04)
                    },
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    mb: 2
                  }}
                >
                  <Box
                    sx={{ flexGrow: 1, cursor: 'pointer' }}
                    onClick={() => handleRouteToAnimalDetails(item?.animal_id)}
                  >
                    <AnimalCard data={item} />
                  </Box>
                  {isEditing && (
                    <Box
                      onClick={e => {
                        e.stopPropagation()
                        toggleSelection(item?.animal_id)
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: theme.palette.error.main,
                        ml: 4,
                        p: 1,
                        borderRadius: '50%',
                        zIndex: 2,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.error.main, 0.1)
                        }
                      }}
                    >
                      <Icon icon={isSelected ? 'carbon:close-filled' : 'carbon:close-outline'} fontSize={30} />
                    </Box>
                  )}
                </Box>
              )
            })}
          </Box>

          {hasMore && (
            <Box ref={loaderRef} display='flex' justifyContent='center' p={4}>
              <CircularProgress size={24} />
            </Box>
          )}

          {!hasMore && offspringList.length > 10 && (
            <Typography align='center' sx={{ mt: 4, color: 'text.disabled', pb: 4 }}>
              {t('animals_module.no_more_offspring_to_load')}
            </Typography>
          )}
        </>
      )}
      {selectedOffspring?.length > 0 && (
        <BottomActionBar
          children={null}
          submitLabel='Save'
          submitBtnVariant='contained'
          showCancel={true}
          cancelLabel='Cancel'
          onCancel={() => {
            setSelectedOffspring([])
            setIsEditing(false)
          }}
          onSubmit={() => setConfirmOpen(true)}
          submitBtnStyle={{ px: 12, py: 3 }}
          loading={isDeleting}
          disabled={isDeleting}
          submitBtnProps={{ type: 'submit' }}
        />
      )}

      {confirmOpen && (
        <ConfirmationDialog
          dialogBoxStatus={confirmOpen}
          onClose={handleCancel}
          title={t('animals_module.are_you_sure_you_want_to_delete_this_offspring')}
          description={t('animals_module.removing_animal_from_list_warning')}
          cancelText={t('cancel')}
          confirmBtnStyle={{ background: theme.palette.error.main, py: 2 }}
          confirmAction={() => deleteMutation.mutate()}
          ConfirmationText={t('yes')}
          image={'/images/warning-icon.svg'}
        />
      )}

      {isDrawerOpen && (
        <AddOffspringDrawer
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false)
          }}
          onAcceptSuccess={() => {
            setPage(1)
            setOffspringList([])
            setHasMore(true)
            fetchOffspringList(1)
            queryClient.invalidateQueries({ queryKey: ['offspring-stats', id, props.isMother] })
          }}
          animalId={Array.isArray(id) ? id[0] : id ?? ''}
          animalsDetails={props.animalDetails}
        />
      )}
    </Box>
  )
}

export default AllOffspring

function LoadingSkeleton() {
  const theme = useTheme() as any
  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {/* Header Skeleton */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 4,
          py: 3,
          backgroundColor: alpha(theme.palette.customColors.addPrimary, 0.1)
        }}
      >
        <Skeleton width={120} height={28} />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant='circular' width={32} height={32} />
          <Skeleton variant='circular' width={32} height={32} />
        </Box>
      </Box>

      {/* Animal Rows Skeleton */}
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {[1, 2, 3].map((_, index) => (
          <Box
            key={index}
            sx={{
              p: 4,
              borderBottom: index === 2 ? 'none' : `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            {/* AnimalCard Skeleton */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Skeleton variant='rounded' width={56} height={56} />

              <Box>
                <Skeleton width={140} height={20} />
                <Skeleton width={100} height={16} />
                <Skeleton width={80} height={16} />
              </Box>
            </Box>

            {/* Delete Icon Skeleton */}
            <Skeleton variant='circular' width={28} height={28} />
          </Box>
        ))}
      </Box>
    </Box>
  )
}
