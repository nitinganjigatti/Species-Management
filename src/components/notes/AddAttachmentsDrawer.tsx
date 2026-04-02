'use client'

import { Drawer, Box, Typography, IconButton, Button } from '@mui/material'
import { Close as CloseIcon, AttachFile } from '@mui/icons-material'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import { useTheme } from '@mui/material/styles'
import { AddAttachmentsDrawerProps } from 'src/types/notes'

const AddAttachmentsDrawer: React.FC<AddAttachmentsDrawerProps> = ({open,onClose,control,watch,reset,attachmentsLoading,onAttachmentsSubmit}) => {
  const theme = useTheme() as any

  return (
    <Drawer
      anchor='right'
      open={open}
      ModalProps={{ keepMounted: true }}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 560 },
            height: 'auto',
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            bottom: 0,
            right: 0,
            top: 'auto',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            backgroundColor: theme.palette.background.paper
          }
        },
        backdrop: {
          sx: {
            backgroundColor: theme.palette.customColors.neutralTeritary
          }
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 4,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AttachFile sx={{ fontSize: 24, color: theme.palette.text.secondary }} />
          <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>Add Attachments</Typography>
        </Box>
        <IconButton size='small' onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 4 }}>
          <ControlledMultiFileUpload
            control={control}
            name='attachments'
            label='Upload attachments'
            acceptedFileTypes='*'
            preview
            previewPlacement='top'
            maxFiles={20}
          />
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: 4,
          p: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper
        }}
      >
        <Button fullWidth variant='outlined' onClick={() => reset({ attachments: [] })} disabled={attachmentsLoading}>
          Clear
        </Button>
        <Button
          fullWidth
          variant='contained'
          onClick={onAttachmentsSubmit}
          disabled={!watch('attachments')?.length || attachmentsLoading}
        >
          Upload
        </Button>
      </Box>
    </Drawer>
  )
}
export default AddAttachmentsDrawer