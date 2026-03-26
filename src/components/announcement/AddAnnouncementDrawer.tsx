'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import dayjs from 'dayjs'
import {
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  Typography,
  TextField,
  Tabs,
  Tab,
  Avatar,
  useTheme
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import MUIDatePicker from 'src/views/forms/form-fields/MUIDatePicker'
import MUITimePicker from 'src/views/forms/form-fields/MUITimePicker'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
import { useCreateAnnouncement, useUpdateAnnouncement } from 'src/hooks/announcement/useAnnouncements'
import { useAuth } from 'src/hooks/useAuth'
import SearchUsersDrawer from './SearchUsersDrawer'
import SelectSitesRolesDrawer from './SelectSitesRolesDrawer'
import type {
  Announcement,
  AnnouncementType,
  CreateAnnouncementPayload,
  ExistingAttachment,
  AddAnnouncementDrawerProps,
  FormValues,
  Site,
  Role,
  SelectedUser
} from 'src/types/announcement'

const validationSchema = yup.object().shape({
  title: yup.string().required('Title is required').max(200, 'Title must be at most 200 characters'),
  description: yup.string().max(5000, 'Description must be at most 5000 characters'),
  type: yup.string().oneOf(['general', 'important'], 'Please select a valid type').required('Type is required'),
  isEveryoneVisible: yup.boolean(),
  isPostNow: yup.boolean(),
  schedule_date: yup.mixed().when('isPostNow', {
    is: false,
    then: schema => schema.required('Schedule date is required'),
    otherwise: schema => schema.nullable()
  }),
  schedule_time: yup.mixed().when('isPostNow', {
    is: false,
    then: schema => schema.required('Schedule time is required'),
    otherwise: schema => schema.nullable()
  }),
  isAlwaysVisible: yup.boolean(),
  schedule_end_date: yup.mixed(),
  durationValue: yup.string(),
  durationUnit: yup.string(),
  allow_comments: yup.boolean(),
  attachments: yup.array()
})

// Emoji removal regex
const removeEmojis = (text: string): string => {
  return text.replace(
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F1E6}-\u{1F1FF}]|[\u200D]/gu,
    ''
  )
}

