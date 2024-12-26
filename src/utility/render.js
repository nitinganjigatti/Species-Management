import { Typography } from '@mui/material'

import { textAlign } from '@mui/system'

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

const RenderUtility = {
  getEllipsisStyleForText,
  renderControlLabel,
  pageTitle
}

export default RenderUtility
