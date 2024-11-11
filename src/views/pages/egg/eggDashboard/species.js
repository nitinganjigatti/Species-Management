import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { Box } from '@mui/system'
import { Autocomplete, Avatar, Fade, FormControl, Tab, TextField, Tooltip, Typography } from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import { DataGrid } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import moment from 'moment'
import Router from 'next/router'
import debounce from 'lodash/debounce'

// Custom Components Imports
import Icon from 'src/@core/components/icon'
import { AuthContext } from 'src/context/AuthContext'
import Utility from 'src/utility'
import DashboardSlider from '../eggs/dashboardSlider'
import DiscardEggSlider from '../eggs/discardEggSlider'

// API Imports
import { getSpeciesList } from 'src/lib/api/egg/dashboard'
import { GetNurseryList } from 'src/lib/api/egg/nursery'
import { getTaxonomyList } from 'src/lib/api/egg/egg/createAnimal'
import DashboardExelExportButton from './exportDasboardDataExcel'

const Species = ({ openDiscard, setOpenDiscard }) => {
  // Context and Theme
  const authData = useContext(AuthContext)
  const theme = useTheme()

  // Tab Status
  const [status, setStatus] = useState('species')

  // Data Lists
  const [speciesList, setSpeciesList] = useState([])
  const [taxonomyList, setTaxonomyList] = useState([])
  const [nurseryList, setNurseryList] = useState([])

  // Default Values
  const [defaultSpecies, setDefaultSpecies] = useState(null)
  const [defaultSite, setDefaultSite] = useState(null)
  const [defaultNursery, setDefaultNursery] = useState(null)

  // Date Range
  const [fromDate, setFromDate] = useState(null)
  const [tillDate, setTillDate] = useState(null)

  // Pagination
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  // Drawer State
  const [openDrawer, setOpenDrawer] = useState(false)
  const [drawerHeading, setDrawerHeading] = useState('')
  const [drawerHeadingCount, setDrawerHeadingCount] = useState(0)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerList, setDrawerList] = useState([])

  const [sortModel, setSortModel] = useState([{ field: 'complete_name', sort: 'DESC' }])

  // Loading and Total Count
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  // Search Value
  const [searchValue, setSearchValue] = useState('')

  const TaxonomyList = async q => {
    try {
      const res = await getTaxonomyList(q)
      if (res?.data) {
        setTaxonomyList(res.data)
      }
    } catch (error) {
      console.error('Error fetching taxonomy list:', error)
    }
  }

  const NurseryList = async q => {
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

  // Debounce wrapper for API calls
  const useDebouncedCallback = (callback, delay) => {
    return useCallback(debounce(callback, delay), [callback, delay])
  }

  // Debounced search callbacks
  const searchSpecies = useDebouncedCallback(async search => await TaxonomyList({ search }), 1000)
  const searchNursery = useDebouncedCallback(async q => await NurseryList(q), 1000)

  const searchTableData = useDebouncedCallback(async (status, q, fDate, tDate, ref_id) => {
    setSearchValue(q)
    await getspeciesFunc(status, q, fDate, tDate, ref_id)
  }, 1000)

  const CustomTooltip = ({ title, children, placement = 'bottom', disableHoverListener }) => (
    <Tooltip
      disableHoverListener={disableHoverListener || false}
      TransitionComponent={Fade}
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
          {title?.map((item, index) => (
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
      componentsProps={{
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
    // {
    //   width: 60,
    //   field: 'uid',
    //   headerName: 'NO',
    //   disableColumnMenu: true,
    //   sortable: false,
    //   align: 'center',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '12px',
    //         fontWeight: '400',
    //         lineHeight: '14.52px'
    //       }}
    //     >
    //       {params.row.sl_no}
    //     </Typography>
    //   )
    // },

    {
      width: 280,
      sortable: true,
      disableColumnMenu: true,
      field: 'species',
      headerName: 'SPECIES',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
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

          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Tooltip title={params.row.complete_name ? Utility?.toPascalSentenceCase(params.row.complete_name) : '-'}>
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
                {params.row.complete_name ? Utility?.toPascalSentenceCase(params.row.complete_name) : '-'}
              </Typography>
            </Tooltip>
            <Tooltip
              title={
                params.row?.default_common_name ? Utility?.toPascalSentenceCase(params.row.default_common_name) : '-'
              }
            >
              <Typography
                sx={{
                  color: theme.palette.primary.light,
                  fontSize: '14px',
                  fontWeight: '400',
                  lineHeight: '16.94px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '200px'
                }}
              >
                {params.row?.default_common_name ? Utility?.toPascalSentenceCase(params.row.default_common_name) : '-'}
              </Typography>
            </Tooltip>
          </Box>
        </Box>
      )
    },
    {
      width: 120,
      field: 'total_eggs',
      sortable: true,
      disableColumnMenu: true,
      headerName: 'TOTAL EGGS',
      renderCell: params => (
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
            // onClick={e => {
            //   e.stopPropagation()
            //   getdrawerspeciesFunc(
            //     status === 'site' ? params.row.site_id : status === 'nursery' ? params.row.nursery_id : ''
            //   )
            //   setDrawerHeading(
            //     status === 'site' ? params.row.site_name : status === 'nursery' ? params.row.nursery_name : ''
            //   )
            //   status != 'species' && setOpenDrawer(true)
            // }}
            style={{
              width: '80%',
              cursor: status === 'species' && 'auto',
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
      field: 'total_egg_in_nest',
      sortable: true,
      disableColumnMenu: true,
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            CURRENTLY
          </Typography>

          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            IN NEST
          </Typography>
        </Box>
      ),
      renderCell: params => (
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
            {/* {params.row.total_egg_in_nest ? params.row.total_egg_in_nest : '-'} */}
            {params.row.currently_in_nest ? params.row.currently_in_nest : '-'}
          </Typography>
        </Box>
      )
    },
    {
      width: 160,
      field: 'eggs_to_nursery',
      sortable: true,
      disableColumnMenu: true,
      // headerName: 'EGGS TO NURSERY',
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            CURRENTLY
          </Typography>

          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            IN NURSERY
          </Typography>
        </Box>
      ),
      renderCell: params => (
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
      width: 160,
      field: 'hatched_percentage',
      sortable: true,
      disableColumnMenu: true,
      headerName: 'TOTAL HATCHED %',
      renderCell: params => (
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
            {/* total_hatched_eggs */}
            {/* {(Number(params.row.total_hatch) > 0 && Number(params.row.total_discard) >= 0
              ? (Number(params.row.total_hatch) / (Number(params.row.total_hatch) + Number(params.row.total_discard))) *
                100
              : 0
            ) // Fallback to 0 if values are not valid numbers
              .toPrecision(3)} */}
            {Number(params.row.total_hatch) + Number(params.row.total_discard) + 0
              ? Math.round(
                  (Number(params.row.total_hatch) /
                    (Number(params.row.total_hatch) + Number(params.row.total_discard))) *
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
      disableColumnMenu: true,
      headerName: 'TOTAL HATCHED',
      renderCell: params => (
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
      width: 200,
      field: 'hatched_in_nursery_percentage',
      sortable: true,
      disableColumnMenu: true,
      headerName: 'HATCHED IN NURSERY %',
      renderCell: params => (
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
            {/* {(Number(params.row.hatched_in_nursery) > 0 &&
            Number(params.row.discarded_at_nursery) >= 0 &&
            Number(params.row.ready_tobe_discarded_at_nursery) >= 0
              ? (Number(params.row.hatched_in_nursery) /
                  (Number(params.row.hatched_in_nursery) +
                    Number(params.row.discarded_at_nursery) +
                    Number(params.row.ready_tobe_discarded_at_nursery))) *
                100
              : 0
            ) // Fallback to 0 if values are not valid numbers
              .toPrecision(3)} */}
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
      disableColumnMenu: true,
      headerName: 'HATCHED IN NURSERY',
      renderCell: params => (
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
      sortable: true,
      disableColumnMenu: true,
      headerName: 'HATCHED IN NEST %',
      renderCell: params => (
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
            {/* {(Number(params.row.hatched_in_nest) > 0 &&
            Number(params.row.discarded_at_site) >= 0 &&
            Number(params.row.ready_tobe_discarded_at_nursery) >= 0
              ? (Number(params.row.hatched_in_nest) /
                  (Number(params.row.hatched_in_nest) +
                    Number(params.row.discarded_at_site) +
                    Number(params.row.ready_tobe_discarded_at_nursery))) *
                100
              : 0
            ) // Fallback to 0 if values are not valid numbers
              .toPrecision(3)} */}
            {Number(params.row.hatched_in_nest) +
              Number(params.row.discarded_at_site) +
              Number(params.row.ready_tobe_discarded_at_nursery) >
            0
              ? Math.round(
                  (Number(params.row.hatched_in_nest) /
                    (Number(params.row.hatched_in_nest) +
                      Number(params.row.discarded_at_site) +
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
      width: 180,
      field: 'in_nursery',
      sortable: true,
      disableColumnMenu: true,
      headerName: 'HATCHED IN NEST',
      renderCell: params => (
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
      field: 'discarded_at_site',
      sortable: true,
      disableColumnMenu: true,
      headerName: 'DISCARDED AT SITE',
      renderCell: params => (
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
      field: 'discarded_at_nursery',
      sortable: true,
      disableColumnMenu: true,
      headerName: 'DISCARDED AT NURSERY',
      renderCell: params => (
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
              {params.row.discarded_at_nursery ? params.row.discarded_at_nursery : '-'}
            </Typography>
          </CustomTooltip>
        </Box>
      )
    },
    {
      width: 140,
      field: 'total_discarded',
      sortable: true,
      disableColumnMenu: true,
      headerName: 'TOTAL DISCARDED',
      renderCell: params => (
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
      width: 120,
      field: 'in_transit',
      sortable: true,
      disableColumnMenu: true,
      headerName: 'IN TRANSIT',
      renderCell: params => (
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
            disableHoverListener={!params?.row?.nursery_wise_breakdown?.length}
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
      width: 320,
      sortable: true,
      disableColumnMenu: true,
      field: 'species',
      headerName: 'SITES',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
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
      disableColumnMenu: true,
      headerName: 'TOTAL EGGS',
      renderCell: params => (
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
            onClick={e => {
              e.stopPropagation()
              getdrawerspeciesFunc(params.row.site_id)
              setDrawerHeading(params.row.site_name)
              status != 'species' && setOpenDrawer(true)
            }}
            style={{
              width: '80%',
              cursor: status === 'species' && 'auto',
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
      field: 'total_egg_in_nest',
      sortable: true,
      disableColumnMenu: true,
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            CURRENTLY
          </Typography>

          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            IN NEST
          </Typography>
        </Box>
      ),
      renderCell: params => (
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
            {/* {params.row.total_egg_in_nest ? params.row.total_egg_in_nest : '-'} */}
            {params.row.currently_in_nest ? params.row.currently_in_nest : '-'}
          </Typography>
        </Box>
      )
    },
    {
      width: 160,
      field: 'eggs_to_nursery',
      sortable: true,
      disableColumnMenu: true,
      // headerName: 'EGGS TO NURSERY',
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            CURRENTLY
          </Typography>

          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            IN NURSERY
          </Typography>
        </Box>
      ),
      renderCell: params => (
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
      width: 160,
      field: 'hatched_percentage',
      sortable: true,
      disableColumnMenu: true,
      headerName: 'TOTAL HATCHED %',
      renderCell: params => (
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
            {/* total_hatched_eggs */}
            {/* {(Number(params.row.total_hatch) > 0 && Number(params.row.total_discard) >= 0
              ? (Number(params.row.total_hatch) / (Number(params.row.total_hatch) + Number(params.row.total_discard))) *
                100
              : 0
            ) // Fallback to 0 if values are not valid numbers
              .toPrecision(3)} */}
            {Number(params.row.total_hatch) + Number(params.row.total_discard) + 0
              ? Math.round(
                  (Number(params.row.total_hatch) /
                    (Number(params.row.total_hatch) + Number(params.row.total_discard))) *
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
      field: 'hatched',
      sortable: true,
      disableColumnMenu: true,
      headerName: 'TOTAL HATCHED',
      renderCell: params => (
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
      width: 200,
      field: 'hatched_in_nursery_percentage',
      sortable: true,
      disableColumnMenu: true,
      headerName: 'HATCHED IN NURSERY %',
      renderCell: params => (
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
            {/* {(Number(params.row.hatched_in_nest) > 0 && Number(params.row.discarded_at_site) >= 0
              ? (Number(params.row.hatched_in_nursery) /
                  (Number(params.row.hatched_in_nursery) +
                    Number(params.row.discarded_at_nursery) +
                    Number(params.row.ready_tobe_discarded_at_nursery))) *
                100
              : 0
            ) // Fallback to 0 if values are not valid numbers
              .toPrecision(3)} */}
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
      disableColumnMenu: true,
      headerName: 'HATCHED IN NURSERY',
      renderCell: params => (
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
      sortable: true,
      disableColumnMenu: true,
      headerName: 'HATCHED IN NEST %',
      renderCell: params => (
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
            {/* {(Number(params.row.hatched_in_nest) > 0 && Number(params.row.discarded_at_site) >= 0
              ? (Number(params.row.hatched_in_nest) /
                  (Number(params.row.hatched_in_nest) +
                    Number(params.row.discarded_at_site) +
                    Number(params.row.ready_tobe_discarded_at_nursery))) *
                100
              : 0
            ) // Fallback to 0 if values are not valid numbers
              .toPrecision(3)} */}
            {Number(params.row.hatched_in_nest) +
              Number(params.row.discarded_at_site) +
              Number(params.row.ready_tobe_discarded_at_nursery) >
            0
              ? Math.round(
                  (Number(params.row.hatched_in_nest) /
                    (Number(params.row.hatched_in_nest) +
                      Number(params.row.discarded_at_site) +
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
      width: 180,
      field: 'hatched_in_nest_',
      sortable: true,
      disableColumnMenu: true,
      headerName: 'HATCHED IN NEST',
      renderCell: params => (
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
      field: 'discarded_at_site',
      sortable: true,
      disableColumnMenu: true,
      headerName: 'DISCARDED AT SITE',
      renderCell: params => (
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
      field: 'discarded_at_nursery',
      sortable: true,
      disableColumnMenu: true,
      headerName: 'DISCARDED AT NURSERY',
      renderCell: params => (
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
              {params.row.discarded_at_nursery ? params.row.discarded_at_nursery : '-'}
            </Typography>
          </CustomTooltip>
        </Box>
      )
    },
    {
      width: 160,
      field: 'total_discarded',
      sortable: true,
      disableColumnMenu: true,
      headerName: 'TOTAL DISCARDED',
      renderCell: params => (
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
      width: 120,
      field: 'in_transit',
      sortable: true,
      disableColumnMenu: true,
      headerName: 'IN TRANSIT',
      renderCell: params => (
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
      width: 340,
      sortable: true,
      disableColumnMenu: true,
      field: 'nursery',
      headerName: 'NURSERIES',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
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
      disableColumnMenu: true,
      headerName: 'TOTAL EGGS',
      renderCell: params => (
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
            onClick={e => {
              e.stopPropagation()
              getdrawerspeciesFunc(params.row.nursery_id)
              setDrawerHeading(params.row.nursery_name)
              status != 'species' && setOpenDrawer(true)
            }}
            style={{
              width: '80%',
              cursor: status === 'species' && 'auto',
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
      disableColumnMenu: true,
      headerName: 'CURRENTLY IN INCUBATOR',
      renderCell: params => (
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
      field: 'eggs_to_nursery',
      sortable: true,
      disableColumnMenu: true,
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            CURRENTLY
          </Typography>

          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 500 }}>
            IN NURSERY
          </Typography>
        </Box>
      ),
      renderCell: params => (
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
      sortable: true,
      disableColumnMenu: true,
      headerName: 'HATCHED IN NURSERY %',
      renderCell: params => (
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
            {/* {(Number(params.row.hatched_in_nest) > 0 && Number(params.row.discarded_at_site) >= 0
              ? (Number(params.row.hatched_in_nursery) /
                  (Number(params.row.hatched_in_nursery) +
                    Number(params.row.discarded_at_nursery) +
                    Number(params.row.ready_tobe_discarded_at_nursery))) *
                100
              : 0
            ) // Fallback to 0 if values are not valid numbers
              .toPrecision(3)} */}
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
      disableColumnMenu: true,
      headerName: 'HATCHED IN NURSERY',
      renderCell: params => (
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
      field: 'discarded_at_nursery',
      sortable: true,
      disableColumnMenu: true,
      headerName: 'DISCARDED AT NURSERY',
      renderCell: params => (
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
              {params.row.discarded_at_nursery ? params.row.discarded_at_nursery : '-'}
            </Typography>
          </CustomTooltip>
        </Box>
      )
    },

    {
      width: 120,
      field: 'in_transit',
      sortable: true,
      disableColumnMenu: true,
      headerName: 'IN TRANSIT',
      renderCell: params => (
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

  const getIdBasedOnStatus = () => {
    return status === 'species'
      ? ''
      : status === 'site'
      ? defaultSite?.site_id
      : status === 'nursery'
      ? defaultNursery?.nursery_id
      : ''
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    setPaginationModel({ page: 0, pageSize: 10 })
    setStatus(newValue)
    setSearchValue('')
    setTillDate(null)
    setFromDate(null)
    setDefaultSite(null)
    setDefaultNursery(null)
  }

  // const onCellClick = params => Router.push(`/egg/species/${params?.row?.taxonomy_id}`)

  function loadServerRows(currentPage, data) {
    return data
  }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1
  const indexedRows = speciesList?.map((row, index) => ({ ...row, sl_no: getSlNo(index) }))

  const getdrawerspeciesFunc = async ref_id => {
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
    async (statuss, q, fDate, tDate, ref_id, sort) => {
      try {
        setLoading(true)
        let params
        if (sort) {
          params = {
            page_no: paginationModel.page + 1,
            limit: paginationModel.pageSize,
            ref_type: statuss || status,
            q,
            from_date: fDate,
            till_date: tDate,
            ref_id,
            sort_order: sort?.sort === 'asc' ? 'ASC' : 'DESC' || 'DESC',
            sort_column:
              status === 'site'
                ? 'site_name'
                : status === 'nursery'
                ? 'nursery_name'
                : status === 'species'
                ? 'complete_name'
                : status || ''
          }
        } else {
          params = {
            page_no: paginationModel.page + 1,
            limit: paginationModel.pageSize,
            ref_type: statuss || status,
            q,
            from_date: fDate,
            till_date: tDate,
            ref_id
          }
        }

        const res = await getSpeciesList(params)
        const data = res?.data?.data

        if (res?.data?.success) {
          const listWithId = data?.result?.map((el, i) => ({ ...el, id: i + 1 }))
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

  useEffect(() => {
    TaxonomyList()
    NurseryList()
  }, [])

  useEffect(() => {
    getspeciesFunc(status)
  }, [getspeciesFunc])

  const handleSortModelChange = newModel => {
    setSortModel(newModel)
    getspeciesFunc(status, searchValue, fromDate, tillDate, getIdBasedOnStatus(), newModel[0])
  }

  const tableData = () => {
    const handleSearchChange = e => {
      const searchValue = e.target.value
      searchTableData(status, searchValue, fromDate, tillDate, getIdBasedOnStatus())
    }

    const handleFromDateChange = newDate => {
      if (newDate) {
        const formattedDate = moment(newDate.toISOString()).format('YYYY-MM-DD')
        setFromDate(formattedDate)
        getspeciesFunc(status, searchValue, formattedDate, tillDate, getIdBasedOnStatus())
      }
    }

    const handleTillDateChange = newDate => {
      if (newDate) {
        const formattedDate = moment(newDate.toISOString()).format('YYYY-MM-DD')
        setTillDate(formattedDate)
        getspeciesFunc(status, searchValue, fromDate, formattedDate, getIdBasedOnStatus())
      }
    }

    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 6, mb: '24px' }} container>
          {/* Search Box */}
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
              variant='outlined'
              placeholder='Search'
              onChange={handleSearchChange}
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
            <DashboardExelExportButton tab_Value={status} data={indexedRows} />
          </Box>

          {/* <Box>
            {status === 'species' && (
              <FormControl fullWidth>
                <Autocomplete
                  name='species'
                  value={defaultSpecies}
                  disablePortal
                  id='species'
                  placeholder='Species / Taxonomy'
                  options={taxonomyList?.length > 0 ? taxonomyList : []}
                  getOptionLabel={option => option.scientific_name}
                  isOptionEqualToValue={(option, value) => option?.tsn === value?.tsn}
                  onChange={(e, val) => {
                    if (val === null) {
                      setDefaultSpecies(null)
                      getspeciesFunc(status, searchValue, fromDate, tillDate, '')
                    } else {
                      setDefaultSpecies(val)
                      getspeciesFunc(status, searchValue, fromDate, tillDate, val?.tsn)
                    }
                  }}
                  renderInput={params => (
                    <TextField
                      sx={textFieldStyles}
                      onChange={e => searchSpecies(e.target.value)}
                      {...params}
                      label='All Species'
                      placeholder='Search & Select'
                    />
                  )}
                />
              </FormControl>
            )}
            {status === 'site' && (
              <FormControl fullWidth>
                <Autocomplete
                  name='site'
                  value={defaultSite}
                  disablePortal
                  id='site'
                  options={
                    authData?.userData?.user?.zoos[0].sites?.length > 0 ? authData?.userData?.user?.zoos[0].sites : []
                  }
                  getOptionLabel={option => option.site_name}
                  isOptionEqualToValue={(option, value) => option?.site_id === value?.site_id}
                  onChange={(e, val) => {
                    if (val === null) {
                      setDefaultSite(null)
                      getspeciesFunc(status, searchValue, fromDate, tillDate, '')
                    } else {
                      setDefaultSite(val)
                      getspeciesFunc(status, searchValue, fromDate, tillDate, val?.site_id)
                    }
                  }}
                  renderInput={params => (
                    <TextField sx={textFieldStyles} {...params} label='All Sites' placeholder='Search & Select' />
                  )}
                />
              </FormControl>
            )}
            {status === 'nursery' && (
              <FormControl fullWidth>
                <Autocomplete
                  name='nursery'
                  value={defaultNursery}
                  disablePortal
                  id='nursery'
                  options={nurseryList?.length > 0 ? nurseryList : []}
                  getOptionLabel={option => option.nursery_name}
                  isOptionEqualToValue={(option, value) => option?.nursery_id === value?.nursery_id}
                  onChange={(e, val) => {
                    if (val === null) {
                      setDefaultNursery(null)
                      getspeciesFunc(status, searchValue, fromDate, tillDate, '')
                    } else {
                      setDefaultNursery(val)
                      getspeciesFunc(status, searchValue, fromDate, tillDate, val?.nursery_id)
                    }
                  }}
                  renderInput={params => (
                    <TextField
                      sx={textFieldStyles}
                      onChange={e => {
                        searchNursery(e.target.value)
                      }}
                      {...params}
                      label='All Nurseries'
                      placeholder='Search & Select'
                    />
                  )}
                />
              </FormControl>
            )}
          </Box> */}

          {/* Date Pickers and Autocomplete */}
          {/* <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                sx={datePickerStyles}
                value={fromDate}
                onChange={handleFromDateChange}
                label={'From Date'}
                maxDate={dayjs()}
                format='DD/MM/YYY'
              />
            </LocalizationProvider>

            <Typography sx={typographyStyles}>To</Typography>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                sx={datePickerStyles}
                value={tillDate}
                onChange={handleTillDateChange}
                label={'Till Date'}
                maxDate={dayjs()}
                format='DD/MM/YYY'
              />
            </LocalizationProvider>
          </Box> */}
        </Box>

        {/* DataGrid */}
        <DataGrid
          sx={dataGridStyles}
          columnVisibilityModel={{ sl_no: false }}
          hideFooterSelectedRowCount
          disableColumnSelector
          autoHeight
          pagination
          rows={indexedRows || []}
          rowCount={total}
          rowHeight={68}
          columns={
            status === 'species'
              ? columnSpecies
              : status === 'site'
              ? columnSites
              : status === 'nursery'
              ? columnNurseries
              : columnSpecies
          }
          sortingMode='server'
          paginationMode='server'
          pageSizeOptions={[7, 10, 25, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          loading={loading}
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          // onCellClick={onCellClick}
        />
      </>
    )
  }

  // Styles for DatePicker and Typography
  const datePickerStyles = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    width: '155px',
    '& .MuiOutlinedInput-root': {
      height: '40px',
      borderRadius: '4px'
    },
    '& .MuiFormLabel-root': { top: '-7px' },
    '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #C3CEC7' }
  }

  const typographyStyles = {
    color: '#839D8D',
    fontWeight: 400,
    fontSize: '14px',
    lineHeight: '16.94px'
  }

  const textFieldStyles = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    width: '200px',
    '& .MuiOutlinedInput-root': {
      height: '40px',
      borderRadius: '4px'
    },
    '& .MuiFormLabel-root': { top: '-7px' },
    '& input': { position: 'relative', top: -7 }
  }

  const dataGridStyles = {
    '.MuiDataGrid-cell:focus': { outline: 'none' },
    '& .MuiDataGrid-row:hover': { cursor: 'pointer', backgroundColor: 'transparent' },
    '& .MuiDataGrid-row:hover .customButton': { display: 'block' },
    '& .MuiDataGrid-row:hover .hideField': { display: 'none' },
    '& .MuiDataGrid-row .customButton': { display: 'none' },
    '& .MuiDataGrid-row .hideField': { display: 'block' },
    '& .MuiDataGrid-columnHeader:not(.MuiDataGrid-columnHeaderCheckbox)': { paddingLeft: 2.5 },
    '& .MuiDataGrid-columnHeaders': { borderTopLeftRadius: 0, borderTopRightRadius: 0 }
  }

  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        padding: '24px',
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

        <TabPanel value='species'>{tableData()}</TabPanel>
        <TabPanel value='site'>{tableData()}</TabPanel>
        <TabPanel value='nursery'>{tableData()}</TabPanel>
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
