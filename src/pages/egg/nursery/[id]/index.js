import { Icon } from '@iconify/react'
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  debounce,
  Avatar,
  IconButton,
  Button,
  Breadcrumbs
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import moment from 'moment'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'
import AddIncubatorRoom from 'src/components/egg/AddIncubatorRoom'
import DetailCard from 'src/components/egg/DetailCard'
import { GetNurseryDetailsById, GetRoomByNursery } from 'src/lib/api/egg/nursery'
import NurserySlider from 'src/views/pages/egg/nursery/NurserySlideSheet'
import Router from 'next/router'

const NurseryDetails = () => {
  const [nurseryData, setNurseryData] = useState({})
  const [editName, setEditName] = useState('')
  const [editSite, setEditSite] = useState('')
  const [editNurseryId, setEditNurseryId] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [sort, setSort] = useState('asc')
  const [sortColumn, setSortColumn] = useState('nursery_name')
  const [openDrawer, setOpenDrawer] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [openRoomSideBar, setOpenRoomSidebar] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  const router = useRouter()
  const { id } = router.query

  console.log('rows >>', rows)

  useEffect(() => {
    const fetchNurseryById = async () => {
      const res = await GetNurseryDetailsById(id)
      setNurseryData({
        list: {
          NurseryName: res?.data?.nursery_name,
          Room: res?.data?.no_of_rooms,
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
      setEditNurseryId(id)
      setEditName(res.data?.nursery_name)
      setEditSite(res?.data?.site_id)
    }
    fetchNurseryById()
  }, [])

  console.log('Id >>', editNurseryId)

  function loadServerRows(currentPage, data) {
    return data
  }

  const closeSideSheet = () => {
    setOpenDrawer(false)
  }

  const fetchTableData = useCallback(
    async (sort, q, column) => {
      try {
        setLoading(true)

        await GetRoomByNursery(id).then(res => {
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, res?.data?.result))
        })
        setLoading(false)
      } catch (e) {
        setLoading(false)
      }
    },
    [nurseryData]
  )

  console.log('Nursery Details >>', nurseryData)

  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
  }, [fetchTableData])

  const searchTableData = useCallback(
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, column)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
  }

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
    } else {
    }
  }

  // setDetailsListData({
  //   list: {
  //     Room: res?.data?.room_name,
  //     NurseryName: res?.data?.nursery_name,
  //     Site: res?.data?.site_name,
  //     Incubator: res?.data?.no_of_incubators,
  //     Eggs: res?.data?.no_of_eggs
  //   },
  //   Avatar: {
  //     profile_Pic: res?.data?.user_profile_pic,
  //     user_Name: res?.data?.user_full_name,
  //     create_at: res?.data?.created_at,
  //     site_id: res?.data?.site_id
  //   }
  // })

  const columns = [
    {
      flex: 0.3,
      minWidth: 30,
      field: 'Nursery Name',
      headerName: 'Nursery Name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.nursery_name}
        </Typography>
      )
    },

    {
      flex: 0.3,
      minWidth: 30,
      field: 'ROOMS',
      headerName: 'ROOMS',
      renderCell: params => <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>{params.row.room_name}</Box>
    },

    {
      flex: 0.3,
      minWidth: 30,
      field: 'INCUBATORS',
      headerName: 'INCUBATORS',
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>{params.row.no_of_incubators}</Box>
      )
    },

    {
      flex: 0.3,
      minWidth: 30,
      field: 'SITE NAME',
      headerName: 'SITE NAME',
      renderCell: params => <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>{params.row.site_name}</Box>
    },
    {
      flex: 0.4,
      minWidth: 60,
      field: 'ADDED BY',
      headerName: 'ADDED BY',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* {renderClient(params)} */}
          <Avatar
            variant='rounded'
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
    }
  ]

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.nursery_id,
    sl_no: getSlNo(index)
  }))

  const headerAction = (
    <>
      <Box sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
        <IconButton size='small' sx={{ mr: 0.5 }} aria-label='Edit' onClick={() => setOpenDrawer(true)}>
          <Icon icon='mdi:pencil-outline' />
        </IconButton>
        <Button sx={{ px: 7, py: 5 }} size='small' variant='contained' onClick={() => setIsOpen(true)}>
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; ADD ROOM
        </Button>
      </Box>
    </>
  )

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ cursor: 'pointer' }} color='inherit'>
          Egg
        </Typography>

        <Typography sx={{ cursor: 'pointer' }} color='inherit ' onClick={() => Router.push('/egg/nursery/')}>
          Nursery List
        </Typography>
        <Typography sx={{ cursor: 'pointer' }} color='text.primary'>
          Nursery Details
        </Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader title={'Rooms Details'} action={headerAction} />
        <DetailCard
          title='Nursery Details'
          ButtonName={'ADD ROOM'}
          DetailsListData={nurseryData}
          setOpenDrawer={setOpenDrawer}
        />{' '}
        {rows?.length > 0 ? (
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
            rows={indexedRows === undefined ? [] : indexedRows}
            rowCount={total}
            hideFooterPagination={true}
            columns={columns}
            sortingMode='server'
            paginationMode='server'
            pageSizeOptions={[5, 7, 10, 15]}
            paginationModel={paginationModel}
            onSortModelChange={handleSortModel}
            onPaginationModelChange={setPaginationModel}
            loading={loading}
          />
        ) : (
          <Typography variant='h6' sx={{ padding: '10px', textAlign: 'center' }}>
            No Record Found
          </Typography>
        )}
        {openDrawer && (
          <NurserySlider
            setOpenDrawer={setOpenDrawer}
            editName={editName}
            fetchTableData={fetchTableData}
            editSite={editSite}
            editNurseryId={editNurseryId}
          />
        )}
        <AddIncubatorRoom callApi={fetchTableData} isOpen={isOpen} setIsOpen={setIsOpen} />
      </Card>
    </>
  )
}

export default NurseryDetails
