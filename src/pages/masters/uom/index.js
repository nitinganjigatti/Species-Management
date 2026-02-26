import { Box, Grid, IconButton, Tooltip, Typography, useTheme } from '@mui/material'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { ExportButton } from 'src/views/utility/render-snippets'
import Icon from 'src/@core/components/icon'
import { AddButtonContained } from 'src/components/ButtonContained'

import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import { getMeasurementUnits } from 'src/lib/api/necropsy'
import AddUOMDrawer from 'src/views/pages/masters/AddUOMDrawer'
import toast from 'react-hot-toast'
import { addMeasurementUnits, updateMeasurementUnits } from 'src/lib/api/medical/masters'

function UOM() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [total, setTotal] = useState([])
  const theme = useTheme()
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [sort, setSort] = useState('asc')
  const [sortColumn, setSortColumn] = useState('label')
  const [exportLoading, setExportLoading] = useState(false)

  // drawer :
  const editParamsInitialState = { id: null, name: null }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const router = useRouter()

  // const handleRowClick = params => {
  //   router.push(`/masters/monitor/${params.row.assessment_category_id}`)
  // }

  // const fetchTableData = useCallback(
  //   async (sort, q, column) => {
  //     try {
  //       setLoading(true)

  //       const params = {
  //         sort,
  //         q,
  //         column,
  //         page: paginationModel.page + 1,
  //         limit: paginationModel.pageSize
  //       }
  //       console.log('aaa', params)

  //       // await getMeasurementUnits({ params: params }).then(res => {

  //       const res = await getMeasurementUnits({ params })

  //       if (res?.success && res?.data) {
  //         setTotal(parseInt(res?.data?.length))
  //         setRows(res?.data)
  //       }

  //       setLoading(false)
  //     } catch (e) {
  //       console.log(e)
  //       setLoading(false)
  //     }
  //   },
  //   [paginationModel]
  // )

  const fetchTableData = useCallback(
    async (sort, q, column) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          limit: paginationModel.pageSize,
          page: paginationModel.page + 1
        }

        const res = await getMeasurementUnits(params)

        if (res?.success && res?.data) {
          setRows(res?.data)
          setTotal(res?.data?.length)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    },
    [paginationModel]
  )

  // console.log('aaa', rows)

  useEffect(() => {
    fetchTableData()
  }, [fetchTableData])

  const indexedRows = rows.map((row, index) => ({
    ...row,
    id: row.id,
    sl_no: paginationModel.page * paginationModel.pageSize + index + 1
  }))

  const searchTableData = useCallback(
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, column)
        console.log('aaaaa', q)
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

  const handleEdit = async (id, name, status) => {
    setEditParams({ id: id, name: name, status: status })
    setOpenDrawer(true)
  }

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
      field: 'unit_name',
      headerName: 'UOM NAME',

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
            {params.row.unit_name}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.4,
      minWidth: 150,
      field: 'uom_abbr',
      headerName: 'UOM  ABBR ',

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
            {params.row.uom_abbr}
          </Typography>
        </Tooltip>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 120,
    //   field: 'active',
    //   headerName: 'STATUS',

    //   // color: theme.palette.customColors.customHeadingTextColor,
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         fontSize: '14px',
    //         fontWeight: 500,
    //         overflow: 'hidden',
    //         textOverflow: 'ellipsis',
    //         whiteSpace: 'nowrap',
    //         color: theme.palette.customColors.customHeadingTextColor
    //       }}
    //       variant='body2'
    //     >
    //       {params.row.active === '1' ? 'Active' : 'Inactive'}
    //     </Typography>
    //   )
    // },
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
      title='Add UOM'
      action={() => setOpenDrawer(true)}
      fullWidth='fullWidth'
      styles={{
        margin: 0
      }}
    />
  )

  const handleSubmitData = async payload => {
    console.log('payload', payload)
    try {
      setLoading(true)
      setSubmitLoader(true)

      var response
      if (editParams?.id !== null) {
        response = await updateMeasurementUnits(payload)
      } else {
        response = await addMeasurementUnits(payload)
      }

      if (response?.success) {
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)
        toast.success(response?.message)

        await fetchTableData()
      } else {
        // setSubmitLoader(false)
        // console.log('test')
        // toast.success(response?.message)

        // Check if message is an object (validation errors)
        if (response?.message && typeof response.message === 'object') {
          // Loop through each field and show an error toast
          Object.values(response.message).forEach(msg => {
            toast.error(msg)
          })
        } else {
          // Fallback: if it's a string
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

  return (
    <PageCardLayout title=' UOM (Units Of Measurements)' action={headerAction}>
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
            setPaginationModel={setPaginationModel}
          />
        </Grid>
        <AddUOMDrawer
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
          submitLoader={submitLoader}
        />
      </Grid>
    </PageCardLayout>
  )
}

export default UOM
