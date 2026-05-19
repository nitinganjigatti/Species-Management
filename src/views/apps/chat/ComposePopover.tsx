'use client'

// ** React Imports
import { useState, useMemo, useEffect, ChangeEvent } from 'react'

// ** Chat SDK
import { getChatClientOrNull } from 'src/lib/chat/client'
import { searchUsers, sdkUserToContact } from 'src/lib/chat/api'

// ** MUI Imports
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import Popover from '@mui/material/Popover'
import ListItem from '@mui/material/ListItem'
import MuiAvatar from '@mui/material/Avatar'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ListItemText from '@mui/material/ListItemText'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemButton from '@mui/material/ListItemButton'
import InputAdornment from '@mui/material/InputAdornment'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components Import
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** Utils
import { getInitials } from 'src/@core/utils/get-initials'

// ** Types
import type { ContactType, ChatsArrType, ChatEntityId } from 'src/types/apps/chatTypes'

interface ComposePopoverProps {
  open: boolean
  anchorEl: HTMLElement | null
  onClose: () => void
  contacts: ContactType[] | null
  chats: ChatsArrType[] | null
  onNewGroup: () => void
  onSelectContact: (id: ChatEntityId) => void
}

const ComposePopover = ({
  open,
  anchorEl,
  onClose,
  contacts,
  chats,
  onNewGroup,
  onSelectContact
}: ComposePopoverProps) => {
  const [query, setQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<ContactType[]>([])
  const [searching, setSearching] = useState<boolean>(false)

  // Frequently contacted = contacts who appear in existing chats (excluding groups)
  const frequentlyContacted = useMemo<ContactType[]>(() => {
    if (!contacts || !chats) return []
    const chatContactIds = new Set(chats.filter(c => !c.isGroup).map(c => c.id))

    return contacts.filter(c => chatContactIds.has(c.id)).slice(0, 4)
  }, [contacts, chats])

  // SDK user lookup via `users.list({ query })`. Empty query returns everyone,
  // so we use that for the default list when the popover opens, and re-query
  // (debounced) as the user types. Falls back to filtering the local mock contacts list
  // when the SDK isn't ready (dev / pre-auth).
  useEffect(() => {
    if (!open) return

    const q = query.trim()
    const client = getChatClientOrNull()

    // No SDK → fall back to local contact filter (or full list if no query).
    if (!client) {
      const local = q.length
        ? (contacts ?? []).filter(c => c.fullName.toLowerCase().includes(q.toLowerCase()))
        : contacts ?? []
      setSearchResults(local)

      return
    }

    setSearching(true)
    const t = setTimeout(
      async () => {
        try {
          const users = await searchUsers(q)
          setSearchResults(users.map(sdkUserToContact))
        } catch (err) {
          console.error('[chat] searchUsers failed:', err)
          setSearchResults([])
        } finally {
          setSearching(false)
        }
      },
      q.length ? 300 : 0
    )

    return () => clearTimeout(t)
  }, [open, query, contacts])

  const handleContactClick = (id: ChatEntityId) => {
    onSelectContact(id)
    onClose()
    setQuery('')
  }

  const handleClose = () => {
    setQuery('')
    onClose()
  }

  const handleNewGroup = () => {
    onNewGroup()
    handleClose()
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: {
            mt: 1,
            width: 380,
            maxHeight: 600,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            boxShadow: theme => `0 12px 32px -8px ${theme.palette.primary.main}26, 0 4px 16px -2px rgba(0,0,0,0.10)`,
            overflow: 'hidden'
          }
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: theme => theme.spacing(3, 4),
          borderBottom: theme => `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>New chat</Typography>
        <IconButton size='small' onClick={handleClose}>
          <Icon icon='mdi:close' fontSize='1.125rem' />
        </IconButton>
      </Box>

      {/* Search */}
      <Box sx={{ p: theme => theme.spacing(3, 4, 2) }}>
        <TextField
          fullWidth
          size='small'
          autoFocus
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          placeholder='Search name or number'
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

      {/* New group CTA — contained-primary button style */}
      <ListItemButton
        onClick={handleNewGroup}
        sx={{
          mx: 3,
          mb: 2,
          borderRadius: 1,
          backgroundColor: 'primary.main',
          color: 'common.white',
          '&:hover': { backgroundColor: 'primary.dark' }
        }}
      >
        <Box
          className='icon-wrap'
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: 'common.white',
            color: 'primary.main',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 3.5
          }}
        >
          <Icon icon='mdi:account-group' fontSize='1.125rem' />
        </Box>
        <ListItemText
          primary={
            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'common.white' }}>New group</Typography>
          }
        />
      </ListItemButton>

      {/* Scrollable section */}
      <Box sx={{ flex: 1, overflowY: 'auto', pb: 2 }}>
        {!query.trim() && frequentlyContacted.length > 0 ? (
          <>
            <Typography
              variant='caption'
              sx={{
                display: 'block',
                px: 4,
                pt: 2,
                pb: 1,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'text.secondary'
              }}
            >
              Frequently contacted
            </Typography>
            <List dense sx={{ p: 0 }}>
              {frequentlyContacted.map(contact => (
                <ListItem key={`freq-${contact.id}`} disablePadding>
                  <ListItemButton onClick={() => handleContactClick(contact.id)} sx={{ px: 4, py: 1.5 }}>
                    <ListItemAvatar sx={{ minWidth: 46 }}>
                      {contact.avatar ? (
                        <MuiAvatar src={contact.avatar} alt={contact.fullName} sx={{ width: 34, height: 34 }} />
                      ) : (
                        <CustomAvatar
                          skin='light'
                          color={contact.avatarColor}
                          sx={{ width: 34, height: 34, fontSize: '0.8rem' }}
                        >
                          {getInitials(contact.fullName)}
                        </CustomAvatar>
                      )}
                    </ListItemAvatar>
                    <ListItemText primary={<Typography sx={{ fontSize: '0.875rem' }}>{contact.fullName}</Typography>} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        ) : null}

        {/* User list — default-browse on open, debounced-search on input.
            Section header reflects which mode we're in. */}
        <Typography
          variant='caption'
          sx={{
            display: 'block',
            px: 4,
            pt: 2,
            pb: 1,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'text.secondary'
          }}
        >
          {searching ? 'Searching…' : query.trim().length ? 'Results' : 'People'}
        </Typography>

        {!searching && searchResults.length === 0 ? (
          <Box sx={{ px: 4, py: 3 }}>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              {query.trim().length ? 'No people found' : 'No users available'}
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ p: 0 }}>
            {searchResults.map(contact => (
              <ListItem key={`search-${contact.id}`} disablePadding>
                <ListItemButton onClick={() => handleContactClick(contact.id)} sx={{ px: 4, py: 1.25 }}>
                  <ListItemAvatar sx={{ minWidth: 46 }}>
                    {contact.avatar ? (
                      <MuiAvatar src={contact.avatar} alt={contact.fullName} sx={{ width: 34, height: 34 }} />
                    ) : (
                      <CustomAvatar
                        skin='light'
                        color={contact.avatarColor}
                        sx={{ width: 34, height: 34, fontSize: '0.8rem' }}
                      >
                        {getInitials(contact.fullName)}
                      </CustomAvatar>
                    )}
                  </ListItemAvatar>
                  <ListItemText primary={<Typography sx={{ fontSize: '0.875rem' }}>{contact.fullName}</Typography>} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Popover>
  )
}

export default ComposePopover