const AddAnnouncementDrawer = ({ open, onClose, onSuccess, editAnnouncement }: AddAnnouncementDrawerProps) => {
  const theme = useTheme()
  const auth = useAuth() as any
  const zooId = auth?.userData?.user?.zoos?.[0]?.zoo_id
  const imgPath = auth?.userData?.settings?.DEFAULT_IMAGE_MASTER || {}
  const createAnnouncement = useCreateAnnouncement()
  const updateAnnouncement = useUpdateAnnouncement()

  const isEdit = !!editAnnouncement

  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([])
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<number[]>([])

  const getFileIconConfig = (fileType: string) => {
    const type = fileType?.toLowerCase() || ''
    if (type.includes('pdf')) {
      return (
        imgPath.pdf || {
          bg_color: theme.palette.customColors.ErrorContainer || theme.palette.customColors.BgTeritary,
          icon_color: theme.palette.customColors.Tertiary
        }
      )
    }
    if (type.includes('video')) {
      return (
        imgPath.video || {
          bg_color: theme.palette.customColors.TertiaryContainer || theme.palette.customColors.infoContainer,
          icon_color: theme.palette.primary.main
        }
      )
    }
    if (type.includes('audio')) {
      return (
        imgPath.audio || {
          bg_color: theme.palette.customColors.warningContainer,
          icon_color: theme.palette.warning.main
        }
      )
    }
    if (type.includes('doc') || type.includes('document')) {
      return (
        imgPath.document || {
          bg_color: theme.palette.customColors.primaryContainer,
          icon_color: theme.palette.primary.main
        }
      )
    }

    return (
      imgPath.default || {
        bg_color: theme.palette.customColors.SurfaceVariant || theme.palette.customColors.OutlineVariant,
        icon_color: theme.palette.customColors.OnSurfaceVariant
      }
    )
  }

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      type: 'general',
      isEveryoneVisible: true,
      isPostNow: true,
      schedule_date: dayjs(),
      schedule_time: dayjs(),
      isAlwaysVisible: true,
      endDateTab: 'endDate',
      schedule_end_date: dayjs().add(7, 'day'),
      durationValue: '',
      durationUnit: 'Days',
      allow_comments: false,
      attachments: []
    }
  })

  const selectedType = watch('type')
  const isEveryoneVisible = watch('isEveryoneVisible')
  const isPostNow = watch('isPostNow')
  const isAlwaysVisible = watch('isAlwaysVisible')
  const endDateTab = watch('endDateTab')
  const durationValue = watch('durationValue')
  const durationUnit = watch('durationUnit')
  const scheduleDate = watch('schedule_date')
  const scheduleTime = watch('schedule_time')

  const [selectedSites, setSelectedSites] = useState<Site[]>([])
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([])
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([])
  const [isSitesRolesDrawerOpen, setIsSitesRolesDrawerOpen] = useState(false)
  const [isUsersDrawerOpen, setIsUsersDrawerOpen] = useState(false)

  useEffect(() => {
    if (open && isEdit && editAnnouncement) {
      setValue('title', editAnnouncement.title || '')
      setValue('description', editAnnouncement.description || '')

      setValue('type', (editAnnouncement.type as AnnouncementType) || 'general')

      const isEveryone = editAnnouncement.target_zoo_only ?? true
      setValue('isEveryoneVisible', isEveryone)
      const isScheduledValue = editAnnouncement.is_scheduled
      const postNow = isScheduledValue === true || isScheduledValue === 1 || isScheduledValue === '1'
      setValue('isPostNow', postNow)
      if (editAnnouncement.schedule_datetime) {
        setValue('schedule_date', dayjs(editAnnouncement.schedule_datetime))
        setValue('schedule_time', dayjs(editAnnouncement.schedule_datetime))
      }

      const endDateFlagValue = editAnnouncement.end_date_flag
      const alwaysVisible = endDateFlagValue === true || endDateFlagValue === 1
      setValue('isAlwaysVisible', alwaysVisible)

      if (editAnnouncement.schedule_end_date) {
        setValue('schedule_end_date', dayjs(editAnnouncement.schedule_end_date))
      }

      const allowComments =
        editAnnouncement.allow_comments === 1 ||
        editAnnouncement.allow_comments === '1' ||
        editAnnouncement.allow_comments === true
      setValue('allow_comments', allowComments)

      if (editAnnouncement.attachments && editAnnouncement.attachments.length > 0) {
        setExistingAttachments(
          editAnnouncement.attachments.map(att => ({
            id: att.id,
            file: att.file,
            file_orginal_name: att.file_orginal_name || 'Attachment',
            file_type: att.file_type || ''
          }))
        )
      }

      setDeletedAttachmentIds([])
    }
  }, [open, isEdit, editAnnouncement, setValue])

  const handleSitesRolesChange = (sites: Site[], roles: Role[]) => {
    setSelectedSites(sites)
    setSelectedRoles(roles)
  }

  const handleRemoveSite = (siteId: number) => {
    setSelectedSites(selectedSites.filter(s => s.site_id !== siteId))
  }

  const handleRemoveRole = (roleId: number | string) => {
    setSelectedRoles(selectedRoles.filter(r => r.id !== roleId))
  }

  const handleUsersSelected = (users: SelectedUser[]) => {
    setSelectedUsers(users)
  }

  const handleRemoveUser = (userId: number | string) => {
    setSelectedUsers(selectedUsers.filter(u => u.user_id !== userId))
  }

  const handleDrawerClose = () => {
    reset()
    setSelectedSites([])
    setSelectedRoles([])
    setSelectedUsers([])
    setExistingAttachments([])
    setDeletedAttachmentIds([])
    onClose()
  }

  const handleRemoveExistingAttachment = (attachmentId: number) => {
    setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId))
    setDeletedAttachmentIds(prev => [...prev, attachmentId])
  }

  const calculateEndDate = (): string => {
    if (isAlwaysVisible) return ''

    if (endDateTab === 'endDate') {
      const endDate = watch('schedule_end_date')

      return endDate ? dayjs(endDate).format('YYYY-MM-DD') : ''
    }

    const value = parseInt(durationValue)
    if (!value || isNaN(value) || value <= 0) return ''

    const baseDate = isPostNow ? dayjs() : scheduleDate || dayjs()
    let endDate = dayjs(baseDate)

    switch (durationUnit) {
      case 'Days':
        endDate = endDate.add(value - 1, 'day')
        break
      case 'Weeks':
        endDate = endDate.add(value * 7 - 1, 'day')
        break
      case 'Months':
        endDate = endDate.add(value - 1, 'month')
        break
    }

    return endDate.format('YYYY-MM-DD')
  }

  const onSubmit = async (data: FormValues) => {
    let scheduleDateTimeStr = dayjs().format('YYYY-MM-DD HH:mm:ss')

    if (!data.isPostNow && data.schedule_date && data.schedule_time) {
      const date = dayjs(data.schedule_date).format('YYYY-MM-DD')
      const time = dayjs(data.schedule_time).format('HH:mm:ss')
      scheduleDateTimeStr = `${date} ${time}`
    }

    let targetGroups: any[] = []
    if (data.isEveryoneVisible) {
      targetGroups = [{ group_type: 'zoo', values: zooId }]
    } else {
      if (selectedSites.length > 0 && selectedRoles.length > 0) {
        targetGroups = [
          {
            group_type: 'site_role',
            values: {
              sites: selectedSites.map(s => s.site_id),
              roles: selectedRoles.map(r => r.string_id || r.id)
            }
          }
        ]
      } else if (selectedSites.length > 0) {
        targetGroups = [
          {
            group_type: 'site',
            values: selectedSites.map(s => s.site_id)
          }
        ]
      } else if (selectedRoles.length > 0) {
        targetGroups = [
          {
            group_type: 'role',
            values: selectedRoles.map(r => r.string_id || r.id)
          }
        ]
      }
    }

    let userTargetGroups: string = ''
    if (!data.isEveryoneVisible && selectedUsers.length > 0) {
      userTargetGroups = JSON.stringify([
        {
          group_type: 'user',
          values: selectedUsers.map(u => u.user_id)
        }
      ])
    }

    const payload: CreateAnnouncementPayload = {
      title: data.title,
      description: data.description || '',
      type: data.type,
      allow_comments: data.allow_comments,
      is_scheduled: data.isPostNow ? 1 : 0,
      schedule_datetime: scheduleDateTimeStr,
      schedule_end_date: calculateEndDate(),
      target_groups: JSON.stringify(targetGroups),
      user_target_groups: userTargetGroups || undefined,
      attachments: data.attachments,
      deleted_attachments: deletedAttachmentIds.length > 0 ? deletedAttachmentIds.join(',') : undefined
    }

    try {
      if (isEdit && editAnnouncement) {
        await updateAnnouncement.mutateAsync({
          announcementId: editAnnouncement.announcement_id,
          payload
        })
      } else {
        await createAnnouncement.mutateAsync(payload)
      }
      handleDrawerClose()
      onSuccess?.()
    } catch (error) {}
  }

  const sectionCardSx = {
    backgroundColor: theme.palette.customColors.OnPrimary,
    borderRadius: '12px',
    p: 4,
    mb: 4
  }

  const sectionHeaderSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    mb: 3
  }

  const sectionTitleSx = {
    fontSize: '1rem',
    fontWeight: 600,
    color: theme.palette.customColors.OnSurfaceVariant
  }

  const inputBgColor = theme.palette.customColors.Background

  const switchRowSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: inputBgColor,
    borderRadius: '8px',
    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
    px: 4,
    py: 3
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={handleDrawerClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: ['100%', '580px'],
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.customColors.Background,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Sticky Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: theme.palette.customColors.OnPrimary,
              px: 5,
              py: 4,
              borderBottom: `1px solid ${theme.palette.divider}`,
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}
          >
            <Typography
              sx={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              {isEdit ? 'Edit Announcement' : 'Create Announcement'}
            </Typography>
            <IconButton
              size='small'
              onClick={handleDrawerClose}
              sx={{ color: theme.palette.customColors.OnSurfaceVariant }}
            >
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>

          {/* Scrollable Content */}
          <Box
            component='form'
            onSubmit={handleSubmit(onSubmit)}
            sx={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              p: 4
            }}
          >
            {/* 1. Type of Announcement Section */}
            <Box sx={sectionCardSx}>
              <Box sx={sectionHeaderSx}>
                <Icon icon='mdi:bullhorn-outline' fontSize={24} color={theme.palette.customColors.OnSurfaceVariant} />
                <Typography sx={sectionTitleSx}>Type of announcement</Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 3 }}>
                {/* General Button */}
                <Box
                  onClick={() => setValue('type', 'general')}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 4,
                    py: 3,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    ...(selectedType === 'general'
                      ? {
                          backgroundColor: theme.palette.customColors.OnPrimaryContainer,
                          color: theme.palette.customColors.OnPrimary
                        }
                      : {
                          backgroundColor: inputBgColor,
                          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                          color: theme.palette.customColors.OnSurfaceVariant
                        })
                  }}
                >
                  <Typography sx={{ fontWeight: 500, fontSize: '0.9375rem', color: 'inherit' }}>General</Typography>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border:
                        selectedType === 'general'
                          ? `2px solid ${theme.palette.customColors.OnPrimary}`
                          : `2px solid ${theme.palette.customColors.OutlineVariant}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {selectedType === 'general' && (
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: theme.palette.customColors.OnPrimary
                        }}
                      />
                    )}
                  </Box>
                </Box>

                {/* Important Button */}
                <Box
                  onClick={() => setValue('type', 'important')}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 4,
                    py: 3,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    ...(selectedType === 'important'
                      ? {
                          backgroundColor: theme.palette.customColors.Tertiary,
                          color: theme.palette.customColors.OnPrimary
                        }
                      : {
                          backgroundColor: inputBgColor,
                          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                          color: theme.palette.customColors.OnSurfaceVariant
                        })
                  }}
                >
                  <Typography sx={{ fontWeight: 500, fontSize: '0.9375rem', color: 'inherit' }}>Important</Typography>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border:
                        selectedType === 'important'
                          ? `2px solid ${theme.palette.customColors.OnPrimary}`
                          : `2px solid ${theme.palette.customColors.OutlineVariant}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {selectedType === 'important' && (
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: theme.palette.customColors.OnPrimary
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* 2. Details Section */}
            <Box sx={sectionCardSx}>
              <Box sx={sectionHeaderSx}>
                <Icon
                  icon='mdi:information-outline'
                  fontSize={24}
                  color={theme.palette.customColors.OnSurfaceVariant}
                />
                <Typography sx={sectionTitleSx}>Details</Typography>
              </Box>

              {/* Title Field */}
              <Controller
                name='title'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    placeholder='Title *'
                    error={!!errors.title}
                    helperText={errors.title?.message}
                    onChange={e => field.onChange(removeEmojis(e.target.value))}
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: inputBgColor,
                        borderRadius: '8px',
                        '& fieldset': { border: `1px solid ${theme.palette.customColors.OutlineVariant}` }
                      },
                      '& .MuiInputBase-input': {
                        py: 3,
                        px: 4,
                        fontSize: '0.9375rem',
                        '&::placeholder': {
                          color: theme.palette.customColors.neutralSecondary,
                          opacity: 1
                        }
                      }
                    }}
                  />
                )}
              />

              {/* Description Field */}
              <Controller
                name='description'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={4}
                    placeholder='Description (Optional)'
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    onChange={e => field.onChange(removeEmojis(e.target.value))}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: inputBgColor,
                        borderRadius: '8px',
                        '& fieldset': { border: `1px solid ${theme.palette.customColors.OutlineVariant}` }
                      },
                      '& .MuiInputBase-input': {
                        // py: 3,
                        // px: 4,
                        fontSize: '0.9375rem',
                        '&::placeholder': {
                          color: theme.palette.customColors.neutralSecondary,
                          opacity: 1
                        }
                      }
                    }}
                  />
                )}
              />
            </Box>

            {/* 3. Who can see this announcement Section */}
            <Box sx={sectionCardSx}>
              <Box sx={sectionHeaderSx}>
                <Icon icon='mdi:eye-outline' fontSize={24} color={theme.palette.customColors.OnSurfaceVariant} />
                <Typography sx={sectionTitleSx}>
                  Who can see this announcement?
                  {!isEveryoneVisible && (
                    <Typography component='span' sx={{ color: theme.palette.customColors.Tertiary }}>
                      {' '}
                      *
                    </Typography>
                  )}
                </Typography>
              </Box>

              <Box sx={switchRowSx}>
                <Typography
                  sx={{
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  Everyone
                </Typography>
                <Controller
                  name='isEveryoneVisible'
                  control={control}
                  render={({ field }) => (
                    <MUISwitch
                      checked={field.value}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        field.onChange(e.target.checked)
                      }}
                      switchColor={theme.palette.primary.main}
                    />
                  )}
                />
              </Box>

              {/* Sites & Roles Section - shown when Everyone is OFF */}
              {!isEveryoneVisible && (
                <>
                  {/* Sites & Roles Section */}
                  <Box
                    sx={{
                      mt: 3,
                      backgroundColor: inputBgColor,
                      borderRadius: '8px',
                      border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                      overflow: 'hidden'
                    }}
                  >
                    {/* Sites & Roles Header */}
                    <Box
                      onClick={() => setIsSitesRolesDrawerOpen(true)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 4,
                        py: 3,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover
                        }
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.9375rem',
                          fontWeight: 500,
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        Sites & Roles
                      </Typography>
                      <IconButton size='small' sx={{ color: theme.palette.primary.main }}>
                        <Icon icon='mdi:plus-circle-outline' fontSize={24} />
                      </IconButton>
                    </Box>

                    {/* Selected Sites List */}
                    {selectedSites.length > 0 && (
                      <Box sx={{ px: 3, pb: selectedRoles.length > 0 ? 1 : 3 }}>
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: theme.palette.customColors.neutralSecondary,
                            mb: 2,
                            textTransform: 'uppercase'
                          }}
                        >
                          Sites ({selectedSites.length})
                        </Typography>
                        {selectedSites.map(site => (
                          <Box
                            key={site.site_id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              py: 2,
                              px: 2,
                              mb: 2,
                              backgroundColor: theme.palette.customColors.OnPrimary,
                              borderRadius: '8px',
                              border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                src={site.site_image}
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '8px',
                                  backgroundColor: theme.palette.customColors.displaybgPrimary
                                }}
                              >
                                {site.site_name?.charAt(0)}
                              </Avatar>
                              <Typography
                                sx={{
                                  fontSize: '0.9375rem',
                                  fontWeight: 500,
                                  color: theme.palette.customColors.OnSurfaceVariant
                                }}
                              >
                                {site.site_name}
                              </Typography>
                            </Box>
                            <IconButton
                              size='small'
                              onClick={e => {
                                e.stopPropagation()
                                handleRemoveSite(site.site_id)
                              }}
                              sx={{ color: theme.palette.customColors.Tertiary }}
                            >
                              <Icon icon='mdi:close-circle-outline' fontSize={24} />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {/* Selected Roles List */}
                    {selectedRoles.length > 0 && (
                      <Box sx={{ px: 3, pb: 3 }}>
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: theme.palette.customColors.neutralSecondary,
                            mb: 2,
                            textTransform: 'uppercase'
                          }}
                        >
                          Roles ({selectedRoles.length})
                        </Typography>
                        {selectedRoles.map(role => (
                          <Box
                            key={role.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              py: 2,
                              px: 2,
                              mb: 2,
                              backgroundColor: theme.palette.customColors.OnPrimary,
                              borderRadius: '8px',
                              border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '8px',
                                  backgroundColor: theme.palette.primary.light + '30',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Icon
                                  icon='mdi:account-group-outline'
                                  fontSize={20}
                                  color={theme.palette.primary.main}
                                />
                              </Box>
                              <Typography
                                sx={{
                                  fontSize: '0.9375rem',
                                  fontWeight: 500,
                                  color: theme.palette.customColors.OnSurfaceVariant
                                }}
                              >
                                {role.role_name}
                              </Typography>
                            </Box>
                            <IconButton
                              size='small'
                              onClick={e => {
                                e.stopPropagation()
                                handleRemoveRole(role.id)
                              }}
                              sx={{ color: theme.palette.customColors.Tertiary }}
                            >
                              <Icon icon='mdi:close-circle-outline' fontSize={24} />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>

                  {/* Users Section */}
                  <Box
                    sx={{
                      mt: 3,
                      backgroundColor: inputBgColor,
                      borderRadius: '8px',
                      border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                      overflow: 'hidden'
                    }}
                  >
                    {/* Users Header */}
                    <Box
                      onClick={() => setIsUsersDrawerOpen(true)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 4,
                        py: 3,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover
                        }
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.9375rem',
                          fontWeight: 500,
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        Users
                      </Typography>
                      <IconButton size='small' sx={{ color: theme.palette.primary.main }}>
                        <Icon icon='mdi:plus-circle-outline' fontSize={24} />
                      </IconButton>
                    </Box>

                    {/* Selected Users List */}
                    {selectedUsers.length > 0 && (
                      <Box sx={{ px: 3, pb: 3 }}>
                        {selectedUsers.map(user => (
                          <Box
                            key={user.user_id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              py: 2,
                              px: 2,
                              mb: 2,
                              backgroundColor: theme.palette.customColors.OnPrimary,
                              borderRadius: '8px',
                              border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                src={user.user_profile_pic}
                                sx={{
                                  width: 40,
                                  height: 40,
                                  backgroundColor: theme.palette.primary.light
                                }}
                              >
                                {user.user_name?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography
                                  sx={{
                                    fontSize: '0.9375rem',
                                    fontWeight: 500,
                                    color: theme.palette.customColors.OnSurfaceVariant
                                  }}
                                >
                                  {user.user_name}
                                </Typography>
                                {user.role_name && (
                                  <Typography
                                    sx={{
                                      fontSize: '0.75rem',
                                      color: theme.palette.customColors.neutralSecondary
                                    }}
                                  >
                                    {user.role_name}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            <IconButton
                              size='small'
                              onClick={e => {
                                e.stopPropagation()
                                handleRemoveUser(user.user_id)
                              }}
                              sx={{ color: theme.palette.customColors.Tertiary }}
                            >
                              <Icon icon='mdi:close-circle-outline' fontSize={24} />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </>
              )}
            </Box>

            {/* 4. When do you want to post it Section */}
            <Box sx={sectionCardSx}>
              <Box sx={sectionHeaderSx}>
                <Icon
                  icon='mdi:calendar-month-outline'
                  fontSize={24}
                  color={theme.palette.customColors.OnSurfaceVariant}
                />
                <Typography sx={sectionTitleSx}>
                  When do you want to post it?
                  {!isPostNow && (
                    <Typography component='span' sx={{ color: theme.palette.customColors.Tertiary }}>
                      {' '}
                      *
                    </Typography>
                  )}
                </Typography>
              </Box>

              <Box sx={{ ...switchRowSx, mb: !isPostNow ? 3 : 0 }}>
                <Typography
                  sx={{
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  Post Now
                </Typography>
                <Controller
                  name='isPostNow'
                  control={control}
                  render={({ field }) => (
                    <MUISwitch
                      checked={field.value}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.checked)}
                      switchColor={theme.palette.primary.main}
                    />
                  )}
                />
              </Box>

              {/* Schedule Date & Time Pickers - shown only when Post Now is OFF */}
              {!isPostNow && (
                <Box>
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      mb: 2
                    }}
                  >
                    Schedule announcement
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    {/* Date Picker */}
                    <Box sx={{ flex: 1 }}>
                      <Controller
                        name='schedule_date'
                        control={control}
                        render={({ field, fieldState }) => (
                          // @ts-ignore - MUIDatePicker is a JS component
                          <MUIDatePicker
                            value={field.value}
                            onChange={field.onChange}
                            onAccept={() => {}}
                            label='Select Date'
                            minDate={dayjs()}
                            views={['year', 'month', 'day']}
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                          />
                        )}
                      />
                    </Box>
                    {/* Time Picker */}
                    <Box sx={{ flex: 1 }}>
                      <Controller
                        name='schedule_time'
                        control={control}
                        render={({ field, fieldState }) => (
                          // @ts-ignore - MUITimePicker is a JS component
                          <MUITimePicker
                            value={field.value}
                            onChange={field.onChange}
                            label='Select Time'
                            ampm
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                          />
                        )}
                      />
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            {/* 5. How long should it be visible Section */}
            <Box sx={sectionCardSx}>
              <Box sx={sectionHeaderSx}>
                <Icon icon='mdi:clock-outline' fontSize={24} color={theme.palette.customColors.OnSurfaceVariant} />
                <Typography sx={sectionTitleSx}>
                  How long should it be visible?
                  {!isAlwaysVisible && (
                    <Typography component='span' sx={{ color: theme.palette.customColors.Tertiary }}>
                      {' '}
                      *
                    </Typography>
                  )}
                </Typography>
              </Box>

              <Box sx={{ ...switchRowSx, mb: !isAlwaysVisible ? 3 : 0 }}>
                <Typography
                  sx={{
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  Always Visible
                </Typography>
                <Controller
                  name='isAlwaysVisible'
                  control={control}
                  render={({ field }) => (
                    <MUISwitch
                      checked={field.value}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.checked)}
                      switchColor={theme.palette.primary.main}
                    />
                  )}
                />
              </Box>

              {/* End Date / Duration Tabs - shown only when Always Visible is OFF */}
              {!isAlwaysVisible && (
                <>
                  <Tabs
                    value={endDateTab === 'endDate' ? 0 : 1}
                    onChange={(_e, newValue) => setValue('endDateTab', newValue === 0 ? 'endDate' : 'duration')}
                    variant='fullWidth'
                    sx={{
                      mb: 3,
                      minHeight: 40,
                      '& .MuiTabs-indicator': {
                        backgroundColor: theme.palette.primary.main,
                        height: 2
                      },
                      '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        minHeight: 40,
                        color: theme.palette.customColors.neutralSecondary,
                        '&.Mui-selected': {
                          color: theme.palette.primary.main,
                          fontWeight: 600
                        }
                      }
                    }}
                  >
                    <Tab label='Choose End Date' />
                    <Tab label='Set Duration' />
                  </Tabs>

                  {endDateTab === 'endDate' ? (
                    <Controller
                      name='schedule_end_date'
                      control={control}
                      render={({ field }) => (
                        // @ts-ignore - MUIDatePicker is a JS component with flexible props
                        <MUIDatePicker
                          value={field.value}
                          onChange={field.onChange}
                          onAccept={() => {}}
                          label='End Date'
                          minDate={isPostNow ? dayjs() : scheduleDate || dayjs()}
                          views={['year', 'month', 'day']}
                        />
                      )}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                      <Controller
                        name='durationValue'
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type='number'
                            placeholder='0'
                            inputProps={{ min: 1, max: 99999 }}
                            sx={{
                              width: '100px',
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: inputBgColor,
                                borderRadius: '8px',
                                '& fieldset': { border: `1px solid ${theme.palette.customColors.OutlineVariant}` }
                              },
                              '& .MuiInputBase-input': {
                                py: 3,
                                px: 3,
                                fontSize: '0.9375rem',
                                textAlign: 'center'
                              }
                            }}
                          />
                        )}
                      />

                      {/* Duration Unit Selector */}
                      <Box
                        sx={{
                          display: 'flex',
                          flex: 1,
                          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}
                      >
                        {(['Days', 'Weeks', 'Months'] as const).map((unit, index) => (
                          <Box
                            key={unit}
                            onClick={() => setValue('durationUnit', unit)}
                            sx={{
                              flex: 1,
                              py: 3,
                              textAlign: 'center',
                              cursor: 'pointer',
                              borderRight:
                                index < 2 ? `1px solid ${theme.palette.customColors.OutlineVariant}` : 'none',
                              backgroundColor:
                                durationUnit === unit
                                  ? theme.palette.customColors.OnPrimaryContainer
                                  : theme.palette.customColors.SurfaceVariant,
                              color:
                                durationUnit === unit
                                  ? theme.palette.customColors.OnPrimary
                                  : theme.palette.customColors.OnSurfaceVariant,
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{unit}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </Box>

            {/* 6. Allow Comments Section (Inline) */}
            <Box
              sx={{
                ...sectionCardSx,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Icon icon='mdi:comment-outline' fontSize={24} color={theme.palette.customColors.OnSurfaceVariant} />
                <Typography sx={sectionTitleSx}>Allow Comments</Typography>
              </Box>
              <Controller
                name='allow_comments'
                control={control}
                render={({ field }) => (
                  <MUISwitch
                    checked={field.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.checked)}
                    switchColor={theme.palette.primary.main}
                  />
                )}
              />
            </Box>

            {/* 7. Attachments Section */}
            <Box sx={sectionCardSx}>
              <Box sx={sectionHeaderSx}>
                <Icon icon='mdi:attachment' fontSize={24} color={theme.palette.customColors.OnSurfaceVariant} />
                <Typography sx={sectionTitleSx}>Attachments</Typography>
              </Box>

              {/* Existing Attachments (for edit mode) - matching ControlledMultiFileUpload pattern */}
              {isEdit && existingAttachments.length > 0 && (
                <Box sx={{ mb: 4, display: 'flex', gap: { xs: 2, sm: '1.125rem' }, flexWrap: 'wrap' }}>
                  {existingAttachments.map(attachment => {
                    const isImage = attachment.file_type?.startsWith('image') || attachment.file_type === 'image'
                    const iconConfig = getFileIconConfig(attachment.file_type)

                    return (
                      <Box
                        key={attachment.id}
                        sx={{
                          position: 'relative',
                          width: 100,
                          height: 100,
                          borderRadius: 1,
                          backgroundColor: theme.palette.customColors.displaybgPrimary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {/* Attachment preview/icon */}
                        {isImage ? (
                          <Box
                            component='img'
                            src={attachment.file}
                            alt={attachment.file_orginal_name}
                            sx={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: '8px'
                            }}
                          />
                        ) : iconConfig.image_path ? (
                          <Box
                            component='img'
                            src={iconConfig.image_path}
                            alt='file icon'
                            sx={{
                              width: 40,
                              height: 40,
                              backgroundColor: iconConfig.bg_color,
                              borderRadius: '4px'
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: iconConfig.bg_color,
                              borderRadius: '4px'
                            }}
                          >
                            <Icon
                              icon={
                                attachment.file_type?.includes('pdf')
                                  ? 'mdi:file-pdf-box'
                                  : attachment.file_type?.includes('video')
                                  ? 'mdi:play-circle'
                                  : attachment.file_type?.includes('audio')
                                  ? 'mdi:music-note'
                                  : 'mdi:file-document-outline'
                              }
                              fontSize={40}
                              color={iconConfig.icon_color}
                            />
                          </Box>
                        )}
                        {/* Remove button - matching ControlledMultiFileUpload style */}
                        <IconButton
                          size='small'
                          onClick={() => handleRemoveExistingAttachment(attachment.id)}
                          sx={{
                            position: 'absolute',
                            top: 5,
                            right: 5,
                            backgroundColor: theme.palette.customColors.secondaryBg,
                            color: theme.palette.customColors.OnPrimary,
                            width: 24,
                            height: 24,
                            zIndex: 1,
                            '&:hover': {
                              backgroundColor: theme.palette.customColors.OnSurfaceVariant
                            }
                          }}
                        >
                          <Icon icon='mdi:close' fontSize={18} />
                        </IconButton>
                      </Box>
                    )
                  })}
                </Box>
              )}

              <ControlledMultiFileUpload
                name='attachments'
                control={control}
                label='Drop your files here or click to upload'
                acceptedFileTypes='images,video,pdf,documents,audio'
                maxFiles={10}
                maxFileSize={25 * 1024 * 1024}
                previewPlacement='bottom'
                enableImageFullScreen
              />
            </Box>
          </Box>

          {/* Sticky Footer */}
          <Box
            sx={{
              p: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.customColors.OnPrimary,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              position: 'sticky',
              bottom: 0,
              boxShadow: '0px -1px 30px 0px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Button
              variant='outlined'
              fullWidth
              onClick={handleDrawerClose}
              disabled={isEdit ? updateAnnouncement.isPending : createAnnouncement.isPending}
              sx={{
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                height: '48px',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              {isEdit ? 'Cancel' : 'Preview'}
            </Button>
            <Button
              type='submit'
              variant='contained'
              fullWidth
              disabled={isEdit ? updateAnnouncement.isPending : createAnnouncement.isPending}
              onClick={handleSubmit(onSubmit)}
              sx={{
                height: '48px',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              {(isEdit ? updateAnnouncement.isPending : createAnnouncement.isPending) ? (
                <CircularProgress size={24} color='inherit' />
              ) : isEdit ? (
                'Update'
              ) : (
                'Publish'
              )}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Sites & Roles Selection Drawer */}
      <SelectSitesRolesDrawer
        open={isSitesRolesDrawerOpen}
        onClose={() => setIsSitesRolesDrawerOpen(false)}
        selectedSites={selectedSites}
        selectedRoles={selectedRoles}
        onSelectionChange={handleSitesRolesChange}
      />

      {/* Search Users Drawer */}
      <SearchUsersDrawer
        open={isUsersDrawerOpen}
        onClose={() => setIsUsersDrawerOpen(false)}
        selectedUsers={selectedUsers}
        onUsersSelected={handleUsersSelected}
      />
    </>
  )
}

export default AddAnnouncementDrawer
