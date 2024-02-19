import { Card, CardContent, CardHeader, Grid, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import Router from 'next/router'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'
// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { AddButton } from 'src/components/Buttons'
import { getDispenseList } from 'src/lib/api/pharmacy/dispenseProduct'

function Dispense() {
  const [loader, setLoader] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [total, setTotal] = useState(0)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  function loadServerRows(currentPage, data) {
    return data
  }

  const columns = [
    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'id',
    //   headerName: 'Id', // dont need
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params?.row?.id}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'user_name',
      headerName: 'User Name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.user_name}
        </Typography>
      )
    },
    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'from_store',
    //   headerName: 'Store',  //dn
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.from_store}
    //     </Typography>
    //   )
    // },
    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'animal_id',
    //   headerName: 'Animal Id',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.animal_id}   //product count instead of
    //     </Typography>
    //   )
    // },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'animal_count',
      headerName: 'Animal Count',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.animal_count}
        </Typography>
      )
    }
  ]

  const getDipsense = useCallback(
    async ({ sort, q, column }) => {
      try {
        setLoading(true)
        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }
        await getDispenseList({ params: params }).then(res => {
          setTotal(parseInt(res?.count))
          setRows(loadServerRows(paginationModel.page, res?.data))
        })
        // console.log('row', rows)
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )
  useEffect(() => {
    getDipsense({ sort, q: searchValue, column: sortColumn })
  }, [getDipsense])

  // const handleSortModel = async newModel => {
  //   if (newModel.length > 0) {
  //     await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
  //   } else {
  //   }
  // }
  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: `${row.id}`,
    sl_no: getSlNo(index)
  }))

  const handleSearch = async value => {
    setSearchValue(value)
    await fetchScrewTableData({ sort, q: value, column: sortColumn })
  }

  return (
    <>
      {/* {selectedPharmacy.type === 'central' && */}
      {/* (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') ? ( */}
      <Card>
        <Grid
          container
          sm={12}
          xs={12}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Grid item>
            <CardHeader title='Dispense' />
          </Grid>
          <Grid sx={{ mx: 5 }} item>
            <AddButton
              title='Add Dispense'
              action={() => {
                Router.push('/pharmacy/dispense/add-dispense')
              }}
              sx={{
                mr: 6
              }}
            />
          </Grid>
        </Grid>
        {/* <CardHeader title='Dispense List' /> */}
        <CardContent>
          <DataGrid
            autoHeight
            pagination
            rows={indexedRows === undefined ? [] : indexedRows}
            rowCount={total}
            columns={columns}
            sortingMode='server'
            paginationMode='server'
            pageSizeOptions={[7, 10, 25, 50]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            loading={loading}
            slotProps={{
              baseButton: {
                variant: 'outlined'
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
          />
        </CardContent>

        {/* <CardContent sx={{ pt: 8 }}>
          {totalQty ? (
            <Grid container>
              <Grid
                item
                xs={12}
                sm={2}
                lg={2}
                sx={{
                  mb: { sm: 0, xs: 4 },
                  order: { sm: 2, xs: 1 },
                  marginLeft: 'auto',
                  mr: { sm: 12, xs: 0 }
                }}
              >
                <CalcWrapper>
                  <Typography variant='body2'>Total Qty:</Typography>
                  <Typography variant='body2' sx={{ color: 'text.primary', letterSpacing: '.25px', fontWeight: 600 }}>
                    {totalQty}
                  </Typography>
                </CalcWrapper>

                <Divider
                  sx={{
                    mt: theme => `${theme.spacing(5)} !important`,
                    mb: theme => `${theme.spacing(3)} !important`
                  }}
                />
              </Grid>
            </Grid>
          ) : null}
        </CardContent> */}
        {/* <Grid item xs={12}>
        <Box sx={{ float: 'right', my: 4, mx: 6 }}>
          <LoadingButton
            disabled={editParams.request_item_details.length > 0 ? false : true}
            sx={{ marginRight: '8px' }}
            size='large'
            onClick={() => {
              postItemsData()
            }}
            variant='contained'
            loading={submitLoader}
          >
            Save
          </LoadingButton>
          <Button
            onClick={() => {
              setEditParams(editParamsInitialState)
            }}
            size='large'
            variant='outlined'
          >
            Reset
          </Button>
        </Box>
      </Grid> */}
      </Card>
      {/* ) : (
    <>
      <Error404></Error404>
    </> */}
      {/* )} */}
    </>
  )
}

export default Dispense
