import React from 'react'
import { Avatar, Box, Tooltip, Typography } from '@mui/material'

const KeyInsights = ({ insights }) => {
  const bgColors = {
    Natality: '#E1F9ED',
    Mortality: '#FFBDA866',
    'Unallocated Animals': '#FCF4AE66',
    'Animals under treatment': '#AFEFEB66',
    'New medical cases': '#EFF5F2'
  }

  const insightsIcons = {
    Natality: '/dashboard/insights/paws.svg',
    Mortality: '/dashboard/insights/bones.svg',
    'Unallocated Animals': '/dashboard/insights/Enclosure.svg',
    'Animals under treatment': '/dashboard/insights/health.svg',
    'New medical cases': '/dashboard/insights/cases.svg'
  }

  return (
    <>
      {insights.map((insight, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 6 }}>
          <Avatar
            variant='square'
            sx={{
              backgroundColor: bgColors[insight?.title],
              width: 40,
              height: 40,
              borderRadius: '8px',
              p: 2,
              mr: 2
            }}
            src={insightsIcons[insight?.title]}
          />

          <Box sx={{ flexGrow: 1, textAlign: 'start', overflow: 'hidden', paddingRight: '10px' }}>
            <Tooltip title={insight.title}>
              <Typography
                variant='subtitle2'
                sx={{
                  fontWeight: 500,
                  fontSize: '16px',
                  color: '#44544A',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  display: 'block',
                  overflow: 'hidden'
                }}
              >
                {insight.title}
              </Typography>
            </Tooltip>
            <Tooltip title={insight.subtitle}>
              <Typography
                variant='caption'
                sx={{
                  color: 'text.secondary',
                  fontWeight: 400,
                  fontSize: '14px',
                  color: '#7A8684',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block'
                }}
              >
                {insight.subtitle}
              </Typography>
            </Tooltip>
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '24px', color: '#44544A' }}>{insight.value}</Typography>
        </Box>
      ))}
    </>
  )
}

export default KeyInsights
