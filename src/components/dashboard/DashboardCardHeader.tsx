import React from 'react'
import { Card, CardHeader, CardContent, Typography } from '@mui/material'
import type { DashboardCardHeaderProps } from 'src/types/dashboard/components'

const DashboardCardHeader: React.FC<DashboardCardHeaderProps> = ({
  title = 'Sales Country',
  children,
  theme,
  isSmall = false
}) => {
  const titleParts = title.split('(')

  return (
    <Card>
      <CardHeader
        title={
          isSmall ? (
            <Typography
              sx={{
                fontSize: '20px',
                fontWeight: 500,
                color: '#44544A',
                textAlign: 'start',
                lineHeight: 1.2,
                marginTop: '6px'
              }}
            >
              {titleParts[0]}
              {titleParts[1] && (
                <Typography component='span' sx={{ fontSize: '14px' }}>
                  {' '}
                  ({titleParts[1]}
                </Typography>
              )}
            </Typography>
          ) : (
            <Typography sx={{ fontSize: '20px', fontWeight: 500, color: '#44544A', textAlign: 'start' }}>
              {title}
            </Typography>
          )
        }
        slotProps={{
          subheader: { sx: { lineHeight: 1.429 } }
        }}
      />
      <CardContent
        sx={{
          p: '0 !important',
          '& .apexcharts-canvas .apexcharts-yaxis-label': { fontSize: '0.875rem', fontWeight: 600 },
          '& .apexcharts-canvas .apexcharts-xaxis-label': {
            fontSize: '0.875rem',
            fill: theme?.palette.text.disabled
          },
          '& .apexcharts-data-labels .apexcharts-datalabel': {
            fontWeight: 500,
            fontSize: '0.875rem',
            fill: theme?.palette.common.white
          }
        }}
      >
        {children}
      </CardContent>
    </Card>
  )
}

export default DashboardCardHeader
