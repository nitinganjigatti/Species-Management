import React, { useState, useEffect, useCallback } from 'react'

import { getSuppliers, getSuppliersByParams } from 'src/lib/api/pharmacy/getSupplierList'
import TableWithFilter from '../../../../../components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { usePharmacyContext } from 'src/context/PharmacyContext'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, CardHeader, debounce, TextField } from '@mui/material'
import Router from 'next/router'
import { AddButton } from 'src/components/Buttons'
import Error404 from 'src/pages/404'

import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import { AddButtonContained } from 'src/components/ButtonContained'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { useTheme } from '@emotion/react'
import RenderUtility from 'src/utility/render'

const Supplier = () => {
  const theme = useTheme()
  const [supplierList, setSupplierList] = useState([])
  const [loader, setLoader] = useState(false)
  const [sort, setSort] = useState('desc')
  const [sortColumn, setSortColumn] = useState('label')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [searchText, setSearchText] = useState('')
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

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
          sort,
          sortColumn,
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
      setSearchText(q)
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
    setSearchText(value)
    searchTableData(sort, sortColumn, value)
  }

  // useEffect(() => {
  //   getSupplierList(searchText)
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
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid + '.'}
        </Typography>
      )
    },
    {
      minWidth: 250,
      field: 'company_name',
      headerName: 'SUPPLIER NAME',
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
          {params.row.company_name}
        </Typography>
      )
    },

    {
      minWidth: 250,
      field: 'mobile',
      headerName: 'MOBILE NUMBER',
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
          {params.row.mobile}
        </Typography>
      )
    },
    {
      minWidth: 250,
      field: 'name',
      headerName: 'CONTACT PERSON',
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
          {params.row.name !== '' ? params.row.name : 'NA'}
        </Typography>
      )
    },
    {
      minWidth: 250,
      field: 'state_name',
      headerName: 'STATE',
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
      minWidth: 100,
      field: 'Action',
      headerName: 'Action',
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
      {/* {selectedPharmacy.type === 'central' &&
          (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && ( */}
      {pharmacyRole && (
        <Grid item>
          <AddButtonContained
            title='Add Supplier'
            action={() => Router.push('/pharmacy/masters/supplier/add-supplier')}
            fullWidth='fullWidth'
          />
        </Grid>
      )}
    </div>
  )

  return (
    <>
      {pharmacyRole ? (
        <>
          {loader ? (
            <FallbackSpinner />
          ) : (
            <Card>
              <CardHeader
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'flex-start', // Align content to the left
                  alignItems: 'flex-start', // Align items to the top left
                  gap: { xs: 3, sm: 0 },
                  '& .MuiCardHeader-action': {
                    width: { xs: '100% ', sm: 'auto' }
                  }
                }}
                title={RenderUtility.pageTitle('Supplier List')}
                action={headerAction}
              />{' '}
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
              <Grid sx={{ mx: 4 }}>
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
            </Card>

            // <TableWithFilter
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
            // />
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
