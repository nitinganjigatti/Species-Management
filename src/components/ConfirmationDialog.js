// ** React Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import { Button, DialogActions, DialogContentText, DialogTitle, Grid } from '@mui/material'
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
        <DialogTitle id='alert-dialog-title'>{title}</DialogTitle>
        {/* <DialogContentText sx={{ textAlign: 'center', pt: 3 }}>{title}</DialogContentText> */}
        <DialogContent>{content}</DialogContent>
        <Box sx={{ display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
          {/* <DialogContentText sx={{ ml: 5 }}>Confirm to proceed</DialogContentText> */}
          <DialogActions className='dialog-actions-dense'>
            <Grid>
              <Button sx={{ mr: 2 }} variant='contained' size='small' onClick={() => action()}>
                Confirm
              </Button>
              <Button variant='outlined' size='small' onClick={() => closeDialog()}>
                Close
              </Button>
            </Grid>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  )
}

export default ConfirmDialog
