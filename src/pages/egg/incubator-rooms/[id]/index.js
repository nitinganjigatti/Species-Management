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

const RoomDetails = () => {
  const router = useRouter()
  const { id } = router.query
  console.log('id :>> ', id)
  const theme = useTheme()
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

  // const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  // console.log('Get no', getSlNo)

  // const indexedRows = rows?.map((row, index) => ({
  //   ...row,
  //   id: row.room_id,
  //   sl_no: getSlNo(index)
  // }))

  const handleSortModel = newModel => {
    // if (newModel.length) {
    //   setSort(newModel[0].sort)
    //   setsortColumning(newModel[0].field)
    //   fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
    // } else {
    // }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, sortColumn, status) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, sortColumn, status)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  // const handleSearch = value => {
  //   setSearchValue(value)
  //   searchTableData(sort, value, sortColumning, status)
  // }

  const columns = [
    // {
    //   flex: 0.05,
    //   Width: 40,
    //   field: 'uid',
    //   headerName: 'SL ',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.id}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.5,
      minWidth: 30,
      field: 'nursery_name',
      headerName: 'nursery name',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.nursery_name}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'site',
      headerName: 'site',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.site_name}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'room_name',
      headerName: 'room',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.room_name}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'Incubator',
      headerName: 'Incubator',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.no_of_incubators}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'egg',
      headerName: 'Egg',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.no_of_eggs}
        </Typography>
      )
    },
    {
      flex: 0.6,
      minWidth: 60,
      field: 'user_name',
      headerName: 'CREATED BY',
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
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14 }}>
              {params.row.user_full_name ? params.row.user_full_name : '-'}
            </Typography>
            <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
              {params.row.created_at ? 'Created on' + ' ' + moment(params.row.created_at).format('DD/MM/YYYY') : '-'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'status',
      headerName: 'STATUS',
      renderCell: params => (
        <Typography>Status</Typography>

        // <CustomChip
        //   skin='light'
        //   size='small'
        //   label={params.row?.active === '1' ? 'Active' : 'InActive'}
        //   color={params.row?.active === '1' ? roleColors.active : roleColors.inactive}
        //   sx={{
        //     height: 20,
        //     fontWeight: 600,
        //     borderRadius: '5px',
        //     fontSize: '0.875rem',
        //     textTransform: 'capitalize',
        //     '& .MuiChip-label': { mt: -0.25 }
        //   }}
        // />
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

        const params = {
          sort,
          search: q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await GetRoomDetails(id, params).then(res => {
          // setTotal(parseInt(res?.data?.total_count))
          // setRows(loadServerRows(paginationModel.page, res?.data))
          setDetailsData(res?.data)
        })
        setLoader(false)
      } catch (e) {
        setLoader(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    fetchDetailsData(sort, searchValue, sortColumn)
  }, [fetchDetailsData])

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

            <DetailCard detailsData={detailsData} ButtonName={'ADD INCUBATOR'} />
          </Grid>
        </Grid>
      )}
    </>
  )
}

export default RoomDetails

const data = [
  { id: '1', nursery: 'Nursery name', site: 'Site name', room: 'Room', Incubator: 'Incubator' },
  { id: '2', nursery: 'Nursery name', site: 'Site name', room: 'Room', Incubator: 'Incubator' }
]
