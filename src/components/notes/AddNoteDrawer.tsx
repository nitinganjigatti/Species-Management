import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Drawer,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
  TextField,
  Tooltip,
  Grid,
  Button,
  useTheme,
  ClickAwayListener,
  Card,
  Avatar
} from '@mui/material'
import { styled, alpha } from '@mui/material/styles'
import {
  Close as CloseIcon,
  Description as NoteIcon,
  ThumbUp as LikeIcon,
  ThumbUpOutlined as LikeOutlinedIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  AttachFile,
  Add,
  AddCircleOutline,
  CloseOutlined,
  Check
} from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'

import { addNotesReaction, removeNotesReaction, getNotesDetails, addNotesComment } from 'src/lib/api/notesModule'
import Toaster from 'src/components/Toaster'
import { useAuth } from 'src/hooks/useAuth'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import FilePreviewCard from 'src/views/utility/NewMediaCard'
import LocationInfoCard from 'src/views/utility/LocationInfoCard'
import AnimalCard from 'src/views/utility/AnimalCard'
import { useForm } from 'react-hook-form'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'

const AddNoteDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const theme = useTheme() as any
  const [selected, setSelected] = useState<string | null>(null)

  const PRIORITY_OPTIONS = [
    { value: 'Low', label: 'Low', bgColor: theme.palette.customColors.Secondary, iconType: 'text', icon: '!' },
    {
      value: 'Moderate',
      label: 'Moderate',
      bgColor: theme.palette.customColors.antzNotes80,
      iconType: 'text',
      icon: '!!'
    },
    {
      value: 'High',
      label: 'High',
      bgColor: theme.palette.customColors.customDropdownColor,
      iconType: 'text',
      icon: '!!!'
    },
    {
      value: 'Critical',
      label: 'Critical',
      bgColor: theme.palette.customColors.Error,
      iconType: 'icon',
      icon: 'boxicons:fire'
    }
  ]

  const {
    reset,
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm({
    defaultValues: {
      note_type: '',
      priority: 'Low',
      notify_members: false,
      attachments: []
    },
    // resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldUnregister: false
  })

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 560 },
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 5,
          py: 4,
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          backgroundColor: theme.palette.customColors.OnPrimary,
          flexShrink: 0
        }}
      >
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
          New Notes
        </Typography>
        <IconButton size='small' onClick={onClose} sx={{ color: theme.palette.text.primary }}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>
      <Box
        sx={{
          overflowY: 'auto',
          minHeight: 0,
          flexGrow: 1,
          backgroundColor: theme.palette.background.default,
          padding: 4
        }}
      >
        <form autoComplete='off'>
          <Card sx={{ padding: 6, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: '10px',
                    padding: '10px',
                    cursor: 'poniter'
                  }}
                >
                  <Typography>Note Type*</Typography>
                  <IconButton size='small' sx={{ color: theme.palette.customColors.Secondary }}>
                    <AddCircleOutline />
                  </IconButton>
                </Box>
                <Box
                  sx={{
                    borderRadius: '8px',
                    border: `1px solid ${theme.palette.customColors?.OutlineVariant}`,
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: theme.palette.customColors?.Background,
                      px: 3,
                      py: 2,
                      borderBottom: `1px solid ${theme.palette.customColors?.OutlineVariant}`
                    }}
                  >
                    <Typography
                      sx={{
                        color: theme.palette.customColors?.OnSurfaceVariant,
                        fontSize: '1rem'
                      }}
                    >
                      Note Type
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          color: theme.palette.customColors?.OnSurfaceVariant,
                          fontSize: '1rem'
                        }}
                      >
                        General
                      </Typography>
                      <IconButton size='small' sx={{ color: theme.palette.error.main }}>
                        <Icon icon='mdi:close-circle-outline' />
                      </IconButton>
                    </Box>
                    <Box sx={{ px: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton size='small' sx={{ color: theme.palette.primary.main }}>
                        <Check />
                      </IconButton>
                      <Typography
                        sx={{
                          color: theme.palette.customColors?.OnSurfaceVariant,
                          fontSize: '14px'
                        }}
                      >
                        General
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <ControlledTextField
                  control={control}
                  errors={errors}
                  label='Enter Notes'
                  name='notes'
                  placeholder='Enter Notes'
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: '10px',
                    padding: '10px',
                    cursor: 'poniter'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton size='small'>
                      <PersonIcon sx={{ fontSize: 24, color: theme.palette.customColors.neutralSecondary }} />
                    </IconButton>
                    <Typography>Notify members</Typography>
                  </Box>

                  <MUISwitch control={control} name='notify_members' size='large' />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: '10px',
                    padding: '10px',
                    cursor: 'poniter'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size='small'
                      sx={{ fontSize: 24, color: theme.palette.customColors.OnSecondaryContainer }}
                    >
                      <Icon icon='fluent-mdl2:add-home' />
                    </IconButton>
                    <Typography sx={{ fontWeight: 500 }}>Add members to be notified </Typography>
                  </Box>

                  <IconButton size='small' sx={{ color: theme.palette.customColors.Secondary }}>
                    <AddCircleOutline />
                  </IconButton>
                </Box>
                <Box
                  sx={{
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: '10px',
                    p: 2,
                    overflowX: 'auto',
                    display:'flex',
                    gap:2                    
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderRadius: '10px',
                      padding: '10px',
                      bgcolor: theme.palette.customColors?.Background,
                      minWidth: '70%' 
                    }}
                  >
                    <UserAvatarDetails
                      profile_image={'member?.user_ profile_pic'}
                      user_name={'member?.full_name'}
                      role={'member?.role_name'}
                      size='large'
                      text_color={theme.palette.customColors.OnSurfaceVariant}
                    />
                    <IconButton size='small' sx={{ color: theme.palette.error.main }}>
                      <Icon icon='mdi:close-circle-outline' />
                    </IconButton>
                  </Box>
                 
                </Box>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: '10px',
                    padding: '10px',
                    cursor: 'poniter'
                  }}
                >
                  <Typography>Select Entity*</Typography>
                  <IconButton size='small' sx={{ color: theme.palette.customColors.Secondary }}>
                    <AddCircleOutline />
                  </IconButton>
                </Box>
                <Typography
                  sx={{
                    pl: 2,
                    pt: 1,
                    fontSize: '14px',
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 500
                  }}
                >
                  Notes related to an animal, enclosure or a section
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                  <IconButton size='small' sx={{ color: theme.palette.customColors.Secondary, p: 0 }}>
                    <AttachFile sx={{ color: theme.palette.customColors.neutralSecondary }} />
                  </IconButton>
                  <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500 }}>
                    Attachments
                  </Typography>
                </Box>
                <ControlledMultiFileUpload
                  control={control}
                  name='attachments'
                  label='Upload attachments'
                  acceptedFileTypes='*'
                  preview
                  previewPlacement='top'
                  maxFiles={20}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    border: `2px solid ${theme.palette.customColors.neutralTeritary}`,
                    p: 4,
                    borderRadius: '10px'
                  }}
                >
                  <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500 }}>
                    Priority
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    {PRIORITY_OPTIONS.map(option => {
                      const isSelected = selected === option.value

                      return (
                        <Box
                          key={option.value}
                          onClick={() => setSelected(option.value)}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                            cursor: 'pointer'
                          }}
                        >
                          <IconButton
                            size='small'
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              border: `1px solid ${
                                isSelected ? option.bgColor : theme.palette.customColors.OnSurfaceVariant
                              }`,
                              backgroundColor: isSelected ? option.bgColor : 'transparent'
                            }}
                          >
                            {option.iconType === 'text' ? (
                              <Typography
                                sx={{
                                  fontWeight: 700,
                                  fontSize: 20,
                                  color: isSelected
                                    ? theme.palette.customColors.OnPrimary
                                    : theme.palette.customColors.OnSurfaceVariant
                                }}
                              >
                                {option.icon}
                              </Typography>
                            ) : (
                              <Icon
                                icon={option.icon}
                                fontSize={20}
                                color={
                                  isSelected
                                    ? theme.palette.customColors.OnPrimary
                                    : theme.palette.customColors.OnSurfaceVariant
                                }
                              />
                            )}
                          </IconButton>

                          <Typography
                            sx={{
                              fontWeight: isSelected ? 600 : 400,
                              color: theme.palette.text.primary
                            }}
                          >
                            {option.label}
                          </Typography>
                        </Box>
                      )
                    })}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Card>
        </form>
      </Box>
      <Box
        sx={{
          p: 4,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          display: 'flex',
          justifyContent: 'center',
          gap: 4,
          boxShadow: `0px -2px 6px ${alpha(theme.palette.customColors.deepDark, 0.1)}`,
          bottom: 0,
          position: 'sticky',
          zIndex: 1
        }}
      >
        <LoadingButton
          variant='outlined'
          // onClick={handleSubmit(onSubmit)}
          // loading={submitLoader}
          sx={{ flex: 1, py: 3 }}
          // disabled={!isValid || submitLoader}
        >
          Clear
        </LoadingButton>
        <LoadingButton
          variant='contained'
          // onClick={handleSubmit(onSubmit)}
          // loading={submitLoader}
          sx={{ flex: 1, py: 3 }}
          // disabled={!isValid || submitLoader}
        >
          Submit
        </LoadingButton>
      </Box>

    </Drawer>
  )
}

export default AddNoteDrawer
