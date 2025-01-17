import React, { useState, useEffect, useCallback } from 'react'

import {
  Box,
  CardContent,
  CardHeader,
  Divider,
  Tooltip,
  Paper,
  Drawer,
  Avatar,
  Grid,
  Card,
  Button,
  Chip,
  TextField,
  Typography,
  InputAdornment,
  FormControl,
  FormControlLabel,
  MenuItem,
  Select,
  InputLabel
} from '@mui/material'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { styled } from '@mui/material/styles'
import MuiTabList from '@mui/lab/TabList'
import TableBasic from 'src/views/table/data-grid/TableBasic'
import { getMedicineList } from 'src/lib/api/pharmacy/getMedicineList'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { useRouter } from 'next/router'
import { debounce } from 'lodash'
import Utility from 'src/utility'
import RenderUtility from 'src/utility/render'

const RequestDetailsScreen = () => {
  const theme = useTheme()
  const router = useRouter()

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  // Styled TabList component
  const TabLists = styled(MuiTabList)(({ theme }) => ({
    '& .MuiTabs-indicator': {
      display: 'none'
    },
    '& .Mui-selected': {
      backgroundColor: theme.palette.customColors.OnSecondaryContainer,
      color: theme.palette.common.white
    },
    '& .MuiTab-root': {
      minHeight: 38,
      minWidth: 110,
      borderRadius: 8,
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(2)
    }
  }))
  const [requestItems, setRequestItems] = useState([])
  const [status, setStatus] = useState('Pending')
  const [detailsTab, setDetailsTab] = useState('Pending')
  const [shipmentTab, setShipmentTab] = useState('Ready To Ship')
  const { selectedPharmacy } = usePharmacyContext()

  // /***** Serverside pagination */

  const [total, setTotal] = useState(0)

  const [sort, setSort] = useState(router.query.sort || 'asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'name')
  const [loading, setLoading] = useState(false)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 10
  })
  function loadServerRows(currentPage, data) {
    return data
  }

  const columns = [
    {
      width: 80,
      field: 'id',
      headerName: 'SL NO ',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      width: 5,
      field: 'priority',
      headerName: '',
      headerAlign: 'left',
      textAlign: 'center',
      renderCell: params => <Box>{RenderUtility.getPriorityIcons('high')}</Box>
    },
    {
      width: 300,
      field: 'name',
      headerName: 'PRODUCT NAME',
      renderCell: params => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Tooltip title={params.row?.name} placement='top'>
            <Typography
              sx={{
                color: 'customColors.OnSecondaryContainer',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 500,
                fontSize: '14px',
                ...RenderUtility?.getEllipsisStyleForText()
              }}
            >
              {RenderUtility?.renderControlLabel(
                !isNaN(params.row?.control_substance) && parseInt(params.row?.control_substance) === 1,
                'CS'
              )}
              {RenderUtility?.renderControlLabel(
                !isNaN(params.row?.prescription_required) && parseInt(params.row?.prescription_required) === 1,
                'PR'
              )}
              {params.row?.name}
            </Typography>
          </Tooltip>
          <Tooltip
            title={`${params.row.package} of ${Utility.formatNumber(params.row.package_qty)}
        ${params.row.package_uom_label} ${params.row.product_form_label}`}
            placement='top'
          >
            <Typography
              sx={{
                color: 'customColors.neutralSecondary',
                alignItems: 'center',
                fontSize: '12px',
                fontWeight: 400,
                ...RenderUtility?.getEllipsisStyleForText()
              }}
            >
              {`${params.row.package} of ${Utility.formatNumber(params.row.package_qty)}
        ${params.row.package_uom_label} ${params.row.product_form_label}`}
            </Typography>
          </Tooltip>
        </Box>
      )
    },

    {
      width: 150,
      field: 'manufacturer_name',
      headerName: 'Total Requests',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          20
          {/* <span alt={params.row.manufacturer_name}>{params.row.manufacturer_name}</span> */}
        </Typography>
      )
    },

    {
      width: 200,

      // field: 'created_at',
      headerName: 'Pending Quantity',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          100{/* {params.row.stock_type} */}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'created_at',
      headerName: 'Earliest request date',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {Utility?.formatDisplayDate(params.row.created_at)}
        </Typography>
      )
    }
  ]

  const fetchTableData = useCallback(
    async ({ sort, q, column }) => {
      try {
        setLoading(true)

        let params = {
          sort,
          q,
          column,
          page: paginationModel?.page + 1,
          limit: paginationModel?.pageSize
        }

        await getMedicineList({ params: params }).then(res => {
          if (res?.success === true && res?.data?.list_items?.length > 0) {
            setTotal(parseInt(res?.data?.total_count))
            console.log('re', res?.data?.list_items)
            setRows(loadServerRows(paginationModel?.page, res?.data?.list_items))
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
    sl_no: getSlNo(index)
  }))

  useEffect(() => {
    fetchTableData({ sort, q: searchValue, column: sortColumn })
    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize
    })
  }, [fetchTableData])

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  return (
    <Grid container>
      <Card sx={{ mb: 6, width: '100%', boxShadow: 'none !important' }}>
        <CardHeader
          avatar={
            <Icon
              style={{ cursor: 'pointer' }}
              onClick={() => {
                // if (
                //   selectedPharmacy?.type === 'local' &&
                //   requestItems?.status === 'request' &&
                //   requestItems?.is_modified !== '1'
                // ) {
                //   Router.push('/pharmacy/request/request-list')
                // } else {
                router.back()

                // }
              }}
              icon='ep:back'
            />
          }
          title='Joy Local'

          // action={
          //   selectedPharmacy?.type === 'local' ? (
          //     <Button
          //       size='big'
          //       variant='contained'
          //       onClick={() => {
          //         // handleRequestEdit()
          //       }}
          //     >
          //       Edit
          //     </Button>
          //   ) : (
          //     <></>
          //   )
          // }
        />

        <Grid
          spacing={2}
          sx={{
            px: 6,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            mb: 4
          }}
        >
          {/* <TabContext value={status}>
            <TabList
              sx={{ borderBottom: `1px solid ${theme.palette.customColors.neutral05} !important` }}
              onChange={(event, newValue) => {
                setStatus(newValue)
              }}
            >
              <Tab
                value='Pending'
                label={<TabBadge label='Requested Items' totalCount={status === 'Pending' ? 0 : null} />}
              />
              <Tab value='Shipped' label={<TabBadge label='Shipment' totalCount={status === 'Shipped' ? 0 : null} />} />
            </TabList>
            <TabPanel value='Pending'>pending</TabPanel>
            <TabPanel value='Shipped'>Shipped</TabPanel>
          </TabContext> */}
          <TabContext value={detailsTab}>
            <TabList
              sx={{ borderBottom: `1px solid ${theme.palette.customColors.neutral05} !important` }}
              onChange={(event, newValue) => {
                setDetailsTab(newValue)
              }}
            >
              <Tab
                value='Pending'
                label={<TabBadge label='Requested Items' totalCount={status === 'Pending' ? 0 : null} />}
              />
              <Tab
                value='Shipped'
                label={
                  <TabBadge
                    label={selectedPharmacy?.type === 'local' ? 'Shipped' : 'Shipment'}
                    totalCount={status === 'Shipped' ? 0 : null}
                  />
                }
              />
            </TabList>
            {selectedPharmacy?.type === 'local' ? (
              <>
                <TabPanel
                  value='Pending'
                  sx={{
                    padding: '0 !important'
                  }}
                >
                  <Box sx={{ my: 5 }}>
                    <Box

                    // sx={{
                    //   display: 'flex',
                    //   flexDirection: { xs: 'column', md: 'row' },
                    //   justifyContent: { xs: 'center', md: 'space-between' },
                    //   alignItems: 'center',

                    //   margin:
                    //     selectedPharmacy?.type === 'local'
                    //       ? '1rem 1.375rem 0px 1.375rem'
                    //       : '0rem 1.375rem 0px 1.375rem',
                    //   gap: { xs: 2, md: 3 }
                    // }}
                    >
                      <Grid
                        container
                        spacing={2}
                        sx={{
                          display: 'flex',
                          flexWrap: { xs: 'wrap', md: 'nowrap' },
                          justifyContent: { xs: 'center', md: 'flex-end' },
                          alignItems: 'center'
                        }}
                      >
                        <Grid
                          item
                          xs={12}
                          md={2}
                          lg={2}
                          sx={{
                            // maxWidth: { xs: '100%', md: '250px' },
                            mt: { xs: 2, md: 0 },
                            height: '48px',
                            width: '100%'
                          }}
                        >
                          <FormControl fullWidth size='small'>
                            <InputLabel>Priority</InputLabel>
                            <Select
                              // eslint-disable-next-line lines-around-comment
                              // value={selectDays}
                              label='Priority'
                              onChange={e => {
                                // filterByDays(e.target.value)
                                // setSelectDays(e.target.value)
                              }}
                            >
                              <MenuItem value='all'>All</MenuItem>
                              <MenuItem value='3'>High</MenuItem>
                              <MenuItem value='7'>Normal</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3} lg={3}>
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
                                  <Icon
                                    icon='mi:search'
                                    fontSize={24}
                                    color={theme.palette.customColors.neutralSecondary}
                                  />
                                </InputAdornment>
                              )
                            }}
                            sx={{
                              borderRadius: '8px',
                              width: { xs: '100%', md: '290px' }
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <CommonTable
                      // eslint-disable-next-line lines-around-comment
                      // onRowClick={handleRowClick}
                      indexedRows={indexedRows}
                      total={total}
                      columns={columns}
                      paginationModel={paginationModel}
                      handleSortModel={handleSortModel}
                      setPaginationModel={setPaginationModel}
                      loading={loading}
                      searchValue={searchValue}
                    />
                  </Box>
                </TabPanel>
                <TabPanel
                  value='Shipped'
                  sx={{
                    padding: '0 !important'
                  }}
                >
                  <Box sx={{ my: 5 }}>
                    {requestItems?.length > 0 ? (
                      <>
                        <Card sx={{ mb: 6, minWidth: '100%', ml: -2, boxShadow: 'none !important' }}>
                          {/* <CardHeader title={`Shipments`}></CardHeader> */}
                          {/* <TableBasic
                            columns={shippedColumns}
                            rows={shippedItems}
                            onRowClick={e => {
                              setOrderId(e.id)
                              Router.push({
                                pathname: `/pharmacy/request/${id}/shipment-details`,
                                query: { orderId: e.id }
                              })
                            }}
                          ></TableBasic> */}
                        </Card>
                      </>
                    ) : null}
                  </Box>
                </TabPanel>
              </>
            ) : (
              <>
                <TabPanel
                  value='Pending'
                  sx={{
                    padding: '0 !important'
                  }}
                >
                  <Grid
                    sx={{
                      width: '100%',
                      px: '0 !important'
                    }}
                  >
                    <TabContext value={status}>
                      <TabLists
                        onChange={(event, newValue) => {
                          setStatus(newValue)
                        }}
                        sx={{ width: '100%', height: '56px', py: '8px', gap: '6px', mt: 5 }}
                      >
                        <Tab
                          value='Pending'
                          label={<TabBadge label='Pending' totalCount={status === 'Pending' ? 0 : null} />}
                        />
                        <Tab value='All' label={<TabBadge label='All' totalCount={status === 'All' ? 0 : null} />} />
                      </TabLists>
                      <TabPanel
                        value='Pending'
                        sx={{
                          padding: '0px !important'
                        }}
                      >
                        <CommonTable
                          // eslint-disable-next-line lines-around-comment
                          // onRowClick={handleRowClick}
                          indexedRows={indexedRows}
                          total={total}
                          columns={columns}
                          paginationModel={paginationModel}
                          handleSortModel={handleSortModel}
                          setPaginationModel={setPaginationModel}
                          loading={loading}
                          searchValue={searchValue}
                        />
                      </TabPanel>
                      <TabPanel
                        value='All'
                        sx={{
                          padding: '0px !important'
                        }}
                      >
                        <CommonTable
                          // eslint-disable-next-line lines-around-comment
                          // onRowClick={handleRowClick}
                          indexedRows={indexedRows}
                          total={total}
                          columns={columns}
                          paginationModel={paginationModel}
                          handleSortModel={handleSortModel}
                          setPaginationModel={setPaginationModel}
                          loading={loading}
                          searchValue={searchValue}
                        />
                      </TabPanel>
                    </TabContext>
                  </Grid>
                </TabPanel>
                <TabPanel
                  value='Shipped'
                  sx={{
                    padding: '0 !important'
                  }}
                >
                  <Grid
                    sx={{
                      width: '100%',
                      px: '0 !important'
                    }}
                  >
                    <TabContext value={shipmentTab}>
                      <TabLists
                        onChange={(event, newValue) => {
                          setShipmentTab(newValue)
                        }}
                        sx={{ width: '100%', height: '56px', py: '8px', gap: '6px', mt: 5 }}
                      >
                        <Tab
                          value='Ready To Ship'
                          label={
                            <TabBadge label='Ready To Ship' totalCount={shipmentTab === 'Ready To Ship' ? 0 : null} />
                          }
                        />
                        <Tab
                          value='Shipped'
                          label={<TabBadge label='Shipped' totalCount={shipmentTab === 'Shipped' ? 0 : null} />}
                        />
                        {(shipmentTab === 'Ready To Ship' && selectedPharmacy.permission.key === 'ADD') ||
                        selectedPharmacy.permission.key === 'allow_full_access' ? (
                          <Grid style={{ marginLeft: 'auto' }}>
                            <Button
                              size='big'
                              variant='contained'
                              onClick={() => {
                                // openShipDialog()
                                Router.push({
                                  pathname: `/pharmacy/request/${id}/ship-all-items`,
                                  query: {
                                    // orderId: e.id,
                                  }
                                })
                              }}
                            >
                              Ship All Items
                            </Button>
                          </Grid>
                        ) : null}
                      </TabLists>
                      <TabPanel
                        value='Ready To Ship'
                        sx={{
                          padding: '0px !important'
                        }}
                      >
                        {/* {dispatchedItems?.length > 0 && selectedPharmacy.type === 'central' && (

                        )} */}
                        <Card sx={{ minWidth: '100%', ml: -2, boxShadow: 'none !important' }}>
                          <CardHeader
                            title={``}

                            // action={
                            //   selectedPharmacy.permission.key === 'ADD' ||
                            //   selectedPharmacy.permission.key === 'allow_full_access' ? (
                            //     <Grid item xs={6} style={{ display: 'flex', justifyContent: 'right' }}>
                            //       <Button
                            //         size='big'
                            //         variant='contained'
                            //         onClick={() => {
                            //           // openShipDialog()
                            //           Router.push({
                            //             pathname: `/pharmacy/request/${id}/ship-all-items`,
                            //             query: {
                            //               // orderId: e.id,
                            //             }
                            //           })
                            //         }}
                            //       >
                            //         Ship All Items
                            //       </Button>
                            //     </Grid>
                            //   ) : null
                            // }
                          ></CardHeader>
                        </Card>
                      </TabPanel>
                      <TabPanel
                        value='Shipped'
                        sx={{
                          padding: '0px !important'
                        }}
                      >
                        <>
                          <Card sx={{ mb: 6, minWidth: '100%', ml: -2, boxShadow: 'none !important' }}></Card>
                        </>
                      </TabPanel>
                    </TabContext>
                  </Grid>
                </TabPanel>
              </>
            )}
          </TabContext>
        </Grid>
      </Card>
    </Grid>
  )
}

export default RequestDetailsScreen
