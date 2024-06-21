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
  Typography
} from '@mui/material'
import { Box, display } from '@mui/system'
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

const tableData = [
  {
    id: 1,
    egg: {
      egg_pic: '',
      egg_number: '0273 / 24',
      status: 'infertile'
    },
    species: {
      species_pic: '',
      species_name: 'Rainbow Lorikeet',
      species_desc: 'Trichoglossus Moluccanus'
    },
    days_in_incubation: '2',
    stage: 'Infertile',
    condition: 'Warm',
    curret_weight: {
      gram: 300,
      precentage: -5
    },
    initial_weight: '315g',
    initial_size_l: '33.41 mm',
    initial_size_w: '22.72 mm',
    no_of_egg: '3',
    clutch_id: 1234,
    site: 'Site Name',
    nursery: 'Nursery Name',
    inclosure: '24 D',
    collected_on: '1 Mar 2024',
    ley_date: '1 Mar 2024',
    collected_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      created_at: '10/10/2023'
    }
  },
  {
    id: 2,
    egg: {
      egg_pic: '',
      egg_number: '0273 / 24',
      status: 'infertile'
    },
    species: {
      species_pic: '',
      species_name: 'Rainbow Lorikeet',
      species_desc: 'Trichoglossus Moluccanus'
    },
    days_in_incubation: '2',
    stage: 'Infertile',
    condition: 'Warm',
    curret_weight: {
      gram: 300,
      precentage: -5
    },
    initial_weight: '315g',
    initial_size_l: '33.41 mm',
    initial_size_w: '22.72 mm',
    no_of_egg: '3',
    clutch_id: 1234,
    site: 'Site Name',
    nursery: 'Nursery Name',
    inclosure: '24 D',
    collected_on: '1 Mar 2024',
    ley_date: '1 Mar 2024',
    collected_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      created_at: '10/10/2023'
    }
  },
  {
    id: 3,
    egg: {
      egg_pic: '',
      egg_number: '0273 / 24',
      status: 'infertile'
    },
    species: {
      species_pic: '',
      species_name: 'Rainbow Lorikeet',
      species_desc: 'Trichoglossus Moluccanus'
    },
    days_in_incubation: '2',
    stage: 'Infertile',
    condition: 'Warm',
    curret_weight: {
      gram: 300,
      precentage: -5
    },
    initial_weight: '315g',
    initial_size_l: '33.41 mm',
    initial_size_w: '22.72 mm',
    no_of_egg: '3',
    clutch_id: 1234,
    site: 'Site Name',
    nursery: 'Nursery Name',
    inclosure: '24 D',
    collected_on: '1 Mar 2024',
    ley_date: '1 Mar 2024',
    collected_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      created_at: '10/10/2023'
    }
  },
  {
    id: 4,
    egg: {
      egg_pic: '',
      egg_number: '0273 / 24',
      status: 'infertile'
    },
    species: {
      species_pic: '',
      species_name: 'Rainbow Lorikeet',
      species_desc: 'Trichoglossus Moluccanus'
    },
    days_in_incubation: '2',
    stage: 'Infertile',
    condition: 'Warm',
    curret_weight: {
      gram: 300,
      precentage: -5
    },
    initial_weight: '315g',
    initial_size_l: '33.41 mm',
    initial_size_w: '22.72 mm',
    no_of_egg: '3',
    clutch_id: 1234,
    site: 'Site Name',
    nursery: 'Nursery Name',
    inclosure: '24 D',
    collected_on: '1 Mar 2024',
    ley_date: '1 Mar 2024',
    collected_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      created_at: '10/10/2023'
    }
  }
]

