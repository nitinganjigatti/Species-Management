import { TabContext, TabList, TabPanel } from '@mui/lab'
import {
  Autocomplete,
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
  TextField,
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
import NecropsySlider from 'src/views/pages/egg/eggs/nepocrspySlider'
import DiscardDetail from 'src/views/pages/egg/eggs/Discarded/DiscardDetail'
import DiscardDialogBox from 'src/views/pages/egg/eggs/Discarded/DiscardDialogBox'
import { GetNurseryList } from 'src/lib/api/egg/nursery'
import DiscardedTableView from 'src/views/pages/egg/eggs/Discarded/DiscardedTableView'
import CreateAnimalSlider from 'src/views/pages/egg/eggs/eggDetails/CreateAnimal'

const EggList = () => {
  const theme = useTheme()
  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)

  // const [sortColumning, setsortColumning] = useState('ingredient_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('eggs_received')

  const [isDiscarded, setIsDiscarded] = useState('eggs_ready_to_be_discarded_at_nursery')
  const [hover, setHover] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [allocationValues, setAllocationValues] = useState({})
  const [eggID, setEggId] = useState('')

  // const [allocateEggId, setAllocateEggId] = useState(null)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [openNepoFile, setOpenNepoFile] = useState(false)
  const [openDiscardDialog, setOpenDiscardDialog] = useState(false)
  const [selectionEggModel, setSelectionEggModel] = useState([])

  const [defaultNursery, setDefaultNursery] = useState(null)
  const [nurseryList, setNurseryList] = useState([])
  const [filterByNurseryId, setFilterByNurseryId] = useState('')

  const handleDiscard = (e, eggId) => {
    e.stopPropagation()
    setIsOpen(true)
    setEggId(eggId)
  }

  const NurseryList = async q => {
    try {
      const params = {
        // type: ['length', 'weight'],
        search: q,
        page: 1,
        limit: 50
      }
      await GetNurseryList({ params: params }).then(res => {
        setNurseryList(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    NurseryList()
  }, [])

  const searchNursery = useCallback(
    debounce(async q => {
      try {
        await NurseryList(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const columns = [
    {
      flex: 0.02,
      Width: 40,
      field: 'uid',
      headerName: 'SL ',
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
      flex: 0.15,
      minWidth: 10,
      field: 'egg_number',
      sortable: false,
      headerName: 'EGG NUMBER',
      align: 'center',
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

    {
      flex: 0.15,
      minWidth: 10,
      sortable: false,
      field: 'site',
      headerName: 'SITE NAME',

      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px',
            ml: 3
          }}
        >
          {params.row.site_name ? params.row.site_name : '-'}
        </Typography>
      )
    },

    // {
    //   flex: 0.15,
    //   minWidth: 20,
    //   sortable: false,
    //   field: 'lay_date',
    //   headerName: 'Lay Date',
    //   align: 'center',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.lay_date
    //         ? //  moment(params.row.lay_date).format('DD/MM/YYYY')
    //           params.row.lay_date
    //         : '-'}
    //     </Typography>
    //   )
    // },
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
    //   flex: 0.35,
    //   minWidth: 20,
    //   sortable: false,
    //   field: 'discard_status',
    //   headerName: 'DISCARD STATUS',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.discard_status ? (params.row.discard_status === '1' ? 'To Be Discard' : 'Discarded') : '-'}
    //     </Typography>
    //   )
    // },

    {
      flex: 0.16,
      minWidth: 10,
      sortable: false,
      field: 'collected_on',
      headerName: 'COLLECTED ON',

      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px',
            ml: 2
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
      flex: 0.3,
      minWidth: 20,
      sortable: false,
      field: 'collected_by',
      headerName: 'ADDED BY',
      renderCell: params => (
        <>
          {/* {status === 'eggs_received' && (
            <Button className='customButton' variant='contained' onClick={e => handleAction(e, params.row.id)}>
              Allocate{' '}
            </Button>
          )} */}
          {status === 'eggs_received' ? (
            <>
              <div>
                <DiscardStatusCell
                  customButton={status === 'eggs_received' ? 'customButton' : null}
                  hideField='hideField'
                  params={params}
                  setIsOpen={setIsOpen}
                  handleDiscard={handleDiscard}
                  setEggId={setEggId}
                  handleAction={handleAction}
                  setAllocationValues={setAllocationValues}

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

  const hatchedColumn = [
    {
      flex: 0.02,
      Width: 40,
      field: 'uid',
      headerName: 'SL ',
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
      flex: 0.15,
      minWidth: 10,
      field: 'egg_number',
      sortable: false,
      headerName: 'EGG NUMBER',
      align: 'center',
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
    {
      flex: 0.2,
      minWidth: 10,
      field: 'animal_id',
      sortable: false,
      headerName: 'Animal Id',

      renderCell: params => (
        <Box
          onClick={e => {
            setEggId(params.row.egg_id)
            e.stopPropagation()
            setOpenCreate(true)
          }}
          sx={{ ml: 2, display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}
        >
          {params.row.animal_id ? (
            <Typography
              style={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '16px',
                fontWeight: '500'

                // lineHeight: '19.36px'
              }}
            >
              {params.row.animal_id ? params.row.animal_id : '-'}
            </Typography>
          ) : (
            <Typography
              style={{
                color: theme.palette?.primary?.main,
                fontSize: '16px',
                fontWeight: '500'

                // lineHeight: '19.36px'
              }}
            >
              Create Animal ID
            </Typography>
          )}
        </Box>
      )
    },

    // {
    //   flex: 0.15,
    //   minWidth: 10,
    //   sortable: false,
    //   field: 'site',
    //   headerName: 'SITE NAME',

    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px',
    //         ml: 3
    //       }}
    //     >
    //       {params.row.site_name ? params.row.site_name : '-'}
    //     </Typography>
    //   )
    // },
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
    {
      flex: 0.16,
      minWidth: 10,
      sortable: false,
      field: 'collected_on',
      headerName: 'COLLECTED ON',

      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px',
            ml: 2
          }}
        >
          {params.row.collection_date ? moment(params.row.collection_date).format('DD/MM/YYYY') : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      sortable: false,
      field: 'collected_by',
      headerName: 'ADDED BY',
      renderCell: params => (
        <>
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
        </>
      )
    }
  ]

  const handleAction = (event, params) => {
    event.stopPropagation()
    setOpenDrawer(true)
    setAllocationValues(params?.row)
    setEggId(params?.row?.egg_id)
  }

  const onCellClick = (params, event) => {
    if (event.target.closest('.MuiDataGrid-checkboxInput')) {
      return // Do nothing if the click is on the checkbox
    }
    if (params) {
      const data = params.row

      Router.push({
        pathname: `/egg/eggs/${data?.id}`,

        query: { animal_id: data?.animal_id }
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
    setSelectionEggModel([])
  }

  const handleTabs = (event, newValue) => {
    setTotal(0)

    setIsDiscarded(newValue)
    setSelectionEggModel([])
  }

  const fetchTableData = useCallback(
    async (sort, q, status, isDiscarded, nurseryId) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          sorting_by_date: 'latest_date',

          // sortColumn,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,

          nursery_id: filterByNurseryId ? filterByNurseryId : nurseryId,

          // nursery_id: 55,
          type:
            status === undefined
              ? 'eggs_received'
              : status === 'eggs_ready_to_be_discarded_at_nursery'
              ? isDiscarded
              : status
        }

        await GetEggList({ params: params }).then(res => {
          // console.log('res :>> ', res)

          // let listWithId = res.data.result.map((el, i) => {
          //   return { ...el, uid: i + 1 }
          // })
          if (res.success) {
            setTotal(parseInt(res?.data?.total_count))
            setRows(loadServerRows(paginationModel.page, res.data.result))
          } else {
            setRows([])
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
    // debugger
    fetchTableData(sort, searchValue, status, isDiscarded, filterByNurseryId)
  }, [fetchTableData, status, isDiscarded, filterByNurseryId])

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
      <Box>
        <Autocomplete
          sx={{
            width: 250,
            m: 2,
            ml: 5
          }}
          name='nursery'
          value={defaultNursery}
          disablePortal
          id='nursery'
          options={nurseryList?.length > 0 ? nurseryList : []}
          getOptionLabel={option => option.nursery_name}
          isOptionEqualToValue={(option, value) => option.nursery_id === value.nursery_id}
          onChange={(e, val) => {
            if (val === null) {
              setDefaultNursery(null)

              // return onChange('')
            } else {
              setDefaultNursery(val)

              // setValue('room', '')
              setFilterByNurseryId(val.nursery_id)

              // return onChange(val.nursery_id)
            }
          }}
          renderInput={params => (
            <TextField
              onChange={e => {
                searchNursery(e.target.value)
              }}
              {...params}
              label='Select Nursery *'
              placeholder='Search & Select'
            />
          )}
        />
      </Box>
    </>
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, status, isDiscarded)
  }

  const handleSelectionModelChange = newSelectionModel => {
    setSelectionEggModel(newSelectionModel)
  }

  // const selectedRows = indexedRows?.filter(row => selectionModel.includes(row.id))

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <>
            {status === 'eggs_received' ||
            status === 'eggs_incubation' ||
            status === 'eggs_hatched' ||
            status === 'all' ||
            isDiscarded === 'eggs_discarded_at_nursery' ? (
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
                columns={status === 'eggs_hatched' ? hatchedColumn : columns}
                sortingMode='server'
                paginationMode='server'
                pageSizeOptions={[7, 10, 25, 50]}
                paginationModel={paginationModel}
                onSortModelChange={handleSortModel}
                slots={{ toolbar: ServerSideToolbarWithFilter }}
                onPaginationModelChange={setPaginationModel}
                loading={loading}
                rowHeight={72}
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
            ) : (
              isDiscarded === 'eggs_ready_to_be_discarded_at_nursery' && (
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
                    rowHeight={72}
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
                    checkboxSelection
                    onRowSelectionModelChange={handleSelectionModelChange}
                  />
                </Box>
              )
            )}
          </>
        )}
        {openDrawer && (
          <AllocationSlider
            callApi={fetchTableData}
            allocationValues={allocationValues}
            setOpenDrawer={setOpenDrawer}
            allocateEggId={eggID}
          />
        )}
        {openNepoFile && <NecropsySlider setOpenNepoFile={setOpenNepoFile} />}
      </>
    )
  }

  return (
    <Box>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography color='inherit' sx={{ cursor: 'pointer' }}>
          Egg
        </Typography>

        <Typography sx={{ cursor: 'pointer' }} color='text.primary'>
          Egg List
        </Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader title='Egg List' action={headerAction} />

        {/* <CardContent> */}
        <TabContext value={status}>
          <TabList onChange={handleChange} sx={{ px: 2 }}>
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
              value='eggs_ready_to_be_discarded_at_nursery'
              label={
                <TabBadge
                  label='Discarded'
                  totalCount={status === 'eggs_ready_to_be_discarded_at_nursery' ? total : null}
                />
              }
            />
            <Tab value='all' label={<TabBadge label='All' totalCount={status === 'all' ? total : null} />} />
          </TabList>
          <TabPanel value='eggs_received' sx={{ p: 0 }}>
            {' '}
            <Divider />
            {tableData()}
          </TabPanel>
          <TabPanel value='eggs_incubation' sx={{ p: 0 }}>
            {' '}
            <Divider />
            {tableData()}
          </TabPanel>
          <TabPanel value='eggs_hatched' sx={{ p: 0 }}>
            {' '}
            <Divider />
            {tableData()}
          </TabPanel>
          <TabPanel value='eggs_ready_to_be_discarded_at_nursery' sx={{ p: 0 }}>
            <Divider sx={{ mb: 3 }} />

            {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}> */}

            {/* </Box> */}
            <TabContext value={isDiscarded}>
              <TabList onChange={handleTabs} sx={{ px: 2 }}>
                <Tab
                  value='eggs_ready_to_be_discarded_at_nursery'
                  label={
                    <TabBadge
                      label='Ready to Discarded'
                      totalCount={isDiscarded === 'eggs_ready_to_be_discarded_at_nursery' ? total : null}
                    />
                  }
                ></Tab>
                <Tab
                  value='eggs_discarded'
                  label={
                    <TabBadge label='Discarded Batch' totalCount={isDiscarded === 'eggs_discarded' ? total : null} />
                  }
                />
                <Tab
                  value='eggs_discarded_at_nursery'
                  label={<TabBadge label='Discarded' totalCount={isDiscarded === 'discarded' ? total : null} />}
                />
              </TabList>
              <TabPanel value='eggs_ready_to_be_discarded_at_nursery' sx={{ p: 0 }}>
                {selectionEggModel?.length > 0 && (
                  <Box sx={{ display: 'flex', height: '32px', justifyContent: 'flex-end', mx: 5, mt: -10, mb: 2 }}>
                    <Button sx={{ p: 5 }} size='medium' variant='contained' onClick={() => setOpenDiscardDialog(true)}>
                      &nbsp;{selectionEggModel?.length}&nbsp;Discard
                    </Button>
                  </Box>
                )}
                {tableData()}
              </TabPanel>
              <TabPanel value='eggs_discarded' sx={{ p: 0 }}>
                {' '}
                <DiscardedTableView filterByNurseryId={filterByNurseryId} setTotal={setTotal} />
              </TabPanel>
              <TabPanel
                sx={{ p: 0 }}
                value='eggs_discarded_at_nursery'
                label={
                  <TabBadge label='Discarded' totalCount={isDiscarded === 'eggs_discarded_at_nursery' ? total : null} />
                }
              >
                {tableData()}
              </TabPanel>
            </TabContext>
          </TabPanel>
          <TabPanel value='all' sx={{ p: 0 }}>
            {' '}
            <Divider />
            {tableData()}
          </TabPanel>
        </TabContext>
        {/* </CardContent> */}
      </Card>

      {openCreate && (
        <CreateAnimalSlider
          openDrawer={openCreate}
          fetchTableData={fetchTableData}
          setOpenDrawer={setOpenCreate}
          eggId={eggID}
        />
      )}

      <DiscardForm callApi={fetchTableData} isOpen={isOpen} setIsOpen={setIsOpen} eggID={eggID} />
      <DiscardDialogBox
        openDiscardDialog={openDiscardDialog}
        setOpenDiscardDialog={setOpenDiscardDialog}
        selectionEggModel={selectionEggModel}
      />
    </Box>
  )
}

export default EggList
