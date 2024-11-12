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
import { SpeciesImageCard, TextCard } from 'src/components/egg/imageTextCard'
import EggTableHeader from 'src/views/pages/egg/eggs/EggTableHeader'
import dayjs from 'dayjs'
import ExcelExportButton from 'src/views/pages/egg/eggs/exportEggListExcel'
import { readAsync, write, remove, read } from 'src/lib/windows/utils'

const EggList = () => {
  const theme = useTheme()
  const router = useRouter()

  const { tab_Value, subTab_value, page_value, search_value, filter_list, selected_options, selected_filters_options } =
    router.query

  const { selectedEggTab, setSelectedEggTab, subTab, setSubTab } = useEggContext()

  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  console.log('rows :>> ', rows)
  const [searchValue, setSearchValue] = useState()
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)

  // const [sortColumning, setsortColumning] = useState('ingredient_name')
  const [paginationModel, setPaginationModel] = useState({ page: page_value ? Number(page_value) : 0, pageSize: 50 })

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(tab_Value ? tab_Value : 'eggs_incubation')

  const [isDiscarded, setIsDiscarded] = useState(subTab_value ? subTab_value : 'eggs_discarded')

  const [hover, setHover] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [allocationValues, setAllocationValues] = useState({})
  const [eggID, setEggId] = useState('')
  const [searchQuery, setSearchQuery] = useState(search_value || '')

  // const [allocateEggId, setAllocateEggId] = useState(null)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [openNecropsy, setOpenNecropsy] = useState(false)
  const [openDiscardDialog, setOpenDiscardDialog] = useState(false)
  const [selectionEggModel, setSelectionEggModel] = useState([])
  const [batchList, setBatchList] = useState([])

  // filter states
  const [selectedFiltersOptions, setSelectedFiltersOptions] = useState({})

  const [selectedOptions, setSelectedOptions] = useState({
    Stage: [],

    Nursery: [],
    Site: [],
    'Collected By': [],
    collected_date: null,
    status: null,
    'Discarded By': [],
    discarded_Date: null,
    'Security Check': []
  })

  const [filterList, setFilterList] = useState([])

  // nursery filter dropdown
  const [nurseryList, setNurseryList] = useState([])
  const [defaultNursery, setDefaultNursery] = useState(null)
  const [filterByNurseryId, setFilterByNurseryId] = useState('')

  // console.log('filterByNurseryId :>> ', filterByNurseryId)

  useEffect(() => {
    if (filter_list) {
      setFilterList(JSON.parse(filter_list))
    }
    if (selected_options) {
      setSelectedOptions(JSON.parse(selected_options))
    }
    if (selected_filters_options) {
      setSelectedFiltersOptions(JSON.parse(selected_filters_options))
    }
  }, [])

  const authData = useContext(AuthContext)
  const egg_collection_permission = authData?.userData?.roles?.settings?.enable_egg_collection_module
  const animal_record_access = authData?.userData?.roles?.settings?.collection_animal_record_access

  const handleDiscard = (e, eggId) => {
    e.stopPropagation()
    setIsOpen(true)
    setEggId(eggId)
  }

  // Utility Functions
  const calculatePercentageChange = (value1, value2) => {
    const numValue1 = parseFloat(value1)
    const numValue2 = parseFloat(value2)

    const difference = numValue2 - numValue1
    const percentageChange = (difference / numValue1) * 100

    return percentageChange > 0 ? `+${percentageChange.toFixed()}` : percentageChange.toFixed()
  }

  const checkAddPermission = () => {
    if (animal_record_access === 'ADD' || animal_record_access === 'EDIT' || animal_record_access === 'DELETE') {
      return true
    } else {
      return false
    }
  }

  const received = [
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
      width: 250,

      // minWidth: 60,
      sortable: false,
      field: 'species',
      headerName: 'SPECIES',
      renderCell: params => (
        <SpeciesImageCard
          imgURl={params.row.default_icon}
          eggCondition={params.row.egg_condition}
          egg_status={params.row.egg_status}
          eggCode={params.row.egg_code}
          defaultName={params.row.default_common_name}
          completeName={params.row.complete_name}
          eggIcon={'/icons/Egg_icon.png'}
        />
      )
    },
    {
      width: 200,
      sortable: false,
      field: 'egg_identifier',
      headerName: 'EGG IDENTIFIER',
      renderCell: params => (
        <Box>
          {params.row.egg_number && (
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '19.36px'
              }}
            >
              UEID : {params.row.egg_number ? params.row.egg_number : '-'}
            </Typography>
          )}

          {params.row.egg_code && (
            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,

                fontSize: '12px',
                fontWeight: 400,
                lineHeight: '19.36px'
              }}
            >
              AEID : {params.row.egg_code ? params.row.egg_code : '-'}
            </Typography>
          )}
        </Box>
      )
    },

    // {
    //   width: 160,
    //   field: 'state',
    //   sortable: false,
    //   headerName: 'STATE',

    //   // align: 'center',
    //   renderCell: params => (
    //     <Box>
    //       <TextCard egg_status={params.row.egg_status} />
    //     </Box>
    //   )
    // },

    {
      width: 160,
      field: 'condition',
      sortable: false,
      headerName: 'Condition',

      // align: 'center',
      renderCell: params => (
        <Box sx={{ gap: 2 }}>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 500,
              color:
                params.row.egg_condition === 'Intact'
                  ? '#006D35'
                  : params.row.egg_condition === 'Thin-Shelled'
                  ? '#1F515B'
                  : params.row.egg_condition === 'Broken'
                  ? '#E93353'
                  : params.row.egg_condition === 'Rotten'
                  ? '#FA6140'
                  : params.row.egg_condition === 'Cracked'
                  ? '#E4B819'
                  : '#006D35'
            }}
          >
            {' '}
            {params.row.egg_condition}
          </Typography>
          <Typography sx={{ fontWeight: 400, fontSize: '14px', color: '#44544A', textTransform: 'capitalize' }}>
            {params.row.egg_initial_temperature}
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
            lineHeight: '19.36px',
            textTransform: 'capitalize'
          }}
        >
          {params.row.nursery_name ? params.row.nursery_name : '-'}
        </Typography>
      )
    },
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

    {
      width: 270,
      sortable: false,
      field: 'collected_by',
      headerName: 'COLLECTED BY',
      renderCell: params => (
        <>
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
                  condition={params.row.egg_condition}

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
      width: 250,

      // minWidth: 60,
      sortable: false,
      field: 'species',
      headerName: 'SPECIES',
      renderCell: params => (
        <SpeciesImageCard
          imgURl={params.row.default_icon}
          eggCondition={params.row.egg_condition}
          egg_status={params.row.egg_status}
          eggCode={params.row.egg_code}
          defaultName={params.row.default_common_name}
          completeName={params.row.complete_name}
          eggIcon={params.row.egg_status === 'Hatched' ? '/icons/Egg_hatched.png' : '/icons/Egg_icon.png'}
        />
      )
    },
    {
      width: 200,
      sortable: false,
      field: 'egg_identifier',
      headerName: 'EGG IDENTIFIER',
      renderCell: params => (
        <Box>
          {params.row.egg_number && (
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '19.36px'
              }}
            >
              UEID : {params.row.egg_number ? params.row.egg_number : '-'}
            </Typography>
          )}

          {params.row.egg_code && (
            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,

                fontSize: '12px',
                fontWeight: 400,
                lineHeight: '19.36px'
              }}
            >
              AEID : {params.row.egg_code ? params.row.egg_code : '-'}
            </Typography>
          )}
        </Box>
      )
    },
    {
      width: 160,
      field: 'state',
      sortable: false,
      headerName: 'STATE',

      // align: 'center',
      renderCell: params => (
        <Box>
          <TextCard egg_status={params.row.egg_status} />
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
    //   width: 140,
    //   sortable: false,
    //   field: 'batch_no',
    //   headerName: 'Batch NO',
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
            lineHeight: '19.36px',
            textTransform: 'capitalize'
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
      headerName: 'COLLECTED BY',
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
      width: 250,

      // minWidth: 60,
      sortable: false,
      field: 'species',
      headerName: 'SPECIES',
      renderCell: params => (
        <SpeciesImageCard
          imgURl={params.row.default_icon}
          eggCondition={params.row.egg_condition}
          egg_status={params.row.egg_status}
          eggCode={params.row.egg_code}
          defaultName={params.row.default_common_name}
          completeName={params.row.complete_name}
          eggIcon={'/icons/Egg_hatched.png'}
          tab={'hatched'}
        />
      )
    },

    // {
    //   width: 150,
    //   sortable: false,
    //   field: 'hatch_no',
    //   headerName: 'Hatch NO',

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
    //       {params.row.hatch_no ? params.row.hatch_no : '-'}
    //     </Typography>
    //   )
    // },

    {
      width: 200,
      sortable: false,
      field: 'egg_identifier',
      headerName: 'EGG IDENTIFIER',
      renderCell: params => (
        <Box>
          {params.row.egg_number && (
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '19.36px'
              }}
            >
              UEID : {params.row.egg_number ? params.row.egg_number : '-'}
            </Typography>
          )}

          {params.row.egg_code && (
            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,

                fontSize: '12px',
                fontWeight: 400,
                lineHeight: '19.36px',
                mt: '1px'
              }}
            >
              AEID : {params.row.egg_code ? params.row.egg_code : '-'}
            </Typography>
          )}
        </Box>
      )
    },
    {
      width: 200,
      sortable: false,
      field: 'identifier',
      headerName: 'IDENTIFIER',
      renderCell: params => (
        <Box>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,

              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '19.36px'
            }}
          >
            {params.row.local_id_type}{' '}
            {params.row.local_identifier_value ? `- ${params.row.local_identifier_value}` : '-'}
          </Typography>
        </Box>
      )
    },
    {
      width: 200,
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
                fontWeight: '600'

                // lineHeight: '19.36px'
              }}
            >
              AAID : {params.row.animal_id ? params.row.animal_id : '-'}
            </Typography>
          ) : checkAddPermission() ? (
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
          ) : (
            <Typography
              style={{
                textAlign: 'center'

                // lineHeight: '19.36px'
              }}
            >
              -
            </Typography>
          )}
        </Box>
      )
    },

    // {
    //   width: 200,
    //   sortable: false,
    //   field: 'lay_date',
    //   headerName: 'Lay Date',

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
    //       {params.row.lay_date ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.lay_date)) : '-'}
    //     </Typography>
    //   )
    // },

    // {
    //   width: 170,
    //   sortable: false,
    //   field: 'nursery_name',
    //   headerName: 'Nursery',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.nursery_name ? params.row.nursery_name : '-'}
    //     </Typography>
    //   )
    // },
    {
      width: 200,
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
    //   width: 200,
    //   sortable: false,
    //   field: 'collected_by',
    //   headerName: 'Collected By',
    //   renderCell: params => (
    //     <>
    //       <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    //         <Avatar
    //           variant='square'
    //           alt='Medicine Image'
    //           className={status === 'eggs_received' ? 'hideField' : ''}
    //           sx={{
    //             width: 30,
    //             height: 30,

    //             borderRadius: '50%',
    //             background: '#E8F4F2',
    //             overflow: 'hidden'
    //           }}
    //         >
    //           {params.row.user_profile_pic ? (
    //             <img
    //               style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    //               src={params.row.user_profile_pic}
    //               alt='Profile'
    //             />
    //           ) : (
    //             <Icon icon='mdi:user' fontSize={30} />
    //           )}
    //         </Avatar>
    //         <Box
    //           sx={{ display: 'flex', flexDirection: 'column' }}
    //           className={status === 'eggs_received' ? 'hideField' : ''}
    //         >
    //           <Typography
    //             noWrap
    //             sx={{
    //               color: theme.palette.customColors.OnSurfaceVariant,
    //               fontSize: '14px',
    //               fontWeight: '500',
    //               lineHeight: '16.94px'
    //             }}
    //           >
    //             {params.row.user_full_name ? params.row.user_full_name : '-'}
    //           </Typography>
    //           <Typography
    //             noWrap
    //             sx={{
    //               color: theme.palette.customColors.neutralSecondary,
    //               fontSize: '12px',
    //               fontWeight: '400',
    //               lineHeight: '14.52px'
    //             }}
    //           >
    //             {params.row.created_at
    //               ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.created_at))
    //               : '-'}
    //           </Typography>
    //         </Box>
    //       </Box>
    //     </>
    //   )
    // }
    {
      width: 170,
      sortable: false,
      field: 'hatched_on',
      headerName: 'Hatched On',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.hatched_date
            ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.hatched_date))
            : '-'}
        </Typography>
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
      width: 250,

      // minWidth: 60,
      sortable: false,
      field: 'species',
      headerName: 'SPECIES',
      renderCell: params => (
        <Stack direction='row' spacing={2} sx={{ display: 'flex', alignItems: 'center' }}>
          <SpeciesImageCard
            imgURl={params.row.default_icon}
            eggCondition={''}
            egg_status={params.row.egg_status}
            eggCode={params.row.egg_code}
            defaultName={params.row.default_common_name}
            completeName={params.row.complete_name}
            eggIcon={'/icons/Egg_icon.png'}
          />
        </Stack>
      )
    },

    {
      width: 200,
      sortable: false,
      field: 'egg_identifier',
      headerName: 'EGG IDENTIFIER',
      renderCell: params => (
        <Box>
          {params.row.egg_number && (
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '19.36px'
              }}
            >
              UEID : {params.row.egg_number ? params.row.egg_number : '-'}
            </Typography>
          )}

          {params.row.egg_code && (
            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,

                fontSize: '12px',
                fontWeight: 400,
                lineHeight: '19.36px'
              }}
            >
              AEID : {params.row.egg_code ? params.row.egg_code : '-'}
            </Typography>
          )}
        </Box>
      )
    },
    {
      // flex: 0.15,
      width: 200,
      sortable: false,
      field: 'stage_state',
      headerName: 'STATE & STAGE',

      // align: 'center',
      renderCell: params => (
        <Stack direction='column' spacing={1}>
          <Box sx={{ width: 'fit-content', maxWidth: '100%' }}>
            <TextCard egg_status={params.row.egg_status} />
          </Box>

          {params.row.egg_status !== 'Fresh' && (
            <Tooltip title={params.row?.egg_state ? params.row?.egg_state : '-'}>
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: '400',
                  lineHeight: '19.36px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: 170

                  // Ensures Typography doesn't exceed container width
                }}
              >
                {params.row.egg_state ? params.row.egg_state : '-'}
              </Typography>
            </Tooltip>
          )}
        </Stack>
      )
    },
    {
      // flex: 0.15,
      width: 180,
      sortable: false,
      field: 'days_in_incubation',
      headerName: 'Days In Incubation',
      align: 'left',
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            DAYS IN
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            INCUBATION
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 500,
            lineHeight: '19.36px'
          }}
        >
          {params.row.days_in_incubation ? params.row.days_in_incubation : '-'}
        </Typography>
      )
    },

    // {
    //   // flex: 0.15,
    //   width: 130,
    //   sortable: false,
    //   field: 'condition',
    //   headerName: 'condition',
    //   align: 'center',

    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color:
    //           params.row.egg_condition === 'Intact'
    //             ? '#006D35'
    //             : params.row.egg_condition === 'Thin-Shelled'
    //             ? '#1F515B'
    //             : params.row.egg_condition === 'Broken'
    //             ? '#E93353'
    //             : params.row.egg_condition === 'Rotten'
    //             ? '#FA6140'
    //             : params.row.egg_condition === 'Cracked'
    //             ? '#E4B819'
    //             : '#006D35',
    //         fontSize: '16px',
    //         fontWeight: 500,
    //         lineHeight: '19.36px',
    //         overflow: 'hidden',
    //         textOverflow: 'ellipsis',
    //         whiteSpace: 'nowrap',
    //         textTransform: 'capitalize'
    //       }}
    //     >
    //       {params.row.egg_condition ? params.row.egg_condition : '-'}
    //     </Typography>
    //   )
    // },

    {
      // flex: 0.15,
      width: 180,
      sortable: false,
      field: 'initial_weight',
      headerName: 'Initial weight in gm',
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
      width: 180,
      sortable: false,
      field: 'current_weight',
      headerName: 'current weight in gm',
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
          {params.row.current_weight ? params.row.current_weight : '-'}{' '}
          {!isNaN(calculatePercentageChange(params.row.initial_weight, params.row.current_weight)) &&
            calculatePercentageChange(params.row.initial_weight, params.row.current_weight) !== '0' && (
              <span
                style={{
                  borderLeft: `1px solid #bdc7c0`,
                  paddingLeft: 4,
                  color:
                    calculatePercentageChange(params.row.initial_weight, params.row.current_weight) > 0
                      ? theme.palette.primary.main
                      : theme.palette.formContent.tertiary
                }}
              >
                {calculatePercentageChange(params.row.initial_weight, params.row.current_weight)}%
              </span>
            )}
        </Typography>
      )
    },

    {
      // flex: 0.15,
      width: 130,
      sortable: false,
      field: 'initial_length',
      headerName: 'Length in mm ',
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
      width: 130,
      sortable: false,
      field: 'initial_width',
      headerName: 'width in mm',
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
          {params.row.initial_width ? params.row.initial_width : '-'}
        </Typography>
      )
    },

    {
      // flex: 0.15,
      width: 130,
      sortable: false,
      field: 'no_of_eggs_in_clutch',
      headerName: 'No Eggs / Clutch',
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            NO.EGG /
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            CLUTCH
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 500,
            lineHeight: '19.36px',
            ml: 3
          }}
        >
          {params.row.no_of_eggs_in_clutch ? params.row.no_of_eggs_in_clutch : '-'}
        </Typography>
      )
    },
    {
      // flex: 0.15,
      width: 130,
      sortable: false,
      field: 'clutch_id',
      headerName: 'Clutch Id',

      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 500,
            lineHeight: '19.36px',
            ml: 3
          }}
        >
          {params.row.clutch_id ? params.row.clutch_id : '-'}
        </Typography>
      )
    },

    {
      // flex: 0.15,
      width: 130,
      sortable: false,
      field: 'enclosure_name',
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
          {params.row.enclosure_name ? params.row.enclosure_name : '-'}
        </Typography>
      )
    },

    {
      // flex: 0.15,
      width: 150,
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

    // {
    //   width: 150,
    //   sortable: false,
    //   field: 'lay_date',
    //   headerName: 'Lay Date',

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
    //       {params.row.lay_date ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.lay_date)) : '-'}
    //     </Typography>
    //   )
    // },

    {
      // flex: 0.3,
      width: 200,
      sortable: false,
      field: 'allocated_by',
      headerName: 'Allocated by',
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
                {params.row.allocate_date
                  ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.allocate_date))
                  : '-'}
              </Typography>
            </Box>
          </Box>
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
      width: 300,

      // minWidth: 60,
      sortable: false,
      field: 'species',
      headerName: 'SPECIES',
      renderCell: params => (
        <SpeciesImageCard
          imgURl={params.row.default_icon}
          eggCondition={''}
          egg_status={params.row.egg_status}
          eggCode={params.row.egg_code}
          defaultName={params.row.default_common_name}
          completeName={params.row.complete_name}
          eggIcon={'/icons/Egg_icon.png'}
        />
      )
    },
    {
      width: 200,
      sortable: false,
      field: 'egg_identifier',
      headerName: 'EGG IDENTIFIER',
      renderCell: params => (
        <Box>
          {params.row.egg_number && (
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '19.36px'
              }}
            >
              UEID : {params.row.egg_number ? params.row.egg_number : '-'}
            </Typography>
          )}

          {params.row.egg_code && (
            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,

                fontSize: '12px',
                fontWeight: 400,
                lineHeight: '19.36px'
              }}
            >
              AEID : {params.row.egg_code ? params.row.egg_code : '-'}
            </Typography>
          )}
        </Box>
      )
    },
    {
      width: 160,
      field: 'reason',
      sortable: false,
      headerName: 'Reason',

      // align: 'center',
      renderCell: params => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%', // Ensures it uses the full width of the cell
            overflow: 'hidden' // Ensures text overflow is handled
          }}
        >
          {params.row.egg_state && (
            <Tooltip title={params.row?.egg_state ? params.row?.egg_state : '-'}>
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: '400',
                  lineHeight: '19.36px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2, // Limit to 2 lines
                  WebkitBoxOrient: 'vertical',
                  whiteSpace: 'normal', // Ensure wrapping happens
                  wordBreak: 'break-word' // Handle long words breaking into the next line
                }}
              >
                {params.row.egg_state}
              </Typography>
            </Tooltip>
          )}
        </Box>
      )
    },
    ,
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
          {params.row.necropsy_file_uploaded === '1' || params.row.is_sample_collected === '1' ? (
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
      field: 'initiated_by',
      headerName: 'Initiated By',
      renderCell: params => (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar
              variant='square'
              alt='Medicine Image'
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
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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

  const ready_to_discard = [
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
      width: 300,

      // minWidth: 60,
      sortable: false,
      field: 'species',
      headerName: 'SPECIES',
      renderCell: params => (
        <SpeciesImageCard
          imgURl={params.row.default_icon}
          eggCondition={''}
          egg_status={params.row.egg_status}
          eggCode={params.row.egg_code}
          defaultName={params.row.default_common_name}
          completeName={params.row.complete_name}
          eggIcon={'/icons/Egg_icon.png'}
        />
      )
    },
    {
      width: 200,
      sortable: false,
      field: 'egg_identifier',
      headerName: 'EGG IDENTIFIER',
      renderCell: params => (
        <Box>
          {params.row.egg_number && (
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '19.36px'
              }}
            >
              UEID : {params.row.egg_number ? params.row.egg_number : '-'}
            </Typography>
          )}

          {params.row.egg_code && (
            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,

                fontSize: '12px',
                fontWeight: 400,
                lineHeight: '19.36px'
              }}
            >
              AEID : {params.row.egg_code ? params.row.egg_code : '-'}
            </Typography>
          )}
        </Box>
      )
    },
    {
      width: 160, // Adjust based on desired cell width
      field: 'reason',
      sortable: false,
      headerName: 'Reason',
      renderCell: params => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%', // Ensures it uses the full width of the cell
            overflow: 'hidden' // Ensures text overflow is handled
          }}
        >
          {params.row.egg_state && (
            <Tooltip title={params.row?.egg_state ? params.row?.egg_state : '-'}>
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: '400',
                  lineHeight: '19.36px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2, // Limit to 2 lines
                  WebkitBoxOrient: 'vertical',
                  whiteSpace: 'normal', // Ensure wrapping happens
                  wordBreak: 'break-word' // Handle long words breaking into the next line
                }}
              >
                {params.row.egg_state}
              </Typography>
            </Tooltip>
          )}
        </Box>
      )
    },
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
    //   width: 140,
    //   sortable: false,
    //   field: 'batch_no',
    //   headerName: 'Batch NO',
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

    // {
    //   width: 160,
    //   sortable: false,
    //   field: 'nursery_name',
    //   headerName: 'Nursery',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.nursery_name ? params.row.nursery_name : '-'}
    //     </Typography>
    //   )
    // },

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
      width: 200,
      sortable: false,
      field: 'initiated_by',
      headerName: 'Initiated By',
      renderCell: params => (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar
              variant='square'
              alt='Medicine Image'
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
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
                {params.row.ready_to_be_discarded_date
                  ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.ready_to_be_discarded_date))
                  : '-'}
              </Typography>
            </Box>
          </Box>
        </>
      )
    }

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

    // {
    //   width: 270,
    //   sortable: false,
    //   field: 'collected_by',
    //   headerName: 'COLLECTED BY',
    //   renderCell: params => (
    //     <>
    //       {/* {status === 'eggs_received' && (
    //         <Button className='customButton' variant='contained' onClick={e => handleAction(e, params.row.id)}>
    //           Allocate{' '}
    //         </Button>
    //       )} */}
    //       {status === 'eggs_received' ? (
    //         <>
    //           <div>
    //             <DiscardStatusCell
    //               customButton={status === 'eggs_received' ? 'customButton' : null}
    //               hideField='hideField'
    //               params={params}
    //               setIsOpen={setIsOpen}
    //               handleDiscard={handleDiscard}
    //               setEggId={setEggId}
    //               handleAction={handleAction}
    //               setAllocationValues={setAllocationValues}

    //               // hover={hover} setHover={setHover}
    //             />
    //           </div>
    //         </>
    //       ) : (
    //         <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    //           <Avatar
    //             variant='square'
    //             alt='Medicine Image'
    //             className={status === 'eggs_received' ? 'hideField' : ''}
    //             sx={{
    //               width: 30,
    //               height: 30,

    //               borderRadius: '50%',
    //               background: '#E8F4F2',
    //               overflow: 'hidden'
    //             }}
    //           >
    //             {params.row.user_profile_pic ? (
    //               <img
    //                 style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    //                 src={params.row.user_profile_pic}
    //                 alt='Profile'
    //               />
    //             ) : (
    //               <Icon icon='mdi:user' fontSize={30} />
    //             )}
    //           </Avatar>
    //           <Box
    //             sx={{ display: 'flex', flexDirection: 'column' }}
    //             className={status === 'eggs_received' ? 'hideField' : ''}
    //           >
    //             <Typography
    //               noWrap
    //               sx={{
    //                 color: theme.palette.customColors.OnSurfaceVariant,
    //                 fontSize: '14px',
    //                 fontWeight: '500',
    //                 lineHeight: '16.94px'
    //               }}
    //             >
    //               {params.row.user_full_name ? params.row.user_full_name : '-'}
    //             </Typography>
    //             <Typography
    //               noWrap
    //               sx={{
    //                 color: theme.palette.customColors.neutralSecondary,
    //                 fontSize: '12px',
    //                 fontWeight: '400',
    //                 lineHeight: '14.52px'
    //               }}
    //             >
    //               {params.row.created_at
    //                 ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.created_at))
    //                 : '-'}
    //             </Typography>
    //           </Box>
    //         </Box>
    //       )}
    //     </>
    //   )
    // }
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
        search_value: search_value ? search_value : '',
        filter_list: JSON.stringify(filterList),
        selected_options: JSON.stringify(selectedOptions),
        selected_filters_options: JSON.stringify(selectedFiltersOptions)
      }

      // console.log('values :>> ', values)

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
    setFilterList([])
    setSelectedFiltersOptions({})
    setPaginationModel({ page: 0, pageSize: 50 })
    setSelectionEggModel([])
    setSearchQuery('')
    router.push(
      {
        query: {
          ...router.query,
          tab_Value: newValue,
          search_value: '',
          page_value: 0,
          filter_list: '',
          selected_options: '',
          selected_filters_options: ''
        }
      },
      undefined,
      {
        shallow: true
      }
    )
  }

  const handleTabs = (event, newValue) => {
    setTotal(0)
    setSearchValue('')
    setIsDiscarded(newValue)
    setSubTab(newValue)
    setFilterList([])
    setSelectedFiltersOptions({})
    setPaginationModel({ page: 0, pageSize: 50 })
    setSearchQuery('')
    setSelectionEggModel([])

    router.push(
      {
        query: {
          ...router.query,
          subTab_value: newValue,
          search_value: '',
          page_value: 0,
          filter_list: '',
          selected_options: '',
          selected_filters_options: ''
        }
      },
      undefined,
      {
        shallow: true
      }
    )
  }

  const fetchTableData = useCallback(
    async (sort, search, statusRecived, discardedTab, selectedFiltersOptions = {}, filterByNurseryId) => {
      // debugger

      try {
        setLoading(true)

        // Extracting IDs from selectedFiltersOptions
        // const nurseryIds = selectedFiltersOptions.Nursery?.map(option => option.id) || []
        const eggStateIds = selectedFiltersOptions.Stage?.map(option => option.id) || []

        // const eggStatusIds = selectedFiltersOptions.EggStatus?.map(option => option.id) ||""
        // const collectedByIds = selectedFiltersOptions['Collected By']?.id || ''
        const collectedByIds =
          tab_Value === 'eggs_ready_to_be_discarded_at_nursery'
            ? selectedFiltersOptions['Discarded By']?.map(option => option.id) || []
            : tab_Value === 'eggs_discarded'
            ? selectedFiltersOptions['Discarded By']?.map(option => option.id) || []
            : selectedFiltersOptions['Collected By']?.map(option => option.id) || []
        const siteIds = selectedFiltersOptions.Site?.map(option => option.id) || []

        const statusId = selectedFiltersOptions.status?.id ? [selectedFiltersOptions.status?.id] : ''

        const collectedDate = selectedFiltersOptions.collected_date
          ? dayjs(selectedFiltersOptions.collected_date).format('YYYY-MM-DD')
          : ''

        const params = {
          sort,
          q: search ? search : '',

          sorting_by_date: 'latest_date',

          // sortColumn,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,

          // nursery_id: nurseryIds?.length > 0 ? JSON.stringify(nurseryIds) : '',
          egg_state_id: eggStateIds?.length > 0 ? JSON.stringify(eggStateIds) : '',
          collected_by: collectedByIds?.length > 0 ? JSON.stringify(collectedByIds) : '',
          site_id: siteIds?.length > 0 ? JSON.stringify(siteIds) : '',
          nursery_id: filterByNurseryId || '',

          egg_status_id: (() => {
            if (tab_Value === 'eggs_incubation' || tab_Value === 'all') {
              return statusId ? JSON.stringify(statusId) : ''
            } else {
              return eggStateIds?.length > 0 ? (statusId ? JSON.stringify(statusId) : '') : ''
            }
          })(),

          // egg_status_id: eggStateIds?.length > 0 ? (statusId ? statusId : '') : '',

          // egg_status_id: statusId ? statusId : '',
          collected_date: collectedDate ? collectedDate : '',

          type:
            statusRecived === undefined
              ? status === 'eggs_discarded'
                ? isDiscarded
                : status
              : statusRecived === 'eggs_discarded'
              ? discardedTab
              : statusRecived
        }

        // console.log('params table data :>> ', isDiscarded)
        // console.log('params table data :>> ', status)
        if (
          (status === 'eggs_discarded' && isDiscarded === 'eggs_discarded_at_nursery') ||
          status === 'eggs_received' ||
          status === 'eggs_incubation' ||
          status === 'eggs_hatched' ||
          status === 'eggs_ready_to_be_discarded_at_nursery' ||
          status === 'all'
        ) {
          await GetEggList({ params: params }).then(res => {
            if (res.success) {
              const ListData = res.data.result ? res.data.result : []
              setTotal(parseInt(res?.data?.total_count))
              setRows(loadServerRows(paginationModel.page, ListData))
            } else {
              setRows([])
            }
          })
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
    if (egg_collection_permission) {
      fetchTableData(sort, searchQuery, status, isDiscarded, selectedFiltersOptions, filterByNurseryId)
    }
  }, [fetchTableData, status, isDiscarded, selectedFiltersOptions, filterByNurseryId])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row?.egg_id,
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
        await fetchTableData(sort, q, status, isDiscarded, selectedFiltersOptions)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const NurseryList = async q => {
    try {
      const params = {
        search: q,
        page: 1,
        limit: 50
      }
      await GetNurseryList({ params }).then(res => {
        const apiList = res?.data?.result || []

        // Add the "All" option
        const allOption = { nursery_id: '', nursery_name: 'All' }
        const updatedList = [allOption, ...apiList]
        setNurseryList(updatedList)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const readNursery = async () => {
    const storedNursery = read('Nursery')
    const parsedNursery = await JSON.parse(storedNursery)
    if (parsedNursery) {
      setDefaultNursery(parsedNursery)
      setFilterByNurseryId(parsedNursery?.nursery_id)
    } else {
      setDefaultNursery({ nursery_id: '', nursery_name: 'All' })
      setFilterByNurseryId(parsedNursery?.nursery_id)
    }
  }

  useEffect(() => {
    readNursery()

    NurseryList()
  }, [])

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
            if (val === null || val.nursery_id === '') {
              setDefaultNursery({ nursery_id: '', nursery_name: 'All' })
              setFilterByNurseryId('')
              write('Nursery', JSON.stringify({ nursery_id: '', nursery_name: 'All' }))
            } else {
              setDefaultNursery({ nursery_id: val.nursery_id, nursery_name: val.nursery_name })
              setFilterByNurseryId(val.nursery_id)
              write('Nursery', JSON.stringify({ nursery_id: val.nursery_id, nursery_name: val.nursery_name }))
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

  useEffect(() => {
    setSelectedOptions({
      Stage: [],
      Nursery: [],
      Site: [],
      'Collected By': [],
      collected_date: null,
      status: null,
      'Discarded By': [],
      discarded_Date: null,
      'Security Check': []
    })
  }, [status, isDiscarded])

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
              <>
                <EggTableHeader
                  totalCount={total}
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
                  rowCount={total}
                  columns={status === 'eggs_hatched' ? hatchedColumn : status === 'eggs_received' ? received : columns}
                  sortingMode='server'
                  paginationMode='server'
                  pageSizeOptions={[7, 10, 25, 50]}
                  paginationModel={paginationModel}
                  onSortModelChange={handleSortModel}
                  // slots={{ toolbar: ServerSideToolbarWithFilter }}
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
            ) : (
              status === 'eggs_ready_to_be_discarded_at_nursery' && (
                <Box>
                  <EggTableHeader
                    totalCount={total}
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
                    rowCount={total}
                    columns={ready_to_discard}
                    sortingMode='server'
                    paginationMode='server'
                    pageSizeOptions={[7, 10, 25, 50]}
                    paginationModel={paginationModel}
                    onSortModelChange={handleSortModel}
                    // slots={{ toolbar: ServerSideToolbarWithFilter }}
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
            callApi={() => fetchTableData(sort, '', 'eggs_received', isDiscarded, selectedFiltersOptions)}
            allocationValues={allocationValues}
            setOpenDrawer={setOpenDrawer}
            allocateEggId={eggID}
          />
        )}
      </>
    )
  }

  // const headerAction = (
  //   <>
  //     <div>
  //       <ExcelExportButton
  //         tab_Value={tab_Value}
  //         subTab_value={subTab_value}
  //         data={tab_Value === 'eggs_discarded' && subTab_value === 'eggs_discarded' ? batchList : rows}
  //       />
  //     </div>
  //   </>
  // )

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
                  label='Received'

                  // label={<TabBadge label='Received' totalCount={status === 'eggs_received' ? total : null} />}
                />
                <Tab
                  value='eggs_incubation'
                  label='Incubation'

                  // label={<TabBadge label='Incubation' totalCount={status === 'eggs_incubation' ? total : null} />}
                />
                <Tab
                  value='eggs_hatched'
                  label='Hatched'

                  // label={<TabBadge label='Hatched' totalCount={status === 'eggs_hatched' ? total : null} />}
                />
                <Tab
                  value='eggs_ready_to_be_discarded_at_nursery'
                  label={
                    <TabBadge
                      label='To Be Discarded'

                      // totalCount={status === 'eggs_ready_to_be_discarded_at_nursery' ? total : null}
                    />
                  }
                ></Tab>
                <Tab
                  value='eggs_discarded'
                  label='Discarded'

                  // label={
                  //   <TabBadge
                  //     label='Discarded'
                  //     totalCount={status === 'eggs_ready_to_be_discarded_at_nursery' ? total : null}
                  //   />
                  // }
                />
                <Tab
                  value='all'
                  label='All'

                  //  label={<TabBadge label='All' totalCount={status === 'all' ? total : null} />}
                />
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
                  <EggTableHeader
                    totalCount={total}
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
                    // slots={{ toolbar: ServerSideToolbarWithFilter }}
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
                {selectionEggModel?.length > 0 && (
                  <Box
                    sx={{ display: 'flex', height: '30px', justifyContent: 'flex-end', mx: 5, mt: -10, mb: 2, pb: 2 }}
                  >
                    <Button
                      sx={{ p: 5, mt: -2 }}
                      size='medium'
                      variant='contained'
                      onClick={() => setOpenDiscardDialog(true)}
                    >
                      &nbsp;{selectionEggModel?.length}&nbsp;Discard
                    </Button>
                  </Box>
                )}
                <Divider />
                {tableData()}
              </TabPanel>
              <TabPanel value='eggs_discarded' sx={{ p: 0 }}>
                <Divider sx={{ mb: 3 }} />

                {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}> */}

                {/* </Box> */}
                <TabContext value={isDiscarded}>
                  <TabList onChange={handleTabs} sx={{ px: 2 }}>
                    {/* <Tab
                      value='eggs_ready_to_be_discarded_at_nursery'
                      label={
                        <TabBadge
                          label='Ready to Discard'
                          totalCount={isDiscarded === 'eggs_ready_to_be_discarded_at_nursery' ? total : null}
                        />
                      }
                    ></Tab> */}
                    <Tab
                      value='eggs_discarded'
                      label={
                        <TabBadge
                          label='Batch Discarded '

                          // totalCount={isDiscarded === 'eggs_discarded' ? total : null}
                        />
                      }
                    />
                    <Tab
                      value='eggs_discarded_at_nursery'
                      label={
                        <TabBadge
                          label='Discarded'

                          // totalCount={isDiscarded === 'eggs_discarded_at_nursery' ? total : null}
                        />
                      }
                    />
                  </TabList>
                  {/* <TabPanel value='eggs_ready_to_be_discarded_at_nursery' sx={{ p: 0 }}>
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
                  </TabPanel> */}
                  <TabPanel value='eggs_discarded' sx={{ p: 0 }}>
                    {' '}
                    <>
                      {/* <EggTableHeader
                        tabValue={status}
                        totalCount={total}
                        setFilterList={setFilterList}
                        filterList={filterList}
                        handleSearch={handleSearch}
                        setSelectedFiltersOptions={setSelectedFiltersOptions}
                        selectedFiltersOptions={selectedFiltersOptions}
                      /> */}
                      <DiscardedTableView
                        tabValue={status}
                        setFilterList={setFilterList}
                        filterList={filterList}
                        setSelectedFiltersOptions={setSelectedFiltersOptions}
                        selectedFiltersOptions={selectedFiltersOptions}
                        setTotal={setTotal}
                        selectedOptions={selectedOptions}
                        setSelectedOptions={setSelectedOptions}
                        setBatchList={setBatchList}
                      />
                    </>
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
                      <EggTableHeader
                        totalCount={total}
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
                        rowCount={total}
                        columns={discarded_Egg_Columns}
                        sortingMode='server'
                        paginationMode='server'
                        pageSizeOptions={[7, 10, 25, 50]}
                        paginationModel={paginationModel}
                        onSortModelChange={handleSortModel}
                        // slots={{ toolbar: ServerSideToolbarWithFilter }}
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
