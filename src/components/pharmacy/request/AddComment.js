import { CardContent, Grid, Typography, Button, CardActions, Divider } from '@mui/material'

const AddComment = ({ expandedText, handleClose }) => {
  return (
    <>
    <Divider sx={{mb:-6}}/>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Grid sx={{position:"relative", right:10}}>
             
              <Typography sx={{ fontSize: '20px', fontFamily: 'inter', fontWeight: 500,mt:5 }}>Description</Typography>
            </Grid>
            <Grid sx={{mt:2,position:"relative", right:8}}>
           
              <Typography sx={{ fontSize: '16px', fontFamily: 'inter', fontWeight: 400 }}>{expandedText}</Typography>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>

      {/* Card Footer with Cancel Button */}
      <CardActions style={{ justifyContent: 'flex-end', position: 'relative', top: '20px' }}>
        <Button variant='contained' onClick={handleClose}>
          Cancel
        </Button>
      </CardActions>
    </>
  )
}

export default AddComment
