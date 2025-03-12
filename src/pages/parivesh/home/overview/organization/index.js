import React, { useState, useEffect, useCallback, useContext } from 'react'

import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'

import moment from 'moment'
import { Avatar, Button, Tooltip, Box, Switch, Divider, CardContent } from '@mui/material'

// ** MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'

import Grid from '@mui/material/Grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import Router from 'next/router'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'

import ConfirmationDialog from 'src/components/confirmation-dialog'
import ConfirmationCheckBox from 'src/views/forms/form-elements/confirmationCheckBox'
import { useTheme } from '@mui/material/styles'

import { AuthContext } from 'src/context/AuthContext'
import Toaster from 'src/components/Toaster'
import { usePariveshContext } from 'src/context/PariveshContext'
import { getBatchListSpecies } from 'src/lib/api/parivesh/batchListSpecies'
import Utility from 'src/utility'

const Organization = () => {
  const theme = useTheme()
  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const { selectedParivesh } = usePariveshContext()
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('accepted_on')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)

  const [dialog, setDialog] = useState(false)
  const [check, setCheck] = useState(false)

  const authData = useContext(AuthContext)

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    setValue(newValue)
  }

  const onClose = () => {
    setDialog(false)
  }

  const fetchTableData = useCallback(
    async (sort, q, sortColumn) => {
      try {
        setLoading(true)

        const params = {
          q,
          status: 'accepted',
          page: paginationModel.page + 1,
          sort,
          sortColumn,
          limit: paginationModel.pageSize,
          org_id: selectedParivesh.id !== 'all' ? selectedParivesh.id : null
        }

        await getBatchListSpecies({ params: params }).then(res => {
          console.log('responseqq', res)
          // Generate uid field based on the index
          let listWithId = res.data.data.map((el, i) => {
            return { ...el, id: i + 1 }
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
    [paginationModel, selectedParivesh]
  )

  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
  }, [fetchTableData])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, sortColumn) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, sortColumn)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
  }

  const columns = [
    {
      flex: 0.2,
      Width: 40,
      field: 'sl_no',
      headerName: 'S.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.id}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 30,
      field: 'registration_id',
      headerName: 'REGISTRATION ID',
      sortable: false,
      renderCell: params => (
        <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
          {params.row.registration_id ? params.row.registration_id : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'species_count',
      headerName: 'No. OF SPECIES',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.species_count ? params.row.species_count : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'no_of_animals',
      headerName: 'NO. OF ANIMALS',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.no_of_animals ? params.row.no_of_animals : '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'accepted_on',
      headerName: 'Approved DATE',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.accepted_on
              ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.accepted_on))
              : '-'}
          </Typography>
          <Typography variant='body2' sx={{ color: '#839D8D', fontSize: '12px' }}>
            {params.row.accepted_on
              ? Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(params.row.accepted_on))
              : '-'}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.6,
      minWidth: 60,
      field: 'user_name',
      headerName: 'submitted by',
      sortable: false,
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
            {params.row.submitted_by_user?.profile_pic ? (
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={params.row.submitted_by_user?.profile_pic}
                alt='Profile'
              />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14 }}>
              {params.row.submitted_by_user?.user_name ? params.row.submitted_by_user?.user_name : '-'}
            </Typography>
            <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
              {console.log(params.row, 'params.row')}
              {params.row.submitted_on
                ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.submitted_on))
                : '-'}
            </Typography>
          </Box>
        </Box>
      )
    }
  ]

  const onCellClick = params => {
    const clickedColumn = params.field !== 'switch'
    if (clickedColumn) {
      const { id, batch_id } = params.row
      Router.push({
        pathname: `/parivesh/home/${batch_id}/batch-details`
      })
    } else {
      return
    }
    // const { id, batch_id } = params.row
    // Router.push(`/parivesh/home/${batch_id}/batch-details`)
    // console.log(params, 'params')
  }
  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <Card sx={{ mt: 4 }}>
            <CardHeader title={'Approved Batches'} action={headerAction} />
            <ConfirmationDialog
              // icon={'mdi:delete'}
              image={'https://app.antzsystems.com/uploads/6515471031963.jpg'}
              iconColor={'#ff3838'}
              title={'Are you sure you want to delete this ingredient?'}
              // description={`Since ingredient IND000123 isn't included in any recipe or diet, you can delete it.`}
              formComponent={
                <ConfirmationCheckBox
                  title={'This ingredient is part of 15 recipes and 10 diets.'}
                  label={'Deactivate this ingredient in all records'}
                  description={
                    'Deactivating this ingredient prevents its addition to new recipes or diets, but you can swap it with another ingredient.'
                  }
                  color={theme.palette.formContent?.tertiary}
                  value={check}
                  setValue={setCheck}
                />
              }
              dialogBoxStatus={dialog}
              onClose={onClose}
              ConfirmationText={'Delete'}
              confirmAction={onClose}
            />
            <DataGrid
              disableColumnMenu
              disableColumnFilter
              disableColumnSorting
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

  const headerAction = (
    <>
      {/* <div>
        <Button size='medium' variant='contained' onClick={() => Router.push('/parivesh/home/add-newentry')}>
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; ADD ENTRY
        </Button>

        <Button size='medium' variant='contained' sx={{ m: 2, backgroundColor: '#1F415B' }}>
          &nbsp; CREATE BATCH
        </Button>
      </div> */}
    </>
  )

  return (
    <>
      <Box>
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
            <Grid>{tableData()}</Grid>
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

export default Organization
