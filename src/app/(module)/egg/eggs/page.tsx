'use client'
import useSafeRouter from 'src/hooks/useSafeRouter'
import React, { useCallback, useEffect, useState, useContext, useMemo } from 'react'
import type { FC } from 'react'
import type { EggItem } from 'src/types/egg'

import { TabContext, TabList, TabPanel } from '@mui/lab'
import {
  Autocomplete,
  Avatar,
  Breadcrumbs,
  Button,
  Card,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Tab,
  TextField,
  Tooltip,
  Typography,
  debounce
} from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'

import dayjs from 'dayjs'

import Icon from 'src/@core/components/icon'
import FallbackSpinner from 'src/@core/components/spinner'

import DiscardForm from 'src/components/egg/DiscardForm'
import { SpeciesImageCard, TextCard } from 'src/components/egg/imageTextCard'
import DiscardStatusCell from 'src/components/egg/DiscardStatusCell'

import NecropsySlider from 'src/views/pages/egg/eggs/nepocrspySlider'
import DiscardDialogBox from 'src/views/pages/egg/eggs/Discarded/DiscardDialogBox'
import DiscardedTableView from 'src/views/pages/egg/eggs/Discarded/DiscardedTableView'
import AllocationSlider from 'src/views/pages/egg/eggs/allocationSlider'
import CreateAnimalSlider from 'src/views/pages/egg/eggs/eggDetails/CreateAnimal'
import EggTableHeader from 'src/views/pages/egg/eggs/EggTableHeader'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import ErrorScreen from 'src/pages/Error'

import { useEggContext } from 'src/context/EggContext'
import { AuthContext } from 'src/context/AuthContext'
import Utility from 'src/utility'

import { GetEggList } from 'src/lib/api/egg/egg'
import { GetNurseryList } from 'src/lib/api/egg/nursery'
import { useTranslation } from 'react-i18next'

const ALL_NURSERY_OPTION = { nursery_id: '', nursery_name: 'All' }

