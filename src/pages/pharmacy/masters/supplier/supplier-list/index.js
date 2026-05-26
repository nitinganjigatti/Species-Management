import React, { useState, useEffect, useCallback } from 'react'

import { getSuppliersByParams } from 'src/lib/api/pharmacy/getSupplierList'

import FallbackSpinner from 'src/@core/components/spinner'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, debounce, Tooltip } from '@mui/material'
import Router from 'next/router'
import Error404 from 'src/pages/404'

import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import { AddButtonContained } from 'src/components/ButtonContained'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { useTheme } from '@emotion/react'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import { ExportButton } from 'src/views/utility/render-snippets'
import Utility from 'src/utility'

const Supplier = () => {
  const theme = useTheme()
  const [supplierList, setSupplierList] = useState([])
  const [loader, setLoader] = useState(false)
  const [sort, setSort] = useState('desc')
  const [sortColumn, setSortColumn] = useState('id')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [searchValue, setSearchValue] = useState('')
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  const authData = useContext(AuthContext)

  const pharmacyRole = authData?.userData?.roles?.settings?.add_pharmacy

  function loadServerRows(currentPage, data) {
    return data
  }

  const getSupplierList = useCallback(
    async (sort, sortColumn, q) => {
      try {
        setLoading(true)

        const params = {
          sort: sort,
          column: sortColumn,
          q,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }
        const response = await getSuppliersByParams({ params: params })
        setTotal(parseInt(response?.data?.data?.total_count))

        let listWithId = response?.data?.data?.list_items
          ? response?.data?.data?.list_items.map((el, i) => {
              return { ...el, uid: i + 1 }
            })
          : []

        // setSupplierList(listWithId)
        setSupplierList(listWithId)

        setLoading(false)
      } catch (error) {
        setLoading(false)
      }
    },
    [paginationModel]
  )

  const handleEdit = id => {
    Router.push({
      pathname: '/pharmacy/masters/supplier/add-supplier',
      query: { id: id, action: 'edit' }
    })
  }

  const searchTableData = useCallback(
    debounce(async (sort, column, q) => {
      setSearchValue(q)

      try {
        await getSupplierList(sort, column, q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      getSupplierList(newModel[0].sort, newModel[0].field)
    } else {
    }
  }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, sortColumn, value)
  }

  // useEffect(() => {
  //   getSupplierList(searchValue)
  // }, [paginationModel])

  useEffect(() => {
    getSupplierList()
  }, [paginationModel])

  const columns = [
    {
      minWidth: 100,
      alignItems: 'right',
      field: 'uid',
      headerName: 'SL.NO ',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid + '.'}
        </Typography>
      )
    },
    {
      flex: 1,
      minWidth: 250,
      field: 'company_name',
      headerName: 'SUPPLIER NAME',
      renderCell: params => (
        <Tooltip title={params.row.company_name}>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.company_name}
          </Typography>
        </Tooltip>
      )
    },

    {
      flex: 0.2,
      minWidth: 250,
      field: 'mobile',
      headerName: 'MOBILE NUMBER',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.mobile}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 250,
      field: 'name',
      headerName: 'CONTACT PERSON',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.name !== '' ? params.row.name : 'NA'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 250,
      field: 'state_name',
      headerName: 'STATE',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.state_name}
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'opening_balance',
    //   headerName: 'OPENING BALANCE',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.opening_balance}
    //     </Typography>
    //   )
    // },

    {
      flex: 0.2,
      minWidth: 120,
      field: 'status',
      headerName: 'STATUS',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.status === 'active' ? 'Active' : 'Inactive'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 150,
      field: 'Action',
      headerName: 'Action',
      sortable: false,
      renderCell: params => (
        <>
          {pharmacyRole && (
            <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
              {/* <IconButton size='small' sx={{ mr: 0.5 }}>
            <Icon icon='mdi:eye-outline' />
          </IconButton> */}
              <IconButton size='small' sx={{ mr: 0.5 }} onClick={() => handleEdit(params.row.id)} aria-label='Edit'>
                <Icon icon='mdi:pencil-outline' />
              </IconButton>
              {/* <IconButton size='small' sx={{ mr: 0.5 }}>
            <Icon icon='mdi:delete-outline' />
          </IconButton> */}
            </Box>
          )}
        </>
      )
    }
  ]

  const handleHeaderAction = () => {
    console.log('Handle Header Action')
  }

  const headerAction = (
    <div>
      {pharmacyRole && (
        <Grid item>
          <AddButtonContained
            title='Add Supplier'
            action={() => Router.push('/pharmacy/masters/supplier/add-supplier')}
            fullWidth='fullWidth'
            styles={{ margin: 0 }}
          />
        </Grid>
      )}
    </div>
  )

  const handleExport = async () => {
    const params = {
      q: searchValue,
      sort: sort,
      column: sortColumn,
      response_type: 'csv'
    }
    try {
      setExportLoading(true)
      const response = await getSuppliersByParams({ params })

      if (response?.data?.success && response?.data?.data) {
        Utility.downloadFileFromURL(response?.data?.data)
        setExportLoading(false)
      }
    } catch (error) {
      setExportLoading(false)
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <>
      {pharmacyRole ? (
        <>
          {loader ? (
            <FallbackSpinner />
          ) : (
            <PageCardLayout title={'Supplier List'} action={headerAction}>
              <Grid container sx={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <Grid item size={{ xs: 'grow', sm: 3.5, md: 3.5, lg: 3, xl: 2.5 }}>
                  <MUISearch
                    sx={{
                      width: {
                        xs: '100%',
                        sm: '250px'
                      }
                    }}
                    placeholder='Search...'
                    onChange={e => handleSearch(e.target.value)}
                    onClear={() => handleSearch('')}
                    value={searchValue}
                  />
                </Grid>
                <Grid item>
                  <ExportButton onClick={handleExport} loading={loading || exportLoading} disabled={total === 0} />
                </Grid>
              </Grid>

              <Grid>
                <CommonTable
                  total={total}
                  columns={columns}
                  indexedRows={supplierList}
                  loading={loading}
                  handleSortModel={handleSortModel}
                  paginationModel={paginationModel}
                  setPaginationModel={setPaginationModel}
                />
              </Grid>

              {/* // <TableWithFilter
            //   TableTitle={title}
            //   headerActions={
            //     <div>
            //       <AddButtonContained
            //         title='Add Supplier'
            //         action={() => {
            //           Router.push('/pharmacy/masters/supplier/add-supplier')
            //         }}
            //       />
            //     </div>
            //   }
            //   columns={columns}
            //   rows={supplierList}
            // /> */}
            </PageCardLayout>
          )}
        </>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default Supplier
