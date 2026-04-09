'use client'

import React from 'react'
import { Dialog, Box, Typography, TextField, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import CustomButtons from '../CustomButtons'

const EditNotes = ({ open, onClose, notes, setNotes, isUpdating, isDeleting, handleUpdate, handleDelete }) => {
  const theme = useTheme()

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
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>Edit Notes</Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Box sx={{ p: 6, background: theme.palette.common.white }}>
            <TextField
              placeholder='Add notes'
              fullWidth
              multiline
              rows={6}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              sx={{
                background: theme.palette.common.white
              }}
            />
          </Box>
        </Box>

        <Box sx={{ p: 4, borderTop: `1px solid ${theme.palette.customColors.OutlineVariant}` }}>
          <CustomButtons
            primaryLabel='Update'
            onPrimaryClick={handleUpdate}
            isPrimaryLoading={isUpdating}
            secondaryLabel='Delete'
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
