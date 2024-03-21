import React, { useState, useEffect, useCallback } from 'react'

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
import { Avatar, Button, Tooltip, FormControlLabel, Box, Switch } from '@mui/material'
import IngredientDetailDialog from './ingredientdetail-dialog'

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

// Styled TabList component

const IngredientsList = () => {
  const [loader, setLoader] = useState(false)

  /***** Server side pagination */

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumning, setsortColumning] = useState('ingredient_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('all')
  const [open, setOpen] = useState(false)
  const [IngredientRowVal, setIngredientRowVal] = useState({})

  function loadServerRows(currentPage, data) {
    return data
  }

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
          limit: paginationModel.pageSize
          //status
        }

        await getIngredientList({ params: params }).then(res => {
          console.log('response', res)
          // Generate uid field based on the index
          let listWithId = res.data.result.map((el, i) => {
            return { ...el, uid: i + 1 }
          })
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, listWithId))
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
    fetchTableData(sort, searchValue, sortColumning, status)
  }, [fetchTableData, status])
  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setsortColumning(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, sortColumn, status) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, sortColumn, status)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const headerAction = (
    <div>
      <Button
        size='small'
        variant='contained'

        // onClick={() => Router.push('/diet/add-feed')}
      >
        <Icon icon='mdi:add' fontSize={20} />
        &nbsp; Add New
      </Button>
    </div>
  )

  const handleSwitchChange = (event, rowData) => {
    console.log(event.target.checked, 'lll')
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
            title={params.row.protein ? params.row.protein : '-'}
            arrow
            placement='right'
            sx={{ backgroundColor: 'blue' }}
          >
            <span>{params.row.protein ? params.row.protein : '-'}</span>
          </Tooltip>
        </Typography>
      )
    },
    {
      flex: 0.6,
      minWidth: 60,
      field: 'ingredient_nameQ',
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
            {params.row.created_by_user[0]?.profile_pic ? (
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={params.row.created_by_user[0]?.profile_pic}
                alt='Profile'
              />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14, fontWeight: 500 }}>
              {params.row.created_by_user[0]?.user_name ? params.row.created_by_user[0]?.user_name : '-'}
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
          <FormControlLabel
            control={<Switch defaultChecked onChange={event => handleSwitchChange(event, params.row)} fontSize={2} />}
            label=''
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
      //   setOpen(true)
      //   setIngredientRowVal(data)
    } else {
      return
    }
  }

  const handleClose = () => {
    setOpen(false)
  }

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <Card>
            <CardHeader title='Ingredients' action={headerAction} />

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
          </Card>
        )}
      </>
    )
  }

  return (
    <>
      <Grid>
        <TabContext value={status}>
          <TabList onChange={handleChange}>
            <Tab value='all' label={<TabBadge label='All' totalCount={status === 'all' ? total : null} />} />
            <Tab value='active' label={<TabBadge label='Active' totalCount={status === 'active' ? total : null} />} />
            <Tab
              value='inactive'
              label={<TabBadge label='Inactive' totalCount={status === 'inactive' ? total : null} />}
            />
            {/* <Tab
              value='disputed'
              label={<TabBadge label='Disputes' totalCount={status === 'disputed' ? total : null} />}
            /> */}
          </TabList>
          <TabPanel value='all'>{tableData()}</TabPanel>
          <TabPanel value='active'>{tableData()}</TabPanel>
          <TabPanel value='inactive'>{tableData()}</TabPanel>
          {/* <TabPanel value='disputed'>{tableData()}</TabPanel> */}
        </TabContext>
        {/* <IngredientDetailDialog
          open={open}
          setOpen={setOpen}
          handleClose={handleClose}
          IngredientRowVal={IngredientRowVal}
        /> */}
      </Grid>
    </>
  )
}

export default IngredientsList
