import React, { useCallback, useEffect, useState, useContext } from 'react'

import toast from 'react-hot-toast'
import Toaster from 'src/components/Toaster'
import {
  getMortalityReasonsList,
  addMortalityReasons,
  updateMortalityReasons
} from 'src/lib/api/lab/mortality'
import { Box, Breadcrumbs, Button, Card, CardHeader, IconButton, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'

import { AuthContext } from 'src/context/AuthContext'
import { notFound } from 'next/navigation'
import AddMortalityReasons from 'src/views/pages/lab/mortality-reason'
import { useTheme } from '@mui/material/styles'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import QuickSearchToolbar from 'src/views/table/data-grid/QuickSearchToolbar'
import type { MortalityReason, EditParams } from 'src/types/lab'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

const escapeRegExp = (value: string) => {
  return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

const MortalityReasonPage = () => {
  const theme = useTheme()
  const authData = useContext(AuthContext) as any
  const [openDrawer, setOpenDrawer] = useState(false)
  const [rows, setRows] = useState<MortalityReason[]>([])
  const editParamsInitialState: EditParams = { id: null, label: null }
  const [editParams, setEditParams] = useState<EditParams>(editParamsInitialState)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const [data, setData] = useState<MortalityReason[]>([])
  const [searchText, setSearchText] = useState('')
  const [filteredData, setFilteredData] = useState<MortalityReason[]>([])
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })

  const medical_add_mortality_reasons = authData?.userData?.permission?.user_settings?.medical_add_mortality_reasons

  const handleSearch = (searchValue: string) => {
    setSearchText(searchValue)
    const searchRegex = new RegExp(escapeRegExp(searchValue), 'i')

    const filteredRows = data.filter(row => {
      return Object.keys(row).some(field => {
        const value = (row as unknown as Record<string, unknown>)[field]
        return value?.toString() && searchRegex.test(String(value))
      })
    })
    if (searchValue.length) {
      setFilteredData(filteredRows)
    } else {
      setFilteredData([])
    }
  }

  useEffect(() => {
    setData(rows)
  }, [rows])

  const fetchTableData = useCallback(async () => {
    try {
      const params = {}
      await getMortalityReasonsList({ params }).then(res => {
        setRows((res?.data as MortalityReason[]) ?? [])
      })
      setResetForm(true)
    } catch (e) {
      setRows([])
      console.log('error', e)
    }
  }, [])

  useEffect(() => {
    fetchTableData()
  }, [fetchTableData])

  const addEventSidebarOpen = () => {
    setEditParams({ id: null, label: null })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSubmitData = async (payload: { name: string }) => {
    try {
      setSubmitLoader(true)
      let response
      if (editParams?.id !== null) {
        response = await updateMortalityReasons(editParams?.id as number, payload)
      } else {
        response = await addMortalityReasons(payload)
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

  const handleEdit = async (event: React.MouseEvent, params: MortalityReason) => {
    event.stopPropagation()
    setResetForm(true)
    setEditParams(params as EditParams)
    setOpenDrawer(true)
  }

  const handleDelete = (event: React.MouseEvent, testId: MortalityReason) => {
    event.stopPropagation()
    setIsModalOpenDelete(true)
    setSelectedId(testId?.id)
  }

  const columns: GridColDef[] = [
    {
      flex: 0.3,
      minWidth: 30,
      sortable: false,
      field: 'Mortality Reasons',
      headerName: 'Mortality Reasons',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
            {params.row.name ? params.row.name : '-'}
          </Typography>
        </Box>
      )
    },

    {
      flex: 0.3,
      minWidth: 30,
      field: 'Description ',
      headerName: 'Description ',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
            {params.row.description ? params.row.description : 'NA'}
          </Typography>
        </Box>
      )
    },

    {
      flex: 0.2,
      minWidth: 30,
      field: 'Action',
      headerName: 'Action',
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

  const headerAction = (
    <div>
      <Button size='medium' variant='contained' onClick={() => addEventSidebarOpen()}>
        <Icon icon='mdi:add' fontSize={20} />
        &nbsp; Add New
      </Button>
    </div>
  )

  if (!medical_add_mortality_reasons) notFound()

  return (
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
              Mortality Reason
            </Typography>
          </Breadcrumbs>
          <Card>
            <CardHeader
              title={'Mortality Reason'}
              sx={{ paddingX: 5 }}
              action={headerAction !== undefined ? headerAction : null}
            />
            <CommonTable
              indexedRows={filteredData.length ? filteredData : data}
              columns={columns || []}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              slots={{ toolbar: QuickSearchToolbar }}
              slotProps={{
                baseButton: {
                  variant: 'outlined'
                },
                toolbar: {
                  value: searchText,
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
            <AddMortalityReasons
              addEventSidebarOpen={openDrawer}
              setOpenDrawer={setOpenDrawer}
              handleSubmitData={handleSubmitData}
              resetForm={resetForm}
              submitLoader={submitLoader}
              editParams={editParams}
            />
          )}
    </>
  )
}

export default MortalityReasonPage
