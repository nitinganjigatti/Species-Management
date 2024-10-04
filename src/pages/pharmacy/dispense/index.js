import { Avatar, Card, CardHeader, Grid, Typography, debounce } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import Router from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'

// ** Icon Imports
import { AddButton } from 'src/components/Buttons'
import { getDispenseList } from 'src/lib/api/pharmacy/dispenseProduct'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import moment from 'moment'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'
import Utility from 'src/utility'
function Dispense() {
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('dispense_id')
  const [total, setTotal] = useState(0)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  const { selectedPharmacy } = usePharmacyContext()
  function loadServerRows(currentPage, data) {
    return data
  }

  const columns = [
    {
      flex: 0.2,
      minWidth: 20,
      field: 'dispense_id',
      headerName: 'Dispense Id',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.dispense_id}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'user_name',
      headerName: 'User Name',
      renderCell: params => (
        <>
          <Avatar
            sx={{
              '& > img': {
                objectFit: 'contain'
              },
              width: 30,
              height: 30,
              mr: 4
            }}
            variant='circular'
            alt={params?.row?.profile_pic}
            src={params?.row?.profile_pic}
          />
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.user_name}
          </Typography>
        </>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'created_at',
      headerName: 'created At',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.created_at))} -{' '}
          {Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(params.row.created_at))}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'animal_count',
      type: 'number',
      align: 'right',
      headerName: 'Animal Count',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.animal_count ? params.row.animal_count : 0}
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
        setLoading(false)
      } catch (e) {
        setLoading(false)
      }
    },
    [paginationModel]
  )
  useEffect(() => {
    getDipsense({ sort, q: searchValue, column: sortColumn })
  }, [getDipsense, selectedPharmacy.id])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: `${row.id}`,
    sl_no: getSlNo(index)
  }))

  const handleSearch = useCallback(
    debounce(async value => {
      setSearchValue(value)
      try {
        await getDipsense({ sort, q: value, column: sortColumn })
      } catch (error) {
        console.error(error)
      }
    }, 500),
    []
  )

  const onRowClick = params => {
    var data = params.row
    Router.push({
      pathname: `/pharmacy/dispense/${data?.id}`
    })
  }

  return (
    <>
      {selectedPharmacy.permission.pharmacy_module === 'allow_full_access' ||
      selectedPharmacy.permission.dispense_medicine ? (
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
            <Grid sx={{ mx: 1.4 }} item>
              <CardHeader title='Dispense' />
            </Grid>
            <Grid sx={{ mx: 5 }} item>
              {(selectedPharmacy.permission.pharmacy_module === 'allow_full_access' ||
                selectedPharmacy.permission.dispense_medicine) && (
                <AddButton
                  title='Add Dispense'
                  action={() => {
                    Router.push('/pharmacy/dispense/add-dispense')
                  }}
                  sx={{
                    mr: 6
                  }}
                />
              )}
            </Grid>
          </Grid>
          <DataGrid
            sx={{
              '.MuiDataGrid-cell:focus': {
                outline: 'none'
              },

              '& .MuiDataGrid-row:hover': {
                cursor: 'pointer'
              },
              '& .css-12hr0br': {
                paddingTop: 0
              }
            }}
            autoHeight
            pagination
            disableColumnSelector={true}
            rows={indexedRows === undefined ? [] : indexedRows}
            rowCount={total}
            columns={columns}
            sortingMode='server'
            paginationMode='server'
            pageSizeOptions={[7, 10, 25, 50]}
            paginationModel={paginationModel}
            slots={{ toolbar: ServerSideToolbar }}
            onPaginationModelChange={setPaginationModel}
            loading={loading}
            disableColumnMenu
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
            onRowClick={onRowClick}
          />
        </Card>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default Dispense
