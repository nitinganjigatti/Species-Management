import React, { useCallback, useEffect, useState, useContext } from 'react'
import { useRouter } from 'next/router'
import Router from 'next/router'

// MUI components
import {
  Autocomplete,
  Avatar,
  Breadcrumbs,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
  Tooltip,
  Typography,
  debounce
} from '@mui/material'
import { Box } from '@mui/system'
import { useTheme, styled } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers'

import dayjs from 'dayjs'
import moment from 'moment'

// Custom Components and Utility
import { AuthContext } from 'src/context/AuthContext'
import Utility from 'src/utility'
import ErrorScreen from 'src/pages/Error'

import Icon from 'src/@core/components/icon'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import ActivityLogs from 'src/components/diet/activityLogs'
import DetailCard from 'src/components/egg/DetailCard'
import Toaster from 'src/components/Toaster'
import { SpeciesImageCard } from 'src/components/egg/imageTextCard'
import AddIncubators from 'src/views/pages/egg/incubator/addIncubators'
import StatusDialogBox from 'src/views/pages/egg/eggs/eggDetails/StatusDialogBox'
import TransferIncubator from 'src/views/pages/egg/eggs/eggDetails/TransferIncubator'
import EditRedirectionDialog from 'src/views/pages/egg/eggs/eggDetails/EditRedirectionDialog'

// API calls
import { getSpeciesList } from 'src/lib/api/egg/dashboard'
import { getIncubatorDetail } from 'src/lib/api/egg/incubator'
import { GetEggList } from 'src/lib/api/egg/egg'
import { hatcheryStatus } from 'src/lib/api/egg'
import { useTranslation } from 'react-i18next'

