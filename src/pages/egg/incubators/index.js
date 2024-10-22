/* eslint-disable lines-around-comment */
import React, { useState, useEffect, useCallback, useContext } from 'react'
import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import { Avatar, Button, Tooltip, Box, Breadcrumbs, Grid, TextField, FormControl, Autocomplete } from '@mui/material'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CustomChip from 'src/@core/components/mui/chip'
import Icon from 'src/@core/components/icon'
import Router from 'next/router'
import { useTheme } from '@mui/material/styles'
import Error404 from 'src/pages/404'
// import redBlink from 'public/images/gif/redBlink.gif'
import redBlink from 'public/images/branding/Antz_logo_h_color.svg'
import { AuthContext } from 'src/context/AuthContext'
import AddIncubators from '../../../views/pages/egg/incubator/addIncubators'
import Styles from './dot.module.css'
import { getAvailibilityList, getIncubatorList } from 'src/lib/api/egg/incubator'
import { GetRoomList } from 'src/lib/api/egg/room/getRoom'
import Utility from 'src/utility'
import ErrorScreen from 'src/pages/Error'

const IncubatorsList = () => {
  const theme = useTheme()
  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [dialog, setDialog] = useState(false)

  const [defaultSite, setDefaultSite] = useState(null)
  const [defaultRoom, setDefaultRoom] = useState(null)
  const [roomList, setRoomList] = useState([])
  const [availibilityList, setAvailibilityList] = useState([])
  const [defaultStatus, setDefaultStatus] = useState(null)
  const [defaultAvailibility, setDefaultAvailibility] = useState(null)

  const authData = useContext(AuthContext)
  const egg_nursery_permission = authData?.userData?.permission?.user_settings?.add_nursery_permisson
  const egg_collection_permission = authData?.userData?.roles?.settings?.enable_egg_collection_module

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    // setStatus(newValue)
  }

  const fetchTableData = useCallback(
    async (q, siteId, roomId, availibility, status) => {
      try {
        // console.log('til_date', siteId)
        setLoading(true)

        const params = {
          q: q || searchValue,
          sort,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          type: status || 'all',
          room_id: roomId,
          nursery_id: '',
          availability: availibility,
          site_id: siteId
        }
        // console.log('params', params)
        await getIncubatorList({ params }).then(res => {
          // console.log('response', res)

          // Generate uid field based on the index
          let listWithId = res?.data?.data?.result?.map((el, i) => {
            return { ...el, id: i + 1 }
          })
          setTotal(parseInt(res?.data?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, listWithId))

          // setstatusCheckval(res?.data?.result.map(all => all.active))
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    if (egg_nursery_permission || egg_collection_permission) {
      fetchTableData(
        searchValue,
        defaultSite?.site_id,
        defaultRoom?.room_id,
        defaultAvailibility?.key,
        defaultStatus?.key
      )
    }
  }, [fetchTableData])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    // if (newModel.length) {
    //   setSort(newModel[0].sort)
    //   setsortColumning(newModel[0].field)
    //   fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
    // } else {
    // }
  }

  const RoomList = async q => {
    try {
      const params = {
        page: 1,
        limit: 50,
        // nursery_id:
        search: q
      }
      await GetRoomList({ params: params }).then(res => {
        setRoomList(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }
  const AvailibityList = async () => {
    try {
      await getAvailibilityList().then(res => {
        setAvailibilityList(res?.data?.data)
      })
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    // RoomList('')
    AvailibityList()
  }, [])

  const searchRoom = useCallback(
    debounce(async q => {
      try {
        await RoomList(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const searchTableData = useCallback(
    debounce(async (q, siteId, roomId, availibility, status) => {
      setSearchValue(q)
      try {
        await fetchTableData(q, siteId, roomId, availibility, status)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSidebarClose = () => {
    setDialog(false)
  }

  const headerAction = (
    <>
      {egg_nursery_permission && (
        <Button
          sx={{ height: '40px', width: '126px' }}
          size='small'
          variant='contained'
          onClick={() => setDialog(true)}
        >
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; Add New
        </Button>
      )}
    </>
  )

  const handleSearch = (value, siteId, roomId, availibility, status) => {
    setSearchValue(value)
    searchTableData(value, siteId, roomId, availibility, status)
  }

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'id',
      headerName: 'NO',
      align: 'center',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontWeight: '400',
            lineHeight: '14.52px',
            fontSize: '12px'
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },

    {
      flex: 0.27,
      minWidth: 30,
      sortable: false,
      field: 'incubator_code',
      headerName: 'INCUBATOR ID',
      renderCell: params => (
        <Typography
          noWrap
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.incubator_code ? params.row.incubator_code : '-'}
        </Typography>
      )
    },
    {
      flex: 0.35,
      minWidth: 30,
      sortable: false,
      field: 'incubator_name',
      headerName: 'INCUBATOR NAME',
      renderCell: params => (
        <Tooltip title={params.row.incubator_name ? params.row.incubator_name : '-'}>
          <Typography
            noWrap
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.incubator_name ? params.row.incubator_name : '-'}
          </Typography>
        </Tooltip>
      )
    },
    // {
    //   flex: 0.3,
    //   minWidth: 10,
    //   field: 'sensors',
    //   sortable: false,
    //   headerName: 'SENSORS',
    //   renderCell: params => (
    //     <Box sx={{ display: 'flex', alignItems: 'center' }}>
    //       <Typography
    //         style={{
    //           color: theme.palette.customColors.OnSurfaceVariant,
    //           fontSize: '16px',
    //           fontWeight: '400',
    //           lineHeight: '19.36px'
    //         }}
    //       >
    //         2
    //       </Typography>{' '}
    //       {params.row.sensors === 'Alert' && <div className={Styles.circle}></div>}
    //       {params.row.sensors === 'Good' && (
    //         <div style={{ backgroundColor: theme.palette.primary.main }} className={Styles.green_circle}></div>
    //       )}
    //       <Typography
    //         sx={{
    //           color: params.row.sensors === 'Good' ? theme.palette.primary.main : theme.palette.formContent.tertiary,
    //           fontSize: '14px',
    //           fontWeight: '500',
    //           lineHeight: '16.94px'
    //         }}
    //       >
    //         {params.row.sensors ? params.row.sensors : '-'}
    //       </Typography>
    //     </Box>
    //   )
    // },
    {
      flex: 0.3,
      minWidth: 10,
      sortable: false,
      field: 'availability',
      headerName: 'AVAILABILITY',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.primary.dark,
            fontSize: '14px',
            fontWeight: '500',
            lineHeight: '16.94px'
          }}
        >
          {params.row.availability ? params.row.availability : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      sortable: false,
      field: 'site_name',
      headerName: 'SITE',
      renderCell: params => (
        <Tooltip title={params.row.site_name ? params.row.site_name : '-'}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.site_name ? params.row.site_name : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      sortable: false,
      field: 'room_name',
      headerName: 'ROOM NO',
      renderCell: params => (
        <Tooltip title={params.row.room_name ? params.row.room_name : '-'}>
          <Typography
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px'
            }}
          >
            {params.row.room_name ? params.row.room_name : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.12,
      minWidth: 20,
      sortable: false,
      align: 'right',
      field: 'no_of_eggs',
      headerName: 'EGGS',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.no_of_eggs ? params.row.no_of_eggs : '-'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      sortable: false,
      align: 'center',
      field: 'active',
      headerName: 'Status',
      renderCell: params => (
        <CustomChip
          skin='light'
          size='small'
          label={params.row?.active === '1' ? 'Active' : 'InActive'}
          color={params.row?.active === '1' ? 'success' : 'error'}
          sx={{
            height: 20,
            fontWeight: 600,
            borderRadius: '5px',
            fontSize: '0.875rem',
            textTransform: 'capitalize',
            '& .MuiChip-label': { mt: -0.25 }
          }}
        />
      )
    },
    {
      flex: 0.5,
      minWidth: 60,
      sortable: false,
      field: 'added_by',
      headerName: 'ADDED BY',
      renderCell: params => (
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
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={params.row.user_profile_pic}
                alt='Profile'
              />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
              {params.row?.created_at
                ? 'Created on' + ' ' + Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row?.created_at))
                : '-'}
            </Typography>
          </Box>
        </Box>
      )
    }
  ]

  const onCellClick = params => {
    // console.log(params, 'params')

    Router.push({
      pathname: `/egg/incubators/${params.row?.incubator_id}`
    })
  }

  return (
    <>
      {egg_nursery_permission || egg_collection_permission ? (
        loader ? (
          <FallbackSpinner />
        ) : (
          <>
            <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
              <Typography color='inherit'>Egg</Typography>

              <Typography sx={{ cursor: 'pointer' }} color='text.primary'>
                Incubator List
              </Typography>
            </Breadcrumbs>
            <Card>
              <CardHeader title='Incubator List' action={headerAction} />

              {/* <Grid sx={{ pl: 2, mb: 2 }} container>
                <Grid sx={{ px: 2 }} item xs={12} sm={6} md={4} lg={2}>
                  <Autocomplete
                    value={defaultUom}
                    disablePortal
                    id='uom'
                    options={uomList?.length > 0 ? uomList : []}
                    getOptionLabel={option => option.name}
                    isOptionEqualToValue={(option, value) => option?._id === value?._id}
                    onChange={(e, val) => {
                      if (val === null) {
                        setDefaultUom(null)

                        return onChange('')
                      } else {
                        setDefaultUom(val)

                        return onChange(val._id)
                      }
                    }}
                    renderInput={params => (
                      <StyledTextField
                        {...params}
                        label='All Time'
                        placeholder='Search & Select'
                        // error={Boolean(errors.uom)}
                      />
                    )}
                  />
                </Grid>
                <Grid sx={{ px: 2 }} item xs={12} sm={6} md={4} lg={2}>
                  <Autocomplete
                    value={defaultUom}
                    disablePortal
                    id='uom'
                    options={uomList?.length > 0 ? uomList : []}
                    getOptionLabel={option => option.name}
                    isOptionEqualToValue={(option, value) => option?._id === value?._id}
                    onChange={(e, val) => {
                      if (val === null) {
                        setDefaultUom(null)

                        return onChange('')
                      } else {
                        setDefaultUom(val)

                        return onChange(val._id)
                      }
                    }}
                    renderInput={params => (
                      <StyledTextField
                        {...params}
                        label='Deviced'
                        placeholder='Search & Select'
                        // error={Boolean(errors.uom)}
                      />
                    )}
                  />
                </Grid>
                <Grid sx={{ px: 2 }} item xs={12} sm={6} md={4} lg={2}>
                  <Autocomplete
                    value={defaultUom}
                    disablePortal
                    id='uom'
                    options={uomList?.length > 0 ? uomList : []}
                    getOptionLabel={option => option.name}
                    isOptionEqualToValue={(option, value) => option?._id === value?._id}
                    onChange={(e, val) => {
                      if (val === null) {
                        setDefaultUom(null)

                        return onChange('')
                      } else {
                        setDefaultUom(val)

                        return onChange(val._id)
                      }
                    }}
                    renderInput={params => (
                      <StyledTextField
                        {...params}
                        label='Availability'
                        placeholder='Search & Select'
                        // error={Boolean(errors.uom)}
                      />
                    )}
                  />
                </Grid>
                <Grid sx={{ px: 2 }} item xs={12} sm={6} md={4} lg={2}>
                  <Autocomplete
                    value={defaultUom}
                    disablePortal
                    id='uom'
                    options={uomList?.length > 0 ? uomList : []}
                    getOptionLabel={option => option.name}
                    isOptionEqualToValue={(option, value) => option?._id === value?._id}
                    onChange={(e, val) => {
                      if (val === null) {
                        setDefaultUom(null)

                        return onChange('')
                      } else {
                        setDefaultUom(val)

                        return onChange(val._id)
                      }
                    }}
                    renderInput={params => (
                      <StyledTextField
                        {...params}
                        label='Site'
                        placeholder='Search & Select'
                        // error={Boolean(errors.uom)}
                      />
                    )}
                  />
                </Grid>
                <Grid sx={{ px: 2 }} item xs={12} sm={6} md={4} lg={2}>
                  <Autocomplete
                    value={defaultUom}
                    disablePortal
                    id='uom'
                    options={uomList?.length > 0 ? uomList : []}
                    getOptionLabel={option => option.name}
                    isOptionEqualToValue={(option, value) => option?._id === value?._id}
                    onChange={(e, val) => {
                      if (val === null) {
                        setDefaultUom(null)

                        return onChange('')
                      } else {
                        setDefaultUom(val)

                        return onChange(val._id)
                      }
                    }}
                    renderInput={params => (
                      <StyledTextField
                        {...params}
                        label='Room'
                        placeholder='Search & Select'
                        // error={Boolean(errors.uom)}
                      />
                    )}
                  />
                </Grid>
              </Grid> */}
              <Grid sx={{ ml: -2, mb: 6, mt: -4 }} container columns={15} spacing={6}>
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
                    <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.OnSurfaceVariant} />
                    <TextField
                      variant='outlined'
                      placeholder='Search...'
                      InputProps={
                        {
                          // disableUnderline: true
                        }
                      }
                      onChange={e =>
                        handleSearch(
                          e.target.value,
                          defaultSite?.site_id,
                          defaultRoom?.room_id,
                          defaultAvailibility?.key,
                          defaultStatus?.key
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
                </Grid>

                <Grid item xs={3}>
                  <FormControl fullWidth>
                    <Autocomplete
                      name='status'
                      value={defaultStatus}
                      disablePortal
                      id='status'
                      options={[
                        { label: 'All', key: 'all' },
                        { label: 'Active', key: 'only_active' },
                        { label: 'Inactive', key: 'only_deactive' }
                      ]}
                      getOptionLabel={option => option.label}
                      isOptionEqualToValue={(option, value) => option?.key === value?.key}
                      onChange={(e, val) => {
                        if (val === null) {
                          setDefaultStatus(null)
                          fetchTableData(
                            searchValue,
                            defaultSite?.site_id,
                            defaultRoom?.room_id,
                            defaultAvailibility?.key,
                            ''
                          )
                        } else {
                          setDefaultStatus(val)
                          fetchTableData(
                            searchValue,
                            defaultSite?.site_id,
                            defaultRoom?.room_id,
                            defaultAvailibility?.key,
                            val?.key
                          )
                        }
                      }}
                      renderInput={params => (
                        <TextField
                          sx={{
                            backgroundColor: '#fff',
                            borderColor: '1px solid #C3CEC7',
                            width: '100%',
                            '& .MuiOutlinedInput-root': {
                              height: 40,
                              borderRadius: '4px'
                            },
                            '& .MuiInputLabel-root': {
                              top: -7
                            },
                            '& input': {
                              position: 'relative',
                              top: -7
                            }
                          }}
                          onChange={e => {
                            searchNursery(e.target.value)
                          }}
                          {...params}
                          label='Status'
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
                  }
                }}
                columnVisibilityModel={{
                  sl_no: false
                }}
                // sortModel={}
                hideFooterSelectedRowCount
                disableColumnSelector={true}
                autoHeight
                pagination
                rows={indexedRows === undefined ? [] : indexedRows}
                rowCount={total}
                rowHeight={64}
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
                onCellClick={onCellClick}
              />
              <AddIncubators actionApi={fetchTableData} sidebarOpen={dialog} handleSidebarClose={handleSidebarClose} />
            </Card>
          </>
        )
      ) : (
        <>
          {' '}
          <ErrorScreen></ErrorScreen>
        </>
      )}
    </>
  )
}

export default IncubatorsList
