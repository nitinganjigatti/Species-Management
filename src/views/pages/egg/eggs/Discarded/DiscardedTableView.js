import { Avatar, Box, Tooltip, Typography, debounce } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import React, { useCallback, useEffect, useState } from 'react'

import Icon from 'src/@core/components/icon'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { useTheme } from '@mui/material/styles'
import moment from 'moment'
import { DiscardedEggList } from 'src/lib/api/egg/discard'
import DiscardDetail from './DiscardDetail'

const DiscardedTableView = ({ filterByNurseryId, setTotal }) => {
  const theme = useTheme()
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])

  const [totalpage, setTotalPage] = useState(0)
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [eggDiscardedId, setEggDiscardedId] = useState('')

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async (sort, q, nurseryId) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          nursery_id: nurseryId ? nurseryId : filterByNurseryId
        }

        const res = await DiscardedEggList({ params: params })

        // let listWithId = res.data.result.map((el, i) => {
        //   return { ...el, uid: i + 1 }
        // })

        if (res.data.success) {
          setTotal(Number(res?.data?.data?.total_count))
          setTotalPage(Number(res?.data?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, res?.data?.data?.result))
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

    fetchTableData(sort, searchValue, filterByNurseryId)
  }, [fetchTableData, filterByNurseryId])

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
        await fetchTableData(sort, q, filterByNurseryId)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
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
      flex: 0.02,
      Width: 40,
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
      flex: 0.25,
      minWidth: 60,
      sortable: false,
      field: 'request_id_and_egg',
      headerName: 'Request ID & Eggs',

      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Box sx={{ p: '6px', height: '40px', width: '40px', borderRadius: '4px', bgcolor: '#EFF5F2' }}>
            <img style={{ width: '100%', height: '100%' }} src={'/icons/redEgg.png'} alt='Egg' />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
              {params.row?.egg_count ? params.row?.egg_count : '-'} Eggs
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
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
              ? moment(moment.utc(params.row.requested_on).toDate().toLocaleString()).format('DD MMM YYYY')
              : '-'}{' '}
            |{' '}
            {params.row.requested_on
              ? moment(moment.utc(params.row.requested_on).toDate().toLocaleString()).format('hh:mm A')
              : '-'}
          </Typography>{' '}
        </Box>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
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
    //   flex: 0.2,
    //   minWidth: 10,
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
      flex: 0.3,
      minWidth: 20,
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
                {params.row.requested_on ? moment(params.row.requested_on).format('DD MMM YYYY') : '-'} |{' '}
                {params.row.requested_on ? moment(params.row.requested_on).format('HH : MM A') : '-'}
              </Typography>
            </Box>
          </Box>
        </>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      sortable: false,
      field: 'security_check',
      headerName: 'Security Check',
      renderCell: params => (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* <Avatar
              variant='square'
              alt='Icon Image'
              sx={{
                width: 30,
                height: 30,
                mr: 4,
                borderRadius: '50%',
                background: '#E8F4F2',
                overflow: 'hidden'
              }}
            > */}
            {params.row.activity_status === 'DISCARD_REQUEST_GENERATED' ? (
              <img
                style={{ width: '100%', height: '100%', maxWidth: '24px', maxHeight: '24px', objectFit: 'cover' }}
                src='/icons/pending_security_check_icon.png'
                alt='Profile'
              />
            ) : (
              <img
                style={{ width: '100%', height: '100%', maxWidth: '24px', maxHeight: '24px', objectFit: 'cover' }}
                src='/icons/security_check_icon.png'
                alt='Profile'
              />
            )}
            {/* </Avatar> */}

            <Box
              sx={{ display: 'flex', flexDirection: 'column', m: 1 }}
              className={status === 'eggs_received' ? 'hideField' : ''}
            >
              {params.row.activity_status === 'DISCARD_REQUEST_GENERATED' ? (
                <Typography
                  noWrap
                  sx={{
                    color: '#FA6140',

                    fontSize: '16px',
                    fontWeight: '500',
                    lineHeight: '16.94px'
                  }}
                >
                  {params.row.activity_status === 'DISCARD_REQUEST_GENERATED' ? 'Pending' : '-'}
                </Typography>
              ) : (
                <>
                  <Typography
                    noWrap
                    sx={{
                      color: theme.palette.primary.main,
                      fontSize: '14px',
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
                    {params.row.created_at ? moment(params.row.created_at).format('DD MMM YYYY') : '-'}
                  </Typography>
                </>
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
        slots={{ toolbar: ServerSideToolbarWithFilter }}
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
