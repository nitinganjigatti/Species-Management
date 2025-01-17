import { Typography, Box, Avatar } from '@mui/material'
import CustomAvatar from 'src/@core/components/mui/avatar'
import Utility from 'src/utility'

export const getEllipsisStyleForText = width => {
  return {
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    maxWidth: width ? `${width}px` : '250px',
    display: 'inline-block',
    lineHeight: 'normal',
    textAlign: 'center',
    verticalAlign: 'middle'
  }
}

export const renderControlLabel = (condition, label) =>
  condition ? (
    <Typography
      sx={{
        height: '16px',
        width: '18px',
        backgroundColor: 'error.main',
        fontWeight: 'bold',
        fontSize: '10px',
        color: 'white',
        padding: '2px',
        borderRadius: '2px',
        lineHeight: '12px',
        textAlign: 'center',
        mr: 1,
        display: 'inline-block',
        verticalAlign: 'middle'
      }}
    >
      {label}
    </Typography>
  ) : null

export const pageTitle = title => (
  <Typography sx={{ fontSize: { xs: '20px', md: '24px' }, fontFamily: 'Inter', fontWeight: 500, ml: 1 }}>
    {title}
  </Typography>
)

export function renderUserAvatarDetails(image, userName, date) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {image ? (
        <CustomAvatar src={image} sx={{ mr: '16px', width: '40px', height: '40px' }} />
      ) : (
        <CustomAvatar sx={{ mr: '16px', width: '40px', height: '40px', fontSize: '.8rem' }}></CustomAvatar>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant='subtitle2' sx={{ color: 'text.primary' }}>
          {userName ? userName : 'NA'}
        </Typography>
        <Typography variant='caption' sx={{ lineHeight: 1.6667 }}>
          {date ? Utility?.formatDisplayDate(date) : 'NA'}
        </Typography>
      </Box>
    </Box>
  )
}

export function getPriorityIcons(priority) {
  if (priority === 'high') {
    return <Avatar src={'/images/High_Priority.png'} style={{ width: '24px', height: '24px' }} />
  } else if (priority === 'emergency') {
    return <Avatar src={'/images/Emergency.png'} style={{ width: '24px', height: '24px' }} />
  } else return null
}

// src={'/images/Empty-Box.png'}

const RenderUtility = {
  getEllipsisStyleForText,
  renderControlLabel,
  pageTitle,
  renderUserAvatarDetails,
  getPriorityIcons
}

export default RenderUtility
