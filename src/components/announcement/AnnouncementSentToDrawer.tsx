'use client'

import React, { useState, useMemo } from 'react'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Avatar from '@mui/material/Avatar'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import InputBase from '@mui/material/InputBase'
import Icon from 'src/@core/components/icon'
import NoDataFound from 'src/views/utility/NoDataFound'
import { useTranslation } from 'react-i18next'

// Types for target groups
interface SiteValue {
  site_id: number
  site_name: string
  site_image?: string
}

interface RoleValue {
  id: number | string
  role_name: string
}

interface SiteRoleValue {
  site_id: {
    site_id: number
    site_name: string
    site_image?: string
  }
  role_id: RoleValue[]
}

interface UserValue {
  user_id: number | string
  user_name?: string
  full_name?: string
  user_profile_pic?: string
  profile_pic?: string
  role_name?: string
}

interface TargetGroup {
  group_type: 'site' | 'role' | 'site_role' | 'users'
  values: any[]
}

interface AnnouncementSentToDrawerProps {
  open: boolean
  onClose: () => void
  targetGroups: TargetGroup[]
  userTargetGroups: UserValue[]
}

// Helper to get initials from name
const getInitials = (name?: string) => {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
  }

  return name.charAt(0).toUpperCase()
}

const AnnouncementSentToDrawer: React.FC<AnnouncementSentToDrawerProps> = ({
  open,
  onClose,
  targetGroups,
  userTargetGroups
}) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState<'sites_roles' | 'users'>('sites_roles')
  const [searchTerm, setSearchTerm] = useState('')

  // Theme colors
  const primaryColor = theme.palette.primary.main
  const textPrimary = theme.palette.customColors.OnSurfaceVariant
  const textSecondary = theme.palette.customColors.neutralSecondary
  const borderColor = theme.palette.customColors.OutlineVariant
  const surfaceVariant = theme.palette.customColors.SurfaceVariant
  const bgColor = theme.palette.customColors.Background
  const whiteColor = theme.palette.customColors.OnPrimary

  // Combine user target groups with target groups
  const allTargetGroups = useMemo(() => {
    const groups = [...(targetGroups || [])]
    if (userTargetGroups && userTargetGroups.length > 0) {
      groups.push({
        group_type: 'users' as const,
        values: userTargetGroups
      })
    }

    return groups
  }, [targetGroups, userTargetGroups])

  // Filter data based on active tab
  const currentGroups = useMemo(() => {
    if (activeTab === 'users') {
      return allTargetGroups.filter(g => g.group_type === 'users')
    }

    return allTargetGroups.filter(g => g.group_type !== 'users')
  }, [activeTab, allTargetGroups])

  // Count users for tab label
  const userCount = useMemo(() => {
    const usersGroup = allTargetGroups.find(g => g.group_type === 'users')

    return usersGroup?.values?.length || 0
  }, [allTargetGroups])

  // Apply search filter
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return currentGroups

    const searchLower = searchTerm.toLowerCase()

    return currentGroups
      .map(group => {
        const filteredValues = group.values.filter((item: any) => {
          switch (group.group_type) {
            case 'site':
              return item?.site_name?.toLowerCase?.().includes(searchLower)
            case 'role':
              return item?.role_name?.toLowerCase?.().includes(searchLower)
            case 'site_role':
              return (
                item?.site_id?.site_name?.toLowerCase?.().includes(searchLower) ||
                item?.role_id?.some((role: any) => role?.role_name?.toLowerCase?.().includes(searchLower))
              )
            case 'users':
              return (
                item?.user_name?.toLowerCase?.().includes(searchLower) ||
                item?.full_name?.toLowerCase?.().includes(searchLower) ||
                item?.role_name?.toLowerCase?.().includes(searchLower)
              )
            default:
              return false
          }
        })

        return { ...group, values: filteredValues }
      })
      .filter(group => group.values.length > 0)
  }, [currentGroups, searchTerm])

  // Group labels
  const groupLabels: Record<string, string> = {
    site: 'Sites',
    role: 'Roles',
    site_role: 'Site & roles',
    users: 'Users'
  }

  // Reset state when drawer closes
  React.useEffect(() => {
    if (!open) {
      setActiveTab('sites_roles')
      setSearchTerm('')
    }
  }, [open])

  // Render site item
  const renderSiteItem = (item: SiteValue, index: number) => (
    <Box
      key={`site-${item.site_id}-${index}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2.5,
        borderBottom: `1px solid ${borderColor}`
      }}
    >
      <Avatar src={item.site_image} sx={{ width: 40, height: 40, bgcolor: surfaceVariant }}>
        {item.site_name?.charAt(0)}
      </Avatar>
      <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: textPrimary }}>{item.site_name}</Typography>
    </Box>
  )

  // Render role item
  const renderRoleItem = (item: RoleValue, index: number) => (
    <Box
      key={`role-${item.id}-${index}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2.5,
        borderBottom: `1px solid ${borderColor}`
      }}
    >
      <Avatar sx={{ width: 40, height: 40, bgcolor: theme.palette.grey[300] }}>
        <Icon icon='mdi:account' fontSize={20} color={theme.palette.grey[600]} />
      </Avatar>
      <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: textPrimary }}>{item.role_name}</Typography>
    </Box>
  )

  // Render site+role item
  const renderSiteRoleItem = (item: SiteRoleValue, index: number) => (
    <Box
      key={`site_role-${item.site_id?.site_id}-${index}`}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        p: 2.5,
        borderBottom: `1px solid ${borderColor}`
      }}
    >
      <Avatar src={item.site_id?.site_image} sx={{ width: 40, height: 40, bgcolor: surfaceVariant }}>
        {item.site_id?.site_name?.charAt(0)}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: textPrimary }}>
          {item.site_id?.site_name}
        </Typography>
        {item.role_id && item.role_id.length > 0 && (
          <Typography sx={{ fontSize: '0.8125rem', color: textSecondary, mt: 0.5 }}>
            <Typography component='span' sx={{ fontWeight: 600, color: textPrimary, fontSize: '0.8125rem' }}>
              {t('roles')}:{' '}
            </Typography>
            {item.role_id.map((role: RoleValue) => role?.role_name).join(', ')}
          </Typography>
        )}
      </Box>
    </Box>
  )

  // Render user item
  const renderUserItem = (item: UserValue, index: number) => {
    const userName = item.user_name || item.full_name || 'Unknown User'
    const userImage = item.user_profile_pic || item.profile_pic

    return (
      <Box
        key={`user-${item.user_id}-${index}`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2.5,
          borderBottom: `1px solid ${borderColor}`
        }}
      >
        <Avatar src={userImage} sx={{ width: 40, height: 40, bgcolor: theme.palette.secondary.main }}>
          {!userImage && getInitials(userName)}
        </Avatar>
        <Box>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: textPrimary }}>{userName}</Typography>
          {item.role_name && (
            <Typography sx={{ fontSize: '0.75rem', color: textSecondary }}>{item.role_name}</Typography>
          )}
        </Box>
      </Box>
    )
  }

  // Render section based on group type
  const renderSection = (group: TargetGroup, groupIndex: number) => {
    const label = groupLabels[group.group_type] || group.group_type
    const count = group.values?.length || 0

    // Skip if no values
    if (count === 0) return null

    return (
      <Box key={`group-${group.group_type}-${groupIndex}`}>
        {/* Section Header - only show if multiple sections */}
        {filteredGroups.length > 1 && (
          <Box sx={{ px: 3, py: 1.5, bgcolor: surfaceVariant }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: textSecondary }}>
              {label} - {count}
            </Typography>
          </Box>
        )}

        {/* Section Items */}
        <Box sx={{ px: 1 }}>
          {group.values.map((item: any, index: number) => {
            switch (group.group_type) {
              case 'site':
                return renderSiteItem(item, index)
              case 'role':
                return renderRoleItem(item, index)
              case 'site_role':
                return renderSiteRoleItem(item, index)
              case 'users':
                return renderUserItem(item, index)
              default:
                return null
            }
          })}
        </Box>
      </Box>
    )
  }

  // Check if there's any data
  const hasData = filteredGroups.some(g => g.values.length > 0)

  return (
    <Drawer
      anchor='bottom'
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 580 },
          height: '75vh',
          marginLeft: 'auto',
          borderTopLeftRadius: 16,
          borderTopRightRadius: { xs: 16, sm: 0 }
        }
      }}
    >
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: whiteColor,
          overflow: 'hidden'
        }}
      >
        {/* Drag Handle */}
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              bgcolor: theme.palette.grey[400]
            }}
          />
        </Box>

        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            pt: 2,
            pb: 1.5
          }}
        >
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: textPrimary }}>{t('announcement_module.announcement_sent_to')}</Typography>
          <IconButton size='small' onClick={onClose}>
            <Icon icon='mdi:close' fontSize={22} />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: `1px solid ${borderColor}` }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              minHeight: 44,
              '& .MuiTab-root': {
                textTransform: 'none',
                minHeight: 44,
                fontWeight: 500,
                fontSize: '0.9375rem',
                color: textSecondary,
                '&.Mui-selected': {
                  color: primaryColor,
                  fontWeight: 600
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: primaryColor,
                height: 2
              }
            }}
          >
            <Tab label={t('announcement_module.sites_roles')} value='sites_roles' sx={{ flex: 1 }} />
            <Tab label={`${t('lab_module.users')}${userCount > 0 ? ` - ${userCount}` : ''}`} value='users' sx={{ flex: 1 }} />
          </Tabs>
        </Box>

        {/* Search */}
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2.5,
              py: 1.5,
              bgcolor: surfaceVariant,
              borderRadius: '8px'
            }}
          >
            <Icon icon='mdi:magnify' fontSize={20} color={textSecondary} />
            <InputBase
              placeholder={t('search') as string}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              sx={{
                flex: 1,
                fontSize: '0.9375rem',
                '& input': {
                  p: 0
                }
              }}
            />
            {searchTerm && (
              <IconButton size='small' onClick={() => setSearchTerm('')}>
                <Icon icon='mdi:close' fontSize={18} />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {hasData ? (
            filteredGroups.map((group, index) => renderSection(group, index))
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <NoDataFound variant='Meerkat' height={150} width={150} />
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  )
}

export default AnnouncementSentToDrawer
