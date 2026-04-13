import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, Checkbox, CircularProgress, Drawer, IconButton, Radio, Typography, useTheme } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import Icon from 'src/@core/components/icon'
import { fetchObservationTypes } from 'src/store/slices/housing/notesSlice'
import type { ObservationType, ObservationMasterItem } from 'src/types/housing'
import type { RootState, AppDispatch } from 'src/store'

interface SelectedTypes {
  observationType?: ObservationType
  childTypes?: ObservationMasterItem[]
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

  const [selectedParentId, setSelectedParentId] = useState<string>('')
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      dispatch(fetchObservationTypes())
      initializeSelection()
    }
  }, [open, dispatch])

  const initializeSelection = () => {
    if (selectedTypes?.observationType) {
      setSelectedParentId(String(selectedTypes.observationType.id))
      if (selectedTypes.childTypes && selectedTypes.childTypes.length > 0) {
        setSelectedChildIds(selectedTypes.childTypes.map(c => String(c.id)))
      } else {
        setSelectedChildIds([])
      }
    } else {
      setSelectedParentId('')
      setSelectedChildIds([])
    }
  }

  const handleParentSelect = (parentId: string) => {
    setSelectedParentId(parentId)
    setSelectedChildIds([])
  }

  const handleChildToggle = (childId: string) => {
    setSelectedChildIds(prev => {
      if (prev.includes(childId)) {
        return prev.filter(id => id !== childId)
      }
      return [...prev, childId]
    })
  }

  const selectedParent = useMemo(() => {
    return observationTypes?.find(p => String(p.id) === selectedParentId) || null
  }, [observationTypes, selectedParentId])

  const hasChildren = (selectedParent?.child_observation?.length || 0) > 0
  const canSubmit = selectedParentId !== '' && (!hasChildren || selectedChildIds.length > 0)

  const handleDrawerClose = () => {
    onClose()
    setSelectedParentId('')
    setSelectedChildIds([])
  }

  const handleAdd = () => {
    if (!selectedParent) {
      handleDrawerClose()
      return
    }

    const childTypes = selectedChildIds
      .map(id => selectedParent.child_observation?.find(c => String(c.id) === id))
      .filter((item): item is ObservationMasterItem => Boolean(item))

    const result: SelectedTypes = {
      observationType: selectedParent,
      childTypes
    }

    onAddSelected(result)
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
            px: 5,
            py: 4,
            borderBottom: `1px solid ${theme.palette.divider}`,
            flexShrink: 0
          }}
        >
          <Typography
            sx={{
              fontSize: '1.5rem',
              fontWeight: 500,
              color: theme.palette.customColors?.OnSurfaceVariant
            }}
          >
            {t('notes_module.select_note_type')}
          </Typography>
          <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>

        {/* Types List */}
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, p: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {observationTypesLoading ? (
            <Box display='flex' justifyContent='center' alignItems='center' py={8}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            (Array.isArray(observationTypes) ? observationTypes : []).map(parent => {
              const parentId = String(parent.id)
              const isSelected = selectedParentId === parentId
              const children = parent.child_observation || []

              return (
                <Box
                  key={parentId}
                  sx={{
                    border: isSelected ? `1px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.customColors?.OutlineVariant}`,
                    borderRadius: '8px',

                  }}
                >
                  {/* Parent row with radio */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 4,
                      py: 1,
                      minHeight: 56,
                      backgroundColor: isSelected
                        ? theme.palette.customColors?.displaybgPrimary
                        : theme.palette.customColors?.OnPrimary,
                      cursor: 'pointer',
                      borderRadius: isSelected && children.length > 0 ? '8px 8px 0 0' : '8px',
                    }}
                    onClick={() => handleParentSelect(parentId)}
                  >
                    <Typography
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 500,
                        color: theme.palette.customColors?.OnSurfaceVariant
                      }}
                    >
                      {parent.string_id
                        ? t(parent.string_id, { defaultValue: parent.type_name || parent.name || '' })
                        : parent.type_name || parent.name || ''}
                    </Typography>
                    <Radio
                      checked={isSelected}
                      onChange={() => handleParentSelect(parentId)}
                      sx={{
                        color: theme.palette.customColors?.OutlineVariant,
                        '&.Mui-checked': {
                          color: theme.palette.primary.main
                        }
                      }}
                    />
                  </Box>

                  {/* Children (expanded when parent selected) */}
                  {isSelected && children.length > 0 && (
                    <Box
                      sx={{
                        borderTop: `1px solid ${theme.palette.customColors?.OutlineVariant}`,
                        borderRadius: '0 0 8px 8px'
                      }}
                    >
                      {children.map(child => {
                        const childId = String(child.id)
                        const isChildSelected = selectedChildIds.includes(childId)

                        return (
                          <Box
                            key={childId}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              px: 4,
                              py: 1,
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: theme.palette.action.hover
                              }
                            }}
                            onClick={() => handleChildToggle(childId)}
                          >
                            <Typography
                              sx={{
                                fontSize: '0.95rem',
                                fontWeight: 400,
                                color: theme.palette.customColors?.OnSurfaceVariant
                              }}
                            >
                              {child.string_id
                                ? t(child.string_id, { defaultValue: child.type_name || child.name || '' })
                                : child.type_name || child.name || ''}
                            </Typography>
                            <Checkbox
                              checked={isChildSelected}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleChildToggle(childId)
                              }}
                              sx={{
                                color: theme.palette.customColors?.OutlineVariant,
                                '&.Mui-checked': {
                                  color: theme.palette.primary.main
                                }
                              }}
                            />
                          </Box>
                        )
                      })}
                    </Box>
                  )}
                </Box>
              )
            })
          )}
        </Box>

        {/* Footer */}
        {canSubmit && (
          <Box
            sx={{
              p: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper
            }}
          >
            <Button variant='contained' fullWidth onClick={handleAdd} sx={{ py: 3, borderRadius: '8px' }}>
              {t('done')}
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  )
}

export default SelectNoteTypeDrawer
