import React, { useCallback, useEffect, useState } from 'react'
import Router from 'next/router'
import { useRouter } from 'next/router'
import Icon from 'src/@core/components/icon'
import { DataGrid } from '@mui/x-data-grid'
import { useTheme } from '@mui/material/styles'
import {
  Grid,
  Card,
  CardContent,
  Box,
  Typography,
  CircularProgress,
  Breadcrumbs,
  Link,
  Divider,
  IconButton,
  CardHeader,
  Button,
  Stack,
  Avatar,
  Tooltip
} from '@mui/material'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { debounce } from 'lodash'
import { GetRoomDetails } from 'src/lib/api/egg/room/getRoom'
import moment from 'moment'
import DetailCard from 'src/components/egg/DetailCard'
import AddIncubatorRoom from 'src/components/egg/AddIncubatorRoom'
import { getIncubatorList } from 'src/lib/api/egg/incubator'
import AddIncubators from 'src/views/pages/egg/incubator/addIncubators'

const RoomDetails = () => {
  const cuurent_date = moment().format('YYYY-MM-DD')
  const router = useRouter()
  const { id } = router.query

  const theme = useTheme()
  const editParamsInitialState = { site_id: null, room_name: null, nursery_id: null, nursery_name: null }
  const [editParams, setEditParams] = useState(editParamsInitialState)
  console.log('editParams :>> ', editParams)
  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('room_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [detailsData, setDetailsData] = useState({})
  console.log('detailsData :>> ', detailsData)

  const [isOpen, setIsOpen] = useState(false)
  const [DetailsListData, setDetailsListData] = useState({})
  const [dialog, setDialog] = useState(false)
  const [isPreFilled, setIsPreFilled] = useState({})

  const fetchTableData = useCallback(async () => {
    try {
      // console.log('til_date', cuurent_date)
      setLoading(true)

      const params = {
        sort,
        q: searchValue,
        room_id: id,

        til_date: cuurent_date,
        page_no: paginationModel.page + 1,
        limit: paginationModel.pageSize
      }

      await getIncubatorList({ params }).then(res => {
        // Generate uid field based on the index
        let listWithId = res?.data?.data?.result?.map((el, i) => {
          return { ...el, id: i + 1 }
        })
        setTotal(parseInt(res?.data?.data?.total_count))
        setRows(loadServerRows(paginationModel.page, listWithId))

        // setstatusCheckval(res?.data?.result.map(all => all.active))
      })
      setLoading(false)
    } catch (e) {
      console.log(e)
      setLoading(false)
    }
  }, [paginationModel])

  useEffect(() => {
    // if (eggModule) {
    fetchTableData()

    // }
  }, [fetchTableData])

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

  const searchTableData = useCallback(
    debounce(async q => {
      setSearchValue(q)
      try {
        await fetchTableData()
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(value)
  }

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'id',
      headerName: 'SL ',
      align: 'center',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontWeight: '400',
            lineHeight: '14.52px',
            fontSize: '12px'
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },

    {
      flex: 0.27,
      minWidth: 30,
      sortable: false,
      field: 'incubator_code',
      headerName: 'INCUBATOR ID',
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
          {params.row.incubator_code ? params.row.incubator_code : '-'}
        </Typography>
      )
    },
    {
      flex: 0.35,
      minWidth: 30,
      sortable: false,
      field: 'incubator_name',
      headerName: 'INCUBATOR NAME',
      renderCell: params => (
        <Tooltip title={params.row.incubator_name ? params.row.incubator_name : '-'}>
          <Typography
            noWrap
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.incubator_name ? params.row.incubator_name : '-'}
          </Typography>
        </Tooltip>
      )
    },

    // {
    //   flex: 0.3,
    //   minWidth: 10,
    //   field: 'censors',
    //   sortable: false,
    //   headerName: 'CENSORS',
    //   renderCell: params => (
    //     <Box sx={{ display: 'flex', alignItems: 'center' }}>
    //       <Typography
    //         style={{
    //           color: theme.palette.customColors.OnSurfaceVariant,
    //           fontSize: '16px',
    //           fontWeight: '400',
    //           lineHeight: '19.36px'
    //         }}
    //       >
    //         2
    //       </Typography>{' '}
    //       {params.row.censors === 'Alert' && <div className={Styles.circle}></div>}
    //       {params.row.censors === 'Good' && (
    //         <div style={{ backgroundColor: theme.palette.primary.main }} className={Styles.green_circle}></div>
    //       )}
    //       <Typography
    //         sx={{
    //           color: params.row.censors === 'Good' ? theme.palette.primary.main : theme.palette.formContent.tertiary,
    //           fontSize: '14px',
    //           fontWeight: '500',
    //           lineHeight: '16.94px'
    //         }}
    //       >
    //         {params.row.censors ? params.row.censors : '-'}
    //       </Typography>
    //     </Box>
    //   )
    // },
    {
      flex: 0.3,
      minWidth: 10,
      sortable: false,
      field: 'availability',
      headerName: 'AVAILABILITY',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.primary.dark,
            fontSize: '14px',
            fontWeight: '500',
            lineHeight: '16.94px'
          }}
        >
          {params.row.availability ? params.row.availability : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      sortable: false,
      field: 'site_name',
      headerName: 'SITE',
      renderCell: params => (
        <Tooltip title={params.row.site_name ? params.row.site_name : '-'}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.site_name ? params.row.site_name : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      sortable: false,
      field: 'room_name',
      headerName: 'ROOM NO',
      renderCell: params => (
        <Tooltip title={params.row.room_name ? params.row.room_name : '-'}>
          <Typography
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px'
            }}
          >
            {params.row.room_name ? params.row.room_name : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      sortable: false,
      align: 'center',
      field: 'max_no_eggs',
      headerName: 'Max EGG',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.max_eggs ? params.row.max_eggs : '-'}
        </Typography>
      )
    },
    {
      flex: 0.12,
      minWidth: 20,
      sortable: false,
      align: 'center',
      field: 'no_of_eggs',
      headerName: 'EGGS',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.no_of_eggs ? params.row.no_of_eggs : '-'}
        </Typography>
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
            {params.row.user_profile_pic ? (
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={params.row.user_profile_pic}
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
              {params.row?.created_at ? 'Created on' + ' ' + moment(params.row?.created_at).format('DD/MM/YYYY') : '-'}
            </Typography>
          </Box>
        </Box>
      )
    }
  ]
  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchDetailsData = useCallback(async () => {
    try {
      setLoader(true)

      await GetRoomDetails(id).then(res => {
        setDetailsData(res?.data)
        setDetailsListData({
          list: {
            Room: res?.data?.room_name,
            'Nursery Name': res?.data?.nursery_name,
            Site: res?.data?.site_name,
            Incubator: res?.data?.no_of_incubators,
            Eggs: res?.data?.no_of_eggs
          },
          Avatar: {
            profile_Pic: res?.data?.user_profile_pic,
            user_Name: res?.data?.user_full_name,
            create_at: res?.data?.created_at,
            site_id: res?.data?.site_id
          }
        })
        setIsPreFilled(res?.data)
      })
      setLoader(false)
    } catch (e) {
      setLoader(false)
    }
  }, [])

  const handleEdit = async (event, site_id, room_name, nursery_id, room_id, nursery_name) => {
    event.stopPropagation()
    setEditParams({
      site_id: site_id,
      room_name: room_name,
      nursery_id: nursery_id,
      room_id: room_id,
      nursery_name: nursery_name
    })
    setIsOpen(true)
  }

  const headerAction = (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <IconButton
          sx={{ mr: 4 }}
          onClick={event =>
            handleEdit(
              event,
              detailsData.site_id,
              detailsData.room_name,
              detailsData.nursery_id,
              detailsData.room_id,
              detailsData.nursery_name
            )
          }
        >
          <Icon
            icon='material-symbols:edit-outline'
            fontSize={28}
            color={theme.palette.customColors.OnSurfaceVariant}
          />
        </IconButton>

        <Button size='medium' variant='contained' onClick={() => setDialog(true)}>
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; ADD INCUBATOR
        </Button>
      </Box>
    </>
  )

  useEffect(() => {
    fetchDetailsData()
  }, [fetchDetailsData])

  // const onCellClick = params => {
  //   console.log(params, 'params')

  //   Router.push({
  //     pathname: `/egg/incubators/${params.row?.id}`
  //   })
  // }

  const handleSidebarClose = () => {
    setDialog(false)
  }

  const onCellClick = params => {
    // console.log(params, 'params')

    Router.push({
      pathname: `/egg/incubators/${params.row?.incubator_id}`
    })
  }

  return (
    <>
      {loader ? (
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      ) : (
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
              <Typography sx={{ cursor: 'pointer' }} color='inherit'>
                Egg
              </Typography>

              <Typography
                sx={{ cursor: 'pointer' }}
                color='inherit '
                onClick={() => Router.push('/egg/incubator-rooms/')}
              >
                Incubator Room
              </Typography>
              <Typography color='text.primary' sx={{ cursor: 'pointer' }}>
                Room Details
              </Typography>
            </Breadcrumbs>

            <Card>
              <CardHeader title='Rooms Details' action={headerAction} />

              <Box sx={{ px: '16px', my: '8px' }}>
                <DetailCard DetailsListData={DetailsListData?.Avatar?.site_id && DetailsListData} />
              </Box>
              <Box>
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
                  disableColumnSelector={true}
                  autoHeight
                  pagination
                  rows={indexedRows === undefined ? [] : indexedRows}
                  rowCount={total}
                  columns={columns}
                  sortingMode='server'
                  paginationMode='server'
                  rowHeight={64}
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
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      <>
        <AddIncubatorRoom
          callApi={fetchDetailsData}
          callTableApi={fetchTableData}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          editParams={editParams}
        />
        <AddIncubators
          actionApi={fetchTableData}
          detailsApi={fetchDetailsData}
          sidebarOpen={dialog}
          handleSidebarClose={handleSidebarClose}
          isPreFilled={isPreFilled}
        />
      </>
    </>
  )
}

export default RoomDetails

const data = [
  { id: '1', nursery: 'Nursery name', site: 'Site name', room: 'Room', Incubator: 'Incubator' },
  { id: '2', nursery: 'Nursery name', site: 'Site name', room: 'Room', Incubator: 'Incubator' }
]
