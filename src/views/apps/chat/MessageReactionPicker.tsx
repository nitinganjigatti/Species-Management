'use client'

import { useState, MouseEvent } from 'react'
import dynamic from 'next/dynamic'

import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Fade from '@mui/material/Fade'
import toast from 'react-hot-toast'

import { useSelector } from 'react-redux'
import type { RootState } from 'src/store'

import { addReactionOverSocket } from 'src/lib/chat/api'
import Icon from 'src/@core/components/icon'
import type { ChatLogChatType } from 'src/types/apps/chatTypes'

import data from '@emoji-mart/data'

const EmojiPicker = dynamic(() => import('@emoji-mart/react').then(m => m.default ?? m), { ssr: false })

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

interface Props {
  chat: ChatLogChatType
  isSender: boolean
}

const MessageReactionPicker = ({ chat, isSender }: Props) => {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const [pickerAnchor, setPickerAnchor] = useState<null | HTMLElement>(null)
  const open = Boolean(anchor)
  const pickerOpen = Boolean(pickerAnchor)
  const currentUserId = useSelector((s: RootState) => s.chat?.userProfile?.id ?? null)

  const handleOpen = (e: MouseEvent<HTMLButtonElement>) => setAnchor(e.currentTarget)
  const handleClose = () => setAnchor(null)

  const handleToggleReaction = (emoji: string) => {
    handleClose()
    setPickerAnchor(null)
    if (!chat.id) return
    addReactionOverSocket(chat.id, emoji).catch((err: unknown) => {
      console.error('[chat] toggle reaction failed:', err)
      toast.error('Reaction failed')
    })
  }

  const handleOpenFullPicker = (e: MouseEvent<HTMLButtonElement>) => {
    // Keep the quick-reaction anchor element as the picker anchor so the
    // picker appears near the message bubble, then close the quick bar.
    setPickerAnchor(anchor)
    setAnchor(null)
  }

  return (
    <>
      {/* Smiley trigger icon */}
      <IconButton
        size='small'
        aria-label='React to message'
        className='msg-actions'
        data-open={open || pickerOpen ? 'true' : 'false'}
        onClick={handleOpen}
        disabled={!chat.id}
        sx={{
          opacity: open || pickerOpen ? 1 : 0,
          pointerEvents: open || pickerOpen ? 'auto' : 'none',
          transition: 'opacity 150ms ease',
          color: 'customColors.Outline',
          bgcolor: 'background.paper',
          boxShadow: 1,
          '&:hover': { bgcolor: 'background.paper' }
        }}
      >
        <Icon icon='mdi:emoticon-happy-outline' fontSize='1.125rem' />
      </IconButton>

      {/* Quick-reaction pill */}
      <Popover
        anchorEl={anchor}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: isSender ? 'right' : 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: isSender ? 'right' : 'left' }}
        slotProps={{ paper: { sx: { px: 1, py: 0.5, borderRadius: 999 } } }}
      >
        <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center', px: 0.5 }}>
          {QUICK_REACTIONS.map(emoji => (
            <Box
              key={emoji}
              component='span'
              role='button'
              aria-label={`React with ${emoji}`}
              onClick={() => handleToggleReaction(emoji)}
              sx={{
                fontSize: '1.5rem',
                lineHeight: 1,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                transition: 'transform 0.15s',
                userSelect: 'none',
                '&:hover': { transform: 'scale(1.2)', bgcolor: 'action.hover' }
              }}
            >
              {emoji}
            </Box>
          ))}

          {/* "+" button — opens full emoji-mart picker */}
          <Box
            component='span'
            role='button'
            aria-label='More reactions'
            onClick={handleOpenFullPicker as any}
            sx={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: 'action.hover',
              color: 'text.secondary',
              fontSize: '1.125rem',
              fontWeight: 600,
              lineHeight: 1,
              ml: 0.5,
              userSelect: 'none',
              transition: 'bgcolor 0.15s',
              '&:hover': { bgcolor: 'action.selected' }
            }}
          >
            +
          </Box>
        </Box>
      </Popover>

      {/* Full emoji-mart picker — Popper with flip disabled so it always opens upward */}
      <Popper
        open={pickerOpen}
        anchorEl={pickerAnchor}
        placement={isSender ? 'top-end' : 'top-start'}
        transition
        modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
        sx={{ zIndex: theme => theme.zIndex.modal }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={150}>
            <Paper elevation={6} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <ClickAwayListener onClickAway={() => setPickerAnchor(null)}>
                <div>
                  {pickerOpen && (
                    <EmojiPicker
                      data={data}
                      onEmojiSelect={(emoji: { native: string }) => handleToggleReaction(emoji.native)}
                      searchPosition='top'
                      previewPosition='none'
                      skinTonePosition='none'
                    />
                  )}
                </div>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default MessageReactionPicker
