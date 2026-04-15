'use client'

import { useState, useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Chip from '@mui/material/Chip'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { useRouter } from 'next/navigation'

import { COMPONENT_REGISTRY, CATEGORIES, getComponentsByCategory, getCategoryColorKey, getCategoryLabel, resolveColorKey } from './registry'

const ComponentLibraryPage = () => {
  const theme = useTheme()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredComponents = useMemo(() => {
    let components = getComponentsByCategory(activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      components = components.filter(
        c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.path.toLowerCase().includes(q)
      )
    }
    return components
  }, [activeCategory, search])

  const groupedComponents = useMemo(() => {
    const groups: Record<string, typeof filteredComponents> = {}
    filteredComponents.forEach(c => {
      if (!groups[c.category]) groups[c.category] = []
      groups[c.category].push(c)
    })
    return groups
  }, [filteredComponents])

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                backgroundColor: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon icon='mdi:puzzle-outline' color={theme.palette.primary.contrastText} fontSize={24} />
            </Box>
            <Box>
              <Typography variant='h5' fontWeight={600}>
                Component Library
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Find existing reusable components before creating new ones
              </Typography>
            </Box>
          </Box>
          <TextField
            size='small'
            placeholder='Search components, hooks...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ width: 320 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Icon icon='mdi:magnify' fontSize={20} />
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip
            icon={<Icon icon='mdi:layers-outline' fontSize={16} />}
            label={`${COMPONENT_REGISTRY.length} Entries`}
            sx={{ backgroundColor: theme.palette.customColors.OnBackground, color: theme.palette.primary.dark }}
          />
          <Chip
            icon={<Icon icon='mdi:grid' fontSize={16} />}
            label={`${CATEGORIES.length - 1} Categories`}
            sx={{ backgroundColor: theme.palette.customColors.antzInfoLight, color: theme.palette.secondary.dark }}
          />
          <Chip
            icon={<Icon icon='mdi:code-tags' fontSize={16} />}
            label='4 Custom Hooks'
            sx={{ backgroundColor: theme.palette.customColors.Tertiary30, color: theme.palette.customColors.Tertiary }}
          />
        </Box>

        {/* Category Tabs */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <Chip
              key={cat.key}
              label={cat.key === 'all' ? 'All' : `${cat.label} (${'count' in cat ? cat.count : ''})`}
              onClick={() => setActiveCategory(cat.key)}
              sx={{
                fontWeight: 500,
                backgroundColor: activeCategory === cat.key ? theme.palette.primary.main : theme.palette.primary.contrastText,
                color: activeCategory === cat.key ? theme.palette.primary.contrastText : theme.palette.customColors.OnSurfaceVariant,
                border: activeCategory === cat.key ? 'none' : `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                '&:hover': {
                  backgroundColor:
                    activeCategory === cat.key
                      ? theme.palette.primary.dark
                      : theme.palette.customColors.OnBackground
                }
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Component Sections */}
      {Object.entries(groupedComponents).map(([category, components]) => (
        <Box key={category} sx={{ mb: 5 }}>
          {/* Section Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: resolveColorKey(getCategoryColorKey(category), theme)
              }}
            />
            <Typography variant='subtitle1' fontWeight={600}>
              {getCategoryLabel(category)}
            </Typography>
            <Chip
              label={components.length}
              size='small'
              sx={{
                height: 20,
                fontSize: 11,
                backgroundColor: `${resolveColorKey(getCategoryColorKey(category), theme)}1A`,
                color: resolveColorKey(getCategoryColorKey(category), theme)
              }}
            />
            <Box sx={{ flex: 1, height: 1, backgroundColor: theme.palette.customColors.SurfaceVariant }} />
          </Box>

          {/* Cards Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {components.map(comp => (
              <Card
                key={comp.slug}
                sx={{
                  cursor: 'pointer',
                  border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                  boxShadow: 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 1px 8px ${theme.palette.customColors.shadowColor}`
                  }
                }}
                onClick={() => router.push(`/component-library/${comp.slug}`)}
              >
                <CardContent sx={{ pb: '8px !important' }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        backgroundColor: `${resolveColorKey(getCategoryColorKey(comp.category), theme)}1A`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Icon
                        icon={
                          comp.category === 'hook'
                            ? 'mdi:hook'
                            : comp.category === 'dialog'
                            ? 'mdi:message-alert-outline'
                            : comp.category === 'drawer'
                            ? 'mdi:dock-right'
                            : comp.category === 'date-picker'
                            ? 'mdi:calendar-range'
                            : comp.category === 'media'
                            ? 'mdi:image-outline'
                            : comp.category === 'notification'
                            ? 'mdi:bell-outline'
                            : 'mdi:puzzle-outline'
                        }
                        color={resolveColorKey(getCategoryColorKey(comp.category), theme)}
                        fontSize={16}
                      />
                    </Box>
                    <Typography variant='subtitle2' fontWeight={600}>
                      {comp.name}
                    </Typography>
                  </Box>
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1.5, lineHeight: 1.5 }}>
                    {comp.description}
                  </Typography>
                </CardContent>
                <Box
                  sx={{
                    px: 3,
                    py: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: theme.palette.customColors.Surface,
                    borderTop: `1px solid ${theme.palette.customColors.SurfaceVariant}`
                  }}
                >
                  <Typography variant='caption' color='text.disabled' sx={{ fontSize: 11 }}>
                    {comp.path}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant='caption' fontWeight={500} color='primary'>
                      View
                    </Typography>
                    <Icon icon='mdi:arrow-top-right' color={theme.palette.primary.main} fontSize={14} />
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default ComponentLibraryPage
