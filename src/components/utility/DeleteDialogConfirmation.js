// // ** React Imports
// import { Fragment, useEffect, useState } from 'react'

// // ** MUI Imports
// import Button from '@mui/material/Button'
// import Dialog from '@mui/material/Dialog'
// import DialogTitle from '@mui/material/DialogTitle'
// import DialogActions from '@mui/material/DialogActions'
// import Icon from 'src/@core/components/icon'
// import { auto } from '@popperjs/core'
// import { Card, Typography, FormControlLabel, Checkbox, Grid, Avatar } from '@mui/material'

// const DeleteDialogConfirmation = ({
//   active,
//   handleClosenew,
//   open,
//   typeCount,
//   dietCount,
//   recipeCount,
//   message,
//   action,
//   type
// }) => {
//   const [checked, setChecked] = useState(false)

//   const handleChange = event => {
//     setChecked(event.target.checked)
//   }

//   const handleNoClick = () => {
//     handleClosenew()
//     setChecked(false)
//   }

//   return (
//     <Fragment>
//       <Dialog
//         open={open}
//         disableEscapeKeyDown
//         aria-labelledby='alert-dialog-title'
//         aria-describedby='alert-dialog-description'
//         onClose={(event, reason) => {
//           if (reason !== 'backdropClick') {
//             handleClose()
//           }
//         }}
//         sx={{
//           '& .MuiDialog-paper': {
//             backgroundColor: '#fff',
//             padding: 8,
//             textAlign: 'center'
//           }
//         }}
//       >
//         <span
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             background: '#0000000f',
//             marginLeft: 'auto',
//             marginRight: 'auto',
//             textAlign: 'center',
//             borderRadius: '10px',
//             padding: '10px',
//             width: '84px',
//             height: '84px',
//             padding: '12px 10px 10px 10px',
//             marginTop: '20px',
//             marginBottom: '15px'
//           }}
//         >
//           {type === 'ingredient' || 'feed' ? (
//             <img src='/icons/grocery.svg' alt='Grocery Icon' width='40' height='40' />
//           ) : (
//             <img src='/icons/grocery.svg' alt='Grocery Icon' width='40' height='40' />
//           )}
//         </span>
//         <DialogTitle id='alert-dialog-title'>
//           <span style={{ fontSize: '24px', fontWeight: '600', lineHeight: '1px' }}>
//             {active === '1' ? 'Deactivate' : 'Activate'}{' '}
//             {type === 'ingredient' ? 'Ingredient' : type === 'feed' ? 'Feed' : 'Recipe'}?
//           </span>
//           <Typography sx={{ mt: 2 }}>
//             {active === '1' ? 'Deactivating' : 'Activating'} this{' '}
//             {type === 'ingredient' ? 'ingredient' : type === 'feed' ? 'feed' : 'recipe'} prevents its addition to new{' '}
//             <br /> {type === 'ingredient' ? 'recipes or diets.' : 'ingredients'}
//           </Typography>
//         </DialogTitle>

//         <Card
//           sx={{
//             mb: 4,
//             boxShadow: 'none',
//             background: '#ffbda83d',
//             textAlign: 'left',
//             pl: 5,
//             borderRadius: '5px',
//             height: 130
//           }}
//         >
//           <Typography sx={{ color: '#FA6140', pt: 6, fontSize: 14, fontWeight: 600 }}>
//             This {type === 'ingredient' ? 'ingredient' : type === 'feed' ? 'feed' : 'recipe'} is part of{' '}
//             {type === 'ingredient'
//               ? `${recipeCount} recipes and ${dietCount} diets.`
//               : type === 'feed'
//               ? `${typeCount}  Ingredients`
//               : `${dietCount} diets`}
//           </Typography>
//           <Grid>
//             <Typography sx={{ fontSize: 15 }}>
//               <FormControlLabel
//                 label={
//                   <span style={{ fontSize: '15px', color: '#000', fontWeight: 500 }}>
//                     {active === '1' ? 'Deactivate' : 'Activate'} this{' '}
//                     {type === 'ingredient' ? 'ingredient' : type === 'feed' ? 'feed' : 'recipe'} in all records
//                   </span>
//                 }
//                 control={<Checkbox name='controlled' checked={checked} onChange={handleChange} />}
//               />
//             </Typography>
//             {type !== 'feed' && (
//               <Grid item>
//                 <Typography sx={{ fontSize: 14, pl: 7, lineHeight: 0 }}>
//                   Option to swap it with another{' '}
//                   {type === 'ingredient' ? 'ingredient' : type === 'feed' ? 'feed' : 'recipe'} is still possible
//                 </Typography>
//               </Grid>
//             )}
//           </Grid>
//         </Card>

