import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  CircularProgress
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@emotion/react'
import { Theme } from '@mui/material/styles'
import type { Note } from 'src/types/housing'

interface CommentSubmitData {
  observation_id: number
  notes: string
}

interface NoteCommentDialogProps {
  open: boolean
  onClose: () => void
  note: Note | null
  onSubmit: (data: CommentSubmitData) => void
  loading?: boolean
}

const NoteCommentDialog: React.FC<NoteCommentDialogProps> = ({ open, onClose, note, onSubmit, loading = false }) => {
  const theme = useTheme() as Theme
  const { t } = useTranslation()
  const [comment, setComment] = useState('')

  const handleSubmit = () => {
    if (comment.trim() && note?.observation_id) {
      onSubmit({
        observation_id: note.observation_id,
        notes: comment.trim()
      })
    }
  }

  const handleClose = () => {
    setComment('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='h6'>{t('housing_module.add_comment')}</Typography>
          <IconButton onClick={handleClose} size='small'>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant='body2' color='text.secondary' gutterBottom>
            {t('housing_module.adding_comment_to')}
          </Typography>
          <Typography variant='subtitle2'>
            {(note as any)?.child_master_type?.parent_observation_type || 'Note'} - NOTE-{note?.observation_id}
          </Typography>
        </Box>

        <TextField
          autoFocus
          fullWidth
          multiline
          rows={4}
          label={t('housing_module.your_comment') as string}
          placeholder={t('housing_module.write_comment_placeholder') as string}
          value={comment}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComment(e.target.value)}
          variant='outlined'
        />
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} color='inherit'>
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={!comment.trim() || loading}
          startIcon={loading && <CircularProgress size={16} color='inherit' />}
        >
          {loading ? t('submitting') : t('submit')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default NoteCommentDialog
