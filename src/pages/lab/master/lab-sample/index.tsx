import React, { useCallback, useContext, useEffect, useState } from 'react'
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardHeader,
  IconButton,
  Tooltip,
  Typography,
  debounce
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import moment from 'moment'
import toast from 'react-hot-toast'

import { AuthContext } from 'src/context/AuthContext'
import Error404 from 'src/pages/404'

import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import ConfirmationDeleteDialog from 'src/components/ConfirmationDeleteDialog'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import AddSample from 'src/views/pages/lab/sample/addSample'
import SampleDetails from 'src/views/pages/lab/sample/sampleDetails'

import { addLabSample, deleteLabSample, getLabSampleList, updateLabSample } from 'src/lib/api/lab/master'
import FallbackAvatar from 'src/views/utility/FallbackAvatar'
import type { LabSampleMaster, EditParams } from 'src/types/lab'
import type { GridColDef, GridRenderCellParams, GridSortModel } from '@mui/x-data-grid'

interface IndexedLabSampleMaster extends LabSampleMaster {
  sl_no: number
}

const LabSamples = () => {
  const theme = useTheme()
  const authData = useContext(AuthContext) as any
  const editParamsInitialState: EditParams = { id: null, label: null }

  const medical_add_samples = authData?.userData?.permission?.user_settings?.medical_add_samples

  const [openDrawer, setOpenDrawer] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [sort, setSort] = useState('desc')
  const [sortColumn, setSortColumn] = useState('label')
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<LabSampleMaster[]>([])
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [editParams, setEditParams] = useState<EditParams>(editParamsInitialState)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [openDetailsDrawer, setOpenDetailsDrawer] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [btnLoader, setBtnLoader] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  function loadServerRows(_currentPage: number, data: LabSampleMaster[]) {
    return data
  }

  const fetchTableData = useCallback(
    async (q?: string) => {
      try {
        setLoading(true)

        const params = {
          q,
          sort,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getLabSampleList({ params }).then(res => {
          setTotal(parseInt(String(res?.data?.total_count)))
          setRows(loadServerRows(paginationModel.page, res?.data?.result ?? []))
        })
        setResetForm(true)
        setLoading(false)
      } catch (e) {
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    fetchTableData(searchValue)
  }, [fetchTableData])

  const handleSortModel = (newModel: GridSortModel) => {
    if (newModel.length) {
      setSort(newModel[0].sort ?? 'desc')
      setSortColumn(newModel[0].field)
      fetchTableData(searchValue)
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort: string, q: string, column: string) => {
      setSearchValue(q)
      try {
        await fetchTableData(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = (value: string) => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
  }

  const addEventSidebarOpen = () => {
    setEditParams({ id: null, label: null })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSubmitData = async (payload: Record<string, unknown>) => {
    try {
      setSubmitLoader(true)
      let response
      if (editParams?.id !== null) {
        response = await updateLabSample(editParams?.id as number, payload)
      } else {
        response = await addLabSample(payload)
      }
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        setResetForm(true)
        setSubmitLoader(false)
        setOpenDrawer(false)
        await fetchTableData()
      } else {
        Toaster({ type: 'error', message: response?.message })
        setSubmitLoader(false)
      }
    } catch (e) {
      setSubmitLoader(false)
      toast.error(JSON.stringify(e))
    }
  }

  const handleEdit = async (event: React.MouseEvent, params: LabSampleMaster) => {
    event.stopPropagation()
    setResetForm(true)
    setEditParams(params as EditParams)
    setOpenDrawer(true)
  }

  const confirmDeleteAction = async () => {
    try {
      setBtnLoader(true)
      const res = await deleteLabSample(selectedId as number)
      if (res?.success) {
        setBtnLoader(false)
        setIsModalOpenDelete(false)
        Toaster({ type: 'success', message: res?.message })
        await fetchTableData()
      } else {
        setBtnLoader(false)
        setIsModalOpenDelete(false)
        Toaster({ type: 'error', message: res?.message })
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setBtnLoader(false)
      setIsModalOpenDelete(false)
    }
  }

  const handleDelete = (event: React.MouseEvent, testId: LabSampleMaster) => {
    event.stopPropagation()
    setIsModalOpenDelete(true)
    setSelectedId(testId?.id)
  }

  const columns: GridColDef[] = [
    {
      flex: 0.3,
      minWidth: 200,
      sortable: false,
      field: 'LAB SAMPLE NAME',
      headerName: 'LAB SAMPLE NAME',
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.row.label ? params.row.label : '-'}>
          <Typography
            noWrap
            variant='body2'
            sx={{
              color: 'text.primary',
              pl: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {params.row.label ? params.row.label : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.3,
      minWidth: 170,
      field: 'NO OF LAB TESTS ',
      headerName: 'NO OF LAB TESTS ',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Typography noWrap variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
          {params.row.lab_test_count ? params.row.lab_test_count : '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 200,
      field: 'user_name',
      headerName: 'CREATED BY',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FallbackAvatar
            variant='square'
            alt='Medicine Image'
            sx={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: theme.palette.customColors.displaybgPrimary
            }}
            src={params?.row.created_by_user?.profile_pic}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Tooltip title={params.row.created_by_user?.user_name ? params.row.created_by_user?.user_name : '-'}>
              <Typography
                noWrap
                variant='body2'
                sx={{
                  color: 'text.primary',
                  fontSize: 14,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {params.row.created_by_user?.user_name ? params.row.created_by_user?.user_name : '-'}
              </Typography>
            </Tooltip>
            <Tooltip title={params.row.created_at ? moment(params.row.created_at).format('DD/MMM/YYYY') : '-'}>
              <Typography
                noWrap
                variant='body2'
                sx={{
                  color: theme.palette.customColors.neutralSecondary,
                  fontSize: 12,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {params.row.created_at ? moment(params.row.created_at).format('DD/MMM/YYYY') : '-'}
              </Typography>
            </Tooltip>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.2,
      minWidth: 100,
      field: 'Action',
      headerName: 'Action',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <>
          {params?.row?.zoo_id !== '0' ? (
            <IconButton size='small' sx={{ mr: 0.5 }} onClick={e => handleEdit(e, params.row)} aria-label='Edit'>
              <Icon icon='mdi:pencil-outline' />
            </IconButton>
          ) : null}
        </>
      )
    }
  ]

  const handleCellClick = (params: { row: LabSampleMaster }) => {
    setEditParams(params.row as EditParams)
    setOpenDetailsDrawer(true)
  }

  const headerAction = (
    <div>
      <Button size='medium' variant='contained' onClick={() => addEventSidebarOpen()}>
        <Icon icon='mdi:add' fontSize={20} />
        &nbsp; Add New
      </Button>
    </div>
  )

  const getSlNo = (index: number) => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows: IndexedLabSampleMaster[] = rows?.map((row, index) => ({
    ...row,
    id: row.id,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      {medical_add_samples ? (
        <>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
            <Typography sx={{ cursor: 'pointer' }} color='inherit'>
              Lab Master
            </Typography>
            <Typography
              sx={{
                color: 'text.primary',
                cursor: 'pointer'
              }}
            >
              Lab Samples
            </Typography>
          </Breadcrumbs>
          <Card>
            <CardHeader title='Lab Samples' sx={{ paddingX: 5 }} action={headerAction} />

            <CommonTable
              indexedRows={indexedRows === undefined ? [] : indexedRows}
              total={total}
              columns={columns}
              paginationModel={paginationModel}
              handleSortModel={handleSortModel}
              setPaginationModel={setPaginationModel}
              loading={loading}
              onRowClick={handleCellClick}
              columnVisibilityModel={{
                sl_no: false
              }}
              slots={{ toolbar: ServerSideToolbarWithFilter }}
              slotProps={{
                baseButton: {
                  variant: 'outlined'
                },
                toolbar: {
                  value: searchValue,
                  clearSearch: () => handleSearch(''),
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) => handleSearch(event.target.value)
                }
              }}
              externalTableStyle={{
                paddingX: 5
              }}
            />
          </Card>
          {openDrawer && (
            <AddSample
              addEventSidebarOpen={openDrawer}
              setOpenDrawer={setOpenDrawer}
              handleSubmitData={handleSubmitData}
              resetForm={resetForm}
              submitLoader={submitLoader}
              editParams={editParams}
            />
          )}
          {openDetailsDrawer && (
            <SampleDetails
              addEventSidebarOpen={openDetailsDrawer}
              setOpenDetailsDrawer={setOpenDetailsDrawer}
              editParams={editParams}
              setOpenDrawer={setOpenDrawer}
              fetchTableData={fetchTableData}
            />
          )}
          <ConfirmationDeleteDialog
            open={isModalOpenDelete}
            onClose={() => setIsModalOpenDelete(false)}
            confirmLoading={btnLoader}
            onConfirm={confirmDeleteAction}
            title='Are you sure you want to delete this lab sample?'
          />
        </>
      ) : (
        <Error404></Error404>
      )}
    </>
  )
}

export default LabSamples
