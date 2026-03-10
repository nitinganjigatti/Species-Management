import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Drawer, Typography, IconButton, CircularProgress, Button, Checkbox } from '@mui/material'
import { Close as CloseIcon
} from '@mui/icons-material'
import { useTheme, alpha } from '@mui/material/styles'
import { useInView } from 'react-intersection-observer'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'

import AnimalCard from 'src/views/utility/AnimalCard'
import NoDataFound from 'src/views/utility/NoDataFound'
import { getLineageParents } from 'src/lib/api/housing'
import type { LineageAnimal, ExternalAnimal } from 'src/types/housing'

const PAGE_SIZE = 10

interface ParentListDrawerProps {
  open: boolean
  onClose: () => void
  animalId: number | string
  parentType: 'Dam' | 'Sire'
  isExternal: boolean
  totalCount: number
  // For external parents, pass the data directly (no API call needed)
  initialData?: (LineageAnimal | ExternalAnimal)[]
  onAnimalClick?: (animal: LineageAnimal | ExternalAnimal) => void
  // Edit mode - allows selecting parents to remove
  editMode?: boolean
  onRemove?: (animals: (LineageAnimal | ExternalAnimal)[]) => void
}

const ParentListDrawer: React.FC<ParentListDrawerProps> = ({
  open,
  onClose,
  animalId,
  parentType,
  isExternal,
  totalCount,
  initialData = [],
  onAnimalClick,
  editMode = false,
  onRemove
}) => {
  const theme = useTheme() as any
  const queryClient = useQueryClient()

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })
  const cooldownRef = useRef(false)

  // Selected animals for removal in edit mode
  const [selectedForRemoval, setSelectedForRemoval] = useState<(number | string)[]>([])

  const queryKey = ['parent-list-drawer', animalId, parentType, isExternal, open]

  // Only fetch for internal parents - external parents use initialData
  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } = useInfiniteQuery({
    queryKey,
    enabled: Boolean(open && !isExternal),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      // Mobile uses: is_mother, type: "internal"
      const params: Record<string, any> = {
        animal_id: animalId,
        is_mother: parentType === 'Dam' ? '1' : '0',
        type: 'internal',
        page_no: pageParam,
        limit: PAGE_SIZE
      }

      const res = await getLineageParents(params)

      // Response mapping: data?.result (matching mobile implementation)
      const resultData: LineageAnimal[] = res?.data?.result || []

      return {
        result: resultData,
        nextPage: resultData.length === PAGE_SIZE ? pageParam + 1 : undefined,
        total: res?.data?.total_count || totalCount
      }
    },
    getNextPageParam: lastPage => lastPage?.nextPage,
    gcTime: 0,
    staleTime: 0
  })

  const clearQuery = useCallback(() => {
    queryClient.removeQueries({
      queryKey: ['parent-list-drawer'],
      exact: false
    })
  }, [queryClient])

  // Cleanup when drawer closes
  useEffect(() => {
    if (!open) {
      queryClient.cancelQueries({ queryKey: ['parent-list-drawer'] })
      clearQuery()
      cooldownRef.current = false
      setSelectedForRemoval([])
    }
  }, [open, queryClient, clearQuery])

  // For internal parents: use fetched data
  // For external parents: use initialData passed as prop
  const list = useMemo(() => {
    if (isExternal) {
      return initialData
    }

    return data?.pages?.flatMap(page => page.result) || []
  }, [data, isExternal, initialData])

  const loadMore = useCallback(() => {
    if (cooldownRef.current) return
    if (!isFetchingNextPage && hasNextPage && !isExternal) {
      cooldownRef.current = true
      fetchNextPage().finally(() => {
        setTimeout(() => {
          cooldownRef.current = false
        }, 300)
      })
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage, isExternal])

  useEffect(() => {
    if (inView) {
      loadMore()
    }
  }, [inView, loadMore])

  // Get animal ID for key - defined first as it's used by other functions
  const getAnimalEntityId = (animal: LineageAnimal | ExternalAnimal): number | string | undefined => {
    if (isExternal) {
      return (animal as ExternalAnimal).external_parent_id || (animal as ExternalAnimal).id
    }

    return (animal as LineageAnimal).animal_id || (animal as LineageAnimal).id
  }

  // Toggle selection for removal
  const toggleSelection = (entityId: number | string) => {
    setSelectedForRemoval(prev => {
      if (prev.includes(entityId)) {
        return prev.filter(id => id !== entityId)
      }

      return [...prev, entityId]
    })
  }

  const handleAnimalClick = (animal: LineageAnimal | ExternalAnimal) => {
    if (editMode) {
      // In edit mode, clicking toggles selection
      const entityId = getAnimalEntityId(animal)
      if (entityId !== undefined) {
        toggleSelection(entityId)
      }
    } else if (onAnimalClick) {
      onAnimalClick(animal)
    }
  }

  // Handle remove button click
  const handleRemoveClick = () => {
    if (onRemove && selectedForRemoval.length > 0) {
      const animalsToRemove = list.filter(animal => {
        const entityId = getAnimalEntityId(animal)

        return entityId !== undefined && selectedForRemoval.includes(entityId)
      })
      onRemove(animalsToRemove)
    }
  }

  // Transform animal data for AnimalCard
  const transformAnimalData = (animal: LineageAnimal | ExternalAnimal) => {
    return {
      animal_id: isExternal ? undefined : (animal as LineageAnimal).animal_id,
      local_identifier_name: (animal as any).local_identifier_name,
      local_identifier_value: (animal as any).local_identifier_value || (animal as any).local_identifier,
      default_icon: (animal as any).default_icon || (animal as any).image_url,
      common_name: (animal as any).common_name || (animal as any).vernacular_name,
      default_common_name: (animal as any).default_common_name,
      scientific_name: (animal as any).scientific_name,
      complete_name: (animal as any).complete_name,
      sex: animal.sex,
      gender: animal.sex,
      type: (animal as any).type,
      total_animal: (animal as any).total_animal,
      user_enclosure_name: (animal as any).user_enclosure_name || (animal as any).enclosure_name,
      section_name: (animal as any).section_name,
      site_name: (animal as any).site_name,
      breed_name: (animal as any).breed_name,
      morph_name: (animal as any).morph_name
    }
  }

  const isLoading = isFetching && list.length === 0 && !isExternal

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '562px'],
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.customColors?.bodyBg || theme.palette.background.default
        }
      }}
    >
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Header */}
        <Box
          sx={{
            p: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: theme.palette.background.paper
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: '24px',
                fontWeight: 500,
                fontFamily: 'Inter',
                color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
              }}
            >
              {editMode ? `Remove ${parentType}` : parentType}
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.primary.main
              }}
            >
              {editMode
                ? selectedForRemoval.length > 0
                  ? `${selectedForRemoval.length} selected`
                  : 'Select parents to remove'
                : `Probable ${totalCount}`}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Animal List */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 4,
            py: 4,
            bgcolor: theme.palette.customColors?.bodyBg || theme.palette.background.default,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            minHeight: 0,
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
            '-ms-overflow-style': 'none'
          }}
        >
          {isLoading ? (
            <Box display='flex' justifyContent='center' alignItems='center' flex={1}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {list.map((animal, index) => {
                const entityId = getAnimalEntityId(animal)
                const transformedData = transformAnimalData(animal)
                const isSelected = entityId !== undefined && selectedForRemoval.includes(entityId)

                return (
                  <Box
                    key={entityId || index}
                    onClick={() => handleAnimalClick(animal)}
                    sx={{
                      p: 3,
                      borderRadius: '8px',
                      backgroundColor: isSelected
                        ? alpha(theme.palette.error.main, 0.08)
                        : theme.palette.background.paper,
                      border: `1px solid ${
                        isSelected
                          ? theme.palette.error.main
                          : theme.palette.customColors?.OutlineVariant || theme.palette.divider
                      }`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      '&:hover': {
                        backgroundColor: isSelected
                          ? alpha(theme.palette.error.main, 0.12)
                          : alpha(theme.palette.primary.main, 0.02)
                      }
                    }}
                  >
                    {/* Checkbox in edit mode */}
                    {editMode && (
                      <Checkbox
                        checked={isSelected}
                        onChange={() => entityId !== undefined && toggleSelection(entityId)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          p: 0,
                          mt: 0.5,
                          color: theme.palette.error.main,
                          '&.Mui-checked': {
                            color: theme.palette.error.main
                          }
                        }}
                      />
                    )}

                    <Box sx={{ flex: 1 }}>
                      {/* External/Dead Labels */}
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        {isExternal && (
                          <Typography
                            sx={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: theme.palette.warning.dark,
                              textTransform: 'uppercase'
                            }}
                          >
                            External
                          </Typography>
                        )}
                        {animal.is_alive !== undefined && (animal.is_alive === 0 || animal.is_alive === '0') && (
                          <Typography
                            sx={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: theme.palette.error.main,
                              textTransform: 'uppercase'
                            }}
                          >
                            Dead
                          </Typography>
                        )}
                      </Box>

                      <AnimalCard data={transformedData} />

                      {/* External-specific fields */}
                      {isExternal && (animal as ExternalAnimal).organization_name && (
                        <Typography
                          sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.secondary, mt: 1 }}
                        >
                          Institute: {(animal as ExternalAnimal).organization_name}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )
              })}

              {list.length === 0 && !isFetching && (
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

              {/* Loader for infinite scroll - only for internal parents */}
              {!isExternal && hasNextPage && (
                <Box ref={loaderRef} display='flex' justifyContent='center' py={2}>
                  <CircularProgress />
                </Box>
              )}

              {!hasNextPage && list.length > 0 && !isExternal && (
                <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
                  No more parents to load
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Remove Button - shown in edit mode when items are selected */}
      {editMode && selectedForRemoval.length > 0 && (
        <Box
          sx={{
            width: '100%',
            p: 4,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Button
            variant='contained'
            color='error'
            fullWidth
            onClick={handleRemoveClick}
            sx={{ p: 3, fontWeight: 600 }}
          >
            Remove {selectedForRemoval.length > 1 ? `(${selectedForRemoval.length})` : ''}
          </Button>
        </Box>
      )}
    </Drawer>
  )
}

export default ParentListDrawer
