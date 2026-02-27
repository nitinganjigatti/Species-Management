import React from 'react'
import { Dialog, DialogTitle, DialogContent, IconButton, Box, Typography, Button } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'

const ConfirmationDeleteDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  confirmLoading,
  confirmText = 'Delete',
  cancelText = 'Cancel'
}) => {
  const theme = useTheme()
  
return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        <IconButton
          aria-label='close'
          onClick={onClose}
          sx={{ top: 10, right: 10, position: 'absolute', color: 'grey.500' }}
        >
          <Icon icon='mdi:close' />
        </IconButton>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            alignItems: 'center'
          }}
        >
          <Box
            sx={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: theme?.palette?.customColors?.mdAntzNeutral || 'transparent'
            }}
          >
            <Icon width='70px' height='70px' color={'#ff3838'} icon={'mdi:delete'} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: 24, textAlign: 'center', mb: '12px' }}>{title}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
            <Button
              disabled={confirmLoading}
              onClick={onClose}
              variant={'outlined'}
              sx={{ color: 'gray', width: '45%' }}
            >
              {cancelText}
            </Button>

            <LoadingButton
              loading={confirmLoading}
              size='large'
              variant={'contained'}
              sx={{ width: '45%' }}
              onClick={onConfirm}
            >
              {confirmText}
            </LoadingButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent />
    </Dialog>
  )
}

export default ConfirmationDeleteDialog
