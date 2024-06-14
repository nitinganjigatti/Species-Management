import { TabContext, TabList, TabPanel } from '@mui/lab'
import {
  Avatar,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  Link,
  Tab,
  Tooltip,
  Typography,
  debounce
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import React, { useCallback, useEffect, useState } from 'react'
import FallbackSpinner from 'src/@core/components/spinner'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import moment from 'moment'
import Router from 'next/router'
import AllocationSlider from 'src/views/pages/egg/eggs/allocationSlider'
import DiscardStatusCell from 'src/components/egg/DiscardStatusCell'
import { GetEggList, GetEggMaster } from 'src/lib/api/egg/egg'
import DiscardForm from 'src/components/egg/DiscardForm'
import { useMemo } from 'react'

const EggList = () => {
  const theme = useTheme()
  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')

  // const [sortColumning, setsortColumning] = useState('ingredient_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('eggs_received')
  const [isDiscarded, setIsDiscarded] = useState('eggs_to_discard')
  const [hover, setHover] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const [eggID, setEggId] = useState('')
  const [allocateEggId, setAllocateEggId] = useState(null)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [openNepoFile, setOpenNepoFile] = useState(false)
  console.log('isDiscarded :>> ', isDiscarded)


  const handleDiscard = e => {
    e.stopPropagation()
    setIsOpen(true)
    console.log('parent discard fn:>> ')
  }

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'uid',
      headerName: 'SL ',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,

            // fontSize: '12px',
            // fontWeight: '400',
            textAlign: 'center',
            ml: 3

            // lineHeight: '14.52px'
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 60,
      sortable: false,
      field: 'species',
      headerName: 'SPECIES',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            variant='rounded'
            alt='Medicine Image'
            sx={{
              width: 35,
              height: 35,
              mr: 4,
              borderRadius: '50%',
              background: '#E8F4F2',
              overflow: 'hidden'
            }}
          >
            {params.row.default_icon ? (
              <img style={{ width: '100%', height: '100%' }} src={params.row.default_icon} alt='Profile' />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Tooltip title={params.row.complete_name ? params.row.complete_name : '-'}>
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
                {params.row.complete_name ? params.row.complete_name : '-'}
              </Typography>
            </Tooltip>
            <Tooltip title={params.row?.default_common_name ? params.row?.default_common_name : '-'}>
              <Typography
                sx={{
                  color: theme.palette.primary.light,
                  fontSize: '14px',
                  fontWeight: '400',
                  lineHeight: '16.94px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%'
                }}
              >
                {params.row?.default_common_name ? params.row?.default_common_name : '-'}
              </Typography>
            </Tooltip>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'egg_number',
      sortable: false,
      headerName: 'EGG NUMBER',
      renderCell: params => (
        <Box sx={{}}>
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '500',
              lineHeight: '19.36px'
            }}
          >
            {params.row.egg_code ? params.row.egg_code : '-'}
          </Typography>{' '}
          <Typography
            sx={{
              color:
                params.row.egg_condition === 'Intact'
                  ? theme.palette.primary.main
                  : params.row.egg_condition === 'Rotten'
                  ? '#fa6140'
                  : params.row.egg_condition === 'Cracked'
                  ? '#fa6140'
                  : params.row.egg_condition === 'Broken'
                  ? '#fa6140'
                  : params.row.egg_condition === 'Hatched'
                  ? '#32bfdd'
                  : params.row.egg_condition === 'Thin-Shelled'
                  ? '#fa6140'
                  : null,
              fontSize: '14px',
              fontWeight: '500',
              px: 3,

              backgroundColor:
                params.row.egg_condition === 'Rotten'
                  ? '#FFD3D3'
                  : params.row.egg_condition === 'Cracked'
                  ? '#FFD3D3'
                  : params.row.egg_condition === 'Broken'
                  ? '#FFD3D3'
                  : params.row.egg_condition === 'Thin-Shelled'
                  ? '#FFD3D3'
                  : '#E1F9ED',

              textAlign: 'center',
              borderRadius: '4px'
            }}
          >
            {params.row.egg_condition ? params.row.egg_condition : '-'}
          </Typography>
        </Box>
      )
    },

    // {
    //   flex: 0.35,
    //   minWidth: 20,
    //   sortable: false,
    //   field: 'site',
    //   headerName: 'SITE NAME',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.site ? params.row.site : '-'}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.35,
      minWidth: 20,
      sortable: false,
      field: 'discard_status',
      headerName: 'DISCARD STATUS',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.discard_status ? (params.row.discard_status === '1' ? 'To Be Discard' : 'Discarded') : '-'}
        </Typography>
      )
    },

    // {
    //   flex: 0.35,
    //   minWidth: 20,
    //   sortable: false,
    //   field: 'discard_on',
    //   headerName: 'DISCARD ON',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.site ? params.row.site : '-'}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.24,
      minWidth: 20,
      sortable: false,
      field: 'collected_on',
      headerName: 'COLLECTED ON',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.collection_date ? moment(params.row.collection_date).format('DD/MM/YYYY') : '-'}
        </Typography>
      )
    },

    // {
    //   flex: 0.24,
    //   minWidth: 20,
    //   sortable: false,
    //   field: 'batch_no',
    //   headerName: 'BATCH NO',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.batch_no ? params.row.batch_no : '-'}
    //     </Typography>
    //   )
    // },

    {
      flex: 0.5,
      minWidth: 60,
      sortable: false,
      field: 'collected_by',
      headerName: 'ADDED BY',
      renderCell: params => (
        <>
          {status === 'eggs_received' && (
            <Button className='customButton' variant='contained' onClick={e => handleAction(e, params.row.id)}>
              Allocate{' '}
            </Button>
          )}
          {status === 'eggs_to_discard' || isDiscarded === 'eggs_discarded' ? (
            <>
              <div>
                <DiscardStatusCell
                  customButton={
                    status === 'eggs_to_discard' || isDiscarded === 'eggs_discarded' ? 'customButton' : null
                  }
                  hideField='hideField'
                  params={params}
                  setIsOpen={setIsOpen}
                  handleDiscard={handleDiscard}
                  setEggId={setEggId}

                  // hover={hover} setHover={setHover}
                />
              </div>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                variant='square'
                alt='Medicine Image'
                className={status === 'eggs_received' ? 'hideField' : ''}
                sx={{
                  width: 30,
                  height: 30,
                  mr: 4,
                  borderRadius: '50%',
                  background: '#E8F4F2',
                  overflow: 'hidden'
                }}
              >
                {params.row.user_profile_pic ? (
                  <img
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    src={params.row.user_profile_pic}
                    alt='Profile'
                  />
                ) : (
                  <Icon icon='mdi:user' />
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
                  {params.row.user_full_name ? params.row.user_full_name : '-'}
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
                  {params.row.created_at ? moment(params.row.created_at).format('DD/MM/YYYY') : '-'}
                </Typography>
              </Box>
            </Box>
          )}
        </>
      )
    }
  ]

  const handleAction = (event, id) => {
    event.stopPropagation()
    setOpenDrawer(true)
    setAllocateEggId(id)
  }

  const onCellClick = params => {
    // console.log(params, 'params')
    const clickedColumn = params.field !== 'switch'
    if (clickedColumn) {
      const data = params.row
      Router.push({
        pathname: `/egg/eggs/${data?.id}`

        // pathname: `/egg/eggs/6`
      })
    } else {
      return
    }
  }

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    setStatus(newValue)
  }

  const handleTabs = (event, newValue) => {
    setTotal(0)

    setIsDiscarded(newValue)
  }

  const fetchTableData = useCallback(
    async (sort, q, status, isDiscarded) => {
      console.log('status :>> ', status)

      try {
        setLoading(true)

        const params = {
          sort,
          q,

          // sortColumn,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          type: status === 'eggs_to_discard' ? isDiscarded : status
        }

        await GetEggList({ params: params }).then(res => {
          console.log('res :>> ', res)

          // let listWithId = res.data.result.map((el, i) => {
          //   return { ...el, uid: i + 1 }
          // })
          if (res.data.result.length > 0) {
            setTotal(parseInt(res?.data?.total_count))
            setRows(loadServerRows(paginationModel.page, res.data.result))
          }
        })
        setLoading(false)
      } catch (error) {
        console.log(error)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    fetchTableData(sort, searchValue, status, isDiscarded)
  }, [fetchTableData, status, isDiscarded])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.egg_id,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)

      // setsortColumning(newModel[0].field)

      // fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, status, isDiscarded) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, status, isDiscarded)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const headerAction = (
    <>
      <Box sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
        <Button sx={{ px: 7, py: 5 }} size='small' variant='contained'>
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; ADD New
        </Button>
      </Box>
    </>
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, status, isDiscarded)
  }

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
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
              rowCount={total}
              columns={columns}
              sortingMode='server'
              paginationMode='server'
              pageSizeOptions={[7, 10, 25, 50]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              slots={{ toolbar: ServerSideToolbarWithFilter }}
              onPaginationModelChange={setPaginationModel}
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
              onCellClick={onCellClick}
            />
          </Box>
        )}
        {openDrawer && <AllocationSlider setOpenDrawer={setOpenDrawer} allocateEggId={allocateEggId} />}
        {openNepoFile && <NecropsySlider setOpenNepoFile={setOpenNepoFile} />}
      </>
    )
  }

  return (
    <Box>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography color='inherit'>Egg</Typography>
        <Link underline='hover' color='text.primary' href='/egg/eggs'>
          Egg List
        </Link>
      </Breadcrumbs>
      <Card sx={{ px: 5, py: 3 }}>
        <CardHeader title='Egg List' action={headerAction} />
        <CardContent>
          <TabContext value={status}>
            <TabList onChange={handleChange}>
              <Tab
                value='eggs_received'
                label={<TabBadge label='Received' totalCount={status === 'eggs_received' ? total : null} />}
              />
              <Tab
                value='eggs_incubation'
                label={<TabBadge label='Incubation' totalCount={status === 'eggs_incubation' ? total : null} />}
              />
              <Tab
                value='eggs_hatched'
                label={<TabBadge label='Hatched' totalCount={status === 'eggs_hatched' ? total : null} />}
              />
              <Tab
                value='eggs_to_discard'
                label={<TabBadge label='Discarded' totalCount={status === 'eggs_to_discard' ? total : null} />}
              />
            </TabList>
            <TabPanel value='eggs_received'>
              {' '}
              <Divider sx={{ mt: -3 }} />
              {tableData()}
            </TabPanel>
            <TabPanel value='eggs_incubation'>
              {' '}
              <Divider sx={{ mt: -3 }} />
              {tableData()}
            </TabPanel>
            <TabPanel value='eggs_hatched'>
              {' '}
              <Divider sx={{ mt: -3 }} />
              {tableData()}
            </TabPanel>
            <TabPanel value='eggs_to_discard'>
              <Divider sx={{ mt: -3, mb: 3 }} />
              <TabContext value={isDiscarded}>
                <TabList onChange={handleTabs}>
                  <Tab
                    value='eggs_to_discard'
                    label={
                      <TabBadge label='To Be Discarded' totalCount={isDiscarded === 'eggs_to_discard' ? total : null} />
                    }
                  />
                  <Tab
                    value='eggs_discarded'
                    label={<TabBadge label='Discarded' totalCount={isDiscarded === 'eggs_discarded' ? total : null} />}
                  />
                </TabList>
                <TabPanel value='eggs_to_discard'>{tableData()}</TabPanel>
                <TabPanel value='eggs_discarded'>{tableData()}</TabPanel>
              </TabContext>
            </TabPanel>
          </TabContext>
        </CardContent>
      </Card>

      <DiscardForm isOpen={isOpen} setIsOpen={setIsOpen} eggID={eggID} />
    </Box>
  )
}

export default EggList