const IncubatorDetails = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const router = useRouter()
  const { id } = router.query
  const authData = useContext(AuthContext)

  // Permissions
  const egg_nursery_permission = authData?.userData?.permission?.user_settings?.add_nursery_permisson
  const egg_collection_permission = authData?.userData?.roles?.settings?.enable_egg_collection_module

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [status, setStatus] = useState('eggs_received')
  const [transferIncubatorSideBar, setTransferIncubatorSideBar] = useState(false)

  const [openStatusDialog, setOpenStatusDialog] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [active, setActive] = useState(false)

  const [allocationDate, setAllocationDate] = useState(null)
  const [collectedDate, setCollectedDate] = useState(null)
  const [defaultSpecie, setDefaultSpecie] = useState(null)
  const [speciesLoader, setSpeciesLoader] = useState(false)
  const [speciesList, setSpeciesList] = useState([])

  let [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [loading, setLoading] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [activitySidebarOpen, setActivitySidebarOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [incubatorDetail, setIncubatorDetail] = useState(null)
  const [incubatorDetailList, setIncubatorDetailList] = useState(null)

  const [openRedirectionDialog, setOpenRedirectionDialog] = useState(false)
  const [editMessage, setEditMessage] = useState('')

  // Utility Functions
  const calculatePercentageChange = (value1, value2) => {
    // initial_weight
    const numValue1 = parseFloat(value1)

    // current_weight
    const numValue2 = parseFloat(value2)

    const difference = numValue2 - numValue1
    const percentageChange = (difference / numValue1) * 100

    return percentageChange > 0 ? `+${percentageChange.toFixed()}` : percentageChange.toFixed()
  }

  const EditRedirectionFunc = () => {
    setIsEdit(true)
    setDialog(true)
    setOpenRedirectionDialog(false)
  }

  const handleSidebarClose = () => {
    setDialog(false)
  }

  const handleActivitySidebarClose = () => {
    setActivitySidebarOpen(false)
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const hatcheryStatusFunc = async () => {
    setStatusLoading(true)

    try {
      const response = await hatcheryStatus({
        ref_type: 'incubator',
        ref_id: id,
        status: active ? 'deactivate' : 'activate'
      })

      if (response.success) {
        Toaster({
          type: 'success',
          message: active ? 'Incubator Deactivated Successfully' : 'Incubator Activated Successfully'
        })
        setActive(!active)
      } else {
        Toaster({ type: 'error', message: response.message })
        setEditMessage(response?.message)
        setOpenRedirectionDialog(true)
      }

      getIncubatorDetailFunc()
    } catch (error) {
      Toaster({ type: 'error', message: error.message || 'Something went wrong while updating status' })
    } finally {
      setOpenStatusDialog(false)
      setStatusLoading(false)
    }
  }

  const columns = [
    {
      width: 80,
      field: 'uid',
      headerName: t('s_no'),
      align: 'center',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      width: 240,
      sortable: false,
      field: 'species',
      headerName: t('navigation.species'),
      renderCell: params => (
        <SpeciesImageCard
          imgURl={params.row.default_icon}
          defaultName={params.row.default_common_name}
          completeName={params.row.complete_name}
          eggIcon={'/icons/Egg_icon.png'}
        />
      )
    },
    {
      width: 170,
      sortable: false,
      field: 'egg_number',
      headerName: t('egg_module.egg_identifier'),
      renderCell: params => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '500',
              lineHeight: '19.36px'
            }}
          >
            AEID: {params.row.egg_code ? params.row.egg_code : '-'}
          </Typography>{' '}
          {params.row.egg_number && (
            <Typography
              style={{
                color: theme.palette.customColors.neutralSecondary,
                fontSize: '12px',
                fontWeight: '400',
                lineHeight: '14.52px'
              }}
            >
              UEID : {params.row.egg_number}
            </Typography>
          )}{' '}
        </Box>
      )
    },
    {
      width: 170,
      sortable: false,
      field: 'stage',
      headerName: t('egg_module.state_stage'),
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexDirection: 'column' }}>
          <Box>
            <Typography
              sx={{
                color:
                  params.row.egg_status === 'Fresh' || params.row.egg_status === 'Fertile'
                    ? theme.palette.primary.dark
                    : params.row.egg_status === 'Discard'
                    ? theme.palette.customColors.Tertiary
                    : params.row.egg_status === 'Hatched'
                    ? theme.palette.primary.main
                    : null,
                fontSize: '14px',
                fontWeight: '500',
                px: 3,
                backgroundColor:
                  params.row.egg_status === 'Discard'
                    ? theme.palette.customColors.AntzTertiary
                    : params.row.egg_status === 'Fresh' ||
                      params.row.egg_status === 'Fertile' ||
                      params.row.egg_status === 'Hatched'
                    ? theme.palette.customColors.lightBg
                    : theme.palette.customColors.lightBg,
                borderRadius: '4px',
                display: 'inline-block'
              }}
            >
              {params.row.egg_status ? params.row.egg_status : '-'}
            </Typography>{' '}
          </Box>
          {params.row.egg_state && (
            <Tooltip title={params.row.egg_state ? params.row.egg_state : '-'}>
              <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '16px',
                  fontWeight: '400',
                  lineHeight: '19.36px',
                  width: '75%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {params.row.egg_state}
              </Typography>
            </Tooltip>
          )}
        </Box>
      )
    },
    {
      width: 180,
      sortable: false,
      field: 'incubation',
      headerName: t('egg_module.days_in_incubation'),
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '500',
            lineHeight: '19.36px'
          }}
        >
          {params.row.days_in_incubation ? params.row.days_in_incubation : '-'}
        </Typography>
      )
    },
    {
      width: 170,
      sortable: false,
      field: 'currentweight',
      headerName: t('egg_module.current_weight'),
      aline: 'center',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.current_weight ? params.row.current_weight : '-'}{' '}
          {params.row.initial_weight && params.row.current_weight && (
            <span
              style={{
                borderLeft: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                paddingLeft: 4,
                color:
                  calculatePercentageChange(Number(params.row.initial_weight), Number(params.row.current_weight)) > 0
                    ? theme.palette.primary.main
                    : calculatePercentageChange(Number(params.row.initial_weight), Number(params.row.current_weight)) <
                      0
                    ? theme.palette.formContent.tertiary
                    : theme.palette.customColors.neutralSecondary
              }}
            >
              {calculatePercentageChange(Number(params.row.initial_weight), Number(params.row.current_weight))}%
            </span>
          )}
        </Typography>
      )
    },
    {
      width: 140,
      sortable: false,
      field: 'initialWeight',
      headerName: t('egg_module.initial_weight'),
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.initial_weight ? params.row.initial_weight : '-'}
        </Typography>
      )
    },
    {
      width: 140,
      sortable: false,
      field: 'initialSizeL',
      headerName: `${t('egg_module.initial_size')} - L`,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.initial_length ? params.row.initial_length : '-'}
        </Typography>
      )
    },
    {
      width: 140,
      sortable: false,
      field: 'initialSizeW',
      headerName: `${t('egg_module.initial_size')} - W`,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.initial_width ? params.row.initial_width : '-'}
        </Typography>
      )
    },
    {
      width: 170,
      sortable: false,
      field: 'clutch',
      headerName: t('egg_module.no_egg_clutch'),
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.no_of_eggs_in_clutch ? params.row.no_of_eggs_in_clutch : '-'}
        </Typography>
      )
    },
    {
      width: 140,
      sortable: false,
      field: 'clutchId',
      headerName: t('egg_module.clutch_id'),
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.clutch_id ? params.row.clutch_id : '-'}
        </Typography>
      )
    },
    {
      width: 140,
      sortable: false,
      field: 'site',
      headerName: t('site'),
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.site_name ? params.row.site_name : '-'}
        </Typography>
      )
    },
    {
      width: 140,
      sortable: false,
      field: 'nursery',
      headerName: t('egg_module.nursery'),
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.nursery_name ? params.row.nursery_name : '-'}
        </Typography>
      )
    },
    {
      width: 140,
      sortable: false,
      field: 'collected_on',
      headerName: t('collected_on'),
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px',
            ml: 2
          }}
        >
          {params.row.collection_date
            ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row?.collection_date))
            : '-'}
        </Typography>
      )
    },
    {
      width: 140,
      sortable: false,
      field: 'enclosure',
      headerName: t('enclosure'),
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '500',
            lineHeight: '19.36px'
          }}
        >
          {params.row.enclosure_id ? params.row.enclosure_id : '-'}
        </Typography>
      )
    },
    {
      width: 200,
      sortable: false,
      field: 'collected_by',
      headerName: t('added_by'),
      renderCell: params => (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar
              variant='square'
              alt='Medicine Image'
              className={status === 'eggs_received' ? 'hideField' : ''}
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: theme.palette.customColors.displaybgPrimary,
                overflow: 'hidden'
              }}
            >
              {params.row.user_profile_pic ? (
                <img
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  src={params.row.user_profile_pic}
                  alt='Profile'
                />
              ) : (
                <Icon icon='mdi:user' fontSize={30} />
              )}
            </Avatar>
            <Box
              sx={{ display: 'flex', flexDirection: 'column' }}
              className={status === 'eggs_received' ? 'hideField' : ''}
            >
              <Typography
                noWrap
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '16.94px'
                }}
              >
                {params.row.user_full_name ? params.row.user_full_name : '-'}
              </Typography>
              <Typography
                noWrap
                sx={{
                  color: theme.palette.customColors.neutralSecondary,
                  fontSize: '12px',
                  fontWeight: '400',
                  lineHeight: '14.52px'
                }}
              >
                {params.row.created_at
                  ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row?.created_at))
                  : '-'}
              </Typography>
            </Box>
          </Box>
        </>
      )
    }
  ]

  const getspeciesFunc = async q => {
    try {
      setSpeciesLoader(true)

      const res = await getSpeciesList({ q })

      if (res?.data?.success) {
        let listWithId = res?.data?.data?.result?.map((el, i) => {
          return { ...el, id: i + 1 }
        })
        setSpeciesList(loadServerRows(paginationModel.page, listWithId))
      } else {
        setSpeciesList([])
      }
    } catch (error) {
      setSpeciesList([])
      Toaster({ type: 'error', message: error.message || 'Something went wrong while updating status' })
    } finally {
      setSpeciesLoader(false)
    }
  }

  const searchSpecies = useCallback(
    debounce(async query => {
      try {
        // Trim the query to handle spaces and pass it to the API
        await getspeciesFunc(query?.trim())
      } catch (error) {
        console.error('Error fetching species:', error)
      }
    }, 1000),
    []
  )

  useEffect(() => {
    getspeciesFunc()
  }, [])

  const fetchTableData = useCallback(
    async (sort, q, status, allocation_date, collected_date, taxonomy_id) => {
      setLoading(true)

      const params = {
        sort,
        q,
        page_no: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        nursery_id: '',
        type: 'eggs_incubation',
        allocate_date: allocation_date,
        collected_date,
        taxonomy_id,
        incubator_id: id
      }

      try {
        const res = await GetEggList({ params: params })
        const total = parseInt(res?.data?.total_count || 0)
        const result = res?.data?.result || []

        const listWithId = result.map((el, i) => ({
          ...el,
          uid: i + 1
        }))
        setTotal(total)
        setRows(loadServerRows(paginationModel.page, listWithId))
      } catch (error) {
        setTotal(0)
        setRows([])
        Toaster({ type: 'error', message: error.message || 'Failed to fetch egg list' })
      } finally {
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    if (egg_collection_permission || egg_collection_permission) {
      fetchTableData(sort, searchValue, status)
    }
  }, [fetchTableData, status])

  const getIncubatorDetailFunc = async () => {
    if (!id) return

    try {
      const res = await getIncubatorDetail(id)
      const data = res?.data?.data

      if (data) {
        setIncubatorDetail(data)

        setIncubatorDetailList({
          list: {
            'No of Sensors': '-',
            'Slots Filled': `${data.no_of_eggs || '-'} / ${data.max_eggs || '-'}`,
            Site: data.site_name,
            'Room No': data.room_name,
            Nursery: data.nursery_name
          },
          AvatarLeft: {
            profile_Pic: '/icons/Incubator_CON.png',
            key: 'Incubator ID',
            value: data.incubator_code
          }
        })

        setActive(Boolean(Number(data.active)))
      }
    } catch (error) {
      console.error('Error fetching incubator details:', error)
    }
  }

  useEffect(() => {
    if (egg_nursery_permission || egg_collection_permission) {
      getIncubatorDetailFunc()
    }
  }, [id])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.egg_id,
    sl_no: getSlNo(index)
  }))

  const searchTableData = useCallback(
    debounce(async (sort, q, status, allocation_date, collected_date, taxonomy_id) => {
      setSearchValue(q)
      try {
        await fetchTableData(
          sort,
          q,
          status,
          allocation_date,
          collected_date != null ? dayjs(collected_date).format('YYYY-MM-DD') : null,
          taxonomy_id
        )
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = (value, allocation_date, collected_date, taxonomy_id) => {
    setSearchValue(value)
    searchTableData(sort, value, status, allocation_date, collected_date, taxonomy_id)
  }

  const onCellClick = params => {
    const clickedColumn = params.field !== 'switch'
    if (clickedColumn) {
      const data = params.row
      Router.push({
        pathname: `/egg/eggs/${data?.id}`
      })
    } else {
      return
    }
  }

  return (
    <>
      {egg_nursery_permission || egg_collection_permission ? (
        <>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
            <Typography color='inherit'>{t('egg_module.egg')}</Typography>

            <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => Router.push('/egg/incubators/')}>
              {t('egg_module.incubator_list')}
            </Typography>
            <Typography
              sx={{
                color: 'text.primary',
                cursor: 'pointer'
              }}
            >
              {t('egg_module.incubator_details')}
            </Typography>
          </Breadcrumbs>
          <Card>
            <CardContent
              sx={{
                paddingBottom: 0,
                paddingX: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <Box sx={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <Icon
                    style={{ cursor: 'pointer' }}
                    onClick={() => Router.push('/egg/incubators')}
                    color={theme.palette.customColors.OnSurfaceVariant}
                    icon='material-symbols:arrow-back'
                  />
                  <Typography
                    sx={{
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontWeight: 500,
                      fontSize: '24px',
                      lineHeight: '29.05px'
                    }}
                  >
                    {t('egg_module.incubator_details')}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    columnGap: '24px',
                    rowGap: '8px',
                    flexWrap: 'wrap'
                  }}
                >
                  <Box
                    onClick={() => setTransferIncubatorSideBar(true)}
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
                  <FormControlLabel
                    control={
                      <Switch
                        checked={active}
                        onChange={e => {
                          setOpenStatusDialog(true)
                        }}
                      />
                    }
                    sx={{ m: 0 }}
                    labelPlacement='start'
                    label='Active'
                  />

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      variant='square'
                      alt='Image'
                      src={incubatorDetail?.user_profile_pic || ''}
                      sx={{
                        width: 30,
                        height: 30,
                        mr: 4,
                        borderRadius: '50%',
                        background: theme.palette.customColors.displaybgPrimary,
                        overflow: 'hidden'
                      }}
                    ></Avatar>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography
                        noWrap
                        sx={{
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontSize: '14px',
                          fontWeight: '500',
                          lineHeight: '16.94px'
                        }}
                      >
                        {incubatorDetail?.user_full_name}
                      </Typography>
                      <Typography
                        noWrap
                        sx={{
                          color: theme.palette.customColors.neutralSecondary,
                          fontSize: '12px',
                          fontWeight: '400',
                          lineHeight: '14.52px'
                        }}
                      >
                        {t('updated_on')}{' '}
                        {Utility.formatDisplayDate(Utility.convertUTCToLocal(incubatorDetail?.created_at))}
                      </Typography>
                    </Box>
                  </Box>

                  {egg_nursery_permission && (
                    <Box>
                      <Icon
                        icon='bx:pencil'
                        style={{ fontSize: 24, cursor: 'pointer' }}
                        onClick={() => {
                          setIsEdit(true)
                          setDialog(true)
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Box>

              <DetailCard radius={'8px'} DetailsListData={incubatorDetailList} />

              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: '4px',
                    padding: '0 8px',
                    height: '40px'
                  }}
                >
                  <Icon icon='mi:search' color={theme.palette.customColors.OnSurfaceVariant} />
                  <TextField
                    variant='outlined'
                    placeholder='Search'
                    onChange={e =>
                      handleSearch(e.target.value, allocationDate, collectedDate, defaultSpecie?.taxonomy_id)
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        border: 'none',
                        padding: '0',
                        '& fieldset': {
                          border: 'none'
                        }
                      }
                    }}
                  />
                </Box>
                <Box sx={{ width: 220, display: 'flex', position: 'relative', height: '40px' }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      sx={{
                        backgroundColor: theme.palette.primary.contrastText,
                        borderColor: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          height: 40,
                          borderRadius: '4px'
                        }
                      }}
                      value={allocationDate ? dayjs(allocationDate) : null}
                      onChange={newDate => {
                        if (newDate) {
                          const formattedDate = dayjs(newDate).format('YYYY-MM-DD')
                          setAllocationDate(formattedDate)
                          fetchTableData(
                            sort,
                            searchValue,
                            status,
                            formattedDate,
                            collectedDate || null,
                            defaultSpecie?.taxonomy_id
                          )
                        } else {
                          setAllocationDate(null) // If cleared, reset the state
                          fetchTableData(
                            sort,
                            searchValue,
                            status,
                            null,
                            collectedDate || null,
                            defaultSpecie?.taxonomy_id
                          )
                        }
                      }}
                      slotProps={{ textField: { size: 'small' } }}
                      label={t('egg_module.allocated_date')}
                      maxDate={dayjs()}
                      format='DD/MM/YYYY'
                    />
                  </LocalizationProvider>
                  {/* Clear Button */}
                  {allocationDate != null && (
                    <Box
                      variant='outlined'
                      onClick={() => {
                        setAllocationDate(null) // Clear the date
                        fetchTableData(
                          sort,
                          searchValue,
                          status,
                          null,
                          collectedDate || null,
                          defaultSpecie?.taxonomy_id
                        )
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.palette.primary.contrastText,
                        cursor: 'pointer',
                        width: '36px',
                        height: '36px',
                        position: 'absolute',
                        right: 2,
                        top: 2
                      }}
                    >
                      <Icon icon={'radix-icons:cross-1'} />
                    </Box>
                  )}
                </Box>
                <Box sx={{ width: 220, display: 'flex', position: 'relative', height: '40px' }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      sx={{
                        backgroundColor: theme.palette.primary.contrastText,
                        borderColor: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          height: 40,
                          borderRadius: '4px'
                        }
                      }}
                      format='DD/MM/YYYY'
                      value={collectedDate ? dayjs(collectedDate) : null}
                      onChange={newDate => {
                        if (newDate) {
                          const formattedDate = dayjs(newDate).format('YYYY-MM-DD')
                          setCollectedDate(formattedDate)
                          fetchTableData(
                            sort,
                            searchValue,
                            status,
                            allocationDate || null,
                            formattedDate,
                            defaultSpecie?.taxonomy_id
                          )
                        } else {
                          setCollectedDate(null) // If cleared, reset the state
                          fetchTableData(
                            sort,
                            searchValue,
                            status,
                            allocationDate || null,
                            null,
                            defaultSpecie?.taxonomy_id
                          )
                        }
                      }}
                      slotProps={{ textField: { size: 'small' } }}
                      label={t('egg_module.collected_date')}
                      maxDate={dayjs()} // Ensure the maxDate is also a dayjs object
                    />
                  </LocalizationProvider>

                  {/* Clear Button */}
                  {collectedDate != null && (
                    <Box
                      variant='outlined'
                      onClick={() => {
                        setCollectedDate(null) // Clear the date

                        fetchTableData(
                          sort,
                          searchValue,
                          status,
                          allocationDate || null,
                          null,
                          defaultSpecie?.taxonomy_id
                        )
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.palette.primary.contrastText,
                        cursor: 'pointer',
                        width: '36px',
                        height: '36px',
                        position: 'absolute',
                        right: 2,
                        top: 2
                      }}
                    >
                      <Icon icon={'radix-icons:cross-1'} />
                    </Box>
                  )}
                </Box>

                <FormControl>
                  <Autocomplete
                    name='species'
                    value={defaultSpecie}
                    disablePortal
                    sx={{ width: 220 }}
                    id='species'
                    loading={speciesLoader}
                    options={speciesList?.length > 0 ? speciesList : []}
                    getOptionLabel={option => option.default_common_name}
                    isOptionEqualToValue={(option, value) => option?.taxonomy_id === value?.taxonomy_id}
                    renderOption={(props, option) => (
                      <li {...props} key={option.taxonomy_id}>
                        {option.default_common_name}
                      </li>
                    )}
                    onChange={(e, val) => {
                      if (val === null) {
                        setDefaultSpecie(null)
                        fetchTableData(sort, searchValue, status, allocationDate, collectedDate, null)
                      } else {
                        setDefaultSpecie(val)
                        fetchTableData(sort, searchValue, status, allocationDate, collectedDate, val.taxonomy_id)
                      }
                    }}
                    renderInput={params => (
                      <TextField
                        sx={{
                          backgroundColor: theme.palette.primary.contrastText,
                          borderColor: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                          width: '100%',
                          '& .MuiOutlinedInput-root': {
                            height: 40,
                            borderRadius: '4px'
                          },
                          '& .MuiInputLabel-root': {
                            top: -7
                          },
                          '& .MuiInputLabel-shrink': {
                            top: 0
                          },
                          '& input': {
                            position: 'relative',
                            top: -0
                          }
                        }}
                        onChange={e => {
                          searchSpecies(e.target.value)
                        }}
                        {...params}
                        label={t('navigation.species')}
                        placeholder='Search & Select'
                      />
                    )}
                  />
                </FormControl>
              </Box>
              {egg_collection_permission && (
                <Box>
                  <CommonTable
                    indexedRows={indexedRows === undefined ? [] : indexedRows}
                    total={total}
                    rowHeight={64}
                    columns={columns}
                    paginationModel={paginationModel}
                    setPaginationModel={setPaginationModel}
                    loading={loading}
                    columnVisibilityModel={{
                      sl_no: false
                    }}
                    slotProps={{
                      baseButton: {
                        variant: 'outlined'
                      },
                      toolbar: {
                        value: searchValue,
                        clearSearch: () => handleSearch(''),
                        onChange: event => handleSearch(event.target.value)
                      }
                    }}
                    onCellClick={onCellClick}
                    externalTableStyle={{
                      '.MuiDataGrid-cell:focus': {
                        outline: 'none'
                      },
                      '& .MuiDataGrid-row:hover': {
                        cursor: 'pointer'
                      },
                      '.MuiDataGrid-columnHeaderTitleContainer': {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      },
                      '.MuiDataGrid-columnHeader .MuiSvgIcon-root': {
                        display: 'none'
                      },
                      '.MuiDataGrid-columnHeaderFilterIcon': {
                        display: 'none'
                      },
                      '.MuiDataGrid-menuIcon': {
                        display: 'none'
                      },
                      '.MuiDataGrid-main': {
                        borderLeft: '1px solid #0000000D',
                        borderRight: '1px solid #0000000D',
                        borderRadius: '8px',
                        border: '1px solid rgba(233, 233, 236, 1)'
                      },
                      '& .MuiDataGrid-footerContainer': {
                        borderTop: 'none'
                      }
                    }}
                  />
                  {dialog && (
                    <AddIncubators
                      isEdit={isEdit}
                      actionApi={getIncubatorDetailFunc}
                      incubatorDetail={incubatorDetail}
                      drawerWidth={400}
                      sidebarOpen={dialog}
                      handleSidebarClose={handleSidebarClose}
                    />
                  )}
                  <ActivityLogs
                    activity_type={'sa'}
                    activitySidebarOpen={activitySidebarOpen}
                    handleSidebarClose={handleActivitySidebarClose}
                  />
                  <StatusDialogBox
                    active={active}
                    refType={'incubator'}
                    openStatusDialog={openStatusDialog}
                    setOpenStatusDialog={setOpenStatusDialog}
                    elements={total}
                    statusLoading={statusLoading}
                    toggleHatcheryStatus={hatcheryStatusFunc}
                  />
                  {transferIncubatorSideBar && (
                    <TransferIncubator
                      transferIncubatorSideBar={transferIncubatorSideBar}
                      setTransferIncubatorSideBar={setTransferIncubatorSideBar}
                      incubatorDetail={incubatorDetail}
                      getDetails={getIncubatorDetailFunc}
                      incubatorId={id}
                    />
                  )}
                  <EditRedirectionDialog
                    refType={'incubator'}
                    message={editMessage}
                    openRedirectionDialog={openRedirectionDialog}
                    setOpenRedirectionDialog={setOpenRedirectionDialog}
                    EditRedirectionFunc={EditRedirectionFunc}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <ErrorScreen></ErrorScreen>
        </>
      )}
    </>
  )
}

export default IncubatorDetails
