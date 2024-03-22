// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import Icon from 'src/@core/components/icon'
import { auto } from '@popperjs/core'
import { Card, Typography, FormControlLabel, Checkbox, Grid } from '@mui/material'

const ModuleDeleteDialogConfirmation = ({ handleClosenew, open, message, action }) => {
  const [checked, setChecked] = useState(false)
  const handleChange = event => {
    setChecked(event.target.checked)
  }
  const handleNoClick = () => {
    handleClosenew()
    setChecked(false)
  }
  return (
    <Fragment>
      <Dialog
        open={open}
        disableEscapeKeyDown
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') {
            handleClose()
          }
        }}
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: '#fff',
            padding: 8,
            textAlign: 'center'
          }
        }}
      >
        <span
          style={{
            background: '#0000000f',
            marginLeft: 'auto',
            marginRight: 'auto',
            textAlign: 'center',
            borderRadius: '10px',
            padding: '10px',
            width: '84px',
            height: '84px',
            padding: '12px 10px 10px 10px',
            marginTop: '20px',
            marginBottom: '15px'
          }}
        >
          <Icon icon='mdi:warning-outline' style={{ cursor: 'pointer', fontSize: '63px', color: '#E93353' }} />
        </span>
        <DialogTitle id='alert-dialog-title'>
          {message}
          <Typography sx={{ mt: 2 }}>
            This ingredient has been used in 15 recipes and <br /> 10 diets, so deletion isn't allowed.
          </Typography>
        </DialogTitle>

        <Card
          sx={{
            mb: 4,
            boxShadow: 'none',
            background: '#666cff17',
            textAlign: 'left',
            pl: 5,
            borderRadius: '5px',
            height: 160
          }}
        >
          <Grid>
            <Typography sx={{ fontSize: 15, pt: 6 }}>
              <FormControlLabel
                label={
                  <span style={{ fontSize: '15px', color: '#000', fontWeight: 500 }}>
                    Deactivate this ingredient in all records
                  </span>
                }
                control={<Checkbox name='controlled' checked={checked} onChange={handleChange} />}
              />
            </Typography>
            <Grid item>
              <Typography sx={{ fontSize: 14, pl: 7, pb: 6 }}>
                Deactivating this ingredient prevents its addition to <br /> new recipes or diets, but you can swap it{' '}
                <br /> with another ingredient.
              </Typography>
            </Grid>
          </Grid>
        </Card>

        <DialogActions
          className='dialog-actions-dense'
          sx={{ justifyContent: 'flex-start', marginLeft: auto, marginRight: auto, marginTop: 2 }}
        >
          <Button size='large' variant='outlined' sx={{ width: 200 }} onClick={handleNoClick}>
            Cancel
          </Button>
          <Button
            size='large'
            variant='contained'
            sx={{ width: 200, mr: 3 }}
            onClick={() => {
              action()
            }}
            disabled={checked === true ? false : true}
          >
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}

export default ModuleDeleteDialogConfirmation