//         <DialogActions
//           className='dialog-actions-dense'
//           sx={{ justifyContent: 'flex-start', marginLeft: auto, marginRight: auto, marginTop: 2 }}
//         >
//           <Button size='large' variant='outlined' sx={{ width: 200 }} onClick={handleNoClick}>
//             Cancel
//           </Button>
//           <Button
//             size='large'
//             variant='contained'
//             sx={{ width: 200, mr: 3 }}
//             onClick={() => {
//               action()
//               setChecked(false)
//             }}
//             disabled={checked === true ? false : true}
//           >
//             {/* {active === 1 ? 'Activate' : 'Deactivate'} */}
//             {active === '1' ? 'Deactivate' : 'Activate'}
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Fragment>
//   )
// }

// export default DeleteDialogConfirmation

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

const DeleteDialogConfirmation = ({
  active,
  handleClosenew,
  open,
  typeCount,
  dietCount,
  recipeCount,
  message,
  action,
  actionType,
  ingredientCount,
  type
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
          {type === 'ingredient' || 'feed' ? (
            <Icon icon='mdi:warning-outline' style={{ cursor: 'pointer', fontSize: '63px', color: '#E93353' }} />
          ) : (
            <Icon icon='mdi:warning-outline' style={{ cursor: 'pointer', fontSize: '63px', color: '#E93353' }} />
          )}
        </span>
        <DialogTitle id='alert-dialog-title'>
          {message}

          {type === 'diet' ? null : (
            <Typography sx={{ mt: 2 }}>
              This{' '}
              {type === 'ingredient' ? 'ingredient' : type === 'feed' ? 'feed' : type === 'diet' ? 'diet' : 'recipe'}{' '}
              has been used in{' '}
              {type === 'ingredient'
                ? `${recipeCount} recipes and ${dietCount} diets.`
                : type === 'feed'
                ? `${typeCount}  Ingredients`
                : type === 'diet'
                ? `${dietCount} diets and ${ingredientCount} ingredients`
                : `${dietCount} diets and ${ingredientCount} ingredients`}
              <br />
              {actionType === 'confirm' ? `so deletion isn't allowed.` : ''}
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
            height: type === 'diet' ? 42 : 120
          }}
        >
          {type === 'diet' ? null : (
            <Typography sx={{ pt: 6, fontSize: 14, fontWeight: 600 }}>
              This {type === 'ingredient' ? 'ingredient' : type === 'feed' ? 'feed' : 'recipe'} is part of{' '}
              {type === 'ingredient'
                ? `${recipeCount} recipes and ${dietCount} diets.`
                : type === 'feed'
                ? `${typeCount}  Ingredients`
                : `${dietCount} diets and ${ingredientCount} ingredients`}
            </Typography>
          )}
          <Grid>
            {console.log(active, 'active')}
            <Typography sx={{ fontSize: 15 }}>
              <FormControlLabel
                label={
                  <span style={{ fontSize: '15px', color: '#000', fontWeight: 500 }}>
                    {Number(active) === 1 ? 'Deactivate' : 'Activate'} this{' '}
                    {type === 'ingredient'
                      ? 'ingredient'
                      : type === 'feed'
                      ? 'feed'
                      : type === 'diet'
                      ? 'diet'
                      : 'recipe'}{' '}
                    in all records
                  </span>
                }
                control={<Checkbox name='controlled' checked={checked} onChange={handleChange} />}
              />
            </Typography>
            {type === 'feed' || type === 'diet' ? null : (
              <Grid sx={{ alignItems: 'center' }} item>
                <Typography sx={{ fontSize: 14, pl: 7, lineHeight: 0 }}>
                  Option to swap it with another{' '}
                  {type === 'ingredient' ? 'ingredient' : type === 'feed' ? 'feed' : 'recipe'} is still possible
                </Typography>
              </Grid>
            )}
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
              setChecked(false)
            }}
            disabled={checked === true ? false : true}
          >
            {Number(active) === 1 ? 'Deactivate' : 'Activate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}

export default DeleteDialogConfirmation
