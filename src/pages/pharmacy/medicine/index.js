import React, { useState, useEffect, useCallback } from 'react'
import { getMedicineList } from 'src/lib/api/pharmacy/getMedicineList'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { useTheme } from '@emotion/react'
import { useRouter } from 'next/router'

// ** MUI Imports
import { Box, Tab, Grid, Tooltip, Typography, IconButton } from '@mui/material'

import { debounce } from 'lodash'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

import CommonDialogBox from 'src/components/CommonDialogBox'
import MedicineConfigure from 'src/components/pharmacy/medicine/MedicineConfigure'
import Utility from 'src/utility'

import { usePharmacyContext } from 'src/context/PharmacyContext'

import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'

import { TabContext, TabList, TabPanel } from '@mui/lab'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import MUISelect from 'src/views/forms/form-fields/MUISelect'
import { productCategoryOptions } from 'src/constants/PharmacyConstants'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import MenuWithDots from 'src/components/MenuWithDots'
import AddReOrderDialog from 'src/components/pharmacy/stockLocation/AddReOrderDialog'
import { ExportButton } from 'src/views/utility/render-snippets'

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
  const [dialogCheck, setDialogCheck] = useState(false)

  const [openReOrderLevelDialog, setOpenReOrderLevelDialog] = useState(false)
  const [configReOrderMed, setConfigReOrderMed] = useState(null)

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
              fontWeight: 400
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
      sortable: false,

      renderCell: params => (
        <Box onClick={e => e.stopPropagation()} sx={{ display: 'flex', alignItems: 'center' }}>
          {selectedPharmacy.type === 'central' &&
            (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
              <>
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
                <Tooltip title='More Options' placement='top'>
                  <MenuWithDots options={getMenuOptions(params?.row)} />
                </Tooltip>
              </>
            )}
        </Box>

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
  const [excelLoader, setExcelLoader] = useState(false)

  const [statusFilter, setStatusFilter] = useState(router.query.status || 'all')
  const [categoryFilter, setCategoryFilter] = useState(router.query.category || 'All')
  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async ({ sort, q, column, status, category }) => {
      const activeStatus = status ?? statusFilter
      const activeCategoryFilter = category ?? categoryFilter
      try {
        setLoading(true)

        let params = {
          sort,
          q,
          column,
          page: paginationModel?.page + 1,
          limit: paginationModel?.pageSize,
          ...(activeStatus !== 'all' && { active: activeStatus }),
          ...(activeCategoryFilter !== 'All' && { category: activeCategoryFilter })
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
    [paginationModel, statusFilter, categoryFilter, dialogCheck]
  )

  const ExportExcel = async ({ status }) => {
    // let params = {}
    const activeStatus = status ?? statusFilter
    try {
      setExcelLoader(true)

      let params = {
        sort: sort,
        q: searchValue,
        column: sortColumn,
        ...(activeStatus !== 'all' && { active: activeStatus }),
        ...(categoryFilter && { category: categoryFilter }),
        response_type: 'csv'
      }

      console.log('aaaa', params)
      const response = await getMedicineList({ params })
      if (response?.success === true && response?.data) {
        Utility.downloadFileFromURL(response?.data)
        setExcelLoader(false)
      } else {
        setExcelLoader(false)
      }
    } catch (error) {
      console.log('Error', error)
      setExcelLoader(false)
    } finally {
      setExcelLoader(false)
    }
  }

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
      limit: paginationModel?.pageSize,
      category: categoryFilter
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
        limit: paginationModel?.pageSize,
        category: categoryFilter
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
            styles={{ margin: 0 }}
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

  const getMenuOptions = row => [
    {
      label: 'Add Reorder Level',
      action: () => {
        setOpenReOrderLevelDialog(true)
        setConfigReOrderMed(row)
      }
    }
  ]

  const RenderTable = () => {
    return (
      <>
        {/* Table Section */}
        <Grid>
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
              <PageCardLayout title={'Product List'} action={headerAction}>
                <Grid
                  container
                  spacing={3}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
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
                    size={{ xs: 12, sm: 6, md: 6 }}
                    sx={{
                      display: 'flex',
                      gap: '6px',
                      alignItems: 'center'
                    }}
                  >
                    <MUISelect
                      label='Category'
                      value={categoryFilter}
                      onChange={e => {
                        const val = e.target.value
                        setCategoryFilter(val)
                      }}
                      options={productCategoryOptions}
                      sx={{ minWidth: 150, maxWidth: 200 }}
                    />
                    <MUISearch
                      onChange={e => handleSearch(e.target.value)}
                      onClear={() => handleSearch('')}
                      placeholder='Search...'
                      value={searchValue}
                    />
                    <Box>
                      <ExportButton onClick={ExportExcel} loading={excelLoader} disabled={total === 0 ? true : false} />
                    </Box>
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
                {openReOrderLevelDialog && (
                  <AddReOrderDialog
                    openDrawer={openReOrderLevelDialog}
                    setOpenDrawer={setOpenReOrderLevelDialog}
                    stockDetails={configReOrderMed}
                    setStockDetails={setConfigReOrderMed}
                    dialogCheck={dialogCheck}
                    setDialogCheck={setDialogCheck}
                  />
                )}
              </PageCardLayout>
            </>
          )}
        </>
      ) : null}
    </>
  )
}

export default ListOfMedicine
