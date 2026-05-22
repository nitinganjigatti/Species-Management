'use client'

// ** React Imports
import { useCallback, useEffect, useRef, useState } from 'react'

// ** MUI Imports
import Badge from '@mui/material/Badge'
import MuiAvatar from '@mui/material/Avatar'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Box, { BoxProps } from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components Import
import ChatLog from './ChatLog'
import SendMsgForm from 'src/views/apps/chat/SendMsgForm'
import CustomAvatar from 'src/@core/components/mui/avatar'
import OptionsMenu from 'src/@core/components/option-menu'
import UserProfileRight from 'src/views/apps/chat/UserProfileRight'
import MessageInfoDialog from 'src/views/apps/chat/MessageInfoDialog'
import ForwardMessageDialog from 'src/views/apps/chat/ForwardMessageDialog'
import PinnedMessagesStrip from 'src/views/apps/chat/PinnedMessagesStrip'
import SearchMessagesDrawer from 'src/views/apps/chat/SearchMessagesDrawer'
import type { SearchResultItem } from 'src/views/apps/chat/SearchMessagesDrawer'
import AddMembersDrawer from 'src/views/apps/chat/AddMembersDrawer'

// ** Chat API
import { searchMessages, getUserLastSeen } from 'src/lib/chat/api'

// ** SDK presence store — auto-updates from `user_online` / `user_offline`.
import { useChatStore } from '@antzsoft/chat-core'

