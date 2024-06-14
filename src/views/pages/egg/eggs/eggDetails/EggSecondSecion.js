import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Drawer,
  Grid,
  IconButton,
  TablePagination,
  Typography
} from '@mui/material'
import { Box, color } from '@mui/system'
import React, { useCallback, useEffect, useState } from 'react'
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
import { DataGrid } from '@mui/x-data-grid'

import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { LoadingButton } from '@mui/lab'
const columns = [
  { id: 'date', label: 'Date' },
  { id: 'ideal', label: 'Ideal' },
  { id: 'actual', label: 'Actual' }
]
function createData(date, ideal, actual) {
  return { date, ideal, actual }
}

const rowsd = [
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

const EggSecondSecion = ({ eggDetails, egg_id }) => {
  const historyData = {
    history1: {
      Site: eggDetails?.site_name,
      Section: eggDetails?.enclosure_data?.length && eggDetails?.enclosure_data[0]?.section_name,
      Enclosure: eggDetails?.enclosure_data?.length && eggDetails?.enclosure_data[0]?.user_enclosure_name, // taken from h2
      'Clutch No': eggDetails?.clutch_number ? eggDetails?.clutch_number : '-',
      'Mother id':
        eggDetails?.parent_list?.mother_list?.length > 1
          ? `Probable (${eggDetails?.parent_list?.mother_list?.length})`
          : eggDetails?.parent_list?.mother_list[0]?._id,
      'Father id':
        eggDetails?.parent_list?.father_list?.length > 1
          ? `Probable (${eggDetails?.parent_list?.father_list?.length})`
          : eggDetails?.parent_list?.father_list[0]?._id,
      'Collected on': moment(eggDetails?.collection_date).format('DD MMM YYYY'),
      'Lay Date': moment(eggDetails?.lay_date).format('DD MMM YYYY')
      // Cage: 'C112',
      // 'Nest Box': 'N123',
      // Shape: 'Normal'
    }
    // history2: {
    //   'Mother id':
    //     eggDetails?.parent_list?.mother_list?.length > 1
    //       ? `Probable (${eggDetails?.parent_list?.mother_list?.length})`
    //       : eggDetails?.parent_list?.mother_list[0]?._id,
    //   'Father id':
    //     eggDetails?.parent_list?.father_list?.length > 1
    //       ? `Probable (${eggDetails?.parent_list?.father_list?.length})`
    //       : eggDetails?.parent_list?.father_list[0]?._id,
    //   'Collected on': moment(eggDetails?.collection_date).format('DD MMM YYYY'),
    //   'Lay Date': moment(eggDetails?.lay_date).format('DD MMM YYYY')

    //   // 'Collected By': 'Jordan Steveson'
    // }
  }
  const theme = useTheme()
  const headerAction = <>{/* <Icon icon='mdi:edit' fontSize={20} /> */}</>
  const weightHeaderAction = (
    <>
      <Button
        onClick={() => setaddWeightSidebar(true)}
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [addWeightSidebar, setaddWeightSidebar] = useState(false)
  //////////////////////////////////////////////////////////////
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))
  // const handleChange = (event, newValue) => {
  //   setTotal(0)
  //   setPaginationModel({ page: 0, pageSize: 10 })
  //   setStatus(newValue)
  // }
  const fetchTableData = useCallback(async () => {
    try {
      setLoading(true)

      const params = {
        page_no: paginationModel.page + 1,
        // limit: paginationModel.pageSize,
        type: 'weight',
        egg_id
      }

      await getWeightList(params).then(res => {
        if (res?.success) {
          let listWithId = res.data.result.map((el, i) => {
            return { ...el, uid: i + 1 }
          })
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, listWithId))
        } else {
          console.log('res', res.message)
        }
      })
      setLoading(false)
    } catch (e) {
      setLoading(false)
    }
  }, [paginationModel])
  useEffect(() => {
    fetchTableData()
  }, [fetchTableData])
  return (
    <Grid
      // gap={{ md: '10px', lg: '1px', xl: '2px' }}
      justifyContent='space-between'
      container
      alignItems='stretch'
      rowGap={6}
    >
      {/* <Grid item xs={12} md={7.2} lg={7.87} xl={7.89}> */}
      <Grid item xs={12}>
        <Card>
          <CardHeader
            sx={{
              pb: 0,
              pl: 6
            }}
            title='Egg History - EDIT'
            action={headerAction}
          />
          <CardContent>
            <Grid
              container
              justifyContent={'space-between'}
              gap={{ xl: '24px', lg: '2px', md: '10px', sm: '24px', xs: '24px' }}
            >
              {/* <Grid item xs={12} sm={5.7} md={5.68} lg={5.7} xl={5.8}> */}
              <Grid item xs={12}>
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
                    <Grid container sx={{ justifyContent: 'space-between', pb: '8px' }}>
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
              {/* <Grid item xs={12} sm={5.7} md={5.68} lg={5.7} xl={5.8}>
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
              </Grid> */}
            </Grid>
            {/* <Box
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
            </Box> */}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={5.9}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Box
                sx={{
                  display: 'flex',
                  height: '88px',
                  borderRadius: '8px',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Box
                    sx={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '8px'
                    }}
                  >
                    <Avatar
                      sx={{ width: '100%', height: '100%', borderRadius: '8px' }}
                      src={'/icons/Incubator_CON.png'}
                      variant='square'
                    ></Avatar>
                  </Box>
                  <Box>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 400,
                          fontSize: '14px',
                          lineHeight: '16.94px',
                          mb: '4px',
                          color: theme.palette.customColors.neutralSecondary
                        }}
                      >
                        {eggDetails?.incubator_name ? eggDetails?.incubator_name : 'Incubator Name'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: '16px',
                          lineHeight: '19.36px',
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        {eggDetails?.incubator_code ? eggDetails?.incubator_code : 'Incubator Code'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: '14px',
                      lineHeight: '19.36px',
                      color: theme.palette.primary.main
                    }}
                  >
                    Transfer
                  </Typography>
                  <Icon
                    color='#00AFD6'
                    style={{ cursor: 'pointer', color: theme.palette.primary.main, transform: 'rotateY(180deg)' }}
                    icon='akar-icons:arrow-repeat'
                    fontSize={24}
                  />
                </Box> */}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <Box sx={{ borderRadius: '8px', border: '1px solid #C3CEC7', padding: '16px' }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: '19.36px',
                      color: theme.palette.customColors.neutralSecondary,
                      mb: '27px'
                    }}
                  >
                    Temperature
                  </Typography>
                  <Typography>Comming Soon</Typography>
                </Box>
                <Box sx={{ borderRadius: '8px', border: '1px solid #C3CEC7', padding: '16px' }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: '19.36px',
                      color: theme.palette.customColors.neutralSecondary,
                      mb: '27px'
                    }}
                  >
                    Humidity
                  </Typography>
                  <Typography>Comming Soon</Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={5.9}>
        <Card sx={{ height: '100%' }}>
          <CardHeader sx={{ pb: 0, pl: 6 }} title='Weights (Grams)' action={weightHeaderAction} />
          <CardContent>
            <CustomTableContainer
              className={Styles.main}
              style={{ borderRadius: '8px' }}
              component={Paper}
              sx={{ maxHeight: 250 }}
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
                  {rowsd.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(row => {
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

            <Box sx={{ display: 'flex', justifyContent: 'end', mb: 0 }}>
              <Button onClick={() => setSidebarOpen(true)}>View All</Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Drawer
        anchor='right'
        open={sidebarOpen}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] }, height: '100vh' }}
      >
        <Box sx={{ height: '0px', zIndex: 12 }}>
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              backgroundColor: 'background.default',
              p: theme => theme.spacing(3, 3.255, 3, 5.255),
              paddingX: 2
            }}
          >
            <Box></Box>
            <Typography variant='h6'>Weight</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                size='small'
                onClick={() => {
                  handleSidebarClose()
                }}
                sx={{ color: 'text.primary' }}
              >
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          </Box>
        </Box>
        <DataGrid
          sx={{
            '.MuiDataGrid-cell:focus': {
              outline: 'none'
            },

            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer'
            }
          }}
          columnVisibilityModel={{
            sl_no: false
          }}
          hideFooterSelectedRowCount
          disableColumnSelector={true}
          autoHeight
          pagination
          rows={indexedRows === undefined ? [] : indexedRows}
          rowCount={total}
          columns={columns}
          sortingMode='server'
          paginationMode='server'
          pageSizeOptions={[7, 10, 25, 50]}
          paginationModel={paginationModel}
          // onSortModelChange={handleSortModel}
          slots={{ toolbar: ServerSideToolbarWithFilter }}
          onPaginationModelChange={setPaginationModel}
          loading={loading}
          slotProps={{
            baseButton: {
              variant: 'outlined'
            },
            toolbar: {
              // value: searchValue
              // clearSearch: () => handleSearch(''),
              // onChange: event => handleSearch(event.target.value)
            }
          }}
          // onCellClick={onCellClick}
        />
      </Drawer>
      <Drawer
        anchor='right'
        open={addWeightSidebar}
        // sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] }, height: '100vh' }}
        sx={{ '& .MuiDrawer-paper': { width: ['100%', 500], height: '100vh' } }}
      >
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'background.default',
            p: theme => theme.spacing(3, 3.255, 3, 5.255)
          }}
        >
          <Box sx={{ mt: 2 }}>
            <img src='/icons/activity_icon.png' alt='Grocery Icon' width='30px' />
          </Box>
          <Typography variant='h6' sx={{ mr: 70 }}>
            Add Weight
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }}>
              <Icon icon='mdi:close' fontSize={20} onClick={() => setaddWeightSidebar(false)} />
            </IconButton>
          </Box>
        </Box>

        {/* drower */}

        <Box sx={{ backgroundColor: 'background.default' }} className='sidebar-body'>
          <form
            autoComplete='off'
            style={{ px: 4, backgroundColor: 'background.default' }}
            // onSubmit={handleSubmit(onSubmit)}
          >
            <Box sx={{ px: 4, backgroundColor: 'background.default' }}>
              {/* <Typography variant='h6' sx={{ mt: 5 }}>
                Incubator Selection
              </Typography> */}

              <Card fullWidth sx={{ mt: 3, backgroundColor: 'background.default' }}>
                {/* <FormControl sx={{ width: '95%', ml: 3, mt: 4 }}>
                  <InputLabel error={Boolean(errors?.nursery_name)} id='nursery_name_label'>
                    Nursery Name*
                  </InputLabel>
                  <Controller
                    name='nursery_name'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        name='nursery_name'
                        value={value}
                        label='Nursery Name'
                        onChange={onChange}
                        error={Boolean(errors?.nursery_name)}
                        labelId='nursery_name_label'
                      >
                        {nurseryName.map(nursery => (
                          <MenuItem key={nursery?.nursery_id} value={nursery?.nursery_id}>
                            {nursery?.nursery_name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.nursery_name?.message}</FormHelperText>
                  )}
                </FormControl>

                <FormControl sx={{ width: '95%', ml: 3, mt: 6, mb: 4 }}>
                  <InputLabel error={Boolean(errors?.room)} id='room_label'>
                    Room*
                  </InputLabel>
                  <Controller
                    name='room'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        name='room'
                        value={value}
                        label='Room'
                        onChange={onChange}
                        error={Boolean(errors?.room)}
                        labelId='room_label'
                      >
                        {roomName.map(room => (
                          <MenuItem key={room.room_id} value={room.room_id}>
                            {room.room_name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors && <FormHelperText sx={{ color: 'error.main' }}>{errors?.room?.message}</FormHelperText>}
                </FormControl>

                <FormControl sx={{ width: '95%', ml: 3, mt: 2, mb: 4 }}>
                  <InputLabel error={Boolean(errors?.incubator)} id='incubator_label'>
                    Incubator*
                  </InputLabel>
                  <Controller
                    name='incubator'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        name='incubator'
                        value={value}
                        label='Incubator'
                        onChange={onChange}
                        error={Boolean(errors?.incubator)}
                        labelId='incubator_label'
                      >
                        {incubatorName.map(incubator => (
                          <MenuItem key={incubator.incubator_id} value={incubator.incubator_id}>
                            {incubator.incubator_name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors && <FormHelperText sx={{ color: 'error.main' }}>{errors?.incubator?.message}</FormHelperText>}
                </FormControl> */}
              </Card>
            </Box>

            <Card>
              <Box
                sx={{
                  position: 'fixed',
                  bottom: 0,
                  height: '80px',
                  backgroundColor: '#fff',
                  width: '600px',
                  px: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <LoadingButton
                  fullWidth
                  variant='contained'
                  type='submit'
                  // disabled={loader && true}
                  sx={{ height: '50px' }}
                >
                  Submit
                </LoadingButton>
              </Box>
            </Card>
          </form>
        </Box>
      </Drawer>
    </Grid>
  )
}

export default EggSecondSecion
