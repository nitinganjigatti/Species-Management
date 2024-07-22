import { Autocomplete, Avatar, debounce, FormControl, Grid, TextField, Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import Icon from 'src/@core/components/icon'

// ** Custom Components Imports
import OptionsMenu from 'src/@core/components/option-menu'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { AuthContext } from 'src/context/AuthContext'
import { DataGrid } from '@mui/x-data-grid'
import { getAllStats, getSiteList, getSpeciesList } from 'src/lib/api/egg/dashboard'
import moment from 'moment'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'
import { GetNurseryList } from 'src/lib/api/egg/nursery'

const Species = () => {
  const authData = useContext(AuthContext)
  const theme = useTheme()

  const [speciesList, setSpeciesList] = useState([])

  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  const [fromDate, setFromDate] = useState(null)
  const [tillDate, setTilDate] = useState(null)

  const [fromSiteList, setFromSiteList] = useState([])
  const [toSiteList, setToSiteList] = useState([])
  const [defaultFromSite, setDefaultFromSite] = useState(null)
  const [defaultToSite, setDefaultToSite] = useState(null)
  const [nurseryList, setNurseryList] = useState([])
  const [defaultNursery, setDefaultNursery] = useState(null)

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

  const FromSiteList = async q => {
    try {
      const params = {
        type: 'site',
        page_no: 1,
        q
      }
      await getSiteList(params).then(res => {
        setFromSiteList(res?.data?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }
  const ToSiteList = async q => {
    try {
      const params = {
        type: 'site',
        page_no: 1,
        q
      }
      await getSiteList(params).then(res => {
        setToSiteList(res?.data?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    NurseryList()
    FromSiteList()
    ToSiteList()
  }, [])

  const searchFromSite = useCallback(
    debounce(async q => {
      try {
        await FromSiteList(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )
  const searchToSite = useCallback(
    debounce(async q => {
      try {
        await ToSiteList(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

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
      flex: 0.24,
      minWidth: 60,
      sortable: false,
      disableColumnMenu: true,
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
                  width: '110px',
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
                  width: '110px'
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
      flex: 0.2,
      minWidth: 10,
      field: 'total_eggs',
      sortable: false,
      disableColumnMenu: true,
      headerName: 'TOTAL EGGS',
      renderCell: params => (
        <Typography
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.total_eggs ? params.row.total_eggs : '-'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 10,
      field: 'total_egg_in_nest',
      sortable: false,
      disableColumnMenu: true,
      headerName: 'IN NEST',
      renderCell: params => (
        <Typography
          style={{
            color: '#000',
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
      flex: 0.2,
      minWidth: 10,
      field: 'total_eggs_in_nursery',
      sortable: false,
      disableColumnMenu: true,
      headerName: 'IN NURSERY',
      renderCell: params => (
        <Typography
          style={{
            color: '#00AFD6',
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
      flex: 0.2,
      minWidth: 10,
      field: 'total_hatched_eggs',
      sortable: false,
      disableColumnMenu: true,
      headerName: 'HATCHED',
      renderCell: params => (
        <Typography
          style={{
            color: theme.palette.primary.main,
            fontSize: '16px',
            fontWeight: '600',
            lineHeight: '19.36px'
          }}
        >
          {params.row.total_hatched_eggs ? params.row.total_hatched_eggs : '-'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 10,
      field: 'total_discarded_eggs',
      sortable: false,
      disableColumnMenu: true,
      headerName: 'DISCARDED',
      renderCell: params => (
        <Typography
          style={{
            color: theme.palette.formContent.tertiary,
            fontSize: '16px',
            fontWeight: '600',
            lineHeight: '19.36px'
          }}
        >
          {params.row.total_discarded_eggs ? params.row.total_discarded_eggs : '-'}
        </Typography>
      )
    }

    // {
    //   flex: 0.16,
    //   minWidth: 10,
    //   sortable: false,
    //   disableColumnMenu: true,
    //   field: 'created_at',
    //   headerName: 'TILL DATE',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.created_at
    //         ? moment(moment.utc(params.row.created_at).toDate().toLocaleString()).format('DD MMM YYYY')
    //         : '10 Apr 2024'}
    //     </Typography>
    //   )
    // }
  ]

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    // setStatus(newValue)
  }

  const getspeciesFunc = useCallback(
    async (q, fDate, tDate, fromSiteId, toSiteId, nurseryId) => {
      try {
        setLoading(true)

        const params = {
          taxonomy: q,
          from_date: fDate,
          til_date: tDate,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          from_site_id: fromSiteId || defaultFromSite?.site_id,
          to_site_id: toSiteId || defaultToSite?.site_id,
          nursery_id: nurseryId || defaultNursery?.nursery_id
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
    debounce(async q => {
      setSearchValue(q)
      try {
        await getspeciesFunc(
          q,
          fromDate,
          tillDate,
          defaultFromSite?.site_id,
          defaultToSite?.site_id,
          defaultNursery?.nursery_id
        )
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  useEffect(() => {
    getspeciesFunc(
      searchValue,
      fromDate,
      tillDate,
      defaultFromSite?.site_id,
      defaultToSite?.site_id,
      defaultNursery?.nursery_id
    )
  }, [getspeciesFunc])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = speciesList?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {}

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
      <Typography
        sx={{
          fontWeight: 500,
          fontSize: '24px',
          lineHeight: '29.05px',
          color: theme.palette.customColors.OnSurfaceVariant
        }}
      >
        Species
      </Typography>
      <Grid container columns={15} spacing={6}>
        <Grid item xs={3}>
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
              InputProps={{
                disableUnderline: true
              }}
              onChange={e => searchTableData(e.target.value)}
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
        </Grid>
        <Grid item xs={5}>
          <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  width: '100%',
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
                      searchValue,
                      formattedDate,
                      tillDate,
                      defaultFromSite?.site_id,
                      defaultToSite?.site_id,
                      defaultNursery?.nursery_id
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
                  width: '100%',
                  '& .css-sn37jt-MuiInputBase-root-MuiOutlinedInput-root': { height: '40px', borderRadius: '4px' },
                  '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-7px' },
                  '& .css-1d3z3hw-MuiOutlinedInput-notchedOutline': { border: '1px solid #C3CEC7' }
                }}
                value={tillDate}
                onChange={newDate => {
                  if (newDate) {
                    const formattedDate = moment(newDate.toISOString()).format('YYYY-MM-DD')
                    setTilDate(moment(newDate.toISOString()).format('YYYY-MM-DD'))
                    getspeciesFunc(
                      searchValue,
                      fromDate,
                      formattedDate,
                      defaultFromSite?.site_id,
                      defaultToSite?.site_id,
                      defaultNursery?.nursery_id
                    )
                  }
                }}
                label={'Till Date'}
                maxDate={dayjs()}
              />
            </LocalizationProvider>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <FormControl fullWidth>
            <Autocomplete
              name='fromSite'
              value={defaultFromSite}
              disablePortal
              id='fromSite'
              sx={{
                '& .css-jthw9v-MuiAutocomplete-root .MuiOutlinedInput-root': {
                  height: '40px',
                  borderRadius: '4px'
                },
                '& .css-1d3z3hw-MuiOutlinedInput-notchedOutline': { border: '1px solid #C3CEC7' }
              }}
              options={fromSiteList}
              getOptionLabel={option => option.site_name}
              isOptionEqualToValue={(option, value) => option?.site_id === value?.site_id}
              onChange={(e, val) => {
                if (val === null) {
                  setDefaultFromSite(null)
                  getspeciesFunc(
                    searchValue,
                    fromDate,
                    tillDate,
                    '',
                    defaultToSite?.site_id,
                    defaultNursery?.nursery_id
                  )
                } else {
                  setDefaultFromSite(val)
                  getspeciesFunc(
                    searchValue,
                    fromDate,
                    tillDate,
                    val?.site_id,
                    defaultToSite?.site_id,
                    defaultNursery?.nursery_id
                  )
                }
              }}
              renderInput={params => (
                <TextField
                  sx={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    width: '100%',
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
                    searchFromSite(e.target.value)
                  }}
                  {...params}
                  label='From Site'
                  placeholder='Search'
                />
              )}
            />
          </FormControl>
        </Grid>
        <Grid item xs={3}>
          <FormControl fullWidth>
            <Autocomplete
              name='toSite'
              value={defaultToSite}
              disablePortal
              id='toSite'
              options={toSiteList?.length > 0 ? toSiteList : []}
              getOptionLabel={option => option.site_name}
              isOptionEqualToValue={(option, value) => option?.site_id === value?.site_id}
              onChange={(e, val) => {
                if (val === null) {
                  setDefaultToSite(null)
                  getspeciesFunc(
                    searchValue,
                    fromDate,
                    tillDate,
                    defaultFromSite?.site_id,
                    '',
                    defaultNursery?.nursery_id
                  )
                } else {
                  setDefaultToSite(val)
                  getspeciesFunc(
                    searchValue,
                    fromDate,
                    tillDate,
                    defaultFromSite?.site_id,
                    val?.site_id,
                    defaultNursery?.nursery_id
                  )
                }
              }}
              renderInput={params => (
                <TextField
                  sx={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    width: '100%',
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
                    searchToSite(e.target.value)
                  }}
                  {...params}
                  label='Receiving Site'
                  placeholder='Search & Select'
                />
              )}
            />
          </FormControl>
        </Grid>
        <Grid item xs={3}>
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
                  getspeciesFunc(searchValue, fromDate, tillDate, defaultFromSite?.site_id, defaultToSite?.site_id, '')
                } else {
                  setDefaultNursery(val)
                  getspeciesFunc(
                    searchValue,
                    fromDate,
                    tillDate,
                    defaultFromSite?.site_id,
                    defaultToSite?.site_id,
                    val?.nursery_id
                  )
                }
              }}
              renderInput={params => (
                <TextField
                  sx={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    width: '100%',
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
                  label='Nursery'
                  placeholder='Search & Select'
                />
              )}
            />
          </FormControl>
        </Grid>
      </Grid>
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
        onSortModelChange={handleSortModel}
        // slots={{ toolbar: ServerSideToolbarWithFilter }}
        onPaginationModelChange={setPaginationModel}
        loading={loading}
        // slotProps={{
        //   baseButton: {
        //     variant: 'outlined'
        //   },
        //   toolbar: {
        //     value: searchValue,
        //     clearSearch: () => handleSearch(''),
        //     onChange: event => handleSearch(event.target.value)
        //   }
        // }}
        //   onCellClick={onCellClick}
      />
    </Box>
  )
}

export default Species
