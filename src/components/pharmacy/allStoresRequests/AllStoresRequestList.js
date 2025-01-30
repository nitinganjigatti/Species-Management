import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTheme } from '@emotion/react'
import { useRouter } from 'next/router'

import { debounce } from 'lodash'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import {
  Grid,
  Typography,
  CardHeader,
  Card,
  TextField,
  InputAdornment,
  IconButton,
  Drawer,
  Tab,
  Box
} from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import RenderUtility from 'src/utility/render'
import { getAllUniquePendingList, getRequestListsOfAllStores } from 'src/lib/api/pharmacy/storeWiseRequest'
import Error404 from 'src/pages/404'

import { TabContext, TabList, TabPanel } from '@mui/lab'
import { ExcelExportButton } from 'src/components/Buttons'
import MedicineCard from 'src/views/utility/MedicineCard'

const AllStoresRequestList = () => {
  const theme = useTheme()
  const router = useRouter()

  const scrollContainerRef = useRef(null)
  const currentPageRef = useRef(1)
  const isInitialLoadRef = useRef(true)
  const noDataRef = useRef(false)

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
      width: 100,
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
      width: 400,
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
      width: 300,

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
      width: 300,
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
  const [uniquePendingItems, setUniquePendingItems] = useState(0)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [excelLoader, setExcelLoader] = useState(false)

  const [page, setPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [uniquePendingData, setUniquePendingData] = useState([])
  const [totalUniqueItems, setTotalUniqueItems] = useState(0)
  const [noMoreData, setNoMoreData] = useState(false)

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

  const handleDrawerClose = () => {
    setIsDrawerOpen(false)

    // Resetting page and data when drawer is closed
    setPage(1)
    setTotalUniqueItems(0)
    setHasMore(true)
    setUniquePendingData([])
  }

  // Reset when tab changes
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
    async ({ stock_status, page, limit }) => {
      // Prevent API calls there's no data
      if (isLoadingMore || noDataRef.current) return

      setIsLoadingMore(true)
      try {
        const params = { stock_status, page, limit }
        const res = await getAllUniquePendingList({ params })

        if (res?.success && res?.data?.list_items?.length > 0) {
          const transformedData = res?.data?.list_items.map(item => ({
            name: item.stock_name,
            description: item.manufacturer,
            pending: item.total_pending_qty,
            icon: item.image
          }))

          setUniquePendingData(prevMedicines => {
            //  append new data
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
          // No data
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

  const [value, setValue] = useState('1')

  const handleChange = useCallback(
    (event, newValue) => {
      resetStates()
      setValue(newValue)

      let stockStatus = ''
      switch (newValue) {
        case '2':
          stockStatus = 'Available'
          break
        case '3':
          stockStatus = 'NotAvailable'
          break
        default:
          stockStatus = ''
      }

      fetchUniquePendingData({
        stock_status: stockStatus,
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
        let stockStatus = ''

        switch (value) {
          case '2':
            stockStatus = 'Available'
            break
          case '3':
            stockStatus = 'NotAvailable'
            break
        }

        currentPageRef.current = nextPage
        setPage(nextPage)

        fetchUniquePendingData({
          stock_status: stockStatus,
          page: nextPage,
          limit: 10
        })
      }
    },
    [isLoadingMore, hasMore, value, fetchUniquePendingData]
  )

  const handleButtonClick = useCallback(() => {
    setIsDrawerOpen(true)
    resetStates()
    fetchUniquePendingData({ stock_status: '', page: 1, limit: 10 })
  }, [resetStates, fetchUniquePendingData])

  // Reset scroll
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [value])

  // Render header section
  const renderHeader = title => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography sx={{ fontSize: '16px', fontWeight: 400, color: 'customColors.OnSurfaceVariant' }}>
        {`${title} - `}
        <Typography component='span' sx={{ fontWeight: 500, color: 'customColors.OnSurfaceVariant' }}>
          {totalUniqueItems}
        </Typography>
      </Typography>
      <ExcelExportButton
        action={() => {
          console.log('Download')
        }}
        loader={excelLoader}
        title='Download'
      />
    </Box>
  )

  // Render content
  const renderContent = title => {
    if (isLoadingMore && isInitialLoadRef.current) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )
    }

    return (
      <>
        {renderHeader(title)}
        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={2} direction='column'>
            {uniquePendingData.map((med, index) => (
              <Grid item xs={12} key={index}>
                <MedicineCard {...med} pendingColor={value === '2' ? 'customColors.Error' : 'customColors.Tertiary'} />
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
      </>
    )
  }

  return (
    <>
      {selectedPharmacy?.type === 'central' ? (
        <Card>
          <CardHeader
            title={
              <>
                {RenderUtility.pageTitle('Requests By Store')}
                <Typography
                  sx={{
                    color: theme.palette.primary.main,
                    fontSize: '14px',
                    fontWeight: 400,
                    fontFamily: 'Inter',
                    mt: 1,
                    ml: 1,
                    borderBottom: `1px solid ${theme.palette.primary.main}`,
                    display: 'inline-block',
                    cursor: 'pointer'
                  }}
                  onClick={handleButtonClick}
                >
                  {`Unique Pending Items - ${uniquePendingItems ? uniquePendingItems : 0}`}
                </Typography>
              </>
            }
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
              mt: 1,
              pb: 0
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

          <Drawer
            anchor='right'
            open={isDrawerOpen}
            onClose={handleDrawerClose}
            PaperProps={{
              sx: {
                width: {
                  xs: 560
                },
                backgroundColor: 'customColors.Background',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }
            }}
          >
            {/* Header Section */}
            <Box
              sx={{
                p: 3,
                position: 'sticky',
                top: 0,
                backgroundColor: 'customColors.OnPrimary',
                zIndex: 1,
                borderBottom: '1px solid #e0e0e0',
                px: 4
              }}
            >
              <Box display='flex' justifyContent='space-between' alignItems='center'>
                <Box display='flex' alignItems='center' gap={2}>
                  <Typography sx={{ fontSize: '20px', fontWeight: 500, color: 'customColors.OnSurfaceVariant' }}>
                    Unique Pending items
                  </Typography>
                </Box>
                <IconButton sx={{ color: 'customColors.OnSurfaceVariant' }} onClick={handleDrawerClose}>
                  <Icon icon='mdi:close' />
                </IconButton>
              </Box>
            </Box>

            {/* Tab List Section */}
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                backgroundColor: 'customColors.OnPrimary',
                borderBottom: '1px solid #e0e0e0'
              }}
            >
              {/* Wrap TabContext here */}
              <TabContext value={value}>
                <TabList
                  onChange={handleChange}
                  aria-label='simple tabs example'
                  sx={{
                    backgroundColor: 'customColors.OnPrimary',
                    color: 'customColors.neutralSecondary',
                    '& .MuiTabs-flexContainer': {
                      borderBottom: '1px solid',
                      borderColor: '#e0e0e0',
                      display: 'flex',
                      justifyContent: 'center'
                    }
                  }}
                >
                  <Tab value='1' label='All items' />
                  <Tab value='2' label='Available items' />
                  <Tab value='3' label='Not Available items' />
                </TabList>
              </TabContext>
            </Box>

            {/* Content Section - Allow scrolling here */}

            <Box
              ref={scrollContainerRef}
              sx={{
                flexGrow: 1,
                overflowY: 'auto',
                maxHeight: 'calc(100% - 20px)'
              }}
              onScroll={handleScroll}
            >
              <TabContext value={value}>
                <TabPanel value='1' sx={{ p: 4 }}>
                  {renderContent('All items')}
                </TabPanel>
                <TabPanel value='2' sx={{ p: 4 }}>
                  {renderContent('Available items')}
                </TabPanel>
                <TabPanel value='3' sx={{ p: 4 }}>
                  {renderContent('Not available items')}
                </TabPanel>
              </TabContext>
            </Box>
          </Drawer>
        </Card>
      ) : (
        <Error404></Error404>
      )}
    </>
  )
}

export default AllStoresRequestList
