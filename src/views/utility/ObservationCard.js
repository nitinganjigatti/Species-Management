import React from 'react'
import { Box, Typography, Tooltip } from '@mui/material'
import { useTheme } from '@emotion/react'
import moment from 'moment'

const ObservationCard = ({ title, description, dateTime }) => {
  const theme = useTheme()

  const formatDateTime = dateTimeStr => {
    if (!dateTimeStr) return ''
    return moment(dateTimeStr).format('D MMM YYYY • h:mm A')
  }
  return (
    <Box>
      <Typography
        sx={{
          fontSize: '16px',
          fontFamily: 'Inter',
          fontWeight: 500,
          color: theme.palette.customColors.OnSurfaceVariant
        }}
      >
        {title}
      </Typography>

      <Tooltip title={description} arrow>
        <Typography
          sx={{
            fontSize: '14px',
            fontFamily: 'Inter',
            color: theme.palette.customColors.OnSurfaceVariant,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 300, // Adjust as needed
            whiteSpace: 'normal',
            mb: 0.5
          }}
        >
          {'• ' + `${description}`.split(',').join(' • ')}
        </Typography>
      </Tooltip>

      <Typography
        sx={{
          fontSize: '12px',
          fontWeight: 400,
          fontFamily: 'Inter',
          color: theme.palette.customColors.OnSurfaceVariant
        }}
      >
        {formatDateTime(dateTime)}
      </Typography>
    </Box>
  )
}

export default ObservationCard
