'use client'

import { addReactionOverSocket } from 'src/lib/chat/api'
import type { ChatLogChatType } from 'src/types/apps/chatTypes'

type ToggleSingleReactionArgs = {
  chat: ChatLogChatType
  currentUserId: string | number | null
  emoji: string
}

/**
 * Web should mirror mobile behavior: one active reaction per user per
 * message. Re-emitting the same emoji toggles it off; switching emoji first
 * toggles off the old bucket, then adds the new one.
 */
const toggleSingleReaction = async ({ chat, currentUserId, emoji }: ToggleSingleReactionArgs) => {
  if (!chat.id) return

  const myId = currentUserId != null ? String(currentUserId) : null
  const existing = myId ? chat.reactions?.find(reaction => reaction.userIds.includes(myId)) : undefined

  if (existing?.emoji === emoji) {
    await addReactionOverSocket(chat.id, emoji)

    return
  }

  if (existing?.emoji) {
    await addReactionOverSocket(chat.id, existing.emoji)
  }

  await addReactionOverSocket(chat.id, emoji)
}

export default toggleSingleReaction