const IncubatorDetails = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query
  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState(tableData || [])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumning, setsortColumning] = useState('ingredient_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
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
      flex: 0.05,
      Width: 40,
      sortable: false,
      align: 'center',
      field: 'uid',
      headerName: 'SL ',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '12px',
            fontWeight: '600',
            lineHeight: '14.52px'
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 60,
      sortable: false,
      field: 'egg_number',
      headerName: 'EGG NUMBER',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            variant='rounded'
            alt='Medicine Image'
            sx={{
              width: 30,
              height: 30,
              mr: 4,
              borderRadius: '50%',
              background: '#E8F4F2',
              overflow: 'hidden'
            }}
          >
            {params.row.added_by?.egg_pic ? (
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={params.row.added_by?.egg_pic}
                alt='Profile'
              />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Typography
              noWrap
              sx={{
                color: theme.palette.primary.dark,
                fontSize: '16px',
                fontWeight: '500',
                lineHeight: '19.36px'
              }}
            >
              {params.row.egg?.egg_number ? params.row.egg?.egg_number : '-'}
            </Typography>
            <Typography
              sx={{
                color: theme.palette.primary.main,
                fontSize: '14px',
                fontWeight: '500',
                lineHeight: '16.94px',
                backgroundColor: '#E1F9ED',
                p: '3px',
                textAlign: 'center',
                borderRadius: '4px'
              }}
            >
              {params.row?.egg?.status ? params.row?.egg?.status : '-'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.5,
      minWidth: 60,
      sortable: false,
      field: 'added_by',
      headerName: 'ADDED BY',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            variant='circular'
            alt='Medicine Image'
            sx={{
              width: 30,
              height: 30,
              mr: 4,
              borderRadius: '50%',
              background: '#E8F4F2',
              overflow: 'hidden'
            }}
          >
            {params.row.species?.species_pic ? (
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={params.row.species?.species_pic}
                alt='Profile'
              />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
              noWrap
              sx={{
                color: theme.palette.primary.light,
                fontSize: '16px',
                fontWeight: '500',
                lineHeight: '19.36px'
              }}
            >
              {params.row.species?.species_name ? params.row.species?.species_name : '-'}
            </Typography>
            <Tooltip title={params.row?.species?.species_desc ? params.row?.species?.species_desc : '-'}>
              <Typography
                noWrap
                sx={{
                  color: theme.palette.customColors.neutralSecondary,
                  fontSize: '14px',
                  fontWeight: '400',
                  lineHeight: '16.94px'
                }}
              >
                {params.row?.species?.species_desc ? params.row?.species?.species_desc : '-'}
              </Typography>
            </Tooltip>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.35,
      minWidth: 30,
      sortable: false,
      field: 'days_in_incubation',
      headerName: 'Days In Incubation',
      renderCell: params => (
        <Typography
          noWrap
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
      flex: 0.35,
      minWidth: 10,
      sortable: false,
      field: 'stage',
      headerName: 'Stage',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.primary.dark,
            fontSize: '16px',
            fontWeight: '500',
            lineHeight: '19.36px'
          }}
        >
          {params.row.stage ? params.row.stage : '-'}
        </Typography>
      )
    },

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
    {
      flex: 0.5,
      minWidth: 60,
      field: 'collected_by',
      headerName: 'Collected BY',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            variant='square'
            alt='Medicine Image'
            sx={{
              width: 30,
              height: 30,
              mr: 4,
              borderRadius: '50%',
              background: '#E8F4F2',
              overflow: 'hidden'
            }}
          >
            {params.row.collected_by?.profile_pic ? (
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={params.row.collected_by?.profile_pic}
                alt='Profile'
              />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>
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
              {params.row.collected_by?.user_name ? params.row.collected_by?.user_name : '-'}
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
              {params.row?.collected_by?.created_at
                ? 'Created on' + ' ' + moment(params.row?.collected_by?.created_at).format('DD/MM/YYYY')
                : '-'}
            </Typography>
          </Box>
        </Box>
      )
    }
  ]

  const fetchTableData = useCallback(
    async (sort, q, sortColumn, status) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          sortColumn,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          status
        }

        await getIngredientList({ params: params }).then(res => {
          console.log('response', res)

          // Generate uid field based on the index
          let listWithId = res.data.result.map((el, i) => {
            return { ...el, uid: i + 1 }
          })
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, listWithId))

          // setstatusCheckval(res?.data?.result.map(all => all.active))
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  // useEffect(() => {
  //   if (eggModule) {
  //     fetchTableData(sort, searchValue, sortColumning, status)
  //   }
  // }, [fetchTableData, status])

  useEffect(() => {
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
  }, [id])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
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

  const headerAction = (
    <>
      {/* {eggModule && (eggModuleAccess === 'ADD' || eggModuleAccess === 'EDIT' || eggModuleAccess === 'DELETE') && ( */}
      <div>
        <Button
          size='small'
          variant='contained'

          // onClick={() => setDialog(true)}
        >
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; Add New
        </Button>
      </div>
      {/* )} */}
    </>
  )

  const handleSearch = value => {
    // setSearchValue(value)
    // searchTableData(sort, value, sortColumning, status)
  }

  const onCellClick = params => {
    // console.log(params, 'params')
    // const clickedColumn = params.field !== 'switch'
    // if (clickedColumn) {
    //   const data = params.row
    Router.push({
      pathname: `/egg/incubators/6`
    })

    // } else {
    //   return
    // }
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
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                  // onClick={() => Router.push({ pathname: '/diet/add-diet', query: { id: dietDetails.id } })}
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
                <Box sx={{ height: '64px', width: '64px', borderRadius: '8px' }}>
                  <Avatar
                    sx={{ height: '100%', width: '100%' }}
                    variant='rounded'
                    src='./public/images/icon/Incubator ICON.png'
                    alt='incubator'
                  />
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
                  No of Censors
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '19.36px'
                  }}
                >
                  5
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
                  Slots Filled
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '19.36px'
                  }}
                >
                  0
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
          <Card>
            <CardHeader sx={{ pb: 0, px: 5 }} title='Egg - 10' action={headerAction} />
            <CardContent>
              <DataGrid
                sx={{
                  '.MuiDataGrid-cell:focus': {
                    outline: 'none'
                  },

                  '& .MuiDataGrid-row:hover': {
                    cursor: 'pointer'
                  },
                  '.css-cqiw3d': {
                    pr: 0
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
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </>
  )
}

export default IncubatorDetails
