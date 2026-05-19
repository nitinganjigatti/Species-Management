'use client'

// ** React Imports
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'

// ** MUI Imports
import Badge from '@mui/material/Badge'
import MuiAvatar from '@mui/material/Avatar'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Box, { BoxProps } from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import InputBase from '@mui/material/InputBase'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components Import
import ChatLog from './ChatLog'
import SendMsgForm from 'src/views/apps/chat/SendMsgForm'
import CustomAvatar from 'src/@core/components/mui/avatar'
import OptionsMenu from 'src/@core/components/option-menu'
import UserProfileRight from 'src/views/apps/chat/UserProfileRight'

// ** Chat API
import { searchMessages } from 'src/lib/chat/api'

// ** Store
import { loadOlderMessages, jumpToMessage, selectChat } from 'src/store/apps/chat'

// ** Types
import { ChatContentType } from 'src/types/apps/chatTypes'

// ** Styled Components
const ChatWrapperStartChat = styled(Box)<BoxProps>(({ theme }) => ({
  flexGrow: 1,
  height: '100%',
  display: 'flex',
  borderRadius: 1,
  alignItems: 'center',
  flexDirection: 'column',
  justifyContent: 'center',
  backgroundColor: theme.palette.action.hover
}))

const ChatContent = (props: ChatContentType) => {
  // ** Props
  const {
    store,
    hidden,
    sendMsg,
    mdAbove,
    dispatch,
    statusObj,
    getInitials,
    sidebarWidth,
    userProfileRightOpen,
    handleLeftSidebarToggle,
    handleUserProfileRightSidebarToggle,
    typingUsers = []
  } = props

  // ** Search state
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeMatchIndex, setActiveMatchIndex] = useState(0)
  const [searchResultIds, setSearchResultIds] = useState<string[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchTotal, setSearchTotal] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced API search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const conversationId = store?.selectedChat?.contact?.id
    if (!searchQuery.trim() || !conversationId) {
      setSearchResultIds([])
      setSearchTotal(0)
      setSearchLoading(false)

      return
    }

    setSearchLoading(true)
    debounceRef.current = setTimeout(() => {
      searchMessages({ query: searchQuery, conversationId: String(conversationId), limit: 50 })
        .then(res => {
          setSearchResultIds(res.data.map(m => m.id))
          setSearchTotal(res.meta.total)
          setActiveMatchIndex(0)
        })
        .catch(() => {
          setSearchResultIds([])
          setSearchTotal(0)
        })
        .finally(() => setSearchLoading(false))
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery, store?.selectedChat?.contact?.id])

  // Reset search when chat changes
  useEffect(() => {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResultIds([])
    setSearchTotal(0)
  }, [store?.selectedChat?.contact?.id])

  const handleSearchToggle = useCallback(() => {
    setSearchOpen(prev => {
      if (!prev) {
        setTimeout(() => searchInputRef.current?.focus(), 100)
      } else {
        setSearchQuery('')
      }

      return !prev
    })
  }, [])

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResultIds([])
    setSearchTotal(0)

    // If the user jumped to a historical message via search, the loaded
    // message window is sitting in the middle of history — reopen the chat
    // to snap back to the latest 50 messages so live updates resume.
    const chatId = store?.selectedChat?.contact?.id
    if (chatId) dispatch(selectChat(chatId) as any)
  }, [dispatch, store?.selectedChat?.contact?.id])

  const handleSearchPrev = useCallback(() => {
    setActiveMatchIndex(prev => (prev > 0 ? prev - 1 : searchResultIds.length - 1))
  }, [searchResultIds.length])

  const handleSearchNext = useCallback(() => {
    setActiveMatchIndex(prev => (prev < searchResultIds.length - 1 ? prev + 1 : 0))
  }, [searchResultIds.length])

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          handleSearchPrev()
        } else {
          handleSearchNext()
        }
      } else if (e.key === 'Escape') {
        handleSearchClose()
      }
    },
    [handleSearchNext, handleSearchPrev, handleSearchClose]
  )

  const handleStartConversation = () => {
    if (!mdAbove) {
      handleLeftSidebarToggle()
    }
  }

  const renderContent = () => {
    if (store) {
      const selectedChat = store.selectedChat
      if (!selectedChat) {
        return (
          <ChatWrapperStartChat
            sx={{
              ...(mdAbove ? { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } : {})
            }}
          >
            <MuiAvatar
              sx={{
                mb: 5,
                pt: 8,
                pb: 7,
                px: 7.5,
                width: 110,
                height: 110,
                boxShadow: 3,
                '& svg': { color: 'action.active' },
                backgroundColor: 'background.paper'
              }}
            >
              <Icon icon='mdi:message-outline' fontSize='3.125rem' />
            </MuiAvatar>
            <Box
              onClick={handleStartConversation}
              sx={{
                px: 6,
                py: 2.25,
                boxShadow: 3,
                borderRadius: 5,
                backgroundColor: 'background.paper',
                cursor: mdAbove ? 'default' : 'pointer'
              }}
            >
              <Typography sx={{ fontWeight: 600 }}>Start Conversation</Typography>
            </Box>
          </ChatWrapperStartChat>
        )
      } else {
        return (
          <Box
            sx={{
              width: 0,
              flexGrow: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'action.hover'
            }}
          >
            <Box
              sx={{
                py: 3,
                px: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: theme => `1px solid ${theme.palette.divider}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {mdAbove ? null : (
                  <IconButton onClick={handleLeftSidebarToggle} sx={{ mr: 2 }}>
                    <Icon icon='mdi:menu' />
                  </IconButton>
                )}
                <Box
                  onClick={handleUserProfileRightSidebarToggle}
                  sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >
                  {selectedChat.contact.isGroup ? (
                    <CustomAvatar skin='light' color='primary' sx={{ width: 40, height: 40, mr: 3.5 }}>
                      <Icon icon='mdi:account-group' fontSize='1.25rem' />
                    </CustomAvatar>
                  ) : (
                    <Badge
                      overlap='circular'
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      sx={{ mr: 4.5 }}
                      badgeContent={
                        <Box
                          component='span'
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            color: `${statusObj[selectedChat.contact.status]}.main`,
                            boxShadow: theme => `0 0 0 2px ${theme.palette.background.paper}`,
                            backgroundColor: `${statusObj[selectedChat.contact.status]}.main`
                          }}
                        />
                      }
                    >
                      {selectedChat.contact.avatar ? (
                        <MuiAvatar
                          src={selectedChat.contact.avatar}
                          alt={selectedChat.contact.fullName}
                          sx={{ width: 40, height: 40 }}
                        />
                      ) : (
                        <CustomAvatar
                          skin='light'
                          color={selectedChat.contact.avatarColor}
                          sx={{ width: 40, height: 40, fontSize: '1rem' }}
                        >
                          {getInitials(selectedChat.contact.fullName)}
                        </CustomAvatar>
                      )}
                    </Badge>
                  )}
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      {selectedChat.contact.fullName}
                    </Typography>
                    <Typography variant='body2' sx={{ color: 'text.disabled' }}>
                      {selectedChat.contact.isGroup
                        ? `${selectedChat.contact.participantIds?.length ?? 0} members`
                        : selectedChat.contact.role}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {mdAbove ? (
                  <Fragment>
                    {/* Call & video call hidden — re-enable when needed */}
                    {/* <IconButton size='small' sx={{ color: 'text.secondary' }}>
                      <Icon icon='mdi:phone-outline' />
                    </IconButton>
                    <IconButton size='small' sx={{ color: 'text.secondary' }}>
                      <Icon icon='mdi:video-outline' fontSize='1.5rem' />
                    </IconButton> */}
                    <IconButton
                      size='small'
                      sx={{ color: searchOpen ? 'primary.main' : 'text.secondary' }}
                      onClick={handleSearchToggle}
                    >
                      <Icon icon='mdi:magnify' />
                    </IconButton>
                  </Fragment>
                ) : null}

                {/* 3-dot menu hidden — re-enable when needed */}
                {/* <OptionsMenu
                  menuProps={{ sx: { mt: 2 } }}
                  icon={<Icon icon='mdi:dots-vertical' fontSize='1.25rem' />}
                  iconButtonProps={{ size: 'small', sx: { color: 'text.secondary' } }}
                  options={['View Contact', 'Mute Notifications', 'Block Contact', 'Clear Chat', 'Report']}
                /> */}
              </Box>
            </Box>

            {searchOpen && (
              <Box
                sx={{
                  px: 4,
                  py: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  borderBottom: theme => `1px solid ${theme.palette.divider}`,
                  backgroundColor: 'background.paper'
                }}
              >
                <Icon icon='mdi:magnify' fontSize='1.25rem' />
                <InputBase
                  inputRef={searchInputRef}
                  placeholder='Search messages...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  sx={{ flex: 1, fontSize: '0.875rem' }}
                  autoFocus
                />
                {searchQuery.trim() &&
                  (searchLoading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Typography variant='caption' sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {searchTotal > 0 ? `${activeMatchIndex + 1} of ${searchTotal}` : 'No results'}
                    </Typography>
                  ))}
                <IconButton size='small' onClick={handleSearchPrev} disabled={searchResultIds.length === 0}>
                  <Icon icon='mdi:chevron-up' fontSize='1.25rem' />
                </IconButton>
                <IconButton size='small' onClick={handleSearchNext} disabled={searchResultIds.length === 0}>
                  <Icon icon='mdi:chevron-down' fontSize='1.25rem' />
                </IconButton>
                <IconButton size='small' onClick={handleSearchClose}>
                  <Icon icon='mdi:close' fontSize='1.25rem' />
                </IconButton>
              </Box>
            )}

            {selectedChat && store.userProfile ? (
              store.loadingMessages ? (
                <Box
                  sx={{
                    flexGrow: 1,
                    minHeight: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CircularProgress size={36} />
                </Box>
              ) : (
                <>
                  {/* Pinned-messages strip. Shows count + latest pinned text;
                      clicking scrolls to the most-recently-pinned bubble. */}
                  {(() => {
                    const pinned = selectedChat.chat.messages.filter(m => m.isPinned && m.id)
                    if (!pinned.length) return null
                    const latest = pinned[pinned.length - 1]

                    return (
                      <Box
                        onClick={() => {
                          if (!latest.id) return
                          const el = document.querySelector(`[data-msg-id="${latest.id}"]`)
                          if (!el) return
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          el.classList.add('msg-flash')
                          setTimeout(() => el.classList.remove('msg-flash'), 1200)
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          px: 4,
                          py: 1.25,
                          cursor: 'pointer',
                          borderBottom: theme => `1px solid ${theme.palette.divider}`,
                          backgroundColor: 'customColors.Surface',
                          '&:hover': {
                            backgroundColor: theme => theme.palette.action.hover
                          }
                        }}
                      >
                        <Icon icon='mdi:pin' fontSize='1.125rem' />
                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                          <Typography variant='caption' sx={{ display: 'block', fontWeight: 600 }}>
                            Pinned · {pinned.length}
                          </Typography>
                          <Typography variant='caption' noWrap sx={{ display: 'block', color: 'text.secondary' }}>
                            {latest.message || (latest.attachments?.length ? '📎 Attachment' : '')}
                          </Typography>
                        </Box>
                      </Box>
                    )
                  })()}
                  <ChatLog
                    hidden={hidden}
                    data={{ ...selectedChat, userContact: store.userProfile }}
                    searchQuery={searchOpen ? searchQuery : ''}
                    searchResultIds={searchOpen ? searchResultIds : []}
                    activeMatchIndex={activeMatchIndex}
                    onLoadOlder={() => {
                      const chatId = selectedChat.contact.id
                      if (chatId) dispatch(loadOlderMessages(chatId) as any)
                    }}
                    onJumpToMessage={(messageId: string) => {
                      const chatId = selectedChat.contact.id
                      if (chatId && messageId) {
                        dispatch(jumpToMessage({ chatId, messageId }) as any)
                      }
                    }}
                  />
                </>
              )
            ) : null}

            {typingUsers.length > 0 && (
              <Box sx={{ px: 5, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    gap: '3px',
                    alignItems: 'center',
                    '& > span': {
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: 'text.disabled',
                      animation: 'typingBounce 1.4s infinite ease-in-out',
                      '&:nth-of-type(1)': { animationDelay: '0s' },
                      '&:nth-of-type(2)': { animationDelay: '0.2s' },
                      '&:nth-of-type(3)': { animationDelay: '0.4s' }
                    },
                    '@keyframes typingBounce': {
                      '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.4 },
                      '40%': { transform: 'scale(1)', opacity: 1 }
                    }
                  }}
                >
                  <Box component='span' />
                  <Box component='span' />
                  <Box component='span' />
                </Box>
                <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                  {typingUsers.length === 1
                    ? `${typingUsers[0].displayName} is typing`
                    : typingUsers.length === 2
                    ? `${typingUsers[0].displayName} and ${typingUsers[1].displayName} are typing`
                    : `${typingUsers[0].displayName} and ${typingUsers.length - 1} others are typing`}
                </Typography>
              </Box>
            )}

            <SendMsgForm store={store} dispatch={dispatch} sendMsg={sendMsg} />

            <UserProfileRight
              store={store}
              hidden={hidden}
              statusObj={statusObj}
              getInitials={getInitials}
              sidebarWidth={sidebarWidth}
              userProfileRightOpen={userProfileRightOpen}
              handleUserProfileRightSidebarToggle={handleUserProfileRightSidebarToggle}
            />
          </Box>
        )
      }
    } else {
      return null
    }
  }

  return renderContent()
}

export default ChatContent
