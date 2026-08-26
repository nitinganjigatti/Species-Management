'use client'

// IpadShell — the app chrome for the iPad build of Species Management.
// Slim top bar with a hamburger nav drawer in both orientations (per review —
// no persistent sidebar). Pages under /species-management/ipad-2/ render inside
// this shell instead of the web UserLayout.

import React, { ReactNode, useState } from 'react'
import { useRouter } from 'next/navigation'

import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad2/skin'

export type IpadNavKey = 'dashboard' | 'species'

// Landscape gets roomier content gutters; nav is a drawer in both orientations.
const LANDSCAPE = '@media (orientation: landscape)'

interface NavItem {
  key: IpadNavKey
  label: string
  icon: string
  path: string
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'mdi:view-dashboard-outline', path: '/species-management/ipad-2/dashboard' },
  { key: 'species', label: 'Species', icon: 'mdi:paw', path: '/species-management/ipad-2/list' }
]

const SidebarContent: React.FC<{ active: IpadNavKey; onNavigate: (path: string) => void }> = ({ active, onNavigate }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', pt: 'env(safe-area-inset-top)' }}>
      {/* Identity */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, px: '20px', pt: '22px', pb: '18px' }}>
        <Box component='img' src='/images/branding/Antz_logomark_h_color.svg' alt='Antz' sx={{ height: 34, width: 34 }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant='subtitle1' sx={{ fontWeight: 700, lineHeight: 1.2, color: cc.OnSurfaceVariant }} noWrap>
            Species
          </Typography>
          <Typography variant='caption' sx={{ color: cc.neutralSecondary, display: 'block', lineHeight: 1.2 }} noWrap>
            Management
          </Typography>
        </Box>
      </Box>

      {/* Nav */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, px: '12px', mt: 2 }}>
        {NAV_ITEMS.map(item => {
          const isActive = item.key === active

          return (
            <Box
              key={item.key}
              onClick={() => onNavigate(item.path)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                minHeight: 48,
                px: '14px',
                borderRadius: '10px',
                cursor: 'pointer',
                bgcolor: isActive ? 'customColors.Surface' : 'transparent',
                '&:active': { bgcolor: 'customColors.OnBackground' }
              }}
            >
              <Icon icon={item.icon} fontSize='1.4rem' color={isActive ? theme.palette.primary.dark : cc.Outline} />
              <Typography
                variant='body1'
                sx={{ fontWeight: isActive ? 700 : 500, color: isActive ? 'primary.dark' : cc.OnSurfaceVariant }}
              >
                {item.label}
              </Typography>
            </Box>
          )
        })}
      </Box>

      <Box sx={{ flex: 1 }} />

      {/* Escape hatch back to the web dashboard */}
      <Box sx={{ px: '12px', pb: 'calc(env(safe-area-inset-bottom) + 14px)', pt: 3, borderTop: `1px solid ${cc.SurfaceVariant}` }}>
        <Box
          onClick={() => onNavigate('/species-management/dashboard-2')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            minHeight: 44,
            px: '14px',
            borderRadius: '10px',
            cursor: 'pointer',
            '&:active': { bgcolor: 'customColors.Surface' }
          }}
        >
          <Icon icon='mdi:arrow-left' fontSize='1.25rem' color={cc.Outline} />
          <Typography variant='body2' sx={{ color: cc.neutralSecondary, fontWeight: 500 }}>
            Back to V2 (web)
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

const IpadShell: React.FC<{
  active: IpadNavKey
  /** When set, the top bar shows a back button (chevron + label) to this path. */
  backHref?: string
  backLabel?: string
  children: ReactNode
}> = ({ active, backHref, backLabel, children }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const navigate = (path: string) => {
    setDrawerOpen(false)
    router.push(path)
  }

  return (
    // CC ground: the whole window stands on the sage.
    <Box sx={{ minHeight: '100vh', bgcolor: skin.GROUND }}>
      {/* Top bar — both orientations; nav lives in the drawer */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          position: 'sticky',
          top: 0,
          zIndex: theme.zIndex.appBar,
          minHeight: 56,
          pt: 'env(safe-area-inset-top)',
          px: '10px',
          bgcolor: '#ffffff',
          borderBottom: `1px solid ${skin.HAIR}`
        }}
      >
        <IconButton onClick={() => setDrawerOpen(true)} sx={{ width: 48, height: 48, color: cc.OnSurfaceVariant }}>
          <Icon icon='mdi:menu' fontSize='1.5rem' />
        </IconButton>
        {backHref ? (
          <Box
            onClick={() => navigate(backHref)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minHeight: 48,
              pl: '4px',
              pr: '14px',
              borderRadius: '10px',
              cursor: 'pointer',
              '&:active': { bgcolor: 'customColors.Surface' }
            }}
          >
            <Icon icon='mdi:chevron-left' fontSize='1.6rem' color={theme.palette.primary.dark} />
            <Typography variant='subtitle1' sx={{ fontWeight: 600, color: 'primary.dark' }}>
              {backLabel || 'Back'}
            </Typography>
          </Box>
        ) : (
          <>
            <Box component='img' src='/images/branding/Antz_logomark_h_color.svg' alt='Antz' sx={{ height: 28, width: 28 }} />
            <Typography variant='subtitle1' sx={{ fontWeight: 700, color: cc.OnSurfaceVariant }}>
              Species Management
            </Typography>
          </>
        )}
        <Box sx={{ flex: 1 }} />
        <IconButton
          onClick={() => navigate('/species-management/dashboard-2')}
          sx={{ width: 48, height: 48, color: cc.Outline }}
          aria-label='Back to V2 (web)'
        >
          <Icon icon='mdi:exit-to-app' fontSize='1.4rem' />
        </IconButton>
      </Box>

      {/* Nav drawer */}
      <Drawer
        anchor='left'
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { width: 300 } } }}
      >
        <SidebarContent active={active} onNavigate={navigate} />
      </Drawer>

      {/* Content */}
      <Box
        component='main'
        sx={{
          minWidth: 0,
          p: '12px',
          pb: 'calc(env(safe-area-inset-bottom) + 20px)',
          [LANDSCAPE]: { p: '14px 16px' }
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default IpadShell
