import { Avatar, Box, Tooltip, Typography, debounce } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import React, { useCallback, useEffect, useState } from 'react'

import Icon from 'src/@core/components/icon'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { useTheme } from '@mui/material/styles'
import moment from 'moment'
import { DiscardedEggList } from 'src/lib/api/egg/discard'
import DiscardDetail from './DiscardDetail'
import Utility from 'src/utility'
import EggTableHeader from '../EggTableHeader'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'

const DiscardedTableView = ({
  tabValue,
  setFilterList,
  filterList,
  setSelectedFiltersOptions,
  selectedFiltersOptions,
  setTotal,
  selectedOptions,
  setSelectedOptions,
  setBatchList
}) => {
  const router = useRouter()
  const { search_value } = router.query
  const theme = useTheme()
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])

  const [totalpage, setTotalPage] = useState(0)
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [loading, setLoading] = useState(false)
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [eggDiscardedId, setEggDiscardedId] = useState('')
  const [searchQuery, setSearchQuery] = useState(search_value || '')

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async (sort, q, selectedFiltersOptions = {}) => {
      // console.log('selectedFiltersOptions discard :>> ', selectedFiltersOptions)

      // debugger
      try {
        setLoading(true)

        // Extracting IDs from selectedFiltersOptions, with a fallback to empty arrays
        const nurseryIds = selectedFiltersOptions?.Nursery?.map(option => option.id)

        // const eggStateIds = selectedFiltersOptions?.Stage?.map(option => option.id) || []
        const discardedByIds = selectedFiltersOptions['Discarded By']?.map(option => option.id) || []
        const activeStatus = selectedFiltersOptions['Security Check']?.map(option => option.id) || []

        const siteIds = selectedFiltersOptions?.Site?.map(option => option.id) || []

        // const statusId = selectedFiltersOptions?.status ? [selectedFiltersOptions.status] : []

        const discardedDate = selectedFiltersOptions?.collected_date
          ? dayjs(selectedFiltersOptions?.collected_date).format('YYYY-MM-DD')
          : ''

        const params = {
          sort,
          q,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          nursery_id: nurseryIds?.length > 0 ? JSON.stringify(nurseryIds) : '',

          // egg_state_id: eggStateIds,
          discarded_by: discardedByIds?.length > 0 ? JSON.stringify(discardedByIds) : '',
          site_id: siteIds?.length > 0 ? JSON.stringify(siteIds) : '',
          activity_status: activeStatus?.length > 0 ? JSON.stringify(activeStatus) : '',

          // egg_status_id: eggStateIds.length > 0 ? statusId : [],
          discarded_on: discardedDate ? discardedDate : ''
        }

        const res = await DiscardedEggList({ params })

        if (res.data.success) {
          setTotal(Number(res?.data?.data?.total_count))
          setTotalPage(Number(res?.data?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, res?.data?.data?.result))
          setBatchList(res?.data?.data?.result)
        } else {
          setRows([])
        }

        setLoading(false)
      } catch (error) {
        console.log(error)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    // debugger

    fetchTableData(sort, searchValue, selectedFiltersOptions)
  }, [fetchTableData, selectedFiltersOptions])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.egg_discard_id,
    sl_no: getSlNo(index)
  }))

  const searchTableData = useCallback(
    debounce(async (sort, q) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, selectedFiltersOptions)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    [fetchTableData, selectedFiltersOptions]
  )

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)

      // setsortColumning(newModel[0].field)

      // fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
    } else {
    }
  }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value)
  }

  const columns = [
    {
      width: 60,
      field: 'uid',
      headerName: 'NO',
      align: 'center',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '12px',
            fontWeight: '400',
            lineHeight: '14.52px'
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      width: 200,
      sortable: false,
      field: 'request_id_and_egg',
      headerName: 'Request ID & Eggs',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Box sx={{ p: '6px', height: '40px', width: '40px', borderRadius: '4px', bgcolor: '#EFF5F2' }}>
            <img style={{ width: '100%', height: '100%' }} src={'/icons/redEgg.png'} alt='Egg' />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '75%' }}>
            <Tooltip title={params.row.request_id ? params.row.request_id : '-'}>
              <Typography
                sx={{
                  color: theme.palette.primary.light,
                  fontSize: '16px',
                  fontWeight: '500',
                  lineHeight: '19.36px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%'
                }}
              >
                {params.row.request_id ? params.row.request_id : '-'}
              </Typography>
            </Tooltip>
            <Typography
              sx={{
                color: '#E93353',
                fontSize: '15px',
                fontWeight: '500',
                lineHeight: '16.94px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%'
              }}
            >
              {params.row?.egg_count ? params.row?.egg_count : '-'} {params.row?.egg_count > '1' ? 'Eggs' : 'Egg'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      width: 240,
      field: 'request_created_on',
      sortable: false,
      headerName: 'Request Created On',
      renderCell: params => (
        <Box sx={{ ml: 2, display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '500'

              // lineHeight: '19.36px'
            }}
          >
            {params.row.requested_on
              ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.requested_on))
              : '-'}{' '}
            |{' '}
            {params.row.requested_on
              ? Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(params.row.requested_on))
              : '-'}
          </Typography>{' '}
        </Box>
      )
    },

    {
      width: 180,
      sortable: false,
      field: 'nursery_name',
      headerName: 'Nursery',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.nursery_name ? params.row.nursery_name : '-'}
        </Typography>
      )
    },

    // {
    //   width: 10,
    //   sortable: false,
    //   field: 'collected_on',
    //   headerName: 'COLLECTED ON',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px',
    //         ml: 2
    //       }}
    //     >
    //       {params.row.collection_date ? moment(params.row.collection_date).format('DD/MM/YYYY') : '-'}
    //     </Typography>
    //   )
    // },
    {
      width: 220,
      sortable: false,
      field: 'created_by',
      headerName: 'Created By',
      renderCell: params => (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              variant='square'
              alt='Medicine Image'
              sx={{
                width: 30,
                height: 30,
                mr: 4,
                borderRadius: '50%',
                background: '#E8F4F2',
                overflow: 'hidden'
              }}
            >
              {params.row.requested_profile_pic ? (
                <img
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  src={params.row.requested_profile_pic}
                  alt='Profile'
                />
              ) : (
                <Icon icon='mdi:user' fontSize={30} />
              )}
            </Avatar>
            <Box
              sx={{ display: 'flex', flexDirection: 'column' }}
              className={status === 'eggs_received' ? 'hideField' : ''}
            >
              <Typography
                noWrap
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '16.94px'
                }}
              >
                {params.row.requested_name ? params.row.requested_name : '-'}
              </Typography>
              <Typography
                noWrap
                sx={{
                  color: theme.palette.customColors.neutralSecondary,
                  fontSize: '12px',
                  fontWeight: '400',
                  lineHeight: '14.52px'
                }}
              >
                {params.row.requested_on
                  ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.requested_on))
                  : '-'}{' '}
                |{' '}
                {params.row.requested_on
                  ? Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(params.row.requested_on))
                  : '-'}
              </Typography>
            </Box>
          </Box>
        </>
      )
    },
    {
      width: 220,
      sortable: false,
      field: 'security_check',
      headerName: 'Security Check',
      renderCell: params => (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {params.row.activity_status === 'COMPLETED' ? (
              <img
                style={{
                  width: '100%',
                  height: '100%',
                  maxWidth: '30px',
                  maxHeight: '30px',
                  objectFit: 'cover'
                }}
                src='/icons/security_check_icon.png'
                alt='Profile'
              />
            ) : (
              <img
                style={{
                  width: '100%',
                  height: '100%',
                  maxWidth: '26px',
                  maxHeight: '26px',
                  objectFit: 'cover',
                  marginLeft: 3
                }}
                src='/icons/pending_security_check_icon.png'
                alt='Profile'
              />
            )}
            {/* </Avatar> */}

            <Box sx={{ display: 'flex', flexDirection: 'column', m: 1 }}>
              {params.row.activity_status === 'DISCARD_REQUEST_GENERATED' ? (
                <Typography
                  noWrap
                  sx={{
                    color: '#FA6140',
                    fontSize: '16px',
                    fontWeight: '500',
                    ml: 0.5
                  }}
                >
                  {params.row.activity_status === 'DISCARD_REQUEST_GENERATED' ? 'Pending' : '-'}
                </Typography>
              ) : params.row.activity_status === 'COMPLETED' ? (
                <>
                  <Typography
                    noWrap
                    sx={{
                      color: theme.palette.primary.main,
                      fontSize: '16px',
                      fontWeight: '500',
                      lineHeight: '16.94px'
                    }}
                  >
                    Security Checked
                  </Typography>

                  <Typography
                    noWrap
                    sx={{
                      color: theme.palette.customColors.neutralSecondary,
                      fontSize: '12px',
                      fontWeight: '400',
                      lineHeight: '14.52px'
                    }}
                  >
                    {params.row.discarded_person_name ? params.row.discarded_person_name : '-'}
                  </Typography>
                </>
              ) : (
                params.row.activity_status === 'CANCELED' && (
                  <>
                    <Typography
                      noWrap
                      sx={{
                        color: '#FA6140',
                        fontSize: '16px',
                        fontWeight: '500',
                        lineHeight: '16.94px',
                        ml: 1
                      }}
                    >
                      Canceled
                    </Typography>

                    <Typography
                      noWrap
                      sx={{
                        color: theme.palette.customColors.neutralSecondary,
                        fontSize: '12px',
                        fontWeight: '400',
                        lineHeight: '14.52px',
                        ml: 1
                      }}
                    >
                      {params.row.commented_by ? params.row.commented_by : '-'}
                    </Typography>
                  </>
                )
              )}
            </Box>
          </Box>
        </>
      )
    }
  ]

  const onCellClick = (params, event) => {
    if (params) {
      const data = params.row
      setEggDiscardedId(params?.row?.egg_discard_id)

      setDetailDrawer(true)
    } else {
      return
    }
  }

  return (
    <Box>
      <EggTableHeader
        totalCount={totalpage}
        setFilterList={setFilterList}
        filterList={filterList}
        handleSearch={handleSearch}
        setSelectedFiltersOptions={setSelectedFiltersOptions}
        selectedFiltersOptions={selectedFiltersOptions}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedOptions={selectedOptions}
        setSelectedOptions={setSelectedOptions}
        data={rows}
      />
      <DataGrid
        sx={{
          '.MuiDataGrid-cell:focus': {
            outline: 'none'
          },
          '& .MuiDataGrid-row:hover': {
            cursor: 'pointer'
          },
          '& .MuiDataGrid-row:hover .customButton': {
            display: 'block'
          },
          '& .MuiDataGrid-row:hover .hideField': {
            display: 'none'
          },
          '& .MuiDataGrid-row .customButton': {
            display: 'none'
          },
          '& .MuiDataGrid-row .hideField': {
            display: 'block'
          }
        }}
        columnVisibilityModel={{
          sl_no: false
        }}
        hideFooterSelectedRowCount
        disableColumnSelector={true}
        autoHeight
        pagination
        rows={indexedRows === undefined ? [] : indexedRows}
        rowCount={totalpage}
        columns={columns}
        sortingMode='server'
        paginationMode='server'
        pageSizeOptions={[7, 10, 25, 50]}
        paginationModel={paginationModel}
        onSortModelChange={handleSortModel}
        // slots={{ toolbar: ServerSideToolbarWithFilter }}
        rowHeight={72}
        onPaginationModelChange={setPaginationModel}
        onCellClick={onCellClick}
        loading={loading}
        slotProps={{
          baseButton: {
            variant: 'outlined'
          },
          toolbar: {
            value: searchValue,
            clearSearch: () => handleSearch(''),
            onChange: event => handleSearch(event.target.value)
          }
        }}
      />
      <DiscardDetail
        setDetailDrawer={setDetailDrawer}
        detailDrawer={detailDrawer}
        eggDiscardedId={eggDiscardedId}
        fetchTableData={fetchTableData}
      />
    </Box>
  )
}

export default DiscardedTableView
