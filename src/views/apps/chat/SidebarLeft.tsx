'use client'

// ** React Imports
import { useState, useEffect, ChangeEvent, ReactNode } from 'react'

// ** Next Imports (App Router)
import { usePathname } from 'next/navigation'

// ** MUI Imports
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import Chip from '@mui/material/Chip'
import Badge from '@mui/material/Badge'
import Drawer from '@mui/material/Drawer'
import MuiAvatar from '@mui/material/Avatar'
import ListItem from '@mui/material/ListItem'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ListItemText from '@mui/material/ListItemText'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemButton from '@mui/material/ListItemButton'
import InputAdornment from '@mui/material/InputAdornment'

// ** Shared utility components
import FilterChip from 'src/views/utility/FilterChip'

// ** Third Party Components
import PerfectScrollbar from 'react-perfect-scrollbar'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Types
import type {
  ChatSidebarLeftType,
  ChatsArrType,
  ChatFilterType,
  ChatEntityId,
  CreateGroupPayload
} from 'src/types/apps/chatTypes'

// ** Custom Components Import
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** Chat App Components
import UserProfileLeft from 'src/views/apps/chat/UserProfileLeft'
import ComposePopover from 'src/views/apps/chat/ComposePopover'
import CreateGroupDrawer from 'src/views/apps/chat/CreateGroupDrawer'

// ** Slice actions (filter + group)
import { setActiveFilter, createGroupChat, startDirectChat } from 'src/store/apps/chat'

const ScrollWrapper = ({ children, hidden }: { children: ReactNode; hidden: boolean }) => {
  if (hidden) {
    return <Box sx={{ height: '100%', overflow: 'auto' }}>{children}</Box>
  }

  return <PerfectScrollbar options={{ wheelPropagation: false }}>{children}</PerfectScrollbar>
}

const FILTER_TABS: { value: ChatFilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'favourites', label: 'Favourites' },
  { value: 'groups', label: 'Groups' }
]

