import React, { useState, useEffect, useCallback } from 'react'

import { getMedicineList } from 'src/lib/api/pharmacy/getMedicineList'
import { IMAGE_BASE_URL } from 'src/constants/ApiConstant'

// import { getMedicineConfig } from 'src/lib/api/getMedicineConfig'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports

import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { debounce } from 'lodash'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Avatar, Badge } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import Router from 'next/router'
import CommonDialogBox from 'src/components/CommonDialogBox'
import MedicineConfigure from 'src/components/pharmacy/medicine/MedicineConfigure'
import Utility from 'src/utility'
import { AddButton } from 'src/components/Buttons'
import { Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material'

import { usePharmacyContext } from 'src/context/PharmacyContext'

import Error404 from 'src/pages/404'

const ListOfMedicine = () => {
  const [medicineList, setMedicineList] = useState([])
  const [loader, setLoader] = useState(false)
  const [show, setShow] = useState(false)
  const [configureMedId, setConfigureMedId] = useState('')

  const { selectedPharmacy } = usePharmacyContext()

  const closeDialog = () => {
    setShow(false)
  }

  const showDialog = () => {
    setShow(true)
  }

  const handleEdit = async row => {
    if (
      selectedPharmacy.type === 'central' &&
      (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD')
    ) {
      Router.push({
        pathname: '/pharmacy/medicine/add-product',
        query: { id: row?.row?.id, action: 'edit' }
      })
    }
  }

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'id',
      headerName: 'SL ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.sl_no)}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'name',
      headerName: 'PRODUCT NAME',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.name}
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'stock_type',
    //   headerName: 'Type',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       <span alt={params.row.stock_type}>{params.row.stock_type}</span>
    //     </Typography>
    //   )
    // },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'package',
      headerName: 'PACKAGE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {`${params.row.package} of ${Utility.formatNumber(params.row.package_qty)}
        ${params.row.package_uom_label} ${params.row.product_form_label}`}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'manufacturer_name',
      headerName: 'Manufacturer Name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <span alt={params.row.manufacturer_name}>{params.row.manufacturer_name}</span>
        </Typography>
      )
    },

    {
      flex: 0.3,
      minWidth: 20,
      field: 'created_at',
      headerName: 'Product Type',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.stock_type}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'image',
      headerName: 'IMAGE',
      renderCell: params => (
        <Badge
          sx={{ ml: 2, cursor: 'pointer' }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
        >
          <Avatar
            variant='square'
            alt='Medicine Image'
            sx={{ width: 40, height: 40 }}
            src={params.row.image ? `${params.row.image}` : '/images/tablet.png'}
          />
        </Badge>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'active',
      headerName: 'STATUS',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.active) === 0 ? 'Inactive' : 'Active'}
        </Typography>
      )
    }

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'Action',
    //   headerName: 'Action',

    //   renderCell: params => (
    //     <>
    //       {selectedPharmacy.type === 'central' &&
    //         (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
    //           <Box>
    //             <IconButton size='small' onClick={() => handleEdit(params.row.id)} aria-label='Edit'>
    //               <Icon icon='mdi:pencil-outline' />
    //             </IconButton>
    //           </Box>
    //         )}
    //     </>

    //     // {selectedPharmacy.type === 'central' && (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') &&(<Box>
    //     //   <IconButton size='small' onClick={() => handleEdit(params.row.id)} aria-label='Edit'>
    //     //     <Icon icon='mdi:pencil-outline' />
    //     //   </IconButton>
    //     //   {/* <IconButton
    //     //     size='small'
    //     //     onClick={() => {
    //     //       setConfigureMedId(params.row.id)
    //     //       showDialog()
    //     //     }}
    //     //   >
    //     //     <Icon icon='grommet-icons:configure' />
    //     //   </IconButton> */}
    //     //   {/* <IconButton size='small'>
    //     //     <Icon icon='mdi:eye-outline' />
    //     //   </IconButton>

    //     //   <IconButton size='small'>
    //     //     <Icon icon='mdi:file' />
    //     //   </IconButton> */}
    //     // </Box>)}
    //   )
    // }
  ]

  /***** Serverside pagination */
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState(true)
  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async ({ sort, q, column, status }) => {
      let params = {}
      const activeStatus = status ?? statusFilter
      try {
        setLoading(true)
        if (activeStatus === 'all') {
          params = {
            sort,
            q,
            column,
            page: paginationModel.page + 1,
            limit: paginationModel.pageSize
          }
        } else {
          params = {
            sort,
            q,
            column,
            page: paginationModel.page + 1,
            limit: paginationModel.pageSize,
            active: activeStatus
          }
        }

        await getMedicineList({ params: params }).then(res => {
          if (res?.success === true && res?.data?.list_items?.length > 0) {
            setTotal(parseInt(res?.data?.total_count))
            setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
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
        await fetchTableData({ sort, q, column, status: statusFilter })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  useEffect(() => {
    fetchTableData({ sort, q: searchValue, column: sortColumn, status: statusFilter })
  }, [fetchTableData])

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      setSort(newModel[0].sort)
      await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
    } else {
    }
  }

  const handleSearch = async value => {
    setSearchValue(value)
    await searchTableData({ sort, q: value, column: sortColumn, status: statusFilter })
  }

  const handleStatusFilterChange = newFilter => {
    setStatusFilter(newFilter)
    fetchTableData({ sort, q: searchValue, column: sortColumn, status: newFilter })
  }

  const headerAction = (
    <div>
      {selectedPharmacy.type === 'central' &&
        (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
          <AddButton
            title='Add Product'
            action={() => {
              Router.push('/pharmacy/medicine/add-product')
            }}
          />
        )}
      {/* <Button
        size='big'
        variant='contained'
        onClick={() => {
          Router.push('/pharmacy/medicine/add-product')
        }}
      >
        Add Product
      </Button> */}
    </div>
  )

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      {selectedPharmacy.type === 'central' ? (
        <>
          {loader ? (
            <FallbackSpinner />
          ) : (
            <>
              <CommonDialogBox
                title={'Configure Medicine'}
                dialogBoxStatus={show}
                formComponent={<MedicineConfigure configureMedId={configureMedId} />}
                close={closeDialog}
                show={showDialog}
              />
              <Card>
                <CardHeader title='Product List' action={headerAction} />
                <Grid container sx={{ display: 'flex' }}>
                  <Grid item xs={12} sm={2} md={2} sx={{ ml: 4 }}>
                    <FormControl fullWidth size='small'>
                      <InputLabel id='demo-simple-select-label'>Filter by Status</InputLabel>
                      <Select
                        size='small'
                        value={statusFilter}
                        label='Filter by Status'
                        onChange={e => {
                          handleStatusFilterChange(e.target.value)
                        }}
                      >
                        <MenuItem value='all'>All</MenuItem>
                        <MenuItem value={true}>Active</MenuItem>
                        <MenuItem value={false}>In-Active </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <DataGrid
                  sx={{ cursor: 'pointer' }}
                  columnVisibilityModel={{
                    id: false
                  }}
                  autoHeight
                  pagination
                  hideFooterSelectedRowCount
                  disableColumnSelector={true}
                  rows={indexedRows === undefined ? [] : indexedRows}
                  rowCount={total}
                  columns={columns}
                  sortingMode='server'
                  paginationMode='server'
                  pageSizeOptions={[7, 10, 25, 50]}
                  paginationModel={paginationModel}
                  onSortModelChange={handleSortModel}
                  slots={{ toolbar: ServerSideToolbar }}
                  onPaginationModelChange={setPaginationModel}
                  loading={loading}
                  disableColumnMenu
                  slotProps={{
                    baseButton: {
                      variant: 'outlined'
                    },
                    toolbar: {
                      value: searchValue,
                      clearSearch: () => handleSearch(''),

                      onChange: event => {
                        setSearchValue(event.target.value)

                        return handleSearch(event.target.value)
                      }
                    }
                  }}
                  onRowClick={handleEdit}
                />
              </Card>
            </>
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

export default ListOfMedicine
