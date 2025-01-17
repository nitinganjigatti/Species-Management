import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@emotion/react'
import { useRouter } from 'next/router'

import { debounce } from 'lodash'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Grid, Typography, CardHeader, Card, TextField, InputAdornment } from '@mui/material'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import RenderUtility from 'src/utility/render'
import { getRequestListsOfAllStores } from 'src/lib/api/pharmacy/storeWiseRequest'
import IndividualStoreRequests from 'src/pages/pharmacy/requests-by-store/[id]'

const AllStoresRequestList = () => {
  const theme = useTheme()
  const router = useRouter()

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }
  const { selectedPharmacy } = usePharmacyContext()

  const handleRowClick = params => {
    router.push({
      pathname: `/pharmacy/requests-by-store/${params?.row?.requested_store_id}`
    })
  }

  const columns = [
    {
      Width: 30,
      field: 'id',
      headerName: 'SL NO ',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.neutralSecondary,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {parseInt(params.row.id) + '.'}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'store_name',
      headerName: 'Store Name',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params?.row?.store_name}
        </Typography>
      )
    },

    {
      width: 200,

      field: 'pending_items',
      headerName: 'Total Pending Items',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.Tertiary,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.pending_items}
        </Typography>
      )
    },
    {
      width: 200,

      field: 'emergency_items',
      headerName: 'Emergency Items',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.Error,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.emergency_items}
        </Typography>
      )
    }
  ]

  // /***** Serverside pagination */

  const [total, setTotal] = useState(0)

  const [sort, setSort] = useState(router.query.sort || 'asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'name')

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 10
  })

  const [loading, setLoading] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async ({ sort, q, column, status }) => {
      try {
        setLoading(true)

        const params = {
          q,
          sort,
          column: 'store_name',
          page: paginationModel?.page + 1,
          limit: paginationModel?.pageSize
        }
        await getRequestListsOfAllStores({ params: params }).then(res => {
          if (res?.success === true && res?.data?.list_stores?.length > 0) {
            setTotal(res?.data?.total_count)
            setRows(loadServerRows(paginationModel?.page, res?.data?.list_stores))
            updateUrlParams({
              sort,
              q: searchValue,
              column: column,
              status: status,
              page: paginationModel?.page,
              limit: paginationModel?.pageSize
            })
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

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column }) => {
      setSearchValue(q)
      try {
        await fetchTableData({ sort, q, column })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    [fetchTableData]
  )

  useEffect(() => {
    fetchTableData({ sort, q: searchValue, column: sortColumn })
    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize
    })
  }, [fetchTableData, selectedPharmacy.id])

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
      updateUrlParams({
        sort: newModel[0].sort,
        q: searchValue,
        column: newModel[0].field,

        page: paginationModel?.page,
        limit: paginationModel?.pageSize
      })
    } else {
    }
  }

  const handleSearch = async value => {
    setSearchValue(value)
    await searchTableData({ sort, q: value, column: sortColumn })
  }

  const getSlNo = index => (paginationModel?.page + 1 - 1) * paginationModel?.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: getSlNo(index)
  }))

  return (
    <>
      {selectedPharmacy?.type === 'central' ? (
        <Card>
          <CardHeader
            title={RenderUtility.pageTitle('Requests By Store')}
            action={
              <TextField
                variant='outlined'
                size='small'
                placeholder='Search...'
                value={searchValue}
                onChange={e => handleSearch(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  borderRadius: '8px',
                  width: { xs: '100%', md: '290px' }
                }}
              />
            }
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              gap: { xs: 3, sm: 0 },
              '& .MuiCardHeader-action': {
                width: { xs: '100% ', sm: 'auto' }
              },
              mx: { xs: -1, sm: 1 },
              mt: 1
            }}
          />

          {/* Table Section */}
          <Grid sx={{ mx: { xs: 3, md: 5 } }}>
            <CommonTable
              onRowClick={handleRowClick}
              indexedRows={indexedRows || []}
              total={total}
              columns={columns || []}
              paginationModel={paginationModel}
              handleSortModel={handleSortModel}
              setPaginationModel={setPaginationModel}
              loading={loading}
              searchValue={searchValue}
            />
          </Grid>
        </Card>
      ) : (
        <IndividualStoreRequests />
      )}
    </>
  )
}

export default AllStoresRequestList
