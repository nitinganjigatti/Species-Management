import React from 'react'
import { Box, Typography, Tooltip } from '@mui/material'
import { useTheme } from '@emotion/react'
import moment from 'moment'

const ObservationCard = ({ title, description, dateTime, containerStyle }) => {
  const theme = useTheme()

  const formatDateTime = dateTimeStr => {
    if (!dateTimeStr) return ''

    return moment(dateTimeStr).format('D MMM YYYY • h:mm A')
  }

  return (
    <Box sx={{ ...containerStyle }}>
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
        <Box sx={{ maxWidth: 300 }}>
          {`${description}`.split(',').map((item, index) => (
            <Typography
              key={index}
              sx={{
                fontSize: '14px',
                fontFamily: 'Inter',
                color: theme.palette.customColors.OnSurfaceVariant,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                whiteSpace: 'normal',
                mb: 0.5
              }}
            >
              • {item.trim()}
            </Typography>
          ))}
        </Box>
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
