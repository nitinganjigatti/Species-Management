// import {
//   Button,
//   Card,
//   CardContent,
//   CardHeader,
//   Grid,
//   IconButton,
//   InputAdornment,
//   TextField,
//   Typography
// } from '@mui/material'
// import Icon from 'src/@core/components/icon'
// import { Box } from '@mui/system'
// import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
// import React, { useState } from 'react'
// import { DataGrid } from '@mui/x-data-grid'

// const Diet = () => {
//   const [total, setTotal] = useState(0)
//   const [sort, setSort] = useState('desc')
//   const [rows, setRows] = useState([])
//   const [searchValue, setSearchValue] = useState('')
//   const [sortColumning, setsortColumning] = useState('ingredient_name')
//   const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
//   const [loading, setLoading] = useState(false)
//   const [status, setStatus] = useState('all')
//   const [statusCheckval, setstatusCheckval] = useState(false)
//   const [dialog, setDialog] = useState(false)
//   const [check, setCheck] = useState(false)

//   return (
//     <Grid>
//       <Card>
//         <CardContent>
//           <Grid sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
//             <Typography sx={{ fontWeight: 600 }} variant='h6'>
//               Diet
//             </Typography>
//             <Box>
//               <Button size='small' variant='contained'>
//                 <Icon icon='mdi:add' fontSize='20' />
//                 &nbsp; Add New
//               </Button>
//             </Box>
//           </Grid>
//           <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
//             <Box></Box>
//             <Box sx={{ mt: 3 }}>

//             </Box>
//           </Grid>
//         </CardContent>
//       </Card>
//     </Grid>
//   )
// }
// export default Diet

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
import { Avatar, Button, Tooltip, FormControlLabel, Box, Switch, Divider, Select, MenuItem } from '@mui/material'
import toast from 'react-hot-toast'

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
import ConfirmationDialog from 'src/@core/components/dialogs/confirmation-dialog'
import ConfirmationCheckBox from 'src/views/forms/form-elements/confirmationCheckBox'
import { useTheme } from '@mui/material/styles'
import { Data } from './data'

// Styled TabList component

const Diet = () => {
  const theme = useTheme()
  const [loader, setLoader] = useState(false)

  /***** Server side pagination */

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [Dietdata, setDietData] = useState(Data)
  const [searchValue, setSearchValue] = useState('')
  const [sortColumning, setsortColumning] = useState('ingredient_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('all')
  const [statusCheckval, setstatusCheckval] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [check, setCheck] = useState(false)
  const [selectedValue, setSelectedValue] = useState('10')

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    setStatus(newValue)
  }

  const onClose = () => {
    setDialog(false)
  }

  console.log('Total Data>>>>>', Dietdata)

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
    fetchTableData(sort, searchValue, sortColumning, status)
  }, [fetchTableData, status])
  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = Dietdata?.map((row, index) => ({
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
      <Button size='small' variant='contained' onClick={() => Router.push('/diet/add-diet')}>
        <Icon icon='mdi:add' fontSize={20} />
        &nbsp; Add New
      </Button>
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
    searchTableData(sort, value, sortColumning, status)
  }

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'uid',
      headerName: 'No ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.id}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 30,
      field: 'ingredient_name',
      headerName: 'Diet ',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* {renderClient(params)} */}
          <Avatar
            alt='Medicine Image'
            sx={{ width: 40, height: 40, mr: 4, background: '#E8F4F2', padding: '8px', borderRadius: '50%' }}
            src={params.row.ingredient_image ? params.row.ingredient_image : null}
          >
            {params.row.ingredient_image ? null : (
              <img
                src='https://www.shutterstock.com/image-photo/ripe-mango-isolated-on-white-260nw-1297537549.jpg'
                width={30}
                height={30}
              />
            )}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary' }}>
              {params.row.diet_name ? params.row.diet_name : '-'}
            </Typography>
            <Typography variant='body2' sx={{ color: 'text.primary', fontSize: '12px' }}>
              {params.row.diet_text}
            </Typography>
          </Box>
        </Box>
      )
    },

    {
      flex: 0.3,
      minWidth: 10,
      field: 'id',
      headerName: 'Meals',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.meals ? params.row.meals : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'Recipes',
      headerName: 'Recipes',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.recipies ? params.row.recipies : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'Species',
      headerName: 'Species',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.species ? params.row.species : '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 10,
      field: 'Animals',
      headerName: 'Animals',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.animals ? params.row.animals : '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 60,
      field: 'CREATED',
      headerName: 'CREATED ',
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
            <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
              {params.row.createdAt ? moment(params.row.createdAt).format('DD/MM/YYYY') : '-'}
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
        pathname: `/diet/diet/${data?.id}`
      })
    } else {
      return
    }
  }

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <>
            <Card>
              <CardHeader title='Diet' action={headerAction} />
              <Grid sx={{ display: 'flex', ml: 5, m: 2 }}>
                <Grid sx={{ m: 2 }}>
                  <Typography variant='body2'>Show</Typography>
                </Grid>
                <Grid>
                  <Select sx={{ width: '80px', height: '40px', borderRadius: '10px' }} value={selectedValue}>
                    <MenuItem value='10'>10</MenuItem>
                    {/* Add other options here */}
                  </Select>
                </Grid>
                <Grid sx={{ m: 2 }}>
                  <Typography variant='body2'>entries</Typography>
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
          </>
        )}
      </>
    )
  }

  return (
    <>
      <Grid>
        <TabContext value={status}>
          <TabList onChange={handleChange}>
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
      </Grid>
    </>
  )
}

export default Diet
