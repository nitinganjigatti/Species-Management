import { Autocomplete, Avatar, FormControl, Grid, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useContext, useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import Icon from 'src/@core/components/icon'

// ** Custom Components Imports
import OptionsMenu from 'src/@core/components/option-menu'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { AuthContext } from 'src/context/AuthContext'
import { DataGrid } from '@mui/x-data-grid'
import { getTodaysCollection } from 'src/lib/api/egg/dashboard'
import moment from 'moment'
import Toaster from 'src/components/Toaster'

const TodaysCollection = () => {
  const authData = useContext(AuthContext)
  const theme = useTheme()
  const [todaysCollection, setTodaysCollection] = useState(null)
  const series = [
    {
      // name: '',
      data: [
        todaysCollection?.total_eggs_in_nest,
        todaysCollection?.total_eggs_in_nursery,
        todaysCollection?.total_hatched,
        todaysCollection?.total_discarded
      ]
    }
  ]
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
        top: -38,
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
      categories: ['In Nest', 'In Nursery', 'Hatched', 'Discarded'],
      labels: {
        formatter: val => `${Number(val).toFixed(2)}`,
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

  const getTodaysCollectionFunc = () => {
    try {
      getTodaysCollection().then(res => {
        if (res?.data?.success) {
          setTodaysCollection(res?.data?.data)
        } else {
          Toaster({ type: 'error', message: res?.data?.message })
        }
      })
    } catch (error) {
      Toaster({ type: 'error', message: error })
    }
  }

  useEffect(() => {
    getTodaysCollectionFunc()
  }, [])

  return (
    <>
      {todaysCollection != null && (
        <Grid container columns={5}>
          <Grid
            sx={{
              boxShadow: ' 0px 2px 10px 0px #4C4E6438',
              backgroundColor: '#fff',
              borderRadius: '10px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}
            item
            xl={2.985}
          >
            <Box sx={{ display: 'flex', gap: '5px' }}>
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
                {todaysCollection?.total_eggs} Eggs
              </Typography>
            </Box>
            <Grid container spacing={17} columns={2}>
              <Grid item md={1} xs={2}>
                <ReactApexcharts type='bar' height={164} series={series} options={options} />
              </Grid>
              <Grid item md={1} xs={2}>
                <Grid spacing={6} container columns={2}>
                  <Grid
                    sx={{ py: '12px', px: '5px', display: 'flex', flexDirection: 'column', gap: '4px' }}
                    item
                    xs={1}
                  >
                    <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <Box
                        sx={{ backgroundColor: '#4DC7E2', borderRadius: '30px', height: '10px', width: '10px' }}
                      ></Box>
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
                      {todaysCollection?.total_eggs_in_nest}
                    </Typography>
                  </Grid>
                  <Grid
                    sx={{ py: '12px', px: '5px', display: 'flex', flexDirection: 'column', gap: '4px' }}
                    item
                    xs={1}
                  >
                    <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <Box
                        sx={{ backgroundColor: '#73D196', borderRadius: '30px', height: '10px', width: '10px' }}
                      ></Box>
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
                      sx={{
                        fontWeight: 500,
                        fontSize: '20px',
                        lineHeight: '24.2px',
                        color: theme.palette.primary.main
                      }}
                    >
                      {todaysCollection?.total_eggs_in_nursery}
                    </Typography>
                  </Grid>
                  <Grid
                    sx={{ py: '12px', px: '5px', display: 'flex', flexDirection: 'column', gap: '4px' }}
                    item
                    xs={1}
                  >
                    <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <Box
                        sx={{ backgroundColor: '#00D6C9', borderRadius: '30px', height: '10px', width: '10px' }}
                      ></Box>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: 500,
                          lineHeight: '16.94px',
                          color: theme.palette.customColors.secondaryBg
                        }}
                      >
                        Hatched
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 500, fontSize: '20px', lineHeight: '24.2px', color: '#00D6C9' }}>
                      {todaysCollection?.total_hatched}
                    </Typography>
                  </Grid>
                  <Grid
                    sx={{ py: '12px', px: '5px', display: 'flex', flexDirection: 'column', gap: '4px' }}
                    item
                    xs={1}
                  >
                    <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <Box
                        sx={{ backgroundColor: '#FCA08C', borderRadius: '30px', height: '10px', width: '10px' }}
                      ></Box>
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
                      {todaysCollection?.total_discarded}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}
    </>
  )
}

export default TodaysCollection
