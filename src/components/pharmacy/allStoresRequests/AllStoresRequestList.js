import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTheme } from '@emotion/react'
import { useRouter } from 'next/router'

import { debounce } from 'lodash'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Grid, Typography, TextField, InputAdornment, IconButton, Drawer, Tab, Box, Button } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import RenderUtility from 'src/utility/render'
import { getAllUniquePendingList, getRequestListsOfAllStores } from 'src/lib/api/pharmacy/storeWiseRequest'
import Error404 from 'src/pages/404'

import { TabContext, TabList, TabPanel } from '@mui/lab'
import { ExcelExportButton } from 'src/components/Buttons'
import MedicineCard from 'src/views/utility/MedicineCard'
import Utility from 'src/utility'
import RequestDetailsScreen from './RequestDetailsScreen'
import RequestByProduct from 'src/pages/pharmacy/requests-by-product'
import { ExportButton } from 'src/views/utility/render-snippets'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import { all } from 'axios'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
const AllStoresRequestList = () => {
  const theme = useTheme()
  const router = useRouter()

  const scrollContainerRef = useRef(null)
  const currentPageRef = useRef(1)
  const isInitialLoadRef = useRef(true)
  const noDataRef = useRef(false)

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  }
  const { selectedPharmacy } = usePharmacyContext()

  const handleRowClick = params => {
    router.push({
      pathname: `/pharmacy/requests-by-store/${params?.row?.requested_store_id}`
    })
  }

  const columns = [
    {
      width: 100,
      field: 'id',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.neutralSecondary,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {parseInt(params.row.id) + '.'}
        </Typography>
      )
    },
    {
      flex: 1,
      minWidth: 200,
      field: 'store_name',
      headerName: 'Store Name',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500
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
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.Tertiary,
            fontSize: '14px',
            fontWeight: 500
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
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.Error,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.emergency_items}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'available_product_count',
      headerName: 'available product',
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params?.row?.available_product_count}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'not_available_product_count',
      headerName: 'not available product',
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params?.row?.not_available_product_count}
        </Typography>
      )
    }
  ]

  // /***** Serverside pagination */

  const [total, setTotal] = useState(0)

  const [sort, setSort] = useState(router.query.sort || 'desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'pending_items')

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })

  const [loading, setLoading] = useState(false)
  const [excelLoader, setExcelLoader] = useState(false)
  const [uniquePendingItems, setUniquePendingItems] = useState(0)
  const [activeTab, setActiveTab] = useState('Available')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [page, setPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [uniquePendingData, setUniquePendingData] = useState([])
  const [totalUniqueItems, setTotalUniqueItems] = useState(0)
  const [noMoreData, setNoMoreData] = useState(false)
  const [drawerSearchValue, setDrawerSearchValue] = useState('')
  const [exportStoresListLoader, setExportStoresListLoader] = useState(false)
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
          column,
          page: paginationModel?.page + 1,
          limit: paginationModel?.pageSize
        }
        await getRequestListsOfAllStores({ params: params }).then(res => {
          if (res?.success === true && res?.data?.list_stores?.length > 0) {
            setTotal(res?.data?.total_count)
            setUniquePendingItems(res?.data?.total_unique_items)
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
        console.error(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  const handleExport = async () => {
    try {
      setExportStoresListLoader(true)

      const params = {
        sort: sort,
        q: searchValue,
        column: sortColumn,
        page: 1,
        limit: total,
        response_type: 'csv'
      }
      const response = await getRequestListsOfAllStores({ params })
      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response.data)
      }
    } catch (error) {
      console.error('Error downloading Excel:', error)
    } finally {
      setExportStoresListLoader(false)
    }
  }

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

  const handleDrawerClose = () => {
    setIsDrawerOpen(false)
    setActiveTab('Available')
    setDrawerSearchValue('')

    setPage(1)
    setTotalUniqueItems(0)
    setHasMore(true)
    setUniquePendingData([])
  }

  const resetStates = useCallback(() => {
    setPage(1)
    currentPageRef.current = 1
    setHasMore(true)
    setNoMoreData(false)
    setUniquePendingData([])
    setTotalUniqueItems(0)
    setIsLoadingMore(false)
    isInitialLoadRef.current = true
    noDataRef.current = false
  }, [])

  const fetchUniquePendingData = useCallback(
    async ({ stock_status, page, limit, q }) => {
      if (isLoadingMore || noDataRef.current) return

      setIsLoadingMore(true)
      try {
        const params = {
          stock_status: stock_status === 'All' ? '' : stock_status,

          sort: 'asc',
          column: 'stock_name',
          page,
          limit,
          q
        }
        const res = await getAllUniquePendingList({ params })

        if (res?.success && res?.data?.list_items?.length > 0) {
          const transformedData = res?.data?.list_items.map(item => ({
            name: item.stock_name,
            description: item.manufacturer,
            pending: item.total_pending_qty,
            icon: item.image,
            control_substance: item.control_substance,
            controlled_substance: item.controlled_substance,
            prescription_required: item.prescription_required
          }))

          setUniquePendingData(prevMedicines => {
            return page === 1 ? transformedData : [...prevMedicines, ...transformedData]
          })

          setTotalUniqueItems(res?.data?.total_count)

          const totalItems = res?.data?.total_count
          const currentItems = (page === 1 ? 0 : uniquePendingData.length) + transformedData.length

          if (currentItems >= totalItems) {
            setHasMore(false)
            setNoMoreData(true)
          } else {
            setHasMore(true)
            setNoMoreData(false)
          }

          noDataRef.current = false
        } else {
          if (page === 1) {
            setUniquePendingData([])
            setTotalUniqueItems(0)
            noDataRef.current = true
          }
          setHasMore(false)
          setNoMoreData(true)
        }
      } catch (e) {
        console.error(e)
        setUniquePendingData([])
        setHasMore(false)
        setNoMoreData(true)
        noDataRef.current = true
      } finally {
        setIsLoadingMore(false)
        isInitialLoadRef.current = false
      }
    },
    [uniquePendingData, isLoadingMore]
  )

  const searchDrawerData = useCallback(
    debounce(async ({ stock_status, q }) => {
      resetStates()

      fetchUniquePendingData({
        stock_status,
        page: 1,
        limit: 10,
        q
      })
    }, 500),
    [resetStates, fetchUniquePendingData]
  )

  const handleChange = useCallback(
    (event, newValue) => {
      resetStates()
      setActiveTab(newValue)
      setDrawerSearchValue('')

      fetchUniquePendingData({
        stock_status: newValue,
        page: 1,
        limit: 10
      })
    },
    [resetStates, fetchUniquePendingData]
  )

  const handleScroll = useCallback(
    event => {
      if (!scrollContainerRef.current || isLoadingMore || !hasMore || noDataRef.current || isInitialLoadRef.current)
        return

      const { scrollTop, scrollHeight, clientHeight } = event.target
      const scrollThreshold = 50 // pixels from bottom
      const isNearBottom = scrollHeight - scrollTop <= clientHeight + scrollThreshold

      if (isNearBottom) {
        const nextPage = currentPageRef.current + 1

        currentPageRef.current = nextPage
        setPage(nextPage)

        fetchUniquePendingData({
          stock_status: activeTab,
          page: nextPage,
          limit: 10
        })
      }
    },
    [isLoadingMore, hasMore, activeTab, fetchUniquePendingData]
  )

  const handleButtonClick = useCallback(() => {
    setIsDrawerOpen(true)
    setActiveTab('Available')

    resetStates()
    fetchUniquePendingData({
      stock_status: activeTab,
      page: 1,
      limit: 10
    })
  }, [resetStates, fetchUniquePendingData, activeTab])

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [activeTab])

  const handleExcelExport = async title => {
    setExcelLoader(true)
    try {
      const params = {
        stock_status: activeTab === 'All' ? '' : activeTab,
        response_type: 'csv'
      }

      const response = await getAllUniquePendingList({ params })
      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response.data, title)
      }
    } catch (error) {
      console.error('Error downloading Excel:', error)
    } finally {
      setExcelLoader(false)
    }
  }

  const renderHeader = title => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: null, sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        mb: 3,
        gap: 2
      }}
    >
      <Typography sx={{ fontSize: '16px', fontWeight: 400, color: 'customColors.OnSurfaceVariant' }}>
        {`${title} - `}
        <Typography component='span' sx={{ fontWeight: 500, color: 'customColors.OnSurfaceVariant' }}>
          {totalUniqueItems}
        </Typography>
      </Typography>
      {/* <ExcelExportButton
        action={() => handleExcelExport(title)}
        loader={excelLoader}
        title='Download'
        sx={{
          width: { xs: '100%', sm: 'auto' },
          textAlign: 'center'
        }}
      /> */}
    </Box>
  )

  // Render content
  const renderContent = title => {
    // if (isLoadingMore && isInitialLoadRef.current) {
    //   return (
    //     <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
    //       <CircularProgress size={24} />
    //     </Box>
    //   )
    // }

    return (
      <>
        {renderHeader(title)}

        {isLoadingMore && isInitialLoadRef.current ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1 }}>
            <Grid
              container
              direction='column'
              sx={{
                gap: 1
              }}
            >
              {uniquePendingData.map((med, index) => (
                <Grid item size={{ xs: 12 }} key={index} sx={{ padding: 0, margin: 0 }}>
                  <MedicineCard
                    {...med}
                    pendingColor={activeTab === '2' ? 'customColors.Error' : 'customColors.Tertiary'}
                  />
                </Grid>
              ))}
            </Grid>
            {isLoadingMore && !isInitialLoadRef.current && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            {noMoreData && uniquePendingData.length > 0 && (
              <Typography sx={{ textAlign: 'center', mt: 2, color: 'customColors.neutralSecondary' }}>
                No more data to load
              </Typography>
            )}
            {noDataRef.current && (
              <Typography sx={{ textAlign: 'center', mt: 2, color: 'customColors.neutralSecondary' }}>
                No data available
              </Typography>
            )}
          </Box>
        )}
      </>
    )
  }

  return (
    <>
      {selectedPharmacy?.type === 'central' ? (
        <PageCardLayout
          title='Requests By Store'
          headerStyles={{
            paddingBottom: '0px'
          }}
          headerLayoutStyles={{
            display: 'flex',
            alignItems: 'flex-start'
          }}
          subtitle={`Unique Pending Items - ${uniquePendingItems ? uniquePendingItems : 0}`}
          onClickOfSubtitle={handleButtonClick}
          subtitleStyles={{
            display: 'inline',
            color: theme.palette.primary.main,
            fontSize: '14px',
            fontWeight: 400,
            borderBottom: `1px solid ${theme.palette.primary.main}`
          }}
          action={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 3, sm: 2 }
              }}
            >
              <MUISearch
                value={searchValue}
                onChange={e => handleSearch(e.target.value)}
                placeholder='Search...'
                onClear={() => handleSearch('')}
              />
              <ExportButton
                sx={{ height: '35px', display: 'flex', alignItems: 'center' }}
                loading={exportStoresListLoader}
                onClick={() => handleExport()}
              />
            </Box>
          }
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: { xs: 3, sm: 0 },
            '& .MuiCardHeader-action': {
              width: { xs: '100% ', sm: 'auto' }
            },
            pb: 0
          }}
        >
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
            maxHeight='60vh'
          />

          <Drawer
            anchor='right'
            open={isDrawerOpen}
            onClose={handleDrawerClose}
            slotProps={{
              paper: {
                sx: {
                  width: {
                    xs: '80%',
                    sm: '80%',
                    md: 560
                  },
                  backgroundColor: 'customColors.Background',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }
              }
            }}
          >
            <Box
              sx={{
                p: 3,
                position: 'sticky',
                top: 0,
                backgroundColor: 'customColors.OnPrimary',
                zIndex: 1,

                // borderBottom: '1px solid #e0e0e0',
                // borderBottom: `1px solid ${theme.palette.customColors.Background}`,
                px: 4,
                mb: 0.5
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  <Typography sx={{ fontSize: '20px', fontWeight: 500, color: 'customColors.OnSurfaceVariant' }}>
                    Unique Pending items
                  </Typography>
                </Box>
                <IconButton sx={{ color: 'customColors.OnSurfaceVariant' }} onClick={handleDrawerClose}>
                  <Icon icon='mdi:close' />
                </IconButton>
              </Box>
            </Box>

            <Box
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                backgroundColor: 'customColors.OnPrimary'
              }}
            >
              <TabContext value={activeTab}>
                <TabList
                  variant='scrollable'
                  allowScrollButtonsMobile
                  onChange={handleChange}
                  sx={{
                    backgroundColor: 'customColors.OnPrimary',
                    color: 'customColors.neutralSecondary',
                    '& .MuiTabs-flexContainer': {
                      borderBottom: '1px solid',
                      borderColor: '#e0e0e0',
                      // borderColor: 'customColors.grey',

                      // borderBottom: `1px solid ${theme.palette.customColors.neutralSecondary}`,
                      display: 'flex',

                      justifyContent: 'space-between'
                    }
                  }}
                >
                  <Tab value='Available' label='Available items' />
                  <Tab value='NotAvailable' label='Not Available items' />
                  <Tab value='All' label='All items' sx={{ width: '30%' }} />
                </TabList>
              </TabContext>
              <Box
                sx={{
                  mx: 'auto',
                  my: 4,
                  display: 'flex',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  width: '90%'
                }}
              >
                <TextField
                  variant='outlined'
                  size='small'
                  placeholder='Search...'
                  value={drawerSearchValue}
                  onChange={e => {
                    const value = e.target.value
                    setDrawerSearchValue(value)

                    // Use the debounced search function
                    searchDrawerData({
                      stock_status: activeTab,
                      q: value
                    })
                  }}
                  sx={{
                    borderRadius: '8px',
                    width: '90%'
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position='start'>
                          <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                        </InputAdornment>
                      )
                    }
                  }}
                />
                <Box sx={{ ml: 'auto' }}>
                  <ExportButton loading={excelLoader} onClick={() => handleExcelExport(activeTab)} />
                </Box>
              </Box>
            </Box>

            <Box
              ref={scrollContainerRef}
              sx={{
                flexGrow: 1,
                overflowY: 'auto',
                maxHeight: 'calc(100% - 20px)'
              }}
              onScroll={handleScroll}
            >
              <TabContext value={activeTab}>
                <TabPanel value='Available' sx={{ px: '24px' }}>
                  {renderContent('Available items')}
                </TabPanel>
                <TabPanel value='NotAvailable' sx={{ px: '24px' }}>
                  {renderContent('Not available items')}
                </TabPanel>
                <TabPanel value='All' sx={{ px: '24px' }}>
                  {renderContent('All items')}
                </TabPanel>
              </TabContext>
            </Box>
          </Drawer>
        </PageCardLayout>
      ) : (
        <Error404></Error404>
      )}
    </>
  )
}

export default AllStoresRequestList
