/* eslint-disable lines-around-comment */
import React, { useState, useEffect, useCallback, useContext } from 'react'

import { getIngredientList } from 'src/lib/api/diet/getIngredients'

import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { styled } from '@mui/material/styles'
import MuiTabList from '@mui/lab/TabList'
import TabList from '@mui/lab/TabList'
import moment from 'moment'
import CustomChip from 'src/@core/components/mui/chip'
import { Avatar, Button, Tooltip, Box, Breadcrumbs } from '@mui/material'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import Router from 'next/router'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import ConfirmationCheckBox from 'src/views/forms/form-elements/confirmationCheckBox'
import { useTheme } from '@mui/material/styles'
import AddIngredients from 'src/components/diet/AddIngredients'
import Error404 from 'src/pages/404'
// import redBlink from 'public/images/gif/redBlink.gif'
import redBlink from 'public/images/branding/Antz_logo_h_color.svg'

import { AuthContext } from 'src/context/AuthContext'
import { getUnitsForIngredient } from 'src/lib/api/diet/getFeedDetails'
import AddIncubators from '../../../views/pages/egg/incubator/addIncubators'
import Styles from './dot.module.css'
import { getIncubatorList } from 'src/lib/api/egg/incubator'
import Utility from 'src/utility'
import ErrorScreen from 'src/pages/Error'

const IncubatorsList = () => {
  const cuurent_date = moment().format('YYYY-MM-DD')
  const theme = useTheme()
  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumning, setsortColumning] = useState('ingredient_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [dialog, setDialog] = useState(false)

  const authData = useContext(AuthContext)
  const eggModule = authData?.userData?.roles?.settings?.egg_module
  const eggModuleAccess = authData?.userData?.roles?.settings?.egg_module_access

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
    async q => {
      try {
        // console.log('til_date', cuurent_date)
        setLoading(true)

        const params = {
          q: q || searchValue,
          sort,
          from_date: '2024-05-29',
          til_date: cuurent_date,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          type: 'all',
          // room_id: 1,
          room_id: '',
          // nursery_id: 2,
          nursery_id: '',
          // site_id: 14
          site_id: ''
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
      fetchTableData(searchValue)
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

  const searchTableData = useCallback(
    debounce(async q => {
      setSearchValue(q)
      try {
        await fetchTableData(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  // const handleSidebarOpen = () => {
  //   setDialog(true)
  // }

  const handleSidebarClose = () => {
    setDialog(false)
  }

  const headerAction = (
    <>
      {/* {eggModule && (eggModuleAccess === 'ADD' || eggModuleAccess === 'EDIT' || eggModuleAccess === 'DELETE') && ( */}
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
      {/* )} */}
    </>
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(value)
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

  // const TabBadge = ({ label, totalCount }) => (
  //   <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
  //     {label}
  //     {totalCount ? (
  //       <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
  //     ) : null}
  //   </div>
  // )

  // const StyledTextField = styled(TextField)({
  //   '& .MuiInputBase-root': {
  //     top: 6,
  //     padding: '0px 8px 4px 8px', // Adjust padding to decrease height
  //     fontSize: '14px' // Adjust font size if needed
  //   },
  //   '& .MuiInputLabel-root': {
  //     fontSize: '14px' // Adjust label font size if needed
  //   }
  // })
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
              <AddIncubators
                searchValue={searchValue}
                actionApi={fetchTableData}
                sidebarOpen={dialog}
                handleSidebarClose={handleSidebarClose}
              />
            </Card>
          </>
        )
      ) : (
        <>
          <ErrorScreen></ErrorScreen>
        </>
      )}
    </>
  )
}

export default IncubatorsList