const SidebarLeft = (props: ChatSidebarLeftType) => {
  const {
    store,
    hidden,
    mdAbove,
    dispatch,
    statusObj,
    userStatus,
    selectChat,
    getInitials,
    sidebarWidth,
    setUserStatus,
    leftSidebarOpen,
    removeSelectedChat,
    userProfileLeftOpen,
    formatDateToMonthShort,
    handleLeftSidebarToggle,
    handleUserProfileLeftSidebarToggle
  } = props

  // ** Local UI state
  const [query, setQuery] = useState<string>('')
  const [active, setActive] = useState<null | { type: string; id: string | number }>(null)
  const [composeAnchorEl, setComposeAnchorEl] = useState<HTMLElement | null>(null)
  const [view, setView] = useState<'chats' | 'create-group'>('chats')

  const pathname = usePathname()
  const activeFilter: ChatFilterType = store?.activeFilter ?? 'all'

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleChatClick = (type: 'chat' | 'contact', id: ChatEntityId) => {
    // Clicking an existing chat row → open that conversation directly.
    // Clicking a contact (from the compose popover) → resolve/create a direct
    // conversation first, then open it. `startDirectChat` handles both the
    // SDK path (POST /conversations/direct — idempotent) and the legacy mock
    // path (synthesize a chat entry from the contact).
    if (type === 'contact') {
      dispatch(startDirectChat(id))
    } else {
      dispatch(selectChat(id))
    }
    setActive({ type, id })
    if (!mdAbove) handleLeftSidebarToggle()
  }

  const handleFilterChange = (filter: ChatFilterType) => {
    dispatch(setActiveFilter(filter))
  }

  const handleComposeOpen = (e: React.MouseEvent<HTMLElement>) => {
    setComposeAnchorEl(e.currentTarget)
  }

  const handleComposeClose = () => setComposeAnchorEl(null)

  const handleOpenCreateGroup = () => {
    setView('create-group')
    setComposeAnchorEl(null)
  }

  const handleCancelCreateGroup = () => setView('chats')

  const handleCreateGroup = (payload: CreateGroupPayload) => {
    dispatch(createGroupChat(payload))
    setView('chats')
    if (!mdAbove) handleLeftSidebarToggle()
  }

  // Clear active highlight on route change
  useEffect(() => {
    return () => {
      setActive(null)
      dispatch(removeSelectedChat())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (store && store.chats && active && active.type === 'contact' && active.id === store.chats[0]?.id) {
      setActive({ type: 'chat', id: active.id })
    }
  }, [store, active])

  // ── filtered chat list ────────────────────────────────────────────────────
  const visibleChats: ChatsArrType[] = (() => {
    if (!store?.chats) return []
    let list = store.chats

    // Tab filter
    if (activeFilter === 'unread') {
      list = list.filter(c => (c.chat?.unseenMsgs ?? 0) > 0)
    } else if (activeFilter === 'favourites') {
      list = list.filter(c => c.isFavourite === true)
    } else if (activeFilter === 'groups') {
      list = list.filter(c => c.isGroup === true)
    }

    // Search filter on top of tab filter
    if (query.trim().length) {
      const q = query.trim().toLowerCase()
      list = list.filter(c => c.fullName.toLowerCase().includes(q))
    }

    return list
  })()

  const renderChats = () => {
    // chats is null until the first fetch resolves — show a spinner.
    if (!store?.chats) {
      return (
        <ListItem>
          <Typography sx={{ color: 'text.secondary' }}>Loading…</Typography>
        </ListItem>
      )
    }

    // chats loaded but the user has no conversations yet.
    if (store.chats.length === 0) {
      return (
        <Box sx={{ px: 5, py: 6, textAlign: 'center' }}>
          <Icon icon='mdi:message-text-outline' fontSize='2.5rem' color='inherit' />
          <Typography variant='body2' sx={{ mt: 2, color: 'text.secondary' }}>
            No conversations yet
          </Typography>
          <Typography variant='caption' sx={{ mt: 1, color: 'text.disabled', display: 'block' }}>
            Tap the compose icon to start a new chat
          </Typography>
        </Box>
      )
    }

    // chats exist but the current search/filter excludes everything.
    if (!visibleChats.length) {
      return (
        <ListItem>
          <Typography sx={{ color: 'text.secondary' }}>
            {query.trim().length ? 'No Chats Found' : 'No chats match this filter'}
          </Typography>
        </ListItem>
      )
    }

    return visibleChats.map((chat: ChatsArrType, index: number) => {
      const { lastMessage } = chat.chat
      const activeCondition = active !== null && active.id === chat.id && active.type === 'chat'
      const isGroup = chat.isGroup === true

      return (
        <ListItem key={`chat-${chat.id}-${index}`} disablePadding sx={{ '&:not(:last-child)': { mb: 1.5 } }}>
          <ListItemButton
            disableRipple
            onClick={() => handleChatClick('chat', chat.id)}
            sx={{
              px: 2.5,
              py: 2.5,
              width: '100%',
              borderRadius: 1,
              alignItems: 'flex-start',
              ...(activeCondition && { backgroundColor: theme => `${theme.palette.primary.main} !important` })
            }}
          >
            <ListItemAvatar sx={{ m: 0 }}>
              {isGroup ? (
                <CustomAvatar
                  color='primary'
                  skin={activeCondition ? 'light-static' : 'light'}
                  sx={{ width: 40, height: 40, fontSize: '1.125rem' }}
                >
                  <Icon icon='mdi:account-group' fontSize='1.25rem' />
                </CustomAvatar>
              ) : (
                <Badge
                  overlap='circular'
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Box
                      component='span'
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        color: `${statusObj[chat.status]}.main`,
                        backgroundColor: `${statusObj[chat.status]}.main`,
                        boxShadow: theme =>
                          `0 0 0 2px ${!activeCondition ? theme.palette.background.paper : theme.palette.common.white}`
                      }}
                    />
                  }
                >
                  {chat.avatar ? (
                    <MuiAvatar src={chat.avatar} alt={chat.fullName} sx={{ width: 40, height: 40 }} />
                  ) : (
                    <CustomAvatar
                      color={chat.avatarColor}
                      skin={activeCondition ? 'light-static' : 'light'}
                      sx={{ width: 40, height: 40, fontSize: '1rem' }}
                    >
                      {getInitials(chat.fullName)}
                    </CustomAvatar>
                  )}
                </Badge>
              )}
            </ListItemAvatar>

            <ListItemText
              sx={{
                my: 0,
                ml: 4,
                mr: 1.5,
                '& .MuiTypography-root': { ...(activeCondition && { color: 'common.white' }) }
              }}
              primary={
                <Typography noWrap sx={{ ...(!activeCondition ? { color: 'text.secondary' } : {}), fontWeight: 600 }}>
                  {chat.fullName}
                </Typography>
              }
              secondary={
                <Typography noWrap variant='body2' sx={{ ...(!activeCondition && { color: 'text.disabled' }) }}>
                  {lastMessage ? lastMessage.message : null}
                </Typography>
              }
            />

            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                flexDirection: 'column',
                justifyContent: 'flex-start'
              }}
            >
              <Typography
                sx={{
                  whiteSpace: 'nowrap',
                  color: activeCondition ? 'common.white' : 'text.disabled',
                  fontSize: '0.75rem'
                }}
              >
                {lastMessage && lastMessage.time && !Number.isNaN(new Date(lastMessage.time as string).getTime())
                  ? formatDateToMonthShort(lastMessage.time as string, true)
                  : ''}
              </Typography>
              {chat.chat.unseenMsgs && chat.chat.unseenMsgs > 0 ? (
                <Chip
                  color='error'
                  label={chat.chat.unseenMsgs}
                  sx={{
                    mt: 0.5,
                    height: 18,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    '& .MuiChip-label': { pt: 0.25, px: 1.655 }
                  }}
                />
              ) : null}
            </Box>
          </ListItemButton>
        </ListItem>
      )
    })
  }

  return (
    <div>
      <Drawer
        open={leftSidebarOpen}
        onClose={handleLeftSidebarToggle}
        variant={mdAbove ? 'permanent' : 'temporary'}
        ModalProps={{ disablePortal: true, keepMounted: true }}
        sx={{
          zIndex: 7,
          height: '100%',
          display: 'block',
          position: mdAbove ? 'static' : 'absolute',
          '& .MuiDrawer-paper': {
            boxShadow: 'none',
            overflow: 'hidden',
            width: sidebarWidth,
            position: mdAbove ? 'static' : 'absolute',
            borderTopLeftRadius: theme => theme.shape.borderRadius,
            borderBottomLeftRadius: theme => theme.shape.borderRadius
          },
          '& > .MuiBackdrop-root': {
            borderRadius: 1,
            position: 'absolute',
            zIndex: theme => theme.zIndex.drawer - 1
          }
        }}
      >
        {view === 'create-group' ? (
          <CreateGroupDrawer
            contacts={store?.contacts ?? null}
            onCancel={handleCancelCreateGroup}
            onCreate={handleCreateGroup}
          />
        ) : (
          <>
            {/* Header: avatar + title + compose icon */}
            <Box
              sx={{
                px: 4,
                py: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: theme => `1px solid ${theme.palette.divider}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {store?.userProfile ? (
                  <Badge
                    overlap='circular'
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    onClick={handleUserProfileLeftSidebarToggle}
                    badgeContent={
                      <Box
                        component='span'
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          color: `${statusObj[userStatus]}.main`,
                          backgroundColor: `${statusObj[userStatus]}.main`,
                          boxShadow: theme => `0 0 0 2px ${theme.palette.background.paper}`
                        }}
                      />
                    }
                  >
                    <MuiAvatar
                      src={store.userProfile.avatar}
                      alt={store.userProfile.fullName}
                      sx={{ width: 36, height: 36, cursor: 'pointer' }}
                    />
                  </Badge>
                ) : null}
                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                  Chats
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                  onClick={handleComposeOpen}
                  sx={{
                    color: 'customColors.OnSurfaceVariant',
                    '&:hover': { backgroundColor: 'primary.main', color: 'common.white' }
                  }}
                  title='New chat'
                >
                  <Icon icon='mdi:square-edit-outline' fontSize='1.25rem' />
                </IconButton>
                {!mdAbove ? (
                  <IconButton onClick={handleLeftSidebarToggle}>
                    <Icon icon='mdi:close' fontSize='1.375rem' />
                  </IconButton>
                ) : null}
              </Box>
            </Box>

            {/* Search */}
            <Box sx={{ px: 4, pt: 3, pb: 2 }}>
              <TextField
                fullWidth
                size='small'
                value={query}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                placeholder='Search'
                sx={{ '& .MuiInputBase-root': { borderRadius: 5 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Icon icon='mdi:magnify' fontSize='1.125rem' />
                    </InputAdornment>
                  )
                }}
              />
            </Box>

            {/* Filter pills */}
            <Box
              role='group'
              aria-label='Filter chats'
              sx={{
                px: 4,
                pb: 3,
                display: 'flex',
                gap: 1.5,
                overflowX: 'auto',
                '&::-webkit-scrollbar': { display: 'none' },
                scrollbarWidth: 'none'
              }}
            >
              {FILTER_TABS.map(tab => (
                <FilterChip
                  key={tab.value}
                  label={tab.label}
                  active={activeFilter === tab.value}
                  onClick={() => handleFilterChange(tab.value)}
                />
              ))}
            </Box>

            {/* Chat list */}
            <Box sx={{ height: 'calc(100% - 13.5rem)' }}>
              <ScrollWrapper hidden={hidden}>
                <Box sx={{ p: theme => theme.spacing(1, 2, 3) }}>
                  <List sx={{ p: 0 }}>{renderChats()}</List>
                </Box>
              </ScrollWrapper>
            </Box>
          </>
        )}
      </Drawer>

      {/* Compose popover */}
      <ComposePopover
        open={Boolean(composeAnchorEl)}
        anchorEl={composeAnchorEl}
        onClose={handleComposeClose}
        contacts={store?.contacts ?? null}
        chats={store?.chats ?? null}
        onNewGroup={handleOpenCreateGroup}
        onSelectContact={(id: ChatEntityId) => handleChatClick('contact', id)}
      />

      <UserProfileLeft
        store={store}
        hidden={hidden}
        statusObj={statusObj}
        userStatus={userStatus}
        sidebarWidth={sidebarWidth}
        setUserStatus={setUserStatus}
        userProfileLeftOpen={userProfileLeftOpen}
        handleUserProfileLeftSidebarToggle={handleUserProfileLeftSidebarToggle}
      />
    </div>
  )
}

export default SidebarLeft
