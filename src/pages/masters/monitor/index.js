import { Box, Grid, IconButton, Tooltip, Typography, useTheme } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import { AddButtonContained } from 'src/components/ButtonContained'
import {
  getAssessmentCategoriesList,
  getAssessmentTypesList,
  AddAssessmentCategory,
  updateAssessmentCategory
} from 'src/lib/api/report'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import Icon from 'src/@core/components/icon'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import AddMonitor from 'src/views/pages/masters/addmonitor'
import { ExportButton } from 'src/views/utility/render-snippets'
import Utility from 'src/utility'

function AddMonitorCategory() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [total, setTotal] = useState([])
  const theme = useTheme()
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [sort, setSort] = useState('asc')
  const [sortColumn, setSortColumn] = useState('label')
  const [exportLoading, setExportLoading] = useState(false)

  const router = useRouter()

  // drawer :
  const editParamsInitialState = { id: null, name: null }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const handleSubmitData = async payload => {
    // console.log('payload', payload)
    try {
      setSubmitLoader(true)
      var response
      if (editParams?.id !== null) {
        // response = await updateAssessmentCategory(editParams?.id, payload)
      } else {
        response = await AddAssessmentCategory(payload)
        console.log('payload', payload)

        // console.log('payload', payload)
      }

      if (response?.success) {
        // setAlertDefaults({ status: true, message: response?.data, severity: 'success' })

        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)

        // console.log('payload', payload)

        await getAssessmentCategoriesList()
      } else {
        setSubmitLoader(false)
        console.log('payload', payload)

        // setAlertDefaults({ status: true, message: response?.message, severity: 'error' })
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)

      // setAlertDefaults({ status: true, message: 'Error', severity: 'error' })
    }
  }

  const handleEdit = async (id, name, status) => {
    setEditParams({ id: id, name: name, status: status })
    setOpenDrawer(true)
  }

  const handleRowClick = params => {
    router.push(`/masters/monitor/${params.row.assessment_category_id}`)
  }

  const fetchTableData = useCallback(
    async (sortValue = sort, qValue = searchValue, columnValue = sortColumn, pageValue = paginationModel.page) => {
      try {
        setLoading(true)

        // Plain query params
        const params = {
          cat_id: router.query.id,
          sort: sortValue,
          q: qValue,
          column: columnValue,
          page: pageValue + 1,
          limit: paginationModel.pageSiz,
          ref_type: 'animal'
        }

        // Send queryParams directly, not nested in { params: ... }
        const res = await getAssessmentCategoriesList(params)

        if (res?.success) {
          setRows(res?.data || [])
          setTotal(res?.data?.length || 0)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    },
    [router.query.id, paginationModel.page, paginationModel.pageSize, sort, searchValue, sortColumn]
  )

  useEffect(() => {
    fetchTableData()
  }, [fetchTableData])

  const searchTableData = useCallback(
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, column)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    searchTableData(value)
  }

  const indexedRows = rows.map((row, index) => ({
    ...row,
    id: row.assessment_category_id,
    sl_no: paginationModel.page * paginationModel.pageSize + index + 1
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      const newSort = newModel[0].sort
      const newColumn = newModel[0].field

      setSort(newSort)
      setSortColumn(newColumn)
      setPaginationModel(prev => ({ ...prev, page: 0 })) // reset page
      fetchTableData(newSort, searchValue, newColumn, 0)
    }
  }

  // console.log('aaa', indexedRows)
  console.log('aaa', rows)

  // const handleEdit = () => alert('Edit Feature will implement later ')

  const columns = [
    {
      flex: 0.2,
      minWidth: 80,
      field: 'sl_no',
      headerName: 'SL.NO',

      renderCell: params => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.customHeadingTextColor }}>
          {params.row.sl_no}.
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 150,
      field: 'label',
      headerName: 'NAME',

      // color: theme.palette.customColors.customHeadingTextColor,

      renderCell: params => (
        <Tooltip title={params.row.label}>
          <Typography
            variant='body2'
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: theme.palette.customColors.customHeadingTextColor
            }}
          >
            {params.row.label}
          </Typography>
        </Tooltip>
      )
    },

    {
      flex: 0.2,
      minWidth: 120,
      field: 'active',
      headerName: 'STATUS',

      // color: theme.palette.customColors.customHeadingTextColor,
      renderCell: params => (
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: theme.palette.customColors.customHeadingTextColor
          }}
          variant='body2'
        >
          {params.row.active === '1' ? 'Active' : 'Inactive'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 80,
      field: 'action',
      headerName: 'Action',
      color: theme.palette.customColors.customHeadingTextColor,
      renderCell: params => (
        <Box key={params.index}>
          {params?.row?.zoo_id === '0' ? null : (
            <IconButton
              size='small'
              onClick={e => {
                e.stopPropagation()

                handleEdit()
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
      title='Add Category'
      action={() => setOpenDrawer(true)}
      fullWidth='fullWidth'
      styles={{
        margin: 0
      }}
    />
  )

  const handleExport = async (
    sortValue = sort,
    qValue = searchValue,
    columnValue = sortColumn,
    pageValue = paginationModel.page
  ) => {
    // const params = {
    //   cat_id: router.query.id,
    //   sort: sortValue,
    //   q: qValue,
    //   column: columnValue,
    //   page: pageValue + 1,
    //   limit: paginationModel.pageSize

    //   // response_type: 'csv'
    // }
    // try {
    //   setExportLoading(true)
    //   const response = await getAssessmentCategoriesList({ params })
    //   if (response?.success && response?.data) {
    //     Utility.downloadFileFromURL(response?.data)
    //     setExportLoading(false)
    //   }
    // } catch (error) {
    //   setExportLoading(false)
    // } finally {
    //   setExportLoading(false)
    // }

    alert('export will implement waiting for API ')
  }

  return (
    <PageCardLayout title='Monitoring' action={headerAction}>
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
        {/* <Grid item size={{ xs: 'grow', sm: 3.5, md: 3.5, lg: 3, xl: 2.5 }}>
          <MUISearch
            sx={{
              width: {
                xs: '100%',
                sm: '250px'
              }
            }}
            placeholder='Search...'
            value={searchValue}
            onChange={e => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
          />
        </Grid> */}

        <Grid item size={{ xs: 12 }}>
          <CommonTable
            indexedRows={indexedRows}
            total={total}
            columns={columns}
            loading={loading}
            searchValue={searchValue}
            paginationModel={paginationModel}
            handleSortModel={handleSortModel}
            onRowClick={handleRowClick}
            setPaginationModel={setPaginationModel}
          />
        </Grid>
        <AddMonitor
          drawerWidth={400}
          addEventSidebarOpen={openDrawer}
          handleSidebarClose={() => {
            console.log('close event clicked')
            setOpenDrawer(false)
            setResetForm(true)
          }}
          editParams={editParams}
          resetForm={resetForm}
          handleSubmitData={handleSubmitData}

          // submitLoader={false}
          // submitLoader={submitLoader}
          // editParams={editParams}
        />
      </Grid>
    </PageCardLayout>
  )
}

export default AddMonitorCategory
