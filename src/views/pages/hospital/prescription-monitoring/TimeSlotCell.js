import React from 'react'
import { Box, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'

const TimeSlotCell = ({ hasSchedule, status, scheduledTime, dosage, onClick, config, theme }) => (
  <>
    {hasSchedule ? (
      <Box
        onClick={onClick}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          width: '100%'
        }}
      >
        {status !== 'pending' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography
              sx={{
                fontWeight: 500,
                fontFamily: 'Inter',
                fontStyle: 'normal',
                fontSize: '16px',
                lineHeight: '100%',
                letterSpacing: 0,
                color: config?.color
              }}
            >
              {status}
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Inter',
                fontWeight: 400,
                fontStyle: 'normal',
                fontSize: '14px',
                letterSpacing: 0,
                color: theme.palette.customColors.OnSurfaceVariant,
                textDecoration: config?.textDecoration
              }}
              variant='caption'
            >
              {scheduledTime}
            </Typography>
          </Box>
        )}
        <Typography
          sx={{
            fontFamily: 'Inter',
            fontWeight: 400,
            fontStyle: 'normal',
            fontSize: '14px',
            mx: status === 'pending' && 'auto',
            lineHeight: 1,
            letterSpacing: 0,
            color: theme.palette.customColors.neutralSecondary
          }}
          variant='caption'
        >
          {dosage}
        </Typography>
      </Box>
    ) : (
      <Icon icon={'mdi-plus'} color={theme.palette.customColors.OutlineVariant} fontSize={20} />
    )}
  </>
)

export default React.memo(TimeSlotCell)
