import {
  Avatar,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  Switch,
  Tooltip,
  Typography,
  debounce
} from '@mui/material'
import { Box } from '@mui/system'
import React, { useCallback, useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { DataGrid } from '@mui/x-data-grid'
import AddIncubators from '../../../../views/pages/egg/incubator/addIncubators'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import moment from 'moment'
import ActivityLogs from 'src/components/diet/activityLogs'
import { getIncubatorDetail } from 'src/lib/api/egg/incubator'
import { useRouter } from 'next/router'
import Router from 'next/router'
import { GetEggList } from 'src/lib/api/egg/egg'

import { styled } from '@mui/material/styles'

const CustomDataGrid = styled(DataGrid)(({ theme }) => ({
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
  }
}))

const IncubatorDetails = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query
  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [status, setStatus] = useState('eggs_received')

  let [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 5 })
  const [loading, setLoading] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [activitySidebarOpen, setActivitySidebarOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [incubatorDetail, setIncubatorDetail] = useState(null)

  const handleSidebarClose = () => {
    setDialog(false)
  }

  const handleActivitySidebarClose = () => {
    setActivitySidebarOpen(false)
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const columns = [
    {
      flex: 0.02,
      Width: 40,
      field: 'uid',
      headerName: 'SL ',
      align: 'center',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,

            // fontSize: '12px',
            // fontWeight: '400',
            textAlign: 'center'

            // lineHeight: '14.52px'
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      flex: 0.25,
      minWidth: 60,
      sortable: false,
      field: 'species',
      headerName: 'SPECIES',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            variant='rounded'
            alt='Medicine Image'
            sx={{
              width: 35,
              height: 35,
              mr: 4,
              borderRadius: '50%',
              background: '#E8F4F2',
              overflow: 'hidden'
            }}
          >
            {params.row.default_icon ? (
              <img style={{ width: '100%', height: '100%' }} src={params.row.default_icon} alt='Profile' />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Tooltip title={params.row.complete_name ? params.row.complete_name : '-'}>
              <Typography
                sx={{
                  color: theme.palette.primary.light,
                  fontSize: '16px',
                  fontWeight: '500',
                  lineHeight: '19.36px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%'
                }}
              >
                {params.row.complete_name ? params.row.complete_name : '-'}
              </Typography>
            </Tooltip>
            <Tooltip title={params.row?.default_common_name ? params.row?.default_common_name : '-'}>
              <Typography
                sx={{
                  color: theme.palette.primary.light,
                  fontSize: '14px',
                  fontWeight: '400',
                  lineHeight: '16.94px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%'
                }}
              >
                {params.row?.default_common_name ? params.row?.default_common_name : '-'}
              </Typography>
            </Tooltip>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.14,
      minWidth: 60,
      sortable: false,
      field: 'egg_number',
      align: 'center',
      headerName: 'EGG NUMBER',
      renderCell: params => (
        <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            {params.row.egg_code ? params.row.egg_code : '-'}
          </Typography>{' '}
          <Typography
            sx={{
              color:
                params.row.egg_condition === 'Intact'
                  ? theme.palette.primary.main
                  : params.row.egg_condition === 'Rotten'
                  ? '#fa6140'
                  : params.row.egg_condition === 'Cracked'
                  ? '#fa6140'
                  : params.row.egg_condition === 'Broken'
                  ? '#fa6140'
                  : params.row.egg_condition === 'Hatched'
                  ? '#32bfdd'
                  : params.row.egg_condition === 'Thin-Shelled'
                  ? '#fa6140'
                  : null,
              fontSize: '14px',
              fontWeight: '500',
              px: 3,

              backgroundColor:
                params.row.egg_condition === 'Rotten'
                  ? '#FFD3D3'
                  : params.row.egg_condition === 'Cracked'
                  ? '#FFD3D3'
                  : params.row.egg_condition === 'Broken'
                  ? '#FFD3D3'
                  : params.row.egg_condition === 'Thin-Shelled'
                  ? '#FFD3D3'
                  : '#E1F9ED',

              textAlign: 'center',
              borderRadius: '4px'
            }}
          >
            {params.row.egg_condition ? params.row.egg_condition : '-'}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.15,
      minWidth: 10,
      sortable: false,
      field: 'site',
      headerName: 'SITE NAME',
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
      flex: 0.2,
      minWidth: 10,
      sortable: false,
      field: 'collected_on',
      headerName: 'COLLECTED ON',

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
          {params.row.collection_date ? moment(params.row.collection_date).format('DD/MM/YYYY') : '-'}
        </Typography>
      )
    },
    {
      flex: 0.25,
      minWidth: 20,
      sortable: false,
      field: 'collected_by',
      headerName: 'ADDED BY',
      renderCell: params => (
        <>
          {/* {status === 'eggs_received' && (
            <Button className='customButton' variant='contained' onClick={e => handleAction(e, params.row.id)}>
              Allocate{' '}
            </Button>
          )} */}
          {/* {status === 'eggs_received' ? (
            <>
              <div>
                <DiscardStatusCell
                  customButton={status === 'eggs_received' ? 'customButton' : null}
                  hideField='hideField'
                  params={params}
                  setIsOpen={setIsOpen}
                  handleDiscard={handleDiscard}
                  setEggId={setEggId}
                  handleAction={handleAction}

                  // hover={hover} setHover={setHover}
                />
              </div>
            </>
          ) : ( */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              variant='square'
              alt='Medicine Image'
              className={status === 'eggs_received' ? 'hideField' : ''}
              sx={{
                width: 30,
                height: 30,
                mr: 4,
                borderRadius: '50%',
                background: '#E8F4F2',
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
                {params.row.created_at ? moment(params.row.created_at).format('DD/MM/YYYY') : '-'}
              </Typography>
            </Box>
          </Box>
          {/* )} */}
        </>
      )
    }

    // {
    //   flex: 0.5,
    //   minWidth: 60,
    //   sortable: false,
    //   field: 'added_by',
    //   headerName: 'ADDED BY',
    //   renderCell: params => (
    //     <Box sx={{ display: 'flex', alignItems: 'center' }}>
    //       <Avatar
    //         variant='circular'
    //         alt='Medicine Image'
    //         sx={{
    //           width: 30,
    //           height: 30,
    //           mr: 4,
    //           borderRadius: '50%',
    //           background: '#E8F4F2',
    //           overflow: 'hidden'
    //         }}
    //       >
    //         {params.row.species?.species_pic ? (
    //           <img
    //             style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    //             src={params.row.species?.species_pic}
    //             alt='Profile'
    //           />
    //         ) : (
    //           <Icon icon='mdi:user' />
    //         )}
    //       </Avatar>
    //       <Box sx={{ display: 'flex', flexDirection: 'column' }}>
    //         <Typography
    //           noWrap
    //           sx={{
    //             color: theme.palette.primary.light,
    //             fontSize: '16px',
    //             fontWeight: '500',
    //             lineHeight: '19.36px'
    //           }}
    //         >
    //           {params.row.species?.species_name ? params.row.species?.species_name : '-'}
    //         </Typography>
    //         <Tooltip title={params.row?.species?.species_desc ? params.row?.species?.species_desc : '-'}>
    //           <Typography
    //             noWrap
    //             sx={{
    //               color: theme.palette.customColors.neutralSecondary,
    //               fontSize: '14px',
    //               fontWeight: '400',
    //               lineHeight: '16.94px'
    //             }}
    //           >
    //             {params.row?.species?.species_desc ? params.row?.species?.species_desc : '-'}
    //           </Typography>
    //         </Tooltip>
    //       </Box>
    //     </Box>
    //   )
    // },
    // {
    //   flex: 0.35,
    //   minWidth: 30,
    //   sortable: false,
    //   field: 'days_in_incubation',
    //   headerName: 'Days In Incubation',
    //   renderCell: params => (
    //     <Typography
    //       noWrap
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '500',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.days_in_incubation ? params.row.days_in_incubation : '-'}
    //     </Typography>
    //   )
    // },
    // {
    //   flex: 0.35,
    //   minWidth: 10,
    //   sortable: false,
    //   field: 'stage',
    //   headerName: 'Stage',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.primary.dark,
    //         fontSize: '16px',
    //         fontWeight: '500',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.stage ? params.row.stage : '-'}
    //     </Typography>
    //   )
    // },

    // {
    //   flex: 0.35,
    //   minWidth: 10,
    //   field: 'condition',
    //   headerName: 'Condition',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.primary.dark,
    //         fontSize: '16px',
    //         fontWeight: '500',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.condition ? params.row.condition : '-'}
    //     </Typography>
    //   )
    // },
    // {
    //   flex: 0.35,
    //   minWidth: 10,
    //   field: 'curret_weight',
    //   headerName: 'Curret Weight',
    //   renderCell: params => (
    //     <Box sx={{ display: 'flex' }}>
    //       <Typography
    //         sx={{
    //           color: theme.palette.customColors.OnSurfaceVariant,
    //           fontSize: '14px',
    //           fontWeight: '500',
    //           lineHeight: '16.94px'
    //         }}
    //       >
    //         {params.row.curret_weight?.gram ? params.row.curret_weight?.gram : '-'}
    //       </Typography>
    //       <Typography
    //         sx={{
    //           color: theme.palette.customColors.OnSurfaceVariant,
    //           fontSize: '14px',
    //           fontWeight: '500',
    //           lineHeight: '16.94px'
    //         }}
    //       >
    //         &nbsp;|&nbsp;
    //       </Typography>
    //       <Typography
    //         sx={{
    //           color: theme.palette.primary.main,
    //           fontSize: '14px',
    //           fontWeight: '500',
    //           lineHeight: '16.94px'
    //         }}
    //       >
    //         {params.row.curret_weight?.precentage ? params.row.curret_weight?.precentage : '-'}%
    //       </Typography>
    //     </Box>
    //   )
    // },
    // {
    //   flex: 0.35,
    //   minWidth: 10,
    //   field: 'initial_weight',
    //   headerName: 'Initial Weight',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.initial_weight ? params.row.initial_weight : '-'}
    //     </Typography>
    //   )
    // },
    // {
    //   flex: 0.35,
    //   minWidth: 10,
    //   field: 'initial_size_l',
    //   headerName: 'Initial Size L',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.initial_size_l ? params.row.initial_size_l : '-'}
    //     </Typography>
    //   )
    // },
    // {
    //   flex: 0.35,
    //   minWidth: 10,
    //   field: 'initial_size_w',
    //   headerName: 'Initial Size W',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.initial_size_w ? params.row.initial_size_w : '-'}
    //     </Typography>
    //   )
    // },
    // {
    //   flex: 0.35,
    //   minWidth: 10,
    //   field: 'no_of_egg',
    //   headerName: 'No Of Egg',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.no_of_egg ? params.row.no_of_egg : '-'}
    //     </Typography>
    //   )
    // },
    // {
    //   flex: 0.35,
    //   minWidth: 10,
    //   field: 'clutch_id',
    //   headerName: 'Clutch Id',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.clutch_id ? params.row.clutch_id : '-'}
    //     </Typography>
    //   )
    // },
    // {
    //   flex: 0.35,
    //   minWidth: 20,
    //   field: 'site',
    //   headerName: 'SITE',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.site ? params.row.site : '-'}
    //     </Typography>
    //   )
    // },
    // {
    //   flex: 0.35,
    //   minWidth: 20,
    //   field: 'nursery',
    //   headerName: 'Nursery',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.nursery ? params.row.nursery : '-'}
    //     </Typography>
    //   )
    // },
    // {
    //   flex: 0.35,
    //   minWidth: 20,
    //   field: 'inclosure',
    //   headerName: 'Inclosure',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.primary.dark,
    //         fontSize: '16px',
    //         fontWeight: '500',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.inclosure ? params.row.inclosure : '-'}
    //     </Typography>
    //   )
    // },
    // {
    //   flex: 0.24,
    //   minWidth: 20,
    //   field: 'collected_on',
    //   headerName: 'Collected On',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.collected_on ? moment(params.row?.collected_on).format('DD MMM YYYY') : '-'}
    //     </Typography>
    //   )
    // },
    // {
    //   flex: 0.24,
    //   minWidth: 20,
    //   field: 'ley_date',
    //   headerName: 'Lay Date',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.ley_date ? moment(params.row?.ley_date).format('DD MMM YYYY') : '-'}
    //     </Typography>
    //   )
    // },
    // {
    //   flex: 0.5,
    //   minWidth: 60,
    //   field: 'collected_by',
    //   headerName: 'Collected BY',
    //   renderCell: params => (
    //     <Box sx={{ display: 'flex', alignItems: 'center' }}>
    //       <Avatar
    //         variant='square'
    //         alt='Medicine Image'
    //         sx={{
    //           width: 30,
    //           height: 30,
    //           mr: 4,
    //           borderRadius: '50%',
    //           background: '#E8F4F2',
    //           overflow: 'hidden'
    //         }}
    //       >
    //         {params.row.collected_by?.profile_pic ? (
    //           <img
    //             style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    //             src={params.row.collected_by?.profile_pic}
    //             alt='Profile'
    //           />
    //         ) : (
    //           <Icon icon='mdi:user' />
    //         )}
    //       </Avatar>
    //       <Box sx={{ display: 'flex', flexDirection: 'column' }}>
    //         <Typography
    //           noWrap
    //           sx={{
    //             color: theme.palette.customColors.OnSurfaceVariant,
    //             fontSize: '14px',
    //             fontWeight: '500',
    //             lineHeight: '16.94px'
    //           }}
    //         >
    //           {params.row.collected_by?.user_name ? params.row.collected_by?.user_name : '-'}
    //         </Typography>
    //         <Typography
    //           noWrap
    //           sx={{
    //             color: theme.palette.customColors.neutralSecondary,
    //             fontSize: '12px',
    //             fontWeight: '400',
    //             lineHeight: '14.52px'
    //           }}
    //         >
    //           {params.row?.collected_by?.created_at
    //             ? 'Created on' + ' ' + moment(params.row?.collected_by?.created_at).format('DD/MM/YYYY')
    //             : '-'}
    //         </Typography>
    //       </Box>
    //     </Box>
    //   )
    // }
  ]

  const fetchTableData = useCallback(
    async (sort, q, status) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,

          nursery_id: '',
          type: 'eggs_incubation',

          // type:
          //   status === undefined
          //     ? 'eggs_received'
          //     : status === 'eggs_ready_to_be_discarded_at_nursery'
          //     ? isDiscarded
          //     : status,
          incubator_id: id
        }

        await GetEggList({ params: params }).then(res => {
          if (res?.data?.result) {
            // Generate uid field based on the index
            let listWithId = res.data.result.map((el, i) => {
              return { ...el, uid: i + 1 }
            })
            setTotal(parseInt(res?.data?.total_count))
            setRows(loadServerRows(paginationModel.page, listWithId))
          } else {
            setTotal(parseInt(res?.data?.total_count))
            setRows([])
          }
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    // if (eggModule) {
    fetchTableData(sort, searchValue, status)

    // }
  }, [fetchTableData, status])

  const getIncubatorDetailFunc = () => {
    if (id) {
      try {
        getIncubatorDetail(id).then(res => {
          if (res.data) {
            setIncubatorDetail(res?.data?.data)

            // console.log('res', res)
          }
        })
      } catch (error) {
        console.log('error', error)
      }
    }
  }

  useEffect(() => {
    getIncubatorDetailFunc()
  }, [id])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.egg_id,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    // if (newModel.length) {
    //   setSort(newModel[0].sort)
    //   setsortColumning(newModel[0].field)
    //   fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
    // } else {
    // }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, status, isDiscarded) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, status, isDiscarded)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const headerAction = (
    <>
      {/* {eggModule && (eggModuleAccess === 'ADD' || eggModuleAccess === 'EDIT' || eggModuleAccess === 'DELETE') && ( */}
      {/* <div>
        <Button
          size='small'
          variant='contained'

          // onClick={() => setDialog(true)}
        >
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; Add New
        </Button>
      </div> */}
      {/* )} */}
    </>
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, status)
  }

  const onCellClick = params => {
    // console.log(params, 'params')
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
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography color='inherit'>Egg</Typography>

        <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => Router.push('/egg/incubators/')}>
          Incubator List
        </Typography>
        <Typography sx={{ cursor: 'pointer' }} color='text.primary'>
          Incubator Details
        </Typography>
      </Breadcrumbs>
      <Card>
        <CardContent
          style={{ paddingBottom: 0 }}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontWeight: 500,
                fontSize: '24px',
                lineHeight: '29.05px'
              }}
            >
              Incubator Details
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
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
                    background: '#E8F4F2',
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
                    Updated on {moment(incubatorDetail?.created_at).format('DD/MM/YYYY')}
                  </Typography>
                </Box>
              </Box>
              {/* <Box>
              <FormControlLabel
                control={
                  <Switch
                    // checked={isActive === '1' ? true : false}
                    //  onChange={handleSwitchChange}
                    fontSize={2}
                  />
                }
                labelPlacement='start'
                // label={isActive === '1' ? 'Active' : 'InActive'}
                label={'Active'}
              />
            </Box>
            <Box>
              <Icon
                icon='ion:time-outline'
                style={{ fontSize: 24, cursor: 'pointer' }}
                onClick={() => setActivitySidebarOpen(true)}

                // onClick={() =>
                //   Router.push({ pathname: '/diet/feed/add-feed', query: { id: FeedDetailsValue?.id } })
                // }
              />
            </Box> */}
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
              {/* <Box>
              <Icon
                // onClick={() => {
                //   handlelOpenDelete()
                // }}
                icon='material-symbols:delete-outline'
                style={{ fontSize: 24, cursor: 'pointer' }}
              />
            </Box> */}
            </Box>
          </Box>

          <Box sx={{ backgroundColor: '#F2FFF8', borderRadius: '8px' }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: '12px' }}>
                <Box sx={{ height: '64px', width: '64px', borderRadius: '8px', bgcolor: '#FFE86E' }}>
                  {/* <Avatar
                    sx={{ height: '100%', width: '100%' }}
                    variant='rounded'
                    src='/icon/Incubator_CON.png'
                    alt='incubator'
                  /> */}

                  <img src='/icons/Incubator_CON.png' alt='incubator' style={{ height: '100%', width: '100%' }} />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography
                    sx={{
                      color: theme.palette.customColors.neutralSecondary,
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '16.94px',
                      mb: '6px'
                    }}
                  >
                    Incubator ID
                  </Typography>
                  <Typography
                    sx={{
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontWeight: 500,
                      fontSize: '16px',
                      lineHeight: '19.36px'
                    }}
                  >
                    {incubatorDetail?.incubator_code}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '16.94px',
                    mb: '6px'
                  }}
                >
                  {/* No of Censors */}Eggs
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '19.36px'
                  }}
                >
                  {indexedRows?.length}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '16.94px',
                    mb: '6px'
                  }}
                >
                  {/* Slots Filled */} Max Eggs
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '19.36px'
                  }}
                >
                  {incubatorDetail?.max_eggs}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '16.94px',
                    mb: '6px'
                  }}
                >
                  Site
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '19.36px'
                  }}
                >
                  {incubatorDetail?.site_name}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '16.94px',
                    mb: '6px'
                  }}
                >
                  Room No
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '19.36px'
                  }}
                >
                  {incubatorDetail?.room_name}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '16.94px',
                    mb: '6px'
                  }}
                >
                  Nursery
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '19.36px'
                  }}
                >
                  {incubatorDetail?.nursery_name}
                </Typography>
              </Box>
            </CardContent>
          </Box>
          <Box>
            {/* <CardHeader sx={{ pb: 0, px: 5 }} title='Egg - 10' action={headerAction} /> */}

            {/* <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontWeight: 500,
                fontSize: '20px',
                lineHeight: '24.2px',
                mb: 4
              }}
            >
              Eggs - {indexedRows?.length}
            </Typography> */}
            {/* <CardContent > */}
            <CustomDataGrid
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
              pageSizeOptions={[5, 10, 25, 50]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              slots={{ toolbar: ServerSideToolbarWithFilter }}
              onPaginationModelChange={setPaginationModel}
              loading={loading}
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
            />
            <AddIncubators
              isEdit={isEdit}
              actionApi={getIncubatorDetailFunc}
              incubatorDetail={incubatorDetail}
              drawerWidth={400}
              sidebarOpen={dialog}
              handleSidebarClose={handleSidebarClose}
            />
            <ActivityLogs
              activity_type={'sa'}
              activitySidebarOpen={activitySidebarOpen}
              handleSidebarClose={handleActivitySidebarClose}
            />
            {/* </CardContent> */}
          </Box>
        </CardContent>
      </Card>
    </>
  )
}

export default IncubatorDetails
