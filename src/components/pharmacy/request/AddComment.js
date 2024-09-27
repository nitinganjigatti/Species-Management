import { CardContent, Grid, Typography, Button, CardActions, Divider } from '@mui/material'

const AddComment = ({ expandedText, handleClose }) => {
  return (
    <>
      <Divider />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Grid sx={{ mt: 2, position: 'relative', right: 8 }}>
              <Typography sx={{ fontSize: '16px', fontFamily: 'Inter', fontWeight: 500 }}>{expandedText}</Typography>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
      {/* Card Footer with Cancel Button */}
      <CardActions style={{ justifyContent: 'flex-end', position: 'relative', marginTop: '-2px' }}>
        <Button sx={{ position: 'relative', bottom: '-40px', left: '25px' }} variant='contained' onClick={handleClose}>
          Cancel
        </Button>
      </CardActions>
    </>
  )
}

export default AddComment
