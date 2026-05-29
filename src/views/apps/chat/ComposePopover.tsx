'use client'

// ** React Imports
import { useState, useMemo, useEffect, ChangeEvent } from 'react'

// ** Chat SDK
import { getChatClientOrNull } from 'src/lib/chat/client'
import { searchUsers, sdkUserToContact } from 'src/lib/chat/api'

// ** MUI Imports
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import Skeleton from '@mui/material/Skeleton'
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
// First letter of first word + first letter of last word (e.g. "Add User Test" → "AT")
const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  const first = words[0][0] ?? ''
  const last = words.length > 1 ? words[words.length - 1][0] ?? '' : ''

  return (first + last).toUpperCase()
}

const SkeletonListItem = () => (
  <ListItem disablePadding>
    <Box sx={{ px: 4, py: 0.8, width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
      <Skeleton variant='circular' width={34} height={34} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant='text' width='60%' height={20} />
      </Box>
    </Box>
  </ListItem>
)

// ** Types
import type { ContactType, ChatsArrType, ChatEntityId } from 'src/types/apps/chatTypes'

interface ComposePanelProps {
  contacts: ContactType[] | null
  chats: ChatsArrType[] | null
  onClose: () => void
  onNewGroup: () => void
  onSelectContact: (id: ChatEntityId) => void
}

// Reusable compose panel — used by both Popover and Sidebar inline
export const ComposePanel = ({ contacts, chats, onClose, onNewGroup, onSelectContact }: ComposePanelProps) => {
  const [query, setQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<ContactType[]>([])
  const [searching, setSearching] = useState<boolean>(false)

  // Frequently contacted = contacts who appear in existing chats (excluding groups)
  const frequentlyContacted = useMemo<ContactType[]>(() => {
    if (!contacts || !chats) return []
    const chatContactIds = new Set(chats.filter(c => !c.isGroup).map(c => c.id))

    return contacts.filter(c => chatContactIds.has(c.id)).slice(0, 4)
  }, [contacts, chats])

  useEffect(() => {
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
  }, [query, contacts])

  const handleContactClick = (id: ChatEntityId) => {
    onSelectContact(id)
    setQuery('')
  }

  const handleClose = () => {
    setQuery('')
    onClose()
  }

  const handleNewGroup = () => {
    onNewGroup()
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
          placeholder='Search name or staff ID'
          sx={{
            '& .MuiInputBase-root': { borderRadius: 5 },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(76, 78, 100, 0.38)',
                borderWidth: '1px !important',
                transition: 'border-color 160ms ease-out'
              },
              '&:hover fieldset': {
                borderColor: '#00ABAB',
                borderWidth: '1px !important'
              },
              '&.Mui-focused fieldset': {
                borderColor: '#00ABAB',
                borderWidth: '1px !important'
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Icon icon='mdi:magnify' fontSize='1.125rem' />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* New group CTA */}
      <Box
        onClick={handleNewGroup}
        sx={{
          mx: 3,
          mb: 2,
          py: 2.5,
          px: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderRadius: 1,
          backgroundColor: '#1F515B !important',
          color: 'common.white',
          cursor: 'pointer',
          transition: 'background-color 200ms',
          '&:hover': { backgroundColor: '#1a3f47' }
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: theme =>
              `linear-gradient(135deg, ${theme.palette.secondary.light}, ${theme.palette.secondary.main})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Icon icon='mdi:account-group' fontSize='0.875rem' style={{ color: '#fff' }} />
        </Box>
        <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem', color: 'common.white' }}>New group</Typography>
      </Box>

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
                  <ListItemButton onClick={() => handleContactClick(contact.id)} sx={{ px: 4, py: 0.8 }}>
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
                    <ListItemText primary={<Typography sx={{ fontSize: '0.875rem', color: 'customColors.OnPrimaryContainer' }}>{contact.fullName}</Typography>} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        ) : null}

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

        {searching ? (
          <List dense sx={{ p: 0 }}>
            {[...Array(4)].map((_, idx) => (
              <SkeletonListItem key={`skeleton-search-${idx}`} />
            ))}
          </List>
        ) : searchResults.length === 0 ? (
          <Box sx={{ px: 4, py: 3 }}>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              {query.trim().length ? 'No people found' : 'No users available'}
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ p: 0 }}>
            {searchResults.map(contact => (
              <ListItem key={`search-${contact.id}`} disablePadding>
                <ListItemButton onClick={() => handleContactClick(contact.id)} sx={{ px: 4, py: 0.8 }}>
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
                  <ListItemText primary={<Typography sx={{ fontSize: '0.875rem', color: 'customColors.OnPrimaryContainer' }}>{contact.fullName}</Typography>} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  )
}

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
  const handleClose = () => {
    onClose()
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
            borderRadius: 1,
            backgroundColor: 'background.paper',
            boxShadow: theme => `0 12px 32px -8px ${theme.palette.primary.main}26, 0 4px 16px -2px rgba(0,0,0,0.10)`,
            overflow: 'hidden'
          }
        }
      }}
    >
      <ComposePanel
        contacts={contacts}
        chats={chats}
        onClose={handleClose}
        onNewGroup={onNewGroup}
        onSelectContact={onSelectContact}
      />
    </Popover>
  )
}

export default ComposePopover
