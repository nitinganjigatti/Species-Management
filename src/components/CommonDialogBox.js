// ** React Imports
import { forwardRef } from 'react'

// ** MUI Imports

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'

import Dialog from '@mui/material/Dialog'

import IconButton from '@mui/material/IconButton'

import Fade from '@mui/material/Fade'
import DialogContent from '@mui/material/DialogContent'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { CardContent, CardHeader } from '@mui/material'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

const CommonDialogBox = ({ title, dialogBoxStatus, formComponent, close, noWidth }) => {
  return (
    <Dialog
      fullWidth={noWidth ? false : true}
      open={dialogBoxStatus}
      maxWidth='md'
      height='auto'
      scroll='body'
      onClose={() => close()}
      TransitionComponent={Transition}
    >
      <Card>
        {/* <Grid
          container
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        > */}
        {title && (
          <CardHeader
            title={title ? title : null}
            action={
              <IconButton size='small' onClick={() => close()} sx={{ mx: 4 }}>
                <Icon icon='mdi:close' />
              </IconButton>
            }
          />
        )}

        <CardContent

        // sx={{
        //   position: 'relative',
        //   height: 'auto'

        // pb: theme => `${theme.spacing(8)} !important`,

        // px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
        // pt: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
        // }}
        >
          {/* <Grid container spacing={6}> */}
          <>{formComponent ? formComponent : null}</>
          {/* </Grid> */}
          {/* </Grid> */}
        </CardContent>
      </Card>
    </Dialog>
  )
}

export default CommonDialogBox
