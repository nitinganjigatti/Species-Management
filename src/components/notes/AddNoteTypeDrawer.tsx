'use client'

import React, { useEffect, useState } from 'react'
import { useTheme, Card, Typography, IconButton, Drawer, Box, alpha } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import Toaster from 'src/components/Toaster'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import { addNoteTypes, updateNoteType, deleteNoteType, getChildNoteTypesList } from 'src/lib/api/notesModule'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { AddNoteTypePayload } from 'src/types/notes/api'
import { NoteTypeItem } from 'src/types/notes'

interface AddNoteTypeDrawerProps {
  openDrawer: boolean
  closeDrawer: () => void
  refetch: () => void
  editNoteType: NoteTypeItem | null
}

const AddNoteTypeDrawer = ({ openDrawer, closeDrawer, refetch, editNoteType }: AddNoteTypeDrawerProps) => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const router = useRouter()
  const queryClient = useQueryClient()
  const [submitLoader, setSubmitLoader] = useState<boolean>(false)
  const [deleteNoteTypeOpen, setDeleteNoteTypeOpen] = useState<boolean>(false)

  const invalidateNoteTypeCaches = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['noteTypes', 'parent'] }),
      queryClient.invalidateQueries({ queryKey: ['parent'] }),
      queryClient.invalidateQueries({ queryKey: ['child'] })
    ])

  const schema = yup.object().shape({
    type_name: yup
      .string()
      .trim()
      .min(3, t('notes_module.note_type_name_must_have_at_least_3_characters'))
      .required(t('notes_module.note_type_name_is_required'))
  })

  const defaultValues = { type_name: '' }

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldUnregister: false
  })

  const handleSubmitData = async (formData: AddNoteTypePayload) => {
    try {
      setSubmitLoader(true)
      const response = editNoteType
        ? await updateNoteType({ observation_type_id: editNoteType?.id, type_name: formData?.type_name })
        : await addNoteTypes({
            type_name: formData?.type_name
          })
      if (response?.success) {
        reset(defaultValues)
        closeDrawer()
        Toaster({ type: 'success', message: response?.message })
        // await refetch()
        await invalidateNoteTypeCaches()
        router.push('/notes/masters/note-types/')
      } else {
        Toaster({ type: 'error', message: response?.message || t('notes_module.something_went_wrong') })
      }
    } catch (error: any) {
      console.error('Error adding note types:', error?.message || error)
    } finally {
      setSubmitLoader(false)
    }
  }

  const handleDelete = async () => {
    try {
      setSubmitLoader(true)

      // Check if there are child note types
      const childRes = await getChildNoteTypesList(String(editNoteType?.id))
      const childNoteTypes = childRes?.success ? childRes?.data : []

      if (childNoteTypes && childNoteTypes.length > 0) {
        setSubmitLoader(false)
        setDeleteNoteTypeOpen(false)
        Toaster({
          type: 'warning',
          message:
            t('notes_module.cannot_delete_note_type_with_children') ||
            'Cannot delete note type with child data. Please delete sub-note types first.'
        })
        return
      }

      const response = await deleteNoteType({ observation_type_id: editNoteType?.id as number })
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        reset(defaultValues)
        closeDrawer()
        await refetch()
        await invalidateNoteTypeCaches()
        router.push('/notes/masters/note-types/')
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

  useEffect(() => {
    if (editNoteType) {
      reset({ type_name: editNoteType?.type_name })
    }
  }, [editNoteType])

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
            {editNoteType ? t('notes_module.edit_note_type') : t('notes_module.add_note_type')}
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
              <ControlledTextField
                control={control}
                errors={errors}
                label={t('notes_module.note_type')}
                name='type_name'
                placeholder={t('notes_module.enter_note_type')}
                fullWidth
              />
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
          {editNoteType && (
            <LoadingButton
              variant='outlined'
              size='large'
              onClick={() => setDeleteNoteTypeOpen(true)}
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
                  backgroundColor: alpha(theme.palette.error.main, 0.2)
                }
              }}
            >
              {t('notes_module.delete_note_type')}
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

      {deleteNoteTypeOpen && (
        <ConfirmationDialog
          dialogBoxStatus={deleteNoteTypeOpen}
          onClose={() => setDeleteNoteTypeOpen(false)}
          title={'Delete Note Type?'}
          cancelText={'CANCEL'}
          confirmBtnStyle={{ background: theme.palette.customColors.Error, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          confirmAction={handleDelete}
          loading={submitLoader}
          ConfirmationText={'DELETE'}
          description={'Are you sure you want to delete this Note Type?'}
        />
      )}
    </>
  )
}

export default AddNoteTypeDrawer
