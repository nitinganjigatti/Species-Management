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
import Utility from 'src/utility'
import { useTranslation } from 'react-i18next'

const IngredientsListforRecipeDetail = ({ IngredientsDetailsval }) => {
  const [loader, setLoader] = useState(false)
  const { t } = useTranslation()
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

  const columnsforPercentage = [
    {
      flex: 0.5,
      minWidth: 30,
      field: 'ingredient_name',
      headerName: t('diet_module.item_name'),
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            variant='square'
            alt='Ingredient Image'
            sx={{
              width: 40,
              height: 40,
              mr: 4,
              background: theme.palette.customColors.tableHeaderBg,
              padding: '8px',
              borderRadius: '4px'
            }}
            src={params.row.ingredient_image ? params.row.ingredient_image : '/icons/icon_ingredient_fill.png'}
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
      field: 'ingredient_id',
      headerName: t('diet_module.item_id'),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
          {params.row.ingredient_id ? 'ING' + params.row.ingredient_id : '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'feed_type',
      headerName: t('diet_module.feed_type'),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }} title={params.row.feed_type}>
          {params.row.feed_type_label ? params.row.feed_type_label : '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 10,
      field: 'quantity',
      headerName: t('diet_module.quantity_perc'),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
          {params.row.quantity ? Utility.formatNumber(params.row.quantity) : '-'}
          {params.row.uom_text ? ` ${params.row.uom_text}` : '%'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'preparation_type',
      headerName: t('diet_module.preparation_type'),
      renderCell: params => (
        <Tooltip title={params?.row?.preparation_type} arrow placement='bottom-start'>
          <Typography variant='body2' sx={{ color: 'text.primary', pl: 2 }} className='text_overflow_moduled'>
            {params.row.preparation_type ? params.row.preparation_type : '-'}
          </Typography>
        </Tooltip>
      )
    }
  ]

  const tableDataPercentage = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <Card sx={{ boxShadow: 'none' }}>
            <CardHeader title={t('diet_module.item_by_perc')} sx={{ pl: 0 }} />

            <CommonTable
              indexedRows={rowsPercentage.map((row, index) => ({ ...row, id: index }))}
              total={rowsPercentage.length}
              columns={columnsforPercentage}
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
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <MUISearch
              value={searchValue}
              onChange={e => handleSearch(e.target.value)}
              onClear={handleClearSearch}
              placeholder={t('diet_module.search_ingredients')}
            />
          </Grid>
        </Grid>
        <TabContext value={status}>
          <TabList onChange={handleChange}>
            <Tab value='active' label='Active' />
            <Tab value='inactive' label='Inactive' />
          </TabList>

          <TabPanel value='active'>{tableDataPercentage()}</TabPanel>
          <TabPanel value='inactive'>{tableDataPercentage()}</TabPanel>
        </TabContext>
      </Grid>
    </>
  )
}

export default IngredientsListforRecipeDetail
