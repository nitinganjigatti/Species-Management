'use client'

// ** React Imports
import { Fragment } from 'react'

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
    handleUserProfileRightSidebarToggle
  } = props

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
                    <CustomAvatar
                      skin='light'
                      color='primary'
                      sx={{ width: 40, height: 40, mr: 3.5 }}
                    >
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
                    <IconButton size='small' sx={{ color: 'text.secondary' }}>
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
                          <Typography
                            variant='caption'
                            noWrap
                            sx={{ display: 'block', color: 'text.secondary' }}
                          >
                            {latest.message ||
                              (latest.attachments?.length ? '📎 Attachment' : '')}
                          </Typography>
                        </Box>
                      </Box>
                    )
                  })()}
                  <ChatLog hidden={hidden} data={{ ...selectedChat, userContact: store.userProfile }} />
                </>
              )
            ) : null}

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
