'use client'

import { ChangeEvent, useEffect, useState } from 'react'

// ** Redux Imports
import { useDispatch } from 'react-redux'
import type { AppDispatch } from 'src/store'
import { addParticipantsToGroup } from 'src/store/apps/chat'

// ** MUI Imports
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import MuiAvatar from '@mui/material/Avatar'
import ListItem from '@mui/material/ListItem'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'
import InputAdornment from '@mui/material/InputAdornment'

// ** Icon
import Icon from 'src/@core/components/icon'

// ** Custom Components
import CustomAvatar from 'src/@core/components/mui/avatar'
import Sidebar from 'src/@core/components/sidebar'

// ** Chat API
import { searchUsers, sdkUserToContact } from 'src/lib/chat/api'
import { getChatClientOrNull } from 'src/lib/chat/client'

// ** Types
import type { ChatEntityId, ContactType } from 'src/types/apps/chatTypes'

// ** Utils
import { getInitials } from 'src/@core/utils/get-initials'

interface AddMembersDrawerProps {
  open: boolean
  onClose: () => void
  groupId: string | null
  /** userIds already in the group — excluded from the picker so the
   *  user can't re-add an existing participant. */
  existingParticipantIds: ChatEntityId[]
  /** Current user id, also excluded from the picker. */
  currentUserId: string | number
  /** Optional callback fired after a successful add. The drawer auto-
   *  closes either way; this is for any extra parent-side reaction. */
  onAdded?: () => void
  /** Drawer width — defaults to the same `sidebarWidth` the chat shell
   *  uses for UserProfileRight so the panels feel consistent. */
  width?: number
}

/**
 * Standalone "Add members" right-side drawer. Mirrors the panel inside
 * UserProfileRight 1:1 in visuals and SDK calls, but is fully self-
 * contained — owns its own state, fetches its own contact list, and
 * dispatches `addParticipantsToGroup` directly. Used by the group-
 * created card's "Add members" button so the user lands on this view
 * with one click instead of going through Group info first.
 */
