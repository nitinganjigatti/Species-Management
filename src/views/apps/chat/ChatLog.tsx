'use client'

// ** React Imports
import { useRef, useEffect, Ref, ReactNode } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Components
import PerfectScrollbarComponent, { ScrollBarProps } from 'react-perfect-scrollbar'

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** Utils Imports
import { getInitials } from 'src/@core/utils/get-initials'
import { getAttachmentVisual } from 'src/views/apps/chat/attachmentIcon'

// ** Types Imports
import {
  ChatLogType,
  MessageType,
  MsgFeedbackType,
  ChatLogChatType,
  MessageGroupType,
  FormattedChatsType
} from 'src/types/apps/chatTypes'

const PerfectScrollbar = styled(PerfectScrollbarComponent)<ScrollBarProps & { ref: Ref<unknown> }>(({ theme }) => ({
  padding: theme.spacing(5)
}))

const ChatLog = (props: ChatLogType) => {
  // ** Props
  const { data, hidden } = props

  // ** Ref
  const chatArea = useRef(null)

  // ** Scroll to chat bottom — runs multiple passes so late-loading content
  // (images, embeds) doesn't leave us stuck mid-list. PerfectScrollbar's inner
  // div is `_container`. We also force a re-measure via PerfectScrollbar's
  // `update()` if available.
  const scrollToBottom = () => {
    const doScroll = () => {
      if (!chatArea.current) return
      if (hidden) {
        // @ts-ignore — native overflow div
        chatArea.current.scrollTop = chatArea.current.scrollHeight
      } else {
        // @ts-ignore — PerfectScrollbar exposes the underlying div as `_container`
        const c = chatArea.current._container
        if (c) c.scrollTop = c.scrollHeight
        // @ts-ignore — let PerfectScrollbar recompute its scrollbar after layout
        chatArea.current.updateScroll?.()
      }
    }

    // 1) immediately after the current frame paints
    requestAnimationFrame(doScroll)

    // 2) next frame — catches PerfectScrollbar's own measure cycle
    requestAnimationFrame(() => requestAnimationFrame(doScroll))

    // 3) after late content (images) settles
    setTimeout(doScroll, 120)
    setTimeout(doScroll, 350)
  }

  // ** Formats chat data based on sender
  const formattedChatData = () => {
    let chatLog: MessageType[] | [] = []
    if (data.chat) {
      chatLog = data.chat.messages
    }

    const formattedChatLog: FormattedChatsType[] = []
    let chatMessageSenderId = chatLog[0] ? chatLog[0].senderId : 11
    let msgGroup: MessageGroupType = {
      senderId: chatMessageSenderId,
      messages: []
    }
    chatLog.forEach((msg: MessageType, index: number) => {
      const entry = {
        time: msg.time,
        msg: msg.message,
        feedback: msg.feedback,
        ...(msg.attachments?.length ? { attachments: msg.attachments } : {})
      }
      if (chatMessageSenderId === msg.senderId) {
        msgGroup.messages.push(entry)
      } else {
        chatMessageSenderId = msg.senderId

        formattedChatLog.push(msgGroup)
        msgGroup = {
          senderId: msg.senderId,
          messages: [entry]
        }
      }

      if (index === chatLog.length - 1) formattedChatLog.push(msgGroup)
    })

    return formattedChatLog
  }

  const renderMsgFeedback = (isSender: boolean, feedback: MsgFeedbackType) => {
    if (isSender) {
      if (feedback.isSent && !feedback.isDelivered) {
        return (
          <Box component='span' sx={{ display: 'inline-flex', '& svg': { mr: 2, color: 'text.secondary' } }}>
            <Icon icon='mdi:check' fontSize='1rem' />
          </Box>
        )
      } else if (feedback.isSent && feedback.isDelivered) {
        return (
          <Box
            component='span'
            sx={{
              display: 'inline-flex',
              '& svg': { mr: 2, color: feedback.isSeen ? 'success.main' : 'text.secondary' }
            }}
          >
            <Icon icon='mdi:check-all' fontSize='1rem' />
          </Box>
        )
      } else {
        return null
      }
    }
  }

  useEffect(() => {
    if (data && data.chat && data.chat.messages.length) {
      scrollToBottom()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // ** Renders user chat
  const renderChats = () => {
    return formattedChatData().map((item: FormattedChatsType, index: number) => {
      const isSender = item.senderId === data.userContact.id

      return (
        <Box
          key={index}
          sx={{
            display: 'flex',
            flexDirection: !isSender ? 'row' : 'row-reverse',
            mb: index !== formattedChatData().length - 1 ? 9.75 : undefined
          }}
        >
          <div>
            <CustomAvatar
              skin='light'
              color={data.contact.avatarColor ? data.contact.avatarColor : undefined}
              sx={{
                width: '2rem',
                height: '2rem',
                fontSize: '0.875rem',
                ml: isSender ? 4 : undefined,
                mr: !isSender ? 4 : undefined
              }}
              {...(data.contact.avatar && !isSender
                ? {
                    src: data.contact.avatar,
                    alt: data.contact.fullName
                  }
                : {})}
              {...(isSender
                ? {
                    src: data.userContact.avatar,
                    alt: data.userContact.fullName
                  }
                : {})}
            >
              {data.contact.avatarColor ? getInitials(data.contact.fullName) : null}
            </CustomAvatar>
          </div>

          <Box className='chat-body' sx={{ maxWidth: ['calc(100% - 5.75rem)', '75%', '65%'] }}>
            {item.messages.map((chat: ChatLogChatType, index: number, { length }: { length: number }) => {
              const time = new Date(chat.time)

              return (
                <Box key={index} sx={{ '&:not(:last-of-type)': { mb: 3.5 } }}>
                  <Box
                    sx={{
                      ml: isSender ? 'auto' : undefined,
                      width: 'fit-content',
                      maxWidth: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1
                    }}
                  >
                    {chat.attachments?.map(att => (
                      <Box
                        key={att.id}
                        sx={{
                          boxShadow: 1,
                          borderRadius: 1,
                          overflow: 'hidden',
                          borderTopLeftRadius: !isSender ? 0 : undefined,
                          borderTopRightRadius: isSender ? 0 : undefined,
                          backgroundColor: isSender ? 'primary.main' : 'background.paper',
                          color: isSender ? 'common.white' : 'text.primary'
                        }}
                      >
                        {att.type === 'image' ? (
                          <Box
                            component='a'
                            href={att.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            sx={{ display: 'block', lineHeight: 0 }}
                          >
                            <Box
                              component='img'
                              src={att.thumbnailUrl ?? att.url}
                              alt={att.filename}
                              loading='lazy'
                              sx={{ maxWidth: 280, maxHeight: 280, display: 'block' }}
                            />
                          </Box>
                        ) : att.type === 'video' ? (
                          <Box
                            component='video'
                            src={att.url}
                            controls
                            sx={{ maxWidth: 280, maxHeight: 280, display: 'block' }}
                          />
                        ) : att.type === 'audio' ? (
                          <Box sx={{ p: 2 }}>
                            <Box component='audio' src={att.url} controls sx={{ width: '100%' }} />
                          </Box>
                        ) : (
                          (() => {
                            const visual = getAttachmentVisual(att.mimeType, att.filename)

                            return (
                              <Box
                                component='a'
                                href={att.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                download={att.filename}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2,
                                  p: theme => theme.spacing(3, 4),
                                  color: 'inherit',
                                  textDecoration: 'none'
                                }}
                              >
                                <Icon
                                  icon={visual.icon}
                                  color={isSender ? '#ffffff' : visual.color}
                                  fontSize='2rem'
                                />
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant='caption' sx={{ display: 'block', color: 'inherit' }} noWrap>
                                    {att.filename}
                                  </Typography>
                                  <Typography variant='caption' sx={{ color: 'inherit', opacity: 0.8 }}>
                                    {(att.size / 1024).toFixed(0)} KB
                                  </Typography>
                                </Box>
                              </Box>
                            )
                          })()
                        )}
                      </Box>
                    ))}
                    {chat.msg ? (
                      <Typography
                        sx={{
                          boxShadow: 1,
                          borderRadius: 1,
                          maxWidth: '100%',
                          width: 'fit-content',
                          fontSize: '0.875rem',
                          wordWrap: 'break-word',
                          p: theme => theme.spacing(3, 4),
                          ml: isSender ? 'auto' : undefined,
                          borderTopLeftRadius: !isSender ? 0 : undefined,
                          borderTopRightRadius: isSender ? 0 : undefined,
                          color: isSender ? 'common.white' : 'text.primary',
                          backgroundColor: isSender ? 'primary.main' : 'background.paper'
                        }}
                      >
                        {chat.msg}
                      </Typography>
                    ) : null}
                  </Box>
                  {index + 1 === length ? (
                    <Box
                      sx={{
                        mt: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isSender ? 'flex-end' : 'flex-start'
                      }}
                    >
                      {renderMsgFeedback(isSender, chat.feedback)}
                      <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                        {time
                          ? new Date(time).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
                          : null}
                      </Typography>
                    </Box>
                  ) : null}
                </Box>
              )
            })}
          </Box>
        </Box>
      )
    })
  }

  const ScrollWrapper = ({ children }: { children: ReactNode }) => {
    if (hidden) {
      return (
        <Box ref={chatArea} sx={{ p: 5, height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
          {children}
        </Box>
      )
    } else {
      return (
        <PerfectScrollbar ref={chatArea} options={{ wheelPropagation: false }}>
          {children}
        </PerfectScrollbar>
      )
    }
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
      <ScrollWrapper>{renderChats()}</ScrollWrapper>
    </Box>
  )
}

export default ChatLog
