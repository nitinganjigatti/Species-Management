import { Button, Card, CardContent, CardHeader, Divider, Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import { styled } from '@mui/material/styles'
import Styles from '../../../../../pages/egg/incubators/dot.module.css'
import moment from 'moment'
const columns = [
  { id: 'date', label: 'Date' },
  { id: 'ideal', label: 'Ideal' },
  { id: 'actual', label: 'Actual' }
]
function createData(date, ideal, actual) {
  return { date, ideal, actual }
}

const rows = [
  createData('10 APR 2024', '290-300g', '300g -15%'),
  createData('10 APR 2024', '290-300g', '300g -15%'),
  createData('10 APR 2024', '290-300g', '300g -15%'),
  createData('10 APR 2024', '290-300g', '300g -15%'),
  createData('10 APR 2024', '290-300g', '300g -15%'),
  createData('10 APR 2024', '290-300g', '300g -15%'),
  createData('10 APR 2024', '290-300g', '300g -15%'),
  createData('10 APR 2024', '290-300g', '300g -15%')
]

const CustomTableContainer = styled(TableContainer)({
  '::-webkit-scrollbar': {
    width: '4px',
    height: '10px'
  },
  '::-webkit-scrollbar-track': {
    // background: '#f1f1f1'
    background: 'transparent'
  },
  '::-webkit-scrollbar-thumb': {
    background: '#839D8D',
    borderRadius: '10px'
  },
  '::-webkit-scrollbar-thumb:hover': {
    background: '#555'
  }
})

const EggSecondSecion = ({ eggDetails }) => {
  const historyData = {
    history1: {
      Site: eggDetails?.site_name
      // Section: 'SEC0012',
      // Enclosure: '24D',
      // Cage: 'C112',
      // 'Nest Box': 'N123',
      // Shape: 'Normal'
    },
    history2: {
      // 'Mother id': '0000123456',
      // 'Father id': 'Probable (5)',
      'Collected on': moment(eggDetails?.collection_date).format('DD MMM YYYY'),
      'Lay Date': moment(eggDetails?.lay_date).format('DD MMM YYYY')
      // 'Clutch No': 'NA',
      // 'Collected By': 'Jordan Steveson'
    }
  }
  const theme = useTheme()
  const headerAction = <>{/* <Icon icon='mdi:edit' fontSize={20} /> */}</>
  const weightHeaderAction = (
    <>
      <Button
        sx={{ color: '#00000066', fontWeight: 500, fontSize: '14px', lineHeight: '24px' }}
        startIcon={<Icon icon='mdi:add' fontSize={20} />}
      >
        ADD NEW
      </Button>
    </>
  )

  // ** States
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }
  return (
    <Grid gap='24px' justifyContent='space-between' container>
      <Grid item xs={12} md={7.2} lg={7.87} xl={7.89}>
        <Card>
          <CardHeader sx={{ pb: 0, pl: 6 }} title='Egg History - EDIT' action={headerAction} />
          <CardContent>
            <Grid
              container
              justifyContent={'space-between'}
              gap={{ xl: '24px', lg: '2px', md: '10px', sm: '24px', xs: '24px' }}
            >
              <Grid item xs={12} sm={5.7} md={5.68} lg={5.7} xl={5.8}>
                <Box
                  sx={{
                    backgroundColor: theme.palette.customColors.mdAntzNeutral,
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  {Object.entries(historyData?.history1)?.map(([key, value]) => (
                    <Grid container sx={{ justifyContent: 'space-between' }}>
                      <Grid item xs={6}>
                        <Typography
                          sx={{
                            fontWeight: 400,
                            fontSize: '14px',
                            lineHeight: '16.94px',
                            color: theme.palette.customColors.neutralSecondary
                          }}
                        >
                          {key}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography
                          sx={{
                            fontWeight: 400,
                            fontSize: '14px',
                            lineHeight: '16.94px',
                            color: theme.palette.customColors.OnSurfaceVariant
                          }}
                        >
                          {value}
                        </Typography>
                      </Grid>
                    </Grid>
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} sm={5.7} md={5.68} lg={5.7} xl={5.8}>
                <Box
                  sx={{
                    backgroundColor: theme.palette.customColors.mdAntzNeutral,
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  {Object.entries(historyData?.history2)?.map(([key, value]) => (
                    <Grid container sx={{ justifyContent: 'space-between' }}>
                      <Grid item xs={6}>
                        <Typography
                          sx={{
                            fontWeight: 400,
                            fontSize: '14px',
                            lineHeight: '16.94px',
                            color: theme.palette.customColors.neutralSecondary
                          }}
                        >
                          {key}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography
                          sx={{
                            textDecoration: key === 'Mother id' || key === 'Father id' ? 'underline' : 'none',
                            fontWeight: key === 'Mother id' || key === 'Father id' ? 600 : 400,
                            fontSize: '14px',
                            lineHeight: '16.94px',
                            color:
                              key === 'Mother id' || key === 'Father id'
                                ? '#00AFD6'
                                : theme.palette.customColors.OnSurfaceVariant
                          }}
                        >
                          {value}
                        </Typography>
                      </Grid>
                    </Grid>
                  ))}
                </Box>
              </Grid>
            </Grid>
            <Box
              sx={{
                backgroundColor: theme.components.MuiDialog.styleOverrides.paper.backgroundColor,
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                mt: '24px'
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '14px',
                    lineHeight: '16.94px',
                    color: theme.palette.customColors.OnSurfaceVariant,
                    mb: '12px'
                  }}
                >
                  Initial Measurement
                </Typography>
                <Divider />
              </Box>
              <Box>
                <Grid gap='24px' container>
                  <Grid
                    item
                    sm={3.55}
                    xs={12}
                    md={3.5}
                    lg={3.55}
                    xl={3.72}
                    xxl={3.72}
                    sx={{
                      borderRight: { xs: 'none', sm: '1px solid #006D354D' },
                      borderBottom: { xs: '1px solid #006D354D', sm: 'none' },
                      pb: { xs: '10px', sm: 'none' }
                    }}
                  >
                    <Box sx={{ justifyContent: { xs: 'center', sm: 'flex-start' }, display: 'flex', gap: '10px' }}>
                      <Box>
                        <img src='/icons/length_icon.png' style={{ height: '28px' }} alt='Length' />
                      </Box>
                      <Box>
                        <Typography
                          sx={{
                            fontSize: '16px',
                            fontWeight: 500,
                            lineHeight: '19.36px',
                            color: theme.palette.customColors.neutralSecondary
                          }}
                        >
                          Not Added
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 400,
                            fontSize: '14px',
                            lineHeight: '16.94px',
                            color: theme.palette.customColors.neutralSecondary
                          }}
                        >
                          Length
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid
                    item
                    sm={3.55}
                    xs={12}
                    md={3.5}
                    lg={3.55}
                    xl={3.72}
                    xxl={3.72}
                    sx={{
                      borderRight: { xs: 'none', sm: '1px solid #006D354D' },
                      borderBottom: { xs: '1px solid #006D354D', sm: 'none' },
                      pb: { xs: '10px', sm: 'none' }
                    }}
                  >
                    <Box sx={{ justifyContent: { xs: 'center', sm: 'flex-start' }, display: 'flex', gap: '10px' }}>
                      <Box>
                        <img src='/icons/width_icon.png' style={{ height: '28px' }} alt='Width' />
                      </Box>
                      <Box>
                        <Typography
                          sx={{
                            fontSize: '16px',
                            fontWeight: 500,
                            lineHeight: '19.36px',
                            color: theme.palette.customColors.neutralSecondary
                          }}
                        >
                          Not Added
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 400,
                            fontSize: '14px',
                            lineHeight: '16.94px',
                            color: theme.palette.customColors.neutralSecondary
                          }}
                        >
                          Width
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3.55} md={3.5} lg={3.55} xl={3.72} xxl={3.72}>
                    <Box sx={{ justifyContent: { xs: 'center', sm: 'start' }, display: 'flex', gap: '10px' }}>
                      <Box>
                        <img src='/icons/weight_icon.png' style={{ height: '28px' }} alt='Weight' />
                      </Box>
                      <Box>
                        <Typography
                          sx={{
                            fontSize: '16px',
                            fontWeight: 500,
                            lineHeight: '19.36px',
                            color: theme.palette.customColors.neutralSecondary
                          }}
                        >
                          Not Added
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 400,
                            fontSize: '14px',
                            lineHeight: '16.94px',
                            color: theme.palette.customColors.neutralSecondary
                          }}
                        >
                          Weight
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4.4} lg={3.8} xl={3.8}>
        <Card sx={{ height: '100%' }}>
          <CardHeader sx={{ pb: 0, pl: 6 }} title='Weights (Grams)' action={weightHeaderAction} />
          <CardContent>
            <CustomTableContainer
              className={Styles.main}
              style={{ borderRadius: '8px' }}
              component={Paper}
              sx={{ maxHeight: 300 }}
            >
              <Table stickyHeader sx={{ borderRadius: '8px' }} aria-label='sticky table'>
                <TableHead>
                  <TableRow>
                    {columns.map(column => (
                      <TableCell key={column.id} align={column.align} sx={{ backgroundColor: '#AFEFEBB3', py: 1 }}>
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(row => {
                    return (
                      <TableRow sx={{ py: 1 }} hover key={row.code}>
                        {columns.map(column => {
                          const value = row[column.id]
                          return (
                            <TableCell
                              style={{
                                padding: '11px 12px 11px 12px',
                                fontSize: '12px',
                                fontWeight: '400',
                                color: theme.palette.customColors.OnSurfaceVariant
                              }}
                              key={column.id}
                            >
                              {value}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CustomTableContainer>
            {/* <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component='div'
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      /> */}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default EggSecondSecion