const AddMembersDrawer = ({
  open,
  onClose,
  groupId,
  existingParticipantIds,
  currentUserId,
  onAdded,
  width = 370
}: AddMembersDrawerProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const [query, setQuery] = useState<string>('')
  const [selected, setSelected] = useState<Set<ChatEntityId>>(new Set())
  const [addAsAdmin, setAddAsAdmin] = useState<boolean>(false)
  const [searching, setSearching] = useState<boolean>(false)
  const [contacts, setContacts] = useState<ContactType[]>([])

  // Reset local state whenever the drawer opens or the target group
  // changes — guarantees a fresh session each time the user opens it.
  useEffect(() => {
    if (!open) return
    setQuery('')
    setSelected(new Set())
    setAddAsAdmin(false)
    setContacts([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, groupId])

  // Debounced search for addable users while the drawer is open. Empty
  // query returns the full directory; typing refines. Excludes anyone
  // already in the group plus the current user.
  useEffect(() => {
    if (!open) return
    const client = getChatClientOrNull()
    if (!client) {
      setContacts([])

      return
    }
    const q = query.trim()
    setSearching(true)
    const t = setTimeout(
      async () => {
        try {
          const users = await searchUsers(q)
          const existing = new Set(existingParticipantIds.map(String))
          const filtered = users
            .filter(u => !existing.has(u.id))
            .filter(u => u.id !== String(currentUserId))
            .map(sdkUserToContact)
          setContacts(filtered)
        } catch (err) {
          console.error('[AddMembersDrawer] searchUsers failed:', err)
          setContacts([])
        } finally {
          setSearching(false)
        }
      },
      q.length ? 300 : 0
    )

    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query, existingParticipantIds, currentUserId])

  const toggleSelect = (id: ChatEntityId) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)

      return next
    })
  }

  const handleAdd = () => {
    if (!groupId || selected.size === 0) return
    dispatch(
      addParticipantsToGroup({
        groupId,
        userIds: Array.from(selected),
        ...(addAsAdmin ? { role: 'admin' as const } : {})
      })
    )
    onAdded?.()
    onClose()
  }

  return (
    <Sidebar
      direction='right'
      show={open}
      backDropClick={onClose}
      sx={{
        zIndex: 9,
        height: '100%',
        width,
        borderTopRightRadius: theme => theme.shape.borderRadius,
        borderBottomRightRadius: theme => theme.shape.borderRadius,
        '& + .MuiBackdrop-root': {
          zIndex: 8,
          borderRadius: 1
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'background.paper' }}>
        {/* Header */}
        <Box
          sx={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            px: 3,
            py: 3.5,
            borderBottom: theme => `1px solid ${theme.palette.divider}`,
            gap: 2
          }}
        >
          <IconButton size='small' onClick={onClose} sx={{ color: 'text.secondary' }}>
            <Icon icon='mdi:arrow-left' fontSize='1.25rem' />
          </IconButton>
          <Typography sx={{ flex: 1, fontWeight: 600, fontSize: '1rem' }}>Add members</Typography>
          {selected.size > 0 && (
            <Box
              sx={{
                px: 1.5,
                py: 0.25,
                borderRadius: 10,
                backgroundColor: 'customColors.Surface',
                border: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`
              }}
            >
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'primary.dark' }}>
                {selected.size} added
              </Typography>
            </Box>
          )}
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ px: 4, pt: 3, pb: 2 }}>
            <TextField
              fullWidth
              size='small'
              autoFocus
              value={query}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              placeholder='Search people'
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Icon icon='mdi:magnify' fontSize='1.125rem' />
                    </InputAdornment>
                  )
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 6,
                  '& fieldset': {
                    borderColor: 'secondary.main',
                    borderWidth: '0.5px',
                    transition: 'border-color 160ms ease-out, border-width 160ms ease-out'
                  },
                  '&:hover fieldset': { borderColor: 'secondary.main', borderWidth: '2px' },
                  '&.Mui-focused fieldset': { borderColor: 'secondary.main', borderWidth: '2px' }
                }
              }}
            />
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {searching && contacts.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                  Searching…
                </Typography>
              </Box>
            ) : contacts.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                  {query.trim() ? 'No people found' : 'No more users to add'}
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {contacts.map((c, index) => {
                  const isSelected = selected.has(c.id)

                  return (
                    <Box key={c.id}>
                      <ListItem disablePadding>
                        <ListItemButton
                          onClick={() => toggleSelect(c.id)}
                          sx={{ px: 4, py: 1.5, gap: 3, '&:hover': { backgroundColor: 'customColors.Surface' } }}
                        >
                          <Box sx={{ position: 'relative', flexShrink: 0 }}>
                            {c.avatar ? (
                              <MuiAvatar src={c.avatar} alt={c.fullName} sx={{ width: 42, height: 42 }} />
                            ) : (
                              <CustomAvatar
                                skin='light'
                                color={c.avatarColor}
                                sx={{ width: 42, height: 42, fontSize: '0.875rem' }}
                              >
                                {getInitials(c.fullName)}
                              </CustomAvatar>
                            )}
                            {isSelected && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  inset: 0,
                                  borderRadius: '50%',
                                  backgroundColor: 'primary.main',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Icon icon='mdi:check' fontSize='1.125rem' color='white' />
                              </Box>
                            )}
                          </Box>
                          <ListItemText
                            primary={
                              <Typography
                                variant='body2'
                                sx={{ fontWeight: isSelected ? 600 : 400, color: 'customColors.OnSurfaceVariant' }}
                              >
                                {c.fullName}
                              </Typography>
                            }
                          />
                          {isSelected && <Icon icon='mdi:check-circle' fontSize='1.25rem' color='primary.main' />}
                        </ListItemButton>
                      </ListItem>
                      {index < contacts.length - 1 && (
                        <Divider sx={{ ml: '76px', borderColor: 'customColors.OnBackground' }} />
                      )}
                    </Box>
                  )
                })}
              </List>
            )}
          </Box>
        </Box>

        {/* Add-as-admin toggle — shown only when at least one contact is
            selected, mirroring the existing UserProfileRight panel. */}
        {selected.size > 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              px: 4,
              py: 1.5,
              borderTop: theme => `1px solid ${theme.palette.divider}`
            }}
          >
            <Icon icon='mdi:shield-account-outline' fontSize='1.25rem' color='customColors.Outline' />
            <Typography variant='body2' sx={{ flex: 1, color: 'customColors.OnSurfaceVariant' }}>
              Add as admin
            </Typography>
            <Switch size='small' checked={addAsAdmin} onChange={e => setAddAsAdmin(e.target.checked)} />
          </Box>
        ) : null}

        {/* Footer */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            p: theme => theme.spacing(3, 4),
            borderTop: theme => `1px solid ${theme.palette.divider}`
          }}
        >
          <Button variant='outlined' color='inherit' fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button variant='contained' fullWidth disabled={selected.size === 0} onClick={handleAdd}>
            {selected.size > 0 ? `Add (${selected.size})` : 'Add'}
          </Button>
        </Box>
      </Box>
    </Sidebar>
  )
}

export default AddMembersDrawer
