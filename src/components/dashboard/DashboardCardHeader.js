import React from 'react'
import { Card, CardHeader, CardContent, Typography } from '@mui/material'
import OptionsMenu from 'src/@core/components/option-menu'
import { display } from '@mui/system'

const DashboardCardHeader = ({
  title = 'Sales Country',
  timeOptions = ['Last 28 Days', 'Last Month', 'Last Year'],
  children,
  theme,
  isSmall = false
}) => {
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
              {title.split('(')[0]}
              <Typography component='span' sx={{ fontSize: '14px' }}>
                {' '}
                ({title.split('(')[1]}
              </Typography>
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
          '& .apexcharts-canvas .apexcharts-xaxis-label': { fontSize: '0.875rem', fill: theme?.palette.text.disabled },
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

// import React from 'react'
// import { Card as MuiCard, CardContent as MuiCardContent, Typography, Box, IconButton } from '@mui/material'
// import MoreVertIcon from '@mui/icons-material/MoreVert'

// // --- Reusable Card Header Component ---
// const CardHeader = ({ title }) => {
//   return (
//     <Box
//       sx={{
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         p: 5,
//         pb: 0
//       }}
//     >
//       <Typography variant='h6' sx={{ fontWeight: 500, fontSize: '1rem' }}>
//         {title}
//       </Typography>
//       <IconButton size='small'>
//         <MoreVertIcon />
//       </IconButton>
//     </Box>
//   )
// }

// const DashboardCardHeader = ({ title, children, ...props }) => {
//   return (
//     <MuiCard
//       sx={{
//         height: '100%',
//         width: 'auto',
//         boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
//         borderRadius: '10px',
//         ...props.sx
//       }}
//     >
//       <CardHeader title={title} />
//       <>{children}</>
//     </MuiCard>
//   )
// }

// export default DashboardCardHeader
