import React, { useState, useEffect, useCallback } from 'react'

import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'

import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'

import TabList from '@mui/lab/TabList'
import moment from 'moment'
import { Avatar, Button, Box, Divider, Select, MenuItem, Tooltip } from '@mui/material'
import toast from 'react-hot-toast'
import NotesIcon from '@mui/icons-material/Notes'

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
import { updateIngredientStatus } from 'src/lib/api/diet/getIngredients'
import { useTheme } from '@mui/material/styles'
import { getDietList } from 'src/lib/api/diet/dietList'

import RecipeList from 'src/components/diet/RecipeList'
import CustomChip from 'src/@core/components/mui/chip'

// Styled TabList component
const roleColors = {
  active: 'success',
  inactive: 'error'
}

const Diet = () => {
  const theme = useTheme()
  const Data = []

  /***** Server side pagination */

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])

  // const [Dietdata, setDietData] = useState(Data)

  // const [filterStatusData, setFilterStatusData] = useState(Dietdata)
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('diet_name')

  // const [searchColumns, setSearchColumns] = useState('recipe_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [statusCheckval, setstatusCheckval] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [check, setCheck] = useState(false)
  const [selectedValue, setSelectedValue] = useState('10')
  const [recipeList, setRecipeList] = useState([])
  const [loader, setLoader] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [selectedCard, setSelectedCard] = useState([])

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleChange = (event, newValue) => {
    // debugger
    setTotal(0)
    setStatus(newValue)
  }
  // const addEventSidebarOpen = () => {
  //   setOpenDrawer(true)
  //   setSelectedCard([])
  // }

  const handleSidebarClose = () => {
    console.log('close event clicked')
    setOpenDrawer(false)
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

        await getDietList({ params: params }).then(res => {
          console.log('response', res)
          const startingIndex = paginationModel.page * paginationModel.pageSize
          let listWithId = res.data.result.map((el, i) => {
            return { ...el, uid: startingIndex + i + 1 }
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
  console.log('total <<<', total)

  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn, status)
  }, [fetchTableData, status])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)

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
      <Button sx={{ m: 2 }} size='small' variant='contained' onClick={() => Router.push('/diet/add-diet')}>
        <Icon icon='mdi:add' fontSize={20} />
        &nbsp; Add New
      </Button>
      {/* <Button size='small' variant='contained' onClick={addEventSidebarOpen}>
        <Icon icon='mdi:add' fontSize={20} />
        &nbsp; Add Recipe
      </Button> */}
    </div>
  )

  const handleSwitchChange = async (event, rowData) => {
    console.log(event.target.checked, 'lll')
    console.log(rowData, 'rowData')
    const newIsActive = event.target.checked ? 1 : 0
    try {
      const response = await updateIngredientStatus(rowData?.id, { active: newIsActive })

      console.log(response, 'response')

      if (response.success === true) {
        fetchTableData(sort, searchValue, sortColumn, status)

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
    // debugger
    setSearchValue(value)
    searchTableData(sort, value, sortColumn, status)
  }

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'uid',
      headerName: 'SL',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.uid}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 30,
      field: 'diet_name',
      headerName: 'Diet',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            variant='square'
            alt='Diet Image'
            sx={{ width: 40, height: 40, mr: 4, background: '#E8F4F2', padding: '8px', borderRadius: '4px' }}
            src={params.row.diet_image ? params.row.diet_image : '/icons/icon_diet_fill.png'}
          ></Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Tooltip title={params.row.diet_name} placement='right'>
              <Typography
                noWrap
                variant='body2'
                sx={{
                  color: 'text.primary',
                  fontSize: '14px',
                  fontWeight: '500',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '150px'
                }}
              >
                {params.row.diet_name ? params.row.diet_name : '-'}
              </Typography>
            </Tooltip>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'no_meals',
      headerName: 'No meals',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.num_meals ? params.row.num_meals : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'no_recipe',
      headerName: 'No Recipe',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.recipe ? params.row.recipe : '-'}
        </Typography>
      )
    },

    // {
    //   flex: 0.3,
    //   minWidth: 20,
    //   field: 'ingredient_name',
    //   headerName: 'NO OF INGREDIENTS',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       <Tooltip
    //         title={
    //           params.row.ingredients && params.row.ingredients.length > 0
    //             ? params.row.ingredients.map(preparation => (
    //                 <div style={{ padding: '4px' }} key={preparation.ingredient_name}>
    //                   {preparation.ingredient_name}
    //                 </div>
    //               ))
    //             : '-'
    //         }
    //         arrow
    //         placement='right'

    //         // style={{ background: '#1F515B' }}
    //       >
    //         <span>{params.row.ingredients_count ? params.row.ingredients_count : '-'}</span>
    //       </Tooltip>
    //     </Typography>
    //   )
    // },
    {
      flex: 0.6,
      minWidth: 60,
      field: 'user_name',
      headerName: 'CREATED BY',
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
            {params.row.profile_pic ? (
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={params.row.profile_pic}
                alt='Profile'
              />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14, fontWeight: 500 }}>
              {params.row.user_name ? params.row.user_name : '-'}
            </Typography>
            <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
              {params.row.created_at ? 'Created on' + ' ' + params.row.created_at : '-'}
            </Typography>
          </Box>
        </Box>
      )
    },

    {
      flex: 0.3,
      minWidth: 10,
      field: 'status',
      headerName: 'STATUS',
      renderCell: params => (
        <CustomChip
          skin='light'
          size='small'
          label={params.row?.status === 'active' ? 'Active' : 'InActive'}
          color={params.row?.status === 'active' ? roleColors.active : roleColors.inactive}
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
    }
  ]

  const onCellClick = params => {
    console.log(params, 'params')
    const clickedColumn = params.field !== 'switch'

    if (clickedColumn) {
      const data = params.row

      Router.push({
        pathname: `/diet/diet/${data?.id}`
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

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <>
            <Card>
              <CardHeader title='Diet' action={headerAction} />
              {/* <Grid sx={{ display: 'flex', ml: 5, m: 2 }}>
                <Grid sx={{ m: 2 }}>
                  <Typography variant='body2'>Show</Typography>
                </Grid>

                <Grid>
                  <Select
                    sx={{ width: '80px', height: '40px', borderRadius: '10px' }}
                    value={selectedValue}
                    onChange={e => setSelectedValue(e.target.value)}
                  >
                    <MenuItem value='10'>10</MenuItem>
                    <MenuItem value='20'>20</MenuItem>
                    <MenuItem value='30'>30</MenuItem>
                  </Select>
                </Grid>
                <Grid sx={{ m: 2 }}>
                  <Typography variant='body2'>entries</Typography>
                </Grid>
              </Grid> */}
              <Grid>
                {/* <TabList
                  onChange={handleChange}
                  sx={{ position: 'relative', top: '20px', left: '10px', cursor: 'pointer' }}
                >
                  <DescriptionIcon sx={{ mt: '13px', position: 'relative', left: '15px' }} />
                  <Tab value='1' label={<TabBadge label='Active' totalCount={status === '1' ? total : null} />} />
                  <SpeakerNotesOffIcon sx={{ mt: '13px', position: 'relative', left: '15px' }} />
                  <Tab value='0' label={<TabBadge label='Inactive' totalCount={status === '0' ? total : null} />} />
                  <NotesIcon sx={{ mt: '13px', position: 'relative', left: '15px' }} />{' '}
                  <Tab value='' label={<TabBadge label='All' totalCount={status === '' ? total : null} />} />
                  {/* <Tab
              value='disputed'
              label={<TabBadge label='Disputes' totalCount={status === 'disputed' ? total : null} />}[[]]
            /> */}
                {/* </TabList>    */}
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
                    title: 'diet',
                    clearSearch: () => handleSearch(''),
                    onChange: event => handleSearch(event.target.value)
                  }
                }}
                onCellClick={onCellClick}
              />
            </Card>

            {/* <RecipeList
              recipeList={recipeList}
              setSelectedCard={setSelectedCard}
              selectedCard={selectedCard}
              drawerWidth={400}
              addEventSidebarOpen={openDrawer}
              handleSidebarClose={handleSidebarClose}
              submitLoader={submitLoader}
            /> */}
          </>
        )}
      </>
    )
  }

  return (
    <>
      <Grid>
        <TabContext sx={{ cursor: 'pointer' }} value={status}>
          <TabList onChange={handleChange}>
            <Tab value='' label={<TabBadge label='All' totalCount={status === '' ? total : null} />} />
            <Tab value='1' label={<TabBadge label='Active' totalCount={status === '1' ? total : null} />} />
            <Tab value='0' label={<TabBadge label='Inactive' totalCount={status === '0' ? total : null} />} />
          </TabList>
          <TabPanel sx={{ cursor: 'pointer' }} value='1'>
            {tableData()}
          </TabPanel>
          <TabPanel sx={{ cursor: 'pointer' }} value='0'>
            {tableData()}
          </TabPanel>
          <TabPanel sx={{ cursor: 'pointer' }} value=''>
            {tableData()}
          </TabPanel>
          {/* <TabPanel value='disputed'>{tableData()}</TabPanel> */}
        </TabContext>
      </Grid>
    </>
  )
}

export default Diet