const EggList: FC = () => {
  const theme = useTheme()
  const router = useSafeRouter()
  const { t } = useTranslation()
  const rawQuery = (router.query || {}) as Record<string, string | string[] | undefined>
  const tab_Value = Array.isArray(rawQuery.tab_Value) ? rawQuery.tab_Value[0] : rawQuery.tab_Value || 'eggs_incubation'
  const subTab_value = Array.isArray(rawQuery.subTab_value) ? rawQuery.subTab_value[0] : rawQuery.subTab_value || 'eggs_discarded'
  const page_value = Array.isArray(rawQuery.page_value) ? rawQuery.page_value[0] : rawQuery.page_value
  const search_value = Array.isArray(rawQuery.search_value) ? rawQuery.search_value[0] : rawQuery.search_value
  const filter_list = Array.isArray(rawQuery.filter_list) ? rawQuery.filter_list[0] : rawQuery.filter_list
  const selected_options = Array.isArray(rawQuery.selected_options) ? rawQuery.selected_options[0] : rawQuery.selected_options
  const selected_filters_options = Array.isArray(rawQuery.selected_filters_options) ? rawQuery.selected_filters_options[0] : rawQuery.selected_filters_options

  const authData = useContext(AuthContext) as any
  const egg_collection_permission = authData?.userData?.roles?.settings?.enable_egg_collection_module
  const animal_record_access = authData?.userData?.roles?.settings?.collection_animal_record_access

  const { selectedEggTab, setSelectedEggTab, subTab, setSubTab } = useEggContext()

  const [loader, setLoader] = useState<boolean>(false)
  const [total, setTotal] = useState<number>(0)
  const [sort, setSort] = useState<string>('desc')
  const [rows, setRows] = useState<any[]>([])

  const [searchValue, setSearchValue] = useState<string | undefined>()
  const [openCreate, setOpenCreate] = useState<boolean>(false)

  const [paginationModel, setPaginationModel] = useState({ page: page_value ? Number(page_value) : 0, pageSize: 50 })

  const [loading, setLoading] = useState<boolean>(false)
  const [status, setStatus] = useState<string>(tab_Value)

  const [isDiscarded, setIsDiscarded] = useState<string>(subTab_value)

  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [allocationValues, setAllocationValues] = useState<any>({})
  const [eggID, setEggId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>(search_value || '')

  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [openNecropsy, setOpenNecropsy] = useState<boolean>(false)
  const [openDiscardDialog, setOpenDiscardDialog] = useState<boolean>(false)
  const [selectionEggModel, setSelectionEggModel] = useState<any[]>([])
  const [batchList, setBatchList] = useState<any[]>([])

  // filter states
  const [selectedFiltersOptions, setSelectedFiltersOptions] = useState<any>({})

  const [selectedOptions, setSelectedOptions] = useState<any>({
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

  const [filterList, setFilterList] = useState<any[]>([])

  // nursery filter dropdown
  const [nurseryLoading, setNurseryLoading] = useState<boolean>(false)
  const [nurseryList, setNurseryList] = useState<any[]>([ALL_NURSERY_OPTION])
  const [defaultNursery, setDefaultNursery] = useState<any>(ALL_NURSERY_OPTION)
  const [filterByNurseryId, setFilterByNurseryId] = useState<string>('')

  useEffect(() => {
    if (filter_list) {
      // console.log('filter_list', filter_list)
      setFilterList(JSON.parse(filter_list))
    }
    if (selected_options) {
      setSelectedOptions(JSON.parse(selected_options))
    }
    if (selected_filters_options) {
      setSelectedFiltersOptions(JSON.parse(selected_filters_options))
    }
  }, [])

  const handleDiscard = (e: React.MouseEvent<HTMLElement>, eggId: string | number): void => {
    e.stopPropagation()
    setIsOpen(true)
    setEggId(String(eggId))
  }

  // Utility Functions
  const calculatePercentageChange = (value1: any, value2: any): string => {
    const numValue1 = parseFloat(value1)
    const numValue2 = parseFloat(value2)

    const difference = numValue2 - numValue1
    const percentageChange = (difference / numValue1) * 100

    return percentageChange > 0 ? `+${percentageChange.toFixed()}` : percentageChange.toFixed()
  }

  const checkAddPermission = (): boolean => {
    if (animal_record_access === 'ADD' || animal_record_access === 'EDIT' || animal_record_access === 'DELETE') {
      // console.log('animal_record_access', animal_record_access)

      return true
    } else {
      return false
    }
  }

  const received = [
    {
      width: 80,
      field: 'uid',
      headerName: 'SL.NO',
      align: 'center',
      sortable: false,
      renderCell: (params: Record<string, any>) => (
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
      sortable: false,
      field: 'species',
      headerName: t('navigation.species'),
      renderCell: (params: Record<string, any>) => (
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
      headerName: t('egg_module.egg_identifier'),
      renderCell: (params: Record<string, any>) => (
        <Box>
          {params.row.egg_number && (
            <Tooltip title={`UEID: ${params.row?.egg_number || '-'}`}>
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: '19.36px'
                }}
              >
                UEID : {params.row.egg_number ? params.row.egg_number : '-'}
              </Typography>
            </Tooltip>
          )}

          {params.row.egg_code && (
            <Tooltip title={`AEID: ${params.row?.egg_code || '-'}`}>
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
            </Tooltip>
          )}
        </Box>
      )
    },

    {
      width: 160,
      field: 'condition',
      sortable: false,
      headerName: t('egg_module.condition'),
      renderCell: (params: Record<string, any>) => (
        <Box sx={{ gap: 2 }}>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 500,
              color:
                params.row.egg_condition === 'Intact'
                  ? theme.palette.primary.dark
                  : params.row.egg_condition === 'Thin-Shelled'
                  ? theme.palette.primary.light
                  : params.row.egg_condition === 'Broken'
                  ? theme.palette.customColors.Error
                  : params.row.egg_condition === 'Rotten'
                  ? theme.palette.customColors.Tertiary
                  : params.row.egg_condition === 'Cracked'
                  ? theme.palette.customColors.moderateSecondary
                  : theme.palette.primary.dark
            }}
          >
            {' '}
            {params.row.egg_condition}
          </Typography>
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: '14px',
              color: theme.palette.customColors.OnSurfaceVariant,
              textTransform: 'capitalize'
            }}
          >
            {params.row.egg_initial_temperature}
          </Typography>
        </Box>
      )
    },

    {
      width: 160,
      sortable: false,
      field: 'site',
      headerName: t('egg_module.site_name'),
      renderCell: (params: Record<string, any>) => (
        <Tooltip title={params.row.site_name ? params.row.site_name : '-'}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              ml: 3,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {params.row.site_name ? params.row.site_name : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      width: 160,
      sortable: false,
      field: 'nursery_name',
      headerName: t('egg_module.nursery'),
      renderCell: (params: Record<string, any>) => (
        <Tooltip title={params.row.nursery_name ? params.row.nursery_name : '-'}>
          <Typography
            sx={{
              textTransform: 'capitalize',
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              ml: 3
            }}
          >
            {params.row.nursery_name ? params.row.nursery_name : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      width: 150,
      sortable: false,
      field: 'collected_on',
      headerName: t('collected_on'),
      renderCell: (params: Record<string, any>) => (
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
      headerName: t('collected_by'),
      renderCell: (params: Record<string, any>) => (
        <>
          {status === 'eggs_received' ? (
            <>
              <div>
                <DiscardStatusCell
                  customButton={status === 'eggs_received' ? 'customButton' : undefined}
                  hideField='hideField'
                  params={params}
                  setIsOpen={setIsOpen}
                  handleDiscard={handleDiscard}
                  setEggId={(id: string | number) => setEggId(String(id))}
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
                  background: theme.palette.customColors.displaybgPrimary,
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
      width: 80,
      field: 'uid',
      headerName: 'SL.NO',
      align: 'center',
      sortable: false,
      renderCell: (params: Record<string, any>) => (
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
      sortable: false,
      field: 'species',
      headerName: t('navigation.species'),
      renderCell: (params: Record<string, any>) => (
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
      headerName: t('egg_module.egg_identifier'),
      renderCell: (params: Record<string, any>) => (
        <Box>
          {params.row.egg_number && (
            <Tooltip title={`UEID: ${params.row?.egg_number || '-'}`}>
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: '19.36px'
                }}
              >
                UEID : {params.row.egg_number ? params.row.egg_number : '-'}
              </Typography>
            </Tooltip>
          )}

          {params.row.egg_code && (
            <Tooltip title={`AEID: ${params.row?.egg_code || '-'}`}>
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
            </Tooltip>
          )}
        </Box>
      )
    },
    {
      width: 160,
      field: 'state',
      sortable: false,
      headerName: t('egg_module.state'),
      renderCell: (params: Record<string, any>) => (
        <Box>
          <TextCard egg_status={params.row.egg_status} />
        </Box>
      )
    },

    {
      width: 160,
      sortable: false,
      field: 'site',
      headerName: t('egg_module.site_name'),
      renderCell: (params: Record<string, any>) => (
        <Tooltip title={params.row.site_name ? params.row.site_name : '-'}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {params.row.site_name ? params.row.site_name : '-'}
          </Typography>
        </Tooltip>
      )
    },

    {
      width: 160,
      sortable: false,
      field: 'nursery_name',
      headerName: t('navigation.nursery'),
      renderCell: (params: Record<string, any>) => (
        <Tooltip title={params.row.nursery_name ? params.row.nursery_name : '-'}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textTransform: 'capitalize',
              ml: 3
            }}
          >
            {params.row.nursery_name ? params.row.nursery_name : '-'}
          </Typography>
        </Tooltip>
      )
    },

    {
      width: 150,
      sortable: false,
      field: 'collected_on',
      headerName: t('collected_on'),
      renderCell: (params: Record<string, any>) => (
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
      headerName: t('collected_by'),
      renderCell: (params: Record<string, any>) => (
        <>
          {status === 'eggs_received' ? (
            <>
              <div>
                <DiscardStatusCell
                  customButton={status === 'eggs_received' ? 'customButton' : undefined}
                  hideField='hideField'
                  params={params}
                  setIsOpen={setIsOpen}
                  handleDiscard={handleDiscard}
                  setEggId={(id: string | number) => setEggId(String(id))}
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
                  background: theme.palette.customColors.displaybgPrimary,
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
      width: 80,
      field: 'uid',
      headerName: 'SL.NO',
      align: 'center',
      sortable: false,
      renderCell: (params: Record<string, any>) => (
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
      sortable: false,
      field: 'species',
      headerName: t('navigation.species'),
      renderCell: (params: Record<string, any>) => (
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

    {
      width: 200,
      sortable: false,
      field: 'egg_identifier',
      headerName: t('egg_module.egg_identifier'),
      renderCell: (params: Record<string, any>) => (
        <Box>
          {params.row.egg_number && (
            <Tooltip title={`UEID: ${params.row?.egg_number || '-'}`}>
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: '19.36px'
                }}
              >
                UEID : {params.row.egg_number ? params.row.egg_number : '-'}
              </Typography>
            </Tooltip>
          )}

          {params.row.egg_code && (
            <Tooltip title={`AEID: ${params.row?.egg_code || '-'}`}>
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
            </Tooltip>
          )}
        </Box>
      )
    },
    {
      width: 140,
      sortable: false,
      field: 'animal_sex',
      headerName: t('gender'),
      renderCell: (params: Record<string, any>) => (
        <Tooltip title={params.row?.animal_sex || ''}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '19.36px',
              textTransform: 'capitalize'
            }}
          >
            {params.row?.animal_sex}
          </Typography>
        </Tooltip>
      )
    },
    {
      width: 200,
      sortable: false,
      field: 'identifier',
      headerName: t('egg_module.identifier'),
      renderCell: (params: Record<string, any>) => (
        <Box>
          <Tooltip
            title={`${params.row.local_id_type} ${
              params.row.local_identifier_value ? `- ${params.row.local_identifier_value}` : '-'
            }`}
          >
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
          </Tooltip>
        </Box>
      )
    },
    {
      width: 200,
      field: 'animal_id',
      sortable: false,
      headerName: t('egg_module.animal_id'),
      renderCell: (params: Record<string, any>) => (
        <Box sx={{ ml: 2, display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
          {/* {console.log(params.row.animal_id)} */}
          {params.row.animal_id ? (
            <Tooltip title={`AAID: ${params.row?.animal_id || '-'}`}>
              <Typography
                style={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                AAID : {params.row.animal_id ? params.row.animal_id : '-'}
              </Typography>
            </Tooltip>
          ) : checkAddPermission() ? (
            <Typography
              style={{
                color: theme.palette?.primary?.main,
                fontSize: '16px',
                fontWeight: '500'
              }}
              onClick={e => {
                setEggId(params.row.egg_id)
                e.stopPropagation()
                setOpenCreate(true)
              }}
            >
              {t('egg_module.create_animal_id')}
            </Typography>
          ) : (
            <Typography
              style={{
                textAlign: 'center'
              }}
            >
              -
            </Typography>
          )}
        </Box>
      )
    },

    {
      width: 200,
      sortable: false,
      field: 'collected_on',
      headerName: t('collected_on'),
      renderCell: (params: Record<string, any>) => (
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
      width: 170,
      sortable: false,
      field: 'hatched_on',
      headerName: t('egg_module.hatched_on'),
      renderCell: (params: Record<string, any>) => (
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
      width: 80,
      field: 'uid',
      headerName: 'SL.NO',
      align: 'center',
      sortable: false,
      renderCell: (params: Record<string, any>) => (
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
      sortable: false,
      field: 'species',
      headerName: t('navigation.species'),
      renderCell: (params: Record<string, any>) => (
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
      headerName: t('egg_module.egg_identifier'),
      renderCell: (params: Record<string, any>) => (
        <Box>
          {params.row.egg_number && (
            <Tooltip title={`UEID: ${params.row?.egg_number || '-'}`}>
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: '19.36px'
                }}
              >
                UEID : {params.row.egg_number ? params.row.egg_number : '-'}
              </Typography>
            </Tooltip>
          )}

          {params.row.egg_code && (
            <Tooltip title={`AEID: ${params.row?.egg_code || '-'}`}>
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
            </Tooltip>
          )}
        </Box>
      )
    },
    {
      width: 200,
      sortable: false,
      field: 'stage_state',
      headerName: t('egg_module.state_stage'),
      renderCell: (params: Record<string, any>) => (
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
      width: 110,
      sortable: false,
      field: 'days_in_incubation',
      headerName: t('egg_module.days_in_incubation'),
      align: 'left',
      renderHeader: () => (
        <Box>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: theme.palette.customColors.OnSecondaryContainer,
              fontWeight: 500
            }}
          >
            {t('egg_module.days_in')}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: theme.palette.customColors.OnSecondaryContainer,
              fontWeight: 500
            }}
          >
            {t('egg_module.incubation')}
          </Typography>
        </Box>
      ),
      renderCell: (params: Record<string, any>) => (
        <Tooltip title={params.row.days_in_incubation ? params.row.days_in_incubation : '-'}>
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
        </Tooltip>
      )
    },

    {
      width: 150,
      sortable: false,
      field: 'initial_weight',
      headerName: 'Initial weight in gm',
      renderHeader: () => (
        <Box>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: theme.palette.customColors.OnSecondaryContainer,
              fontWeight: 500
            }}
          >
            {t('egg_module.initial_weight')}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: theme.palette.customColors.OnSecondaryContainer,
              fontWeight: 500,
              textAlign: 'center'
            }}
          >
            IN GM
          </Typography>
        </Box>
      ),
      align: 'center',
      renderCell: (params: Record<string, any>) => (
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
      width: 150,
      sortable: false,
      field: 'current_weight',
      headerName: 'current weight in gm',
      align: 'center',
      renderHeader: () => (
        <Box>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: theme.palette.customColors.OnSecondaryContainer,
              fontWeight: 500
            }}
          >
            {t('egg_module.current_weight')}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: theme.palette.customColors.OnSecondaryContainer,
              fontWeight: 500,
              textAlign: 'center'
            }}
          >
            IN GM
          </Typography>
        </Box>
      ),

      renderCell: (params: Record<string, any>) => (
        <Tooltip
          title={
            <>
              <span>{params.row.current_weight ? params.row.current_weight : '-'}</span>
              <span> | </span>
              <span style={{ color: theme.palette.success.main }}>
                {!isNaN(parseFloat(calculatePercentageChange(params.row.initial_weight, params.row.current_weight))) &&
                calculatePercentageChange(params.row.initial_weight, params.row.current_weight) !== '0'
                  ? `${parseFloat(
                      parseFloat(
                        calculatePercentageChange(params.row.initial_weight, params.row.current_weight)
                      ).toFixed(3)
                    )}%`
                  : ''}
              </span>
            </>
          }
          placement='top'
        >
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {params.row.current_weight ? params.row.current_weight : '-'}{' '}
            {!isNaN(parseFloat(calculatePercentageChange(params.row.initial_weight, params.row.current_weight))) &&
              calculatePercentageChange(params.row.initial_weight, params.row.current_weight) !== '0' && (
                <span
                  style={{
                    borderLeft: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    paddingLeft: 4,
                    color:
                      parseFloat(calculatePercentageChange(params.row.initial_weight, params.row.current_weight)) > 0
                        ? theme.palette.primary.main
                        : theme.palette.formContent?.tertiary || theme.palette.primary.main
                  }}
                >
                  {parseFloat(
                    parseFloat(calculatePercentageChange(params.row.initial_weight, params.row.current_weight)).toFixed(
                      3
                    )
                  )}
                  %
                </span>
              )}
          </Typography>
        </Tooltip>
      )
    },
    {
      width: 130,
      sortable: false,
      field: 'initial_length',
      headerName: 'Length in mm ',
      align: 'center',
      renderCell: (params: Record<string, any>) => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.initial_length ? parseFloat(parseFloat(params.row.initial_length).toFixed(3)) : '-'}
        </Typography>
      )
    },
    {
      width: 130,
      sortable: false,
      field: 'initial_width',
      headerName: 'width in mm',
      align: 'center',
      renderCell: (params: Record<string, any>) => (
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
      width: 130,
      sortable: false,
      field: 'no_of_eggs_in_clutch',
      headerName: 'No Eggs / Clutch',
      renderHeader: () => (
        <Box>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: theme.palette.customColors.OnSecondaryContainer,
              fontWeight: 500
            }}
          >
            NO.EGG /
          </Typography>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: theme.palette.customColors.OnSecondaryContainer,
              fontWeight: 500
            }}
          >
            {t('egg_module.clutch')}
          </Typography>
        </Box>
      ),
      renderCell: (params: Record<string, any>) => (
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
      width: 130,
      sortable: false,
      field: 'clutch_id',
      headerName: 'Clutch Id',
      renderCell: (params: Record<string, any>) => (
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
      width: 130,
      sortable: false,
      field: 'enclosure_name',
      headerName: t('enclosure'),
      renderCell: (params: Record<string, any>) => (
        <Tooltip title={params.row.enclosure_name ? params.row.enclosure_name : '-'}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {params.row.enclosure_name ? params.row.enclosure_name : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      width: 150,
      sortable: false,
      field: 'site',
      headerName: t('egg_module.site_name'),
      renderCell: (params: Record<string, any>) => (
        <Tooltip title={params.row.site_name ? params.row.site_name : '-'}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {params.row.site_name ? params.row.site_name : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      width: 150,
      sortable: false,
      field: 'nursery_name',
      headerName: t('egg_module.nursery_name'),
      renderCell: (params: Record<string, any>) => (
        <Tooltip title={params.row.nursery_name ? params.row.nursery_name : '-'}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              ml: 3
            }}
          >
            {params.row.nursery_name ? params.row.nursery_name : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      width: 130,
      sortable: false,
      field: 'collected_on',
      headerName: t('collected_on'),
      renderCell: (params: Record<string, any>) => (
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
      field: 'allocated_by',
      headerName: t('allocated_by'),
      renderCell: (params: Record<string, any>) => (
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
                background: theme.palette.customColors.displaybgPrimary,
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
                  lineHeight: '16.94px',
                  mb: 0.7
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
      width: 80,
      field: 'uid',
      headerName: 'SL.NO',
      align: 'center',
      sortable: false,
      renderCell: (params: Record<string, any>) => (
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
      sortable: false,
      field: 'species',
      headerName: t('navigation.species'),
      renderCell: (params: Record<string, any>) => (
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
      headerName: t('egg_module.egg_identifier'),
      renderCell: (params: Record<string, any>) => (
        <Box>
          {params.row.egg_code && (
            <Tooltip title={`AEID: ${params.row?.egg_code || '-'}`}>
              <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,

                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: '19.36px'
                }}
              >
                AEID : {params.row.egg_code ? params.row.egg_code : '-'}
              </Typography>
            </Tooltip>
          )}
          {params.row.egg_number && (
            <Tooltip title={`UEID: ${params.row?.egg_number || '-'}`}>
              <Typography
                sx={{
                  color: theme.palette.customColors.neutralSecondary,
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: '19.36px'
                }}
              >
                UEID : {params.row.egg_number ? params.row.egg_number : '-'}
              </Typography>
            </Tooltip>
          )}
        </Box>
      )
    },
    {
      width: 180,
      field: 'discard_request_id',
      sortable: false,
      headerName: t('egg_module.batch_details'),
      renderCell: (params: Record<string, any>) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Tooltip title={params.row?.discard_request_id ? params.row?.discard_request_id : '-'}>
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
              {params.row.discard_request_id || '-'}
            </Typography>
          </Tooltip>
          <Tooltip
            title={
              params.row?.discarded_at
                ? `${params.row.discarded_at ? Utility.convertUtcToLocalReadableDate(params.row.discarded_at) : '-'} |
              ${params.row.discarded_at ? Utility.convertUTCToLocaltime(params.row.discarded_at) : '-'}`
                : '-'
            }
          >
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: '400',
                lineHeight: '19.36px',
                color: theme.palette.customColors.neutralSecondary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2, // Limit to 2 lines
                WebkitBoxOrient: 'vertical',
                whiteSpace: 'normal', // Ensure wrapping happens
                wordBreak: 'break-word' // Handle long words breaking into the next line
              }}
            >
              {params.row.discarded_at ? Utility.convertUtcToLocalReadableDate(params.row.discarded_at) : '-'} |{' '}
              {params.row.discarded_at ? Utility.convertUTCToLocaltime(params.row.discarded_at) : '-'}
            </Typography>
          </Tooltip>
        </Box>
      )
    },
    {
      width: 160,
      field: 'reason',
      sortable: false,
      headerName: t('reason'),
      renderCell: (params: Record<string, any>) => (
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
      )
    },
    {
      width: 160,
      field: 'nursery_name',
      sortable: false,
      headerName: t('navigation.nursery'),
      renderCell: (params: Record<string, any>) => (
        <Tooltip title={params.row?.nursery_name ? params.row?.nursery_name : '-'}>
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
            {params.row.nursery_name || '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      width: 160,
      sortable: false,
      field: 'collected_on',
      headerName: t('collected_on'),
      renderCell: (params: Record<string, any>) => (
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
      headerName: t('egg_module.sample_taken'),
      renderCell: (params: Record<string, any>) => (
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
      headerName: t('egg_module.necropsy_report'),
      align: 'left',
      renderCell: (params: Record<string, any>) => (
        <>
          {params.row.necropsy_file_uploaded === '1' || params.row.is_sample_collected === '1' ? (
            <Typography sx={{ fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 2 }}>
              Yes <Icon icon='pepicons-pencil:file' fontSize={'24px'} />
            </Typography>
          ) : params.row.is_necropsy_needed === '1' ? (
            <Button
              sx={{ color: theme.palette.customColors.addPrimary, ml: -3 }}
              onClick={e => handleOpenNecropsy(e, params)}
            >
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
      headerName: t('egg_module.initiated_by'),
      renderCell: (params: Record<string, any>) => (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar
              variant='square'
              alt='Medicine Image'
              sx={{
                width: 30,
                height: 30,

                borderRadius: '50%',
                background: theme.palette.customColors.displaybgPrimary,
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
                {params.row.discarded_date
                  ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.discarded_date))
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
      width: 70,
      field: 'uid',
      headerName: 'SL.NO',
      align: 'center',
      sortable: false,
      renderCell: (params: Record<string, any>) => (
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
      sortable: false,
      field: 'species',
      headerName: t('navigation.species'),
      renderCell: (params: Record<string, any>) => (
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
      headerName: t('egg_module.egg_identifier'),
      renderCell: (params: Record<string, any>) => (
        <Box>
          {params.row.egg_number && (
            <Tooltip title={`UEID: ${params.row?.egg_number || '-'}`}>
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: '19.36px'
                }}
              >
                UEID : {params.row.egg_number ? params.row.egg_number : '-'}
              </Typography>
            </Tooltip>
          )}

          {params.row.egg_code && (
            <Tooltip title={`AEID: ${params.row?.egg_code || '-'}`}>
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
            </Tooltip>
          )}
        </Box>
      )
    },
    {
      width: 160, // Adjust based on desired cell width
      field: 'reason',
      sortable: false,
      headerName: t('reason'),
      renderCell: (params: Record<string, any>) => (
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
      headerName: t('collected_on'),
      renderCell: (params: Record<string, any>) => (
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
      headerName: t('egg_module.site_name'),
      renderCell: (params: Record<string, any>) => (
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
      width: 200,
      sortable: false,
      field: 'initiated_by',
      headerName: t('egg_module.initiated_by'),
      renderCell: (params: Record<string, any>) => (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar
              variant='square'
              alt='Medicine Image'
              sx={{
                width: 30,
                height: 30,

                borderRadius: '50%',
                background: theme.palette.customColors.displaybgPrimary,
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
  ]

  const handleAction = (event: React.MouseEvent<HTMLElement>, params: Record<string, any>): void => {
    event.stopPropagation()
    setOpenDrawer(true)
    setAllocationValues(params?.row)
    setEggId(params?.row?.egg_id)
  }

  const onCellClick = (params: Record<string, any>): void => {
    const target = (params as any)?._event?.target as HTMLElement | null
    if (target && target.closest?.('.MuiDataGrid-checkboxInput')) {
      return // Do nothing if the click is on the checkbox
    }

    if (params) {
      const data = params.row

      const values: Record<string, any> = {
        tab_Value: status,
        subTab_value: isDiscarded,
        page_value: paginationModel?.page,
        search_value: search_value ? search_value : '',
        filter_list: JSON.stringify(filterList),
        selected_options: JSON.stringify(selectedOptions),
        selected_filters_options: JSON.stringify(selectedFiltersOptions)
      }

      router.push({
        pathname: `/egg/eggs/${data?.id}`,
        query: {
          ...values
        }
      })
    } else {
      return
    }
  }

  const TabBadge: React.FC<{ label: string; totalCount?: number | null }> = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  function loadServerRows(currentPage: number, data: Record<string, any>[]): Record<string, any>[] {
    return data
  }

  const handleChange = (event: React.SyntheticEvent, newValue: string): void => {
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
        pathname: router.pathname,
        query: {
          ...router.query,
          tab_Value: newValue,
          search_value: '',
          page_value: 0,
          filter_list: '',
          selected_options: '',
          selected_filters_options: ''
        }
      } as any
    )
  }

  const handleTabs = (event: React.SyntheticEvent, newValue: string): void => {
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
        pathname: router.pathname,
        query: {
          ...router.query,
          subTab_value: newValue,
          search_value: '',
          page_value: 0,
          filter_list: '',
          selected_options: '',
          selected_filters_options: ''
        }
      } as any
    )
  }

  // console.log('tab_Value', tab_Value)
  // console.log('subTab_value', subTab_value)

  const fetchTableData = useCallback(
    async (
      sort: string,
      search: string,
      statusRecived?: string,
      discardedTab?: string,
      selectedFiltersOptions: Record<string, any> = {},
      filterByNurseryId?: string
    ) => {
      // debugger
      try {
        setLoading(true)

        // Extracting IDs from selectedFiltersOptions
        // const nurseryIds = selectedFiltersOptions.Nursery?.map(option => option.id) || []
        const eggStateIds = selectedFiltersOptions.Stage?.map((option: any) => option.id) || []

        // const eggStatusIds = selectedFiltersOptions.EggStatus?.map((option: any) => option.id) ||""
        // const collectedByIds = selectedFiltersOptions['Collected By']?.id || ''
        const collectedByIds =
          tab_Value === 'eggs_ready_to_be_discarded_at_nursery'
            ? selectedFiltersOptions['Discarded By']?.map((option: any) => option.id) || []
            : tab_Value === 'eggs_discarded'
            ? selectedFiltersOptions['Discarded By']?.map((option: any) => option.id) || []
            : selectedFiltersOptions['Collected By']?.map((option: any) => option.id) || []
        const siteIds = selectedFiltersOptions.Site?.map((option: any) => option.id) || []
        const statusId = selectedFiltersOptions.status?.id ? [selectedFiltersOptions.status?.id] : ''

        const collectedDate = selectedFiltersOptions.collected_date
          ? dayjs(selectedFiltersOptions.collected_date).format('YYYY-MM-DD')
          : ''

        // console.log('status', status)
        // console.log('first')
        // console.log('isDiscarded', isDiscarded)
        const params = {
          sort,
          q: search ? search : '',
          sorting_by_date: 'latest_date',
          page_no: paginationModel?.page + 1,
          limit: paginationModel?.pageSize,

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

          // ...(tab_Value === 'eggs_ready_to_be_discarded_at_nursery'
          //   ? { discarded_date: collectedDate || '' }
          //   : subTab_value === 'eggs_discarded_at_nursery'
          //   ? { discarded_date: collectedDate || '' }
          //   : { collected_date: collectedDate || '' }),

          ...(status === 'eggs_ready_to_be_discarded_at_nursery' || status === 'eggs_discarded'
            ? { discarded_date: collectedDate || '' }
            : { collected_date: collectedDate || '' }),

          type:
            statusRecived === undefined
              ? status === 'eggs_discarded'
                ? isDiscarded
                : status
              : statusRecived === 'eggs_discarded'
              ? discardedTab
              : statusRecived
        }

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
        console.error(error)
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

  const getSlNo = (index: number): number => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row?.egg_id,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = (newModel: readonly { sort?: string | null; field?: string }[]): void => {
    if (newModel.length && newModel[0].sort) {
      setSort(newModel[0].sort)
    }
  }
  const searchTableData = useCallback(
    debounce(async (sort: string, q: string, status: string, isDiscarded: string): Promise<void> => {
      setSearchValue(q)
      try {
        await fetchTableData(
          sort,
          q,
          status,
          isDiscarded,
          selectedFiltersOptions,
          filterByNurseryId
        )
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    [fetchTableData, selectedFiltersOptions, filterByNurseryId]
  )

  const fetchNurseryOptions = useCallback(async (query: string = '') => {
    setNurseryLoading(true)
    try {
      const params = {
        search: query,
        page: 1,
        limit: 50
      }
      const res = await GetNurseryList({ params })
      const apiList = res?.data?.result || []
      const sanitizedList = apiList.filter((option: any) => option?.nursery_id !== '')

      setNurseryList([ALL_NURSERY_OPTION, ...sanitizedList])
    } catch (error) {
      console.error(error)
    } finally {
      setNurseryLoading(false)
    }
  }, [])

  const debouncedFetchNurseryOptions = useMemo(
    () =>
      debounce((value: string): void => {
        fetchNurseryOptions(value)
      }, 400),
    [fetchNurseryOptions]
  )

  useEffect(() => {
    fetchNurseryOptions('')

    return () => {
      debouncedFetchNurseryOptions.clear()
    }
  }, [fetchNurseryOptions, debouncedFetchNurseryOptions])

  const headerAction = (
    <>
      <Box>
        <Autocomplete
          sx={{
            width: 250,
            ml: 5
          }}
          value={defaultNursery}
          disablePortal
          id='nursery'
          onInputChange={(event: React.SyntheticEvent, newInputValue: string, reason: any): void => {
            if (reason === 'input') {
              debouncedFetchNurseryOptions(newInputValue)
            } else if (reason === 'clear') {
              fetchNurseryOptions('')
            }
          }}
          loading={nurseryLoading}
          options={nurseryList?.length > 0 ? nurseryList : []}
          getOptionLabel={(option: any): string => option.nursery_name}
          isOptionEqualToValue={(option, value) => option.nursery_id === value.nursery_id}
          onChange={(e: React.SyntheticEvent<Element, Event>, val: Record<string, any> | null): void => {
            if (!val || val.nursery_id === '') {
              setDefaultNursery(ALL_NURSERY_OPTION)
              setFilterByNurseryId('')

              return
            }

            setDefaultNursery(val)
            setFilterByNurseryId(val.nursery_id || '')
          }}
          renderInput={(params: Record<string, any>) => (
            <TextField
              {...params}
              label={`${t('egg_module.select_nursery')} *`}
              placeholder='Search & Select'
              InputProps={{
                ...(params.InputProps || {}),
                endAdornment: (
                  <>
                    {nurseryLoading ? <CircularProgress size={20} /> : null}
                    {params.InputProps?.endAdornment}
                  </>
                )
              }}
            />
          )}
        />
      </Box>
    </>
  )

  const handleSearch = (value: string): void => {
    setSearchValue(value)
    searchTableData(sort, value, status, isDiscarded) as any
  }

  const handleSelectionModelChange = (newSelectionModel: Array<string | number>): void => {
    setSelectionEggModel(newSelectionModel)
  }

  const handleOpenNecropsy = (e: React.MouseEvent<HTMLElement>, params: Record<string, any>): void => {
    e.stopPropagation()
    setEggId(params?.row?.egg_id)
    setOpenNecropsy(true)
  }

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

  const tableData = (): React.ReactNode => {
    return (
      <>
        {loader ? (
          // @ts-ignore - FallbackSpinner component type mismatch (external library)
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
                  data={indexedRows}
                  loading={loading}
                  filterByNurseryId={filterByNurseryId}
                  tableSearch={searchValue}
                />

                <CommonTable
                  externalTableStyle={{
                    paddingX: 4,
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
                  rowHeight={72}
                  onCellClick={onCellClick}
                  indexedRows={indexedRows === undefined ? [] : indexedRows}
                  total={total}
                  columns={(status === 'eggs_hatched' ? hatchedColumn : status === 'eggs_received' ? received : columns) as any}
                  paginationModel={paginationModel}
                  handleSortModel={handleSortModel}
                  setPaginationModel={setPaginationModel}
                  loading={loading}
                  searchValue={searchValue}
                  maxHeight='70vh'
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
                    data={indexedRows}
                    loading={loading}
                    filterByNurseryId={filterByNurseryId}
                    tableSearch={searchValue}
                  />

                  <CommonTable
                    externalTableStyle={{ paddingX: 4 }}
                    indexedRows={indexedRows || []}
                    total={total}
                    columns={(ready_to_discard || []) as any}
                    paginationModel={paginationModel}
                    handleSortModel={handleSortModel}
                    setPaginationModel={setPaginationModel}
                    rowHeight={72}
                    loading={loading}
                    searchValue={searchValue}
                    maxHeight='70vh'
                    onCellClick={onCellClick}
                    checkBoxOption={true}
                    selectedRows={selectionEggModel}
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

  return (
    <>
      {egg_collection_permission ? (
        <Box>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
            <Typography color='inherit' sx={{ cursor: 'pointer' }}>
              {t('egg_module.egg')}
            </Typography>

            <Typography
              sx={{
                color: 'text.primary',
                cursor: 'pointer'
              }}
            >
              {t('egg_module.egg_list')}
            </Typography>
          </Breadcrumbs>
          <Card>
            <CardHeader title={t('egg_module.egg_list')} action={headerAction} />

            {/* <CardContent> */}
            <TabContext value={status}>
              <TabList onChange={handleChange} sx={{ px: 2 }}>
                <Tab value='eggs_received' label='Received' />
                <Tab value='eggs_incubation' label='Incubation' />
                <Tab value='eggs_hatched' label='Hatched' />
                <Tab value='eggs_ready_to_be_discarded_at_nursery' label={<TabBadge label='To Be Discarded' />}></Tab>
                <Tab value='eggs_discarded' label='Discarded' />
                <Tab value='all' label='All' />
              </TabList>
              <TabPanel value='eggs_received' sx={{ p: 0 }}>
                {' '}
                <Divider />
                {tableData()}
              </TabPanel>
              <TabPanel value='eggs_incubation' sx={{ p: 0 }}>
                {' '}
                <Divider />
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
                    data={indexedRows}
                    loading={loading}
                    filterByNurseryId={filterByNurseryId}
                    tableSearch={searchValue}
                  />
                  <CommonTable
                    onCellClick={onCellClick}
                    indexedRows={indexedRows || []}
                    total={total}
                    columns={(incubationColumns || []) as any}
                    rowHeight={72}
                    paginationModel={paginationModel}
                    handleSortModel={handleSortModel}
                    setPaginationModel={setPaginationModel}
                    loading={loading}
                    searchValue={searchValue}
                    maxHeight='70vh'
                    externalTableStyle={{ mx: 0, paddingX: 4 }}
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
                <TabContext value={isDiscarded}>
                  <TabList onChange={handleTabs} sx={{ px: 2 }}>
                    <Tab value='eggs_discarded' label={<TabBadge label='Batch Discarded ' />} />
                    <Tab value='eggs_discarded_at_nursery' label={<TabBadge label='Discarded' />} />
                  </TabList>

                  <TabPanel value='eggs_discarded' sx={{ p: 0 }}>
                    {' '}
                    <>
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
                        filterByNurseryId={filterByNurseryId}
                      />
                    </>
                  </TabPanel>
                  <TabPanel
                    sx={{ p: 0 }}
                    value='eggs_discarded_at_nursery'
                  >
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
                        data={indexedRows}
                        loading={loading}
                        filterByNurseryId={filterByNurseryId}
                        tableSearch={searchValue}
                      />

                      <CommonTable
                        externalTableStyle={{ paddingX: 4 }}
                        indexedRows={indexedRows || []}
                        total={total}
                        columns={(discarded_Egg_Columns || []) as any}
                        paginationModel={paginationModel}
                        handleSortModel={handleSortModel}
                        setPaginationModel={setPaginationModel}
                        loading={loading}
                        rowHeight={72}
                        onCellClick={onCellClick}
                        searchValue={searchValue}
                        maxHeight='70vh'
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
          </Card>

          {openCreate && (
            <CreateAnimalSlider
              openDrawer={openCreate}
              fetchTableData={fetchTableData}
              setOpenDrawer={setOpenCreate}
              eggId={eggID}
            />
          )}

          <DiscardForm open={isOpen} onClose={() => setIsOpen(false)} eggId={eggID} onSuccess={() => fetchTableData(sort, '', 'eggs_received', isDiscarded, selectedFiltersOptions)} />
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
