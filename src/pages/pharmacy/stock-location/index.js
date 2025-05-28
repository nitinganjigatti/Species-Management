import { useTheme } from '@emotion/react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import React, { useCallback, useEffect, useState } from 'react'
import { AddButtonContained } from 'src/components/ButtonContained'
import RenderUtility from 'src/utility/render'
import Icon from 'src/@core/components/icon'
import FilterListIcon from '@mui/icons-material/FilterList'
import { getStockItem } from 'src/lib/api/pharmacy/getStockItem'
import { useRouter } from 'next/router'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'
import Utility from 'src/utility'
import { debounce } from 'lodash'
import CommonDialogBox from 'src/components/CommonDialogBox'
import AddMedicineDialog from 'src/components/pharmacy/stockLocation/AddMedicineDialog'
import StockLocationFilter from 'src/components/pharmacy/stockLocation/StockLocationFilter'
import { getNewRackList } from 'src/lib/api/pharmacy/getRackList'
import StockDetailDrawer from 'src/components/pharmacy/stockLocation/StockDetailDrawer'
import { usePharmacyContext } from 'src/context/PharmacyContext'

const StockLocation = () => {
  const theme = useTheme()
  const router = useRouter()
  const { selectedPharmacy } = usePharmacyContext()

  const tabsForFilter = ['Racks']

  const [selectedItems, setSelectedItems] = useState({
    Racks: [],
    Shelves: []
  })

  const [items, setItems] = useState({
    Racks: [],
    Shelves: []
  })

  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'asc')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'stock_name')
  const [show, setShow] = useState(false)
  const [openFilter, setOpenFilter] = useState(false)
  const [activeTab, setActiveTab] = useState('Racks')
  const [tempSelectedItems, setTempSelectedItems] = useState(selectedItems)
  const [openRackListDrawer, setRackListDrawer] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [shelvesData, setShelvesData] = useState([])
  const [selectedShelves, setSelectedShelves] = useState([])
  const [applyFilterCheck, setApplyFilterCheck] = useState(false)
  const [dialogCheck, setDialogCheck] = useState(false)
  const [openStockDetailDrawer, setOpenStockDetailDrawer] = useState(false)
  const [configMed, setConfigMed] = useState(null)
  const [editProduct, setEditProduct] = useState(null)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  useEffect(() => {
    const getRacksLists = async () => {
      try {
        const response = await getNewRackList()
        if (response?.data.length > 0) {
          setItems(prev => ({
            ...prev,
            Racks: response?.data
          }))
        }
      } catch (error) {
        console.error('Error fetching rack list:', error)
      }
    }
    getRacksLists()
  }, [selectedPharmacy?.id])

  const fetchTableData = useCallback(
    async ({ sort, q, column, page, limit }) => {
      try {
        setLoading(true)

        const params = {
          sort: sort,
          q: q,
          column: column,
          page: page + 1,
          limit: limit,
          ...(selectedItems?.Racks?.length > 0 && { rack_id: selectedItems?.Racks.join(',') }),
          ...(selectedItems?.Shelves?.length > 0 && { shelf_id: selectedItems?.Shelves.join(',') })
        }

        await getStockItem({ params }).then(res => {
          if (res?.success === true && res?.data?.list_items?.length > 0) {
            setTotal(parseInt(res?.data?.total_count))
            setRows(loadServerRows(paginationModel?.page, res?.data?.list_items))
          } else {
            setTotal(parseInt(res?.data?.total_count))
            setRows([])
          }
        })
        setLoading(false)
      } catch (error) {
        console.log(error)
        setLoading(false)
      }
    },
    [paginationModel, selectedItems]
  )

  useEffect(() => {
    fetchTableData({
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize
    })
    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize
    })
  }, [selectedItems, fetchTableData, paginationModel.page, paginationModel.pageSize, dialogCheck, selectedPharmacy?.id])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: getSlNo(index)
  }))

  const columns = [
    {
      width: 80,
      minWidth: 20,
      field: 'id',
      sortable: false,
      headerName: 'SL.NO',

      renderCell: params => (
        <Box sx={{ minWidth: 40 }}>
          <Typography sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '400px' }}>
            {params.row.id + '.'}
          </Typography>
        </Box>
      )
    },
    {
      width: 260,
      minWidth: 20,
      field: 'stock_name',
      align: 'left',
      sortable: true,
      headerName: 'PRODUCT NAME',

      renderCell: params => (
        <Box>
          <PharmacyProductCard
            title={params?.row?.stock_name}
            subTitle={params?.row?.generic_name ? params?.row?.generic_name : 'NA'}
            icon={params?.row?.image}
          />
        </Box>
      )
    },
    {
      width: 180,
      minWidth: 20,
      field: 'rack_count',
      align: 'center',
      sortable: false,
      headerName: 'RACKS COUNT',
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
          {params.row?.rack_count ? Utility.formatNumber(params.row.rack_count) : 0}
        </Typography>
      )
    },
    {
      width: 200,
      minWidth: 20,
      field: 'shelf_count',
      align: 'center',
      sortable: false,
      headerName: 'SHELVES COUNT',
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
          {params.row?.shelf_count ? Utility.formatNumber(params.row.shelf_count) : 0}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 220,
      field: 'total_available_qty',
      headerName: 'TOTAL AVAILABLE QUANTITY',
      sortable: true,
      align: 'center',
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
          {params.row?.total_available_qty ? Utility.formatNumber(params.row.total_available_qty) : 0}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 220,
      field: 'min_qty',
      headerName: 'RE-ORDER LEVEL',
      sortable: true,
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
          {params.row?.min_qty ? Utility.formatNumber(params.row.min_qty) : 0}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 140,
      field: 'Action',
      headerAlign: 'right',
      headerName: 'Actions',
      align: 'right',
      sortable: false,
      renderCell: params => (
        <Box>
          <Tooltip title='Edit' placement='top'>
            <IconButton
              size='small'
              onClick={() => {
                setEditProduct(params?.row)
                setShow(true)
              }}
              aria-label='Edit'
            >
              <Icon icon='mdi:pencil-outline' />
            </IconButton>
          </Tooltip>
          <Tooltip title='More Options' placement='top'>
            <IconButton size='small' onClick={() => console.log(params?.rows?.stock_item_id)} aria-label='options'>
              <Icon icon='mdi-dots-vertical' />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ]

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn, paginationModel?.page, paginationModel?.pageSize)
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, page, limit) => {
      setSearchValue(q)
      try {
        await fetchTableData({ sort, q, column, page: 0, limit })
        updateUrlParams({
          sort: sort,
          q: q,
          column: column,
          page,
          limit
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      await searchTableData({
        sort: newModel[0].sort,
        q: searchValue,
        column: newModel[0].field,
        page: paginationModel?.page,
        limit: paginationModel?.pageSize
      })

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

  const closeDialog = () => {
    setShow(false)
  }

  const showDialog = () => {
    setShow(true)
  }

  const handleAddProduct = () => {
    showDialog()
  }

  const headerAction = (
    <>
      <AddButtonContained title='New Configurations' action={handleAddProduct} fullWidth={'fullWidth'} />
    </>
  )

  const handleFilterDrawer = () => {
    setOpenFilter(true)
    setActiveTab('Racks')
    if (applyFilterCheck === false) {
      setTempSelectedItems({
        Racks: [],
        Shelves: []
      })
      setSelectedItems({
        Racks: [],
        Shelves: []
      })
    }
  }

  const filterCount = selectedItems?.Racks?.length > 0 ? 1 : 0

  const handleStockRowClick = params => {
    if (
      params.field === 'stock_name' ||
      params.field === 'rack_count' ||
      params.field === 'shelf_count' ||
      params.field === 'total_available_qty' ||
      params.field === 'min_qty'
    ) {
      setConfigMed(params?.row)
      setOpenStockDetailDrawer(true)
    }
  }

  return (
    <>
      <Card>
        <CardHeader
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
          title={RenderUtility.pageTitle('Stock Location')}
          action={headerAction}
        />
        <CardContent sx={{ paddingTop: '4px' }}>
          <Box sx={{ mx: 1, mb: 2 }}>
            <Grid container spacing={2} justifyContent='flex-end' alignItems='center'>
              <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
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
                    borderRadius: '8px'
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 'auto' }}>
                <Button
                  variant='outlined'
                  startIcon={<FilterListIcon />}
                  endIcon={
                    <Badge
                      badgeContent={filterCount}
                      color='primary'
                      invisible={filterCount === 0}
                      sx={{ ml: 2, mr: 2 }}
                    />
                  }
                  sx={{
                    border: theme => `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: '8px',
                    height: '40px',

                    // textTransform: 'none',
                    width: { xs: '100%', md: 'auto' },
                    color: 'customColors.OnSurfaceVariant'
                  }}
                  onClick={handleFilterDrawer}
                >
                  Filter
                </Button>
              </Grid>
            </Grid>
          </Box>
          <Grid>
            <CommonTable
              columns={columns}
              indexedRows={indexedRows}
              total={total}
              onCellClick={handleStockRowClick}
              loading={loading}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              searchValue={searchValue}
              handleSortModel={handleSortModel}
              onPaginationModelChange={model => {
                setPaginationModel(model)
                router.replace({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    page: model.page + 1,
                    pageSize: model.pageSize,
                    searchValue,
                    sort,
                    sortColumn
                  }
                })
              }}
            />
          </Grid>
        </CardContent>
      </Card>
      {show && (
        <CommonDialogBox
          title={editProduct ? 'Edit Product Configuration' : 'Add Product Configuration'}
          dialogBoxStatus={show}
          formComponent={
            <AddMedicineDialog
              close={closeDialog}
              setDialogCheck={setDialogCheck}
              dialogCheck={dialogCheck}
              productData={editProduct}
              setProductData={setEditProduct}
              selectedPharmacy={selectedPharmacy}
            />
          }
          close={() => {
            setShow(false)
            setEditProduct(null)
          }}
          show={() => setShow(true)}
        />
      )}
      {openFilter && (
        <StockLocationFilter
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          tabsForFilter={tabsForFilter}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          tempSelectedItems={tempSelectedItems}
          setTempSelectedItems={setTempSelectedItems}
          openRackListDrawer={openRackListDrawer}
          setRackListDrawer={setRackListDrawer}
          items={items}
          setItems={setItems}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          shelvesData={shelvesData}
          setShelvesData={setShelvesData}
          selectedShelves={selectedShelves}
          setSelectedShelves={setSelectedShelves}
          applyFilterCheck={applyFilterCheck}
          setApplyFilterCheck={setApplyFilterCheck}
          onApplyFilter={newSelectedItems => {
            setSelectedItems(newSelectedItems)
            setApplyFilterCheck(true)
            setOpenFilter(false)
          }}
        />
      )}
      {openStockDetailDrawer && (
        <StockDetailDrawer
          openDrawer={openStockDetailDrawer}
          setOpenDrawer={setOpenStockDetailDrawer}
          stockDetail={configMed}
        />
      )}
    </>
  )
}

export default StockLocation
