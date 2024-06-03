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
import { Avatar, Button, Tooltip, Box, Switch, Divider, Autocomplete, TextField } from '@mui/material'
import toast from 'react-hot-toast'
import CustomChip from 'src/@core/components/mui/chip'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'

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
import AddIncubators from './addIncubators'
import Styles from './dot.module.css'

const roleColors = {
  active: 'success',
  inactive: 'error'
}

const tableData = [
  {
    id: 1,
    incubators_id: 'INC 0001 / 24',
    censors: 'Good',
    availability: 'Fully Occupied',
    site: 'Site Name XYZ',
    room_no: 123,
    eggs: 7,
    added_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      created_at: '10/10/2023'
    }
  },
  {
    id: 2,
    incubators_id: 'INC 0001 / 24',
    censors: 'Alert',
    availability: 'Fully Occupied',
    site: 'Site Name XYZ',
    room_no: 123,
    eggs: 7,
    added_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      created_at: '10/10/2023'
    }
  },
  {
    id: 3,
    incubators_id: 'INC 0001 / 24',
    censors: 'Good',
    availability: 'Fully Occupied',
    site: 'Site Name XYZ',
    room_no: 123,
    eggs: 7,
    added_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      created_at: '10/10/2023'
    }
  },
  {
    id: 4,
    incubators_id: 'INC 0001 / 24',
    censors: 'Good',
    availability: 'Fully Occupied',
    site: 'Site Name XYZ',
    room_no: 123,
    eggs: 7,
    added_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      created_at: '10/10/2023'
    }
  },
  {
    id: 5,
    incubators_id: 'INC 0001 / 24',
    censors: 'Good',
    availability: 'Fully Occupied',
    site: 'Site Name XYZ',
    room_no: 123,
    eggs: 7,
    added_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      created_at: '10/10/2023'
    }
  },
  {
    id: 6,
    incubators_id: 'INC 0001 / 24',
    censors: 'Alert',
    availability: 'Fully Occupied',
    site: 'Site Name XYZ',
    room_no: 123,
    eggs: 7,
    added_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      created_at: '10/10/2023'
    }
  },
  {
    id: 7,
    incubators_id: 'INC 0001 / 24',
    censors: 'Alert',
    availability: 'Fully Occupied',
    site: 'Site Name XYZ',
    room_no: 123,
    eggs: 7,
    added_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      created_at: '10/10/2023'
    }
  },
  {
    id: 8,
    incubators_id: 'INC 0001 / 24',
    censors: 'Good',
    availability: 'Fully Occupied',
    site: 'Site Name XYZ',
    room_no: 123,
    eggs: 7,
    added_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      created_at: '10/10/2023'
    }
  },
  {
    id: 9,
    incubators_id: 'INC 0001 / 24',
    censors: 'Alert',
    availability: 'Fully Occupied',
    site: 'Site Name XYZ',
    room_no: 123,
    eggs: 7,
    added_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      created_at: '10/10/2023'
    }
  },
  {
    id: 10,
    incubators_id: 'INC 0001 / 24',
    censors: 'Good',
    availability: 'Fully Occupied',
    site: 'Site Name XYZ',
    room_no: 123,
    eggs: 7,
    added_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      created_at: '10/10/2023'
    }
  }
]

