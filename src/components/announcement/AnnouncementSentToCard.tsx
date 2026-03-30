'use client'

import React, { useMemo } from 'react'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'

// Types for target groups - matching the API response structure
interface TargetGroup {
  group_type: 'site' | 'role' | 'site_role'
  values: any[]
}

interface UserTargetGroup {
  user_id: number | string
  user_name?: string
  full_name?: string
  user_profile_pic?: string
  profile_pic?: string
  role_name?: string
}

interface AnnouncementSentToCardProps {
  targetGroups?: TargetGroup[]
  userTargetGroups?: UserTargetGroup[]
  onClick: () => void
}

const AnnouncementSentToCard: React.FC<AnnouncementSentToCardProps> = ({
  targetGroups = [],
  userTargetGroups = [],
  onClick
}) => {
  const theme = useTheme()

  // Theme colors
  const textPrimary = theme.palette.customColors.OnSurfaceVariant
  const borderColor = theme.palette.customColors.OutlineVariant
  const bgColor = theme.palette.customColors.displaybgPrimary || theme.palette.customColors.SurfaceVariant

  // Calculate counts based on target_groups structure
  const counts = useMemo(() => {
    // Sites count: site group values + site_role group values
    const siteCount =
      (targetGroups?.find((g: TargetGroup) => g.group_type === 'site')?.values?.length ?? 0) +
      (targetGroups?.find((g: TargetGroup) => g.group_type === 'site_role')?.values?.length ?? 0)

    // Roles count: role group values only
    const roleCount = targetGroups?.find((g: TargetGroup) => g.group_type === 'role')?.values?.length ?? 0

    // Users count: from user_target_groups
    const userCount = userTargetGroups?.length ?? 0

    return { sites: siteCount, roles: roleCount, users: userCount }
  }, [targetGroups, userTargetGroups])

  // Don't render if no recipients
  const hasRecipients = counts.sites > 0 || counts.roles > 0 || counts.users > 0
  if (!hasRecipients) return null

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2.5,
        py: 2,
        mx: 3,
        borderRadius: '8px',
        bgcolor: bgColor,
        border: `1px solid ${borderColor}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: theme.palette.action.hover
        }
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography
          sx={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: textPrimary,
            mb: 0.5
          }}
        >
          Announcement sent to
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Typography sx={{ fontSize: '0.8125rem', color: textPrimary }}>
            Sites -{' '}
            <Typography component='span' sx={{ fontWeight: 600 }}>
              {counts.sites}
            </Typography>
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: textPrimary }}>
            Roles -{' '}
            <Typography component='span' sx={{ fontWeight: 600 }}>
              {counts.roles}
            </Typography>
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: textPrimary }}>
            Users -{' '}
            <Typography component='span' sx={{ fontWeight: 600 }}>
              {counts.users}
            </Typography>
          </Typography>
        </Box>
      </Box>
      <Icon icon='mdi:chevron-right' fontSize={20} color={textPrimary} />
    </Box>
  )
}

export default AnnouncementSentToCard
