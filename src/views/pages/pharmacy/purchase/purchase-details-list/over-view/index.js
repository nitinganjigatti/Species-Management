import { Avatar, Typography } from '@mui/material'

;<Avatar>
  <Typography
    variant='body2'
    component='span'
    sx={{
      color: '#44B700',
      fontSize: '12px',
      fontWeight: 400,
      fontFamily: 'Inter'
    }}
  >
    {row.created_by}
  </Typography>
</Avatar>
