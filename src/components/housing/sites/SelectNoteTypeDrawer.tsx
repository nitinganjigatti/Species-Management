import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Drawer,
  IconButton,
  Skeleton,
  Typography,
  useTheme
} from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import Icon from 'src/@core/components/icon'
import Search from 'src/views/utility/Search'
import NoDataFound from 'src/views/utility/NoDataFound'
import { fetchObservationTypes } from 'src/store/slices/housing/notesSlice'
import type { ObservationType, ObservationMasterItem } from 'src/types/housing'
import type { RootState, AppDispatch } from 'src/store'

interface SelectedTypeItem {
  typeId: string
  typeLabel?: string
  parentId: string
  parentLabel?: string
  parentType: ObservationType
}

interface SelectedTypes {
  observationType?: ObservationType
  childTypes?: ObservationMasterItem[]
}

interface CategoryTab {
  id: string
  label: string
  count: number
  string_id?: string
}

interface ActiveType {
  id: number
  type_name?: string
  parentId: string
  parentLabel?: string
  parentType: ObservationType
  string_id?: string
}

interface SelectNoteTypeDrawerProps {
  open: boolean
  onClose: () => void
  selectedTypes: SelectedTypes | null
  onAddSelected: (result: SelectedTypes) => void
}

const SelectNoteTypeDrawer: React.FC<SelectNoteTypeDrawerProps> = ({ open, onClose, selectedTypes, onAddSelected }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const dispatch = useDispatch<AppDispatch>()

  const { observationTypes, observationTypesLoading } = useSelector((state: RootState) => state.notes)

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [localSelected, setLocalSelected] = useState<SelectedTypeItem[]>([])

  useEffect(() => {
    if (open) {
      dispatch(fetchObservationTypes())
      initializeSelection()
    }
  }, [open, dispatch])

  // Auto-select first tab once observation types are loaded
  useEffect(() => {
    if (observationTypes && observationTypes.length > 0 && activeCategory === '') {
      setActiveCategory(String(observationTypes[0].id))
    }
  }, [observationTypes])

  const initializeSelection = () => {
    if (selectedTypes?.childTypes && selectedTypes.childTypes.length > 0 && selectedTypes.observationType) {
      const selected: SelectedTypeItem[] = selectedTypes.childTypes.map(child => ({
        typeId: String(child.id),
        typeLabel: (child as any).type_name || child.name,
        parentId: String(selectedTypes.observationType!.id),
        parentLabel: (selectedTypes.observationType as any)!.type_name || selectedTypes.observationType!.name,
        parentType: selectedTypes.observationType!
      }))
      setLocalSelected(selected)
    } else {
      setLocalSelected([])
    }
  }

  // Build category tabs from parent observation types (no "All" tab)
  const categoryTabs = useMemo((): CategoryTab[] => {
    const tabs: CategoryTab[] = []

    observationTypes?.forEach(parent => {
      tabs.push({
        id: String(parent.id),
        label: parent.type_name || parent.name || '',
        count: parent.child_observation?.length || 0,
        string_id: parent.string_id
      })
    })

    return tabs
  }, [observationTypes])

  // Determine the locked parent category (if any selections exist)
  const lockedParentId = useMemo((): string | null => {
    if (localSelected.length === 0) return null

    return localSelected[0].parentId
  }, [localSelected])

  // Check if a category tab should be disabled
  const isCategoryDisabled = (tabId: string): boolean => {
    return lockedParentId !== null && lockedParentId !== tabId
  }

  // Get active types for the selected category
  const activeTypes = useMemo((): ActiveType[] => {
    const category = observationTypes?.find(parent => String(parent.id) === activeCategory)
    if (!category) return []

    const parentId = String(category.id)
    const parentLabel = category.type_name

    return (category.child_observation || []).map(child => ({
      id: child.id,
      type_name: child.type_name,
      string_id: child.string_id,
      parentId,
      parentLabel,
      parentType: category
    }))
  }, [observationTypes, activeCategory])

  // Filter types based on search
  const filteredTypes = useMemo((): ActiveType[] => {
    if (!search.trim()) return activeTypes

    const searchLower = search.toLowerCase()

    return activeTypes.filter(type => type.type_name?.toLowerCase().includes(searchLower))
  }, [activeTypes, search])

  const isTypeSelected = (type: ActiveType): boolean => {
    return localSelected.some(s => s.typeId === String(type.id))
  }

  const isAllSelected = useMemo((): boolean => {
    if (filteredTypes.length === 0) return false

    return filteredTypes.every(type => isTypeSelected(type))
  }, [filteredTypes, localSelected])

  const handleToggleType = (type: ActiveType) => {
    const typeId = String(type.id)
    const typeLabel = type.type_name
    const parentId = type.parentId
    const parentLabel = type.parentLabel
    const parentType = type.parentType

    setLocalSelected(prev => {
      const isSelected = prev.some(s => s.typeId === typeId)
      if (isSelected) {
        return prev.filter(s => s.typeId !== typeId)
      } else {
        return [...prev, { typeId, typeLabel, parentId, parentLabel, parentType }]
      }
    })
  }

  const handleToggleAll = () => {
    if (isAllSelected) {
      const typeIdsToRemove = filteredTypes.map(t => String(t.id))
      setLocalSelected(prev => prev.filter(s => !typeIdsToRemove.includes(s.typeId)))
    } else {
      const newSelections: SelectedTypeItem[] = filteredTypes
        .filter(type => !isTypeSelected(type))
        .map(type => ({
          typeId: String(type.id),
          typeLabel: type.type_name,
          parentId: type.parentId,
          parentLabel: type.parentLabel,
          parentType: type.parentType
        }))
      setLocalSelected(prev => [...prev, ...newSelections])
    }
  }

  const handleDrawerClose = () => {
    onClose()
    setSearch('')
    setLocalSelected([])
    setActiveCategory('')
  }

  const handleAdd = () => {
    if (localSelected.length === 0) {
      handleDrawerClose()

      return
    }

    const firstSelected = localSelected[0]
    const parentType = firstSelected.parentType

    const selectedChildTypes = localSelected
      .filter(s => s.parentId === firstSelected.parentId)
      .map(s => parentType?.child_observation?.find(c => String(c.id) === s.typeId))
      .filter((item): item is ObservationMasterItem => Boolean(item))

    const result: SelectedTypes = {
      observationType: parentType,
      childTypes: selectedChildTypes
    }

    if (onAddSelected) {
      onAddSelected(result)
    }
    handleDrawerClose()
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={handleDrawerClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 560 },
            backgroundColor: theme.palette.customColors?.Background,
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }
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
            <Icon icon='mdi:note-text-outline' fontSize={28} color={theme.palette.primary.main} />
            <Typography
              sx={{
                fontSize: '24px',
                fontWeight: 500,
                color: theme.palette.customColors?.OnSurfaceVariant
              }}
            >
              {t('housing_module.select_note_type')}
            </Typography>
          </Box>
          <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
            <Icon icon='mdi:close' fontSize={30} />
          </IconButton>
        </Box>

        {/* Search */}
        <Box sx={{ px: 6, pt: 6, pb: 3, flexShrink: 0 }}>
          <Search
            placeholder={t('housing_module.search_note_types') as string}
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            inputStyle={{ py: '12px', px: '12px' }}
            width='100%'
          />
        </Box>

        {/* Category Tabs */}
        <Box sx={{ px: 6, pb: 3, flexShrink: 0 }}>
          {observationTypesLoading ? (
            <Box display='flex' justifyContent='center' alignItems='center' py={2}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
                '-ms-overflow-style': 'none',
                pb: 1
              }}
            >
              {categoryTabs.map(tab => {
                const isActive = activeCategory === tab.id
                const isDisabled = isCategoryDisabled(tab.id)

                return (
                  <Button
                    key={tab.id}
                    onClick={() => !isDisabled && setActiveCategory(tab.id)}
                    disabled={isDisabled}
                    sx={{
                      textTransform: 'none',
                      borderRadius: 1,
                      px: 3,
                      py: 1.5,
                      fontWeight: 500,
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      minWidth: 'auto',
                      flexShrink: 0,
                      border: 'none',
                      backgroundColor: isActive
                        ? theme.palette.customColors?.OnPrimaryContainer
                        : theme.palette.customColors?.mdAntzNeutral,
                      color: isActive
                        ? theme.palette.customColors?.OnPrimary
                        : theme.palette.customColors?.OnPrimaryContainer,
                      '&:hover': isActive
                        ? {
                            backgroundColor: `${theme.palette.customColors?.OnPrimaryContainer} !important`
                          }
                        : {
                            backgroundColor: theme.palette.customColors?.OutlineVariant
                          },
                      '&.Mui-disabled': {
                        backgroundColor: theme.palette.customColors?.mdAntzNeutral,
                        color: theme.palette.action.disabled,
                        opacity: 0.5
                      }
                    }}
                  >
                    {t(tab.string_id || '', { defaultValue: tab.label })} ({tab.count})
                  </Button>
                )
              })}
            </Box>
          )}
        </Box>

        {/* Select All Toggle */}
        {!observationTypesLoading && filteredTypes.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 6,
              py: 2,
              flexShrink: 0,
              cursor: 'pointer'
            }}
            onClick={handleToggleAll}
          >
            <Typography
              sx={{
                fontSize: '1rem',
                fontWeight: 500,
                color: theme.palette.customColors?.OnSurfaceVariant
              }}
            >
              {isAllSelected ? t('deselect_all') : t('select_all')}
            </Typography>
            <Checkbox checked={isAllSelected} />
          </Box>
        )}

        {/* Types List */}
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <Box sx={{ py: 3, px: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {observationTypesLoading ? (
              <>
                {[1, 2, 3, 4, 5, 6].map(item => (
                  <Skeleton
                    key={item}
                    variant='rectangular'
                    height={72}
                    sx={{
                      borderRadius: 1,
                      bgcolor: theme.palette.action.hover
                    }}
                  />
                ))}
              </>
            ) : (
              <>
                {filteredTypes.length === 0 ? (
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
                    <NoDataFound variant='Meerkat' height={250} width={250} />
                  </Box>
                ) : (
                  filteredTypes.map((type, index) => {
                    const typeId = String(type.id)
                    const typeLabel = type.type_name
                    const isSelected = isTypeSelected(type)

                    return (
                      <Box
                        key={typeId || index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 4,
                          border: isSelected
                            ? `1px solid ${theme.palette.primary.main}`
                            : `1px solid ${theme.palette.customColors?.SurfaceVariant}`,
                          backgroundColor: isSelected
                            ? theme.palette.customColors?.Surface
                            : theme.palette.customColors?.OnPrimary,
                          borderRadius: 1,
                          cursor: 'pointer',
                          transition: 'background 0.2s, border-color 0.2s'
                        }}
                        onClick={() => handleToggleType(type)}
                      >
                        <Box>
                          <Typography
                            sx={{
                              fontSize: '1rem',
                              fontWeight: 600,
                              color: theme.palette.customColors?.OnSurfaceVariant
                            }}
                          >
                            {t(type?.string_id || '', { defaultValue: typeLabel })}
                          </Typography>
                        </Box>
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
              fontSize: '1.25rem',
              fontWeight: 500,
              color: theme.palette.customColors?.OnSurface
            }}
          >
            {t('selected')} - {localSelected.length}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '50%' }}>
            <Button
              variant='outlined'
              fullWidth
              onClick={handleDrawerClose}
              sx={{
                borderColor: theme.palette.customColors?.OnPrimaryContainer,
                color: theme.palette.customColors?.OnPrimaryContainer,
                height: '56px'
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              variant='contained'
              fullWidth
              onClick={handleAdd}
              sx={{ height: '56px' }}
              disabled={localSelected.length === 0}
            >
              {t('add')}
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default SelectNoteTypeDrawer
