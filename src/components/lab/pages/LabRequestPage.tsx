import React, { useState, useEffect, useCallback, useContext } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import {
  Box,
  Stack,
  CircularProgress,
  Breadcrumbs,
  Select,
  MenuItem,
  FormControl,
  Typography,
  CardHeader,
  InputLabel,
  Card
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

import { debounce } from 'lodash'
import moment from 'moment'

import { AuthContext } from 'src/context/AuthContext'
import Icon from 'src/@core/components/icon'
import FallbackSpinner from 'src/@core/components/spinner/index'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'

import { GetLabReportById, GetLabRequestTestStatusById } from 'src/lib/api/lab/getLabRequest'
import { readAsync, write } from 'src/lib/windows/utils'
import type { LabRequestRow, RequestStats } from 'src/types/lab'
import type { GridColDef, GridRenderCellParams, GridSortModel } from '@mui/x-data-grid'

interface LabItem {
  lab_id: number | string
  lab_name?: string
}

interface IndexedLabRequestRow extends LabRequestRow {
  sl_no: number
}

interface FetchDataParams {
  sort?: string
  q?: string
  column?: string
  page?: number
  limit?: number
  pageSize?: number
  lab_id?: number | string
}

const LabRequestPage = () => {
  const theme = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const authData = useContext(AuthContext) as any

  const [loader] = useState(false)
  const [selectLoader] = useState(false)
  const [labSelected, setLabSelected] = useState<number | string | undefined>()
  const [lab] = useState<LabItem[]>((authData?.userData?.modules?.lab_data?.lab as LabItem[] | undefined) ?? [])
  const [stats, setStats] = useState<RequestStats | undefined>()

  const [selectedLab, setSelectedLab] = useState<number | string | null>(
    (authData?.userData?.modules?.lab_data?.lab?.length ?? 0) > 0
      ? (authData?.userData?.modules?.lab_data?.lab?.[0] as LabItem | undefined)?.lab_id ?? null
      : null
  )

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState<LabRequestRow[]>([])
  const [searchValue, setSearchValue] = useState(searchParams?.get('q') || '')
  const [sortColumn, setSortColumn] = useState('name')

  const [paginationModel, setPaginationModel] = useState({
    page: searchParams?.get('page') ? parseInt(searchParams?.get('page')!) : 0,
    pageSize: searchParams?.get('pageSize') ? parseInt(searchParams?.get('pageSize')!) : 50
  })
  const [loading, setLoading] = useState(false)

  const handleClickRequestId = (params: { row: LabRequestRow }) => {
    const id = params.row.lab_test_id
    const sp = new URLSearchParams()
    sp.set('lab_id', String(params.row.lab_id))
    if (searchParams?.get('page')) sp.set('page', searchParams?.get('page')!)
    if (searchParams?.get('pageSize')) sp.set('pageSize', searchParams?.get('pageSize')!)
    if (searchParams?.get('q')) sp.set('q', searchParams?.get('q')!)
    router.push(`/lab/request/${id}?${sp.toString()}`)
  }

  const columns: GridColDef[] = [
    {
      width: 300,
      field: 'lab_test_id',
      headerName: 'REQUEST ID',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: 'text.primary', cursor: 'pointer', ml: 3 }}>
          {params.row.lab_test_id}
        </Typography>
      )
    },
    {
      width: 200,
      sortable: false,
      field: 'site_name',
      headerName: 'Site',
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          <span>{params.row.site_name}</span>
        </Typography>
      )
    },
    {
      width: 150,
      field: 'created_at',
      sortable: false,
      headerName: 'Date',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {moment(params.row.created_at).format('DD MMM YYYY')}
        </Typography>
      )
    },
    {
      width: 150,
      field: 'total_test',
      headerName: 'No. of Tests ',
      sortable: false,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          <span>{params.row.total_lab_tests}</span>
        </Typography>
      )
    },
    {
      width: 200,
      field: 'status',
      sortable: false,
      headerName: 'Status',
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction='row' spacing={2} sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
          {params.row.total_tests_pending > 0 && (
            <Box
              sx={{
                bgcolor: theme.palette.customColors.Tertiary,
                color: 'white',
                borderRadius: '50px',
                height: 20,
                minWidth: 20,
                paddingX: 1.4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {params.row.total_tests_pending}
            </Box>
          )}
          {params.row.total_tests_inprogress > 0 && (
            <Box
              sx={{
                bgcolor: theme.palette.customColors.moderateSecondary,
                color: 'white',
                borderRadius: '50px',
                height: 20,
                minWidth: 20,
                paddingX: 1.4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {params.row.total_tests_inprogress}
            </Box>
          )}
          {params.row.total_tests_completed > 0 && (
            <Box
              sx={{
                bgcolor: theme.palette.primary.main,
                color: 'white',
                borderRadius: '50px',
                height: 20,
                minWidth: 20,
                paddingX: 1.4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {params.row.total_tests_completed}
            </Box>
          )}
        </Stack>
      )
    },
    {
      width: 200,
      field: 'Reports',
      headerName: 'Reports',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <>
          {params?.row?.total_attachments > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                justifyContent: 'center',
                bgcolor: 'rgba(0, 0, 0, 0.05)',
                p: 2,
                borderRadius: '15px',
                width: 50
              }}
            >
              <img src='/images/attach_file.png' alt='default icon' style={{ width: 12 }} />
              <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: 'bold', fontSize: '15px' }}>
                {params.row.total_attachments}
              </Typography>
            </Box>
          )}
        </>
      )
    }
  ]

  function loadServerRows(_currentPage: number, data: LabRequestRow[]) {
    return data
  }

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column, lab_id }: FetchDataParams) => {
      setSearchValue(q ?? '')
      try {
        await fetchData({ sort, q, column, lab_id, page: paginationModel.page + 1, pageSize: paginationModel.pageSize })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const GetLabRequestStatus = async (params: { lab_id?: number | string }) => {
    try {
      const res = await GetLabRequestTestStatusById({ params })
      setStats((res?.data as { stats?: RequestStats })?.stats)
    } catch (error) {
      console.log('error', error)
    }
  }

  const oldstoredData = async () => {
    const Data = await readAsync('selectedLAB')

    setLabSelected(Data as number | string)
    if (Data) {
      const labList = authData?.userData?.modules?.lab_data?.lab as LabItem[]
      const firstLab = labList[0]?.lab_id
      const labExists = labList.some((lab: LabItem) => lab.lab_id === Data)

      if (labExists) {
        setSelectedLab(Data as number | string)

        const params = {
          sort,
          q: searchValue,
          column: sortColumn,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          lab_id: Data as number | string
        }
        const params2 = { lab_id: Data as number | string }
        GetLabRequestStatus(params2)
        fetchData(params)
      } else {
        handleLabChange(firstLab)
      }
    } else {
      const data = (authData?.userData?.modules?.lab_data?.lab as LabItem[])[0]?.lab_id

      setSelectedLab(data)

      const params = {
        sort,
        q: searchValue,
        column: sortColumn,
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        lab_id: data
      }
      const params2 = { lab_id: data }
      GetLabRequestStatus(params2)
      fetchData(params)
    }
  }

  const handleSortModel = async (newModel: GridSortModel) => {
    if (newModel.length > 0) {
      await searchTableData({ sort: newModel[0].sort ?? 'asc', q: searchValue, column: newModel[0].field })
    }
  }

  const fetchData = useCallback(async (params: FetchDataParams) => {
    try {
      setLoading(true)
      const response = await GetLabReportById({ params })
      if (response?.success) {
        setTotal(parseInt(String(response?.data?.total_count)))
        setRows(loadServerRows(paginationModel.page, (response?.data?.result as LabRequestRow[]) ?? []))
      }

      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }, [])

  const handleLabChange = async (value: number | string) => {
    write('selectedLAB', value)
    setPaginationModel({ page: 0, pageSize: 10 })
    setLabSelected(value)
    const storedLabData = await readAsync('selectedLAB')
    setSelectedLab(value)

    const params: FetchDataParams = {
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      lab_id: value
    }
    await fetchData(params)
    const params2 = { lab_id: value }
    GetLabRequestStatus(params2)
  }

  const handlePaginationModelChange = async (data: { page: number; pageSize: number }) => {
    const params: FetchDataParams = {
      sort,
      q: searchValue,
      column: sortColumn,
      page: data.page + 1,
      limit: data.pageSize,
      lab_id: selectedLab ?? undefined
    }
    updateUrlParams({ q: searchValue, page: data.page, pageSize: data.pageSize })
    setPaginationModel(data)
    await fetchData(params)
  }

  const handleSearch = async (value: string) => {
    setSearchValue(value)
    updateUrlParams({ page: 0, pageSize: 10, q: value })
    setPaginationModel({ page: 0, pageSize: 10 })
    await searchTableData({ sort, q: value, column: sortColumn, lab_id: selectedLab ?? undefined })
  }

  const getSlNo = (index: number) => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows: IndexedLabRequestRow[] = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const updateUrlParams = (params: Record<string, unknown>) => {
    const sp = new URLSearchParams()
    const merged = { q: searchValue, page: paginationModel.page, pageSize: paginationModel.pageSize, ...params }
    Object.entries(merged).forEach(([k, v]) => {
      if (v != null && v !== '') sp.set(k, String(v))
    })
    router.replace(`/lab/request?${sp.toString()}`)
  }

  useEffect(() => {
    oldstoredData()
  }, [])

  return (
    <>
      {loader ? (
        <FallbackSpinner sx={{}} />
      ) : (
        <>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
            <Typography sx={{ cursor: 'pointer' }} color='inherit'>
              Labs
            </Typography>
            <Typography sx={{ color: 'text.primary', cursor: 'pointer' }}>Requests list</Typography>
          </Breadcrumbs>
          <Card key={String(selectedLab)}>
            <CardHeader title={'Requests lists'} />

            <Stack
              direction={{ md: 'row', sm: 'row', sx: 'column' }}
              sx={{ display: 'flex', justifyContent: 'space-between', mr: 5, alignItems: 'center' }}
            >
              <Box sx={{ minWidth: 250, maxWidth: 300, ml: 5 }}>
                {selectLoader ? (
                  <CircularProgress color='success' />
                ) : (
                  <FormControl fullWidth size='small'>
                    <InputLabel id='lab-select-label'>Select Lab</InputLabel>
                    <Select
                      labelId='lab-select-label'
                      id='lab-select'
                      value={selectedLab ?? ''}
                      label='Select Lab'
                      onChange={event => handleLabChange(event.target.value as number | string)}
                      sx={{ fontWeight: 'bold', borderRadius: '5px' }}
                      MenuProps={{ PaperProps: { sx: { maxHeight: 300, overflowY: 'auto' } } }}
                    >
                      {lab?.map(item => (
                        <MenuItem key={item?.lab_id} value={item?.lab_id}>
                          {item?.lab_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            </Stack>

            <Box
              sx={{
                bgcolor: theme.palette.customColors.cardHeaderBg,
                p: 2,
                mt: 3,
                ml: 5,
                mr: 5,
                borderRadius: '5px'
              }}
            >
              <Stack
                direction={{ md: 'row', sm: 'row', sx: 'column' }}
                spacing={2}
                sx={{ gap: 2, display: 'flex', alignItems: 'center' }}
              >
                <Typography>
                  Total Requests -{' '}
                  <span style={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>{stats?.total_requests}</span>
                </Typography>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: theme.palette.customColors.customDropdownColor,
                    borderRadius: '15px',
                    px: 3,
                    py: 1
                  }}
                >
                  <Typography sx={{ color: theme.palette.customColors.customDropdownColor, fontSize: '12px' }}>
                    Pending Tests - {stats?.total_tests_pending}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: theme.palette.customColors.moderateSecondary,
                    borderRadius: '15px',
                    px: 3,
                    py: 1
                  }}
                >
                  <Typography sx={{ color: theme.palette.customColors.moderateSecondary, fontSize: '12px' }}>
                    Tests in Progress - {stats?.total_tests_inprogress}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: theme.palette.primary.main,
                    borderRadius: '15px',
                    px: 3,
                    py: 1
                  }}
                >
                  <Typography sx={{ color: theme.palette.primary.main, fontSize: '12px' }}>
                    Completed Tests - {stats?.total_tests_completed}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Stack
              direction={{ md: 'row', sm: 'row', sx: 'column' }}
              spacing={4}
              sx={{ alignItems: 'center', justifyContent: 'flex-end', m: 5 }}
            >
              <>
                <Typography sx={{ fontWeight: 'bold' }}>Status : </Typography>
              </>
              <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                <Icon icon='ic:baseline-circle' fontSize={15} color={theme.palette.customColors.customDropdownColor} />
                <Typography variant='subtitle1'>Pending</Typography>
              </Box>
              <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                <Icon icon='ic:baseline-circle' fontSize={15} color={theme.palette.customColors.moderateSecondary} />
                <Typography variant='subtitle1'>In Progress</Typography>
              </Box>
              <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                <Icon icon='ic:baseline-circle' fontSize={15} color={theme.palette.primary.main} />
                <Typography variant='subtitle1'>Completed</Typography>
              </Box>
            </Stack>

            <CommonTable
              indexedRows={indexedRows === undefined ? [] : indexedRows}
              total={total}
              columns={columns}
              paginationModel={paginationModel}
              handleSortModel={handleSortModel}
              setPaginationModel={handlePaginationModelChange}
              loading={loading}
              onRowClick={handleClickRequestId}
              slots={{ toolbar: ServerSideToolbar }}
              slotProps={{
                baseButton: { variant: 'outlined' },
                toolbar: {
                  value: searchValue,
                  clearSearch: () => handleSearch(''),
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchValue(event.target.value)
                    handleSearch(event.target.value)
                  }
                }
              }}
              externalTableStyle={{ paddingX: 5 }}
            />
          </Card>
        </>
      )}
    </>
  )
}

export default LabRequestPage
