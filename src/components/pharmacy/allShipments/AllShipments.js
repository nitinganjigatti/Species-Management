import React, { useState, useEffect, useCallback } from 'react'
import { getAllShipments } from 'src/lib/api/pharmacy/allShipments'
import CardHeader from '@mui/material/CardHeader'

// ** MUI Imports

import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Card, Grid, TextField } from '@mui/material'

// import UserSnackbar from 'src/components/utility/snackbar'
import { debounce } from 'lodash'
import { useTheme } from '@emotion/react'
import toast from 'react-hot-toast'
import Router from 'next/router'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'
import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import Utility from 'src/utility'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import RenderUtility from 'src/utility/render'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'

const AllShipments = () => {
  const theme = useTheme()

  const authData = useContext(AuthContext)
  const pharmacyRole = authData?.userData?.roles?.settings?.add_pharmacy
  const { selectedPharmacy } = usePharmacyContext()

  const onRowClick = params => {
    // "request_type": "return",
    // "request_type": "request",
    // direct_dispatch
    // direct_dispatch_local

    // directDispatch
    // localDispatch
    const { request_type, id, request_id } = params.row

    const requestTypeMap = {
      direct_dispatch: 'directDispatch',
      direct_dispatch_local: 'localDispatch',
      return: 'return',
      request: 'request'
    }

    const requestType = requestTypeMap[request_type] || ''

    Router.push({
      pathname: `/pharmacy/shipments/shipments-details`,
      query: {
        orderId: id,
        requestId: request_id,
        requestType
      }
    })
  }

  const columns = [
    {
      minWidth: 80,
      field: 'id',
      type: 'number',
      align: 'left',
      headerAlign: 'left',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },

    {
      minWidth: 250,
      field: 'shipment_id',
      headerName: 'Shipment ID',
      align: 'center',
      headerAlign: 'center',
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
          {params.row.shipment_id}
        </Typography>
      )
    },
    {
      minWidth: 250,
      field: 'shipment_date',
      headerName: 'Shipment Date',
      align: 'center',
      headerAlign: 'center',
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
          {Utility.formatDisplayDate(params.row.shipment_date)}
        </Typography>
      )
    },
    {
      minWidth: 250,
      field: 'person_shipping',
      headerName: 'Shipped By',
      align: 'center',
      headerAlign: 'center',
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
          {params.row.person_shipping || 'NA'}
        </Typography>
      )
    },
    {
      minWidth: 250,
      field: 'vehicle_no',
      headerName: 'Vehicle No',
      align: 'center',
      headerAlign: 'center',
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
          {params.row.vehicle_no || 'NA'}
        </Typography>
      )
    },
    {
      minWidth: 250,
      field: 'shipment_status',
      headerName: 'Shipment Status',
      align: 'center',
      headerAlign: 'center',
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
          {params.row.shipment_status || 'NA'}
        </Typography>
      )
    },
    {
      minWidth: 200,
      field: 'created_by',
      headerName: 'Created by ',
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <>
          <UserAvatarDetails
            profile_image={params?.row?.user_created_profile_pic}
            user_name={params?.row?.created_by_user_name}
            date={params?.row?.created_at}
          />
        </>
      )
    }
  ]

  /***** Serverside pagination */
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('id')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async (sort, q, column) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getAllShipments({ params: params }).then(res => {
          console.log('res', res)
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
        })
        setLoading(false)
      } catch (e) {
        setLoading(false)
      }
    },
    [paginationModel]
  )
  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
  }, [fetchTableData, selectedPharmacy.id])

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
    } else {
    }
  }

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

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      {pharmacyRole ? (
        <Card>
          <CardHeader
            // eslint-disable-next-line lines-around-comment
            // sx={{
            //   display: 'flex',
            //   flexDirection: { xs: 'column', sm: 'row' },
            //   justifyContent: 'flex-start', // Align content to the left
            //   alignItems: 'flex-start', // Align items to the top left
            //   gap: { xs: 3, sm: 0 },
            //   '& .MuiCardHeader-action': {
            //     width: { xs: '100% ', sm: 'auto' }
            //   }
            // }}
            title={RenderUtility.pageTitle('All Shipments')}
          />
          <Grid
            item
            sx={{
              mx: { xs: 4 },
              ml: { md: 4 }
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',

                border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                borderRadius: '8px',
                padding: '0 8px',
                height: '40px',
                width: {
                  xs: '100%',
                  sm: '250px'
                }
              }}
            >
              <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
              <TextField
                variant='outlined'
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
          <Grid
            sx={{
              mx: 4
            }}
          >
            <CommonTable
              onRowClick={onRowClick}
              indexedRows={indexedRows}
              total={total}
              columns={columns}
              paginationModel={paginationModel}
              handleSortModel={handleSortModel}
              setPaginationModel={setPaginationModel}
              loading={loading}
              searchValue={searchValue}
            />
          </Grid>
        </Card>
      ) : (
        <Error404></Error404>
      )}
    </>
  )
}

export default AllShipments
