import React, { useState, useEffect, useCallback } from 'react'

import { getIngredientList } from 'src/lib/api/diet/getIngredients'

import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import moment from 'moment'
import { Avatar, Button, Tooltip, Box, Switch, Divider, TextField } from '@mui/material'
import toast from 'react-hot-toast'
import IconButton from '@mui/material/IconButton'
import ClearIcon from '@mui/icons-material/Clear'
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'

// ** MUI Imports

import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import Router from 'next/router'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { updateIngredientStatus } from 'src/lib/api/diet/getIngredients'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'

// Styled TabList component

const IngredientsListforRecipeDetail = ({ IngredientsDetailsval }) => {
  const [loader, setLoader] = useState(false)

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [rowsqn, setrowsqn] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumning, setsortColumning] = useState('ingredient_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('active')
  const [rowsPercentage, setRowsPercentage] = useState([])
  const [rowsQuantity, setRowsQuantity] = useState([])

  const handleChange = (event, newValue) => {
    setTotal(0)
    setStatus(newValue)
  }

  useEffect(() => {
    // Filter ingredients by percentage
    const filteredPercentage = IngredientsDetailsval?.ingredient_by_percentage.filter(ingredient =>
      ingredient.ingredient_name.toLowerCase().includes(searchValue.toLowerCase())
    )
    // Filter ingredients by quantity
    const filteredQuantity = IngredientsDetailsval?.ingredient_by_quantity.filter(ingredient =>
      ingredient.ingredient_name.toLowerCase().includes(searchValue.toLowerCase())
    )
    setRowsPercentage(filteredPercentage)
    setRowsQuantity(filteredQuantity)
    setTotal(filteredPercentage.length + filteredQuantity.length)
  }, [IngredientsDetailsval, searchValue])

  const handleSwitchChange = async (event, rowData) => {
    console.log(event.target.checked, 'lll')
    console.log(rowData, 'rowData')
    const newIsActive = event.target.checked ? 1 : 0
    try {
      const response = await updateIngredientStatus(rowData?.id, { active: newIsActive })
      console.log(response, 'response')
      if (response.success === true) {
        fetchTableData(sort, searchValue, sortColumning, status)
        return toast(
          t => (
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Icon icon='ooui:success' style={{ marginRight: '20px', fontSize: 30, color: '#37BD69' }} />
                <div>
                  <Typography sx={{ fontWeight: 500 }} variant='h5'>
                    Success!
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant='body2' sx={{ color: '#44544A' }}>
                    Ingredient {'ING' + rowData.id} has been successfully{' '}
                    {newIsActive === 1 ? 'actiavted' : 'deactivated'}
                  </Typography>
                </div>
              </Box>
              <IconButton
                onClick={() => toast.dismiss(t.id)}
                style={{ position: 'absolute', top: 5, right: 5, float: 'right' }}
              >
                <Icon icon='mdi:close' fontSize={24} />
              </IconButton>
            </Box>
          ),
          {
            style: {
              minWidth: '450px',
              minHeight: '130px'
            }
          }
        )
      } else {
        alert('something went wrong')
      }
    } catch (error) {
      console.error('Error updating ingredient status:', error)
    }
  }

  const handleSearch = value => {
    setSearchValue(value)
  }

  const handleClearSearch = () => {
    setSearchValue('')
    setRowsPercentage([])
    setRowsQuantity([])
  }

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'uid',
      headerName: 'SL ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 30,
      field: 'ingredient_name',
      headerName: 'INGREDIENTS',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* {renderClient(params)} */}
          <Avatar
            variant='square'
            alt='Medicine Image'
            sx={{ width: 40, height: 40, mr: 4, background: '#E8F4F2', padding: '8px', borderRadius: '4px' }}
            src={params.row.ingredient_image ? params.row.ingredient_image : null}
          >
            {params.row.ingredient_image ? null : <Icon icon='healthicons:fruits-outline' />}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary' }}>
              {params.row.ingredient_name ? params.row.ingredient_name : '-'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'id',
      headerName: 'INGREDIENT ID',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.id ? 'ING' + params.row.id : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'calorie',
      headerName: 'CALORIES',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.calorie ? params.row.calorie + ' Kcal' : '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'protein',
      headerName: 'PREPARATION TYPES',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <Tooltip
            title={
              params.row.preparation_types && params.row.preparation_types.length > 0
                ? params.row.preparation_types.map(preparation => (
                    <div style={{ padding: '4px' }} key={preparation.label}>
                      {preparation.label}
                    </div>
                  ))
                : '-'
            }
            arrow
            placement='right'
            // style={{ background: '#1F515B' }}
          >
            <span>{params.row.preparation_type_count ? params.row.preparation_type_count : '-'}</span>
          </Tooltip>
        </Typography>
      )
    },
    {
      flex: 0.6,
      minWidth: 60,
      field: 'user_name',
      headerName: 'CREATED BY',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* {renderClient(params)} */}
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
            {params.row.created_by_user?.profile_pic ? (
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={params.row.created_by_user?.profile_pic}
                alt='Profile'
              />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14, fontWeight: 500 }}>
              {params.row.created_by_user?.user_name ? params.row.created_by_user?.user_name : '-'}
            </Typography>
            <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
              {params.row.created_at ? 'Created on' + ' ' + moment(params.row.created_at).format('DD/MM/YYYY') : '-'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'switch',
      headerName: '',
      disableColumnMenu: true, // Exclude from column menu
      renderCell: params => (
        <Box sx={{ my: 4, height: '40px', display: 'flex', justifyContent: 'space-between' }}>
          <Switch
            checked={params.row.active === '0' ? false : true}
            onChange={event => handleSwitchChange(event, params.row)}
            fontSize={2}
          />
        </Box>
      )
    }
  ]

  const onCellClick = params => {
    console.log(params, 'params')
    const clickedColumn = params.field !== 'switch'

    if (clickedColumn) {
      const data = params.row

      Router.push({
        pathname: `/diet/ingredient/${data?.id}`
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

  const tableDataPercentage = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <Card sx={{ boxShadow: 'none' }}>
            <CardHeader title='Ingredient by percentage' />

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
              autoHeight
              rows={rowsPercentage}
              rowCount={rowsPercentage.length}
              columns={columns}
              loading={loading}
              hideFooter={true}
              //slots={{ toolbar: ServerSideToolbarWithFilter }}
              //   slotProps={{
              //     baseButton: {
              //       variant: 'outlined'
              //     },
              //     toolbar: {
              //       value: searchValue,
              //       clearSearch: () => handleSearch(''),
              //       onChange: event => handleSearch(event.target.value)
              //     }
              //   }}
              onCellClick={onCellClick}
            />
          </Card>
        )}
      </>
    )
  }

  const tableDataQuantity = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <Card sx={{ boxShadow: 'none', mt: 12 }}>
            <CardHeader title='Ingredient by quantity' />

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
              autoHeight
              hideFooterSelectedRowCount
              disableColumnSelector={true}
              hideFooter={true}
              rows={rowsQuantity}
              rowCount={rowsQuantity.length}
              columns={columns}
              loading={loading}
              onCellClick={onCellClick}
            />
          </Card>
        )}
      </>
    )
  }

  return (
    <>
      <Grid>
        {/* Ingredients header */}
        <Typography variant='h5' gutterBottom>
          Ingredients
        </Typography>
        <Grid item sx={{ float: 'right' }}>
          <TextField
            placeholder='Search ingredients'
            value={searchValue}
            onChange={e => handleSearch(e.target.value)}
            sx={{ width: '250px', height: '20px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchValue && (
                <IconButton onClick={handleClearSearch}>
                  <ClearIcon />
                </IconButton>
              )
            }}
          />
        </Grid>
        <TabContext value={status}>
          <TabList onChange={handleChange}>
            <Tab value='active' label='Active' />
            <Tab value='inactive' label='Inactive' />
          </TabList>

          <TabPanel value='active'>
            {tableDataPercentage()}
            {tableDataQuantity()}
          </TabPanel>
          <TabPanel value='inactive'>
            {tableDataPercentage()}
            {tableDataQuantity()}
          </TabPanel>
        </TabContext>
      </Grid>
    </>
  )
}

export default IngredientsListforRecipeDetail
