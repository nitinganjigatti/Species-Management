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
  Avatar
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
  console.log('id :>> ', id)
  const theme = useTheme()
  const editParamsInitialState = { site_id: null, room_name: null, nursery_id: null }
  const [editParams, setEditParams] = useState(editParamsInitialState)
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
  const [isOpen, setIsOpen] = useState(false)
  const [DetailsListData, setDetailsListData] = useState({})
  const [dialog, setDialog] = useState(false)

  console.log('detailsData :>> ', detailsData)

  const fetchTableData = useCallback(
    async q => {
      try {
        console.log('til_date', cuurent_date)
        setLoading(true)

        const params = {
          q,

          // sortColumn,
          til_date: cuurent_date,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getIncubatorList(params).then(res => {
          console.log('response', res)

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
    },
    [paginationModel]
  )

  useEffect(() => {
    // if (eggModule) {
    fetchTableData(searchValue)

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
        await fetchTableData(q)
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
      flex: 0.35,
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
      flex: 0.35,
      minWidth: 20,
      sortable: false,
      field: 'site_name',
      headerName: 'SITE',
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
      flex: 0.24,
      minWidth: 20,
      sortable: false,
      field: 'room_name',
      headerName: 'ROOM NO',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.room_name ? params.row.room_name : '-'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      sortable: false,
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

  const fetchDetailsData = useCallback(
    async (sort, q, column) => {
      try {
        setLoader(true)

        await GetRoomDetails(id).then(res => {
          setDetailsData(res?.data)
          setDetailsListData({
            list: {
              Room: res?.data?.room_name,
              NurseryName: res?.data?.nursery_name,
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
        })
        setLoader(false)
      } catch (e) {
        setLoader(false)
      }
    },
    [paginationModel]
  )

  const handleEdit = async (event, site_id, room_name, nursery_id, room_id) => {
    event.stopPropagation()
    setEditParams({ site_id: site_id, room_name: room_name, nursery_id: nursery_id, room_id: room_id })
    setIsOpen(true)
  }

  const headerAction = (
    <>
      <Box sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
        <IconButton
          sx={{ px: 3, py: 6, mr: 4 }}
          onClick={event =>
            handleEdit(event, detailsData.site_id, detailsData.room_name, detailsData.nursery_id, detailsData.room_id)
          }
        >
          <Icon
            icon='material-symbols:edit-outline'
            fontSize={28}
            color={theme.palette.customColors.OnSurfaceVariant}
          />
        </IconButton>

        <Button sx={{ px: 7, py: 5 }} size='small' variant='contained' onClick={() => setDialog(true)}>
          <Icon icon='mdi:add' fontSize={30} />
          &nbsp; ADD INCUBATOR
        </Button>
      </Box>
    </>
  )

  useEffect(() => {
    fetchDetailsData(sort, searchValue, sortColumn)
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
              <Typography color='inherit'>Egg</Typography>
              <Link underline='hover' color='inherit' href='/egg/incubator-rooms/'>
                Incubator Room
              </Link>
              <Typography color='text.primary'>Room Details</Typography>
            </Breadcrumbs>

            <Card>
              <CardHeader title='Rooms Details' action={headerAction} />

              <DetailCard DetailsListData={DetailsListData?.Avatar?.site_id && DetailsListData} />

              <Box sx={{ px: 8 }}>
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
                  // sortModel={}
                  hideFooterPagination
                  // hideFooterSelectedRowCount
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

                  // onCellClick={onCellClick}
                />
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      <>
        <AddIncubatorRoom callApi={fetchDetailsData} isOpen={isOpen} setIsOpen={setIsOpen} editParams={editParams} />
        <AddIncubators actionApi={fetchTableData} sidebarOpen={dialog} handleSidebarClose={handleSidebarClose} />
      </>
    </>
  )
}

export default RoomDetails

const data = [
  { id: '1', nursery: 'Nursery name', site: 'Site name', room: 'Room', Incubator: 'Incubator' },
  { id: '2', nursery: 'Nursery name', site: 'Site name', room: 'Room', Incubator: 'Incubator' }
]
