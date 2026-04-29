'use client'

import { useTranslation } from 'react-i18next'
import { Drawer, Box, Typography, IconButton } from '@mui/material'
import { Close as CloseIcon, Person as PersonIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { AssignedUserDetails, TaggedMembersDrawerProps } from 'src/types/notes'

const TaggedMembersDrawer: React.FC<TaggedMembersDrawerProps> = ({
  open,
  onClose,
  setNotifyMembersDrawerOpen,
  taggedMembers,
  updateMembersLoading,
  isCreator,
  onOpenEditWithNewMembers
}) => {
  const { t } = useTranslation()
  const theme = useTheme() as any

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={() => onClose()}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 560 },
            height: 'auto',
            maxHeight: '60vh',
            position: 'fixed',
            bottom: 0,
            right: 0,
            top: 'auto',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            backgroundColor: theme.palette.background.paper,
            pb: 8
          }
        },
        backdrop: {
          sx: {
            backgroundColor: theme.palette.customColors.neutralTeritary
          }
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 4,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PersonIcon sx={{ fontSize: 24, color: theme.palette.text.secondary }} />
          <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
            {taggedMembers?.length}
            {taggedMembers?.length > 1 ? t('notes_module.tagged_members') : t('notes_module.tagged_member')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isCreator && (
            <IconButton
              size='small'
              onClick={() => {
                // Call the callback to set the flag and open NotifyMembersDrawer
                if (onOpenEditWithNewMembers) {
                  onOpenEditWithNewMembers([])
                } else {
                  // Fallback: just open NotifyMembersDrawer
                  setNotifyMembersDrawerOpen(true)
                }
              }}
              disabled={updateMembersLoading}
              sx={{ color: theme.palette.primary.main }}
            >
              <PersonAddIcon />
            </IconButton>
          )}
          <IconButton size='small' onClick={() => onClose()}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ p: 4, overflowY: 'auto', maxHeight: 'calc(60vh - 80px)' }}>
        {taggedMembers?.map((member: AssignedUserDetails, index: number) => (
          <Box
            key={member?.user_id || index}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.default
            }}
          >
            <UserAvatarDetails
              profile_image={member?.user_profile_pic}
              user_name={member?.full_name}
              role={member?.role_name}
              size='large'
              text_color={theme.palette.customColors.OnSurfaceVariant}
            />
          </Box>
        ))}
      </Box>
    </Drawer>
  )
}
export default TaggedMembersDrawer
