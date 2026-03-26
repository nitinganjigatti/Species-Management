import React, { useState, useEffect, useCallback, useContext } from 'react'
import Router, { useRouter } from 'next/router'

import { Box, Badge, Breadcrumbs, Tooltip, Typography, Button, Card, CardHeader, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { debounce } from 'lodash'

import { AuthContext } from 'src/context/AuthContext'
import ErrorScreen from 'src/pages/Error'
import FallbackSpinner from 'src/@core/components/spinner/index'
import Icon from 'src/@core/components/icon'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { getLabList } from 'src/lib/api/lab/addLab'

const ListOfLab = () => {
  const theme = useTheme()
  const router = useRouter()

  const [loader, setLoader] = useState(false)
  const [show, setShow] = useState(false)
  const [configureMedId, setConfigureMedId] = useState('')
  const [storedData, setStoredData] = useState()
  const authData = useContext(AuthContext) || {}

  useEffect(() => {
    const Data = window.localStorage.getItem('userDetails')
    setStoredData(JSON.parse(Data))
  }, [])

  const handleEdit = async (e, params) => {
    e.stopPropagation()

    Router.push({
      pathname: '/lab/lab-list/add-Lab',
      query: {
        id: params.row.id,
        action: 'edit',
        page: router.query?.page,
        pageSize: router.query?.pageSize,
        q: router.query.q
      }
    })
  }

  const columns = [
    // {
    //   flex: 0.05,
    //   Width: 40,
    //   field: 'id',
    //    headerName:'SL.NO',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {parseInt(params.row.sl_no)}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.3,
      minWidth: 250,
      field: 'lab_name',
      headerName: 'LAB NAME',
      renderCell: params => (
        <Box sx={{ width: '100%', display: 'flex' }}>
          <Tooltip title={params.row.lab_name || ''}>
            <Typography
              variant='body2'
              sx={{
                color: 'text.primary',
                textTransform: 'capitalize',
                cursor: 'pointer',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                mr: 14
              }}
            >
              {params.row.lab_name || ''}
            </Typography>
          </Tooltip>
          {params.row.is_default === '1' ? (
            <Badge
              sx={{ position: 'relative', right: 20, top: 10 }}
              color='success'
              badgeContent='Default'
              style={{}}
            ></Badge>
          ) : null}
        </Box>
      )
    },
    {
      flex: 0.2,
      minWidth: 120,
      field: 'type',
      headerName: 'Type',
      renderCell: params => (
        <Tooltip title={params.row?.type ? params.row?.type : '-'}>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 500,
              textTransform: 'capitalize',
              fontFamily: 'Inter',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            <span alt={params.row.type}>{params.row.type}</span>
          </Typography>
        </Tooltip>
      )
    },

    {
      flex: 0.4,
      minWidth: 160,
      field: 'address',
      headerName: 'Address',
      renderCell: params => (
        <Tooltip title={params.row?.address ? params.row?.address : '-'}>
          <Typography
            variant='body2'
            sx={{ color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {params?.row?.address ? params?.row?.address : '-'}
          </Typography>
        </Tooltip>
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
          minWidth: 70,
          field: 'Action',
          sortable: false,
          headerName: 'Action',
          renderCell: params => (
            <IconButton size='small' onClick={e => handleEdit(e, params)} aria-label='Edit'>
              <Icon icon='mdi:pencil-outline' />
            </IconButton>
          )
        }
      : null
  ].filter(column => column !== null)

  /***** Serverside pagination */
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('ASC')
  const [rows, setRows] = useState([])

  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [sortColumn, setSortColumn] = useState('name')

  const [paginationModel, setPaginationModel] = useState({
    page: router?.query?.page ? parseInt(router?.query?.page) : 0,
    pageSize: router?.query?.pageSize ? parseInt(router?.query?.pageSize) : 50
  })
  const [loading, setLoading] = useState(false)
  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async ({ sort, q, column }) => {
      try {
        setLoading(true)

        const params = {
          sort_order: sort.toUpperCase(),
          q,
          sort_column: column,
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

  const handlePaginationModelChange = async data => {
    updateUrlParams({
      q: searchValue,
      page: data.page,
      pageSize: data.pageSize
    })

    setPaginationModel(data)
  }

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column }) => {
      setSearchValue(q)
      updateUrlParams({
        page: 0,
        pageSize: 10,
        q: q
      })
      setPaginationModel({ page: 0, pageSize: 10 })
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
    updateUrlParams({
      page: 0,
      pageSize: 10,
      q: value
    })
    setPaginationModel({ page: 0, pageSize: 10 })
    await searchTableData({ sort, q: value, column: sortColumn })
  }

  const headerAction = (
    <>
      {authData?.userData?.roles?.settings?.add_lab === true ? (
        <Button
          size='big'
          variant='outlined'
          onClick={() => {
            Router.push({
              pathname: '/lab/lab-list/add-Lab',
              query: { page: router.query?.page, pageSize: router.query?.pageSize, q: searchValue }
            })
          }}
        >
          Add Lab
        </Button>
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
      pathname: '/lab/lab-list/lab-details',
      query: { id: data?.id, page: router.query?.page, pageSize: router.query?.pageSize, q: searchValue }
    })
  }

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  return (
    <>
      {authData?.userData?.modules?.lab_data?.lab?.length > 0 || authData?.userData?.roles?.settings?.add_lab ? (
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
              <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
                <Typography color='inherit'>Lab</Typography>
                <Typography
                  sx={{
                    color: 'text.primary'
                  }}
                >
                  Lab list
                </Typography>
              </Breadcrumbs>
              <Card sx={{ paddingX: 5 }}>
                <CardHeader sx={{ paddingX: 0 }} title='Lab List' action={headerAction} />
                <CommonTable
                  indexedRows={indexedRows === undefined ? [] : indexedRows}
                  total={total}
                  columns={columns}
                  paginationModel={paginationModel}
                  setPaginationModel={handlePaginationModelChange}
                  handleSortModel={handleSortModel}
                  loading={loading}
                  onCellClick={onCellClick}
                  pageSizeOptions={[10, 25, 50]}
                  searchValue={searchValue}
                  handleSearch={handleSearch}
                  externalTableStyle={{
                    borderTopLeftRadius: '8px',
                    '& .MuiBox-root': {
                      paddingX: 0
                    },
                    '.MuiDataGrid-main': {
                      border: `1px solid ${theme.palette.customColors.mdAntzNeutral}`,
                      borderRadius: '8px'
                    },
                    '& .MuiDataGrid-footerContainer': {
                      border: 'none !important'
                    }
                  }}
                />
              </Card>
            </>
          )}
        </>
      ) : (
        <ErrorScreen />
      )}
    </>
  );
}

export default ListOfLab
