// ** React Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import { Button, DialogActions, DialogContentText } from '@mui/material'
import { Box } from '@mui/system'

const ConfirmDialog = ({ title, closeDialog, open, action, content }) => {
  return (
    <>
      <Dialog
        open={open}
        disableEscapeKeyDown
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') {
            closeDialog()
          }
        }}
      >
        <DialogContentText sx={{ textAlign: 'center', pt: 3 }}>{title}</DialogContentText>
        <DialogContent>{content}</DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 7 }}>
          <DialogContentText sx={{ ml: 5 }}>Confirm to proceed</DialogContentText>
          <DialogActions className='dialog-actions-dense'>
            <Box sx={{ display: 'flex', gap: 4, mt: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
              <Button variant='contained' onClick={() => action()}>
                Confirm
              </Button>
              <Button variant='outlined' onClick={() => closeDialog()}>
                Close
              </Button>
            </Box>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  )
}

export default ConfirmDialog
