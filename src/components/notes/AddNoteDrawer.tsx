'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Drawer, IconButton, Grid, useTheme, Card, FormHelperText } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Person as PersonIcon, AttachFile, AddCircleOutline, Check } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from 'src/hooks/useAuth'
import Toaster from 'src/components/Toaster'

import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
import SelectNoteTypeDrawer from 'src/components/housing/sites/SelectNoteTypeDrawer'
import NotifyMembersDrawer from 'src/components/housing/sites/NotifyMembersDrawer'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import AnimalCard from 'src/views/utility/AnimalCard'
import LocationInfoCard from 'src/views/utility/LocationInfoCard'
import { createObservation, editObservation } from 'src/lib/api/housing'
import AddAnimalDrawer from './AddAnimalDrawer'

const validationSchema = yup.object().shape({
  observation_type_id: yup.string().required('Note type is required'),
  observation_name: yup.string().optional(),
  notify_members: yup.boolean().optional(),
  selected_animals: yup.array().min(1, 'Select at least one entity').required('Entity is required'),
  attachments: yup.array().optional(),
  priority: yup.string().required('Priority is required').oneOf(['Low', 'Moderate', 'High', 'Critical'])
})

export interface AnimalData {
  animal_id: string | number
  default_common_name?: string
  scientific_name?: string
  user_enclosure_name?: string
  section_name?: string
  site_name?: string
  type?: string
  sex?: string
  default_icon?: string
  total_animal?: string | number
  local_identifier_name?: string | null
  local_identifier_value?: string | null
  enclosure_id?: string | number
  section_id?: string | number
  site_id?: string | number
}

interface AddNoteDrawerProps {
  open: boolean
  onClose: () => void
  refetchNotesList: () => void
  editData?: any
}

