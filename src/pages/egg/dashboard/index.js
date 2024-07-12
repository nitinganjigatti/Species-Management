import { Avatar, Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'
import { useTheme } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Custom Components Imports
import OptionsMenu from 'src/@core/components/option-menu'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

const series = [
  {
    name: '',
    data: [48, 99, 82, 33]
  }
]

const Dashboard = () => {
  const theme = useTheme()

  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        barHeight: '50%',
        horizontal: true,
        distributed: true,
        startingShape: 'rounded'
      }
    },
    dataLabels: {
      enabled: false,
      offsetY: 8,
      style: {
        fontWeight: 500,
        fontSize: '0.875rem'
      }
    },
    grid: {
      strokeDashArray: 8,
      borderColor: theme.palette.divider,
      xaxis: {
        lines: { show: false }
      },
      yaxis: {
        lines: { show: false }
      },
      padding: {
        top: -18,
        left: -20,
        right: 0,
        bottom: 0
      }
    },
    colors: ['#00AFD6B2', '#37BD69B2', '#00D6C9', '#FA614099'],
    legend: { show: false },
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    xaxis: {
      axisTicks: { show: false },
      axisBorder: { show: false },
      categories: ['In Nest', 'In Nursery', 'Good Condition', 'Discarded'],
      labels: {
        formatter: val => `${Number(val)}`,
        style: {
          fontSize: '0.875rem',
          colors: theme.palette.text.disabled
        }
      }
    },
    yaxis: {
      labels: {
        show: false,
        align: theme.direction === 'rtl' ? 'right' : 'left',
        style: {
          fontWeight: 600,
          fontSize: '0.875rem',
          colors: theme.palette.text.primary
        }
      }
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Grid container sx={{ justifyContent: 'space-between' }} columns={5}>
          <Grid item xs={2}>
            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '24px',
                fontWeight: '500',
                lineHeight: '29.05px'
              }}
            >
              Current Stats
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  sx={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    width: '100%',
                    '& .MuiIconButton-edgeEnd': { display: 'block' },
                    '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-5px' },
                    '& .css-sn37jt-MuiInputBase-root-MuiOutlinedInput-root': { height: '40px' }
                  }}
                  // value={value}
                  // onChange={onChange}
                  label={'From Date'}
                  maxDate={dayjs()}
                />
              </LocalizationProvider>
              <Typography
                sx={{
                  color: '#839D8D',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '16.94px'
                }}
              >
                To
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  sx={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    width: '100%',
                    '& .MuiIconButton-edgeEnd': { display: 'block' },
                    '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-5px' },
                    '& .css-sn37jt-MuiInputBase-root-MuiOutlinedInput-root': { height: '40px' }
                  }}
                  // value={value}
                  // onChange={onChange}
                  label={'Till Date'}
                  maxDate={dayjs()}
                />
              </LocalizationProvider>
            </Box>
          </Grid>
        </Grid>
        <Grid container spacing={3} columns={5}>
          <Grid item xs={1}>
            <Box
              sx={{
                borderRadius: '8px',
                backgroundColor: theme.palette.background.paper,
                py: '24px',
                px: '16px',
                display: 'flex',
                gap: '8px'
              }}
            >
              <Avatar
                variant='square'
                sx={{ height: '40px', width: '40px' }}
                src='/icons/egg_dashboard/dashboard_egg.png'
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Typography
                  sx={{
                    color: theme.palette.formContent.tertiary,
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '19.36px'
                  }}
                >
                  3768
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '14px',
                    fontWeight: '400',
                    lineHeight: '16.94px'
                  }}
                >
                  Total Eggs
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={1}>
            <Box
              sx={{
                borderRadius: '8px',
                backgroundColor: theme.palette.background.paper,
                py: '24px',
                px: '16px',
                display: 'flex',
                gap: '8px'
              }}
            >
              <Avatar
                variant='square'
                sx={{ height: '40px', width: '40px' }}
                src='/icons/egg_dashboard/dashboard_species.png'
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Typography
                  sx={{
                    color: '#00AFD6',
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '19.36px'
                  }}
                >
                  198
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '14px',
                    fontWeight: '400',
                    lineHeight: '16.94px'
                  }}
                >
                  Total Species
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={1}>
            <Box
              sx={{
                borderRadius: '8px',
                backgroundColor: theme.palette.background.paper,
                py: '24px',
                px: '16px',
                display: 'flex',
                gap: '8px'
              }}
            >
              <Avatar
                variant='square'
                sx={{ height: '40px', width: '40px' }}
                src='/icons/egg_dashboard/dashboard_nest.png'
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Typography
                  sx={{
                    color: theme.palette.primary.dark,
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '19.36px'
                  }}
                >
                  842
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '14px',
                    fontWeight: '400',
                    lineHeight: '16.94px'
                  }}
                >
                  Eggs in Nest
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={1}>
            <Box
              sx={{
                borderRadius: '8px',
                backgroundColor: theme.palette.background.paper,
                py: '24px',
                px: '16px',
                display: 'flex',
                gap: '8px'
              }}
            >
              <Avatar
                variant='square'
                sx={{ height: '40px', width: '40px' }}
                src='/icons/egg_dashboard/dashboard_nursery.png'
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Typography
                  sx={{
                    color: theme.palette.background.paper,
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '19.36px'
                  }}
                >
                  2926
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '14px',
                    fontWeight: '400',
                    lineHeight: '16.94px'
                  }}
                >
                  Eggs in Nursery
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={1}>
            <Box
              sx={{
                borderRadius: '8px',
                backgroundColor: theme.palette.background.paper,
                py: '24px',
                px: '16px',
                display: 'flex',
                gap: '8px'
              }}
            >
              <Avatar
                variant='square'
                sx={{ height: '40px', width: '40px' }}
                src='/icons/egg_dashboard/dashboard_incubator.png'
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Typography
                  sx={{
                    color: theme.palette.primary.light,
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '19.36px'
                  }}
                >
                  354
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '14px',
                    fontWeight: '400',
                    lineHeight: '16.94px'
                  }}
                >
                  Total Incubators
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
      <Grid container columns={5}>
        <Grid
          sx={{
            boxShadow: ' 0px 2px 10px 0px #4C4E6438',
            backgroundColor: '#fff',
            borderRadius: '10px',
            padding: '24px'
          }}
          item
          xs={3}
        >
          <Box sx={{ display: 'flex' }}>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '24px',
                lineHeight: '29.05px',
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              Todays Collection -
            </Typography>
            <Typography
              sx={{ fontWeight: 500, fontSize: '24px', lineHeight: '29.05px', color: theme.palette.primary.dark }}
            >
              262 Eggs
            </Typography>
          </Box>
          <Grid container spacing={17} columns={2}>
            <Grid item xs={1}>
              <ReactApexcharts type='bar' height={164} series={series} options={options} />
            </Grid>
            <Grid item xs={1}>
              <Grid spacing={6} container columns={2}>
                <Grid sx={{ py: '12px', px: '5px', display: 'flex', flexDirection: 'column', gap: '4px' }} item xs={1}>
                  <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <Box sx={{ backgroundColor: '#4DC7E2', borderRadius: '30px', height: '10px', width: '10px' }}></Box>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 500,
                        lineHeight: '16.94px',
                        color: theme.palette.customColors.secondaryBg
                      }}
                    >
                      In Nest
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 500, fontSize: '20px', lineHeight: '24.2px', color: '#00AFD6' }}>
                    48
                  </Typography>
                </Grid>
                <Grid sx={{ py: '12px', px: '5px', display: 'flex', flexDirection: 'column', gap: '4px' }} item xs={1}>
                  <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <Box sx={{ backgroundColor: '#73D196', borderRadius: '30px', height: '10px', width: '10px' }}></Box>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 500,
                        lineHeight: '16.94px',
                        color: theme.palette.customColors.secondaryBg
                      }}
                    >
                      In Nursery
                    </Typography>
                  </Box>
                  <Typography
                    sx={{ fontWeight: 500, fontSize: '20px', lineHeight: '24.2px', color: theme.palette.primary.main }}
                  >
                    99
                  </Typography>
                </Grid>
                <Grid sx={{ py: '12px', px: '5px', display: 'flex', flexDirection: 'column', gap: '4px' }} item xs={1}>
                  <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <Box sx={{ backgroundColor: '#00D6C9', borderRadius: '30px', height: '10px', width: '10px' }}></Box>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 500,
                        lineHeight: '16.94px',
                        color: theme.palette.customColors.secondaryBg
                      }}
                    >
                      Good Condition
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 500, fontSize: '20px', lineHeight: '24.2px', color: '#00D6C9' }}>
                    82
                  </Typography>
                </Grid>
                <Grid sx={{ py: '12px', px: '5px', display: 'flex', flexDirection: 'column', gap: '4px' }} item xs={1}>
                  <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <Box sx={{ backgroundColor: '#FCA08C', borderRadius: '30px', height: '10px', width: '10px' }}></Box>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 500,
                        lineHeight: '16.94px',
                        color: theme.palette.customColors.secondaryBg
                      }}
                    >
                      Discarded
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 500,
                      fontSize: '20px',
                      lineHeight: '24.2px',
                      color: theme.palette.formContent.tertiary
                    }}
                  >
                    33
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Box sx={{ backgroundColor: 'green' }}></Box>
      <Box sx={{ backgroundColor: 'purple' }}></Box>
    </Box>
  )
}

export default Dashboard