// ** Store
import { loadOlderMessages, jumpToMessage } from 'src/store/apps/chat'

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
    isFullscreen = false,
    onToggleFullscreen,
    typingUsers = []
  } = props

  // ** Search state
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeMatchIndex, setActiveMatchIndex] = useState(0)
  const [searchResultIds, setSearchResultIds] = useState<string[]>([])
  // Full search results — required by the new SearchMessagesDrawer so
  // each row can show sender + snippet + time. `searchResultIds` (above)
  // is kept in sync and continues to drive ChatLog's in-bubble highlight.
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchTotal, setSearchTotal] = useState(0)
  const [scrollTargetMessageId, setScrollTargetMessageId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Live presence for the chat header (DMs only). SDK auto-fills
  // `onlineUsers` + `lastSeen` from socket events; we just subscribe
  // and seed `lastSeen` once per DM open for cold-start cases.
  const onlineUsers = useChatStore(s => s.onlineUsers)
  const lastSeenMap = useChatStore(s => s.lastSeen)
  const peerUserId = (() => {
    const sc = store?.selectedChat
    if (!sc || sc.contact.isGroup === true) return null
    const meIdStr = String(store?.userProfile?.id ?? '')
    const peer = sc.contact.participants?.find(p => String(p.userId) !== meIdStr)

    return peer?.userId ? String(peer.userId) : null
  })()
  useEffect(() => {
    if (!peerUserId) return
    // Skip if we already have a snapshot — the store auto-refreshes via
    // `user_offline` events while the socket is connected, so refetching
    // on every DM re-open would be wasted network.
    if (lastSeenMap[peerUserId]) return
    let cancelled = false
    getUserLastSeen(peerUserId)
      .then(res => {
        if (cancelled || !res?.lastSeenAt) return
        useChatStore.getState().setLastSeen(peerUserId, res.lastSeenAt)
      })
      .catch(err => {
        console.warn('[chat:presence] getUserLastSeen failed:', err)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerUserId])

  // Format a last-seen ISO string into WhatsApp-style copy:
  //   "last seen today at 14:30"
  //   "last seen yesterday at 14:30"
  //   "last seen 12/04/2026 at 14:30"
  // Returns null when there's no valid date — caller falls back to the
  // generic contact role label.
  const formatLastSeen = (iso?: string): string | null => {
    if (!iso) return null
    const seen = new Date(iso)
    if (Number.isNaN(seen.getTime())) return null
    const now = new Date()
    const sameDay =
      seen.getFullYear() === now.getFullYear() && seen.getMonth() === now.getMonth() && seen.getDate() === now.getDate()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const isYesterday =
      seen.getFullYear() === yesterday.getFullYear() &&
      seen.getMonth() === yesterday.getMonth() &&
      seen.getDate() === yesterday.getDate()
    const time = seen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (sameDay) return `last seen today at ${time}`
    if (isYesterday) return `last seen yesterday at ${time}`

    return `last seen ${seen.toLocaleDateString()} at ${time}`
  }

  // Debounced API search. Populates BOTH `searchResults` (full rows for
  // the drawer's preview list) and `searchResultIds` (id-only array
  // consumed by ChatLog for in-bubble highlighting). Keeping the two in
  // sync from one effect avoids drift.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const conversationId = store?.selectedChat?.contact?.id
    if (!searchQuery.trim() || !conversationId) {
      setSearchResultIds([])
      setSearchResults([])
      setSearchTotal(0)
      setSearchLoading(false)

      return
    }

    setSearchLoading(true)
    debounceRef.current = setTimeout(() => {
      searchMessages({ query: searchQuery, conversationId: String(conversationId), limit: 50 })
        .then(res => {
          // Adapt SDK Message → SearchResultItem for the drawer rows.
          const rows: SearchResultItem[] = res.data.map((m: any) => ({
            id: m.id,
            text: m?.content?.text ?? '',
            senderId: m?.senderId,
            senderName:
              m?.sender?.displayName ?? m?.sender?.username ?? (m?.senderId ? String(m.senderId) : undefined),
            sentAt: m?.sentAt ?? m?.createdAt,
            hasAttachment: Array.isArray(m?.content?.attachments) && m.content.attachments.length > 0
          }))
          setSearchResults(rows)
          setSearchResultIds(rows.map(r => r.id))
          setSearchTotal(res.meta.total)
          setActiveMatchIndex(0)
        })
        .catch(() => {
          setSearchResultIds([])
          setSearchResults([])
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
    setSearchResults([])
    setSearchTotal(0)
  }, [store?.selectedChat?.contact?.id])

  const handleSearchToggle = useCallback(() => {
    setSearchOpen(prev => {
      // Drawer's `autoFocus` on its own InputBase handles focusing —
      // no need to reach into a ref. When closing, clear the query so
      // ChatLog drops its in-bubble highlight at the same time.
      if (prev) {
        setSearchQuery('')
      }

      return !prev
    })
  }, [])

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResultIds([])
    setSearchResults([])
    setSearchTotal(0)
    // No chat reload on close — matches WhatsApp Web. If the user
    // jumped to a historical message via a result, they stay there;
    // they can scroll back down or reopen the chat manually.
  }, [])

  // Add Members drawer (group-created card's "Add members" button).
  // Standalone right-side drawer that uses the same SDK call as the
  // existing in-UserProfileRight Add Members panel. Independent state,
  // independent mount — opening this drawer does NOT touch the
  // UserProfileRight `addingMembers` state at all.
  const [addMembersDrawerOpen, setAddMembersDrawerOpen] = useState<boolean>(false)
  const handleAddMembersFromCard = useCallback(() => {
    setAddMembersDrawerOpen(true)
  }, [])

  // Drawer click → scroll the main ChatLog to the chosen message and
  // mark it as the "active match" so the existing flash + focus styles
  // in ChatLog kick in.
  const handleSearchResultClick = useCallback(
    (messageId: string) => {
      const idx = searchResultIds.indexOf(messageId)
      if (idx >= 0) setActiveMatchIndex(idx)
      setScrollTargetMessageId(null)
      requestAnimationFrame(() => setScrollTargetMessageId(messageId))
    },
    [searchResultIds]
  )

  const handleStartConversation = () => {
    if (!mdAbove) {
      handleLeftSidebarToggle()
    }
  }

  const renderContent = () => {
    if (store) {
      const selectedChat = store.selectedChat

      // Single source of truth for "the current user can act on this
      // conversation". For DMs this is always true; for groups we look up
      // the user's own participant entry and treat `isActive === false` as
      // removed/left. Drives both composer visibility AND per-message
      // action / reaction availability inside ChatLog.
      const canInteract = (() => {
        if (!selectedChat) return false
        if (selectedChat.contact.isGroup !== true) return true
        const me = String(store.userProfile?.id ?? '')
        if (!me) return true
        const myEntry = selectedChat.contact.participants?.find(p => String(p.userId) === me)

        return myEntry?.isActive !== false
      })()

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
              backgroundColor: 'action.hover',
              backgroundImage: 'url(/images/chat/chat-backgroud.svg)',
              backgroundRepeat: 'repeat',
              backgroundSize: 'auto'
            }}
          >
            <Box
              sx={{
                py: 3,
                px: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: theme => `1px solid ${theme.palette.divider}`,
                backgroundColor: 'background.paper'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, overflow: 'hidden', flex: 1 }}>
                {mdAbove ? null : (
                  <IconButton onClick={handleLeftSidebarToggle} sx={{ mr: 2, flexShrink: 0 }}>
                    <Icon icon='mdi:menu' />
                  </IconButton>
                )}
                <Box
                  onClick={handleUserProfileRightSidebarToggle}
                  sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', minWidth: 0, overflow: 'hidden' }}
                >
                  {selectedChat.contact.isGroup ? (
                    // Group: prefer the uploaded `iconUrl` (mapped to
                    // `contact.avatar` by the adapter). Fall back to the
                    // default group glyph when no icon has been set yet.
                    selectedChat.contact.avatar ? (
                      <MuiAvatar
                        src={selectedChat.contact.avatar}
                        alt={selectedChat.contact.fullName}
                        sx={{ width: 40, height: 40, mr: 3.5 }}
                      />
                    ) : (
                      // Teal-gradient circle + white glyph — same visual as the
                      // group-created card in ChatLog, so the group identity
                      // reads consistently across sidebar / header / card.
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          mr: 3.5,
                          borderRadius: '50%',
                          background: theme =>
                            `linear-gradient(135deg, ${theme.palette.secondary.light}, ${theme.palette.secondary.main})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Icon icon='mdi:account-group' fontSize='1.25rem' style={{ color: '#fff' }} />
                      </Box>
                    )
                  ) : (
                    (() => {
                      // DM presence — green dot only when peer is in
                      // live `useChatStore.onlineUsers`. Hides the badge
                      // entirely otherwise (matches WhatsApp Web).
                      const isPeerOnline = peerUserId ? onlineUsers.includes(peerUserId) : false
                      const peerAvatar = selectedChat.contact.avatar ? (
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
                      )

                      return isPeerOnline ? (
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
                                color: 'success.main',
                                boxShadow: theme => `0 0 0 2px ${theme.palette.background.paper}`,
                                backgroundColor: 'success.main'
                              }}
                            />
                          }
                        >
                          {peerAvatar}
                        </Badge>
                      ) : (
                        <Box sx={{ mr: 4.5, display: 'inline-flex' }}>{peerAvatar}</Box>
                      )
                    })()
                  )}
                  <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <Typography sx={{ color: '#1F515B', fontWeight: 600 }}>
                      {selectedChat.contact.fullName}
                    </Typography>
                    {/* Status line — WhatsApp-Web style.
                          DM     → green "online" / grey "last seen X" /
                                   fallback to contact role label.
                          Group  → comma-separated member names with
                                   "You" for the current user, CSS-
                                   truncated when the row is too narrow.
                                   This matches the WhatsApp Web header
                                   ("You, Alice, Bob …") instead of the
                                   previous bare "<N> members" count. */}
                    <Typography
                      variant='body2'
                      noWrap
                      sx={{
                        maxWidth: 480,
                        fontSize: '12px',
                        lineHeight: 'normal',
                        color:
                          !selectedChat.contact.isGroup && peerUserId && onlineUsers.includes(peerUserId)
                            ? 'success.main'
                            : '#44544A'
                      }}
                    >
                      {selectedChat.contact.isGroup
                        ? (() => {
                            const me = String(store?.userProfile?.id ?? '')
                            const names = (selectedChat.contact.participants ?? [])
                              .filter(p => p.isActive !== false)
                              .map(p => (String(p.userId) === me ? 'You' : p.displayName || p.username || 'Unknown'))

                            // Order: "You" first if present, matching
                            // WhatsApp's convention; rest in their
                            // existing participants order so it stays
                            // stable across renders.
                            const youIdx = names.indexOf('You')
                            if (youIdx > 0) {
                              names.splice(youIdx, 1)
                              names.unshift('You')
                            }

                            return names.length
                              ? names.join(', ')
                              : `${selectedChat.contact.participantIds?.length ?? 0} members`
                          })()
                        : peerUserId && onlineUsers.includes(peerUserId)
                        ? 'online'
                        : peerUserId && formatLastSeen(lastSeenMap[peerUserId])
                        ? formatLastSeen(lastSeenMap[peerUserId])
                        : selectedChat.contact.role}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {/* Call & video call hidden — re-enable when needed */}
                {/* {mdAbove ? (
                  <Fragment>
                    <IconButton size='small' sx={{ color: '#44544A', lineHeight: 'normal' }}>
                      <Icon icon='mdi:phone-outline' />
                    </IconButton>
                    <IconButton size='small' sx={{ color: '#44544A', lineHeight: 'normal' }}>
                      <Icon icon='mdi:video-outline' fontSize='1.5rem' />
                    </IconButton>
                  </Fragment>
                ) : null} */}
                {/* Search icon — always visible (was previously gated
                    behind `mdAbove`, which hid it on phone/tablet sizes
                    even though messages search is just as useful there). */}
                <IconButton
                  size='small'
                  sx={{ color: searchOpen ? 'primary.main' : '#44544A' }}
                  onClick={handleSearchToggle}
                >
                  <Icon icon='mdi:magnify' />
                </IconButton>

                {onToggleFullscreen && (
                  <IconButton
                    size='small'
                    sx={{ color: '#44544A', lineHeight: 'normal' }}
                    onClick={onToggleFullscreen}
                    title={isFullscreen ? 'Minimize' : 'Maximize'}
                  >
                    <Icon icon={isFullscreen ? 'teenyicons:minimise-alt-solid' : 'akar-icons:enlarge'} />
                  </IconButton>
                )}

                {/* 3-dot menu hidden — re-enable when needed */}
                {/* <OptionsMenu
                  menuProps={{ sx: { mt: 2 } }}
                  icon={<Icon icon='mdi:dots-vertical' fontSize='1.25rem' />}
                  iconButtonProps={{ size: 'small', sx: { color: '#44544A' } }}
                  options={['View Contact', 'Mute Notifications', 'Block Contact', 'Clear Chat', 'Report']}
                /> */}
              </Box>
            </Box>

            {/* Search UI lives in the SearchMessagesDrawer mounted near
                the bottom of this component, alongside UserProfileRight. */}

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
                  <PinnedMessagesStrip
                    selectedChat={selectedChat}
                    userProfile={store.userProfile}
                    onScrollToMessage={(messageId: string) => {
                      // Clear first so re-clicking the same id retriggers
                      // the ChatLog effect (which dedupes on prop value).
                      setScrollTargetMessageId(null)
                      requestAnimationFrame(() => setScrollTargetMessageId(messageId))
                    }}
                  />
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
                    scrollTargetMessageId={scrollTargetMessageId}
                    onScrollToTargetDone={() => setScrollTargetMessageId(null)}
                    onJumpToReply={(messageId: string) => {
                      // Clear first so re-clicking the same reply re-fires
                      // the ChatLog effect (which dedupes on prop value).
                      setScrollTargetMessageId(null)
                      requestAnimationFrame(() => setScrollTargetMessageId(messageId))
                    }}
                    canInteract={canInteract}
                    onAddMember={handleAddMembersFromCard}
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
                      backgroundColor: '#44544A',
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
                <Typography variant='caption' sx={{ color: '#44544A', lineHeight: 'normal' }}>
                  {typingUsers.length === 1
                    ? `${typingUsers[0].displayName} is typing`
                    : typingUsers.length === 2
                    ? `${typingUsers[0].displayName} and ${typingUsers[1].displayName} are typing`
                    : `${typingUsers[0].displayName} and ${typingUsers.length - 1} others are typing`}
                </Typography>
              </Box>
            )}

            {/* Composer + per-message actions share the same gate
                (`canInteract`) — when the current user is removed from /
                has left a group, none of the chat actions should be usable. */}
            {canInteract ? (
              <SendMsgForm store={store} dispatch={dispatch} sendMsg={sendMsg} />
            ) : (
              <Box
                sx={{
                  px: 4,
                  py: 3,
                  textAlign: 'center',
                  borderTop: theme => `1px solid ${theme.palette.divider}`,
                  backgroundColor: 'customColors.Surface'
                }}
              >
                {/* v1.1.3 — when the chat carries `removedBy`, the current
                    user was kicked by an admin (not a self-exit). Surface
                    that distinction in the read-only placeholder so the
                    user understands why they can't message. Defaults to
                    the generic "no longer a member" copy when removedBy
                    is absent (covers self-exit and legacy/refresh cases). */}
                <Typography variant='caption' sx={{ color: '#44544A', lineHeight: 'normal' }}>
                  {selectedChat.contact.removedBy
                    ? selectedChat.contact.removedByName
                      ? `You were removed from this group by ${selectedChat.contact.removedByName}.`
                      : 'You were removed from this group.'
                    : "You're no longer a member of this group."}
                </Typography>
              </Box>
            )}

            <UserProfileRight
              store={store}
              hidden={hidden}
              statusObj={statusObj}
              getInitials={getInitials}
              sidebarWidth={sidebarWidth}
              userProfileRightOpen={userProfileRightOpen}
              handleUserProfileRightSidebarToggle={handleUserProfileRightSidebarToggle}
              onScrollToMessage={(messageId: string) => {
                setScrollTargetMessageId(null)
                requestAnimationFrame(() => setScrollTargetMessageId(messageId))
              }}
              onOpenSearch={() => {
                handleUserProfileRightSidebarToggle()
                handleSearchToggle()
              }}
            />
            {/* WhatsApp-Web-style right-side search drawer. Gated on
                `searchOpen` so the Sidebar primitive doesn't mount /
                stay-mounted-but-offscreen on every chat — keeps the
                initial render path clean for chats that never search. */}
            {searchOpen && (
              <SearchMessagesDrawer
                open={searchOpen}
                onClose={handleSearchClose}
                peerName={selectedChat.contact.fullName}
                query={searchQuery}
                onQueryChange={setSearchQuery}
                results={searchResults}
                loading={searchLoading}
                onResultClick={handleSearchResultClick}
                activeMessageId={searchResultIds[activeMatchIndex] ?? null}
                width={sidebarWidth}
              />
            )}
            {/* Standalone Add Members drawer — triggered by the group-
                created card. Gated on open so it doesn't mount until
                needed. Independent of UserProfileRight; uses the same
                `addParticipantsToGroup` thunk so behavior matches the
                existing in-profile Add Members panel. */}
            {addMembersDrawerOpen && selectedChat.contact.isGroup && (
              <AddMembersDrawer
                open={addMembersDrawerOpen}
                onClose={() => setAddMembersDrawerOpen(false)}
                groupId={typeof selectedChat.contact.id === 'string' ? selectedChat.contact.id : null}
                existingParticipantIds={selectedChat.contact.participantIds ?? []}
                currentUserId={store.userProfile?.id ?? ''}
                width={sidebarWidth}
              />
            )}
            {/* Mounted once at the chat shell root — driven by Redux
                `state.chat.infoMessage`. Any bubble's "Info" menu item
                dispatches `setInfoMessage(...)` and the drawer slides in
                using the same `Sidebar` primitive as UserProfileRight. */}
            <MessageInfoDialog />
            {/* Forward-message picker — driven by Redux `state.chat.forwardingMessage`.
                The 3-dot menu's "Forward" item dispatches `setForwardingMessage(...)`
                with a snapshot of the source bubble. */}
            <ForwardMessageDialog />
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
