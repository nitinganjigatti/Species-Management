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
  const [sortColumning, setsortColumning] = useState('ingredient_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  const [isOpen, setIsOpen] = useState(false)

  const headerAction = (
    <>
      <Box sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
        <Button sx={{ px: 7, py: 5 }} size='small' variant='contained' onClick={() => setIsOpen(true)}>
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; ADD INCUBATOR
        </Button>
      </Box>
    </>
  )

  // const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = data?.map((row, index) => ({
    ...row

    // sl_no: getSlNo(index)
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
    debounce(async (sort, q, sortColumn, status) => {
      setSearchValue(q)
      try {
        // await fetchTableData(sort, q, sortColumn, status)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumning, status)
  }

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'uid',
      headerName: 'SL ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.id}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 30,
      field: 'nursery_name',
      headerName: 'nursery name',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.nursery}
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
          {params.row.site}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'room',
      headerName: 'room',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.room}
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
          {params.row.Incubator}
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
          {/* {renderClient(params)} */}
          {/* <Avatar
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
              {params.row.created_by_user?.profile_pic ? (
                <img
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  src={params.row.created_by_user?.profile_pic}
                  alt='Profile'
                />
              ) : (
                <Icon icon='mdi:user' />
              )}
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14 }}>
                {params.row.created_by_user?.user_name ? params.row.created_by_user?.user_name : '-'}
              </Typography>
              <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
                {params.row.created_at ? 'Created on' + ' ' + moment(params.row.created_at).format('DD/MM/YYYY') : '-'}
              </Typography>
            </Box> */}
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

            <Card sx={{ px: 5, py: 3 }}>
              <CardHeader title='Rooms Details' action={headerAction} />

              <Stack
                direction='row'
                sx={{
                  px: 3,
                  py: 3,
                  display: 'flex',
                  gap: { md: 20, sx: 3, sm: 6 },
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  bgcolor: '#f2fff8',
                  m: 4
                }}
              >
                <Box m={2}>
                  <Typography variant='body1'>Room</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>24D</Typography>
                </Box>
                <Box m={2}>
                  <Typography variant='body1'>Nursery Name</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>Nursery Name</Typography>
                </Box>
                <Box m={2}>
                  <Typography variant='body1'>Site</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>Site XYZ</Typography>
                </Box>
                <Box m={2}>
                  <Typography>Incubator</Typography>
                  <Typography variant='h6'>Incubator</Typography>
                </Box>

                <Box m={2}>
                  <Typography variant='body1'>Eggs</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>0</Typography>
                </Box>
                <Box m={2} sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                  <Avatar
                    src={
                      // IngredientsDetailsval?.created_by_user
                      //   ? IngredientsDetailsval.created_by_user?.profile_pic
                      //   : undefined
                      ''
                    }

                    // alt={
                    //   IngredientsDetailsval?.created_by_user
                    //     ? IngredientsDetailsval?.created_by_user?.user_name
                    //     : 'User'
                    // }
                  >
                    {/* {!IngredientsDetailsval.created_by_user ? <Icon icon='mdi:user' /> : null} */}
                    <Icon icon='mdi:user' />
                  </Avatar>
                  <Typography sx={{ color: '#000000' }}>
                    {/* {IngredientsDetailsval?.created_by_user ? IngredientsDetailsval?.created_by_user?.user_name : '-'} <br /> */}
                    name
                    <div style={{ color: '#44544A', fontSize: 12, margin: 0 }}>
                      {/* {'Created on' + ' ' + moment(IngredientsDetailsval?.created_at).format('DD/MM/YYYY')}
                       */}
                      date
                    </div>
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ px: 3 }}>
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
    </>
  )
}

export default RoomDetails

const data = [
  { id: '1', nursery: 'Nursery name', site: 'Site name', room: 'Room', Incubator: 'Incubator' },
  { id: '2', nursery: 'Nursery name', site: 'Site name', room: 'Room', Incubator: 'Incubator' }
]
