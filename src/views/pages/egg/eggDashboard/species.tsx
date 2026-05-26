'use client'

import React, { FC, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { Box } from '@mui/system'
import { Autocomplete, Avatar, Fade, FormControl, Tab, TextField, Tooltip, Typography } from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import dayjs from 'dayjs'
import moment from 'moment'
import debounce from 'lodash/debounce'

import Icon from 'src/@core/components/icon'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AuthContext } from 'src/context/AuthContext'
import Utility from 'src/utility'
import DashboardSlider from '../eggs/dashboardSlider'
import DiscardEggSlider from '../eggs/discardEggSlider'
import { getSpeciesList } from 'src/lib/api/egg/dashboard'
import { GetNurseryList } from 'src/lib/api/egg/nursery'
import { getTaxonomyList } from 'src/lib/api/egg/egg/createAnimal'
import DashboardExelExportButton from './exportDasboardDataExcel'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import { useTranslation } from 'react-i18next'

interface SpeciesProps {
  openDiscard: boolean
  setOpenDiscard: (value: boolean) => void
}

const Species: FC<SpeciesProps> = ({ openDiscard, setOpenDiscard }) => {
  const authData = useContext(AuthContext)
  const theme = useTheme()
  const { t } = useTranslation()
  const [status, setStatus] = useState<string>('species')

  const [speciesList, setSpeciesList] = useState<any[]>([])
  const [exportSpeciesList, setExportSpeciesList] = useState<any[]>([])
  const [taxonomyList, setTaxonomyList] = useState<any[]>([])
  const [nurseryList, setNurseryList] = useState<any[]>([])

  const [defaultSpecies, setDefaultSpecies] = useState<any>(null)
  const [defaultSite, setDefaultSite] = useState<any>(null)
  const [defaultNursery, setDefaultNursery] = useState<any>(null)

  const [fromDate, setFromDate] = useState<any>(null)
  const [tillDate, setTillDate] = useState<any>(null)

  const [paginationModel, setPaginationModel] = useState<any>({ page: 0, pageSize: 50 })

  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [drawerHeading, setDrawerHeading] = useState<string>('')
  const [drawerHeadingCount, setDrawerHeadingCount] = useState<number>(0)
  const [drawerLoading, setDrawerLoading] = useState<boolean>(false)
  const [drawerList, setDrawerList] = useState<any[]>([])

  const [sortModel, setSortModel] = useState<any>([{ field: 'complete_name', sort: 'DESC' }])

  const [loading, setLoading] = useState<boolean>(false)
  const [total, setTotal] = useState<number>(0)

  const [searchValue, setSearchValue] = useState<string>('')

  const searchInputRef = useRef<HTMLInputElement>(null)

  const TaxonomyList = async (q?: string): Promise<void> => {
    try {
      const res = await getTaxonomyList(q ? { q } : undefined)
      if (res?.data) {
        setTaxonomyList(res.data)
      }
    } catch (error) {
      console.error('Error fetching taxonomy list:', error)
    }
  }

  const NurseryList = async (q?: string): Promise<void> => {
    try {
      const params = {
        search: q,
        page: 1,
        limit: 50
      }
      const res = await GetNurseryList({ params })
      if (res?.data?.result) {
        setNurseryList(res.data.result)
      }
    } catch (error) {
      console.error('Error fetching nursery list:', error)
    }
  }

  const useDebouncedCallback = (callback: any, delay: number) => {
    return useCallback(debounce(callback, delay), [callback, delay])
  }

  const searchTableData = useDebouncedCallback(async (status: string, q: string, fDate: any, tDate: any, ref_id?: string) => {
    setSearchValue(q)
    await getspeciesFunc(status, q, fDate, tDate, ref_id)
  }, 1000)

  const CustomTooltip: FC<any> = ({ title, children, placement = 'bottom', disableHoverListener }) => (
    <Tooltip
      disableHoverListener={disableHoverListener || false}
      slots={{
        transition: Fade
      }}
      title={
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            paddingX: '12px',
            paddingY: '8px',
            borderRadius: '4px'
          }}
        >
          {title?.map((item: any, index: number) => (
            <Typography
              key={index}
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '12px',
                fontWeight: '400',
                lineHeight: '14.52px'
              }}
            >
              {item.label}{' '}
              <span
                style={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '12px',
                  fontWeight: '600',
                  lineHeight: '14.52px'
                }}
              >
                {item.value || '-'}
              </span>
            </Typography>
          ))}
        </Box>
      }
      arrow
      placement={placement}
      slotProps={{
        tooltip: {
          sx: {
            border: '0.1px solid #C3CEC7',
            bgcolor: '#EFF5F2',
            color: 'rgba(0, 0, 0, 0.87)',
            boxShadow: 1
          }
        },
        arrow: {
          sx: {
            color: '#eff5f2'
          }
        }
      }}
    >
      {children}
    </Tooltip>
  )

  const columnSpecies = [
    {
      width: 80,
      field: 'uid',
      headerName: 'SL.NO',
      sortable: false,
      align: 'center',
      renderCell: (params: any) => (
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
      width: 280,
      sortable: true,
      field: 'species',
      headerName: t('navigation.species'),
      renderCell: (params: any) => <SpeciesCard species={{ ...params?.row, common_name: params.row?.default_common_name }} />
    },
    {
      width: 120,
      field: 'total_eggs',
      sortable: true,
      headerName: t('egg_module.total_eggs'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#0000000D'
            }
          }}
        >
          <Typography
            style={{
              width: '80%',
              cursor: status === 'species' ? 'auto' : undefined,
              color: theme.palette.primary.dark,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {params.row.total_eggs ? params.row.total_eggs : '-'}
          </Typography>
        </Box>
      )
    },
    {
      width: 160,
      field: 'hatched_percentage',
      sortable: false,
      headerName: t('egg_module.total_hatched_perc'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#37BD691A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {Number(params.row.total_hatch) + Number(params.row.total_discarded) + 0
              ? Math.round(
                (Number(params.row.total_hatch) /
                  (Number(params.row.total_hatch) + Number(params.row.total_discarded))) *
                100
              )
              : 0}
            %
          </Typography>
        </Box>
      )
    },
    {
      width: 160,
      field: 'total_hatch',
      sortable: true,
      headerName: t('egg_module.total_hatched'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#37BD691A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {params.row.total_hatch ? `${params.row.total_hatch}` : '-'}
          </Typography>
        </Box>
      )
    },

    {
      width: 140,
      field: 'total_discarded',
      sortable: true,
      headerName: t('egg_module.total_discarded'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#FA61401A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {params.row.total_discarded ? params.row.total_discarded : '-'}
          </Typography>
        </Box>
      )
    },

    {
      width: 160,
      field: 'currently_in_nest',
      sortable: true,
      renderHeader: () => (
        <Box>
          <Typography sx={{ fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            {t('egg_module.currently')}
          </Typography>

          <Typography sx={{ fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            {t('egg_module.in_nest')}
          </Typography>
        </Box>
      ),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#0000000D'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {params.row.currently_in_nest ? params.row.currently_in_nest : '-'}
          </Typography>
        </Box>
      )
    },
    {
      width: 160,
      field: 'currently_in_nursery',
      sortable: true,

      renderHeader: () => (
        <Box>
          <Typography sx={{ fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            {t('egg_module.currently')}
          </Typography>

          <Typography sx={{ fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            {t('egg_module.in_nursery')}
          </Typography>
        </Box>
      ),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,

            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#37BD691A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {params.row.currently_in_nursery ? params.row.currently_in_nursery : '-'}
          </Typography>
        </Box>
      )
    },

    {
      width: 200,
      field: 'hatched_in_nursery_percentage',
      sortable: false,
      headerName: t('egg_module.hatched_nursery_perc'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#37BD691A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {Number(params.row.hatched_in_nursery) +
              Number(params.row.discarded_at_nursery) +
              Number(params.row.ready_tobe_discarded_at_nursery) >
              0
              ? Math.round(
                (Number(params.row.hatched_in_nursery) /
                  (Number(params.row.hatched_in_nursery) +
                    Number(params.row.discarded_at_nursery) +
                    Number(params.row.ready_tobe_discarded_at_nursery))) *
                100
              )
              : 0}
            %
          </Typography>
        </Box>
      )
    },
    {
      width: 200,
      field: 'hatched_in_nursery',
      sortable: true,
      headerName: t('egg_module.hatched_in_nursery'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#37BD691A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {params.row.hatched_in_nursery ? `${params.row.hatched_in_nursery}` : '-'}
          </Typography>
        </Box>
      )
    },
    {
      width: 200,
      field: 'hatched_in_nest_percentage',
      sortable: false,
      headerName: t('egg_module.hatched_in_nest_perc'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#37BD691A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {Number(params?.row?.hatched_in_nest) +
              Number(params?.row?.discarded_at_site) +
              Number(params?.row?.ready_tobe_discarded_at_nursery) >
              0
              ? Math.round(
                (Number(params?.row?.hatched_in_nest) /
                  (Number(params?.row?.hatched_in_nest) +
                    Number(params?.row?.discarded_at_site) +
                    Number(params?.row?.ready_tobe_discarded_at_nursery))) *
                100
              )
              : 0}
            %
          </Typography>
        </Box>
      )
    },
    {
      width: 180,
      field: 'hatched_in_nest',
      sortable: true,
      headerName: t('egg_module.hatched_in_nest'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#37BD691A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {params.row.hatched_in_nest ? `${params.row.hatched_in_nest}` : '-'}
          </Typography>
        </Box>
      )
    },

    {
      width: 170,
      field: 'total_discard_at_site',
      sortable: true,
      headerName: t('egg_module.discarded_at_site'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#FA61401A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {params.row.discarded_at_site ? params.row.discarded_at_site : '-'}
          </Typography>
        </Box>
      )
    },
    {
      width: 200,
      field: 'total_discard_at_nursery',
      sortable: true,
      headerName: t('egg_module.discarded_at_nursery'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#FA61401A'
            }
          }}
        >
          <CustomTooltip
            title={[
              { label: 'Ready to be discarded at nursery :', value: params.row.ready_tobe_discarded_at_nursery },
              { label: 'Discarded at nursery:', value: params.row.discarded_at_nursery }
            ]}
          >
            <Typography
              style={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '16px',
                fontWeight: '600',
                lineHeight: '19.36px'
              }}
            >
              {Number(params?.row?.discarded_at_nursery) + Number(params?.row?.ready_tobe_discarded_at_nursery) > 0
                ? Number(params?.row?.discarded_at_nursery) + Number(params?.row?.ready_tobe_discarded_at_nursery)
                : '-'}
            </Typography>
          </CustomTooltip>
        </Box>
      )
    },

    {
      width: 120,
      field: 'in_transit',
      sortable: true,
      headerName: t('egg_module.in_transit'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#FA61401A'
            }
          }}
        >
          <CustomTooltip
            disableHoverListener={params?.row?.send_to_nursery + params.row.within_transfer_request <= 0}
            title={[
              { label: 'Send to nursery :', value: params.row.send_to_nursery },
              { label: 'With in transfer request:', value: params.row.within_transfer_request }
            ]}
          >
            <Typography
              style={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '16px',
                fontWeight: '600',
                lineHeight: '19.36px'
              }}
            >
              {params.row.in_transit ? params.row.in_transit : '-'}
            </Typography>
          </CustomTooltip>
        </Box>
      )
    }
  ]

  const columnSites = [
    {
      width: 80,
      field: 'uid',
      headerName: 'SL.NO',
      sortable: false,
      align: 'center',
      renderCell: (params: any) => (
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
      width: 320,
      sortable: true,
      field: 'sites',
      headerName: t('sites'),
      renderCell: (params: any) => (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Avatar
            variant='rounded'
            alt='Medicine Image'
            sx={{
              width: 35,
              height: 35,
              mr: 4,
              p: 1,
              objectFit: 'contain',
              borderRadius: '50%',
              background: '#E8F4F2'
            }}
          >
            <img
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              src={params.row.default_icon || '/branding/antz/Antz_logomark_h_color.svg'}
              alt='Profile'
            />
          </Avatar>
          <Tooltip title={params.row.site_name ? Utility?.toPascalSentenceCase(params.row.site_name) : '-'}>
            <Typography
              sx={{
                color: theme.palette.primary.light,
                fontSize: '16px',
                fontWeight: '500',
                lineHeight: '19.36px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '200px',
                boxSizing: 'border-box'
              }}
            >
              {params.row.site_name ? Utility?.toPascalSentenceCase(params.row.site_name) : '-'}
            </Typography>
          </Tooltip>
        </Box>
      )
    },
    {
      width: 160,
      field: 'total_eggs',
      sortable: true,
      headerName: t('egg_module.total_eggs'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#0000000D'
            }
          }}
        >
          <Typography
            onClick={(e: any) => {
              e.stopPropagation()
              getdrawerspeciesFunc(params.row.site_id)
              setDrawerHeading(params.row.site_name)
              status != 'species' && setOpenDrawer(true)
            }}
            style={{
              width: '80%',
              cursor: status === 'species' ? 'auto' : undefined,
              color: theme.palette.primary.dark,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {params.row.total_eggs ? params.row.total_eggs : '-'}
          </Typography>
        </Box>
      )
    },

    {
      width: 160,
      field: 'hatched_percentage',
      sortable: false,
      headerName: t('egg_module.total_hatched_perc'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#37BD691A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {Number(params?.row?.total_hatch) + Number(params?.row?.total_discarded) > 0
              ? Math.round(
                (Number(params?.row?.total_hatch) /
                  (Number(params?.row?.total_hatch) + Number(params?.row?.total_discarded))) *
                100
              )
              : 0}
            %
          </Typography>
        </Box>
      )
    },
    {
      width: 160,
      field: 'total_hatch',
      sortable: true,
      headerName: t('egg_module.total_hatched'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#37BD691A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {params?.row?.total_hatch ? `${params?.row?.total_hatch}` : '-'}
          </Typography>
        </Box>
      )
    },

    {
      width: 160,
      field: 'total_discarded',
      sortable: true,
      headerName: t('egg_module.total_discarded'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#FA61401A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {params.row.total_discarded ? params.row.total_discarded : '-'}
          </Typography>
        </Box>
      )
    },

    {
      width: 160,
      field: 'currently_in_nest',
      sortable: true,
      renderHeader: () => (
        <Box>
          <Typography sx={{ fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            {t('egg_module.currently')}
          </Typography>

          <Typography sx={{ fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            {t('egg_module.in_nest')}
          </Typography>
        </Box>
      ),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#0000000D'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {params.row.currently_in_nest ? params.row.currently_in_nest : '-'}
          </Typography>
        </Box>
      )
    },
    {
      width: 160,
      field: 'currently_in_nursery',
      sortable: true,

      renderHeader: () => (
        <Box>
          <Typography sx={{ fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            {t('egg_module.currently')}
          </Typography>

          <Typography sx={{ fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            {t('egg_module.in_nursery')}
          </Typography>
        </Box>
      ),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,

            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#37BD691A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {params.row.currently_in_nursery ? params.row.currently_in_nursery : '-'}
          </Typography>
        </Box>
      )
    },

    {
      width: 200,
      field: 'hatched_in_nursery_percentage',
      sortable: false,
      headerName: t('egg_module.hatched_nursery_perc'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#37BD691A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {Number(params?.row?.hatched_in_nursery) +
              Number(params?.row?.discarded_at_nursery) +
              Number(params?.row?.ready_tobe_discarded_at_nursery) >
              0
              ? Math.round(
                (Number(params?.row?.hatched_in_nursery) /
                  (Number(params?.row?.hatched_in_nursery) +
                    Number(params?.row?.discarded_at_nursery) +
                    Number(params?.row?.ready_tobe_discarded_at_nursery))) *
                100
              )
              : 0}
            %
          </Typography>
        </Box>
      )
    },
    {
      width: 200,
      field: 'hatched_in_nursery',
      sortable: true,
      headerName: t('egg_module.hatched_in_nursery'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#37BD691A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {params.row.hatched_in_nursery ? `${params.row.hatched_in_nursery}` : '-'}
          </Typography>
        </Box>
      )
    },
    {
      width: 180,
      field: 'hatched_in_Nest_percentage',
      sortable: false,
      headerName: t('egg_module.hatched_in_nest_perc'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#37BD691A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {Number(params?.row?.hatched_in_nest) +
              Number(params?.row?.discarded_at_site) +
              Number(params?.row?.ready_tobe_discarded_at_site) >
              0
              ? Math.round(
                (Number(params?.row?.hatched_in_nest) /
                  (Number(params?.row?.hatched_in_nest) +
                    Number(params?.row?.discarded_at_site) +
                    Number(params?.row?.ready_tobe_discarded_at_site))) *
                100
              )
              : 0}
            %
          </Typography>
        </Box>
      )
    },
    {
      width: 180,
      field: 'hatched_in_nest',
      sortable: true,
      headerName: t('egg_module.hatched_in_nest'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#37BD691A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {params.row.hatched_in_nest ? `${params.row.hatched_in_nest}` : '-'}
          </Typography>
        </Box>
      )
    },

    {
      width: 170,
      field: 'total_discard_at_site',
      sortable: true,
      headerName: t('egg_module.discarded_at_site'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#FA61401A'
            }
          }}
        >
          <CustomTooltip
            title={[
              { label: 'Ready to be discarded at nursery :', value: params?.row?.ready_tobe_discarded_at_site },
              { label: 'Discarded at nursery:', value: params?.row?.discarded_at_site }
            ]}
          >
            <Typography
              style={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '16px',
                fontWeight: '600',
                lineHeight: '19.36px'
              }}
            >
              {Number(params?.row?.discarded_at_site) + Number(params?.row?.ready_tobe_discarded_at_site) > 0
                ? Number(params?.row?.discarded_at_site) + Number(params?.row?.ready_tobe_discarded_at_site)
                : '-'}
            </Typography>
          </CustomTooltip>
        </Box>
      )
    },
    {
      width: 200,
      field: 'total_discard_at_nursery',
      sortable: true,
      headerName: t('egg_module.discarded_at_nursery'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#FA61401A'
            }
          }}
        >
          <CustomTooltip
            title={[
              { label: 'Ready to be discarded at nursery :', value: params?.row?.ready_tobe_discarded_at_nursery },
              { label: 'Discarded at nursery:', value: params?.row?.discarded_at_nursery }
            ]}
          >
            <Typography
              style={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '16px',
                fontWeight: '600',
                lineHeight: '19.36px'
              }}
            >
              {Number(params?.row?.discarded_at_nursery) + Number(params?.row?.ready_tobe_discarded_at_nursery) > 0
                ? Number(params?.row?.discarded_at_nursery) + Number(params?.row?.ready_tobe_discarded_at_nursery)
                : '0'}
            </Typography>
          </CustomTooltip>
        </Box>
      )
    },

    {
      width: 120,
      field: 'in_transit',
      sortable: true,
      headerName: t('egg_module.in_transit'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#FA61401A'
            }
          }}
        >
          <CustomTooltip
            title={[
              { label: 'Send to nursery :', value: params.row.send_to_nursery },
              { label: 'With in transfer request:', value: params.row.within_transfer_request }
            ]}
          >
            <Typography
              style={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '16px',
                fontWeight: '600',
                lineHeight: '19.36px'
              }}
            >
              {params.row.in_transit ? params.row.in_transit : '-'}
            </Typography>
          </CustomTooltip>
        </Box>
      )
    }
  ]

  const columnNurseries = [
    {
      width: 80,
      field: 'uid',
      headerName: 'SL.NO',
      sortable: false,
      align: 'center',
      renderCell: (params: any) => (
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
      width: 340,
      sortable: true,
      field: 'nursery',
      headerName: t('egg_module.nurseries'),
      renderCell: (params: any) => (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Avatar
            variant='rounded'
            alt='Medicine Image'
            sx={{
              width: 35,
              height: 35,
              mr: 4,
              p: 1,
              objectFit: 'contain',
              borderRadius: '50%',
              background: '#E8F4F2'
            }}
          >
            <img
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              src={params.row.default_icon || '/branding/antz/Antz_logomark_h_color.svg'}
              alt='Profile'
            />
          </Avatar>

          <Tooltip title={params.row.nursery_name ? Utility?.toPascalSentenceCase(params.row.nursery_name) : '-'}>
            <Typography
              sx={{
                color: theme.palette.primary.light,
                fontSize: '16px',
                fontWeight: '500',
                lineHeight: '19.36px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '200px',
                boxSizing: 'border-box'
              }}
            >
              {params.row.nursery_name ? Utility?.toPascalSentenceCase(params.row.nursery_name) : '-'}
            </Typography>
          </Tooltip>
        </Box>
      )
    },
    {
      width: 180,
      field: 'total_eggs',
      sortable: true,
      headerName: t('egg_module.total_eggs'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#0000000D'
            }
          }}
        >
          <Typography
            onClick={(e: any) => {
              e.stopPropagation()
              getdrawerspeciesFunc(params.row.nursery_id)
              setDrawerHeading(params.row.nursery_name)
              status != 'species' && setOpenDrawer(true)
            }}
            style={{
              width: '80%',
              cursor: status === 'species' ? 'auto' : undefined,
              color: theme.palette.primary.dark,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {params.row.total_eggs ? params.row.total_eggs : '-'}
          </Typography>
        </Box>
      )
    },

    {
      width: 200,
      field: 'currently_in_incubator',
      sortable: true,
      headerName: t('egg_module.currently_in_incubator'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,

            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#37BD691A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {params.row.currently_in_incubator ? params.row.currently_in_incubator : '-'}
          </Typography>
        </Box>
      )
    },
    {
      width: 160,
      field: 'currently_in_nursery',
      sortable: true,
      renderHeader: () => (
        <Box>
          <Typography sx={{ fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            {t('egg_module.currently')}
          </Typography>

          <Typography sx={{ fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            {t('egg_module.in_nursery')}
          </Typography>
        </Box>
      ),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,

            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#37BD691A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {params.row.currently_in_nursery ? params.row.currently_in_nursery : '-'}
          </Typography>
        </Box>
      )
    },
    {
      width: 200,
      field: 'hatched_in_nursery_percentage',
      sortable: false,
      headerName: t('egg_module.hatched_nursery_perc'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#37BD691A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {Number(params.row.hatched_in_nursery) +
              Number(params.row.discarded_at_nursery) +
              Number(params.row.ready_tobe_discarded_at_nursery) >
              0
              ? Math.round(
                (Number(params.row.hatched_in_nursery) /
                  (Number(params.row.hatched_in_nursery) +
                    Number(params.row.discarded_at_nursery) +
                    Number(params.row.ready_tobe_discarded_at_nursery))) *
                100
              )
              : 0}
            %
          </Typography>
        </Box>
      )
    },
    {
      width: 200,
      field: 'hatched_in_nursery',
      sortable: true,
      headerName: t('egg_module.hatched_in_nursery'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#37BD691A'
            }
          }}
        >
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {params.row.hatched_in_nursery ? `${params.row.hatched_in_nursery}` : '-'}
          </Typography>
        </Box>
      )
    },
    {
      width: 200,
      field: 'total_discard_at_nursery',
      sortable: true,
      headerName: t('egg_module.discarded_at_nursery'),
      renderCell: (params: any) => (
        <Box
          sx={{
            width: '100%',
            height: 40,
            borderRadius: '4px',
            paddingLeft: 2,
            alignContent: 'center',
            '&:hover': {
              backgroundColor: '#FA61401A'
            }
          }}
        >
          <CustomTooltip
            title={[
              { label: 'Ready to be discarded at nursery :', value: params?.row?.ready_tobe_discarded_at_nursery },
              { label: 'Discarded at nursery:', value: params?.row?.discarded_at_nursery }
            ]}
          >
            <Typography
              style={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '16px',
                fontWeight: '600',
                lineHeight: '19.36px'
              }}
            >
              {Number(params?.row?.discarded_at_nursery) + Number(params?.row.ready_tobe_discarded_at_nursery) > 0
                ? Number(params?.row?.discarded_at_nursery) + Number(params?.row.ready_tobe_discarded_at_nursery)
                : '0'}
            </Typography>
          </CustomTooltip>
        </Box>
      )
    }
  ]

  const getIdBasedOnStatus = (): string => {
    return status === 'species'
      ? ''
      : status === 'site'
        ? defaultSite?.site_id
        : status === 'nursery'
          ? defaultNursery?.nursery_id
          : ''
  }

  const handleChange = (event: any, newValue: string): void => {
    setTotal(0)
    setPaginationModel({ page: 0, pageSize: 50 })
    setStatus(newValue)
    setSearchValue('')
    setTillDate(null)
    setFromDate(null)
    setDefaultSite(null)
    setDefaultNursery(null)
  }

  function loadServerRows(currentPage: number, data: any[]): any[] {
    return data
  }

  const getSlNo = (index: number): number => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1
  const indexedRows = speciesList?.map((row: any, index: any) => ({ ...row, sl_no: getSlNo(index) }))

  const getdrawerspeciesFunc = async (ref_id?: string): Promise<void> => {
    try {
      setDrawerLoading(true)

      const params = {
        ref_type: 'species',
        q: '',
        [status === 'site' ? 'site_id' : 'nursery_id']: ref_id
      }

      const res = await getSpeciesList(params)

      if (res?.data?.success) {
        const data = res?.data?.data
        setDrawerHeadingCount(parseInt(data?.total_count || 0, 10))
        setDrawerList(data?.result)
      } else {
        setDrawerList([])
      }
    } catch (error) {
      console.error('Error fetching species:', error)
    } finally {
      setDrawerLoading(false)
    }
  }

  const getspeciesFunc = useCallback(
    async (statuss: string, q: string, fDate: any, tDate: any, ref_id?: string, sort?: any): Promise<void> => {
      try {
        setLoading(true)
        let params: Record<string, any> = sort ? {
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          ref_type: statuss || status,
          q,
          from_date: fDate,
          till_date: tDate,
          ref_id,
          sort_order: sort?.sort === 'asc' ? 'ASC' : 'DESC',
          sort_column:
            status === 'site' && sort?.field === 'sites'
              ? 'site_name'
              : status === 'nursery' && sort?.field === 'nursery'
                ? 'nursery_name'
                : status === 'species' && sort?.field === 'species'
                  ? 'complete_name'
                  : sort.field
        } : {
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          ref_type: statuss || status,
          q,
          from_date: fDate,
          till_date: tDate,
          ref_id
        }

        const res = await getSpeciesList(params)
        const data = res?.data?.data

        if (res?.data?.success) {
          const listWithId = data?.result?.map((el: any, i: number) => ({ ...el, id: i + 1 }))
          setTotal(parseInt(data?.total_count, 10))
          setSpeciesList(loadServerRows(paginationModel.page, listWithId))
        } else {
          setSpeciesList([])
        }
      } catch (e) {
        console.error('Error fetching species:', e)
      } finally {
        setLoading(false)
      }
    },
    [paginationModel]
  )

  const exportExcelDataFunc = async (statuss: string, q: string, fDate: any, tDate: any, ref_id?: string, sort?: any, handleExport?: any): Promise<void> => {
    try {
      setLoading(true)

      const params = {
        ref_type: statuss || status,
        q,
        ref_id,
        sort_order: sortModel[0]?.sort === 'asc' ? 'ASC' : 'DESC',
        sort_column:
          status === 'site' && sortModel[0]?.field === 'sites'
            ? 'site_name'
            : status === 'nursery' && sortModel[0]?.field === 'nursery'
              ? 'nursery_name'
              : status === 'species' && sortModel[0]?.field === 'species'
                ? 'complete_name'
                : sortModel[0]?.field
      }

      const res = await getSpeciesList(params)
      const data = res?.data?.data

      if (res?.data?.success) {
        setTimeout(() => {
          handleExport(data?.result)
        }, 2000)
      } else {
        setExportSpeciesList([])
      }
    } catch (e) {
      console.error('Error fetching species:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    TaxonomyList()
    NurseryList()
  }, [])

  useEffect(() => {
    getspeciesFunc(status, '', fromDate, tillDate)
  }, [getspeciesFunc, status, fromDate, tillDate])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!loading && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)

      return () => clearTimeout(timer)
    }
  }, [loading])

  const handleSortModelChange = (newModel: any): void => {
    setSortModel(newModel)
    getspeciesFunc(status, searchValue, fromDate, tillDate, getIdBasedOnStatus(), newModel[0])
  }

  const exportExcelDataCall = (handleExport: any): void => {
    exportExcelDataFunc(status, searchValue, fromDate, tillDate, getIdBasedOnStatus(), sortModel, handleExport)
  }

  const tableData = () => {
    const handleSearchChange = (e: any): void => {
      const searchValue = e.target.value
      searchTableData(status, searchValue, fromDate, tillDate, getIdBasedOnStatus())
    }

    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 6, mb: '24px' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #C3CEC7',
              borderRadius: '4px',
              padding: '0 8px',
              height: '40px'
            }}
          >
            <Icon icon='mi:search' color={theme.palette.customColors.OnSurfaceVariant} />
            <TextField
              disabled={loading}
              variant='outlined'
              placeholder='Search'
              onChange={handleSearchChange}
              inputRef={searchInputRef}
              sx={{
                '& .MuiOutlinedInput-root': {
                  border: 'none',
                  padding: '0',
                  '& fieldset': { border: 'none' }
                }
              }}
            />
          </Box>
          <Box>
            <DashboardExelExportButton
              tab_Value={status}
              loading={loading}
              data={exportSpeciesList}
              exportExcelDataCall={exportExcelDataCall}
            />
          </Box>
        </Box>

        <CommonTable
          sx={{
            borderTopLeftRadius: '8px',
            '& .MuiBox-root': { paddingX: 0 },
            '.MuiDataGrid-main': {
              border: `1px solid ${theme.palette.customColors.mdAntzNeutral}`,
              borderRadius: '8px'
            },
            '& .MuiDataGrid-footerContainer': { border: 'none !important' },
            '.MuiDataGrid-cell:focus': { outline: 'none' },
            '& .MuiDataGrid-row:hover': { cursor: 'pointer', backgroundColor: 'transparent' },
            '& .MuiDataGrid-row:hover .customButton': { display: 'block' },
            '& .MuiDataGrid-row:hover .hideField': { display: 'none' },
            '& .MuiDataGrid-row .customButton': { display: 'none' },
            '& .MuiDataGrid-row .hideField': { display: 'block' },
            '& .MuiDataGrid-columnHeader:not(.MuiDataGrid-columnHeaderCheckbox)': { paddingLeft: 2.5 },
            '& .MuiDataGrid-columnHeaders': { borderTopLeftRadius: 0, borderTopRightRadius: 0 }
          }}
          columnVisibilityModel={{ sl_no: false }}
          indexedRows={indexedRows || []}
          total={total}
          rowHeight={68}
          columns={
            (status === 'species'
              ? columnSpecies
              : status === 'site'
                ? columnSites
                : status === 'nursery'
                  ? columnNurseries
                  : columnSpecies) as any
          }
          paginationModel={paginationModel}
          setPaginationModel={setPaginationModel}
          loading={loading}
          sortModel={sortModel}
          handleSortModel={handleSortModelChange}
        />
      </>
    )
  }

  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        padding: '16px',
        paddingBottom: '0px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxShadow: '0px 2px 10px 0px #4C4E6438',
        borderRadius: '10px'
      }}
    >
      <TabContext value={status}>
        <TabList onChange={handleChange}>
          <Tab value='species' label={'Eggs by species'} />
          <Tab value='site' label={'Eggs by sites'} />
          <Tab value='nursery' label={'Eggs by nurseries'} />
        </TabList>

        <TabPanel value='species'>
          {tableData()}
        </TabPanel>
        <TabPanel value='site'>
          {tableData()}
        </TabPanel>
        <TabPanel value='nursery'>
          {tableData()}
        </TabPanel>
      </TabContext>
      {openDrawer && (
        <DashboardSlider
          status={status}
          drawerHeading={drawerHeading}
          setDrawerHeading={setDrawerHeading}
          drawerHeadingCount={drawerHeadingCount}
          setDrawerHeadingCount={setDrawerHeadingCount}
          openDrawer={openDrawer}
          setOpenDrawer={setOpenDrawer}
          drawerLoading={drawerLoading}
          drawerList={drawerList}
        />
      )}
      {openDiscard && <DiscardEggSlider openDiscard={openDiscard} setOpenDiscard={setOpenDiscard} />}
    </Box>
  )
}

export default Species
