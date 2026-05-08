import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

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
import toast from 'react-hot-toast'
import moment from 'moment'

import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import { AuthContext } from 'src/context/AuthContext'
import { notFound } from 'next/navigation'
import ConfirmationDeleteDialog from 'src/components/ConfirmationDeleteDialog'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AddLabTest from 'src/views/pages/lab/test/addTest'
import TestDetails from 'src/views/pages/lab/test/testDetails'

import { addLabTest, deleteLabTest, getLabTestList, updateLabTest } from 'src/lib/api/lab/master'
import FallbackAvatar from 'src/views/utility/FallbackAvatar'
import type { LabTestMaster, EditParams } from 'src/types/lab'
import type { GridColDef, GridRenderCellParams, GridSortModel } from '@mui/x-data-grid'

interface IndexedLabTestMaster extends LabTestMaster {
  sl_no: number
}

const LabTest = () => {
  const theme = useTheme()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [sort, setSort] = useState('desc')
  const [sortColumn, setSortColumn] = useState('label')
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<LabTestMaster[]>([])
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const editParamsInitialState: EditParams = { id: null, label: null, sample_type_count: null, sub_test_count: null }
  const [editParams, setEditParams] = useState<EditParams>(editParamsInitialState)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [openDetailsDrawer, setOpenDetailsDrawer] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [btnLoader, setBtnLoader] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const authData = useContext(AuthContext) as any
  const { t } = useTranslation()

  const medical_add_tests = authData?.userData?.permission?.user_settings?.medical_add_tests

  function loadServerRows(_currentPage: number, data: LabTestMaster[]) {
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

        await getLabTestList({ params }).then(res => {
          setTotal(parseInt(String(res?.data?.total_count)))
          setRows(loadServerRows(paginationModel.page, (res?.data as { data?: LabTestMaster[] })?.data ?? []))
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
    setEditParams({ id: null, label: null, sample_type_count: null, sub_test_count: null })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSubmitData = async (payload: Record<string, unknown> | FormData) => {
    try {
      setSubmitLoader(true)
      let response
      if (editParams?.id !== null) {
        response = await updateLabTest(editParams?.id as number, payload as unknown as Parameters<typeof updateLabTest>[1])
      } else {
        response = await addLabTest(payload as unknown as Parameters<typeof addLabTest>[0])
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

  const handleEdit = async (event: React.MouseEvent, params: LabTestMaster) => {
    event.stopPropagation()
    setResetForm(true)
    setEditParams(params as EditParams)
    setOpenDrawer(true)
  }

  const confirmDeleteAction = async () => {
    try {
      setBtnLoader(true)
      const res = await deleteLabTest(selectedId as number)
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

  const handleDelete = (event: React.MouseEvent, testId: LabTestMaster) => {
    event.stopPropagation()
    setIsModalOpenDelete(true)
    setSelectedId(testId?.id)
  }

  const columns: GridColDef[] = [
    {
      flex: 0.3,
      minWidth: 200,
      sortable: false,
      field: 'LAB TEST NAME',
      headerName: t('lab_module.lab_test_name'),
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
      minWidth: 180,
      field: 'NO OF SAMPLES TYPES',
      headerName: t('lab_module.no_of_sample_types'),
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Typography noWrap variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
          {params.row.sample_type_count ? params.row.sample_type_count : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 170,
      field: 'NO OF SUB TESTS ',
      headerName: t('lab_module.no_of_sub_tests'),
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Typography noWrap variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
          {params.row.sub_test_count ? params.row.sub_test_count : '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 200,
      field: 'user_name',
      headerName: t('created_by'),
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
              background: theme.palette.customColors.displaybgPrimary,
              overflow: 'hidden'
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
            <Tooltip title={params.row.created_on ? moment(params.row.created_on).format('DD/MM/YYYY') : '-'}>
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
                {params.row.created_on ? moment(params.row.created_on).format('DD/MM/YYYY') : '-'}
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
      headerName: t('action'),
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <>
          {parseInt(params.row.zoo_id) === 0 ? null : (
            <Box>
              <IconButton size='small' sx={{ mr: 0.5 }} onClick={e => handleEdit(e, params.row)} aria-label='Edit'>
                <Icon icon='mdi:pencil-outline' />
              </IconButton>
            </Box>
          )}
        </>
      )
    }
  ]

  const handleCellClick = (params: { row: LabTestMaster }) => {
    setEditParams(params.row as EditParams)
    setOpenDetailsDrawer(true)
  }

  const headerAction = (
    <div>
      <Button size='medium' variant='contained' onClick={() => addEventSidebarOpen()}>
        <Icon icon='mdi:add' fontSize={20} />
        &nbsp; {t('add_new')}
      </Button>
    </div>
  )

  const getSlNo = (index: number) => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows: IndexedLabTestMaster[] = rows?.map((row, index) => ({
    ...row,
    id: row.id,
    sl_no: getSlNo(index)
  }))

  if (!medical_add_tests) notFound()

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
            <Typography sx={{ cursor: 'pointer' }} color='inherit'>
              {t('lab_module.lab_master')}
            </Typography>
            <Typography
              sx={{
                color: 'text.primary',
                cursor: 'pointer'
              }}
            >
              {t('lab_module.lab_tests')}
            </Typography>
          </Breadcrumbs>
          <Card>
            <CardHeader title={t('lab_module.lab_tests')} sx={{ paddingX: 5 }} action={headerAction} />

            <CommonTable
              indexedRows={indexedRows === undefined ? [] : indexedRows}
              total={total}
              columns={columns}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              handleSortModel={handleSortModel}
              loading={loading}
              onCellClick={handleCellClick}
              pageSizeOptions={[7, 10, 25, 50]}
              searchValue={searchValue}
              handleSearch={handleSearch}
              columnVisibilityModel={{
                sl_no: false
              }}
              externalTableStyle={{
                paddingX: 5,
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
                },
                '.MuiDataGrid-cell:focus': {
                  outline: 'none'
                },
                '& .MuiDataGrid-row:hover': {
                  cursor: 'pointer'
                }
              }}
            />
          </Card>
          {openDrawer && (
            <AddLabTest
              addEventSidebarOpen={openDrawer}
              setOpenDrawer={setOpenDrawer}
              handleSubmitData={handleSubmitData}
              resetForm={resetForm}
              submitLoader={submitLoader}
              editParams={editParams}
            />
          )}
          {openDetailsDrawer && (
            <TestDetails
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
            title={t('lab_module.confirm_delete_lab_test')}
          />
    </>
  )
}

export default LabTest
