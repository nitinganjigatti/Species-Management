import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Typography,
  Drawer,
  IconButton,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Skeleton
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useSelector, useDispatch } from 'react-redux'
import { useAuth } from 'src/hooks/useAuth'
import { fetchTemplates, createTemplate } from 'src/store/slices/housing/notesSlice'
import Toaster from 'src/components/Toaster'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import Search from 'src/views/utility/Search'
import NoDataFound from 'src/views/utility/NoDataFound'
import SearchUsersDrawer from './SearchUsersDrawer'
import Icon from 'src/@core/components/icon'
import type { User, ObservationTemplate } from 'src/types/housing'
import type { RootState, AppDispatch } from 'src/store'

interface NotifyMembersDrawerProps {
  open: boolean
  onClose: () => void
  selectedMembers: User[]
  onMembersChange: (members: User[]) => void
  noteTypeId?: number
  onMembersConfirmed?: (members: User[]) => void
}

const NotifyMembersDrawer: React.FC<NotifyMembersDrawerProps> = ({
  open,
  onClose,
  selectedMembers,
  onMembersChange,
  noteTypeId,
  onMembersConfirmed
}) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const dispatch = useDispatch<AppDispatch>()
  const auth = useAuth()

  const { templates: rawTemplates, templatesLoading } = useSelector((state: RootState) => state.notes)
  const templates = Array.isArray(rawTemplates) ? rawTemplates : []
  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

  // Local state
  const [localSelectedMembers, setLocalSelectedMembers] = useState<User[]>([])
  const [searchUsersDrawerOpen, setSearchUsersDrawerOpen] = useState(false)
  const [saveGroupModalOpen, setSaveGroupModalOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [savingGroup, setSavingGroup] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Initialize local state when drawer opens
  useEffect(() => {
    if (open) {
      setLocalSelectedMembers([...selectedMembers])
      setSearchQuery('')
      if (zooId && noteTypeId) {
        dispatch(fetchTemplates({ zoo_id: zooId, observation_types: noteTypeId }))
      }
    }
  }, [open, selectedMembers, dispatch, zooId, noteTypeId])

  // Filter templates based on search
  const filteredTemplates = templates.filter(template =>
    (template.template_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRemoveUser = (userId: number) => {
    setLocalSelectedMembers(prev => prev.filter(m => m.user_id !== userId))
  }

  const handleClearSelection = () => {
    setLocalSelectedMembers([])
  }

  const handleSelectFromTemplate = (template: ObservationTemplate) => {
    if (template.template_items && Array.isArray(template.template_items)) {
      setLocalSelectedMembers(template.template_items)
    }
  }

  const handleOpenSaveGroup = () => {
    if (!noteTypeId) {
      Toaster({ type: 'warning', message: t('notes_module.please_select_a_note_type_first_to_create_a_new_template') })

      return
    }
    setGroupName('')
    setSaveGroupModalOpen(true)
  }

  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      Toaster({ type: 'warning', message: t('notes_module.please_enter_a_valid_group_name') })

      return
    }

    // Check if template name already exists
    const nameExists = templates.some(t => (t.template_name || '').toLowerCase() === groupName.trim().toLowerCase())
    if (nameExists) {
      Toaster({ type: 'warning', message: `${t('notes_module.template_name_already_exists')}!` })

      return
    }

    setSavingGroup(true)
    try {
      const userIds = localSelectedMembers.map(m => m.user_id)
      await dispatch(
        createTemplate({
          zooID: zooId,
          template_name: groupName.trim(),
          template_type: 'observation',
          template_items: JSON.stringify(userIds),
          template_sub_type: noteTypeId,
          is_default: 0,
          status: 1
        })
      ).unwrap()

      Toaster({ type: 'success', message: t('notes_module.group_saved_successfully') })
      setSaveGroupModalOpen(false)
      setGroupName('')

      // Refresh templates after successful creation
      if (noteTypeId && zooId) {
        await dispatch(fetchTemplates({ zoo_id: zooId, observation_types: noteTypeId })).unwrap()
      }
    } catch (error: any) {
      console.error('Failed to save group:', error?.message || error?.template_name || error)
      Toaster({ type: 'error', message: error?.message || error?.template_name || error || 'Failed to save group' })
    } finally {
      setSavingGroup(false)
    }
  }

  const handleSearchBoxClick = () => {
    setSearchUsersDrawerOpen(true)
  }

  const handleUsersSelected = (users: User[]) => {
    setLocalSelectedMembers(users)
  }

  const handleAdd = () => {
    onMembersChange(localSelectedMembers)
    // Call the onMembersConfirmed callback if provided
    if (onMembersConfirmed) {
      onMembersConfirmed(localSelectedMembers)
    }
    handleDrawerClose()
  }

  const handleDrawerClose = () => {
    onClose()
    setSearchQuery('')
    setLocalSelectedMembers([])
  }

  return (
    <>
      <Drawer
        open={open}
        anchor='right'
        onClose={handleDrawerClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 560 },
              backgroundColor: theme.palette.customColors?.Background,
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }
          }
        }}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.customColors?.OnPrimary,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: theme.palette.customColors?.OnPrimary,
              px: 5,
              py: 4,
              borderBottom: `1px solid ${theme.palette.divider}`,
              flexShrink: 0
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
              <Typography
                sx={{
                  fontSize: '24px',
                  fontWeight: 500,
                  color: theme.palette.customColors?.OnSurfaceVariant
                }}
              >
                {t('housing_module.add_users')}
              </Typography>
            </Box>
            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
              <Icon icon='mdi:close' fontSize={30} />
            </IconButton>
          </Box>

          {/* Search Box - Clickable */}
          <Box sx={{ px: 6, pt: 6, pb: 3, flexShrink: 0 }}>
            <Box
              onClick={handleSearchBoxClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                py: 3,
                backgroundColor: theme.palette.customColors?.OnPrimary,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': {
                  borderColor: theme.palette.primary.main
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Icon icon='mdi:magnify' fontSize={24} color={theme.palette.text.secondary} />
                <Typography sx={{ color: theme.palette.text.secondary, fontSize: '1rem' }}>
                  {t('housing_module.search_people')}
                </Typography>
              </Box>
              {/* <Icon icon='mdi:qrcode-scan' fontSize={24} color={theme.palette.text.secondary} /> */}
            </Box>
          </Box>

          {/* Content - Scrollable */}
          <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {/* Selected Users Section */}
            {localSelectedMembers.length > 0 && (
              <Box sx={{ px: 6, pb: 3 }}>
                <Box
                  sx={{
                    p: 4,
                    backgroundColor: theme.palette.customColors?.Surface,
                    borderRadius: 1
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 3
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 500,
                        color: theme.palette.customColors?.OnSurfaceVariant
                      }}
                    >
                      {t('housing_module.selected_users')} - {localSelectedMembers.length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {localSelectedMembers.map(member => (
                      <Box
                        key={member.user_id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 3,
                          backgroundColor: theme.palette.customColors?.OnPrimary,
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.customColors?.SurfaceVariant}`
                        }}
                      >
                        <UserAvatarDetails
                          profile_image={member.user_profile_pic}
                          user_name={member.user_name || member.full_name || 'NA'}
                          role={member.role_name || 'NA'}
                          size='medium'
                          text_color={theme.palette.customColors?.OnSurfaceVariant}
                        />
                        <IconButton
                          size='small'
                          onClick={() => handleRemoveUser(member.user_id)}
                          sx={{ color: theme.palette.error.main }}
                        >
                          <Icon icon='mdi:close-circle-outline' fontSize={24} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            )}

            {/* Save/Clear Actions */}
            {localSelectedMembers.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  px: 6,
                  pb: 3
                }}
              >
                <Button
                  size='small'
                  startIcon={<Icon icon='mdi:content-save-outline' fontSize={18} />}
                  onClick={handleOpenSaveGroup}
                  sx={{
                    textTransform: 'none',
                    color: theme.palette.customColors?.OnSurfaceVariant,
                    fontSize: '0.875rem'
                  }}
                >
                  {t('housing_module.save_new_group')}
                </Button>
                <Button
                  size='small'
                  startIcon={<Icon icon='mdi:close' fontSize={18} />}
                  onClick={handleClearSelection}
                  sx={{
                    textTransform: 'none',
                    color: theme.palette.error.main,
                    fontSize: '0.875rem'
                  }}
                >
                  {t('clear_selection')}
                </Button>
              </Box>
            )}

            {/* Pre-defined Groups Section */}
            <Box sx={{ px: 6, pb: 3 }}>
              <Typography
                sx={{
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: theme.palette.customColors?.OnSurfaceVariant,
                  mb: 3
                }}
              >
                {t('housing_module.predefined_groups')}
              </Typography>

              {/* Search Templates */}
              <Box sx={{ mb: 3 }}>
                <Search
                  placeholder={t('housing_module.search_groups') as string}
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                  inputStyle={{ py: '12px', px: '12px' }}
                  width='100%'
                />
              </Box>

              {templatesLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[1, 2, 3].map(item => (
                    <Skeleton
                      key={item}
                      variant='rectangular'
                      height={56}
                      sx={{
                        borderRadius: 1,
                        bgcolor: theme.palette.action.hover
                      }}
                    />
                  ))}
                </Box>
              ) : filteredTemplates.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    py: 6
                  }}
                >
                  <NoDataFound variant='Meerkat' height={150} width={150} />
                  <Typography
                    sx={{
                      mt: 2,
                      color: theme.palette.text.secondary,
                      fontSize: '0.875rem'
                    }}
                  >
                    {searchQuery ? t('housing_module.no_groups_found') : t('housing_module.no_predefined_groups')}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filteredTemplates.map(template => (
                    <Box
                      key={template.id}
                      onClick={() => handleSelectFromTemplate(template)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 4,
                        backgroundColor: theme.palette.customColors?.OnPrimary,
                        border: `1px solid ${theme.palette.customColors?.SurfaceVariant}`,
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'background 0.2s, border-color 0.2s',
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                          borderColor: theme.palette.primary.main
                        }
                      }}
                    >
                      <Icon
                        icon='mdi:account-group'
                        fontSize={24}
                        color={theme.palette.customColors?.OnSurfaceVariant}
                      />
                      <Typography
                        sx={{
                          fontSize: '1rem',
                          fontWeight: 500,
                          color: theme.palette.customColors?.OnSurfaceVariant,
                          flex: 1
                        }}
                      >
                        {template.template_name || 'Unnamed Group'}
                      </Typography>
                      <Icon icon='mdi:chevron-right' fontSize={24} color={theme.palette.text.secondary} />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              p: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.customColors?.OnPrimary,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
              boxShadow: '0px -1px 10px 0px rgba(0, 0, 0, 0.05)'
            }}
          >
            <Typography
              sx={{
                fontSize: '1.25rem',
                fontWeight: 500,
                color: theme.palette.customColors?.OnSurface
              }}
            >
              {t('selected')} - {localSelectedMembers.length}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '50%' }}>
              <Button
                variant='outlined'
                fullWidth
                onClick={handleDrawerClose}
                sx={{
                  borderColor: theme.palette.customColors?.OnPrimaryContainer,
                  color: theme.palette.customColors?.OnPrimaryContainer,
                  height: '56px'
                }}
              >
                {t('cancel')}
              </Button>
              <Button variant='contained' fullWidth onClick={handleAdd} sx={{ height: '56px' }}>
                {t('add')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Search Users Drawer */}
      <SearchUsersDrawer
        open={searchUsersDrawerOpen}
        onClose={() => setSearchUsersDrawerOpen(false)}
        selectedUsers={localSelectedMembers}
        onUsersSelected={handleUsersSelected}
      />

      {/* Save Group Modal */}
      <Dialog
        open={saveGroupModalOpen}
        onClose={() => setSaveGroupModalOpen(false)}
        maxWidth='xs'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogContent sx={{ pt: 4 }}>
          <Typography
            sx={{
              mb: 3,
              fontWeight: 500,
              fontSize: '1.125rem',
              color: theme.palette.customColors?.OnSurfaceVariant
            }}
          >
            {t('housing_module.enter_group_name')}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            size='small'
            placeholder={t('housing_module.group_name') as string}
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 3, justifyContent: 'flex-end' }}>
          <Button
            onClick={() => setSaveGroupModalOpen(false)}
            variant='outlined'
            disabled={savingGroup}
            sx={{
              textTransform: 'none',
              borderColor: theme.palette.customColors?.OnPrimaryContainer,
              color: theme.palette.customColors?.OnPrimaryContainer
            }}
          >
            {t('cancel')}
          </Button>
          <Button onClick={handleSaveGroup} variant='contained' disabled={savingGroup} sx={{ textTransform: 'none' }}>
            {savingGroup ? <CircularProgress size={20} color='inherit' /> : t('confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default NotifyMembersDrawer
