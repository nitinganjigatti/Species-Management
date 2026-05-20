'use client'

import { useState, useEffect, ChangeEvent, useRef } from 'react'

import { getChatClientOrNull } from 'src/lib/chat/client'
import { searchUsers, sdkUserToContact } from 'src/lib/chat/api'

import Box from '@mui/material/Box'
import List from '@mui/material/List'
import Button from '@mui/material/Button'
import MuiAvatar from '@mui/material/Avatar'
import ListItem from '@mui/material/ListItem'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'
import InputAdornment from '@mui/material/InputAdornment'
import Divider from '@mui/material/Divider'

import Icon from 'src/@core/components/icon'
import CustomAvatar from 'src/@core/components/mui/avatar'
import AvatarUpload from 'src/views/forms/form-elements/file-uploader/AvatarUpload'
import { getInitials } from 'src/@core/utils/get-initials'

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
  // Keep the picked File alongside the preview URL so the post-create
  // step can call `client.uploadIcon(newGroupId, file)`. SDK expects an
  // `UploadableFile` shape (uri/name/type/size); we build it here from
  // the File at submit time so the blob URL stays alive through upload.
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [memberQuery, setMemberQuery] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<ChatEntityId>>(new Set())
  const [selectedContacts, setSelectedContacts] = useState<Map<ChatEntityId, ContactType>>(new Map())
  const [filteredContacts, setFilteredContacts] = useState<ContactType[]>([])
  const [searching, setSearching] = useState<boolean>(false)
  const chipsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const client = getChatClientOrNull()
    const q = memberQuery.trim()

    if (!client) {
      const list = (contacts ?? []).filter(c => (q.length ? c.fullName.toLowerCase().includes(q.toLowerCase()) : true))
      setFilteredContacts(list)

      return
    }

    setSearching(true)
    const t = setTimeout(
      async () => {
        try {
          const users = await searchUsers(q)
          setFilteredContacts(users.map(sdkUserToContact))
        } catch (err) {
          console.error('[chat] searchUsers (create group) failed:', err)
          setFilteredContacts([])
        } finally {
          setSearching(false)
        }
      },
      q.length ? 300 : 0
    )

    return () => clearTimeout(t)
  }, [memberQuery, contacts])

  const toggleMember = (contact: ContactType) => {
    const id = contact.id
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
    setSelectedContacts(prev => {
      const next = new Map(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.set(id, contact)
      }

      return next
    })
  }

  const canCreate = name.trim().length > 0 && selectedIds.size > 0

  const handleCreate = () => {
    if (!canCreate) return
    // Build the SDK's `UploadableFile` shape from the picked File so the
    // thunk can call `client.uploadIcon(newGroupId, iconFile)` after the
    // group is created. Without `name` the presigned-url request returns
    // 400; mirrors the wrap we do in UserProfileRight for edit-icon.
    const iconUploadable = iconFile
      ? {
          uri: URL.createObjectURL(iconFile),
          name: iconFile.name,
          type: iconFile.type,
          size: iconFile.size
        }
      : undefined
    onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      icon: iconUrl ?? undefined,
      iconFile: iconUploadable,
      participantIds: Array.from(selectedIds)
    })
  }

  const selectedList = Array.from(selectedContacts.values())

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'background.paper' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 3,
          py: 3.5,
          borderBottom: theme => `1px solid ${theme.palette.divider}`,
          gap: 2
        }}
      >
        <IconButton size='small' onClick={onCancel} sx={{ color: 'text.secondary' }}>
          <Icon icon='mdi:arrow-left' fontSize='1.25rem' />
        </IconButton>
        <Typography sx={{ flex: 1, fontWeight: 600, fontSize: '1rem' }}>New Group</Typography>
        {selectedIds.size > 0 && (
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
              {selectedIds.size} added
            </Typography>
          </Box>
        )}
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Group identity block */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            pt: 3,
            pb: 2,
            px: 4,
            gap: 3
          }}
        >
          <AvatarUpload
            value={iconUrl ?? undefined}
            onChange={(file, previewUrl) => {
              setIconUrl(previewUrl)
              setIconFile(file)
            }}
            placeholderLabel='Add icon'
            size={90}
          />
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              variant='standard'
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder='Group name'
              autoFocus
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Icon icon='mdi:pencil-outline' fontSize='1rem' color='inherit' />
                    </InputAdornment>
                  ),
                  inputProps: { maxLength: 50 }
                }
              }}
              sx={{
                '& .MuiInput-root': { fontSize: '1rem', fontWeight: 500 },
                '& .MuiInput-underline:before': { borderBottomColor: 'customColors.SurfaceVariant' },
                '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: 'customColors.Outline' }
              }}
            />
            <TextField
              fullWidth
              variant='standard'
              value={description}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
              placeholder='Description (optional)'
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Icon icon='mdi:text' fontSize='1rem' color='inherit' />
                    </InputAdornment>
                  ),
                  inputProps: { maxLength: 200 }
                }
              }}
              sx={{
                '& .MuiInput-root': { fontSize: '0.875rem' },
                '& .MuiInput-underline:before': { borderBottomColor: 'customColors.SurfaceVariant' },
                '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: 'customColors.Outline' }
              }}
            />
          </Box>
        </Box>

        {/* Selected members chips */}
        {selectedList.length > 0 && (
          <>
            <Box
              ref={chipsRef}
              sx={{
                display: 'flex',
                gap: 2,
                px: 4,
                py: 1.5,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
                borderBottom: theme => `1px solid ${theme.palette.divider}`
              }}
            >
              {selectedList.map(contact => (
                <Box
                  key={contact.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                    flexShrink: 0,
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => toggleMember(contact)}
                >
                  <Box sx={{ position: 'relative' }}>
                    {contact.avatar ? (
                      <MuiAvatar src={contact.avatar} alt={contact.fullName} sx={{ width: 40, height: 40 }} />
                    ) : (
                      <CustomAvatar
                        skin='light'
                        color={contact.avatarColor}
                        sx={{ width: 40, height: 40, fontSize: '0.8rem' }}
                      >
                        {getInitials(contact.fullName)}
                      </CustomAvatar>
                    )}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: 'customColors.Tertiary',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1.5px solid white'
                      }}
                    >
                      <Icon icon='mdi:close' fontSize='0.6rem' color='white' />
                    </Box>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '0.7rem',
                      color: 'customColors.OnSurfaceVariant',
                      maxWidth: 52,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textAlign: 'center'
                    }}
                  >
                    {contact.fullName.split(' ')[0]}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}

        {/* Members section */}
        <Box sx={{ px: 4, pt: 3, pb: 2 }}>
          <TextField
            fullWidth
            size='small'
            value={memberQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setMemberQuery(e.target.value)}
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
                backgroundColor: 'customColors.Surface'
              }
            }}
          />
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {searching && filteredContacts.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                Searching…
              </Typography>
            </Box>
          ) : filteredContacts.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                {memberQuery.trim() ? 'No people found' : 'No contacts available'}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filteredContacts.map((contact, index) => {
                const isSelected = selectedIds.has(contact.id)

                return (
                  <Box key={contact.id}>
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={() => toggleMember(contact)}
                        sx={{
                          px: 4,
                          py: 1.5,
                          gap: 3,
                          '&:hover': { backgroundColor: 'customColors.Surface' }
                        }}
                      >
                        <Box sx={{ position: 'relative', flexShrink: 0 }}>
                          {contact.avatar ? (
                            <MuiAvatar src={contact.avatar} alt={contact.fullName} sx={{ width: 42, height: 42 }} />
                          ) : (
                            <CustomAvatar
                              skin='light'
                              color={contact.avatarColor}
                              sx={{ width: 42, height: 42, fontSize: '0.875rem' }}
                            >
                              {getInitials(contact.fullName)}
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
                              {contact.fullName}
                            </Typography>
                          }
                        />
                        {isSelected && <Icon icon='mdi:check-circle' fontSize='1.25rem' color='primary.main' />}
                      </ListItemButton>
                    </ListItem>
                    {index < filteredContacts.length - 1 && (
                      <Divider sx={{ ml: '76px', borderColor: 'customColors.OnBackground' }} />
                    )}
                  </Box>
                )
              })}
            </List>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: theme => theme.spacing(3, 4),
          borderTop: theme => `1px solid ${theme.palette.divider}`,
          backgroundColor: 'background.paper'
        }}
      >
        <Button
          variant='contained'
          fullWidth
          disabled={!canCreate}
          onClick={handleCreate}
          sx={{ borderRadius: 2, py: 1.25, fontSize: '0.9375rem', fontWeight: 600 }}
        >
          Create Group
          {selectedIds.size > 0 && (
            <Box
              component='span'
              sx={{
                ml: 1.5,
                px: 1,
                py: 0.25,
                borderRadius: 10,
                backgroundColor: 'rgba(255,255,255,0.25)',
                fontSize: '0.75rem',
                fontWeight: 700,
                lineHeight: 1.4
              }}
            >
              {selectedIds.size}
            </Box>
          )}
        </Button>
      </Box>
    </Box>
  )
}

export default CreateGroupDrawer
