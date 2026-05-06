import React, { useState, useEffect, useCallback } from 'react'

import FallbackSpinner from 'src/@core/components/spinner/index'

import { debounce } from 'lodash'
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** MUI Imports

import { Typography, Grid, Tooltip, Box, Chip, Tab } from '@mui/material'

// ** Icon Imports

import { useRouter } from 'next/router'
import Error404 from 'src/pages/404'
import { stocksAdjustedList } from 'src/lib/api/pharmacy/stockAdjustment'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Utility from 'src/utility'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import { useTheme } from '@emotion/react'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'
import { STOCK_ADJUSTMENT_REASON_TYPES } from 'src/constants/PharmacyConstants'
import LabelAndDescriptionWithElipsisModal from 'src/views/utility/LabelAndDescriptionWithElipsisModal'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'

const ListOfStockAdjusted = () => {
  const theme = useTheme()
  const router = useRouter()

  /***** Server side pagination */
  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  console.log(router.query)

  const [loader, setLoader] = useState(false)

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState(router.query.sort || 'desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'label')

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(router.query.reason || 'Missing stock')

  const handleChange = (event, newValue) => {
    setTotal(0)
    setSearchValue('')
    setStatus(newValue)
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const { selectedPharmacy } = usePharmacyContext()

  const fetchTableData = useCallback(
    async (sort, q, column, status) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          reason: status
        }

        await stocksAdjustedList({ params: params }).then(res => {
          if (res?.success === true && res?.data?.list_items?.length > 0) {
            setTotal(parseInt(res?.data?.total_count))
            setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
          } else {
            setTotal(0)
            setRows([])
          }
        })
        setLoading(false)
      } catch (error) {
        console.log('error', error)
        setTotal(0)
        setRows([])
        setLoading(false)
        setTotal(0)
        setRows([])
      }
    },
    [paginationModel]
  )
  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn, status)
    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel.page,
      limit: paginationModel.pageSize,
      reason: status
    })
  }, [selectedPharmacy.id, status, paginationModel.page, paginationModel.pageSize])

  // useEffect(() => {
  //   if (router.query.status) {
  //     setStatus(router.query.status)
  //   }
  // }, [router.query.status])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
      updateUrlParams({
        sort: newModel[0].sort,
        q: searchValue,
        column: newModel[0].field,
        page: paginationModel.page,
        limit: paginationModel.pageSize,
        reason: status
      })
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, status) => {
      setSearchValue(q)
      setPaginationModel({ page: 0, pageSize: 50 })

      try {
        await fetchTableData(sort, q, column, status)
        updateUrlParams({
          sort,
          q: q,
          column: sortColumn,
          page: paginationModel.page,
          limit: paginationModel.pageSize,
          reason: status
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  // const handleEdit = id => {
  //   Router.push({
  //     pathname: '/pharmacy/purchase/add-purchase/',
  //     query: { id: id, action: 'edit' }
  //   })
  // }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn, status)
  }

  const getLabelColor = params => {
    const { MISSED, EXPIRED } = STOCK_ADJUSTMENT_REASON_TYPES

    const reasonTextColor =
      params?.row?.reason === MISSED
        ? theme.palette.customColors.Error
        : params?.row?.reason === EXPIRED
        ? theme.palette.customColors.Antz_Body_Medium
        : theme.palette.customColors.Tertiary

    const reason = params?.row?.reason === MISSED ? 'Missing' : params?.row?.reason === EXPIRED ? 'Expired' : 'Damaged'

    return { reason, reasonTextColor }
  }

  const renderUserAvatar = row => {
    if (row.user_profile_pic) {
      return <CustomAvatar src={row?.user_profile_pic} sx={{ mr: 3, width: 34, height: 34 }} />
    } else {
      return <CustomAvatar sx={{ mr: 3, width: 34, height: 34, fontSize: '.8rem' }}></CustomAvatar>
    }
  }

  const columns = [
    {
      width: 80,
      headerName: 'SL.NO',
      renderCell: params => (
        <Box sx={{ display: 'flex' }}>
          <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px' }}>
            {parseInt(params.row.sl) + '.'}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.2,
      minWidth: 140,
      field: 'stock_name',
      headerName: 'Product',
      renderCell: params => (
        <Tooltip title={params.row.stock_name}>
          <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px' }} noWrap>
            {params.row.stock_name}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.1,
      minWidth: 100,
      field: 'batch_no',
      headerName: 'Batch No.',
      renderCell: params => (
        <Tooltip title={params.row.batch_no}>
          {' '}
          <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px' }} noWrap>
            {params.row.batch_no}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.1,
      minWidth: 100,
      field: 'adjustment_quantity',
      headerName: 'Qty',
      renderCell: params => (
        <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px' }} noWrap>
          {params.row.adjustment_quantity}
        </Typography>
      )
    },

    {
      flex: 0.15,
      minWidth: 140,
      field: 'reason_name',
      headerName: 'Reason',
      renderCell: params => {
        const { reason, reasonTextColor } = getLabelColor(params)

        return (
          <LabelAndDescriptionWithElipsisModal
            reason={reason}
            comment={params?.row?.comments}
            reasonTextColor={reasonTextColor}
            commentTextColor={theme.palette.customColors.neutral_50}
          />
        )
      }
    },
    {
      flex: 0.15,
      minWidth: 110,
      field: 'expiry_date',
      headerName: 'Expiry',
      renderCell: params => (
        <Typography noWrap sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px' }}>
          {params.row.expiry_date ? Utility.formatDisplayDate(params.row.expiry_date) : 'NA'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 160,
      field: 'created_by_user_name',
      headerName: 'Requested By',
      renderCell: params => (
        <>
          <UserAvatarDetails
            profile_image={params?.row?.user_profile_pic}
            user_name={params?.row?.created_by_user_name}
            date={params?.row?.adjusted_at}
          />
        </>
      )
    }
  ]

  const headerAction = (
    <AddButtonContained
      title='Add Stock Adjustment'
      action={() => router.push({ pathname: '/pharmacy/stocks-adjustments/add-stock-adjustment/' })}
      fullWidth='fullWidth'
      styles={{ margin: 0 }}
    />
  )

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  const tableData = () => {
    return (
      <PageCardLayout title={'Stock Adjustment List'} action={headerAction}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            width: { xs: '100%', sm: '300px' }
          }}
        >
          <MUISearch
            onChange={e => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
            placeholder='Search...'
            value={searchValue}
          />
        </Box>

        <Grid>
          <CommonTable
            onRowClick={''}
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
      </PageCardLayout>
    )
  }

  return (
    <Grid>
      {selectedPharmacy.permission.key === 'allow_full_access' ||
      selectedPharmacy.permission.stock_adjustment === 1 ||
      selectedPharmacy.permission.stock_adjustment === '1' ? (
        loader ? (
          <FallbackSpinner />
        ) : (
          <>
            <TabContext value={status}>
              <TabList onChange={handleChange}>
                <Tab
                  sx={{ ml: 3 }}
                  value='Missing stock'
                  label={<TabBadge label='Missing' totalCount={status === 'Missing stock' ? total : null} />}
                />

                <Tab
                  value='Expiry'
                  label={<TabBadge label='Expiry' totalCount={status === 'Expiry' ? total : null} />}
                />

                <Tab
                  value='Broken at pharmacy'
                  label={<TabBadge label='Broken' totalCount={status === 'Broken at pharmacy' ? total : null} />}
                />
              </TabList>
              <TabPanel value='Missing stock'>{tableData()}</TabPanel>
              <TabPanel value='Expiry'>{tableData()}</TabPanel>

              <TabPanel value='Broken at pharmacy'>{tableData()}</TabPanel>
            </TabContext>
          </>
        )
      ) : (
        <Error404 />
      )}
    </Grid>
  )
}

export default ListOfStockAdjusted
