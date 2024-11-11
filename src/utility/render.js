import { Typography } from '@mui/material'

export const getEllipsisStyleForText = width => {
  return {
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    maxWidth: width ? `${width}px` : '250px',
    display: 'inline-block',
    lineHeight: 'normal'
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

const RenderUtility = {
  getEllipsisStyleForText,
  renderControlLabel
}

export default RenderUtility
