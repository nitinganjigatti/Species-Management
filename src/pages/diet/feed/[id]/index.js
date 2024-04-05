import { useEffect, useState, useCallback } from 'react'
import { Avatar, Button, Card, CardContent, Typography, CircularProgress } from '@mui/material'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Icon from 'src/@core/components/icon'
import { debounce } from 'lodash'
import FeedOverview from 'src/views/pages/diet/feed/feedoverview'
import { getFeedDetails, getIngredientsOnFeed } from 'src/lib/api/diet/getFeedDetails'
import format from 'date-fns/format'
import Router, { useRouter } from 'next/router'
import { DataGrid } from '@mui/x-data-grid'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'

const FeedDetails = () => {
  const router = useRouter()
  const { id } = router.query
  const [FeedDetailsValue, setFeedDetails] = useState([])
  const [loader, setLoader] = useState(true)

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('ASC')
  const [sortColumning, setsortColumning] = useState('ingredient_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  function loadServerRows(currentPage, data) {
    return data
  }

  const columns = [
    {
      flex: 0.1,
      minWidth: 30,
      field: 'id',
      headerName: 'SL',
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
      headerName: 'INGREDIENTS',
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Avatar variant='square' src={params?.row?.ingredient_image ? params?.row?.ingredient_image : ''} />
          {params?.row?.ingredient_name ? params?.row?.ingredient_name : ''}
        </Box>
      )
    },
    {
      flex: 0.7,
      minWidth: 10,
      field: 'created_by_user',
      headerName: 'ADDED BY',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0 }}>
          <Avatar variant='round' src={params?.row?.image ? params?.row?.image : ''} />
          <Box sx={{ display: 'flex', flexDirection: 'column', mx: 2 }}>
            <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
              {params?.row?.created_by_user?.user_name ? params?.row?.created_by_user?.user_name : ''}
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.disabled', color: 'rgb(76 78 100 / 56%)' }}>
              Added on {format(new Date(params?.row?.created_at ? params?.row?.created_at : ''), 'MM/dd/yyyy')}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.2,
      minWidth: 10,
      field: 'status',
      headerName: '',
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 2, cursor: 'pointer' }}>
          <Icon color='#a7a7a7' icon='mdi:eye-outline' />
        </Box>
      )
    }
  ]

  const convertToTitleCase = str => {
    if (!str) return ''

    const firstLetter = str.charAt(0).toUpperCase()
    const restOfWord = str.slice(1).toLowerCase()

    return firstLetter + restOfWord
  }

  const getFeedDetailsList = async id => {
    try {
      const response = await getFeedDetails(id)
      if (response.data.success === true) {
        setFeedDetails(response.data.data)
        setLoader(false)
      }
      setLoader(false)
    } catch (error) {
      console.log('Feed list', error)
      setLoader(false)
    }
  }

  useEffect(() => {
    if (id) {
      getFeedDetailsList(id)
    }
  }, [id])

  ///////////////////////////////////////////////////////////////////

  // const onCellClick = params => {
  //   // Router.push({ pathname: `/diet/feed/${id}`, query: { id: params?.id } })
  //   Router.push({ pathname: `/diet/feed/${params?.id}` })
  // }

  const getIngredientsonFeedList = useCallback(
    async (q, sortColumning) => {
      if (id) {
        try {
          setLoading(true)

          await getIngredientsOnFeed(id, {
            q,
            page: paginationModel.page + 1,
            searchColumns: sortColumning,
            limit: paginationModel.pageSize
          }).then(res => {
            if (res?.data?.success) {
              let listWithId = res.data?.data?.result.map((el, i) => {
                return { ...el, id: i + 1 }
              })
              setTotal(parseInt(res?.data?.data?.total_count))
              setRows(loadServerRows(paginationModel.page, listWithId))
            } else {
              console.log('err', res)
            }
          })
          setLoading(false)
        } catch (e) {
          setLoading(false)
        }
      }
    },
    [paginationModel]
  )
  useEffect(() => {
    getIngredientsonFeedList(searchValue, sortColumning)
  }, [id, getIngredientsonFeedList])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setsortColumning(newModel[0].field)
      getIngredientsonFeedList(searchValue, newModel[0].field)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (q, sortColumn) => {
      try {
        await getIngredientsonFeedList(q, sortColumn)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(value, sortColumning)
  }

  return (
    <>
      {loader ? (
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      ) : (
        <Grid container spacing={6}>
          <FeedOverview FeedDetailsValue={FeedDetailsValue} />
          <Grid item xs={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontWeight: 600 }} variant='h6'>
                    Description
                  </Typography>
                </Box>
                <div style={{ fontSize: '12px' }}>{convertToTitleCase(FeedDetailsValue.desc)}</div>
              </CardContent>
            </Card>
            <Card sx={{ mt: 6 }}>
              <CardContent>
                <Box sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontWeight: 600 }} variant='h6'>
                    Ingredients
                  </Typography>
                  <Button
                    onClick={() => Router.push('/diet/ingredient/add-ingredient')}
                    sx={{ px: 7, py: 5, ml: 34 }}
                    size='small'
                    variant='contained'
                  >
                    <Icon icon='mdi:add' fontSize={20} />
                    &nbsp; Add ingredient
                  </Button>
                </Box>
              </CardContent>
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
                // onCellClick={onCellClick}
              />
            </Card>
          </Grid>
        </Grid>
      )}
    </>
  )
}

export default FeedDetails
