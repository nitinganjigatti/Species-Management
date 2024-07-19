import { Autocomplete, Avatar, Breadcrumbs, FormControl, Grid, TextField, Typography } from '@mui/material'
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
import { getAllStats } from 'src/lib/api/egg/dashboard'
import moment from 'moment'
import Toaster from 'src/components/Toaster'
import TodaysCollection from 'src/views/pages/egg/eggDashboard/todaysCollection'
import TransferDetails from 'src/views/pages/egg/eggDashboard/transferDetails'
import Species from 'src/views/pages/egg/eggDashboard/species'

const Dashboard = () => {
  const authData = useContext(AuthContext)
  const theme = useTheme()

  const [fromDate, setFromDate] = useState(null)
  const [tillDate, setTilDate] = useState(null)

  const [allStats, setAllStats] = useState(null)

  const getAllStatsFunc = param => {
    try {
      getAllStats(param).then(res => {
        if (res?.data.success) {
          setAllStats(res?.data?.data)
        } else {
          Toaster({ type: 'error', message: res?.data?.message })
        }
      })
    } catch (error) {
      Toaster({ type: 'error', message: error })
    }
  }

  useEffect(() => {
    getAllStatsFunc({
      from_date: fromDate && moment(fromDate).format('YYYY-MM-DD'),
      till_date: tillDate && moment(tillDate).format('YYYY-MM-DD')
    })
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Breadcrumbs aria-label='breadcrumb' sx={{}}>
        <Typography
          sx={{
            // cursor: 'pointer',
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '24px',
            letterSpacing: '0.15px',
            color: '#44544A61'
          }}
        >
          Egg
        </Typography>

        <Typography
          sx={{
            cursor: 'pointer',
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '24px',
            letterSpacing: '0.15px',
            color: '#44544ADE'
          }}
        >
          Dashboard
        </Typography>
      </Breadcrumbs>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Grid container spacing={6} sx={{ justifyContent: 'space-between' }} columns={5}>
          <Grid item sm={5} md={2} xl={2}>
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
          {/* <Grid item sm={5} md={3} xl={2}>
            <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  sx={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    width: '100%',
                    '& .css-sn37jt-MuiInputBase-root-MuiOutlinedInput-root': {
                      height: '40px',
                      borderRadius: '4px'
                    },
                    '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-7px' },
                    '& .css-1d3z3hw-MuiOutlinedInput-notchedOutline': { border: '1px solid #C3CEC7' }
                  }}
                  value={fromDate}
                  onChange={newDate => setFromDate(newDate)}
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
                    '& .css-sn37jt-MuiInputBase-root-MuiOutlinedInput-root': {
                      height: '40px',
                      borderRadius: '4px'
                    },
                    '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-7px' },
                    '& .css-1d3z3hw-MuiOutlinedInput-notchedOutline': { border: '1px solid #C3CEC7' }
                  }}
                  value={tillDate}
                  onChange={newDate => setTilDate(newDate)}
                  label={'Till Date'}
                  maxDate={dayjs()}
                />
              </LocalizationProvider>
            </Box>
          </Grid> */}
        </Grid>
        <Grid container spacing={3} columns={5}>
          <Grid item xs={5} sm={2.5} xl={1}>
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
                  {allStats?.total_eggs}
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
          <Grid item xs={5} sm={2.5} xl={1}>
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
                  {allStats?.total_species}
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
          <Grid item xs={5} sm={2.5} xl={1}>
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
                  {allStats?.total_egg_in_nest}
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
          <Grid item xs={5} sm={2.5} xl={1}>
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
                    color: theme.palette.primary.light,
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '19.36px'
                  }}
                >
                  {allStats?.total_eggs_in_nursery}
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
          <Grid item xs={5} sm={2.5} xl={1}>
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
                  {allStats?.total_eggs_in_incubators}
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
      <TodaysCollection />
      <TransferDetails />
      <Species />
    </Box>
  )
}

export default Dashboard
