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

export default function ShipmentRequests() {
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
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

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
  const [sortColumn, setSortColumn] = useState(router.query.column || '')
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
      renderCell: params => <Box>{RenderUtility.getPriorityIcons(params.row?.priority)}</Box>
    },
    {
      width: 300,
      field: 'name',
      headerName: 'PRODUCT NAME',
      renderCell: params => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Tooltip title={params.row?.stock_name} placement='top'>
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
              {params.row?.stock_name}
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
      field: 'total_requests',
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
          {params.row.total_requests}
        </Typography>
      )
    },
    {
      width: 200,

      field: 'pending_qty',
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
          {params.row.pending_qty}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'requested_date',
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
          {Utility?.formatDisplayDate(params.row.requested_date)}
        </Typography>
      )
    }
  ]

  const fetchTableData = useCallback(
    async ({ sort, q, column }) => {
      try {
        setLoading(true)

        let params = {
          limit: paginationModel?.pageSize,
          page: paginationModel?.page + 1,
          q,
          sort,
          column
        }

        await getAllRequestsOfSelectedStore({ params: params }, id).then(res => {
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
    sl_no: getSlNo(index),
    id: getSlNo(index)
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
    <TabContext value={shipmentTab}>
      <TabLists
        onChange={(event, newValue) => {
          setShipmentTab(newValue)
        }}
        sx={{ width: '100%', height: '56px', py: '8px', gap: '6px', mt: 5 }}
      >
        <Tab
          value='Ready To Ship'
          label={<TabBadge label='Ready To Ship' totalCount={shipmentTab === 'Ready To Ship' ? 0 : null} />}
        />
        <Tab value='Shipped' label={<TabBadge label='Shipped' totalCount={shipmentTab === 'Shipped' ? 0 : null} />} />
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
        <Card sx={{ minWidth: '100%', ml: -2, boxShadow: 'none !important' }}></Card>
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
  )
}
