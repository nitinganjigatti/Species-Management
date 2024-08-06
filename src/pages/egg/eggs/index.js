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
  Stack,
  Tab,
  TextField,
  Tooltip,
  Typography,
  debounce
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import React, { useCallback, useEffect, useState, useContext } from 'react'
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
import NecropsySlider from 'src/views/pages/egg/eggs/nepocrspySlider'
import DiscardDetail from 'src/views/pages/egg/eggs/Discarded/DiscardDetail'
import DiscardDialogBox from 'src/views/pages/egg/eggs/Discarded/DiscardDialogBox'
import { GetNurseryList } from 'src/lib/api/egg/nursery'
import DiscardedTableView from 'src/views/pages/egg/eggs/Discarded/DiscardedTableView'
import CreateAnimalSlider from 'src/views/pages/egg/eggs/eggDetails/CreateAnimal'
import { useEggContext } from 'src/context/EggContext'
import { AuthContext } from 'src/context/AuthContext'
import ErrorScreen from 'src/pages/Error'
import Utility from 'src/utility'
import { useRouter } from 'next/router'

const EggList = () => {
  const theme = useTheme()
  const router = useRouter()

  const { selected_nursery_id, tab_Value, subTab_value, page_value, search_value, selected_nursery_name } = router.query

  const { selectedEggTab, setSelectedEggTab, subTab, setSubTab } = useEggContext()

  // console.log('selectedEggTab :>> ', selectedEggTab)

  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(search_value ? search_value : '')
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)

  // const [sortColumning, setsortColumning] = useState('ingredient_name')
  const [paginationModel, setPaginationModel] = useState({ page: page_value ? page_value : 0, pageSize: 10 })

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(tab_Value ? tab_Value : 'eggs_received')

  const [isDiscarded, setIsDiscarded] = useState(subTab_value ? subTab_value : 'eggs_ready_to_be_discarded_at_nursery')
  const [hover, setHover] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [allocationValues, setAllocationValues] = useState({})
  const [eggID, setEggId] = useState('')

  // const [allocateEggId, setAllocateEggId] = useState(null)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [openNecropsy, setOpenNecropsy] = useState(false)
  const [openDiscardDialog, setOpenDiscardDialog] = useState(false)
  const [selectionEggModel, setSelectionEggModel] = useState([])

  const [defaultNursery, setDefaultNursery] = useState(
    selected_nursery_id && selected_nursery_name
      ? { nursery_id: selected_nursery_id, nursery_name: selected_nursery_name }
      : null
  )
  const [nurseryList, setNurseryList] = useState([])
  const [filterByNurseryId, setFilterByNurseryId] = useState('')
  const [nursery_name, setNursery_name] = useState('')

  const authData = useContext(AuthContext)
  const egg_collection_permission = authData?.userData?.roles?.settings?.enable_egg_collection_module

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
    if (egg_collection_permission) {
      NurseryList()
    }
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

      // minWidth: 60,
      sortable: false,
      field: 'species',
      headerName: 'SPECIES',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar
            variant='rounded'
            alt='Medicine Image'
            sx={{
              width: 35,
              height: 35,

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

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '70%',
              alignItems: params.row?.default_common_name && params.row?.complete_name ? 'flex-start' : 'center',
              gap: '4px'
            }}
          >
            {params.row?.default_common_name && params.row?.complete_name ? (
              <>
                <Tooltip title={params.row.default_common_name}>
                  <Typography
                    sx={{
                      color: theme.palette.primary.light,
                      fontSize: '16px',
                      fontWeight: '500',
                      lineHeight: '19.36px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {params.row.default_common_name}
                  </Typography>
                </Tooltip>
                <Tooltip title={params.row.complete_name}>
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
                    {params.row.complete_name}
                  </Typography>
                </Tooltip>
              </>
            ) : (
              <Typography
                sx={{
                  color: theme.palette.primary.light,
                  fontSize: '16px',
                  fontWeight: '500',
                  lineHeight: '19.36px'
                }}
              >
                {params.row?.default_common_name || params.row?.complete_name
                  ? params.row?.default_common_name || params.row?.complete_name
                  : '-'}
              </Typography>
            )}
          </Box>
        </Box>
      )
    },
    {
      width: 160,
      field: 'egg_number',
      sortable: false,
      headerName: 'EGG NUMBER',
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
      width: 160,
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
    // width: 140,
    //   sortable: false,
    //   field: 'lay_date',
    //   headerName: 'Lay Date',
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
      width: 160,
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
    //  width: 140,
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
      width: 150,
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
          {params.row.collection_date
            ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.collection_date))
            : '-'}
        </Typography>
      )
    },

    // {
    //   width: 140,
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
      width: 270,
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar
                variant='square'
                alt='Medicine Image'
                className={status === 'eggs_received' ? 'hideField' : ''}
                sx={{
                  width: 30,
                  height: 30,

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
                  {params.row.created_at
                    ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.created_at))
                    : '-'}
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
      width: 240,
      sortable: false,
      field: 'species',
      headerName: 'SPECIES',

      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar
            variant='rounded'
            alt='Medicine Image'
            sx={{
              width: 35,
              height: 35,

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

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '70%',
              alignItems: params.row?.default_common_name && params.row?.complete_name ? 'flex-start' : 'center',
              gap: '4px'
            }}
          >
            {params.row?.default_common_name && params.row?.complete_name ? (
              <>
                <Tooltip title={params.row.default_common_name}>
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
                    {params.row.default_common_name}
                  </Typography>
                </Tooltip>
                <Tooltip title={params.row.complete_name}>
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
                    {params.row.complete_name}
                  </Typography>
                </Tooltip>
              </>
            ) : (
              <Typography
                sx={{
                  color: theme.palette.primary.light,
                  fontSize: '16px',
                  fontWeight: '500',
                  lineHeight: '19.36px'
                }}
              >
                {params.row?.default_common_name || params.row?.complete_name
                  ? params.row?.default_common_name || params.row?.complete_name
                  : '-'}
              </Typography>
            )}
          </Box>
        </Box>
      )
    },
    {
      width: 140,
      field: 'egg_number',
      sortable: false,
      headerName: 'EGG NUMBER',
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
      width: 160,
      field: 'animal_id',
      sortable: false,
      headerName: 'Animal Id',
      renderCell: params => (
        <Box sx={{ ml: 2, display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
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
              onClick={e => {
                setEggId(params.row.egg_id)
                e.stopPropagation()
                setOpenCreate(true)
              }}
            >
              Create Animal ID
            </Typography>
          )}
        </Box>
      )
    },

    // {
    //   width: 10,
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
      width: 170,
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
      width: 160,
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
          {params.row.collection_date
            ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.collection_date))
            : '-'}
        </Typography>
      )
    },
    {
      width: 200,
      sortable: false,
      field: 'collected_by',
      headerName: 'ADDED BY',
      renderCell: params => (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar
              variant='square'
              alt='Medicine Image'
              className={status === 'eggs_received' ? 'hideField' : ''}
              sx={{
                width: 30,
                height: 30,

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
                {params.row.created_at
                  ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.created_at))
                  : '-'}
              </Typography>
            </Box>
          </Box>
        </>
      )
    }
  ]

  const incubationColumns = [
    {
      width: 60,
      field: 'uid',
      headerName: 'NO',
      align: 'center',
      sortable: false,

      // cellClassName: 'sticky-cell-first',
      // headerClassName: 'sticky-header-first',

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
      field: 'egg_number',
      sortable: false,
      headerName: 'EGG NUMBER',

      // cellClassName: 'sticky-cell-second',
      // headerClassName: 'sticky-header-second',

      renderCell: params => (
        <Stack direction='row' gap={'8px'} alignItems={'center'}>
          <Box sx={{ width: '44px', height: '44px' }}>
            <img src='/icons/Egg_img.png' alt='Egg' style={{ width: '100%', height: '100%' }} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography
              style={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              {params.row.egg_code ? params.row.egg_code : '-'}
            </Typography>
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
        </Stack>
      )
    },
    {
      // flex: 0.25,
      width: 220,
      sortable: false,
      field: 'species',
      headerName: 'SPECIES',

      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar
            variant='rounded'
            alt='Medicine Image'
            sx={{
              width: 35,
              height: 35,

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

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: params.row?.default_common_name && params.row?.complete_name ? 'flex-start' : 'center',
              gap: '4px'
            }}
          >
            {params.row?.default_common_name && params.row?.complete_name ? (
              <>
                <Tooltip title={params.row.default_common_name}>
                  <Typography
                    sx={{
                      color: theme.palette.primary.light,
                      fontSize: '16px',
                      fontWeight: '500',
                      lineHeight: '19.36px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {params.row.default_common_name}
                  </Typography>
                </Tooltip>
                <Tooltip title={params.row.complete_name}>
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
                    {params.row.complete_name}
                  </Typography>
                </Tooltip>
              </>
            ) : (
              <Typography
                sx={{
                  color: theme.palette.primary.light,
                  fontSize: '16px',
                  fontWeight: '500',
                  lineHeight: '19.36px'
                }}
              >
                {params.row?.default_common_name || params.row?.complete_name
                  ? params.row?.default_common_name || params.row?.complete_name
                  : '-'}
              </Typography>
            )}
          </Box>
        </Box>
      )
    },
    {
      // flex: 0.15,
      width: 200,
      sortable: false,
      field: 'stage',
      headerName: 'Stage',

      // align: 'center',
      renderCell: params => (
        <Tooltip title={params.row?.egg_state ? params.row?.egg_state : '-'}>
          <Typography
            sx={{
              color: theme.palette.primary.dark,
              fontSize: '16px',
              fontWeight: '500',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {params.row.egg_state ? params.row.egg_state : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      // flex: 0.15,
      width: 130,
      sortable: false,
      field: 'condition',
      headerName: 'condition',

      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.primary.dark,
            fontSize: '16px',
            fontWeight: '500',
            lineHeight: '19.36px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {params.row.egg_initial_temperature ? params.row.egg_initial_temperature : '-'}
        </Typography>
      )
    },

    {
      // flex: 0.15,
      width: 150,
      sortable: false,
      field: 'current_weight',
      headerName: 'current weight',
      align: 'center',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.current_weight ? params.row.current_weight : '-'}
        </Typography>
      )
    },
    {
      // flex: 0.15,
      width: 130,
      sortable: false,
      field: 'initial_size',
      headerName: 'Initial Size',
      align: 'center',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.initial_length ? params.row.initial_length : '-'}
        </Typography>
      )
    },
    {
      // flex: 0.15,
      width: 150,
      sortable: false,
      field: 'initial_weight',
      headerName: 'Initial weight',
      align: 'center',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.initial_weight ? params.row.initial_weight : '-'}
        </Typography>
      )
    },
    {
      // flex: 0.15,
      width: 100,
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
    {
      // flex: 0.15,
      width: 150,
      sortable: false,
      field: 'nursery_name',
      headerName: 'Nursery NAME',
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
          {params.row.nursery_name ? params.row.nursery_name : '-'}
        </Typography>
      )
    },
    {
      // flex: 0.15,
      width: 130,
      sortable: false,
      field: 'enclosure_id',
      headerName: 'Enclosure',

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
          {params.row.enclosure_id ? params.row.enclosure_id : '-'}
        </Typography>
      )
    },
    {
      // flex: 0.16,
      width: 130,
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
          {params.row.collection_date
            ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.collection_date))
            : '-'}
        </Typography>
      )
    },

    {
      // flex: 0.3,
      width: 200,
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar
                variant='square'
                alt='Medicine Image'
                className={status === 'eggs_received' ? 'hideField' : ''}
                sx={{
                  width: 30,
                  height: 30,

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
                  {params.row.created_at
                    ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.created_at))
                    : '-'}
                </Typography>
              </Box>
            </Box>
          )}
        </>
      )
    }
  ]

  const discarded_Egg_Columns = [
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
      field: 'species',
      headerName: 'SPECIES',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar
            variant='rounded'
            alt='Medicine Image'
            sx={{
              width: 35,
              height: 35,
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

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '80%',
              alignItems: params.row?.default_common_name && params.row?.complete_name ? 'flex-start' : 'center',
              gap: '4px'
            }}
          >
            {params.row?.default_common_name && params.row?.complete_name ? (
              <>
                <Tooltip title={params.row.default_common_name}>
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
                    {params.row.default_common_name}
                  </Typography>
                </Tooltip>
                <Tooltip title={params.row.complete_name}>
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
                    {params.row.complete_name}
                  </Typography>
                </Tooltip>
              </>
            ) : (
              <Typography
                sx={{
                  color: theme.palette.primary.light,
                  fontSize: '16px',
                  fontWeight: '500',
                  lineHeight: '19.36px'
                }}
              >
                {params.row?.default_common_name || params.row?.complete_name
                  ? params.row?.default_common_name || params.row?.complete_name
                  : '-'}
              </Typography>
            )}
          </Box>
        </Box>
      )
    },
    {
      width: 160,
      field: 'egg_number',
      sortable: false,
      headerName: 'EGG NUMBER',
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
      width: 160,
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
          {params.row.collection_date ? Utility.formatDisplayDate(params.row.collection_date) : '-'}
        </Typography>
      )
    },

    {
      width: 140,
      sortable: false,
      field: 'sample_taken',
      headerName: 'Sample Taken',
      renderCell: params => (
        <>
          {params.row.necropsy_file_uploaded === '0' ? (
            <Typography
              sx={{
                // color: theme.palette.primary.dark,
                fontSize: '16px',
                fontWeight: '500',
                lineHeight: '19.36px'
              }}
            >
              {params.row.is_necropsy_needed === '1' ? 'Not Yet' : 'NA'}
            </Typography>
          ) : (
            <Typography
              sx={{
                color: theme.palette.primary.dark,
                fontSize: '16px',
                fontWeight: '500',
                lineHeight: '19.36px'
              }}
            >
              {params.row.is_sample_collected === '1' ? 'Taken' : 'NA'}
            </Typography>
          )}
        </>
      )
    },
    {
      width: 170,
      sortable: false,
      field: 'necropsy_report',
      headerName: 'NECROPSY REPORT',
      align: 'left',
      renderCell: params => (
        <>
          {params.row.necropsy_file_uploaded === '1' ? (
            <Typography sx={{ fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 2 }}>
              Yes <Icon icon='pepicons-pencil:file' fontSize={'24px'} />
            </Typography>
          ) : params.row.is_necropsy_needed === '1' ? (
            <Button sx={{ color: '#00AFD6', ml: -3 }} onClick={e => handleOpenNecropsy(e, params)}>
              Attach File
            </Button>
          ) : (
            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '16px',
                fontWeight: '400',
                lineHeight: '19.36px'
              }}
            >
              NA
            </Typography>
          )}
        </>
      )
    },

    {
      width: 200,
      sortable: false,
      field: 'collected_by',
      headerName: 'ADDED BY',
      renderCell: params => (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar
              variant='square'
              alt='Medicine Image'
              className={status === 'eggs_received' ? 'hideField' : ''}
              sx={{
                width: 30,
                height: 30,

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
                {params.row.created_at
                  ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.created_at))
                  : '-'}
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

      const values = {
        tab_Value: status,
        subTab_value: isDiscarded,
        page_value: paginationModel?.page,
        search_value: searchValue,
        selected_nursery_id: filterByNurseryId ? filterByNurseryId : '',
        selected_nursery_name: nursery_name ? nursery_name : ''
      }
      console.log('values :>> ', values)

      Router.push({
        pathname: `/egg/eggs/${data?.id}`,

        query: {
          ...values
        }
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
    setSelectedEggTab(newValue)
    setSearchValue('')
  }

  const handleTabs = (event, newValue) => {
    setTotal(0)
    setSearchValue('')
    setIsDiscarded(newValue)
    setSubTab(newValue)
  }

  const fetchTableData = useCallback(
    async (sort, search, statusRecived, discardedTab, nurseryId) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q: search_value ? search_value : search,
          sorting_by_date: 'latest_date',

          // sortColumn,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,

          nursery_id: selected_nursery_id ? selected_nursery_id : nurseryId ? nurseryId : '',

          // nursery_id: 55,
          type:
            statusRecived === undefined
              ? isDiscarded
                ? isDiscarded
                : status
              : statusRecived === 'eggs_ready_to_be_discarded_at_nursery'
              ? discardedTab
              : statusRecived
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
    if (egg_collection_permission) {
      fetchTableData(sort, searchValue, status, isDiscarded, filterByNurseryId)
    }
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
            // console.log('val :>> ', val)
            if (val === null) {
              setDefaultNursery(null)
              setFilterByNurseryId('')

              // return onChange('')
            } else {
              setDefaultNursery(val)

              // setValue('room', '')
              setFilterByNurseryId(val.nursery_id)
              setNursery_name(val.nursery_name)

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

  const handleOpenNecropsy = (e, params) => {
    e.stopPropagation()
    setEggId(params?.row?.egg_id)
    setOpenNecropsy(true)
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
            status === 'all' ? (
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
            callApi={() => fetchTableData(sort, '', 'eggs_received', isDiscarded, filterByNurseryId)}
            allocationValues={allocationValues}
            setOpenDrawer={setOpenDrawer}
            allocateEggId={eggID}
          />
        )}
      </>
    )
  }

  return (
    <>
      {egg_collection_permission ? (
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
                  label='Discarded'

                  // label={
                  //   <TabBadge
                  //     label='Discarded'
                  //     totalCount={status === 'eggs_ready_to_be_discarded_at_nursery' ? total : null}
                  //   />
                  // }
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
                {/* {tableData()} */}
                <Box sx={{ width: '100%', overflowX: 'auto' }}>
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
                      },
                      '.sticky-header-first': {
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                        backgroundColor: theme.palette.background.default
                      },
                      '.sticky-cell-first': {
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                        backgroundColor: theme.palette.background.default
                      },
                      '.sticky-header-second': {
                        position: 'sticky',
                        left: 60,
                        zIndex: 2,
                        backgroundColor: theme.palette.background.default
                      },
                      '.sticky-cell-second': {
                        position: 'sticky',
                        left: 60,
                        zIndex: 1,
                        backgroundColor: theme.palette.background.default,
                        borderRight: 1,
                        borderColor: '#c3cec7'
                      },
                      '& .MuiDataGrid-root': {
                        overflowX: 'auto'
                      }
                    }}
                    columnVisibilityModel={{
                      sl_no: true
                    }}
                    hideFooterSelectedRowCount
                    autoHeight
                    pagination
                    rows={indexedRows === undefined ? [] : indexedRows}
                    rowCount={total}
                    columns={incubationColumns}
                    disableColumnSelector={true}
                    disableColumnMenu
                    rowHeight={72}
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
                          label='Ready to Discard'
                          totalCount={isDiscarded === 'eggs_ready_to_be_discarded_at_nursery' ? total : null}
                        />
                      }
                    ></Tab>
                    <Tab
                      value='eggs_discarded'
                      label={
                        <TabBadge
                          label='Discarded Batch'
                          totalCount={isDiscarded === 'eggs_discarded' ? total : null}
                        />
                      }
                    />
                    <Tab
                      value='eggs_discarded_at_nursery'
                      label={
                        <TabBadge
                          label='Discarded'
                          totalCount={isDiscarded === 'eggs_discarded_at_nursery' ? total : null}
                        />
                      }
                    />
                  </TabList>
                  <TabPanel value='eggs_ready_to_be_discarded_at_nursery' sx={{ p: 0 }}>
                    {selectionEggModel?.length > 0 && (
                      <Box sx={{ display: 'flex', height: '32px', justifyContent: 'flex-end', mx: 5, mt: -10, mb: 2 }}>
                        <Button
                          sx={{ p: 5 }}
                          size='medium'
                          variant='contained'
                          onClick={() => setOpenDiscardDialog(true)}
                        >
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
                      <TabBadge
                        label='Discarded'
                        totalCount={isDiscarded === 'eggs_discarded_at_nursery' ? total : null}
                      />
                    }
                  >
                    {/* {tableData()} */}
                    <>
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
                        columns={discarded_Egg_Columns}
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
                    </>
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
            fetchTableData={fetchTableData}
          />
          <NecropsySlider
            eggID={eggID}
            openNecropsy={openNecropsy}
            setOpenNecropsy={setOpenNecropsy}
            fetchTableData={fetchTableData}
          />
        </Box>
      ) : (
        <ErrorScreen></ErrorScreen>
      )}
    </>
  )
}

export default EggList
