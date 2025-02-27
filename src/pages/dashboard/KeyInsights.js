import React from 'react'
import { Avatar, Box, Typography } from '@mui/material'

const KeyInsights = ({ insights }) => {
  return (
    <>
      {insights.map((insight, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            variant='square'
            sx={{
              backgroundColor: insight.bgColor,
              width: 40,
              height: 40,
              borderRadius: '8px',
              p: 2,
              mr: 2
            }}
            src={insight.icon}
          />
          {/* <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              backgroundColor: insight.bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              fontSize: '20px'
            }}
          >
            {insight.icon}
          </Box> */}
          <Box sx={{ flexGrow: 1, textAlign: 'start', overflow: 'hidden', paddingRight: '10px' }}>
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
            <Typography
              variant='caption'
              color='text.secondary'
              sx={{
                fontWeight: 400,
                fontSize: '14px',
                color: '#7A8684',
                // whiteSpace: 'nowrap',
                // textOverflow: 'ellipsis',
                // width: 'calc(100% - 64px)',
                // display: 'inline-block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block'
              }}
            >
              {insight.subtitle}
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '24px', color: '#44544A' }}>{insight.value}</Typography>
        </Box>
      ))}
    </>
  )
}

export default KeyInsights
