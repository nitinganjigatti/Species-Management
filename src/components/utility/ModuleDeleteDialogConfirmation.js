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

const ModuleDeleteDialogConfirmation = ({
  active,
  handleClosenew,
  open,
  message,
  action,
  type,
  dietCount,
  ingredientCount
}) => {
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
          {type === 'ingredient' ? (
            <Icon icon='mdi:warning-outline' style={{ cursor: 'pointer', fontSize: '63px', color: '#E93353' }} />
          ) : (
            <Icon icon='mdi:warning-outline' style={{ cursor: 'pointer', fontSize: '63px', color: '#E93353' }} />
          )}
        </span>
        <DialogTitle id='alert-dialog-title'>
          {message}
          {type === 'feed' ? (
            <Typography sx={{ mt: 2 }}>
              this feed type is not used in any recipe, <br />
              so deletion isn't allowed.
            </Typography>
          ) : (
            <Typography sx={{ mt: 2 }}>
              This {type === 'ingredient' ? 'ingredient' : 'recipe'} has been used in{' '}
              {type === 'ingredient'
                ? '15 recipes and 10 diets'
                : `${dietCount} diets and ${ingredientCount} ingredients`}
              , <br /> so deletion isn't allowed.
            </Typography>
          )}
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
                    {active ? 'Deactivate' : 'Activate'} this {type === 'ingredient' ? 'ingredient' : 'recipe'} in all
                    records
                  </span>
                }
                control={<Checkbox name='controlled' checked={checked} onChange={handleChange} />}
              />
            </Typography>
            <Grid item>
              <Typography sx={{ fontSize: 14, pl: 7, pb: 6 }}>
                {active ? 'Deactivating' : 'Activating'} this {type === 'ingredient' ? 'ingredient' : 'recipe'} prevents
                its addition to <br /> new {type === 'ingredient' ? 'recipes or' : ''} diets, but you can swap it{' '}
                {type === 'ingredient' ? <br /> : ''} with another {type === 'ingredient' ? 'ingredient' : 'recipe'}.
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
              setTimeout(() => {
                setChecked(false)
              }, 2000)
            }}
            disabled={checked === true ? false : true}
          >
            {active ? 'Deactivate' : 'Activate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}

export default ModuleDeleteDialogConfirmation
