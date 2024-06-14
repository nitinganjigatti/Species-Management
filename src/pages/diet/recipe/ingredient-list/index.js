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
    const filteredPercentage = IngredientsDetailsval?.by_percentage.filter(
      ingredient =>
        ingredient.ingredient_name.toLowerCase().includes(searchValue.toLowerCase()) && ingredient.status === status
    )

    // Filter ingredients by quantity
    const filteredQuantity = IngredientsDetailsval?.by_quantity.filter(
      ingredient =>
        ingredient.ingredient_name.toLowerCase().includes(searchValue.toLowerCase()) && ingredient.status === status
    )
    setRowsPercentage(filteredPercentage)
    setRowsQuantity(filteredQuantity)
    setTotal(filteredPercentage.length + filteredQuantity.length)
  }, [IngredientsDetailsval, searchValue, status])

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
      flex: 0.5,
      minWidth: 30,
      field: 'ingredient_name',
      headerName: 'INGREDIENT NAME',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* {renderClient(params)} */}
          {console.log(params, 'params')}
          <Avatar
            variant='square'
            alt='Medicine Image'
            sx={{ width: 40, height: 40, mr: 4, background: '#E8F4F2', padding: '8px', borderRadius: '4px' }}
            src={params.row.ingredient_image ? params.row.ingredient_image : '/icons/icon_recipe_fill.png'}
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
      flex: 0.4,
      minWidth: 10,
      field: 'ingredient_id',
      headerName: 'INGREDIENT ID',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.ingredient_id ? 'ING' + params.row.ingredient_id : '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'feed_type',
      headerName: 'FEED TYPE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }} title={params.row.feed_type}>
          {params.row.feed_type_label ? params.row.feed_type_label : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'quantity',
      headerName: 'QUANTITY',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.quantity ? parseFloat(params.row.quantity).toFixed(2) : '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'preparation_type',
      headerName: 'PREPARATION TYPE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }} title={params.row.preparation_type}>
          {params.row.preparation_type ? params.row.preparation_type : '-'}
        </Typography>
      )
    }
  ]

  // const onCellClick = params => {
  //   console.log(params, 'params')
  //   const clickedColumn = params.field !== 'switch'

  //   if (clickedColumn) {
  //     const data = params.row

  //     Router.push({
  //       pathname: `/diet/ingredient/${data?.id}`
  //     })
  //   } else {
  //     return
  //   }
  // }

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
              rows={rowsPercentage.map((row, index) => ({ ...row, id: index }))}
              rowCount={rowsPercentage.length}
              columns={columns}
              loading={loading}
              hideFooter={true}

              // onCellClick={onCellClick}
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
              rows={rowsQuantity.map((row, index) => ({ ...row, id: index }))}
              rowCount={rowsQuantity.length}
              columns={columns}
              loading={loading}

              // onCellClick={onCellClick}
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
