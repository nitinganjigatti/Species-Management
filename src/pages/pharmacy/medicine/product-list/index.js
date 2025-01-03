import React, { useState, useEffect, useCallback } from 'react'
import { getMedicineList } from 'src/lib/api/pharmacy/getMedicineList'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { useTheme } from '@emotion/react'
import { useRouter } from 'next/router'

// ** MUI Imports

import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import Card from '@mui/material/Card'
import { debounce } from 'lodash'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Avatar, Badge, TextField } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import CommonDialogBox from 'src/components/CommonDialogBox'
import MedicineConfigure from 'src/components/pharmacy/medicine/MedicineConfigure'
import Utility from 'src/utility'
import { AddButton } from 'src/components/Buttons'
import { Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material'

import { usePharmacyContext } from 'src/context/PharmacyContext'

import Error404 from 'src/pages/404'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'
import RenderUtility from 'src/utility/render'

const ListOfMedicine = () => {
  const theme = useTheme()
  const router = useRouter()

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }
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
      router.push({
        pathname: '/pharmacy/medicine/add-product',
        query: { id: row?.row?.id, action: 'edit' }
      })
    }
  }

  const handleRowClick = params => {
    router.push({
      pathname: `/pharmacy/medicine/${params.row?.id}`
    })
  }

  const columns = [
    {
      flex: 0.15,
      Width: 30,
      field: 'id',
      headerName: 'SL NO ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'name',
      headerName: 'PRODUCT NAME',
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
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
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
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
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
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
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
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
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

  // const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)

  const [statusFilter, setStatusFilter] = useState(router.query.status || true)
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
            page: paginationModel?.page + 1,
            limit: paginationModel?.pageSize
          }
        } else {
          params = {
            sort,
            q,
            column,
            page: paginationModel?.page + 1,
            limit: paginationModel?.pageSize,
            active: activeStatus
          }
        }

        await getMedicineList({ params: params }).then(res => {
          if (res?.success === true && res?.data?.list_items?.length > 0) {
            setTotal(parseInt(res?.data?.total_count))
            setRows(loadServerRows(paginationModel?.page, res?.data?.list_items))

            // updateUrlParams({
            //   sort,
            //   q: searchValue,
            //   column: column,
            //   status: status,
            //   page: paginationModel?.page,
            //   limit: paginationModel?.pageSize
            // })
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
    [paginationModel, statusFilter]
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
    [fetchTableData, statusFilter]
  )

  useEffect(() => {
    fetchTableData({ sort, q: searchValue, column: sortColumn, status: statusFilter })
    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      status: statusFilter,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize
    })
  }, [fetchTableData, statusFilter])

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
      updateUrlParams({
        sort: newModel[0].sort,
        q: searchValue,
        column: newModel[0].field,
        status: statusFilter,
        page: paginationModel?.page,
        limit: paginationModel?.pageSize
      })
    } else {
    }
  }

  const handleSearch = async value => {
    setSearchValue(value)
    await searchTableData({ sort, q: value, column: sortColumn, status: statusFilter })
  }

  const handleStatusFilterChange = newFilter => {
    setSearchValue('')
    setStatusFilter(newFilter)

    // updateUrlParams({
    //   sort,
    //   q: '',
    //   column: sortColumn,
    //   status: newFilter,
    //   page: paginationModel?.page,
    //   limit: paginationModel?.pageSize
    // })
    fetchTableData({ sort, q: '', column: sortColumn, status: newFilter })
  }

  const headerAction = (
    <div>
      {selectedPharmacy?.type === 'central' &&
        (selectedPharmacy?.permission?.key === 'allow_full_access' || selectedPharmacy?.permission.key === 'ADD') && (
          <AddButtonContained
            title='Add Product'
            action={() => {
              router.push('/pharmacy/medicine/add-product')
            }}
            fullWidth={'fullWidth'}
          />
        )}
    </div>
  )

  const getSlNo = index => (paginationModel?.page + 1 - 1) * paginationModel?.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  return (
    // <>
    //   {selectedPharmacy?.type === 'central' ? (
    //     <>
    //       {loader ? (
    //         <FallbackSpinner />
    //       ) : (
    //         <>
    //           <CommonDialogBox
    //             title={'Configure Medicine'}
    //             dialogBoxStatus={show}
    //             formComponent={<MedicineConfigure configureMedId={configureMedId} />}
    //             close={closeDialog}
    //             show={showDialog}
    //           />
    //           <Card>
    //             <CardHeader title={title} action={headerAction} />
    //             <Box display='flex' justifyContent='space-between' alignItems='center'>
    //               {/* Left Box (Search Field) */}
    //               <Grid item xs={8}>
    //                 <Box
    //                   sx={{
    //                     display: 'flex',
    //                     alignItems: 'center',
    //                     border: '1px solid #C3CEC7',
    //                     borderRadius: '8px',
    //                     padding: '0 8px',
    //                     ml: 5,
    //                     height: '40px',
    //                     width: '250px' // Set a fixed width for all status
    //                   }}
    //                 >
    //                   <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
    //                   <TextField
    //                     variant='outlined'
    //                     value={searchValue}
    //                     placeholder='Search...'
    //                     onChange={e => handleSearch(e.target.value)}
    //                     fullWidth
    //                     sx={{
    //                       '& .MuiOutlinedInput-root': {
    //                         border: 'none',
    //                         padding: '0',
    //                         '& fieldset': {
    //                           border: 'none'
    //                         }
    //                       }
    //                     }}
    //                   />
    //                 </Box>
    //               </Grid>
    //               <Grid item xs={12} sm={7} md={7} sx={{ float: 'right', display: 'flex', mr: 5, mt: 3 }}>
    //                 <FormControl fullWidth size='small'>
    //                   <InputLabel id='demo-simple-select-label'>Filter by Status</InputLabel>
    //                   <Select
    //                     size='small'
    //                     value={statusFilter}
    //                     label='Filter by Status'
    //                     onChange={e => {
    //                       handleStatusFilterChange(e.target.value)
    //                     }}
    //                   >
    //                     <MenuItem value='all'>All</MenuItem>
    //                     <MenuItem value={true}>Active</MenuItem>
    //                     <MenuItem value={false}>In-Active </MenuItem>
    //                   </Select>
    //                 </FormControl>
    //               </Grid>
    //             </Box>

    //             <Grid
    //               sx={{
    //                 mx: 4
    //               }}
    //             >
    //               <CommonTable
    //                 onRowClick={handleRowClick}
    //                 // eslint-disable-next-line lines-around-comment
    //                 // onRowClick={handleEdit}
    //                 indexedRows={indexedRows}
    //                 total={total}
    //                 columns={columns}
    //                 paginationModel={paginationModel}
    //                 handleSortModel={handleSortModel}
    //                 setPaginationModel={setPaginationModel}
    //                 loading={loading}
    //                 searchValue={searchValue}
    //               />
    //             </Grid>

    //             {/* <DataGrid
    //               sx={{ cursor: 'pointer' }}
    //               columnVisibilityModel={{
    //                 id: false
    //               }}
    //               autoHeight
    //               pagination
    //               hideFooterSelectedRowCount
    //               disableColumnSelector={true}
    //               rows={indexedRows === undefined ? [] : indexedRows}
    //               rowCount={total}
    //               columns={columns}
    //               sortingMode='server'
    //               paginationMode='server'
    //               pageSizeOptions={[7, 10, 25, 50]}
    //               paginationModel={paginationModel}
    //               onSortModelChange={handleSortModel}
    //               slots={{ toolbar: ServerSideToolbar }}
    //               onPaginationModelChange={setPaginationModel}
    //               loading={loading}
    //               disableColumnMenu
    //               slotProps={{
    //                 baseButton: {
    //                   variant: 'outlined'
    //                 },
    //                 toolbar: {
    //                   value: searchValue,
    //                   clearSearch: () => handleSearch(''),

    //                   onChange: event => {
    //                     setSearchValue(event.target.value)

    //                     return handleSearch(event.target.value)
    //                   }
    //                 }
    //               }}
    //               onRowClick={handleEdit}
    //             /> */}
    //           </Card>
    //         </>
    //       )}
    //     </>
    //   ) : (
    //     <>
    //       <Error404></Error404>
    //     </>
    //   )}
    // </>
    <>
      {selectedPharmacy?.type === 'central' ? (
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
                <CardHeader
                  title={RenderUtility.pageTitle('Product List')}
                  action={headerAction}
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
                <Box
                  display='flex'
                  justifyContent='space-between'
                  // alignItems="center"
                  flexDirection={{ xs: 'column', sm: 'row' }} // Adjust direction based on screen size
                  gap={6} // Gap between items on smaller screens
                  sx={{ mx: { xs: 3, md: 5 } }}
                  mt={3}
                >
                  {/* Left Box (Search Field) */}
                  <Grid item xs={12} sm={8} md={7}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',

                        // border: '1px solid #C3CEC7',
                        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderRadius: '8px',
                        padding: '0 8px',
                        height: '40px'
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

                  {/* Right Box (Filter by Status) */}
                  <Grid
                    item
                    xs={12}
                    sm={4}
                    md={4}
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center'
                    }}
                  >
                    <FormControl fullWidth size='small'>
                      <InputLabel id='status-filter-label'>Filter by Status</InputLabel>
                      <Select
                        size='small'
                        value={statusFilter}
                        label='Filter by Status'
                        onChange={e => handleStatusFilterChange(e.target.value)}
                      >
                        <MenuItem value='all'>All</MenuItem>
                        <MenuItem value={true}>Active</MenuItem>
                        <MenuItem value={false}>In-Active</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Box>

                {/* Table Section */}
                <Grid sx={{ mx: { xs: 3, md: 5 } }}>
                  <CommonTable
                    onRowClick={handleRowClick}
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
            </>
          )}
        </>
      ) : null}
    </>
  )
}

export default ListOfMedicine
