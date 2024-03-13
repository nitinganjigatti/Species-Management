import React, { useState, useEffect, useCallback } from 'react'

import { getIngredientList } from 'src/lib/api/diet/getIngredients'

// ** MUI Imports

import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import { debounce } from 'lodash'
import CustomAvatar from 'src/@core/components/mui/avatar'
import { getInitials } from 'src/@core/utils/get-initials'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Avatar, Button, FormControlLabel, Switch } from '@mui/material'
import ServerSideToolbarWithFilterAndToggle from 'src/views/table/data-grid/ServerSideToolbarwithfilter_toggle'
import IngredientDetailDialog from 'src/pages/diet/ingredient/ingredientdetail-dialog'

const IngredientsList = () => {
  const renderClient = params => {
    const { row } = params
    const stateNum = Math.floor(Math.random() * 6)
    const states = ['success', 'error', 'warning', 'info', 'primary', 'secondary']
    const color = states[stateNum]
    if (row.avatar) {
      return (
        <CustomAvatar src={`/images/avatars/${row.avatar}`} sx={{ mr: 3, width: '1.875rem', height: '1.875rem' }} />
      )
    } else {
      return (
        <CustomAvatar
          skin='light'
          color={color}
          sx={{ mr: 3, fontSize: '.8rem', width: '1.875rem', height: '1.875rem' }}
        >
          {getInitials(row.full_name ? row.full_name : 'John Doe')}
        </CustomAvatar>
      )
    }
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
      flex: 0.6,
      minWidth: 30,
      field: 'ingredient_name',
      headerName: 'INGREDIENTS',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* {renderClient(params)} */}
          <Avatar
            variant='square'
            alt='Medicine Image'
            sx={{ width: 40, height: 40, mr: 4 }}
            src={params.row.ingredient_image ? `${params.row.ingredient_image}` : '/images/tablet.png'}
          />
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
      minWidth: 20,
      field: 'feedtype',
      headerName: 'FEED TYPE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.feed_type ? params.row.feed_type : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'carbs',
      headerName: 'CARBS',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.carbs ? params.row.carbs + ' g' : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'protein',
      headerName: 'PROTEIN',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <span>{params.row.protein ? params.row.protein + ' g' : '-'}</span>
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'fat',
      headerName: 'FAT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <span>{params.row.fat ? params.row.fat + ' g' : '-'}</span>
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'water',
      headerName: 'WATER',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {/* <span alt={params.row.manufacturer_name}>{params.row.manufacturer_name}</span> */}
          <span>{params.row.water_percentage ? params.row.water_percentage + ' %' : '-'}</span>
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'mg',
      headerName: 'MG',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <span>{params.row.water_dry_matter ? params.row.water_dry_matter + ' mg' : '-'}</span>
        </Typography>
      )
    }
  ]

  /***** Serverside pagination */
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumning, setsortColumning] = useState('ingredient_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [IngredientRowVal, setIngredientRowVal] = useState({})
  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async ({ sort, q, sortColumn }) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          sortColumn,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getIngredientList({ params: params }).then(res => {
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

  const searchTableData = useCallback(
    debounce(async ({ sort, q, sortColumn }) => {
      setSearchValue(q)
      try {
        await fetchTableData({ sort, q, sortColumn })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  useEffect(() => {
    fetchTableData({ sort, q: searchValue, sortColumn: sortColumning })
  }, [fetchTableData])

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      await searchTableData({ sort: newModel[0].sort, q: searchValue, sortColumn: newModel[0].field })
    } else {
    }
  }

  const handleSearch = async value => {
    setSearchValue(value)
    await searchTableData({ sort, q: value, sortColumn: sortColumning })
  }

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

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  console.log(paginationModel, 'paginationModel')

  const handleRowClick = value => {
    setOpen(true)
    setIngredientRowVal(value)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <>
      <>
        <>
          <Card>
            <CardHeader title='Ingredients' action={headerAction} />
            {/* <Box sx={{ my: 4, height: '40px', display: 'flex', justifyContent: 'space-between' }}>
                  <FormControlLabel control={<Switch defaultChecked />} label='Show Active Only' />
                </Box> */}
            <DataGrid
              columnVisibilityModel={{
                id: false
              }}
              autoHeight
              pagination
              hideFooterSelectedRowCount
              disableColumnSelector={true}
              rows={indexedRows === undefined ? [] : indexedRows}
              rowCount={total}
              columns={columns}
              sortingMode='server'
              paginationMode='server'
              pageSizeOptions={[7, 10, 25, 50]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              slots={{ toolbar: ServerSideToolbarWithFilterAndToggle }}
              onPaginationModelChange={setPaginationModel}
              loading={loading}
              className=''
              slotProps={{
                baseButton: {
                  variant: 'outlined',
                  sx: { float: 'right' }
                },
                toolbar: {
                  value: searchValue,
                  clearSearch: () => handleSearch(''),

                  onChange: event => {
                    setSearchValue(event.target.value)

                    return handleSearch(event.target.value)
                  }
                }
              }}
              onRowClick={params => {
                const rowData = params.row
                handleRowClick(rowData)
              }}
            />
            <IngredientDetailDialog
              open={open}
              setOpen={setOpen}
              handleClose={handleClose}
              IngredientRowVal={IngredientRowVal}
            />
          </Card>
        </>
      </>
    </>
  )
}

export default IngredientsList
