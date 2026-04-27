import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Drawer,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  Paper,
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableContainer
} from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import { styled } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'

import moment from 'moment'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useForm } from 'react-hook-form'

import Utility from 'src/utility'
import Icon from 'src/@core/components/icon'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import CommonTable from 'src/views/table/data-grid/CommonTable'

import { AddAssesment, EditAssesment, getWeightList } from 'src/lib/api/egg/egg'

import EggActivityLogs from './EggActivityLogs'
import ProbableParent from './ProbableParent'
import TransferEgg from './TransferEgg'
import Toaster from 'src/components/Toaster'
import { useTranslation } from 'react-i18next'

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
  const theme = useTheme()
  const currentDate = moment().format('YYYY-MM-DD')
  const { t } = useTranslation()
  const CustomTableContainer = styled(TableContainer)({
    '::-webkit-scrollbar': {
      width: '4px',
      height: '10px'
    },
    '::-webkit-scrollbar-track': {
      background: 'transparent'
    },
    '::-webkit-scrollbar-thumb': {
      background: theme.palette.customColors.Outline,
      borderRadius: '10px'
    },
    '::-webkit-scrollbar-thumb:hover': {
      background: theme.palette.customColors.neutralSecondary
    }
  })

  // ** States
  const [transferEggSideBar, setTransferEggSideBar] = useState(false)
  const [probableParentSideBar, setProbableParentSideBar] = useState(false)
  const [activtyLogSideBar, setActivtyLogSideBar] = useState(false)

  const [addWeightSidebar, setAddWeightSidebar] = useState(false)
  const [editWeight, setEditWeight] = useState(false)
  const [allWeightSidebarOpen, setAllWeightSidebarOpen] = useState(false)

  const [parent, setParent] = useState('')
  const [parentList, setParentList] = useState([])

  const [rows, setRows] = useState([])
  const [rowsWeight, setRowsWeight] = useState([])
  const [total, setTotal] = useState(0)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [submitAssementloader, setSubmitAssementloader] = useState(false)

  const historyData = {
    history1: {
      Site: eggDetails?.site_name || 'NA',
      Section: (eggDetails?.enclosure_data?.length && eggDetails?.enclosure_data[0]?.section_name) || 'NA',
      Enclosure: (eggDetails?.enclosure_data?.length && eggDetails?.enclosure_data[0]?.user_enclosure_name) || 'NA', // taken from h2
      'Clutch No': eggDetails?.clutch_number || 'NA'
    },
    history2: {
      'Mother id':
        eggDetails?.parent_list?.mother_list?.length === 0
          ? 'NA'
          : eggDetails?.parent_list?.mother_list?.length > 1
          ? `Probable (${eggDetails?.parent_list?.mother_list?.length})`
          : eggDetails?.parent_list?.mother_list[0]?.local_id_type &&
            eggDetails?.parent_list?.mother_list[0]?.local_identifier_value
          ? `${eggDetails?.parent_list?.mother_list[0]?.local_id_type}: ${eggDetails?.parent_list?.mother_list[0]?.local_identifier_value}`
          : eggDetails?.parent_list?.mother_list[0]?.animal_id,
      'Father id':
        eggDetails?.parent_list?.father_list?.length === 0
          ? 'NA'
          : eggDetails?.parent_list?.father_list?.length > 1
          ? `Probable (${eggDetails?.parent_list?.father_list?.length})`
          : eggDetails?.parent_list?.father_list[0]?.local_id_type &&
            eggDetails?.parent_list?.father_list[0]?.local_identifier_value
          ? `${eggDetails?.parent_list?.father_list[0]?.local_id_type}: ${eggDetails?.parent_list?.father_list[0]?.local_identifier_value}`
          : eggDetails?.parent_list?.father_list[0]?.animal_id,

      'Collected on': Utility.formatDisplayDate(Utility.convertUTCToLocal(eggDetails?.collection_date)),
      'Lay Date': eggDetails?.lay_date
        ? Utility.formatDisplayDate(Utility.convertUTCToLocal(eggDetails?.lay_date))
        : 'NA'
    }
  }

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
      {!(eggDetails?.egg_status === 'Discard') && (
        <Button
          onClick={() => setAddWeightSidebar(true)}
          sx={{ fontWeight: 500, fontSize: '14px', lineHeight: '24px' }}
          startIcon={<Icon icon='mdi:add' fontSize={20} />}
        >
          {t('add_new')}
        </Button>
      )}
    </>
  )

  const formatDay = date => moment(Utility.convertUTCToLocal(date)).format('YYYY-MM-DD')

  const sortedRowsForChart = useMemo(() => {
    return [...rows].sort((a, b) => {
      const current = a?.created_at ? moment(Utility.convertUTCToLocal(a.created_at)).valueOf() : 0
      const next = b?.created_at ? moment(Utility.convertUTCToLocal(b.created_at)).valueOf() : 0

      return current - next
    })
  }, [rows])

  const chartData = sortedRowsForChart.map(row => ({
    x: formatDay(row.created_at), // day-wise
    y: Number(row.assessment_value)
  }))

  const series = [
    {
      name: 'Actual Value',
      data: chartData
    }
  ]

  const options = {
    chart: {
      type: 'line',
      height: 350,
      toolbar: { show: false }
    },
    stroke: { curve: 'smooth', width: 2 },
    markers: { size: 4 },
    tooltip: {
      shared: true,
      intersect: false,
      y: { formatter: val => `${val}g` }
    },
    xaxis: {
      type: 'category', // <-- important
      title: { text: 'Days' },
      labels: {
        rotate: -45,
        formatter: val => moment(val).format('DD MMM') // pretty format
      }
    },
    yaxis: {
      title: { text: 'Weight (g)' }
    },
    colors: [theme.palette.primary.main]
  }

  const columns = [
    {
      width: 70,
      field: 'id',
      headerName: t('s_no'),
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
      headerName: t('date'),
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
        </Typography>
      )
    },
    {
      flex: 0.35,
      minWidth: 30,
      sortable: false,
      field: 'uom_abbr',
      headerName: t('time'),
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
        </Typography>
      )
    },
    {
      flex: 0.35,
      minWidth: 30,
      sortable: false,
      field: 'assessment_value',
      headerName: t('actual'),
      renderCell: params => (
        <Tooltip
          title={`${
            Number(params?.row?.assessment_value || 0) % 1 === 0
              ? Math.floor(Number(params?.row?.assessment_value || 0))
              : Number(params?.row?.assessment_value || 0).toFixed(2)
          } ${params?.row?.uom_abbr}`}
          placement='top'
        >
          <Typography
            noWrap
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {`${
              Number(params?.row?.assessment_value || 0) % 1 === 0
                ? Math.floor(Number(params?.row?.assessment_value || 0))
                : Number(params?.row?.assessment_value || 0).toFixed(2)
            } ${params?.row?.uom_abbr}`}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.2,
      minWidth: 30,
      sortable: false,
      field: 'action',
      headerName: t('action'),
      renderCell: params => (
        <Typography
          sx={{
            display: 'flex',
            alignItems: 'center',
            pl: '8px'
          }}
        >
          <Icon
            onClick={() => {
              setEditWeight(true)
              setValue('assessment_value', params?.row?.assessment_value)
              setValue('assessment_id', params?.row?.id)
              setAddWeightSidebar(true)
            }}
            style={{ cursor: 'pointer' }}
            icon='ic:outline-edit'
            fontSize={20}
          />
        </Typography>
      )
    }
  ]

  const defaultValues = {
    egg_id: egg_id,
    assessment_id: '',
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

  const onError = errors => {}

  const onSubmit = val => {
    const params = {
      egg_id: egg_id,
      assessment_type_id: defaultEggAssesment?.assessment_type_id,
      measurement_unit_id: defaultEggAssesment?.unit_id,
      assessment_value: val?.assessment_value
    }

    const paramsEdit = {
      ref_id: val?.assessment_id,
      measurement_unit_id: defaultEggAssesment?.unit_id,
      assessment_value: val?.assessment_value,
      assessment_date: currentDate
    }
    setSubmitAssementloader(true)

    if (editWeight) {
      try {
        EditAssesment(paramsEdit).then(res => {
          if (res.success) {
            // Success toaster
            Toaster({ type: 'success', message: res.message || 'Weight updated successfully!' })
            reset()
            setAddWeightSidebar(false)
            setEditWeight(false)
            setValue('assessment_id', '')
            setSubmitAssementloader(false)
            getDetails(egg_id)
            fetchTableData()
          } else {
            Toaster({ type: 'error', message: res.message || 'Failed to update weight' })
            setSubmitAssementloader(false)
          }
        })
      } catch (error) {
        Toaster({ type: 'error', message: 'Something went wrong while updating weight' })
        setSubmitAssementloader(false)
      }
    } else {
      try {
        AddAssesment(params).then(res => {
          if (res.success) {
            Toaster({ type: 'success', message: res.message || 'Weight added successfully!' })
            reset()
            setAddWeightSidebar(false)
            setSubmitAssementloader(false)
            getDetails(egg_id)
            fetchTableData()
          } else {
            Toaster({ type: 'error', message: res.message || 'Failed to add weight' })
            setSubmitAssementloader(false)
          }
        })
      } catch (error) {
        Toaster({ type: 'error', message: 'Something went wrong while adding weight' })
        setSubmitAssementloader(false)
      }
    }
  }

  const handleSidebarClose = () => {
    setEditWeight(false)
    setAllWeightSidebarOpen(false)
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const fetchTableData = useCallback(async () => {
    try {
      setLoading(true)

      const params = {
        page_no: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        type: 'weight',
        egg_id
      }

      await getWeightList(params).then(res => {
        if (res?.success) {
          let listWithId = res.data?.result.map((el, i) => {
            return { ...el, uid: i + 1 }
          })

          let rowWeights = res.data?.result.map((el, i) => {
            return el?.assessment_value
          })
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, listWithId))
          setRowsWeight(rowWeights.reverse())
        } else {
          console.error('res', res?.message)
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

  const ViewAllWeightSideBar = () => (
    <Drawer
      anchor='right'
      open={allWeightSidebarOpen}
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
        <CommonTable
          indexedRows={indexedRows === undefined ? [] : indexedRows}
          total={total}
          columns={columns}
          paginationModel={paginationModel}
          setPaginationModel={setPaginationModel}
          loading={loading}
          columnVisibilityModel={{
            sl_no: false
          }}
          slots={{ toolbar: ServerSideToolbarWithFilter }}
          slotProps={{
            baseButton: {
              variant: 'outlined'
            },
            toolbar: {}
          }}
        />
      </Box>
    </Drawer>
  )

  const AddWeightSideBar = () => (
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
            {editWeight ? 'Edit' : 'Add'} Weight
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size='small'
              sx={{ color: 'text.primary' }}
              onClick={() => {
                setAddWeightSidebar(false)
                setEditWeight(false)
                reset()
              }}
            >
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
        </Box>

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
                            label={t('egg_module.weight_in_gm')}
                            value={value}
                            autoFocus
                            onChange={event => {
                              const newValue = event.target.value

                              if (/^[1-9]\d*(\.\d{0,2})?$/.test(newValue) || newValue === '') {
                                onChange(event)
                              }
                            }}
                            placeholder={`${editWeight ? t('edit') : t('add')} Weight`}
                            error={Boolean(errors.assessment_value)}
                            name='assessment_value'
                            slotProps={{
                              htmlInput: { min: 1 }
                            }}
                          />
                        )}
                      />
                      {errors.assessment_value && (
                        <FormHelperText sx={{ color: 'error.main' }}>
                          {t('egg_module.assessment_value_req')}
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
                backgroundColor: theme.palette.primary.contrastText,
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
                {t('submit')}
              </LoadingButton>
            </Box>
          </form>
        </Box>
      </Box>
    </Drawer>
  )

  return (
    <Box>
      <Grid
        container
        spacing={6}
        sx={{
          justifyContent: 'space-between',
          alignItems: 'stretch'
        }}
      >
        <Grid item size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Box
                  sx={{
                    display: 'flex',
                    minHeight: '68px',
                    gap: '16px',
                    flexDirection: 'row',
                    borderRadius: '8px',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap'
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
                    <Box sx={{ width: '140px' }}>
                      <Tooltip title={eggDetails?.room_name ? eggDetails?.room_name : 'Room Name'}>
                        <Typography
                          sx={{
                            fontWeight: 400,
                            fontSize: '14px',
                            lineHeight: '16.94px',
                            mb: '4px',
                            color: theme.palette.customColors.neutralSecondary,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {eggDetails?.room_name ? eggDetails?.room_name : 'Room Name'}
                        </Typography>
                      </Tooltip>
                      <Tooltip title={eggDetails?.incubator_name ? eggDetails?.incubator_name : 'Incubator Code'}>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: '16px',
                            lineHeight: '19.36px',
                            color: theme.palette.customColors.OnSurfaceVariant,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {eggDetails?.incubator_code ? eggDetails?.incubator_code : 'Incubator Code'}
                        </Typography>
                      </Tooltip>
                    </Box>
                  </Box>
                  {Number(eggDetails?.action_to_be_taken) != 4 ? (
                    <Box
                      onClick={() => setTransferEggSideBar(true)}
                      sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: '14px',
                          lineHeight: '19.36px',
                          color: theme.palette.primary.main
                        }}
                      >
                        {t('transfer')}
                      </Typography>
                      <Icon
                        color={theme.palette.customColors.addPrimary}
                        style={{ cursor: 'pointer', color: theme.palette.primary.main, transform: 'rotateY(180deg)' }}
                        icon='akar-icons:arrow-repeat'
                        fontSize={24}
                      />
                    </Box>
                  ) : null}
                </Box>
                <Grid container sx={{ gap: '16px', justifyContent: 'space-between' }}>
                  <Grid
                    item
                    size={{ xs: 12 }}
                    sx={{
                      borderRadius: '8px',
                      border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                      padding: '16px'
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '16px',
                        lineHeight: '19.36px',
                        color: theme.palette.customColors.neutralSecondary,
                        mb: '10px'
                      }}
                    >
                      {t('diet_module.temperature')}
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: '20px', lineHeight: '24.2px', mb: '14px' }}>
                      {t('diet_module.coming_soon')}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '16.94px',
                        color: theme.palette.customColors.neutralSecondary
                      }}
                    >
                      {t('diet_module.coming_soon')}
                    </Typography>
                  </Grid>
                  <Grid
                    item
                    size={{ xs: 12 }}
                    sx={{
                      borderRadius: '8px',
                      border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                      padding: '16px'
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '16px',
                        lineHeight: '19.36px',
                        color: theme.palette.customColors.neutralSecondary,
                        mb: '10px'
                      }}
                    >
                      {t('diet_module.humidity')}
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: '20px', lineHeight: '24.2px', mb: '14px' }}>
                      {t('diet_module.coming_soon')}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '16.94px',
                        color: theme.palette.customColors.neutralSecondary
                      }}
                    >
                      {t('diet_module.coming_soon')}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, md: 8 }}>
          <Card sx={{ border: 1, borderColor: theme.palette.customColors.OutlineVariant }}>
            <CardHeader
              sx={{
                pb: 0,
                pl: 6
              }}
              title='Egg History'
              action={headerAction}
            />
            <CardContent>
              <Grid
                container
                spacing={6}
                sx={{
                  justifyContent: 'space-between'
                }}
              >
                <Grid item size={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
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
                      <Grid container key={key} sx={{ justifyContent: 'space-between', pb: '4px' }}>
                        <Grid item size={{ xs: 6 }}>
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
                        <Grid item size={{ xs: 6 }}>
                          <Tooltip title={value ? value : '-'}>
                            <Typography
                              sx={{
                                fontWeight: 400,
                                fontSize: '14px',
                                lineHeight: '16.94px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: theme.palette.customColors.OnSurfaceVariant
                              }}
                            >
                              {value}
                            </Typography>
                          </Tooltip>
                        </Grid>
                      </Grid>
                    ))}
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
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
                      <Grid key={key} container sx={{ justifyContent: 'space-between', pb: '4px' }}>
                        <Grid item size={{ xs: 6 }}>
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
                        <Grid item size={{ xs: 6 }}>
                          <Tooltip title={value ? value : '-'}>
                            <Typography
                              onClick={() => {
                                if (
                                  (key === 'Mother id' && eggDetails?.parent_list?.mother_list?.length > 0) ||
                                  (key === 'Father id' && eggDetails?.parent_list?.father_list?.length > 0)
                                ) {
                                  setProbableParentSideBar(true)
                                  setParent(key === 'Mother id' ? 'Mother' : 'Father')
                                  setParentList(
                                    key === 'Mother id'
                                      ? eggDetails?.parent_list?.mother_list
                                      : eggDetails?.parent_list?.father_list
                                  )
                                }
                              }}
                              sx={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                cursor: 'pointer',
                                textDecoration: key === 'Mother id' || key === 'Father id' ? 'underline' : 'none',
                                fontWeight: key === 'Mother id' || key === 'Father id' ? 600 : 400,
                                fontSize: '14px',
                                lineHeight: '16.94px',
                                color:
                                  key === 'Mother id' || key === 'Father id'
                                    ? theme.palette.customColors.addPrimary
                                    : theme.palette.customColors.OnSurfaceVariant
                              }}
                            >
                              {value}
                            </Typography>
                          </Tooltip>
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
                    {t('egg_module.initial_measurement')}
                  </Typography>
                  <Divider />
                </Box>
                <Box>
                  <Grid
                    container
                    sx={{
                      gap: '24px'
                    }}
                  >
                    <Grid
                      item
                      size={{ xs: 12, sm: 3.55, md: 3.5, lg: 3.55, xl: 3.72, xxl: 3.72 }}
                      sx={{
                        borderRight: { xs: 'none', sm: `1px solid ${theme.palette.customColors.InnerAlignment}` },
                        borderBottom: { xs: `1px solid ${theme.palette.customColors.InnerAlignment}`, sm: 'none' },
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
                            {eggDetails?.initial_length ? eggDetails?.initial_length : 'Not Added'}
                          </Typography>
                          <Typography
                            sx={{
                              fontWeight: 400,
                              fontSize: '14px',
                              lineHeight: '16.94px',
                              color: theme.palette.customColors.neutralSecondary
                            }}
                          >
                            {t('diet_module.length')}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid
                      item
                      size={{ xs: 12, sm: 3.55, md: 3.5, lg: 3.55, xl: 3.72, xxl: 3.72 }}
                      sx={{
                        borderRight: { xs: 'none', sm: `1px solid ${theme.palette.customColors.InnerAlignment}` },
                        borderBottom: { xs: `1px solid ${theme.palette.customColors.InnerAlignment}`, sm: 'none' },
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
                            {eggDetails?.initial_width ? eggDetails?.initial_width : 'Not Added'}
                          </Typography>
                          <Typography
                            sx={{
                              fontWeight: 400,
                              fontSize: '14px',
                              lineHeight: '16.94px',
                              color: theme.palette.customColors.neutralSecondary
                            }}
                          >
                            {t('diet_module.width')}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} size={{ xs: 12, sm: 3.55, md: 3.5, lg: 3.55, xl: 3.72, xxl: 3.72 }}>
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
                            {eggDetails?.initial_weight ? eggDetails?.initial_weight : ' Not Added'}
                          </Typography>
                          <Typography
                            sx={{
                              fontWeight: 400,
                              fontSize: '14px',
                              lineHeight: '16.94px',
                              color: theme.palette.customColors.neutralSecondary
                            }}
                          >
                            {t('diet_module.weight')}
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

        <Grid item size={{ xs: 12, md: 6, xl: 8 }}>
          <Card sx={{ border: 1, borderColor: theme.palette.customColors.OutlineVariant }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '20px',
                    lineHeight: '24.2px',
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  {t('egg_module.egg_weight')}
                </Typography>
                <Box sx={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <Box
                      sx={{
                        backgroundColor: theme.palette.primary.main,
                        height: '10px',
                        width: '10px',
                        borderRadius: '10px'
                      }}
                    ></Box>
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '16.94px',
                        letterSpacing: '0.1px',
                        color: theme.palette.customColors.neutralSecondary
                      }}
                    >
                      {t('egg_module.actual_value')}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '16.94px',
                      letterSpacing: '0.1px',
                      color: theme.palette.customColors.neutralSecondary
                    }}
                  >
                    {t('egg_module.x_days')}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '16.94px',
                      letterSpacing: '0.1px',
                      color: theme.palette.customColors.neutralSecondary
                    }}
                  >
                    {t('egg_module.y_weight')}
                  </Typography>
                </Box>
              </Box>
              <ReactApexcharts type='line' height={220} series={series} options={options} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, md: 6, xl: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader sx={{ pb: 0, pl: 6 }} title='Weights (Grams)' action={weightHeaderAction} />
            <CardContent style={{ paddingBottom: 0 }}>
              <CustomTableContainer
                style={{ border: `0.5px solid ${theme.palette.customColors.OutlineVariant}`, borderRadius: '8px' }}
                component={Paper}
                sx={{ height: 174 }}
              >
                <Table stickyHeader sx={{ borderRadius: '8px' }} aria-label='sticky table'>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ backgroundColor: theme.palette.customColors.antzInfo70, py: 1 }}>
                        {t('date')}
                      </TableCell>
                      <TableCell sx={{ backgroundColor: theme.palette.customColors.antzInfo70, py: 1 }}>
                        {t('time')}
                      </TableCell>
                      <TableCell sx={{ backgroundColor: theme.palette.customColors.antzInfo70, py: 1 }}>
                        {t('actual')}
                      </TableCell>
                      <TableCell sx={{ backgroundColor: theme.palette.customColors.antzInfo70, py: 1 }}>
                        {t('edit')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {eggDetails?.assessments_data?.map((row, key) => {
                      return (
                        <TableRow
                          bor
                          key={key}
                          sx={{
                            py: 1,
                            '& td': {
                              border: key === 2 && 'none !important'
                            }
                          }}
                          hover
                        >
                          <Tooltip title={Utility.formatDisplayDate(Utility.convertUTCToLocal(row?.created_at))}>
                            <TableCell
                              style={{
                                padding: '11px 12px 11px 12px',
                                fontSize: '12px',
                                fontWeight: '400',
                                color: theme.palette.customColors.OnSurfaceVariant,
                                overflow: 'hidden',
                                maxWidth: '80px',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {Utility.formatDisplayDate(Utility.convertUTCToLocal(row?.created_at))}
                            </TableCell>
                          </Tooltip>
                          <Tooltip title={Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(row?.created_at))}>
                            <TableCell
                              style={{
                                padding: '11px 12px 11px 12px',
                                fontSize: '12px',
                                fontWeight: '400',
                                color: theme.palette.customColors.OnSurfaceVariant,
                                maxWidth: '80px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {Utility?.extractHoursAndMinutes(Utility.convertUTCToLocal(row?.created_at))}
                            </TableCell>
                          </Tooltip>
                          <TableCell
                            style={{
                              padding: '11px 12px 11px 12px',
                              fontSize: '12px',
                              fontWeight: '400',
                              color: theme.palette.customColors.OnSurfaceVariant,
                              maxWidth: '150px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <Tooltip
                              title={`${
                                Number(row?.assessment_value || 0) % 1 === 0
                                  ? Math.floor(Number(row?.assessment_value || 0))
                                  : Number(row?.assessment_value || 0).toFixed(2)
                              } ${row?.uom_abbr}`}
                              placement='top'
                            >
                              <span>
                                {`${
                                  Number(row?.assessment_value || 0) % 1 === 0
                                    ? Math.floor(Number(row?.assessment_value || 0))
                                    : Number(row?.assessment_value || 0).toFixed(2)
                                } ${row?.uom_abbr}`}
                              </span>
                            </Tooltip>
                          </TableCell>
                          <TableCell
                            style={{
                              padding: '11px 12px 11px 12px',
                              fontSize: '12px',
                              fontWeight: '400',
                              color: theme.palette.customColors.OnSurfaceVariant
                            }}
                          >
                            <Typography
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                paddingLeft: '8px'
                              }}
                            >
                              <Icon
                                onClick={() => {
                                  setEditWeight(true)
                                  setValue('assessment_value', row?.assessment_value)
                                  setValue('assessment_id', row?.id)
                                  setAddWeightSidebar(true)
                                }}
                                style={{ cursor: 'pointer' }}
                                icon='ic:outline-edit'
                                fontSize={20}
                              />
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CustomTableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0, mt: 1 }}>
                {total > 3 && <Button onClick={() => setAllWeightSidebarOpen(true)}>View All</Button>}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <ViewAllWeightSideBar />
      <AddWeightSideBar />
      <EggActivityLogs
        activtyLogSideBar={activtyLogSideBar}
        setActivtyLogSideBar={setActivtyLogSideBar}
        egg_id={egg_id}
        activtyLogData={activtyLogData}
        setActivtyLogData={setActivtyLogData}
        activtyLogCount={activtyLogCount}
        setActivtyLogCount={setActivtyLogCount}
      />
      <ProbableParent
        probableParentSideBar={probableParentSideBar}
        setProbableParentSideBar={setProbableParentSideBar}
        parent={parent}
        parentList={parentList}
      />
      <TransferEgg
        transferEggSideBar={transferEggSideBar}
        setTransferEggSideBar={setTransferEggSideBar}
        eggDetails={eggDetails}
        getDetails={getDetails}
        egg_id={egg_id}
      />
    </Box>
  )
}

export default EggSecondSecion
