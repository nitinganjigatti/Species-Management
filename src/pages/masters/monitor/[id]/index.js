import { Box, Grid, IconButton, Tooltip, Typography, useTheme } from '@mui/material'
import { debounce } from 'lodash'
import Router, { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'
import { AddButtonContained } from 'src/components/ButtonContained'
import { getAssessmentResponseType, getAssessmentTypesList } from 'src/lib/api/report'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import Icon from 'src/@core/components/icon'
import { ExportButton } from 'src/views/utility/render-snippets'
import Utility from 'src/utility'
import toast from 'react-hot-toast'
import { addAssessmentMasters, updateAssessmentMasters } from 'src/lib/api/medical/masters'
import AddMonitorDrawer from 'src/views/pages/masters/AddMonitorDrawer'

function AddMonitorCategory() {
  const router = useRouter()
  const { id, label } = router.query
  const theme = useTheme()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [total, setTotal] = useState([])
  const [exportLoading, setExportLoading] = useState(false)

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [sort, setSort] = useState('asc')
  const [sortColumn, setSortColumn] = useState('assessments_type_label')

  const editParamsInitialState = {
    assessment_type_id: '',
    assessment_name: '',
    status: '1',
    description: '',
    response_type: null,
    assessment_category_id: id
  }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [responseTypeOption, setResponseTypeOption] = useState([])
  const [measurementTypeOptions, setMeasurementTypeOption] = useState([])

  const handleSubmitData = async payload => {
    try {
      setLoading(true)
      setSubmitLoader(true)
      setSearchValue('')

      var response

      console.log('edit', editParams)
      console.log('pay', payload)
      if (payload.assessment_type_id) {
        response = await updateAssessmentMasters(payload)
      } else {
        response = await addAssessmentMasters(payload)
      }

      if (response?.success) {
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)
        toast.success(response?.message)

        await fetchTableData()
      } else {
        if (response?.message && typeof response.message === 'object') {
          Object.values(response.message).forEach(msg => {
            toast.error(msg)
          })
        } else {
          toast.error(response?.message || 'Something went wrong')
        }
        setSubmitLoader(false)
        setLoading(false)
      }
      setLoading(false)
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
    } finally {
      setSubmitLoader(false)
      setLoading(false)
    }
  }

  const handleEdit = async (
    assessment_type_id,
    assessment_name,
    active,
    description,
    responseType,
    assessment_category_id,
    measurement_type,
    default_values
  ) => {
    const matchedResponseType = responseTypeOption?.find(option => option.key === responseType)

    setEditParams({
      assessment_type_id,
      assessment_name,
      active,
      description,
      assessment_category_id,
      measurement_type,
      list_values: default_values,
      response_type: matchedResponseType ? { label: matchedResponseType.label, key: matchedResponseType.key } : null
    })

    setOpenDrawer(true)
    setResetForm(false)
  }

  const getResponseType = async () => {
    try {
      const response = await getAssessmentResponseType({})
      console.log('config', response)

      if (response.data?.response_type) {
        {
          const options = response.data.response_type.map(item => ({
            label: item.label,
            key: item.key
          }))

          setResponseTypeOption(options)
          setMeasurementTypeOption()
        }
      }
      {
        if (response.data?.measurement_types) {
          {
            const options = response.data.measurement_types.map(item => ({
              label: item.label,
              key: item.key
            }))

            setMeasurementTypeOption(options)
          }
        }
      }
    } catch (error) {
      console.log('Error fetching response types:', error)
    }
  }

  useEffect(() => {
    getResponseType()
  }, [])

  const fetchTableData = useCallback(
    async (sortValue, qValue, columnValue) => {
      try {
        setLoading(true)

        const params = {
          cat_id: id,
          sort: sortValue,
          q: qValue,
          column: columnValue,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          status: 'all'
        }

        const res = await getAssessmentTypesList(params)

        if (res?.success) {
          setRows(res?.data?.result || [])
          setTotal(parseInt(res?.data?.total_count || 0))
        }

        setLoading(false)
      } catch (error) {
        setLoading(false)
      }
    },
    [id, paginationModel]
  )

  useEffect(() => {
    if (id) {
      fetchTableData(sort, searchValue, sortColumn)
    }
  }, [fetchTableData, id])

  const searchTableData = useCallback(
    debounce(async (sortValue, qValue, columnValue, paginationModel) => {
      setSearchValue(qValue)

      try {
        await fetchTableData(sortValue, qValue, columnValue, paginationModel)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  useEffect(() => {})

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn, paginationModel)
  }

  const indexedRows = rows.map((row, index) => ({
    ...row,
    id: row.assessment_type_id,
    sl_no: paginationModel.page * paginationModel.pageSize + index + 1
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      const newSort = newModel[0].sort
      const newColumn = newModel[0].field
      setSort(newSort)
      setSortColumn(newColumn)
      fetchTableData(newSort, searchValue, newColumn, 0)
    }
  }

  const columns = [
    {
      width: 120,
      field: 'sl_no',
      headerName: 'SL.NO',

      renderCell: params => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.customHeadingTextColor, pl: '10px' }}>
          {params.row.sl_no}.
        </Typography>
      )
    },
    {
      width: 350,
      field: 'assessments_type_label',
      headerName: 'NAME',

      renderCell: params => (
        <Tooltip title={params.row.assessments_type_label}>
          <Typography
            variant='body2'
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: theme.palette.customColors.customHeadingTextColor,
              pl: '6px'
            }}
          >
            {params.row.assessments_type_label}
          </Typography>
        </Tooltip>
      )
    },

    {
      minWidth: 140,
      field: 'active',
      headerName: 'STATUS',

      renderCell: params => (
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: theme.palette.customColors.customHeadingTextColor,
            pl: '6px'
          }}
          variant='body2'
        >
          {params.row.active === '1' ? 'Active' : 'Inactive'}
        </Typography>
      )
    },
    {
      width: 150,
      field: 'action',
      headerName: 'Action',
      color: theme.palette.customColors.customHeadingTextColor,
      renderCell: params => (
        <Box key={params.index}>
          {params?.row?.already_in_use !== true && (
            <IconButton
              size='small'
              sx={{ pl: '16px' }}
              onClick={e => {
                e.stopPropagation()

                handleEdit(
                  params.row.assessment_type_id,
                  params.row.assessments_type_label,
                  params.row.active,
                  params.row.description,
                  params.row.response_type,
                  params.row.assessment_category_id,
                  params.row.measurement_type,
                  params.row.default_values
                )
              }}
            >
              <Icon icon='mdi:pencil-outline' />
            </IconButton>
          )}
        </Box>
      )
    }
  ]

  const headerAction = (
    <AddButtonContained
      title='Add Monitoring'
      action={() => (setOpenDrawer(true), setEditParams(''), setResetForm(true))}
      fullWidth='fullWidth'
      styles={{
        margin: 0
      }}
    />
  )

  const handleExport = async () => {
    const params = {
      q: searchValue,
      sort: sort,
      column: sortColumn,
      response_type: 'csv',
      cat_id: id,
      status: 'all'
    }
    try {
      setExportLoading(true)
      const response = await getAssessmentTypesList(params)
      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response?.data)
        setExportLoading(false)
      }
    } catch (error) {
      setExportLoading(false)
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <PageCardLayout title={label || 'Monitor'} action={headerAction} showIcon={true} onIconClick={() => Router.back()}>
      <Grid container>
        <Grid container sx={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <Grid item size={{ xs: 'grow', sm: 3.5, md: 3.5, lg: 3, xl: 2.5 }}>
            <MUISearch
              sx={{
                width: {
                  xs: '100%',
                  sm: '250px'
                }
              }}
              placeholder='Search...'
              onChange={e => handleSearch(e.target.value)}
              onClear={() => handleSearch('')}
              value={searchValue}
            />
          </Grid>
          <Grid item>
            <ExportButton onClick={handleExport} loading={loading || exportLoading} disabled={total === 0} />
          </Grid>
        </Grid>
        <Grid item size={{ xs: 12 }}>
          <CommonTable
            indexedRows={indexedRows}
            total={total}
            columns={columns}
            loading={loading}
            searchValue={searchValue}
            paginationModel={paginationModel}
            handleSortModel={handleSortModel}
            setPaginationModel={setPaginationModel}
          />
        </Grid>
        <AddMonitorDrawer
          drawerWidth={400}
          addEventSidebarOpen={openDrawer}
          responseTypeOption={responseTypeOption}
          handleSidebarClose={() => {
            setOpenDrawer(false)
            setResetForm(true)
          }}
          editParams={editParams}
          resetForm={resetForm}
          handleSubmitData={handleSubmitData}
          category={{
            assessment_category_id: id,
            label: label
          }}
          measurementTypeOptions={measurementTypeOptions}
        />
      </Grid>
    </PageCardLayout>
  )
}

export default AddMonitorCategory
