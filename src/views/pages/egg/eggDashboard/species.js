import { Autocomplete, Avatar, debounce, FormControl, Tab, TextField, Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import Icon from 'src/@core/components/icon'

// ** Custom Components Imports
import { AuthContext } from 'src/context/AuthContext'
import { DataGrid } from '@mui/x-data-grid'
import { getSiteList, getSpeciesList } from 'src/lib/api/egg/dashboard'
import moment from 'moment'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'
import { GetNurseryList } from 'src/lib/api/egg/nursery'
import Router from 'next/router'
import DashboardSlider from '../eggs/dashboardSlider'
import DiscardEggSlider from '../eggs/discardEggSlider'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import { getTaxonomyList } from 'src/lib/api/egg/egg/createAnimal'

const Species = ({ openDiscard, setOpenDiscard }) => {
  const authData = useContext(AuthContext)
  const theme = useTheme()

  const [status, setStatus] = useState('species')

  const [speciesList, setSpeciesList] = useState([])

  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [paginationDrawerModel, setPaginationDrawerModel] = useState({ page: 0, pageSize: 10 })

  const [fromDate, setFromDate] = useState(null)
  const [tillDate, setTilDate] = useState(null)

  const [taxonomyList, setTaxonomyList] = useState([])
  const [defaultSpecies, setDefaultSpecies] = useState(null)

  const [siteList, setSiteList] = useState([])
  const [defaultSite, setDefaultSite] = useState(null)

  const [nurseryList, setNurseryList] = useState([])
  const [defaultNursery, setDefaultNursery] = useState(null)

  const [openDrawer, setOpenDrawer] = useState(false)
  const [drawerHeading, setDrawerHeading] = useState('')
  const [drawerHeadingCount, setDrawerHeadingCount] = useState(0)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerList, setDrawerList] = useState([])

  const getTaxonomyListFunc = q => {
    try {
      getTaxonomyList(q).then(res => {
        if (res.success) {
          setTaxonomyList(res?.data)
        }
      })
    } catch (error) {}
  }

  const searchSpecies = useCallback(
    debounce(async search => {
      try {
        await getTaxonomyListFunc({ search })
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
      await GetNurseryList({ params: params }).then(res => {
        setNurseryList(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const siteListFunc = async q => {
    try {
      const params = {
        type: 'site',
        page_no: 1,
        q
      }
      await getSiteList(params).then(res => {
        setSiteList(res?.data?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    getTaxonomyListFunc()
    NurseryList()
    siteListFunc()
  }, [])

  // const searchToSite = useCallback(
  //   debounce(async q => {
  //     try {
  //       await siteList(q)
  //     } catch (error) {
  //       console.error(error)
  //     }
  //   }, 1000),
  //   []
  // )

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
      disableColumnMenu: true,
      sortable: false,
      align: 'center',
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
      width: 320,
      sortable: false,
      disableColumnMenu: true,
      field: 'species',
      headerName:
        status === 'species' ? 'SPECIES' : status === 'site' ? 'SITES' : status === 'nursery' ? 'NUERSERIES' : '',
      renderCell: params => (
        <>
          {status === 'species' ? (
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
                <Tooltip
                  title={params.row.complete_name ? Utility?.toPascalSentenceCase(params.row.complete_name) : '-'}
                >
                  <Typography
                    sx={{
                      color: theme.palette.primary.light,
                      fontSize: '16px',
                      fontWeight: '500',
                      lineHeight: '19.36px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '240px',
                      boxSizing: 'border-box'
                    }}
                  >
                    {params.row.complete_name ? Utility?.toPascalSentenceCase(params.row.complete_name) : '-'}
                  </Typography>
                </Tooltip>
                <Tooltip
                  title={
                    params.row?.default_common_name
                      ? Utility?.toPascalSentenceCase(params.row.default_common_name)
                      : '-'
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
                      width: '240px'
                    }}
                  >
                    {params.row?.default_common_name
                      ? Utility?.toPascalSentenceCase(params.row.default_common_name)
                      : '-'}
                  </Typography>
                </Tooltip>
              </Box>
            </Box>
          ) : status === 'site' ? (
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
                    width: '240px',
                    boxSizing: 'border-box'
                  }}
                >
                  {params.row.site_name ? Utility?.toPascalSentenceCase(params.row.site_name) : '-'}
                </Typography>
              </Tooltip>
            </Box>
          ) : status === 'nursery' ? (
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
                    width: '240px',
                    boxSizing: 'border-box'
                  }}
                >
                  {params.row.nursery_name ? Utility?.toPascalSentenceCase(params.row.nursery_name) : '-'}
                </Typography>
              </Tooltip>
            </Box>
          ) : null}
        </>
      )
    },
    {
      width: 140,
      field: 'total_eggs',
      sortable: false,
      disableColumnMenu: true,
      headerName: 'TOTAL EGGS',
      renderCell: params => (
        <Typography
          onClick={e => {
            e.stopPropagation()
            getdrawerspeciesFunc(
              status === 'site' ? params.row.site_id : status === 'nursery' ? params.row.nursery_id : ''
            )
            setDrawerHeading(
              status === 'site' ? params.row.site_name : status === 'nursery' ? params.row.nursery_name : ''
            )
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
      )
    },
    {
      width: 120,
      field: 'total_egg_in_nest',
      sortable: false,
      disableColumnMenu: true,
      headerName: 'IN NEST',
      renderCell: params => (
        <Typography
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '600',
            lineHeight: '19.36px'
          }}
        >
          {params.row.total_egg_in_nest ? params.row.total_egg_in_nest : '-'}
        </Typography>
      )
    },
    {
      width: 120,
      field: 'total_eggs_in_nursery',
      sortable: false,
      disableColumnMenu: true,
      headerName: 'IN NURSERY',
      renderCell: params => (
        <Typography
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '600',
            lineHeight: '19.36px'
          }}
        >
          {params.row.total_eggs_in_nursery ? params.row.total_eggs_in_nursery : '-'}
        </Typography>
      )
    },
    {
      width: 120,
      field: 'hatched_percentage',
      sortable: false,
      disableColumnMenu: true,
      headerName: 'HATCHED %',
      renderCell: params => (
        <Typography
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '600',
            lineHeight: '19.36px'
          }}
        >
          {params.row.hatched_percentage ? params.row.hatched_percentage : '-'}%
        </Typography>
      )
    },
    {
      width: 120,
      field: 'transfer',
      sortable: false,
      disableColumnMenu: true,
      headerName: 'TRANSFER',
      renderCell: params => (
        <Typography
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '600',
            lineHeight: '19.36px'
          }}
        >
          {params.row.total_egg_in_transit ? params.row.total_egg_in_transit : '-'}
        </Typography>
      )
    },
    {
      width: 120,
      field: 'total_discarded_eggs',
      sortable: false,
      disableColumnMenu: true,
      headerName: 'DISCARDED',
      renderCell: params => (
        <Typography
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '600',
            lineHeight: '19.36px'
          }}
        >
          {params.row.total_discarded_eggs ? params.row.total_discarded_eggs : '-'}
        </Typography>
      )
    }
  ]

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    setPaginationModel({ page: 0, pageSize: 10 })
    setStatus(newValue)
    setSearchValue('')
    setTilDate(null)
    setFromDate(null)
    setDefaultSite(null)
    setDefaultNursery(null)
  }

  const onCellClick = params => {
    const clickedColumn = params.field !== 'switch'

    if (clickedColumn) {
      const data = params.row

      Router.push({
        pathname: `/egg/species/${data?.taxonomy_id}`
      })
    } else {
      return
    }
  }

  // const addEventSidebarOpen = () => {
  //   setOpenDrawer(true)
  //   setOpenDiscard(false)
  // }

  // const addDiscardSidebarOpen = () => {
  //   setOpenDiscard(true)
  // }

  const getdrawerspeciesFunc = async ref_id => {
    try {
      setDrawerLoading(true)
      const paramsSite = {
        page_no: paginationDrawerModel.page + 1,
        limit: paginationDrawerModel.pageSize,
        ref_type: 'species',
        q: '',
        site_id: ref_id
      }
      const paramsNursery = {
        page_no: paginationDrawerModel.page + 1,
        limit: paginationDrawerModel.pageSize,
        ref_type: 'species',
        q: '',
        nursery_id: ref_id
      }
      // console.log('params', params)
      await getSpeciesList(status === 'site' ? paramsSite : status === 'nursery' ? paramsNursery : null).then(res => {
        if (res?.data?.success) {
          setDrawerHeadingCount(parseInt(res?.data?.data?.total_count))
          setDrawerList(res?.data?.data?.result)
          setDrawerLoading(false)
        } else {
          setDrawerLoading(false)
          setDrawerList([])
        }
      })
      setDrawerLoading(false)
    } catch (e) {
      console.log('e', e)
      setDrawerLoading(false)
    }
  }

  const getspeciesFunc = useCallback(
    async (statuss, q, fDate, tDate, ref_id) => {
      try {
        setLoading(true)
        const params = {
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          ref_type: statuss || status,
          q,
          from_date: fDate,
          til_date: tDate,
          ref_id
        }
        // console.log('params', params)
        await getSpeciesList(params).then(res => {
          if (res?.data?.success) {
            let listWithId = res?.data?.data?.result?.map((el, i) => {
              return { ...el, id: i + 1 }
            })
            setTotal(parseInt(res?.data?.data?.total_count))
            setSpeciesList(loadServerRows(paginationModel.page, listWithId))
            setLoading(false)
          } else {
            setLoading(false)
            setSpeciesList([])
          }
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  const searchTableData = useCallback(
    debounce(async (status, q, fDate, tDate, ref_id) => {
      setSearchValue(q)
      try {
        await getspeciesFunc(status, q, fDate, tDate, ref_id)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  useEffect(() => {
    getspeciesFunc(status)
  }, [getspeciesFunc])

  // useEffect(() => {
  //   getspeciesFunc(searchValue, fromDate, tillDate, defaultSite?.site_id, defaultNursery?.nursery_id)
  // }, [getspeciesFunc])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = speciesList?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  // const handleSortModel = newModel => {}

  const tableData = () => {
    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 6, mb: '24px' }} container>
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
              onChange={e =>
                searchTableData(
                  status,
                  e.target.value,
                  fromDate,
                  tillDate,
                  status === 'species'
                    ? ''
                    : status === 'site'
                    ? defaultSite?.site_id
                    : status === 'nursery'
                    ? defaultNursery?.nursery_id
                    : ''
                )
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  border: 'none',
                  padding: '0',
                  '& fieldset': {
                    border: 'none'
                  }
                }
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  width: '155px',
                  '& .css-sn37jt-MuiInputBase-root-MuiOutlinedInput-root': {
                    height: '40px',
                    borderRadius: '4px'
                  },
                  '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-7px' },
                  '& .css-1d3z3hw-MuiOutlinedInput-notchedOutline': { border: '1px solid #C3CEC7' }
                }}
                value={fromDate}
                onChange={newDate => {
                  if (newDate) {
                    const formattedDate = moment(newDate.toISOString()).format('YYYY-MM-DD')
                    setFromDate(moment(newDate.toISOString()).format('YYYY-MM-DD'))
                    getspeciesFunc(
                      status,
                      searchValue,
                      formattedDate,
                      tillDate,
                      status === 'species'
                        ? ''
                        : status === 'site'
                        ? defaultSite?.site_id
                        : status === 'nursery'
                        ? defaultNursery?.nursery_id
                        : ''
                    )
                  }
                }}
                label={'From Date'}
                maxDate={dayjs()}
              />
            </LocalizationProvider>
            <Typography
              sx={{
                color: '#839D8D',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '16.94px'
              }}
            >
              To
            </Typography>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  width: '155px',
                  '& .css-sn37jt-MuiInputBase-root-MuiOutlinedInput-root': {
                    height: '40px',
                    borderRadius: '4px'
                  },
                  '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-7px' },
                  '& .css-1d3z3hw-MuiOutlinedInput-notchedOutline': { border: '1px solid #C3CEC7' }
                }}
                value={tillDate}
                onChange={newDate => {
                  if (newDate) {
                    const formattedDate = moment(newDate.toISOString()).format('YYYY-MM-DD')
                    setTilDate(moment(newDate.toISOString()).format('YYYY-MM-DD'))
                    getspeciesFunc(
                      status,
                      searchValue,
                      fromDate,
                      formattedDate,
                      status === 'species'
                        ? ''
                        : status === 'site'
                        ? defaultSite?.site_id
                        : status === 'nursery'
                        ? defaultNursery?.nursery_id
                        : ''
                    )
                  }
                }}
                label={'Till Date'}
                maxDate={dayjs()}
              />
            </LocalizationProvider>

            {status === 'species' ? (
              <Box>
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
                        sx={{
                          backgroundColor: '#fff',
                          borderRadius: '8px',
                          width: '176px',
                          '& .css-vh4m6j-MuiInputBase-root-MuiOutlinedInput-root': {
                            height: '40px',
                            borderRadius: '4px'
                          },
                          '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-7px' },
                          '& input': {
                            position: 'relative',
                            top: -7
                          }
                        }}
                        onChange={e => {
                          searchSpecies(e.target.value)
                        }}
                        {...params}
                        label='All Species'
                        placeholder='Search & Select'
                      />
                    )}
                  />
                </FormControl>
              </Box>
            ) : status === 'site' ? (
              <Box>
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
                      <TextField
                        sx={{
                          backgroundColor: '#fff',
                          borderRadius: '8px',
                          width: '176px',
                          '& .css-vh4m6j-MuiInputBase-root-MuiOutlinedInput-root': {
                            height: '40px',
                            borderRadius: '4px'
                          },
                          '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-7px' },
                          '& input': {
                            position: 'relative',
                            top: -7
                          }
                        }}
                        // onChange={e => {
                        //   searchToSite(e.target.value)
                        // }}
                        {...params}
                        label='All Sites'
                        placeholder='Search & Select'
                      />
                    )}
                  />
                </FormControl>
              </Box>
            ) : status === 'nursery' ? (
              <Box>
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
                        sx={{
                          backgroundColor: '#fff',
                          borderRadius: '8px',
                          width: '176px',
                          '& .css-vh4m6j-MuiInputBase-root-MuiOutlinedInput-root': {
                            height: '40px',
                            borderRadius: '4px'
                          },
                          '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-7px' },
                          '& input': {
                            position: 'relative',
                            top: -7
                          }
                        }}
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
              </Box>
            ) : null}
          </Box>
        </Box>
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
            '& .MuiDataGrid-columnHeader:not(.MuiDataGrid-columnHeaderCheckbox)': {
              paddingLeft: 2.5
            },
            '& .css-1fdlktf-MuiDataGrid-columnHeaders': {
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0
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
          rowHeight={68}
          columns={columns}
          sortingMode='server'
          paginationMode='server'
          pageSizeOptions={[7, 10, 25, 50]}
          paginationModel={paginationModel}
          // onSortModelChange={handleSortModel}
          onPaginationModelChange={setPaginationModel}
          loading={loading}
          onCellClick={onCellClick}
        />
      </>
    )
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
