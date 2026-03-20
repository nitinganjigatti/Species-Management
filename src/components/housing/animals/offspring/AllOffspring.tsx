import React, { FC, useEffect, useMemo, useState } from 'react'
import { Box, Typography, useTheme, Button, Skeleton } from '@mui/material'
import { Icon } from '@iconify/react'
import styled from '@emotion/styled'
import { alpha } from '@mui/material/styles'
import { useRouter } from 'next/router'

import AnimalCard from 'src/views/utility/AnimalCard'
import NoDataFound from 'src/views/utility/NoDataFound'

import {StyledTypographyProps,TabProps} from 'src/types/housing/animalsOffspring'
import { getNewAnimalListWithFilters } from 'src/lib/api/hospital/inpatient'
import { deleteOffspring } from 'src/lib/api/housing'
import { useQueryClient } from '@tanstack/react-query'
import { IconButton } from '@mui/material'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import BottomActionBar from 'src/views/utility/BottomActionBar'
import AddOffspringDrawer from './AddOffspringDrawer'

const AllOffspring: FC<TabProps> = props => {
  const router = useRouter()
  const { id } = router.query
  const theme = useTheme() as any
  const queryClient = useQueryClient()
  const [data, setData] = useState<any[] | null>(null)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false)
  const [selectedOffspring, setSelectedOffspring] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)

  const onEdit = () => {
    setIsEditing(!isEditing)
    setSelectedOffspring([])
  }
  const onAdd = () => setIsDrawerOpen(true)

  const fetchOffspringList = async () => {
    setIsLoading(true)
    try {
      const payload = {
        parent_id: props.animalId,
        is_mother: props.isMother,
        use_case: 'offspring',
        ignore_permission: 1,
        include_dead_animal: 1,
        page_no: 1
      }
      const response = await getNewAnimalListWithFilters(payload)
      if (response?.success) {
        setData(response.data)
      }
    } catch (error: any) {
      console.log(error?.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteOffspring = async () => {
    setIsDeleting(true)
    try {
      const payload = {
        parent_id: props.animalId,
        is_mother: props.isMother as 0 | 1,
        offspring_ids: JSON.stringify(selectedOffspring.map(Number)),
        confirm_delete: 1 as 0 | 1
      }
      const response = await deleteOffspring(payload)
      if (response?.success) {
        fetchOffspringList()
        queryClient.invalidateQueries({ queryKey: ['offspring-stats', id, props.isMother] })
        setIsEditing(false)
        setSelectedOffspring([])
      }
    } catch (error: any) {
      console.log(error?.message)
    } finally {
      setIsDeleting(false)
      setConfirmOpen(false)
    }
  }

  const handleConfirm = () => {
    handleDeleteOffspring()
  }

  const handleCancel = () => {
    setConfirmOpen(false)
  }

  const toggleSelection = (id: string) => {
    if (selectedOffspring.includes(id)) {
      setSelectedOffspring(selectedOffspring.filter(i => i !== id))
    } else {
      setSelectedOffspring([...selectedOffspring, id])
    }
  }

  useEffect(() => {
    fetchOffspringList()
  }, [])

  // if (isLoading) {
  //   return <LoadingSkeleton />
  // }

  // if (!data || data.length === 0) {
  //   return (
  //     <Box
  //       sx={{
  //         display: 'flex',
  //         flexDirection: 'column',
  //         gap: 4
  //       }}
  //     >
  //       <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
  //         <Button startIcon={<Icon icon='mdi:add' />} variant='contained' onClick={onAdd}>
  //           Add Offspring
  //         </Button>
  //       </Box>

  //       <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
  //         <NoDataFound />
  //       </Box>
  //     </Box>
  //   )
  // }
  
  return (
    <Box sx={{ position: 'relative', width: '100%', minHeight: '100%' }}>
      {isLoading && <LoadingSkeleton />}

      {/* Empty State */}
      {!isLoading && (!data || data.length === 0) && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button startIcon={<Icon icon='mdi:add' />} variant='contained' onClick={onAdd}>
              Add Offspring
            </Button>
          </Box>

          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <NoDataFound />
          </Box>
        </Box>
      )}

      {!isLoading && data && data.length > 0 && (
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
              Offspring
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size='small' onClick={onAdd} sx={{ color: theme.palette.customColors.addPrimary }}>
                <Icon icon='gala:add' fontSize={24} />
              </IconButton>

              <IconButton
                size='small'
                onClick={onEdit}
                sx={{ color: isEditing ? theme.palette.error.main : theme.palette.customColors.OnSurfaceVariant }}
              >
                <Icon icon='fluent:edit-28-regular' fontSize={24} />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {data?.map((item, index) => {
              const isSelected = selectedOffspring.includes(item.animal_id)
              return (
                <Box
                  key={index}
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
                  <Box sx={{ flexGrow: 1 }}>
                    <AnimalCard data={item} />
                  </Box>
                  {isEditing && (
                    <Box
                      onClick={e => {
                        e.stopPropagation()
                        toggleSelection(item.animal_id)
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
        </>
      )}
      {selectedOffspring.length > 0 && (
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
          title={'Are you sure you want to delete this offspring?'}
          description={'Removing an animal from the list will also remove its linked animals from the lineage list.'}
          cancelText={'Cancel'}
          confirmBtnStyle={{ background: theme.palette.error.main, py: 2 }}
          confirmAction={handleConfirm}
          ConfirmationText={'Yes'}
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
            fetchOffspringList()
            queryClient.invalidateQueries({ queryKey: ['offspring-stats', id, props.isMother] })
          }}
          animalId={id}
          animalsDetails={props.animalDetails}
        />
      )}
    </Box>
  )
}

export default AllOffspring
const StyledTypography = styled(Typography)<StyledTypographyProps>(({ theme, fontWeight, fontSize, color, sx }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: color || (theme as any).palette?.customColors?.OnSurfaceVariant || (theme as any).palette?.text?.primary,
  ...(sx as any)
}))

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
