import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import ZooSettingsDynamicSection from './ZooSettingsDynamicSection'
import ZooSettingsReportEmailSection from './ZooSettingsReportEmailSection'

const SECTION_ICON_FALLBACKS = {
  general: 'mdi:earth',
  geofencing: 'mdi:map-marker-radius-outline',
  report_email: 'mdi:email-outline'
}

const SECTION_ANCHOR_PREFIX = 'zoo-section-'
const APP_BAR_OFFSET = 64
const TABBAR_HEIGHT = 56
const SCROLL_OFFSET = APP_BAR_OFFSET + TABBAR_HEIGHT + 8

const ZooSettingsView = ({
  isLoading,
  schema,
  sectionValues,
  onSectionFieldChange,
  onSaveSection,
  reportTypes,
  reportEmailValues,
  onReportEmailChange,
  onSaveReportEmail,
  timezone,
  onOpenHistory
}) => {
  const sortedSchema = [...(schema || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
  const [activeKey, setActiveKey] = useState(sortedSchema[0]?.key || null)
  const [isPinned, setIsPinned] = useState(false)
  const [tabsOverflow, setTabsOverflow] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pinnedRect, setPinnedRect] = useState({ left: 0, width: 0 })

  const sectionRefs = useRef({})
  const sentinelRef = useRef(null)
  const tabsContainerRef = useRef(null)
  const tabsInnerRef = useRef(null)
  const placeholderRef = useRef(null)

  // Scroll-spy: pick the section whose top edge is the LAST one to have crossed
  // above an activation line. The line is dynamic — at rest it sits just below
  // the inline tab bar (which is part of the page flow); when pinned it sits
  // just below the pinned bar at the top of the viewport. We derive both from
  // the placeholder element's actual position so it stays correct in either state.
  useEffect(() => {
    if (isLoading) return undefined

    const update = () => {
      // If the user has scrolled to the bottom of the page, force-activate the
      // last section. Without this the last 1-2 sections never become "the
      // section just below the bar" because there's no more page to scroll.
      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2

      if (scrolledToBottom && sortedSchema.length > 0) {
        const lastKey = sortedSchema[sortedSchema.length - 1].key
        setActiveKey(prev => (prev === lastKey ? prev : lastKey))

        return
      }

      // Bottom edge of the tab bar (rest OR pinned — placeholder reserves space
      // so getBoundingClientRect().bottom is reliable in either mode).
      const placeholder = placeholderRef.current
      const tabBarBottom = placeholder
        ? Math.max(placeholder.getBoundingClientRect().bottom, APP_BAR_OFFSET + TABBAR_HEIGHT)
        : APP_BAR_OFFSET + TABBAR_HEIGHT
      const triggerY = tabBarBottom + 24

      let bestKey = null
      let bestTop = -Infinity

      sortedSchema.forEach(section => {
        const el = sectionRefs.current[section.key]
        if (!el) return
        const top = el.getBoundingClientRect().top
        if (top <= triggerY && top > bestTop) {
          bestTop = top
          bestKey = section.key
        }
      })

      if (!bestKey) bestKey = sortedSchema[0]?.key || null
      if (bestKey) setActiveKey(prev => (prev === bestKey ? prev : bestKey))
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, sortedSchema.length])

  // Sentinel: when this 1px element scrolls off the top, the tab bar pins.
  // This sidesteps any parent stacking context issues that `position: sticky`
  // can hit inside complex layouts (overflow ancestors, transformed parents).
  useEffect(() => {
    if (isLoading) return undefined
    const sentinel = sentinelRef.current
    if (!sentinel) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Sentinel is below the AppBar (top: APP_BAR_OFFSET). When it leaves
        // the viewport upward, pin the tab bar.
        setIsPinned(!entry.isIntersecting && entry.boundingClientRect.top < APP_BAR_OFFSET + 8)
      },
      { rootMargin: `-${APP_BAR_OFFSET}px 0px 0px 0px`, threshold: 0 }
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [isLoading])

  // Measure the placeholder's box so the pinned (position: fixed) bar can align
  // exactly with the content area — accounts for sidebar width / collapsed state /
  // mobile hidden nav without us needing to know any of those values.
  useEffect(() => {
    if (isLoading) return undefined

    const measure = () => {
      const el = placeholderRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setPinnedRect({ left: rect.left, width: rect.width })
    }

    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { passive: true })

    let ro
    const el = placeholderRef.current
    if (typeof ResizeObserver !== 'undefined' && el) {
      ro = new ResizeObserver(measure)
      ro.observe(el)
    }

    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure)
      if (ro) ro.disconnect()
    }
  }, [isLoading])

  // Detect tab overflow: when the inner tab list is wider than the container,
  // surface a menu button so the user can pick a section without scrolling sideways.
  useEffect(() => {
    if (isLoading) return undefined

    const measure = () => {
      const container = tabsContainerRef.current
      const inner = tabsInnerRef.current
      if (!container || !inner) return
      const overflow = inner.scrollWidth > container.clientWidth + 4
      setTabsOverflow(overflow)
    }

    measure()
    window.addEventListener('resize', measure)
    const ro = new ResizeObserver(measure)
    if (tabsContainerRef.current) ro.observe(tabsContainerRef.current)

    return () => {
      window.removeEventListener('resize', measure)
      ro.disconnect()
    }
  }, [isLoading, sortedSchema.length])

  const scrollToSection = key => {
    const el = sectionRefs.current[key]
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET
    window.scrollTo({ top, behavior: 'smooth' })
    setActiveKey(key)
    setMenuOpen(false)
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  const tabBar = ({ pinned }) => (
    <Box
      component='nav'
      aria-label='Zoo settings sections'
      sx={{
        bgcolor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'customColors.SurfaceVariant',
        boxShadow: pinned ? '0 4px 12px -8px rgba(0,0,0,0.18)' : 'none',
        transition: 'box-shadow 0.2s'
      }}
    >
      <Box
        sx={{
          maxWidth: 1440,
          mx: 'auto',
          px: { xs: 4, md: 6 },
          height: TABBAR_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}
      >
        {/* Mobile / overflow: hamburger button on the left that opens the menu */}
        {tabsOverflow && (
          <IconButton
            aria-label='Open sections menu'
            onClick={() => setMenuOpen(true)}
            size='small'
            sx={{
              flexShrink: 0,
              border: '1px solid',
              borderColor: 'customColors.SurfaceVariant',
              borderRadius: '8px',
              color: 'customColors.OnSurfaceVariant',
              '&:hover': { bgcolor: 'customColors.OnBackground', borderColor: 'primary.main' }
            }}
          >
            <Icon icon='mdi:menu' fontSize={18} />
          </IconButton>
        )}

        <Box
          ref={tabsContainerRef}
          sx={{
            flex: 1,
            minWidth: 0,
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none'
          }}
        >
          <Box ref={tabsInnerRef} sx={{ display: 'inline-flex', gap: 1, py: 1 }}>
            {sortedSchema.map(section => {
              const isActive = activeKey === section.key
              const icon = section.icon || SECTION_ICON_FALLBACKS[section.key] || 'mdi:cog-outline'

              return (
                <Box
                  key={section.key}
                  component='button'
                  type='button'
                  onClick={() => scrollToSection(section.key)}
                  aria-current={isActive ? 'true' : undefined}
                  sx={{
                    all: 'unset',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2.25,
                    height: 36,
                    position: 'relative',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    whiteSpace: 'nowrap',
                    color: isActive ? 'primary.main' : 'customColors.OnSurfaceVariant',
                    transition: 'color 0.15s',
                    // Underline on active — clean tab indicator that doesn't fight the page bg
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: 12,
                      right: 12,
                      bottom: -1,
                      height: 2,
                      borderRadius: '2px 2px 0 0',
                      bgcolor: isActive ? 'primary.main' : 'transparent',
                      transition: 'background-color 0.15s'
                    },
                    '&:hover': {
                      color: 'primary.main'
                    },
                    '&:focus-visible': {
                      outline: theme => `2px solid ${theme.palette.primary.main}`,
                      outlineOffset: 2,
                      borderRadius: '4px'
                    }
                  }}
                >
                  <Icon icon={icon} fontSize={16} />
                  {section.label}
                </Box>
              )
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ p: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant='h5' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>
            Zoo Settings
          </Typography>
          <Typography variant='body2' sx={{ color: 'text.secondary', mt: 0.5 }}>
            Manage zoo-level configuration and report email settings
          </Typography>
        </Box>
        <Button
          variant='outlined'
          size='small'
          startIcon={<Icon icon='ion:time-outline' />}
          onClick={onOpenHistory}
          sx={{ height: 36, borderRadius: '8px', textTransform: 'none', fontWeight: 500, flexShrink: 0 }}
        >
          History
        </Button>
      </Box>

      {/* Sentinel: detects when the bar should pin */}
      <Box ref={sentinelRef} sx={{ height: 1, width: '100%' }} aria-hidden='true' />

      {/* Inline (placeholder) tab bar — visible until sentinel scrolls off */}
      <Box
        ref={placeholderRef}
        sx={{
          mx: -6,
          mb: 4,
          visibility: isPinned ? 'hidden' : 'visible',
          // Reserve space so layout doesn't jump when bar pins
          height: TABBAR_HEIGHT + 1
        }}
      >
        {!isPinned && tabBar({ pinned: false })}
      </Box>

      {/* Pinned (fixed) tab bar — appears once the user has scrolled past the inline one.
          Aligned to the placeholder's bounds so it never overlaps the sidebar. */}
      {isPinned && pinnedRect.width > 0 && (
        <Box
          sx={{
            position: 'fixed',
            top: APP_BAR_OFFSET,
            left: pinnedRect.left,
            width: pinnedRect.width,
            zIndex: theme => theme.zIndex.appBar - 1
          }}
        >
          {tabBar({ pinned: true })}
        </Box>
      )}

      {/* Sections */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {sortedSchema.map(section => (
          <Box
            key={section.key}
            id={`${SECTION_ANCHOR_PREFIX}${section.key}`}
            ref={el => {
              sectionRefs.current[section.key] = el
            }}
            sx={{ scrollMarginTop: `${SCROLL_OFFSET}px` }}
          >
            {section.type === 'report_email' ? (
              <ZooSettingsReportEmailSection
                section={section}
                reportTypes={reportTypes}
                reportEmailValues={reportEmailValues}
                timezone={timezone}
                onChange={onReportEmailChange}
                onSave={onSaveReportEmail}
              />
            ) : (
              <ZooSettingsDynamicSection
                section={section}
                values={sectionValues[section.key] || {}}
                onChange={(fieldKey, value) => onSectionFieldChange(section.key, fieldKey, value)}
                onSave={() => onSaveSection(section.key)}
              />
            )}
          </Box>
        ))}
      </Box>

      {/* Mobile / overflow menu */}
      <Dialog
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        maxWidth='xs'
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1.5,
            color: 'customColors.OnSurfaceVariant'
          }}
        >
          <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
            Jump to section
          </Typography>
          <IconButton
            size='small'
            onClick={() => setMenuOpen(false)}
            aria-label='Close menu'
            sx={{ color: 'customColors.Outline' }}
          >
            <Icon icon='mdi:close' fontSize={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 2 }}>
          <List sx={{ p: 0 }}>
            {sortedSchema.map(section => {
              const isActive = activeKey === section.key
              const icon = section.icon || SECTION_ICON_FALLBACKS[section.key] || 'mdi:cog-outline'

              return (
                <ListItemButton
                  key={section.key}
                  onClick={() => scrollToSection(section.key)}
                  selected={isActive}
                  sx={{
                    borderRadius: '8px',
                    mb: 0.5,
                    '&.Mui-selected': {
                      bgcolor: 'customColors.Surface',
                      '&:hover': { bgcolor: 'customColors.Surface' }
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '6px',
                        bgcolor: isActive ? 'primary.main' : 'customColors.OnBackground',
                        color: isActive ? '#fff' : 'primary.dark',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Icon icon={icon} fontSize={16} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={section.label}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'primary.dark' : 'customColors.OnSurfaceVariant'
                    }}
                  />
                  {isActive && (
                    <Icon icon='mdi:check' fontSize={18} color='var(--mui-palette-primary-main)' />
                  )}
                </ListItemButton>
              )
            })}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default ZooSettingsView
