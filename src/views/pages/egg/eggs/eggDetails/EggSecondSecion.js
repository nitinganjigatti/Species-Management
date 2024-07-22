import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  Drawer,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  TextField,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
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
import * as yup from 'yup'

import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { LoadingButton } from '@mui/lab'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useForm } from 'react-hook-form'
import { AddAssesment, getWeightList } from 'src/lib/api/egg/egg'
import EggActivityLogs from './EggActivityLogs'
import Utility from 'src/utility'

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

const EggSecondSecion = ({
  activtyLogData,
  setActivtyLogData,
  activtyLogCount,
  setActivtyLogCount,
  eggDetails,
  egg_id,
  defaultEggAssesment,
  getDetails
}) => {
  const historyData = {
    history1: {
      Site: eggDetails?.site_name,
      Section: eggDetails?.enclosure_data?.length && eggDetails?.enclosure_data[0]?.section_name,
      Enclosure: eggDetails?.enclosure_data?.length && eggDetails?.enclosure_data[0]?.user_enclosure_name, // taken from h2
      'Clutch No': eggDetails?.clutch_number ? eggDetails?.clutch_number : '-'

      // Cage: 'C112',
      // 'Nest Box': 'N123',
      // Shape: 'Normal'
    },
    history2: {
      'Mother id':
        eggDetails?.parent_list?.mother_list?.length === 0
          ? 'not available'
          : eggDetails?.parent_list?.mother_list?.length > 1
          ? `Probable (${eggDetails?.parent_list?.mother_list?.length})`
          : eggDetails?.parent_list?.mother_list[0]?._id,
      'Father id':
        eggDetails?.parent_list?.father_list?.length === 0
          ? 'not available'
          : eggDetails?.parent_list?.father_list?.length > 1
          ? `Probable (${eggDetails?.parent_list?.father_list?.length})`
          : eggDetails?.parent_list?.father_list[0]?._id,

      'Collected on': Utility.formatDisplayDate(Utility.convertUTCToLocal(eggDetails?.collection_date)),
      'Lay Date': eggDetails?.lay_date
        ? Utility.formatDisplayDate(Utility.convertUTCToLocal(eggDetails?.lay_date))
        : 'NA (Not Applicable)'

      // 'Collected By': 'Jordan Steveson'
    }
  }
  const theme = useTheme()

  const headerAction = (
    <Icon
      onClick={() => setActivtyLogSideBar(true)}
      style={{ cursor: 'pointer' }}
      icon='ion:time-outline'
      fontSize={28}
    />
  )

  const weightHeaderAction = (
    <>
      <Button
        onClick={() => setaddWeightSidebar(true)}
        sx={{ fontWeight: 500, fontSize: '14px', lineHeight: '24px' }}
        startIcon={<Icon icon='mdi:add' fontSize={20} />}
      >
        ADD NEW
      </Button>
    </>
  )

  // ** States
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [addWeightSidebar, setaddWeightSidebar] = useState(false)
  const [activtyLogSideBar, setActivtyLogSideBar] = useState(false)

  //////////////////////////////////////////////////////////////
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [btnDisabled, setBtnDisabled] = useState(true)
  const [submitAssementloader, setSubmitAssementloader] = useState(false)

  const defaultValues = {
    egg_id: egg_id,
    assessment_type_id: defaultEggAssesment?.assessment_type_id,
    measurement_unit_id: defaultEggAssesment?.unit_id,
    assessment_value: ''
  }

  const schema = yup.object().shape({
    assessment_value: yup.number().required('Assessment value is required')
  })

  const {
    reset,
    control,
    setValue,
    setError,
    watch,
    getValues,
    clearErrors,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const onSubmit = val => {
    const params = {
      egg_id: egg_id,
      assessment_type_id: defaultEggAssesment?.assessment_type_id,
      measurement_unit_id: defaultEggAssesment?.unit_id,
      assessment_value: val?.assessment_value
    }
    setSubmitAssementloader(true)

    // if (isEdit) {
    //   setBtnDisabled(true)
    //   try {
    //     updateIncubator(id, {
    //       nursery_id: val?.nursery,
    //       room_id: val?.room,
    //       max_eggs: val?.maxNumberOfEggs,
    //       incubator_name: val?.incubator_name
    //     }).then(res => {
    //       if (res.success) {
    //         reset()
    //         // handleSidebarClose()
    //         router.push('/egg/incubators')
    //       } else {
    //       }
    //     })
    //   } catch (error) {
    //     console.log(error)
    //   }
    // } else {
    try {
      AddAssesment(params).then(res => {
        if (res.success) {
          reset()
          setaddWeightSidebar(false)
          setBtnDisabled(false)
          setSubmitAssementloader(false)
          getDetails(egg_id)
          fetchTableData()
        } else {
          setSubmitAssementloader(false)
        }
      })
    } catch (error) {
      console.log(error)
    }

    // }
  }

  const onError = errors => {
    // console.log('Form errros', errors)
  }

  const columns = [
    {
      flex: 0.1,
      Width: 40,
      field: 'id',
      headerName: 'NO ',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '12px',
            fontWeight: '400',
            lineHeight: '14.52px'
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },

    {
      flex: 0.35,
      minWidth: 30,
      sortable: false,
      field: 'created_at',
      headerName: 'DATE',
      renderCell: params => (
        <Typography
          noWrap
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.created_at))}
          {/* {moment(moment.utc(params.row.created_at).toDate().toLocaleString()).format('DD MMM YYYY')} */}
        </Typography>
      )
    },
    {
      flex: 0.35,
      minWidth: 30,
      sortable: false,
      field: 'uom_abbr',
      headerName: 'TIME ',
      renderCell: params => (
        <Typography
          noWrap
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {Utility?.extractHoursAndMinutes(Utility.convertUTCToLocal(params?.row?.created_at))}
          {/* {moment(params?.row?.created_at).format('hh : mm A')} */}
          {/* {moment(moment.utc(params?.row?.created_at).toDate().toLocaleString()).format('hh : mm A')} */}
        </Typography>
      )
    },
    {
      flex: 0.35,
      minWidth: 30,
      sortable: false,
      field: 'assessment_value',
      headerName: 'ACTUAL',
      renderCell: params => (
        <Typography
          noWrap
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {`${params?.row?.assessment_value} ${params?.row?.uom_abbr}`}
        </Typography>
      )
    }
  ]

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

  const handleChange = (event, newValue) => {
    setTotal(0)
    setPaginationModel({ page: 0, pageSize: 10 })
    setStatus(newValue)
  }

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
          let listWithId = res.data?.result.map((el, i) => {
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
    <Grid justifyContent='space-between' container alignItems='stretch' rowGap={6}>
      <Grid item xs={12}>
        <Card sx={{ border: 1, borderColor: '#c3cec7' }}>
          <CardHeader
            sx={{
              pb: 0,
              pl: 6
            }}
            title='Egg History'
            action={headerAction}
          />
          <CardContent>
            <Grid container spacing={6} justifyContent={'space-between'}>
              <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
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
                    <Grid container sx={{ justifyContent: 'space-between', pb: '4px' }}>
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
              <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
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
                    <Grid container sx={{ justifyContent: 'space-between', pb: '4px' }}>
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
      <Grid container spacing={6} sx={{ justifyContent: 'space-between' }}>
        <Grid item xs={12} md={6}>
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
                <Grid container sx={{ gap: '16px', justifyContent: 'space-between' }}>
                  <Grid
                    item
                    xs={12}
                    sm={5.8}
                    md={5.7}
                    xl={5.8}
                    xxl={5.8}
                    sx={{ borderRadius: '8px', border: '1px solid #C3CEC7', padding: '16px' }}
                  >
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
                    <Typography sx={{ fontWeight: 600, fontSize: '20px', lineHeight: '24.2px', mb: '14px' }}>
                      Coming Soon
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '16.94px',
                        color: theme.palette.customColors.neutralSecondary
                      }}
                    >
                      Coming Soon
                    </Typography>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={5.8}
                    md={5.7}
                    xl={5.8}
                    xxl={5.8}
                    sx={{ borderRadius: '8px', border: '1px solid #C3CEC7', padding: '16px' }}
                  >
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
                    <Typography sx={{ fontWeight: 600, fontSize: '20px', lineHeight: '24.2px', mb: '14px' }}>
                      Coming soon
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '16.94px',
                        color: theme.palette.customColors.neutralSecondary
                      }}
                    >
                      Coming soon
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader sx={{ pb: 0, pl: 6 }} title='Weights (Grams)' action={weightHeaderAction} />
            <CardContent style={{ paddingBottom: 0 }}>
              <CustomTableContainer
                className={Styles.main}
                style={{ borderRadius: '8px' }}
                component={Paper}
                sx={{ height: 174 }}
              >
                <Table stickyHeader sx={{ borderRadius: '8px' }} aria-label='sticky table'>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ backgroundColor: '#AFEFEBB3', py: 1 }}>DATE</TableCell>
                      <TableCell sx={{ backgroundColor: '#AFEFEBB3', py: 1 }}>TIME</TableCell>
                      <TableCell sx={{ backgroundColor: '#AFEFEBB3', py: 1 }}>ACTUAL</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {eggDetails?.assessments_data?.map(row => {
                      return (
                        <TableRow sx={{ py: 1 }} hover>
                          <TableCell
                            style={{
                              padding: '11px 12px 11px 12px',
                              fontSize: '12px',
                              fontWeight: '400',
                              color: theme.palette.customColors.OnSurfaceVariant
                            }}
                          >
                            {/* {moment(row?.created_at).format('DD MMM YYYY')} */}
                            {/* {moment(moment.utc(row?.created_at).toDate().toLocaleString()).format('DD MMM YYYY')} */}
                            {Utility.formatDisplayDate(Utility.convertUTCToLocal(row?.created_at))}
                          </TableCell>
                          <TableCell
                            style={{
                              padding: '11px 12px 11px 12px',
                              fontSize: '12px',
                              fontWeight: '400',
                              color: theme.palette.customColors.OnSurfaceVariant
                            }}
                          >
                            {/* {moment(row?.created_at).format('hh : mm A')} */}
                            {Utility?.extractHoursAndMinutes(Utility.convertUTCToLocal(row?.created_at))}
                            {/* {moment(moment(moment.utc(row?.created_at).toDate().toLocaleString())).format('hh : mm A')} */}
                          </TableCell>
                          <TableCell
                            style={{
                              padding: '11px 12px 11px 12px',
                              fontSize: '12px',
                              fontWeight: '400',
                              color: theme.palette.customColors.OnSurfaceVariant
                            }}
                          >
                            {`${row?.assessment_value} ${row?.uom_abbr}`}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CustomTableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0 }}>
                {total > 3 && <Button onClick={() => setSidebarOpen(true)}>View All</Button>}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Drawer
        anchor='right'
        open={sidebarOpen}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: ['100%', 600] }, height: '100vh' }}
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
            <Typography variant='h6'>Weight (Grams)</Typography>
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
        <Box sx={{ px: 4, py: 2 }}>
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
        </Box>
      </Drawer>
      <Drawer
        anchor='right'
        open={addWeightSidebar}
        sx={{ '& .MuiDrawer-paper': { width: ['100%', 500], height: '100vh' } }}
      >
        <Box sx={{ height: '100%', backgroundColor: 'background.default' }}>
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

          <Box className='sidebar-body'>
            <form onSubmit={handleSubmit(onSubmit, onError)}>
              <Box sx={{ px: 4, backgroundColor: 'background.default' }}>
                <Card fullWidth sx={{ mt: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <FormControl fullWidth>
                        <Controller
                          name='assessment_value'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <TextField
                              label='Weight in Grams'
                              value={value}
                              type='number'
                              inputProps={{ min: 1 }}
                              onChange={onChange}
                              placeholder='Enter Number'
                              error={Boolean(errors.assessment_value)}
                              name='assessment_value'
                            />
                          )}
                        />
                        {errors.assessment_value && (
                          <FormHelperText sx={{ color: 'error.main' }}>
                            {/* {errors.assessment_value?.message} */}
                            Assessment value is Required
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
              <Box
                sx={{
                  position: 'fixed',
                  bottom: 0,
                  height: '80px',
                  backgroundColor: '#fff',
                  width: '500px',
                  px: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <LoadingButton
                  fullWidth
                  variant='contained'
                  type='submit'
                  loading={submitAssementloader}
                  disabled={errors.assessment_value || submitAssementloader}
                  sx={{ height: '50px' }}
                >
                  Submit
                </LoadingButton>
              </Box>
            </form>
          </Box>
        </Box>
      </Drawer>

      <EggActivityLogs
        activtyLogSideBar={activtyLogSideBar}
        setActivtyLogSideBar={setActivtyLogSideBar}
        egg_id={egg_id}
        activtyLogData={activtyLogData}
        setActivtyLogData={setActivtyLogData}
        activtyLogCount={activtyLogCount}
        setActivtyLogCount={setActivtyLogCount}
      />
    </Grid>
  )
}

export default EggSecondSecion
