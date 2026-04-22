'use client'

import React from 'react'
import { Dialog, Box, Typography, TextField, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import CloseIcon from '@mui/icons-material/Close'
import CustomButtons from '../CustomButtons'

interface EditNotesProps {
  open: boolean
  onClose: () => void
  notes: string
  setNotes: (value: string) => void
  isUpdating?: boolean
  isDeleting?: boolean
  handleUpdate: () => void
  handleDelete: () => void
}

const EditNotes = ({ open, onClose, notes, setNotes, isUpdating, isDeleting, handleUpdate, handleDelete }: EditNotesProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()

  return (
    <Dialog
      open={open}

      // onClose={onClose}
      maxWidth='sm'
      fullWidth
      slotProps={{
        paper: {
          sx: {
            margin: 2,
            width: '100%',
            maxWidth: 570,
            height: 'auto',
            maxHeight: 'calc(100vh - 32px)',
            borderRadius: 2
          }
        }
      }}
    >
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.common.white
        }}
      >
        <Box sx={{ p: 6, pb: 2, borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}` }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box display='flex' alignItems='center' gap={3}>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{t('hospital_module.edit_notes')}</Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Box sx={{ p: 6, background: theme.palette.common.white }}>
            <TextField
              placeholder={(t('hospital_module.add_notes') as string)}
              fullWidth
              multiline
              rows={6}
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
              sx={{
                background: theme.palette.common.white
              }}
            />
          </Box>
        </Box>

        <Box sx={{ p: 4, borderTop: `1px solid ${theme.palette.customColors.OutlineVariant}` }}>
          <CustomButtons
            primaryLabel={t('update')}
            onPrimaryClick={handleUpdate}
            isPrimaryLoading={isUpdating}
            secondaryLabel={t('delete')}
            onSecondaryClick={handleDelete}
            secondaryVariant='danger'
            isSecondaryLoading={isDeleting}
          />
        </Box>
      </Box>
    </Dialog>
  )
}

export default React.memo(EditNotes)
