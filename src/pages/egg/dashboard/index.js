import React, { useEffect, useState } from 'react'

import { Box } from '@mui/system'
import { Breadcrumbs, Grid, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import moment from 'moment'

import Toaster from 'src/components/Toaster'

// import TodaysCollection from 'src/views/pages/egg/eggDashboard/todaysCollection'
// import TransferDetails from 'src/views/pages/egg/eggDashboard/transferDetails'
import Species from 'src/views/pages/egg/eggDashboard/species'
import EggsStats from 'src/views/pages/egg/eggDashboard/EggsStats'
import { getAllStats } from 'src/lib/api/egg/dashboard'
import { useTranslation } from 'react-i18next'

const Dashboard = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const [fromDate, setFromDate] = useState(null)
  const [tillDate, setTilDate] = useState(null)
  const [openDiscard, setOpenDiscard] = useState(false)

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
      <Breadcrumbs aria-label='breadcrumb'>
        <Typography
          sx={{
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '24px',
            letterSpacing: '0.15px',
            color: theme.palette.customColors.LightTypographyBody1
          }}
        >
          {t('egg_module.egg')}
        </Typography>

        <Typography
          sx={{
            cursor: 'pointer',
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '24px',
            letterSpacing: '0.15px',
            color: theme.palette.customColors.customTextColorGray2
          }}
        >
          {t('egg_module.dashboard')}
        </Typography>
      </Breadcrumbs>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Grid container spacing={6} sx={{ justifyContent: 'space-between' }} columns={5}>
          <Grid item size={{ sm: 5, md: 2, xl: 2 }}>
            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '24px',
                fontWeight: '500',
                lineHeight: '29.05px'
              }}
            >
              {t('egg_module.eggs_stats')}
            </Typography>
          </Grid>
          {/* <Grid item sm={5} md={3} xl={2}>
            <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  sx={{
                    backgroundColor: theme.palette.primary.contrastText,
                    borderRadius: '8px',
                    width: '100%',
                    '& .css-sn37jt-MuiInputBase-root-MuiOutlinedInput-root': {
                      height: '40px',
                      borderRadius: '4px'
                    },
                    '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-7px' },
                    '& .css-1d3z3hw-MuiOutlinedInput-notchedOutline': { border: `1px solid ${theme.palette.customColors.OutlineVariant}` }
                  }}
                  value={fromDate}
                  onChange={newDate => setFromDate(newDate)}
                  label={'From Date'}
                  maxDate={dayjs()}
                />
              </LocalizationProvider>
              <Typography
                sx={{
                  color: theme.palette.customColors.Outline,
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
                    backgroundColor: theme.palette.primary.contrastText,
                    borderRadius: '8px',
                    width: '100%',
                    '& .css-sn37jt-MuiInputBase-root-MuiOutlinedInput-root': {
                      height: '40px',
                      borderRadius: '4px'
                    },
                    '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-7px' },
                    '& .css-1d3z3hw-MuiOutlinedInput-notchedOutline': { border: `1px solid ${theme.palette.customColors.OutlineVariant}` }
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
      </Box>
      <EggsStats openDiscard={openDiscard} setOpenDiscard={setOpenDiscard} allStats={allStats} />
      {/* <TodaysCollection /> */}
      {/* <TransferDetails /> */}
      <Species openDiscard={openDiscard} setOpenDiscard={setOpenDiscard} />
    </Box>
  )
}

export default Dashboard
