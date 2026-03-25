'use client'

import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import CircularProgress from '@mui/material/CircularProgress'
import Avatar from '@mui/material/Avatar'
import Icon from 'src/@core/components/icon'
import { useReactionUsers } from 'src/hooks/announcement/useAnnouncements'
import type { ReactionUserListDialogProps } from 'src/types/announcement'

const ReactionUserListDialog = ({
  open,
  onClose,
  announcementId
}: ReactionUserListDialogProps) => {
  const { data, isLoading } = useReactionUsers(announcementId, open)
  const users = data?.data || []

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='xs'
      fullWidth
      PaperProps={{
        sx: { borderRadius: '8px' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              backgroundColor: 'primary.main',
              borderRadius: '50%',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon icon='mdi:thumb-up' fontSize={16} color='white' />
          </Box>
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            Likes
          </Typography>
        </Box>
        <IconButton onClick={onClose} size='small'>
          <Icon icon='mdi:close' />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 0, py: 0 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : users.length > 0 ? (
          <List sx={{ py: 0 }}>
            {users.map(user => (
              <ListItem key={user.user_id}>
                <ListItemAvatar>
                  <Avatar
                    src={user.profile_pic || undefined}
                    sx={{ width: 40, height: 40 }}
                  >
                    {!user.profile_pic && (user.first_name?.charAt(0) || '')}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${user.first_name} ${user.last_name}`}
                  primaryTypographyProps={{
                    fontWeight: 500,
                    fontSize: '0.9375rem'
                  }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant='body2' color='text.secondary'>
              No likes yet
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ReactionUserListDialog
