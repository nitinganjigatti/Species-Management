'use client';
import React, { useState, useEffect } from 'react'
import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import { Avatar, Button, Tooltip, Box, Switch, Divider } from '@mui/material'
import toast from 'react-hot-toast'
import { useTheme } from '@mui/material/styles'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Icon from 'src/@core/components/icon'

const IngredientsListforRecipeDetail = ({ IngredientsDetailsval }) => {
  const [loader, setLoader] = useState(false)
  const theme = useTheme()
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
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
      headerName: 'ITEM NAME',
      renderCell: params => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            overflow: 'hidden'
          }}
        >
          <Avatar
            variant='square'
            alt='Ingredient Image'
            sx={{
              width: 40,
              height: 40,
              mr: 2,
              background: theme.palette.customColors.tableHeaderBg,
              padding: '8px',
              borderRadius: '4px'
            }}
            src={params.row.ingredient_image ? params.row.ingredient_image : '/icons/icon_ingredient_fill.png'}
          >
            {params.row.ingredient_image ? null : <Icon icon='healthicons:fruits-outline' />}
          </Avatar>

          <Tooltip title={params.row.ingredient_name ? params.row.ingredient_name : ''}>
            <Typography
              noWrap
              variant='body2'
              sx={{
                color: 'text.primary',
                maxWidth: 'calc(100% - 50px)'
              }}
              className='text_overflow_moduled'
            >
              {params.row.ingredient_name ? params.row.ingredient_name : '-'}
            </Typography>
          </Tooltip>
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'ingredient_id',
      headerName: 'ITEM ID',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
          {params.row.ingredient_id ? 'ING' + params.row.ingredient_id : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'feed_type',
      headerName: 'FEED TYPE',
      renderCell: params => (
        <Tooltip title={params.row.feed_type_label ? params.row.feed_type_label : ''}>
          <Typography
            variant='body2'
            className='text_overflow_moduled'
            sx={{ color: 'text.primary', pl: 3, maxWidth: 'calc(100% - 10px)' }}
          >
            {params.row.feed_type_label ? params.row.feed_type_label : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.43,
      minWidth: 10,
      field: 'quantity',
      headerName: 'QUANTITY',
      renderCell: params => (
        <>
          <Tooltip
            title={`${params.row.quantity ? parseFloat(params.row.quantity).toFixed(2) : '-'}${
              params.row.uom_text ? ` ${params.row.uom_text}` : ''
            }`}
          >
            <Typography variant='body2' sx={{ color: 'text.primary', pl: 2 }} className='text_overflow_moduled'>
              {params.row.quantity ? parseFloat(params.row.quantity).toFixed(1) : '-'}
              {params.row.uom_text ? ` ${params.row.uom_text}` : ''}
            </Typography>
          </Tooltip>
        </>
      )
    },
    {
      flex: 0.5,
      minWidth: 30,
      field: 'preparation_type',
      headerName: 'PREPARATION TYPE',
      renderCell: params => (
        <Tooltip title={params.row.preparation_type}>
          <Typography variant='body2' sx={{ color: 'text.primary', pl: 2 }} className='text_overflow_moduled'>
            {params.row.preparation_type ? params.row.preparation_type : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'cut_size',
      headerName: 'CUT SIZE',
      renderCell: params => (
        <Tooltip title={params?.row?.cut_size}>
          <Typography
            variant='body2'
            sx={{
              color: 'text.primary',
              pl: 2,
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '130px',
              overflow: 'hidden'
            }}
          >
            {params.row.cut_size ? params.row.cut_size : '-'}
          </Typography>
        </Tooltip>
      )
    }
  ]

  const tableDataQuantity = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <Card sx={{ boxShadow: 'none' }}>
            <CardHeader title='Item by quantity' sx={{ pl: 0 }} />

            <CommonTable
              indexedRows={rowsQuantity.map((row, index) => ({ ...row, id: index }))}
              total={rowsQuantity.length}
              columns={columns}
              loading={loading}
              columnVisibilityModel={{
                sl_no: false
              }}
              hideFooter={true}
              disablePagination={true}
            />
          </Card>
        )}
      </>
    )
  }

  return (
    <>
      <Grid>
        <Typography variant='h5' gutterBottom>
          Ingredients
        </Typography>
        <Grid container sx={{ mt: 2, justifyContent: 'flex-start' }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MUISearch
              value={searchValue}
              onChange={e => handleSearch(e.target.value)}
              onClear={handleClearSearch}
              placeholder='Search ingredients'
            />
          </Grid>
        </Grid>
        <TabContext value={status}>
          <TabList onChange={handleChange}>
            <Tab value='active' label='Active' />
            <Tab value='inactive' label='Inactive' />
          </TabList>

          <TabPanel value='active'>{tableDataQuantity()}</TabPanel>
          <TabPanel value='inactive'>{tableDataQuantity()}</TabPanel>
        </TabContext>
      </Grid>
    </>
  )
}

export default IngredientsListforRecipeDetail
