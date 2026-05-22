'use client'

import { useState } from 'react'

import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Popover from '@mui/material/Popover'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'

import { useSelector } from 'react-redux'
import type { RootState } from 'src/store'
import type { ReactionEntry } from 'src/types/apps/chatTypes'

interface ReactionDetailDialogProps {
  anchorEl: HTMLElement | null
  onClose: () => void
  reactions: ReactionEntry[]
  onToggleReaction?: (emoji: string) => void
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

const ReactionDetailDialog = ({ anchorEl, onClose, reactions, onToggleReaction }: ReactionDetailDialogProps) => {
  const [activeTab, setActiveTab] = useState('all')
  const contacts = useSelector((s: RootState) => s.chat?.contacts ?? [])
  const currentUserId = useSelector((s: RootState) => s.chat?.userProfile?.id ?? null)
  const currentUserProfile = useSelector((s: RootState) => s.chat?.userProfile ?? null)

  const totalCount = reactions.reduce((sum, r) => sum + r.count, 0)
  const allEntries = reactions.flatMap(r => r.userIds.map(uid => ({ userId: uid, emoji: r.emoji })))
  const filteredEntries = activeTab === 'all' ? allEntries : allEntries.filter(e => e.emoji === activeTab)

  const resolveUser = (userId: string) => {
    if (String(currentUserId) === userId) {
      return { name: 'You', avatar: currentUserProfile?.avatar ?? undefined }
    }
    const contact = (contacts ?? []).find(c => String(c.id) === userId)

    return { name: contact?.fullName ?? 'Unknown', avatar: contact?.avatar ?? undefined }
  }

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      slotProps={{
        paper: {
          sx: {
            width: 320,
            maxHeight: 360,
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 6
          }
        }
      }}
    >
      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        variant='scrollable'
        scrollButtons='auto'
        sx={{
          px: 2,
          borderBottom: 1,
          borderColor: 'divider',
          minHeight: 44,
          flexShrink: 0,
          '& .MuiTab-root': { minHeight: 44, py: 0, px: 1.5, minWidth: 'unset', fontSize: '0.85rem', fontWeight: 600, color: 'text.primary' },
          '& .Mui-selected': { color: 'primary.main' },
          '& .MuiTabs-indicator': { backgroundColor: 'primary.main' }
        }}
      >
        <Tab label={`All ${totalCount}`} value='all' />
        {reactions.map(r => (
          <Tab key={r.emoji} label={`${r.emoji} ${r.count}`} value={r.emoji} />
        ))}
      </Tabs>

      {/* Scrollable user list */}
      <Box sx={{ overflowY: 'auto', flex: 1 }}>
        <List disablePadding dense>
          {filteredEntries.map(({ userId, emoji }) => {
            const { name, avatar } = resolveUser(userId)
            const isMe = String(currentUserId) === userId
            const canRemove = isMe && !!onToggleReaction

            return (
              <ListItem
                key={`${userId}-${emoji}`}
                onClick={canRemove ? () => { onToggleReaction(emoji); onClose() } : undefined}
                sx={{
                  py: 2,
                  px: 4,
                  cursor: canRemove ? 'pointer' : 'default',
                  '&:hover': canRemove ? { backgroundColor: 'action.hover' } : undefined
                }}
                secondaryAction={
                  <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>{emoji}</Typography>
                }
              >
                <ListItemAvatar sx={{ minWidth: 48 }}>
                  {avatar ? (
                    <Avatar src={avatar} alt={name} sx={{ width: 32, height: 32 }} />
                  ) : (
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.75rem', fontWeight: 600 }}>
                      {getInitials(name)}
                    </Avatar>
                  )}
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {name}
                      {isMe ? (
                        <Typography component='span' variant='caption' sx={{ ml: 1, color: 'text.disabled' }}>
                          Tap to remove
                        </Typography>
                      ) : null}
                    </Typography>
                  }
                />
              </ListItem>
            )
          })}
        </List>
      </Box>
    </Popover>
  )
}

export default ReactionDetailDialog
