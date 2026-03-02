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
import React, { useEffect, useState, useMemo } from 'react'
import Icon from 'src/@core/components/icon'
import { getNecropsyBodyParts } from 'src/lib/api/necropsy'
import Search from 'src/views/utility/Search'
import NoDataFound from 'src/views/utility/NoDataFound'

const SelectOrganDrawer = ({ open, setOpen, selectedOrgans, onAddSelected }) => {
  const theme = useTheme()

  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [organCategories, setOrganCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('')
  const [localSelected, setLocalSelected] = useState([])

  useEffect(() => {
    if (open) {
      fetchOrgans()
      initializeSelection()
    }
  }, [open])

  const initializeSelection = () => {
    const selected = []
    selectedOrgans.forEach(organ => {
      if (organ.parts?.length > 0) {
        organ.parts.forEach(part => {
          selected.push({
            partId: String(part.id),
            partLabel: part.organ_name || part.label || part.name,
            categoryId: String(organ.id),
            categoryLabel: organ.label
          })
        })
      }
    })
    setLocalSelected(selected)
  }

  const fetchOrgans = async () => {
    setLoading(true)
    try {
      const res = await getNecropsyBodyParts({})
      if (res?.success && res?.data) {
        setOrganCategories(res.data)
        if (res.data.length > 0) {
          setActiveCategory('')
        }
      }
    } catch (error) {
      console.error('Error fetching body parts:', error)
    } finally {
      setLoading(false)
    }
  }

  const categoryTabs = useMemo(() => {
    const totalParts = organCategories.reduce((sum, cat) => sum + (cat.parts?.length || 0), 0)
    const tabs = [{ id: '', label: 'All', count: totalParts }]

    organCategories.forEach(cat => {
      tabs.push({
        id: String(cat.id || cat.body_section_id),
        label: cat.label || cat.name,
        count: cat.parts?.length || 0
      })
    })

    return tabs
  }, [organCategories])

  const activeParts = useMemo(() => {
    if (activeCategory === '') {
      const allParts = []
      organCategories.forEach(cat => {
        const categoryId = String(cat.id || cat.body_section_id)
        const categoryLabel = cat.label || cat.name

        cat.parts?.forEach(part => {
          allParts.push({
            ...part,
            categoryId,
            categoryLabel
          })
        })
      })

      return allParts
    }

    const category = organCategories.find(cat => String(cat.id || cat.body_section_id) === activeCategory)

    if (!category) return []

    const categoryId = String(category.id || category.body_section_id)
    const categoryLabel = category.label || category.name

    return (category.parts || []).map(part => ({
      ...part,
      categoryId,
      categoryLabel
    }))
  }, [organCategories, activeCategory])

  const filteredParts = useMemo(() => {
    if (!search.trim()) return activeParts

    const searchLower = search.toLowerCase()

    return activeParts.filter(part => {
      const label = part.label || part.name || part.organ_name || ''

      return label.toLowerCase().includes(searchLower)
    })
  }, [activeParts, search])

  const isPartSelected = part => {
    const partId = String(part.id || part.body_part_id)

    return localSelected.some(s => s.partId === partId)
  }

  const isAllSelected = useMemo(() => {
    if (filteredParts.length === 0) return false

    return filteredParts.every(part => isPartSelected(part))
  }, [filteredParts, localSelected])

  const handleTogglePart = part => {
    const partId = String(part.id || part.body_part_id)
    const partLabel = part.label || part.name || part.organ_name
    const categoryId = part.categoryId
    const categoryLabel = part.categoryLabel

    setLocalSelected(prev => {
      const isSelected = prev.some(s => s.partId === partId)
      if (isSelected) {
        return prev.filter(s => s.partId !== partId)
      } else {
        return [...prev, { partId, partLabel, categoryId, categoryLabel }]
      }
    })
  }

  const handleToggleAll = () => {
    if (isAllSelected) {
      const partIdsToRemove = filteredParts.map(p => String(p.id || p.body_part_id))
      setLocalSelected(prev => prev.filter(s => !partIdsToRemove.includes(s.partId)))
    } else {
      const newSelections = filteredParts
        .filter(part => !isPartSelected(part))
        .map(part => ({
          partId: String(part.id || part.body_part_id),
          partLabel: part.label || part.name || part.organ_name,
          categoryId: part.categoryId,
          categoryLabel: part.categoryLabel
        }))
      setLocalSelected(prev => [...prev, ...newSelections])
    }
  }

  const handleDrawerClose = () => {
    setOpen(false)
    setSearch('')
    setLocalSelected([])
    setActiveCategory('')
  }

  const handleAdd = () => {
    const groupedByCategory = {}
    localSelected.forEach(({ partId, partLabel, categoryId, categoryLabel }) => {
      if (!groupedByCategory[categoryId]) {
        groupedByCategory[categoryId] = {
          id: categoryId,
          label: categoryLabel,
          parts: []
        }
      }
      groupedByCategory[categoryId].parts.push({
        id: partId,
        organ_name: partLabel,
        label: partLabel,
        value: ''
      })
    })

    const organs = Object.values(groupedByCategory)

    if (onAddSelected) {
      onAddSelected(organs)
    }
    handleDrawerClose()
  }

  return (
    <Drawer
      anchor='right'
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '562px'],
          display: 'flex',
          flexDirection: 'column'
        }
      }}
      open={open}
      onClose={handleDrawerClose}
    >
      <Box
        sx={{
          backgroundColor: theme.palette.customColors.OnPrimary,
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.palette.customColors.OnPrimary,
            px: '1.2rem',
            py: '1rem',
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <Icon icon='mdi:human-male' fontSize={32} color={theme.palette.primary.main} />
            <Typography sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
              Select Organs
            </Typography>
          </Box>
          <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
            <Icon icon='mdi:close' fontSize={30} />
          </IconButton>
        </Box>

        <Box sx={{ px: 6, pt: 6, pb: 3, flexShrink: 0 }}>
          <Search
            placeholder='Search Organs'
            value={search}
            onChange={e => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            inputStyle={{ py: '12px', px: '12px' }}
            width='100%'
          />
        </Box>

        <Box sx={{ px: 6, pb: 3, flexShrink: 0 }}>
          {loading ? (
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

                return (
                  <Button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
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
                        ? theme.palette.customColors.OnPrimaryContainer
                        : theme.palette.customColors.mdAntzNeutral || theme.palette.grey[200],
                      color: isActive
                        ? theme.palette.customColors.OnPrimary
                        : theme.palette.customColors.OnPrimaryContainer,
                      '&:hover': isActive
                        ? { backgroundColor: `${theme.palette.customColors.OnPrimaryContainer} !important` }
                        : { backgroundColor: theme.palette.customColors.OutlineVariant || theme.palette.grey[300] }
                    }}
                  >
                    {tab.label} ({tab.count})
                  </Button>
                )
              })}
            </Box>
          )}
        </Box>

        {!loading && filteredParts.length > 0 && (
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
            <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
              {isAllSelected ? 'Deselect all' : 'Select all'}
            </Typography>
            <Checkbox checked={isAllSelected} />
          </Box>
        )}

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Box sx={{ py: 3, px: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {loading ? (
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
                {filteredParts.length === 0 ? (
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
                  filteredParts.map((part, index) => {
                    const partId = String(part.id || part.body_part_id)
                    const partLabel = part.label || part.name || part.organ_name
                    const isSelected = isPartSelected(part)

                    return (
                      <Box
                        key={partId || index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 4,
                          border: isSelected
                            ? `1px solid ${theme.palette.primary.main}`
                            : `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                          backgroundColor: isSelected
                            ? theme.palette.customColors.Surface
                            : theme.palette.customColors.OnPrimary,
                          borderRadius: 1,
                          cursor: 'pointer',
                          transition: 'background 0.2s, border-color 0.2s'
                        }}
                        onClick={() => handleTogglePart(part)}
                      >
                        <Box>
                          <Typography
                            sx={{
                              fontSize: '1rem',
                              fontWeight: 600,
                              color: theme.palette.customColors.OnSurfaceVariant
                            }}
                          >
                            {partLabel}
                          </Typography>
                          {activeCategory === '' && (
                            <Typography variant='caption' color='text.secondary'>
                              {part.categoryLabel}
                            </Typography>
                          )}
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

        <Box
          sx={{
            p: 4,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: 'background.paper',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0px -1px 30px 0px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 500, color: theme.palette.customColors.OnSurface }}>
            Selected - {localSelected.length}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '50%' }}>
            <Button
              variant='outlined'
              fullWidth
              onClick={handleDrawerClose}
              sx={{
                borderColor: theme.palette.customColors.OnPrimaryContainer,
                color: theme.palette.customColors.OnPrimaryContainer,
                height: '56px'
              }}
            >
              Cancel
            </Button>
            <Button variant='contained' fullWidth onClick={handleAdd} sx={{ height: '56px' }}>
              Add
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default SelectOrganDrawer
