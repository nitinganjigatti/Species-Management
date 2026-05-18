'use client'

// ** React Imports
import { useRef, useEffect, useCallback, Ref, ReactNode, MouseEvent } from 'react'

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
import MessageBubble from 'src/views/apps/chat/MessageBubble'
import MessageActions from 'src/views/apps/chat/MessageActions'

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
  const { data, hidden, searchQuery = '', searchResultIds = [], activeMatchIndex = 0 } = props

  // ** Ref
  const chatArea = useRef(null)
  const messageRefs = useRef<Map<string, HTMLElement>>(new Map())

  const setMessageRef = useCallback((msgId: string | undefined, el: HTMLElement | null) => {
    if (!msgId) return
    if (el) {
      messageRefs.current.set(msgId, el)
    } else {
      messageRefs.current.delete(msgId)
    }
  }, [])

  // Scroll to the active search match
  useEffect(() => {
    if (!searchResultIds.length) return
    const targetId = searchResultIds[activeMatchIndex]
    if (!targetId) return

    const el = messageRefs.current.get(targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeMatchIndex, searchResultIds])

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
        // Forward the id so future bubble-level actions (react, edit, delete,
        // pin, star, reply) have a stable target.
        id: msg.id,
        time: msg.time,
        msg: msg.message,
        feedback: msg.feedback,
        ...(msg.attachments?.length ? { attachments: msg.attachments } : {}),
        ...(msg.contentType ? { contentType: msg.contentType } : {}),
        // Interaction state — forwarded so the bubble renderer can decorate
        // without going back to Redux per message. Phase 0 only carries them;
        // no UI change yet.
        ...(msg.replyTo ? { replyTo: msg.replyTo } : {}),
        ...(msg.reactions?.length ? { reactions: msg.reactions } : {}),
        ...(msg.isPinned ? { isPinned: true } : {}),
        ...(msg.isStarred ? { isStarred: true } : {}),
        ...(msg.isEdited ? { isEdited: true } : {}),
        ...(msg.editedAt ? { editedAt: msg.editedAt } : {}),
        ...(msg.isDeletedForEveryone ? { isDeletedForEveryone: true } : {})
      }
      if (msg.contentType === 'system') {
        if (msgGroup.messages.length) formattedChatLog.push(msgGroup)
        formattedChatLog.push({ senderId: 'system', messages: [entry] })
        msgGroup = { senderId: chatMessageSenderId, messages: [] }
      } else if (chatMessageSenderId === msg.senderId) {
        msgGroup.messages.push(entry)
      } else {
        chatMessageSenderId = msg.senderId

        formattedChatLog.push(msgGroup)
        msgGroup = {
          senderId: msg.senderId,
          messages: [entry]
        }
      }

      if (index === chatLog.length - 1 && msgGroup.messages.length) {
        formattedChatLog.push(msgGroup)
      }
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

  // Build a Set of matching IDs for O(1) lookup during render
  const searchResultSet = new Set(searchResultIds)
  const activeResultId = searchResultIds[activeMatchIndex] ?? null

  // ** Renders user chat
  const renderChats = () => {
    return formattedChatData().map((item: FormattedChatsType, index: number) => {
      const isSystemGroup = item.senderId === 'system'

      // System messages — centered, small bubble (WhatsApp style)
      if (isSystemGroup) {
        return item.messages.map((chat, msgIdx) => (
          <Box
            key={`sys-${index}-${msgIdx}`}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 4
            }}
          >
            <Typography
              variant='caption'
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                backgroundColor: theme => theme.palette.action.hover,
                color: 'text.secondary',
                maxWidth: '75%',
                textAlign: 'center'
              }}
            >
              {chat.msg}
            </Typography>
          </Box>
        ))
      }

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
              color={(isSender ? undefined : data.contact.avatarColor) ?? 'primary'}
              sx={{
                width: '2rem',
                height: '2rem',
                fontSize: '0.875rem',
                ml: isSender ? 4 : undefined,
                mr: !isSender ? 4 : undefined
              }}
              {...(isSender
                ? data.userContact.avatar
                  ? { src: data.userContact.avatar, alt: data.userContact.fullName }
                  : {}
                : data.contact.avatar
                ? { src: data.contact.avatar, alt: data.contact.fullName }
                : {})}
            >
              {getInitials(isSender ? data.userContact.fullName ?? 'Me' : data.contact.fullName)}
            </CustomAvatar>
          </div>

          <Box className='chat-body' sx={{ maxWidth: ['calc(100% - 5.75rem)', '75%', '65%'] }}>
            {item.messages.map((chat: ChatLogChatType, index: number, { length }: { length: number }) => {
              const time = new Date(chat.time)
              const isMatch = chat.id ? searchResultSet.has(chat.id) : false
              const isActiveMatch = isMatch && chat.id === activeResultId

              return (
                <Box
                  key={index}
                  ref={(el: HTMLElement | null) => setMessageRef(chat.id, el)}
                  sx={{ '&:not(:last-of-type)': { mb: 3.5 } }}
                >
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
                    {/* Attachment-only messages get a MessageActions sibling so
                        delete/star/pin/react work on audio / video / document / image
                        the same as on text bubbles. Mixed (text + attachments) messages
                        keep their actions inside MessageBubble below — one menu per
                        message, not per attachment. */}
                    {chat.attachments?.length && !chat.msg && !chat.isDeletedForEveryone ? (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: isSender ? 'row-reverse' : 'row',
                          alignItems: 'flex-start',
                          gap: 1,
                          '&:hover .msg-actions': {
                            opacity: '1 !important',
                            pointerEvents: 'auto !important'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: '100%' }}>
                          {chat.attachments.map(att => (
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
                                <Box sx={{ p: 2, minWidth: 300 }}>
                                  <Box
                                    component='audio'
                                    src={att.url}
                                    controls
                                    controlsList='nodownload noplaybackrate'
                                    onContextMenu={(e: MouseEvent) => e.preventDefault()}
                                    sx={{
                                      display: 'block',
                                      width: 280,
                                      maxWidth: '100%',
                                      borderRadius: 1,
                                      bgcolor: isSender ? 'rgba(255,255,255,0.9)' : 'transparent'
                                    }}
                                  />
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
                                        <Typography variant='caption' sx={{ color: 'inherit' }} noWrap>
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
                        </Box>
                        <MessageActions
                          chat={chat}
                          isSender={isSender}
                          senderName={isSender ? data.userContact.fullName : data.contact.fullName}
                          senderId={item.senderId}
                          canPin={(() => {
                            const isGroup = data.contact.isGroup === true
                            if (!isGroup) return true
                            const me = String(data.userContact.id ?? '')
                            const admins = data.contact.adminIds?.map(String) ?? []

                            return admins.includes(me)
                          })()}
                          showEdit={false}
                          showCopyText={false}
                        />
                      </Box>
                    ) : null}
                    {/* Mixed (attachments + text) and text-only paths: existing inline
                        attachments map below + MessageBubble. Skipped when attachment-only. */}
                    {chat.attachments?.length && (chat.msg || chat.isDeletedForEveryone)
                      ? chat.attachments.map(att => (
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
                            {/* TEMP DIAG — remove once audio render is verified. Logs every
                            attachment so we can see the actual type/url/mimeType the server
                            returned. Filter console by `[chat:att]`. */}
                            {(() => {
                              console.log('[chat:att]', {
                                id: att.id,
                                type: att.type,
                                mimeType: att.mimeType,
                                url: att.url,
                                filename: att.filename,
                                size: att.size
                              })

                              return null
                            })()}
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
                              <Box sx={{ p: 2, minWidth: 300 }}>
                                <Box
                                  component='audio'
                                  src={att.url}
                                  controls
                                  controlsList='nodownload noplaybackrate'
                                  onContextMenu={(e: MouseEvent) => e.preventDefault()}
                                  sx={{
                                    display: 'block',
                                    width: 280,
                                    maxWidth: '100%',
                                    // Light tint on green sender bubbles so the
                                    // browser's default-dark audio controls read.
                                    borderRadius: 1,
                                    bgcolor: isSender ? 'rgba(255,255,255,0.9)' : 'transparent'
                                  }}
                                />
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
                        ))
                      : null}
                    {chat.msg || chat.isDeletedForEveryone ? (
                      <Box sx={{ ml: isSender ? 'auto' : undefined, width: 'fit-content', maxWidth: '100%' }}>
                        <MessageBubble
                          chat={chat}
                          isSender={isSender}
                          senderName={isSender ? data.userContact.fullName : data.contact.fullName}
                          senderId={item.senderId}
                          canPin={(() => {
                            // DM: both participants can pin any message (their
                            // own or received). Group: still admin-only.
                            const isGroup = data.contact.isGroup === true
                            if (!isGroup) return true
                            const me = String(data.userContact.id ?? '')
                            const admins = data.contact.adminIds?.map(String) ?? []

                            return admins.includes(me)
                          })()}
                          isSearchMatch={isMatch}
                          isActiveSearchMatch={isActiveMatch}
                          searchQuery={searchQuery}
                        />
                      </Box>
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
