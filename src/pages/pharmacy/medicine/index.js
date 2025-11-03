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
import { Box, Avatar, Badge, TextField, Tab, Tooltip } from '@mui/material'
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
import { fontSize, height, width } from '@mui/system'
import StyleWithIconCardComponent from 'src/views/utility/style-with-icon-card'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'

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
    const id = row?.id

    if (
      selectedPharmacy.type === 'central' &&
      (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD')
    ) {
      router.push({
        pathname: '/pharmacy/medicine/add-product',
        query: { id: id, action: 'edit' }
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
      minWidth: 20,

      // flex: 0.15,
      width: 80,
      field: 'id',
      headerName: 'SL.NO',
      renderCell: params => (
        <Box sx={{ minWidth: 40 }}>
          <Typography sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '400px' }}>
            {parseInt(params.row.sl_no) + '.'}
          </Typography>
        </Box>
      )
    },
    {
      // flex: 0.3,
      width: 300,
      minWidth: 20,
      field: 'name',
      align: 'left',
      headerName: 'PRODUCT NAME',
      renderCell: params => (
        <Box>
          <PharmacyProductCard
            title={params?.row?.name}
            subTitle={params?.row?.generic_name}
            icon={params?.row?.image}
            controlSubstance={params?.row?.controlled_substance === '1' && true}
            prescriptionRequired={params?.row?.prescription_required === '1' && true}
          />
        </Box>
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
      // flex: 0.4,
      minWidth: 20,
      width: 250,
      field: 'package',
      headerName: 'PRESENTATION',
      renderCell: params => (
        <Tooltip
          title={`${params.row.package} of ${Utility.formatNumber(params.row.package_qty)}
        ${params.row.package_uom_label} ${params.row.product_form_label}`}
        >
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 400,
              fontFamily: 'Inter',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: 240
            }}
          >
            {`${params.row.package} of ${Utility.formatNumber(params.row.package_qty)}
        ${params.row.package_uom_label} ${params.row.product_form_label}`}
          </Typography>
        </Tooltip>
      )
    },
    {
      // flex: 0.4,
      minWidth: 20,
      width: 200,
      field: 'manufacturer_name',
      headerName: 'Manufacturer',
      renderCell: params => (
        <Tooltip title={params.row.manufacturer_name}>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 400,
              fontFamily: 'Inter',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: 200
            }}
          >
            <span alt={params.row.manufacturer_name}> {params.row.manufacturer_name}</span>
          </Typography>
        </Tooltip>
      )
    },

    {
      // flex: 0.3,
      width: 200,
      minWidth: 20,
      field: 'stock_type',
      headerName: 'Product Type',
      renderCell: params => (
        <Tooltip title={params.row.stock_type}>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 400,
              fontFamily: 'Inter',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: 200,
              textTransform: 'capitalize'
            }}
          >
            {Utility.formatText(params.row.stock_type)}
          </Typography>
        </Tooltip>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'image',
    //   headerName: 'IMAGE',
    //   renderCell: params => (
    //     <Badge
    //       sx={{ ml: 2, cursor: 'pointer' }}
    //       anchorOrigin={{
    //         vertical: 'bottom',
    //         horizontal: 'right'
    //       }}
    //     >
    //       <Avatar
    //         variant='square'
    //         alt='Medicine Image'
    //         sx={{ width: 40, height: 40 }}
    //         src={params.row.image ? `${params.row.image}` : '/images/tablet.png'}
    //       />
    //     </Badge>
    //   )
    // },

    {
      // flex: 0.2,
      width: 150,
      minWidth: 20,
      field: 'active',
      headerName: 'STATUS',
      renderCell: params => (
        <Box
          sx={{
            width: '78px',
            height: '25px',
            px: '8px',
            py: '4px',

            // bgcolor: '#37BD6933',
            // border: '1px solid #37BD6933',

            bgcolor: parseInt(params.row.active) === 0 ? '#FFEBEF' : '#37BD6933',
            border: '1px solid',
            borderColor: parseInt(params.row.active) === 0 ? '#FFD3D3' : '#37BD6933',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '6px'
          }}
        >
          <Typography
            variant='body2'
            sx={{
              // color: theme.palette.customColors.customHeadingTextColor,

              color:
                parseInt(params.row.active) === 0
                  ? theme.palette.customColors.Error
                  : theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 400,
              fontFamily: 'Inter'
            }}
          >
            {parseInt(params.row.active) === 0 ? 'In-Active' : 'Active'}
          </Typography>
        </Box>
      )
    },

    {
      minWidth: 200,
      field: 'created_by',
      headerName: 'Created by ',
      renderCell: params => (
        <>
          <UserAvatarDetails
            profile_image={params?.row?.user_created_profile_pic}
            user_name={params?.row?.created_by_user_name}
            date={params?.row?.created_at}
          />
        </>
      )
    },

    {
      minWidth: 200,
      field: 'updated_by',
      headerName: 'Updated by',
      renderCell: params => (
        <>
          <UserAvatarDetails
            profile_image={params?.row?.user_updated_profile_pic}
            user_name={params?.row?.updated_by_user_name}
            date={params?.row?.updated_at}
          />
        </>
      )
    },

    {
      // flex: 0.2,
      minWidth: 20,
      width: 100,
      field: 'Action',
      headerName: 'Action',

      renderCell: params => (
        <>
          {selectedPharmacy.type === 'central' &&
            (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
              <Box>
                <IconButton
                  size='small'
                  onClick={e => {
                    e.stopPropagation(), handleEdit(params.row)
                  }}
                  aria-label='Edit'
                >
                  <Icon icon='mdi:pencil-outline' />
                </IconButton>
              </Box>
            )}
        </>

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
      )
    }
  ]

  const [total, setTotal] = useState(0)

  const [sort, setSort] = useState(router.query.sort || 'asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'name')

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })

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
  const [tabValue, setTabValue] = useState(router.query.status || 'all')

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    setPaginationModel({ page: 0, pageSize: 50 })
    setSearchValue('')
    setStatusFilter(newValue)
  }

  const RenderTable = () => {
    return (
      <>
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
      </>
    )
  }

  return (
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
                    mx: 0,

                    px: { xs: '12px', sm: '14px', md: '20px' }
                  }}
                />
                {/* <Box
                  display='flex'
                  // justifyContent='space-between'
                  flexDirection={{ xs: 'column', sm: 'row' }} // Adjust direction based on screen size
                  gap={6} // Gap between items on smaller screens
                  sx={{ mx: { xs: 3, md: 5 } }}
                  mt={3}
                > */}
                {/* Left Box (Search Field) */}
                {/* <Grid item xs={12} sm={8} md={7}> */}
                {/* <Box sx={{ ml: 'auto' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
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
                  </Box> */}

                {/* </Grid> */}

                {/* Right Box (Filter by Status) */}
                {/* <Grid
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
                  </Grid> */}
                {/* </Box> */}
                <Grid
                  container
                  spacing={3}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: { xs: '12px', sm: '14px', md: '20px' }
                  }}
                >
                  <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                    <TabContext value={tabValue} sx={{ m: 0, p: 0 }}>
                      <TabList onChange={handleTabChange} aria-label='lab API tabs example'>
                        <Tab label='All' value='all' />
                        <Tab label='Active' value='true' />
                        <Tab label='In-Active' value='false' />
                      </TabList>
                    </TabContext>
                  </Grid>
                  <Grid
                    item
                    size={{ xs: 12, sm: 4, md: 4 }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                      borderRadius: '8px',

                      padding: '0 8px'
                    }}
                  >
                    <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                    <TextField
                      variant='outlined'
                      value={searchValue}
                      placeholder='Search...'
                      onChange={e => handleSearch(e.target.value)}
                      fullWidth
                      size='small'
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
                  </Grid>
                </Grid>

                <TabContext value={tabValue}>
                  <TabPanel value='all' sx={{ p: 0 }}>
                    {RenderTable()}
                  </TabPanel>
                  <TabPanel value='true' sx={{ p: 0 }}>
                    {RenderTable()}
                  </TabPanel>
                  <TabPanel value='false' sx={{ p: 0 }}>
                    {RenderTable()}
                  </TabPanel>
                </TabContext>
              </Card>
            </>
          )}
        </>
      ) : null}
    </>
  )
}

export default ListOfMedicine
