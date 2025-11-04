import React from 'react'
import { Box, Typography, Tooltip } from '@mui/material'
import { useTheme } from '@emotion/react'
import Utility from 'src/utility'

const ObservationCard = ({ title, description, dateTime, containerStyle }) => {
  const theme = useTheme()

  const formatDateTime = dateTime => {
    const formattedDateStr = Utility.convertUTCToLocalDateTime(dateTime)

    const [date = '', time = ''] = formattedDateStr.split('|').map(part => part.trim())

    return { date, time }
  }

  const { date, time } = formatDateTime(dateTime)

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
        <Box sx={{ maxWidth: 300, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {`${description}`
            .split(',')
            .join(' • ')
            .split(' ')
            .map((item, index) => (
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
                {item.trim()}
              </Typography>
            ))}
        </Box>
      </Tooltip>
      {dateTime && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontSize: '12px', color: theme.palette.customColors.OnSurfaceVariant }}>{date}</Typography>
          <Typography sx={{ fontSize: '12px', color: theme.palette.customColors.OnSurfaceVariant }}>•</Typography>
          <Typography sx={{ fontSize: '12px', color: theme.palette.customColors.OnSurfaceVariant }}>{time}</Typography>
        </Box>
      )}
    </Box>
  )
}

export default ObservationCard
