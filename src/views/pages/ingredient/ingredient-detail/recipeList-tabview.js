import React, { useState, useEffect, useCallback } from 'react'

import { getRecipeListonIngredientDtl } from 'src/lib/api/diet/getIngredients'

import FallbackSpinner from 'src/@core/components/spinner/index'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import { Avatar, Box, CardContent, Tooltip } from '@mui/material'

// ** MUI Imports
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import Router, { useRouter } from 'next/router'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import SwapIngredient from './swapIngredient'

const RecipeListTabview = ({ IngredientName, onTotalChange }) => {
  const [loader, setLoader] = useState(false)
  const router = useRouter()
  const { id } = router.query
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sort, setSort] = useState('desc')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [loading, setLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState([])
  const [status, setStatus] = useState('1')
  const [showSwapBtn, setshowSwapBtn] = useState([])
  const [activitySidebarOpen, setActivitySidebarOpen] = useState(false)
  const [searchSwapIngredientValue, setSearchSwapIngredientValue] = useState('')

  const handleSidebarClose = () => {
    setActivitySidebarOpen(false)
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    setStatus(newValue)
  }

  const fetchTableData = useCallback(
    async (sortBy, q, status) => {
      try {
        setLoading(true)

        const params = {
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          sortBy,
          q,
          status
        }
        await getRecipeListonIngredientDtl(id, params).then(res => {
          console.log('response', res)
          setTotal(parseInt(res?.data?.data?.count))

          const result = res?.data?.data?.result

          if (Array.isArray(result)) {
            // If result is an array, update rows directly
            const startingIndex = paginationModel.page * paginationModel.pageSize

            let listWithId = res.data.data.result.map((el, i) => {
              return { ...el, uid: startingIndex + i + 1 }
            })
            setRows(loadServerRows(paginationModel.page, listWithId))
          } else if (typeof result === 'object') {
            // If result is an object, convert it to an array of one object
            setRows([result])
          } else {
            // Handle other cases
            console.error('Unexpected result type:', result)
          }
        })
        setLoading(false)
      } catch (e) {
        console.error(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )
  useEffect(() => {
    fetchTableData(sort, searchValue, status)
  }, [fetchTableData, status])
  useEffect(() => {
    onTotalChange(total)
  }, [total, onTotalChange])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)

      fetchTableData(newModel[0].sort, searchValue, status)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sortBy, q, status) => {
      setSearchValue(q)
      try {
        await fetchTableData(sortBy, q, status)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSelectionChange = newSelection => {
    console.log('Selection changed:', newSelection)
    const selectedRowsData = newSelection.map(id => rows.find(row => row.id === id))
    console.log('Selected rows:', selectedRowsData)
    if (selectedRowsData.length > 0) {
      setshowSwapBtn(selectedRowsData)
    } else {
      setshowSwapBtn([])

      //selectedRowsData = []
    }
  }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, status)
  }

  const handleclickChange = (data, val) => {
    Router.push({
      pathname: `/diet/recipe/${data?.id}`

      //query: { source: val, ingId: id }
    })
  }

  const columns = [
    {
      flex: 0.1,
      Width: 40,
      field: 'uid',
      headerName: 'SL ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.uid}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 40,
      field: 'recipe_name',
      headerName: 'RECIPE',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* {renderClient(params)} */}
          <Avatar
            variant='square'
            alt='Recipe Image'
            sx={{ width: 40, height: 40, mr: 4, background: '#E8F4F2', padding: '8px', borderRadius: '4px' }}
            src={params.row.recipe_image ? params.row.recipe_image : '/icons/icon_ingredient_fill.png'}
          >
            {params.row.recipe_image ? null : <Icon icon='healthicons:fruits-outline' />}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Tooltip title={params.row.recipe_name ? params.row.recipe_name : ''}>
              <Typography
                noWrap
                variant='body2'
                sx={{ color: 'text.primary', width: '200px' }}
                className='text_overflow_moduled'
                onClick={() => handleclickChange(params.row, 'ingdetail')}
              >
                {params.row.recipe_name ? params.row.recipe_name : '-'}
              </Typography>
            </Tooltip>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'total_kcal',
      headerName: 'KCAL',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.total_kcal ? params.row.total_kcal + ' ' + 'Kcal' : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'ingredient_count',
      headerName: 'NO OF ITEMS',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 10 }}>
          {params.row.ingredient_count ? params.row.ingredient_count : '-'}
        </Typography>
      )
    }
  ]

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
          <>
            <div>
              {/* {showSwapBtn.length > 0 ? ( */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div></div>
                {/* <Button
                  size='small'
                  variant='contained'
                  onClick={() => setActivitySidebarOpen(true)}
                  sx={{ px: 4, py: 2, cursor: 'pointer', position: 'relative', top: 8 }}
                >
                  <Icon icon='mdi:add' fontSize={20} />
                  &nbsp; SWAP {IngredientName}
                </Button> */}
                <Box sx={{ px: 4, py: 4, cursor: 'pointer', position: 'relative', top: 8 }}></Box>
                {/* /////////////// */}
                <Drawer
                  anchor='right'
                  open={activitySidebarOpen}
                  ModalProps={{ keepMounted: true }}
                  sx={{ '& .MuiDrawer-paper': { width: ['100%', 500] }, height: '100vh' }}
                >
                  <CardContent>
                    <SwapIngredient
                      handleSidebarClose={handleSidebarClose}
                      setActivitySidebarOpen={setActivitySidebarOpen}
                    />
                  </CardContent>
                </Drawer>
                {/* //////////////////// */}
              </div>
              {/* ) : (
                <div
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '38px' }}
                ></div>
              )} */}
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
                checkboxSelection={false}
                disableColumnMenu={true}
                onRowSelectionModelChange={handleSelectionChange}
                selectionModel={selectedRows}
                autoHeight
                pagination
                rows={indexedRows === undefined ? [] : indexedRows}
                rowCount={total}
                columns={columns}
                paginationMode='server'
                sortingMode='server'
                onSortModelChange={handleSortModel}
                pageSizeOptions={[7, 10, 25, 50, 100]}
                paginationModel={paginationModel}
                slots={{ toolbar: ServerSideToolbar }}
                onPaginationModelChange={setPaginationModel}
                loading={loading}
                slotProps={{
                  baseButton: {
                    variant: 'outlined'
                  },
                  toolbar: {
                    value: searchValue,
                    clearSearch: () => handleSearch(''),
                    onChange: event => handleSearch(event.target.value),
                    tableValue: 'recipe-List'
                  }
                }}
              />
            </div>
          </>
        )}
      </>
    )
  }

  return (
    <>
      <Grid container spacing={6}>
        <Grid item size={{ xs: 12 }}>
          <TabContext value={status}>
            <TabList onChange={handleChange}>
              {/* <Tab value='all' label={<TabBadge label='All' totalCount={status === 'all' ? total : null} />} /> */}
              <Tab value='1' label={<TabBadge label='Active' totalCount={status === '1' ? total : null} />} />
              <Tab value='0' label={<TabBadge label='Inactive' totalCount={status === '0' ? total : null} />} />
              {/* <Tab
              value='disputed'
              label={<TabBadge label='Disputes' totalCount={status === 'disputed' ? total : null} />}
            /> */}
            </TabList>
            {/* <TabPanel value='all'>{tableData()}</TabPanel> */}
            <TabPanel value='1'>{tableData()}</TabPanel>
            <TabPanel value='0'>{tableData()}</TabPanel>
            {/* <TabPanel value='disputed'>{tableData()}</TabPanel> */}
          </TabContext>
        </Grid>
      </Grid>
    </>
  )
}

export default RecipeListTabview
