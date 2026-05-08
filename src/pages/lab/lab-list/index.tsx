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
import type { Lab } from 'src/types/lab'
import type { GridColDef, GridRenderCellParams, GridSortModel } from '@mui/x-data-grid'

interface FetchDataParams {
  sort: string
  q: string
  column: string
}

interface IndexedLab extends Lab {
  sl_no: number
}

const ListOfLab = () => {
  const theme = useTheme()
  const router = useRouter()

  const [loader, setLoader] = useState(false)
  const [show, setShow] = useState(false)
  const [configureMedId, setConfigureMedId] = useState('')
  const [storedData, setStoredData] = useState<unknown>()
  const authData = useContext(AuthContext) as any

  useEffect(() => {
    const Data = window.localStorage.getItem('userDetails')
    setStoredData(Data ? JSON.parse(Data) : null)
  }, [])

  const handleEdit = async (e: React.MouseEvent, params: GridRenderCellParams) => {
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

  /***** Serverside pagination */
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('ASC')
  const [rows, setRows] = useState<Lab[]>([])

  const [searchValue, setSearchValue] = useState(router.query.q ? String(router.query.q) : '')
  const [sortColumn, setSortColumn] = useState('name')

  const [paginationModel, setPaginationModel] = useState({
    page: router?.query?.page ? parseInt(String(router?.query?.page)) : 0,
    pageSize: router?.query?.pageSize ? parseInt(String(router?.query?.pageSize)) : 50
  })
  const [loading, setLoading] = useState(false)

  function loadServerRows(_currentPage: number, data: Lab[]) {
    return data
  }

  const fetchTableData = useCallback(
    async ({ sort, q, column }: FetchDataParams) => {
      try {
        setLoading(true)

        const params = {
          sort_order: sort.toUpperCase(),
          q,
          sort_column: column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getLabList({ params }).then(res => {
          setTotal(res?.data?.total_count ?? 0)
          setRows(loadServerRows(paginationModel.page, res?.data?.result ?? []))
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  const handlePaginationModelChange = async (data: { page: number; pageSize: number }) => {
    updateUrlParams({
      q: searchValue,
      page: data.page,
      pageSize: data.pageSize
    })

    setPaginationModel(data)
  }

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column }: FetchDataParams) => {
      setSearchValue(q)
      updateUrlParams({
        page: 0,
        pageSize: 10,
        q
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

  const handleSortModel = async (newModel: GridSortModel) => {
    if (newModel.length > 0) {
      await searchTableData({ sort: newModel[0].sort ?? 'ASC', q: searchValue, column: newModel[0].field })
    }
  }

  const handleSearch = async (value: string) => {
    setSearchValue(value)
    updateUrlParams({
      page: 0,
      pageSize: 10,
      q: value
    })
    setPaginationModel({ page: 0, pageSize: 10 })
    await searchTableData({ sort, q: value, column: sortColumn })
  }

  const columns: GridColDef[] = [
    {
      flex: 0.3,
      minWidth: 250,
      field: 'lab_name',
      headerName: 'LAB NAME',
      renderCell: (params: GridRenderCellParams) => (
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
      renderCell: (params: GridRenderCellParams) => (
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
            <span>{params.row.type}</span>
          </Typography>
        </Tooltip>
      )
    },

    {
      flex: 0.4,
      minWidth: 160,
      field: 'address',
      headerName: 'Address',
      renderCell: (params: GridRenderCellParams) => (
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

    ...(authData?.userData?.roles?.settings?.add_lab
      ? [
          {
            flex: 0.2,
            minWidth: 70,
            field: 'Action',
            sortable: false,
            headerName: 'Action',
            renderCell: (params: GridRenderCellParams) => (
              <IconButton size='small' onClick={e => handleEdit(e, params)} aria-label='Edit'>
                <Icon icon='mdi:pencil-outline' />
              </IconButton>
            )
          } as GridColDef
        ]
      : [])
  ]

  const headerAction = (
    <>
      {authData?.userData?.roles?.settings?.add_lab === true ? (
        <Button
          size='medium'
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

  const getSlNo = (index: number) => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows: IndexedLab[] = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const onCellClick = (params: { row: Lab }) => {
    const data = params.row

    Router.push({
      pathname: '/lab/lab-list/lab-details',
      query: { id: data?.id, page: router.query?.page, pageSize: router.query?.pageSize, q: searchValue }
    })
  }

  const updateUrlParams = (params: Record<string, string | number>) => {
    const query = { ...router.query, ...params }
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  return (
    <>
      {(authData?.userData?.modules?.lab_data?.lab?.length ?? 0) > 0 || authData?.userData?.roles?.settings?.add_lab ? (
        <>
          {loader ? (
            <FallbackSpinner sx={{}} />
          ) : (
            <>
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
  )
}

export default ListOfLab
