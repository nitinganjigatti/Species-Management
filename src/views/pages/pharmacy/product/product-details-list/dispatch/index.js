// import React from 'react'

// const Dispatch = () => {
//   return <div>Dispatch</div>
// }

// export default Dispatch

import {
  Avatar,
  Box,
  Card,
  CardHeader,
  Grid,
  TextField,
  Typography,
  debounce,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  Button
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState, useRef } from 'react'

// ** Icon Imports
import { getDispenseList } from 'src/lib/api/pharmacy/dispenseProduct'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'
import Utility from 'src/utility'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { Icon } from '@iconify/react'
import { useTheme } from '@emotion/react'
import FilterListIcon from '@mui/icons-material/FilterList'

function Dispatch() {
  const router = useRouter()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'desc')

  const [rows, setRows] = useState([
    {
      sl_no: '1',
      Reference_id: 'REF123456',
      SHIPMENT_ID: 'SHIP123',
      DISPATCH_TO: 'Local Pharmacy',
      QUANTITY: 50,
      total_val: 5000,
      REQUESTED_BY: 'John Doe',
      profile_pic: 'https://randomuser.me/api/portraits/men/1.jpg',
      purchase_date: '2024-11-18'
    },
    {
      sl_no: '2',
      Reference_id: 'REF123457',
      SHIPMENT_ID: 'SHIP124',
      DISPATCH_TO: 'Local Pharmacy',
      QUANTITY: 100,
      total_val: 10000,
      REQUESTED_BY: 'Jane Smith',
      profile_pic: 'https://randomuser.me/api/portraits/women/2.jpg',
      purchase_date: '2024-11-18'
    }
  ])
  const [searchValue, setSearchValue] = useState(router.query.searchValue || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'dispense_id')
  const [total, setTotal] = useState(0)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page, 10) - 1 || 0,
    pageSize: parseInt(router.query.pageSize, 10) || 10
  })

  const { selectedPharmacy } = usePharmacyContext()
  function loadServerRows(currentPage, data) {
    return data
  }

  const columns = [
    {
      flex: 0.2,
      Width: 20,
      field: 'sl',
      headerName: 'S.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sl_no + '.'}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 40,
      field: 'Reference_id',
      headerName: 'REFERENCE ID',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.Reference_id}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 40,
      field: 'SHIPMENT_ID',
      headerName: 'SHIPMENT ID',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.SHIPMENT_ID}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 40,
      field: 'DISPATCH_TO',
      headerName: 'DISPATCH TO',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.DISPATCH_TO}
        </Typography>
      )
    },

    {
      flex: 0.4,
      minWidth: 40,
      field: 'QUANTITY',
      headerName: 'QUANTITY',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.QUANTITY}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 40,
      field: 'total_val',
      headerName: 'TOTAL VALUE (₹)',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.total_val}
        </Typography>
      )
    },

    {
      flex: 0.6,
      minWidth: 50,
      field: 'REQUESTED_BY',
      headerName: 'REQUESTED BY',
      renderCell: params => (
        <>
          <Avatar
            sx={{
              '& > img': {
                objectFit: 'contain'
              },
              width: 40,
              height: 40,
              mr: 4
            }}
            variant='circular'
            alt={params?.row?.profile_pic}
            src={params?.row?.profile_pic}
          />
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'Inter'
            }}
          >
            {params.row.REQUESTED_BY}
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 400,
                color: '#839D8D'
              }}
            >
              {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.purchase_date))}
            </Typography>
          </Typography>
        </>
      )
    }
  ]

  const getDispatch = useCallback(
    async ({ sort, q, column }) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        // Call the API to fetch data with the sorting and other params
        // await getDispenseList({ params }).then(res => {
        //   if (res?.success) {
        //     setTotal(parseInt(res?.count))
        //     setRows(loadServerRows(paginationModel.page, res?.data))
        //   } else {
        //     setRows([])
        //     setTotal(0)
        //   }
        // })

        setLoading(false)
      } catch (e) {
        setLoading(false)
        console.log(e)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        searchValue,
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize
      }
    })
  }, [paginationModel.page, paginationModel.pageSize])

  useEffect(() => {
    getDispatch({ sort, q: searchValue, column: sortColumn })
  }, [getDispatch, selectedPharmacy.id])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: `${row.sl_no}`,
    sl_no: getSlNo(index)
  }))

  const handleSearch = useCallback(
    debounce(value => {
      setSearchValue(value)
      setPaginationModel(prevModel => ({
        ...prevModel,
        page: 0
      }))

      router.replace({
        pathname: router.pathname,
        query: {
          ...router.query,
          searchValue: value
        }
      })
    }, 500),
    [router]
  )

  const handleSortModel = newModel => {
    if (newModel.length) {
      const newSort = newModel[0].sort
      const newColumn = newModel[0].field

      setSort(newSort)
      setSortColumn(newColumn)
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            sort: newSort,
            column: newColumn
          }
        },
        undefined,
        { shallow: true }
      )

      getDispatch({ sort: newSort, q: searchValue, column: newColumn })
    }
  }

  const onRowClick = params => {
    var data = params.row

    // if (searchValue) {
    //   router.push({
    //     pathname: `/pharmacy/dispense/${data?.id}`
    //   })
    // } else {
    //   router.push({
    //     pathname: `/pharmacy/dispense/${data?.id}`
    //   })
    // }
  }

  return (
    <>
      <Grid
        container
        sm={12}
        xs={12}
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          mt: 6
        }}
      >
        <Grid item>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Grid item xs={8}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #C3CEC7',
                  borderRadius: '8px',
                  padding: '0 8px',
                  ml: 5,
                  height: '40px',
                  width: '250px'
                }}
              >
                <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                <TextField
                  variant='outlined'
                  value={searchValue}
                  placeholder='Search...'
                  onChange={e => handleSearch(e.target.value)}
                  fullWidth
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
            </Grid>
          </Box>
        </Grid>
        <Grid container spacing={2} justifyContent='space-between' alignItems='center' sx={{ mt: 3 }}>
          {/* Filters Section */}
          <Grid item container xs={10} spacing={4}>
            {/* Reference Type */}
            <Grid item>
              <Select
                defaultValue='Reference Type'
                variant='outlined'
                sx={{
                  borderRadius: '8px',
                  height: '40px',

                  //   width: '150px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #C3CEC7'
                  }
                }}
              >
                <MenuItem value='Reference Type'>Reference Type</MenuItem>
                <MenuItem value='Type A'>Type A</MenuItem>
                <MenuItem value='Type B'>Type B</MenuItem>
              </Select>
            </Grid>

            {/* Dispatch To */}
            <Grid item>
              <Select
                defaultValue='Dispatch To'
                variant='outlined'
                sx={{
                  borderRadius: '8px',
                  height: '40px',

                  //   width: '150px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #C3CEC7'
                  }
                }}
              >
                <MenuItem value='Dispatch To'>Dispatch To</MenuItem>
                <MenuItem value='Location A'>Location A</MenuItem>
                <MenuItem value='Location B'>Location B</MenuItem>
              </Select>
            </Grid>

            {/* Requested By */}
            <Grid item>
              <Select
                defaultValue='Requested By'
                variant='outlined'
                sx={{
                  borderRadius: '8px',
                  height: '40px',

                  //   width: '150px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #C3CEC7'
                  }
                }}
              >
                <MenuItem value='Requested By'>Requested By</MenuItem>
                <MenuItem value='Person A'>Person A</MenuItem>
                <MenuItem value='Person B'>Person B</MenuItem>
              </Select>
            </Grid>

            {/* Date Range */}
            <Grid item>
              <Select
                defaultValue='Date Range'
                variant='outlined'
                sx={{
                  borderRadius: '8px',
                  height: '40px',

                  //   width: '150px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #C3CEC7'
                  }
                }}
              >
                <MenuItem value='Date Range'>Date Range</MenuItem>
                <MenuItem value='Last Week'>Last Week</MenuItem>
                <MenuItem value='Last Month'>Last Month</MenuItem>
              </Select>
            </Grid>
          </Grid>

          {/* Filter Button */}
          <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant='outlined'
              startIcon={<FilterListIcon />}
              sx={{
                border: '1px solid #C3CEC7',
                borderRadius: '8px',
                height: '40px',
                textTransform: 'none'
              }}
            >
              Filter
            </Button>
          </Grid>
        </Grid>
      </Grid>
      <Grid>
        <CommonTable
          onRowClick={onRowClick}
          indexedRows={indexedRows}
          total={total}
          handleSortModel={handleSortModel}
          columns={columns}
          paginationModel={paginationModel}
          setPaginationModel={setPaginationModel}
          loading={loading}
          searchValue={searchValue}
        />
      </Grid>

      <>{/* <Error404></Error404> */}</>
    </>
  )
}

export default Dispatch
