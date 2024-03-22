// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import { Button, Card, CardContent, Grid, Box, Typography, Avatar } from '@mui/material'
import { styled } from '@mui/material/styles'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import CustomChip from 'src/@core/components/mui/chip'
import Icon from 'src/@core/components/icon'
import DeleteDialogConfirmation from 'src/components/utility/DeleteDialogConfirmation'
import Router from 'next/router'

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

const IngredientDetailDialog = ({ open, handleClose, setOpen, IngredientRowVal }) => {
  const [deleteDialogBox, setDeleteDialogBox] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const convertToTitleCase = str => {
    if (!str) return ''

    const firstLetter = str.charAt(0).toUpperCase()
    const restOfWord = str.slice(1).toLowerCase()

    return firstLetter + restOfWord
  }

  const handleClickOpen = () => {
    handleClose()
    setDeleteDialogBox(true)
  }

  const handleClosenew = () => {
    setDeleteDialogBox(false)
    setOpen(true)
  }

  const toggleExpanded = () => {
    setExpanded(!expanded)
    window.scroll(0, 0)
  }

  const handleClosebtn = () => {
    handleClose()
    setExpanded(false)
  }

  // delete
  //   const confirmDeleteAction = async () => {
  //     // console.log(deleteRowId)
  //     const response = await deleteMedicineConfig(deleteRowId)

  //     // console.log('afterdelte', response)

  //     if (response?.success === true) {
  //       toast.success(response?.data)
  //       configureMedicine(configureMedId)
  //       reset(defaultValues)
  //       handleClose()

  //       setDeleteRowId('')
  //     } else {
  //       handleClose()
  //       toast.error(response?.message)
  //     }
  //   }

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
      >
        <DialogTitle id='alert-dialog-title' variant='h5'>
          Ingredient
          <Icon
            icon='material-symbols:delete-outline'
            style={{ float: 'right', cursor: 'pointer', marginLeft: '15px' }}
            onClick={() => {
              handleClickOpen()
            }}
          />
          <Icon
            onClick={() =>
              Router.push({ pathname: '/diet/ingredient/add-ingredient', query: { id: IngredientRowVal?.id } })
            }
            icon='bx:pencil'
            style={{ float: 'right', cursor: 'pointer' }}
          />
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
                      <Avatar
                        variant='square'
                        alt='Ingredient Image'
                        sx={{
                          width: 60,
                          height: 60
                        }}
                        src={IngredientRowVal.ingredient_image ? IngredientRowVal.ingredient_image : null}
                      >
                        {IngredientRowVal.ingredient_image ? null : <Icon icon='noto:red-apple' fontSize={'94px'} />}
                      </Avatar>
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
                      {IngredientRowVal.ingredient_name ?? '-'}
                    </Typography>
                    <Typography variant='body2' sx={{ mb: 2 }}>
                      {'ING' + IngredientRowVal.id ?? '-'}
                    </Typography>
                    <Typography sx={{ mb: 2 }}>
                      <CustomChip
                        skin='light'
                        size='small'
                        label={IngredientRowVal.active === '1' ? 'Active' : 'InActive'}
                        color={IngredientRowVal?.active === '1' ? roleColors.active : roleColors.inactive}
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
                  {IngredientRowVal.feed_type}
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
                  {IngredientRowVal.uom === 'gm' ? 'Gram (g)' : IngredientRowVal.uom}
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
                  {IngredientRowVal.standard_unit}
                </Typography>
              </Box>
            </Box>
            {IngredientRowVal.desc ? (
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
                        {convertToTitleCase(IngredientRowVal.desc)}
                      </Typography>
                      {IngredientRowVal.desc.length > 180 ? (
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
                      ) : (
                        ''
                      )}
                    </CardContent>
                  </Grid>
                </Grid>
              </Card>
            ) : (
              ''
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions className='dialog-actions-dense'>
          <Button onClick={handleClosebtn}>Go Back</Button>
        </DialogActions>
      </Dialog>
      <DeleteDialogConfirmation
        handleClosenew={handleClosenew}
        handleClosebtn={handleClosebtn}
        //action={confirmDeleteAction}
        open={deleteDialogBox}
        message={
          <span style={{ fontSize: '24px', fontWeight: '600', lineHeight: '1px' }}>
            Are you sure you want to delete this <br /> ingredient?
          </span>
        }
      />
    </Fragment>
  )
}

export default IngredientDetailDialog
