import React, { useState, useEffect, useCallback, useContext } from 'react'

import { getLabList } from 'src/lib/api/lab/addLab'
import { IMAGE_BASE_URL } from 'src/constants/ApiConstant'

import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports

import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { debounce } from 'lodash'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Avatar, Badge } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import Router from 'next/router'
import CommonDialogBox from 'src/components/CommonDialogBox'
import MedicineConfigure from 'src/components/pharmacy/medicine/MedicineConfigure'
import Utility from 'src/utility'

import { AuthContext } from 'src/context/AuthContext'

const ListOfLab = () => {
  const [loader, setLoader] = useState(false)
  const [show, setShow] = useState(false)
  const [configureMedId, setConfigureMedId] = useState('')
  const [storedData, setStoredData] = useState()
  const authData = useContext(AuthContext) || {}

  // console.log('authData :>> ', authData?.userData?.roles?.settings?.add_lab)

  useEffect(() => {
    const Data = window.localStorage.getItem('userDetails')
    setStoredData(JSON.parse(Data))
  }, [])

  const closeDialog = () => {
    setShow(false)
  }

  const showDialog = () => {
    setShow(true)
  }

  const handleEdit = async (e, params) => {
    e.stopPropagation()
    console.log('params Lab', params.row.id)
    Router.push({
      pathname: '/lab/add-Lab',
      query: { id: params.row.id, action: 'edit' }
    })
  }

  const columns = [
    // {
    //   flex: 0.05,
    //   Width: 40,
    //   field: 'id',
    //   headerName: 'SL ',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {parseInt(params.row.sl_no)}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'lab_name',
      headerName: 'LAB NAME',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{ color: 'text.primary', textTransform: 'capitalize', cursor: 'pointer' }}

          // onClick={() =>

          // }
        >
          {params.row.lab_name}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'type',
      headerName: 'Type',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', textTransform: 'capitalize' }}>
          <span alt={params.row.type}>{params.row.type}</span>
        </Typography>
      )
    },

    {
      flex: 0.4,
      minWidth: 20,
      field: 'address',
      headerName: 'Address',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <span alt={params.row.address}>{params.row.address}</span>
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'active',
    //   headerName: 'STATUS',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary', textTransform: 'capitalize' }}>
    //       {parseInt(params.row.status) === 0 ? 'Inactive' : 'Active'}
    //     </Typography>
    //   )
    // },

    authData?.userData?.roles?.settings?.add_lab
      ? {
          flex: 0.2,
          minWidth: 20,
          field: 'Action',
          headerName: 'Action',
          renderCell: params => (
            <Box>
              <IconButton size='small' onClick={e => handleEdit(e, params)} aria-label='Edit'>
                <Icon icon='mdi:pencil-outline' />
              </IconButton>
            </Box>
          )
        }
      : null
  ].filter(column => column !== null)

  /***** Serverside pagination */
  const [total, setTotal] = useState(0)

  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])

  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
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

        await getLabList({ params: params }).then(res => {
          setTotal(parseInt(res?.data?.total_count))

          setRows(loadServerRows(paginationModel.page, res?.data?.result))
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
    debounce(async ({ sort, q, column }) => {
      setSearchValue(q)
      try {
        await fetchTableData({ sort, q, column })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  useEffect(() => {
    fetchTableData({ sort, q: searchValue, column: sortColumn })
  }, [fetchTableData])

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
    } else {
    }
  }

  const handleSearch = async value => {
    setSearchValue(value)

    // console.log('SearchValue', value)
    await searchTableData({ sort, q: value, column: sortColumn })
  }

  const headerAction = (
    <>
      {authData?.userData?.roles?.settings?.add_lab === true ? (
        <div>
          <Button
            size='big'
            variant='outlined'
            onClick={() => {
              Router.push('/lab/add-Lab')
            }}
          >
            Add Lab
          </Button>
        </div>
      ) : null}
    </>
  )

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const onCellClick = params => {
    const data = params.row

    Router.push({
      pathname: '/lab/lab-details',
      query: { id: data?.id }
    })
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          {/* <CommonDialogBox
            title={'Configure Medicine'}
            dialogBoxStatus={show}
            formComponent={<MedicineConfigure configureMedId={configureMedId} />}
            close={closeDialog}
            show={showDialog}
          /> */}
          <Card>
            <CardHeader title='Lab List' action={headerAction} />
            <DataGrid
              autoHeight
              pagination
              rows={indexedRows === undefined ? [] : indexedRows}
              rowCount={total}
              columns={columns}
              sortingMode='server'
              pageSizeOptions={[10, 25, 50]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              slots={{ toolbar: ServerSideToolbar }}
              onPaginationModelChange={setPaginationModel}
              loading={loading}
              onCellClick={onCellClick}
              slotProps={{
                baseButton: {
                  variant: 'outlined'
                },
                toolbar: {
                  value: searchValue,
                  clearSearch: () => handleSearch(''),
                  onChange: event => {
                    setSearchValue(event.target.value)
                    handleSearch(event.target.value)
                  }
                }
              }}
            />
          </Card>
        </>
      )}
    </>
  )
}

export default ListOfLab