const IncubatorsList = () => {
  const theme = useTheme()
  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState(tableData || [])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumning, setsortColumning] = useState('ingredient_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [check, setCheck] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState()

  const [uomList, setUom] = useState([])
  const [defaultUom, setDefaultUom] = useState(null)

  const authData = useContext(AuthContext)
  const eggModule = authData?.userData?.roles?.settings?.egg_module
  const eggModuleAccess = authData?.userData?.roles?.settings?.egg_module_access

  function loadServerRows(currentPage, data) {
    return data
  }

  const getUnitsList = async () => {
    try {
      const params = {
        type: ['length', 'weight'],
        page_no: 1,
        limit: 50
      }
      await getUnitsForIngredient({ params: params }).then(res => {
        setUom(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    getUnitsList()
  }, [])

  const handleChange = (event, newValue) => {
    setTotal(0)
    setStatus(newValue)
  }

  const fetchTableData = useCallback(
    async (sort, q, sortColumn, status) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          sortColumn,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          status
        }

        await getIngredientList({ params: params }).then(res => {
          console.log('response', res)

          // Generate uid field based on the index
          let listWithId = res.data.result.map((el, i) => {
            return { ...el, uid: i + 1 }
          })
          setTotal(parseInt(res?.data?.total_count))
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

  // useEffect(() => {
  //   if (eggModule) {
  //     fetchTableData(sort, searchValue, sortColumning, status)
  //   }
  // }, [fetchTableData, status])

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

  const searchTableData = useCallback()
  // debounce(async (sort, q, sortColumn, status) => {
  //   setSearchValue(q)
  //   try {
  //     await fetchTableData(sort, q, sortColumn, status)
  //   } catch (error) {
  //     console.error(error)
  //   }
  // }, 1000),
  // []

  // const handleSidebarOpen = () => {
  //   setDialog(true)
  // }

  const handleSidebarClose = () => {
    setDialog(false)
  }

  const headerAction = (
    <>
      {/* {eggModule && (eggModuleAccess === 'ADD' || eggModuleAccess === 'EDIT' || eggModuleAccess === 'DELETE') && ( */}
      <div>
        <Button size='small' variant='contained' onClick={() => setDialog(true)}>
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; Add New
        </Button>
      </div>
      {/* )} */}
    </>
  )

  const handleSearch = value => {
    // setSearchValue(value)
    // searchTableData(sort, value, sortColumning, status)
  }

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'uid',
      headerName: 'SL ',
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
      flex: 0.35,
      minWidth: 30,
      field: 'incubators_id',
      headerName: 'INCUBATORS ID',
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
          {params.row.incubators_id ? params.row.incubators_id : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'censors',
      headerName: 'CENSORS',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px'
            }}
          >
            2
          </Typography>{' '}
          {params.row.censors === 'Alert' && <div className={Styles.circle}></div>}
          {params.row.censors === 'Good' && (
            <div style={{ backgroundColor: theme.palette.primary.main }} className={Styles.green_circle}></div>
          )}
          <Typography
            sx={{
              color: params.row.censors === 'Good' ? theme.palette.primary.main : theme.palette.formContent.tertiary,
              fontSize: '14px',
              fontWeight: '500',
              lineHeight: '16.94px'
            }}
          >
            {params.row.censors ? params.row.censors : '-'}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.35,
      minWidth: 10,
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
      flex: 0.35,
      minWidth: 20,
      field: 'site',
      headerName: 'SITE',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.site ? params.row.site : '-'}
        </Typography>
      )
    },
    {
      flex: 0.24,
      minWidth: 20,
      field: 'room_no',
      headerName: 'ROOM NO',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.room_no ? params.row.room_no : '-'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'eggs',
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
          {params.row.eggs ? params.row.eggs : '-'}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 60,
      field: 'added_by',
      headerName: 'ADDED BY',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            variant='square'
            alt='Medicine Image'
            sx={{
              width: 30,
              height: 30,
              mr: 4,
              borderRadius: '50%',
              background: '#E8F4F2',
              overflow: 'hidden'
            }}
          >
            {params.row.added_by?.profile_pic ? (
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={params.row.added_by?.profile_pic}
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
              {params.row.added_by?.user_name ? params.row.added_by?.user_name : '-'}
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
              {params.row?.added_by?.created_at
                ? 'Created on' + ' ' + moment(params.row?.added_by?.created_at).format('DD/MM/YYYY')
                : '-'}
            </Typography>
          </Box>
        </Box>
      )
    }
  ]

  const onCellClick = params => {
    // console.log(params, 'params')
    // const clickedColumn = params.field !== 'switch'
    // if (clickedColumn) {
    //   const data = params.row
    Router.push({
      pathname: `/egg/incubators/6`
    })
    // } else {
    //   return
    // }
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
      {loader ? (
        <FallbackSpinner />
      ) : (
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
          <AddIncubators sidebarOpen={dialog} handleSidebarClose={handleSidebarClose} />
        </Card>
      )}
    </>
  )
}

export default IncubatorsList
