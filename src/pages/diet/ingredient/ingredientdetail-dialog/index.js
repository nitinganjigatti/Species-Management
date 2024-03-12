// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import { Avatar, Button, Card, CardContent, Grid, Box, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import CustomChip from 'src/@core/components/mui/chip'
import Icon from 'src/@core/components/icon'

// Styled Grid component
const StyledGrid = styled(Grid)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  [theme.breakpoints.down('md')]: {
    borderBottom: `1px solid ${theme.palette.divider}`
  },
  [theme.breakpoints.up('md')]: {
    borderRight: `1px solid ${theme.palette.divider}`
  }
}))

const roleColors = {
  active: 'success',
  inactive: 'error'
}

const IngredientDetailDialog = ({ open, handleClose }) => {
  //   const handleClickOpen = () => setOpen(true)
  const [expanded, setExpanded] = useState(false)
  const toggleExpanded = () => {
    setExpanded(!expanded)
    window.scroll(0, 0)
  }
  const handleClosebtn = () => {
    handleClose()
    setExpanded(false)
  }

  return (
    <Fragment>
      <Button variant='outlined'>Open dialog</Button>
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
      >
        <DialogTitle id='alert-dialog-title' variant='h5'>
          Ingredient <Icon icon='bx:pencil' style={{ float: 'right', cursor: 'pointer' }} />
        </DialogTitle>

        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            <Card sx={{ boxShadow: 'none' }}>
              <Grid container spacing={6}>
                <StyledGrid item md={3} xs={12} style={{ borderRight: 'none' }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div
                      style={{
                        background: '#E8F4F2',
                        borderRadius: '8px',
                        padding: '18px',
                        width: '100px',
                        height: '100px',
                        marginLeft: '15px'
                      }}
                    >
                      <img
                        width={60}
                        height={60}
                        // alt='Apple iPhone 11 Pro'
                        src='https://gallery.yopriceville.com/var/resizes/Free-Clipart-Pictures/Fruit-PNG/Large_Painted_Red_Apple_PNG_Clipart.png?m=1507172114'
                      />
                    </div>
                  </CardContent>
                </StyledGrid>
                <Grid
                  item
                  md={9}
                  xs={12}
                  sx={{
                    pt: theme => ['0 !important', '0 !important', `${theme.spacing(6)} !important`],
                    pl: theme => [`${theme.spacing(6)} !important`, `${theme.spacing(6)} !important`, '0 !important']
                  }}
                >
                  <CardContent style={{ width: '400px' }}>
                    <Typography variant='h6' sx={{ mb: 1 }}>
                      Apple
                    </Typography>
                    <Typography variant='body2' sx={{ mb: 2 }}>
                      ING022
                    </Typography>
                    <Typography sx={{ mb: 2 }}>
                      <CustomChip
                        skin='light'
                        size='small'
                        label={'Active'}
                        // color={FeedDetailsValue?.active === 1 ? roleColors.active : roleColors.inactive}
                        sx={{
                          height: 20,
                          fontWeight: 600,
                          borderRadius: '5px',
                          fontSize: '0.875rem',
                          textTransform: 'capitalize',
                          '& .MuiChip-label': { mt: -0.25 }
                        }}
                      />
                    </Typography>
                  </CardContent>
                </Grid>
              </Grid>
            </Card>
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                mt: 10
              }}
            >
              <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column' }}>
                <Typography variant='body2' sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Feed Type
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant='body2' sx={{ mr: 1.5, color: '#7A8684' }}>
                  Fruits
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                my: 3
              }}
            >
              <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column' }}>
                <Typography variant='body2' sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Unit of Measurement
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant='body2' sx={{ mr: 1.5, color: '#7A8684' }}>
                  Gram (g)
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                my: 3
              }}
            >
              <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column' }}>
                <Typography variant='body2' sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Standard Unit:
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant='body2' sx={{ mr: 1.5, color: '#7A8684' }}>
                  100
                </Typography>
              </Box>
            </Box>

            <Card sx={{ backgroundColor: '#0000000f', boxShadow: 'none', mt: 8 }}>
              <Grid container spacing={6}>
                <Grid
                  item
                  md={12}
                  xs={12}
                  mx={5}
                  sx={{
                    pt: theme => ['0 !important', '0 !important', `${theme.spacing(6)} !important`],
                    pl: theme => [`${theme.spacing(6)} !important`, `${theme.spacing(6)} !important`, '0 !important']
                  }}
                >
                  <CardContent sx={{ width: '560px' }}>
                    <Typography sx={{ mb: 2, fontSize: '16px', fontWeight: '600' }}>Description</Typography>
                    <Typography
                      variant='body2'
                      sx={{
                        width: '100%',
                        color: '#7A8684',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: expanded ? 'unset' : 3,
                        WebkitBoxOrient: 'vertical',
                        transition: 'max-height 2s ease-in-out',
                        maxHeight: expanded ? '1000px' : '60px'
                      }}
                    >
                      Provide Provide Provide Provide Provide Provide Provide Provide Provide Pro v ide Provide Provide
                      Provide Provide Provide Provide Provide Provide Provide Provide Provide Provide Pro v ide Provide
                      Provide Provide Provide Provide Provide Provide Provide Provide Provide Provide Provide Pro v ide
                      Provide Provide Provide Provide Provide Provide Provide Provide Provide Provide Provide Provide
                      Pro v ide Provide Provide Provide Provide Provide Provide Provide Provide Provide Provide Provide
                      Provide Pro v ide Provide Provide Provide
                    </Typography>
                    <Typography
                      onClick={toggleExpanded}
                      sx={{
                        mt: 1,
                        fontWeight: '600',
                        fontSize: '13px',
                        textDecoration: 'underline',
                        color: '#000',
                        cursor: 'pointer',
                        float: 'right',
                        paddingBottom: '30px'
                      }}
                    >
                      {expanded ? 'View less' : 'View more'}
                    </Typography>
                  </CardContent>
                </Grid>
              </Grid>
            </Card>
          </DialogContentText>
        </DialogContent>
        <DialogActions className='dialog-actions-dense'>
          {/* <Button onClick={handleClose}>Disagree</Button> */}
          <Button onClick={handleClosebtn}>Go Back</Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}

export default IngredientDetailDialog
