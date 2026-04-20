'use client'

import React, { useEffect, useState } from 'react'
import { useTheme, Card, Typography, IconButton, Drawer, Box, alpha } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { LoadingButton } from '@mui/lab'
import { useRouter } from 'next/navigation'
import Icon from 'src/@core/components/icon'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import { addNoteTypes, getNoteTypesList, deleteNoteType, updateNoteType } from 'src/lib/api/notesModule'
import Toaster from 'src/components/Toaster'
import { AddNoteTypePayload, UpdateNoteTypePayload } from 'src/types/notes/api'
import { NoteTypeItem } from 'src/types/notes'
import { useQuery } from '@tanstack/react-query'
import ConfirmationDialog from 'src/components/confirmation-dialog'

interface AddSubNoteTypeDrawerProps {
  openDrawer: boolean
  closeDrawer: () => void
  editSubNote: NoteTypeItem | null
  noteTypeId: string
  refetch: () => void
  parentTitle: string
}

type AddSubNoteTypeFormValues = {
  type_name: string
  parent_name: string
}

const AddSubNoteTypeDrawer = ({
  openDrawer,
  closeDrawer,
  editSubNote,
  noteTypeId,
  refetch,
  parentTitle
}: AddSubNoteTypeDrawerProps) => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const router = useRouter()
  const [submitLoader, setSubmitLoader] = useState<boolean>(false)
  const [deleteSubNoteTypeOpen, setDeleteSubNoteTypeOpen] = useState<boolean>(false)

  const schema = yup.object().shape({
    type_name: yup
      .string()
      .trim()
      .min(3, t('notes_module.sub_note_type_name_must_have_at_least_3_characters'))
      .required(t('notes_module.sub_note_type_name_is_required'))
  })

  const defaultValues: AddSubNoteTypeFormValues = { type_name: '', parent_name: noteTypeId ? String(noteTypeId) : '' }

  const { data: parentNoteTypes = [] } = useQuery<NoteTypeItem[]>({
    queryKey: ['noteTypes', 'parent'],
    queryFn: async () => {
      const res = await getNoteTypesList({ type: 'parent' })

      return res?.success ? res?.data : []
    }
  })

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<AddSubNoteTypeFormValues>({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldUnregister: false
  })

  const handleSubmitData = async (formData: AddSubNoteTypeFormValues) => {
    try {
      setSubmitLoader(true)
      const response = editSubNote
        ? await updateNoteType({
            observation_type_id: editSubNote?.id,
            type_name: formData?.type_name,
            parent_type_id: formData?.parent_name
          })
        : await addNoteTypes({
            type_name: formData?.type_name,
            parent_id: formData?.parent_name
          })
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        reset(defaultValues)
        closeDrawer()
        await refetch()
        const selectedParentId = formData?.parent_name ? String(formData.parent_name) : ''
        const selectedParent = parentNoteTypes.find(nt => String(nt.id) === selectedParentId)
        const selectedParentTitle = selectedParent
          ? (t(selectedParent.string_id || '', { defaultValue: selectedParent.type_name }) as string)
          : ''
        if (
          editSubNote &&
          selectedParentId &&
          selectedParentId !== String(noteTypeId) &&
          selectedParentTitle !== parentTitle
        ) {
          router.push('/notes/masters/note-types')
        }
      } else {
        Toaster({ type: 'error', message: response?.message || 'Something went wrong' })
      }
    } catch (error: any) {
      console.error('Error adding sub note type:', error?.message || error)
    } finally {
      setSubmitLoader(false)
    }
  }

  const handleDelete = async () => {
    try {
      setSubmitLoader(true)
      const response = await deleteNoteType({ observation_type_id: editSubNote?.id as number })
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        reset(defaultValues)
        closeDrawer()
        await refetch()
      }
    } catch (error: any) {
      console.error('Error deleting note types:', error?.message || error)
    } finally {
      setSubmitLoader(false)
    }
  }

  const handleClose = () => {
    reset(defaultValues)
    closeDrawer()
  }

  const handleDeleteOpen = () => {
    setDeleteSubNoteTypeOpen(true)
  }

  useEffect(() => {
    if (editSubNote) {
      const parentValue = editSubNote?.parent_type_id ?? editSubNote?.parent_id ?? noteTypeId
      reset({
        type_name: editSubNote?.type_name || '',
        parent_name: parentValue ? String(parentValue) : ''
      })
    } else {
      reset(defaultValues)
    }
  }, [editSubNote, noteTypeId, reset])

  return (
    <>
      <Drawer
        anchor='right'
        open={openDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: ['100%', 562] } }}
      >
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            position: 'sticky',
            top: 0,
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 6,
            borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            backgroundColor: theme.palette.customColors.OnPrimary,
            zIndex: 10
          }}
        >
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {parentTitle}
          </Typography>
          <IconButton size='small' onClick={handleClose} sx={{ color: theme.palette.text.primary }}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>

        <Box
          sx={{
            backgroundColor: theme.palette.background.default,
            p: 6,
            flexGrow: 1,
            pb: 16
          }}
        >
          <form autoComplete='off'>
            <Card sx={{ padding: 6, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
              <Box sx={{ mb: 5 }}>
                <Typography
                  sx={{ fontSize: '1rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant, mb: 2 }}
                >
                  {editSubNote ? t('notes_module.edit_sub_note_type') : t('notes_module.add_sub_note_type')}
                </Typography>
                <ControlledTextField
                  control={control}
                  errors={errors}
                  label={t('name')}
                  name='type_name'
                  placeholder={t('notes_module.enter_sub_note_type')}
                  fullWidth
                />
              </Box>

              {editSubNote && (
                <ControlledSelect
                  control={control}
                  name='parent_name'
                  errors={errors}
                  label={t('notes_module.parent_note_type')}
                  options={parentNoteTypes as any}
                  getOptionLabel={(opt: NoteTypeItem) =>
                    t(opt.string_id || '', { defaultValue: opt.type_name }) as string
                  }
                  getOptionValue={(opt: NoteTypeItem) => String(opt.id)}
                />
              )}
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
          {editSubNote && (
            <LoadingButton
              variant='outlined'
              size='large'
              onClick={() => setDeleteSubNoteTypeOpen(true)}
              disabled={submitLoader}
              loading={submitLoader}
              sx={{
                flex: 1,
                height: '56px',
                borderColor: theme.palette.error.main,
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                color: theme.palette.error.main,
                '&:hover': {
                  borderColor: theme.palette.error.main,
                  backgroundColor: alpha(theme.palette.error.main, 0.3)
                }
              }}
            >
              {t('notes_module.delete_sub_note_type')}
            </LoadingButton>
          )}

          <LoadingButton
            variant='contained'
            onClick={handleSubmit(handleSubmitData)}
            loading={submitLoader}
            sx={{ flex: 1, py: 4 }}
            disabled={submitLoader}
          >
            {t('submit')}
          </LoadingButton>
        </Box>
      </Drawer>

      {deleteSubNoteTypeOpen && (
        <ConfirmationDialog
          dialogBoxStatus={deleteSubNoteTypeOpen}
          onClose={() => setDeleteSubNoteTypeOpen(false)}
          title={'Delete Sub Note Type?'}
          cancelText={'CANCEL'}
          confirmBtnStyle={{ background: theme.palette.customColors.Error, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          confirmAction={handleDelete}
          loading={submitLoader}
          ConfirmationText={'DELETE'}
          description={'Are you sure you want to delete this Sub Note Type?'}
        />
      )}
    </>
  )
}

export default AddSubNoteTypeDrawer