const AddNoteDrawer = ({ open, onClose, refetchNotesList, editData }: AddNoteDrawerProps) => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const auth = useAuth()
  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

  const [openSelectNoteTypeDrawer, setOpenSelectNoteTypeDrawer] = useState<boolean>(false)
  const [notifyMembersDrawerOpen, setNotifyMembersDrawerOpen] = useState<boolean>(false)
  const [animalDrawer, setAnimalDrawer] = useState<boolean>(false)
  const [observationType, setObservationType] = useState<any>(null)
  const [childTypes, setChildTypes] = useState<any[]>([])
  const [selectedAnimals, setSelectedAnimals] = useState<any[]>([])
  const [notifyMembers, setNotifyMembers] = useState<any[]>([])
  const [submitLoader, setSubmitLoader] = useState<boolean>(false)
  const [showAllEntities, setShowAllEntities] = useState<boolean>(false)
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>([])
  const [originalAttachmentIds, setOriginalAttachmentIds] = useState<string[]>([])

  // priority options
  const PRIORITY_OPTIONS = [
    {
      value: 'Low',
      label: t('priority_low'),
      bgColor: theme.palette.customColors.Secondary,
      iconType: 'text',
      icon: '!'
    },
    {
      value: 'Moderate',
      label: t('priority_moderate'),
      bgColor: theme.palette.customColors.antzNotes80,
      iconType: 'text',
      icon: '!!'
    },
    {
      value: 'High',
      label: t('priority_high'),
      bgColor: theme.palette.customColors.customDropdownColor,
      iconType: 'text',
      icon: '!!!'
    },
    {
      value: 'Critical',
      label: t('priority_critical'),
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
    formState: { errors },
    setValue,
    getValues
  } = useForm({
    defaultValues: {
      observation_name: '',
      priority: 'Low',
      notify_members: false,
      attachments: [],
      observation_type_id: '',
      selected_animals: []
    },
    resolver: yupResolver(validationSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldUnregister: false
  })

  const watchedPriority = watch('priority')
  const watchedNotifyMembers = watch('notify_members')

  const handleNoteTypeSelect = (selected: any) => {
    setObservationType(selected.observationType || null)
    setChildTypes(selected.childTypes || [])
    setValue('observation_type_id', selected.observationType?.id || '', { shouldValidate: true })
  }

  const handleRemoveNoteType = () => {
    setObservationType(null)
    setChildTypes([])
    setValue('observation_type_id', '', { shouldValidate: true })
  }

  const handlePriorityChange = (value: string) => {
    setValue('priority', value, { shouldValidate: true })
  }

  const handleNotifyToggle = (value: boolean) => {
    setValue('notify_members', value, { shouldValidate: true })
    if (!value) {
      setNotifyMembers([])
    }
  }

  const handleOpenNotifyMembersDrawer = () => {
    if (!observationType) {
      Toaster({ type: 'warning', message: t('notes_module.please_select_the_note_type_first_to_add_members') })
      return
    }
    setNotifyMembersDrawerOpen(true)
  }

  const handleRemoveMember = (userId: number) => {
    setNotifyMembers(prev => prev.filter(m => m.user_id !== userId))
  }

  const handleNotifyMembersChange = (newValue: any[]) => {
    setNotifyMembers(newValue)
  }

  // handle animal/entity select
  const handleAnimalSelect = (entities: any, options?: { isSelectAll?: boolean }) => {
    const entityList = Array.isArray(entities) ? entities : [entities]
    const mapped: AnimalData[] = entityList.map((item: any) => {
      const type = item?.type || 'animal'
      return {
        animal_id: type === 'animal' ? item?.animal_id || item?.id : item?.animal_id,
        default_common_name: item?.default_common_name || item?.common_name,
        scientific_name: item?.scientific_name ?? item?.complete_name,
        user_enclosure_name: item?.user_enclosure_name || item?.enclosure_name,
        section_name: item?.section_name,
        site_name: item?.site_name,
        type: type,
        sex: item?.sex || item?.gender,
        default_icon: item?.default_icon || item?.animal_image || item?.image,
        total_animal: item?.total_animal,
        local_identifier_name: item?.local_identifier_name,
        local_identifier_value: item?.local_identifier_value,
        enclosure_id: type === 'enclosure' ? item?.enclosure_id || item?.id : item?.enclosure_id,
        section_id: type === 'section' ? item?.section_id || item?.id : item?.section_id,
        site_id: type === 'site' ? item?.site_id || item?.id : item?.site_id,
        siteData: item?.siteData,
        sectionData: item?.sectionData,
        enclosureData: item?.enclosureData
      }
    })
    // Append new entities to existing list instead of replacing
    setSelectedAnimals(prev => {
      const newList = [...prev, ...mapped]
      setValue('selected_animals', newList, { shouldValidate: true })
      return newList
    })
    return true
  }

  // Prepare payload according to API structure
  const prepareFormPayload = () => {
    const formValues = getValues()

    const animalIds: string[] = []
    const enclosureIds: string[] = []
    const sectionIds: string[] = []
    const siteIds: string[] = []

    selectedAnimals.forEach(entity => {
      if (entity.animal_id) {
        animalIds.push(String(entity.animal_id))
      } else if (entity.enclosure_id) {
        enclosureIds.push(String(entity.enclosure_id))
      } else if (entity.section_id) {
        sectionIds.push(String(entity.section_id))
      } else if (entity.site_id) {
        siteIds.push(String(entity.site_id))
      }
    })

    // Combine observation type ID with child types
    const observationTypeIds = observationType
      ? [observationType.id, ...childTypes.map((c: any) => c.id)].filter(
          id => id && id !== 'null' && id !== 'undefined'
        )
      : []

    // Get assigned user IDs
    const assignToIds = notifyMembers.map((m: any) => m.user_id).filter(id => id && id !== 'null' && id !== 'undefined')

    return {
      zoo_id: zooId,
      observation_name: formValues.observation_name,
      observation_type_id: observationTypeIds,
      animal_id: animalIds,
      enclosure_id: enclosureIds,
      section_id: sectionIds,
      site_id: siteIds,
      priority: formValues.priority,
      assign_to: assignToIds,
      attachments: formValues.attachments || [],
      notify_enabled: formValues.notify_members && notifyMembers.length > 0
    }
  }

  const handleNoteSubmit = async () => {
    try {
      setSubmitLoader(true)

      const payload = prepareFormPayload()
      const submitData = new FormData()

      // Append standard fields
      submitData.append('zoo_id', String(payload.zoo_id))
      submitData.append('observation_name', payload.observation_name)
      submitData.append('priority', payload.priority)
      // Only append these if NOT editing
      if (!editData?.observation_id) {
        submitData.append('observation_type_id', JSON.stringify(payload.observation_type_id))
        submitData.append('animal_id', JSON.stringify(payload.animal_id))
        submitData.append('enclosure_id', JSON.stringify(payload.enclosure_id))
        submitData.append('section_id', JSON.stringify(payload.section_id))
        submitData.append('site_id', JSON.stringify(payload.site_id))
      }

      // Append observation_id if editing
      if (editData?.observation_id) {
        submitData.append('observation_id', String(editData.observation_id))
      }

      // Append new files and existing files
      if (payload.attachments && payload.attachments.length > 0) {
        payload.attachments.forEach((file: any) => {
          // If it's a File object (new upload)
          if (file instanceof File) {
            submitData.append('observation_attachment[]', file)
          }
        })
      }

      // Send deleted IDs as a single JSON array string - only when editing
      if (editData?.observation_id && deletedAttachmentIds.length > 0) {
        submitData.append('deleted_attachment', JSON.stringify(deletedAttachmentIds))
      }

      // Append assigned members if notification is enabled
      if (payload.notify_enabled && payload.assign_to.length > 0) {
        submitData.append('assign_to', payload.assign_to.join(','))
      }
      const res = editData?.observation_id ? await editObservation(submitData) : await createObservation(submitData)

      if (res?.success) {
        Toaster({
          type: 'success',
          message: editData?.observation_id ? 'Note updated successfully' : 'Note added successfully'
        })

        // Reset form and state
        reset({
          observation_name: '',
          priority: 'Low',
          notify_members: false,
          attachments: []
        })
        refetchNotesList()
        setObservationType(null)
        setChildTypes([])
        setSelectedAnimals([])
        setNotifyMembers([])
        setShowAllEntities(false)
        setDeletedAttachmentIds([])
        setOriginalAttachmentIds([])

        reset({
          observation_name: '',
          priority: 'Low',
          notify_members: false,
          attachments: [],
          observation_type_id: '',
          selected_animals: []
        })

        onClose()
      } else {
        Toaster({
          type: 'error',
          message: res?.message || `Failed to ${editData?.observation_id ? 'update' : 'add'} note`
        })
      }
    } catch (e) {
      console.error('Error submitting note:', e)
      Toaster({ type: 'error', message: 'Error occurred while submitting' })
    } finally {
      setSubmitLoader(false)
    }
  }

  // Handle clear form
  const handleClearForm = () => {
    reset({
      observation_name: '',
      priority: 'Low',
      notify_members: false,
      attachments: []
    })
    setObservationType(null)
    setChildTypes([])
    setSelectedAnimals([])
    setNotifyMembers([])
    setShowAllEntities(false)
    setDeletedAttachmentIds([])
    setOriginalAttachmentIds([])
    reset({
      observation_name: '',
      priority: 'Low',
      notify_members: false,
      attachments: [],
      observation_type_id: '',
      selected_animals: []
    })
  }

  // Reset form when drawer opens or editData changes
  useEffect(() => {
    if (open && editData) {
      // Reset form fields
      reset({
        observation_name: editData?.observation_name || '',
        priority: editData?.priority || 'Low',
        notify_members:
          editData?.notify_enabled === '1' || editData?.notify_enabled === true || editData?.assign_to?.length > 0,
        attachments: []
      })

      // Set Note Type
      if (editData?.child_master_type) {
        setObservationType({
          id: editData.child_master_type.parent_observation_type_id,
          type_name: editData.child_master_type.parent_observation_type,
          string_id: editData.child_master_type.string_id
        })
        setChildTypes(
          editData.child_master_type.child_observation_type
            ?.filter((t: any) => t.child_id || t.type_id)
            .map((t: any) => ({
              id: t.child_id || t.type_id,
              type_name: t.type_name,
              string_id: t.string_id
            })) || []
        )
        setValue('observation_type_id', editData.child_master_type.parent_observation_type_id, { shouldValidate: true })
      }

      // Set Entities (selectedAnimals)
      if (editData?.ref_data && Array.isArray(editData.ref_data)) {
        const mappedEntities = editData.ref_data.map((item: any) => {
          if (item?.animalData) {
            return {
              ...item.animalData,
              animal_id: item.ref_id,
              type: 'animal'
            }
          }
          if (item?.siteData) {
            return {
              ...item,
              id: item.ref_id,
              type: 'site'
            }
          }
          if (item?.sectionData) {
            return {
              ...item,
              id: item.ref_id,
              type: 'section'
            }
          }
          if (item?.enclosureData) {
            return {
              ...item,
              id: item.ref_id,
              type: 'enclosure'
            }
          }

          return {
            ...item,
            id: item.ref_id,
            type: item.ref_type || item.type
          }
        })
        setSelectedAnimals(mappedEntities)
        setValue('selected_animals', mappedEntities, { shouldValidate: true })
      }
      // Set Notify Members
      if (editData?.assign_to) {
        setNotifyMembers(editData.assign_to)
      }

      // Set Existing Attachments
      if (editData?.attachments) {
        const mappedAttachments = editData.attachments.map((file: any) => ({
          id: file.id,
          url: file.file,
          file: file.file,
          file_path: file.file,
          name: file.file_orginal_name
        }))

        // Track original attachment IDs for deletion tracking
        const originalIds = editData.attachments.map((file: any) => file.id)
        setOriginalAttachmentIds(originalIds)
        setDeletedAttachmentIds([])

        setValue('attachments', mappedAttachments)
      }
    } else if (open) {
      handleClearForm()
    }
  }, [open, editData])

  // Track deleted attachments when user removes them from the form
  useEffect(() => {
    const currentAttachments = watch('attachments') || []
    const currentAttachmentIds = currentAttachments
      .filter((file: any) => file.id) // Only existing files have IDs
      .map((file: any) => file.id)

    // Find attachments that were in original but not in current
    const deleted = originalAttachmentIds.filter(id => !currentAttachmentIds.includes(id))
    setDeletedAttachmentIds(deleted)
  }, [watch('attachments')])

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
          {editData?.observation_id ? t('notes_module.edit_note') : t('notes_module.new_notes')}
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
              {/* Note Type Selection */}
              <Grid size={{ xs: 12 }}>
                {observationType ? (
                  <Box
                    sx={{
                      borderRadius: '8px',
                      border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: theme.palette.customColors?.Background,
                        px: 3,
                        py: 2,
                        borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
                      }}
                    >
                      <Typography
                        sx={{
                          color: theme.palette.customColors?.OnSurfaceVariant,
                          fontSize: '1rem'
                        }}
                      >
                        {t('notes_module.note_type')}
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
                          {t(observationType.string_id || '', { defaultValue: observationType.type_name })}
                        </Typography>
                        {!editData?.observation_id && (
                          <IconButton
                            size='small'
                            sx={{ color: theme.palette.error.main }}
                            onClick={handleRemoveNoteType}
                          >
                            <Icon icon='mdi:close-circle-outline' />
                          </IconButton>
                        )}
                      </Box>
                      {childTypes?.length > 0 && (
                        <Box sx={{ px: 2, py: 1 }}>
                          {childTypes?.map(childType => (
                            <Box key={childType.id} sx={{ px: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <IconButton size='small' sx={{ color: theme.palette.primary.main }}>
                                <Check />
                              </IconButton>
                              <Typography
                                sx={{
                                  color: theme.palette.customColors.OnSurfaceVariant,
                                  fontSize: '14px'
                                }}
                              >
                                {t(childType.string_id || '', { defaultValue: childType.type_name })}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: errors.observation_type_id
                          ? `1px solid ${theme.palette.error.main}`
                          : `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderRadius: '10px',
                        padding: '10px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setOpenSelectNoteTypeDrawer(true)}
                    >
                      <Typography>{t('notes_module.note_type')}*</Typography>
                      <IconButton size='small' sx={{ color: theme.palette.customColors.Secondary }}>
                        <AddCircleOutline />
                      </IconButton>
                    </Box>
                  </>
                )}
                {errors.observation_type_id && (
                  <FormHelperText sx={{ color: 'error.main', mx: 2 }}>
                    {(errors.observation_type_id as any).message}
                  </FormHelperText>
                )}
              </Grid>

              {/* Notes TextField */}
              <Grid size={{ xs: 12 }}>
                <ControlledTextField
                  control={control}
                  errors={errors}
                  label='Enter Notes'
                  name='observation_name'
                  placeholder='Enter Notes'
                  fullWidth
                  multiline
                  minRows={3}
                />
              </Grid>

              {/* Notify Members Section */}
              <Grid
                size={{ xs: 12 }}
                sx={{ border: `1px solid ${theme.palette.customColors.OutlineVariant}`, borderRadius: '10px' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderRadius: '10px',
                    padding: '10px',
                    cursor: 'pointer'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton size='small'>
                      <PersonIcon sx={{ fontSize: 24, color: theme.palette.customColors.neutralSecondary }} />
                    </IconButton>
                    <Typography>{t('notes_module.notify_members')}</Typography>
                  </Box>

                  <MUISwitch
                    control={control}
                    name='notify_members'
                    size='large'
                    checked={watchedNotifyMembers}
                    onChange={(e: any) => handleNotifyToggle(e.target.checked)}
                  />
                </Box>
                {watchedNotifyMembers && (
                  <Box
                    onClick={handleOpenNotifyMembersDrawer}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: `1px solid ${theme.palette.divider}`,
                      padding: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size='small'
                        sx={{ fontSize: 24, color: theme.palette.customColors.OnSecondaryContainer }}
                      >
                        <Icon icon='fluent-mdl2:add-home' />
                      </IconButton>
                      <Typography sx={{ fontWeight: 500 }}>{t('notes_module.add_members_to_be_notified')} </Typography>
                    </Box>

                    <IconButton size='small' sx={{ color: theme.palette.customColors.Secondary }}>
                      <AddCircleOutline />
                    </IconButton>
                  </Box>
                )}
                {notifyMembers?.length > 0 && (
                  <Box
                    sx={{
                      borderTop: `1px solid ${theme.palette.divider}`,
                      p: 2,
                      overflowX: 'auto',
                      display: 'flex',
                      gap: 2
                    }}
                  >
                    {notifyMembers?.map(member => (
                      <Box
                        key={member?.user_id}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderRadius: '10px',
                          padding: '10px',
                          bgcolor: theme.palette.customColors.Background,
                          minWidth: '50%'
                        }}
                      >
                        <UserAvatarDetails
                          profile_image={member?.user_profile_pic}
                          user_name={member?.full_name || member?.user_name}
                          role={member?.role_name}
                          size='large'
                          text_color={theme.palette.customColors.OnSurfaceVariant}
                        />
                        <IconButton
                          size='small'
                          sx={{ color: theme.palette.error.main }}
                          onClick={() => handleRemoveMember(member?.user_id)}
                        >
                          <Icon icon='mdi:close-circle-outline' />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Grid>

              {/* Entity Selection */}
              <Grid size={{ xs: 12 }}>
                {selectedAnimals?.length > 0 ? (
                  <Box
                    sx={{
                      borderRadius: '8px',
                      border: `1px solid ${theme.palette.customColors?.OutlineVariant}`,
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: theme.palette.customColors.displaybgPrimary,
                        px: 3,
                        py: 2,
                        borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Typography
                        sx={{
                          color: theme.palette.customColors?.OnSurfaceVariant,
                          fontWeight: 600,
                          fontSize: '1rem'
                        }}
                      >
                        {selectedAnimals?.length} {t('notes_module.entities')}
                      </Typography>
                      {!editData?.observation_id && (
                        <IconButton
                          size='small'
                          onClick={() => setAnimalDrawer(true)}
                          sx={{ color: theme.palette.primary.main }}
                        >
                          <AddCircleOutline />
                        </IconButton>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      {(showAllEntities ? selectedAnimals : selectedAnimals.slice(0, 3)).map((entity, index) => (
                        <Box
                          key={index}
                          sx={{
                            px: 3,
                            py: 3,
                            borderBottom:
                              index < selectedAnimals.length - 1
                                ? `1px solid ${theme.palette.customColors?.OutlineVariant}`
                                : 'none'
                          }}
                        >
                          <Box
                            sx={{
                              p: 2,
                              border: '1px solid',
                              borderRadius: 1,
                              borderColor: theme.palette.divider,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 2
                            }}
                          >
                            <Box sx={{ flexGrow: 1 }}>
                              {entity?.animal_id ? (
                                <AnimalCard data={entity} size='14px' />
                              ) : (
                                <LocationInfoCard data={[entity]} variant='single' showCount />
                              )}
                            </Box>
                            {!editData?.observation_id && (
                              <IconButton
                                size='small'
                                sx={{ color: theme.palette.error.main, flexShrink: 0 }}
                                onClick={e => {
                                  e.stopPropagation()
                                  setSelectedAnimals(prev => {
                                    const newList = prev.filter((_, i) => i !== index)
                                    setValue('selected_animals', newList, { shouldValidate: true })
                                    return newList
                                  })
                                }}
                              >
                                <Icon icon='mdi:close-circle-outline' />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Box
                    onClick={() => setAnimalDrawer(true)}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: `1px solid ${
                        errors.selected_animals ? theme.palette.error.main : theme.palette.customColors.OutlineVariant
                      }`,
                      borderRadius: '10px',
                      padding: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <Typography>{t('notes_module.select_entity')}*</Typography>
                    <IconButton size='small' sx={{ color: theme.palette.customColors.Secondary }}>
                      <AddCircleOutline />
                    </IconButton>
                  </Box>
                )}
                {errors.selected_animals && (
                  <FormHelperText sx={{ color: 'error.main', mx: 2 }}>
                    {(errors.selected_animals as any).message}
                  </FormHelperText>
                )}
                <Typography
                  sx={{
                    pl: 2,
                    pt: 1,
                    fontSize: '14px',
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  {t('notes_module.notes_to_related_to_animal')}
                </Typography>
              </Grid>

              {/* Attachments */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                  <IconButton size='small' sx={{ color: theme.palette.customColors.Secondary, p: 0 }}>
                    <AttachFile sx={{ color: theme.palette.customColors.neutralSecondary }} />
                  </IconButton>
                  <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500 }}>
                    {t('attachments')}
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

              {/* Priority Selection */}
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
                    {t('priority')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    {PRIORITY_OPTIONS?.map(option => {
                      const isSelected = watchedPriority === option.value

                      return (
                        <Box
                          key={option.value}
                          onClick={() => handlePriorityChange(option.value)}
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
                              backgroundColor: isSelected ? option.bgColor : 'transparent',
                              '&:hover': {
                                backgroundColor: isSelected ? option.bgColor : 'transparent'
                              }
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

                          <Typography sx={{ fontWeight: isSelected ? 600 : 400, color: theme.palette.text.primary }}>
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
          onClick={handleClearForm}
          loading={submitLoader}
          sx={{ flex: 1, py: 3 }}
          disabled={submitLoader}
        >
          {t('clear')}
        </LoadingButton>
        <LoadingButton
          variant='contained'
          onClick={handleSubmit(handleNoteSubmit)}
          loading={submitLoader}
          sx={{ flex: 1, py: 3 }}
          disabled={submitLoader}
        >
          {t('submit')}
        </LoadingButton>
      </Box>

      <SelectNoteTypeDrawer
        open={openSelectNoteTypeDrawer}
        onClose={() => setOpenSelectNoteTypeDrawer(false)}
        selectedTypes={{
          observationType: observationType || undefined,
          childTypes: childTypes
        }}
        onAddSelected={handleNoteTypeSelect}
      />

      <NotifyMembersDrawer
        open={notifyMembersDrawerOpen}
        onClose={() => setNotifyMembersDrawerOpen(false)}
        selectedMembers={notifyMembers}
        onMembersChange={handleNotifyMembersChange}
        noteTypeId={observationType?.id}
      />

      <AddAnimalDrawer
        open={animalDrawer}
        onClose={() => setAnimalDrawer(false)}
        handleAnimalSelect={handleAnimalSelect}
        selectedAnimals={selectedAnimals}
      />
    </Drawer>
  )
}

export default AddNoteDrawer
