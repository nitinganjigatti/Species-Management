'use client'

// ** React Imports
import { useState, useEffect, ChangeEvent } from 'react'

// ** Chat SDK
import { getChatClientOrNull } from 'src/lib/chat/client'
import { searchUsers, sdkUserToContact } from 'src/lib/chat/api'

// ** MUI Imports
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import Button from '@mui/material/Button'
import MuiAvatar from '@mui/material/Avatar'
import Checkbox from '@mui/material/Checkbox'
import ListItem from '@mui/material/ListItem'
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
import AvatarUpload from 'src/views/forms/form-elements/file-uploader/AvatarUpload'

// ** Utils
import { getInitials } from 'src/@core/utils/get-initials'

// ** Types
import type { ContactType, ChatEntityId, CreateGroupPayload } from 'src/types/apps/chatTypes'

interface CreateGroupDrawerProps {
  contacts: ContactType[] | null
  onCancel: () => void
  onCreate: (payload: CreateGroupPayload) => void
}

const CreateGroupDrawer = ({ contacts, onCancel, onCreate }: CreateGroupDrawerProps) => {
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [memberQuery, setMemberQuery] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<ChatEntityId>>(new Set())
  const [filteredContacts, setFilteredContacts] = useState<ContactType[]>([])
  const [searching, setSearching] = useState<boolean>(false)

  // Backend-driven member picker: same pattern as the compose popover and the
  // group "Add members" flow. Empty query lists everyone, typing refines via
  // `users.list({ query })` (debounced 300ms). Falls back to filtering the
  // prop-supplied contacts list when the SDK isn't ready.
  useEffect(() => {
    const client = getChatClientOrNull()
    const q = memberQuery.trim()

    if (!client) {
      const list = (contacts ?? []).filter(c =>
        q.length ? c.fullName.toLowerCase().includes(q.toLowerCase()) : true
      )
      setFilteredContacts(list)

      return
    }

    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const users = await searchUsers(q)
        setFilteredContacts(users.map(sdkUserToContact))
      } catch (err) {
        console.error('[chat] searchUsers (create group) failed:', err)
        setFilteredContacts([])
      } finally {
        setSearching(false)
      }
    }, q.length ? 300 : 0)

    return () => clearTimeout(t)
  }, [memberQuery, contacts])

  const toggleMember = (id: ChatEntityId) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)

      return next
    })
  }

  const canCreate = name.trim().length > 0 && selectedIds.size > 0

  const handleCreate = () => {
    if (!canCreate) return
    onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      icon: iconUrl ?? undefined,
      participantIds: Array.from(selectedIds)
    })
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'background.paper' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          p: theme => theme.spacing(3.5, 4),
          borderBottom: theme => `1px solid ${theme.palette.divider}`
        }}
      >
        <IconButton size='small' onClick={onCancel}>
          <Icon icon='mdi:arrow-left' fontSize='1.375rem' />
        </IconButton>
        <Typography sx={{ fontSize: '1.05rem', fontWeight: 600 }}>New Group</Typography>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 4, py: 5 }}>
        {/* Icon uploader — reuses AvatarUpload from src/views/forms/form-elements/file-uploader */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 5 }}>
          <AvatarUpload
            value={iconUrl ?? undefined}
            onChange={(_file, previewUrl) => setIconUrl(previewUrl)}
            placeholderLabel='Add icon'
          />
        </Box>

        {/* Group name */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant='caption'
            sx={{ display: 'block', mb: 1, fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}
          >
            Group name *
          </Typography>
          <TextField
            fullWidth
            size='small'
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder='e.g. Engineering'
            inputProps={{ maxLength: 50 }}
          />
        </Box>

        {/* Description */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant='caption'
            sx={{ display: 'block', mb: 1, fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}
          >
            Description (optional)
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            size='small'
            value={description}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            placeholder="What's this group about?"
            inputProps={{ maxLength: 200 }}
          />
        </Box>

        {/* Add members */}
        <Box>
          <Typography
            variant='caption'
            sx={{ display: 'block', mb: 1, fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}
          >
            Add members
          </Typography>
          <TextField
            fullWidth
            size='small'
            value={memberQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setMemberQuery(e.target.value)}
            placeholder='Search contacts'
            sx={{ mb: 2, '& .MuiInputBase-root': { borderRadius: 5 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Icon icon='mdi:magnify' fontSize='1.125rem' />
                </InputAdornment>
              )
            }}
          />

          <Box
            sx={{
              maxHeight: 240,
              overflowY: 'auto',
              border: theme => `1px solid ${theme.palette.divider}`,
              borderRadius: 2
            }}
          >
            {searching && filteredContacts.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>Searching…</Typography>
              </Box>
            ) : filteredContacts.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                  {memberQuery.trim() ? 'No people found' : 'No users available'}
                </Typography>
              </Box>
            ) : (
              <List dense sx={{ p: 0 }}>
                {filteredContacts.map(contact => {
                  const isSelected = selectedIds.has(contact.id)

                  return (
                    <ListItem key={contact.id} disablePadding>
                      <ListItemButton
                        onClick={() => toggleMember(contact.id)}
                        sx={{
                          px: 3,
                          py: 1.5,
                          ...(isSelected && {
                            backgroundColor: 'primary.main',
                            color: 'common.white',
                            '&:hover': { backgroundColor: 'primary.dark' }
                          })
                        }}
                      >
                        <Checkbox
                          edge='start'
                          size='small'
                          checked={isSelected}
                          tabIndex={-1}
                          disableRipple
                          sx={{
                            mr: 1,
                            p: 0.5,
                            ...(isSelected && {
                              color: 'common.white',
                              '&.Mui-checked': { color: 'common.white' }
                            })
                          }}
                        />
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
                        <ListItemText
                          primary={
                            <Typography sx={{ fontSize: '0.875rem', ...(isSelected && { color: 'common.white' }) }}>
                              {contact.fullName}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  )
                })}
              </List>
            )}
          </Box>

          <Typography sx={{ mt: 2, fontSize: '0.8125rem', color: 'customColors.OnSurfaceVariant' }}>
            <Box component='span' sx={{ color: 'primary.dark', fontWeight: 600 }}>
              {selectedIds.size}
            </Box>{' '}
            {selectedIds.size === 1 ? 'member' : 'members'} selected
          </Typography>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          p: theme => theme.spacing(3, 4),
          borderTop: theme => `1px solid ${theme.palette.divider}`
        }}
      >
        <Button variant='outlined' color='inherit' fullWidth onClick={onCancel}>
          Cancel
        </Button>
        <Button variant='contained' fullWidth disabled={!canCreate} onClick={handleCreate}>
          Create Group
        </Button>
      </Box>
    </Box>
  )
}

export default CreateGroupDrawer
