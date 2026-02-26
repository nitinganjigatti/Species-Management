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
import { getAssesmentList } from 'src/lib/api/hospital/anesthesia'
import Utility from 'src/utility'

function PurposeOfAnaesthesia() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [total, setTotal] = useState([])
  const theme = useTheme()
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [sort, setSort] = useState('asc')
  const [sortColumn, setSortColumn] = useState('name')
  const [exportLoading, setExportLoading] = useState(false)

  // drawer :
  const editParamsInitialState = { id: null, name: null }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const router = useRouter()

  const fetchTableData = useCallback(
    async (sort, q, column) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          limit: paginationModel.pageSize,
          page: paginationModel.page + 1,
          type: 'purpose'
        }

        // Send queryParams directly, not nested in { params: ... }
        const res = await getAssesmentList(params)

        console.log('aaa', res)
        if (res?.success) {
          setRows(res?.data?.records || [])
          setTotal(res?.data?.total || 0)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    },
    [paginationModel]
  )

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

  // const handleExport = async () => {
  //   const params = {
  //     sort,

  //     type: 'purpose',
  //     response_type: 'csv'
  //   }
  //   try {
  //     setExportLoading(true)

  //     const response = await getAssesmentList(params)
  //     if (response?.success && response?.data) {
  //       console.log('aaa', response)
  //       Utility.downloadFileFromURL(response.data)
  //     }
  //   } catch (error) {
  //     console.error(error)
  //   } finally {
  //     setExportLoading(false)
  //   }
  // }

  const handleExport = async ({ q = searchValue }) => {
    const params = { response_type: 'csv', sort: sort, column: sortColumn, q, type: 'purpose' }

    try {
      setExportLoading(true)

      const response = await getAssesmentList(params)
      if (response?.success && response?.data.download_url) {
        Utility.downloadFileFromURL(response.data?.download_url)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setExportLoading(false)
    }
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
      field: 'name',
      headerName: 'NAME',

      // color: theme.palette.customColors.customHeadingTextColor,

      renderCell: params => (
        <Tooltip title={params.row.name}>
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
            {params.row.name}
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
          {/* {params?.row?.zoo_id === '0' ? null : ( */}
          <IconButton
            size='small'
            onClick={e => {
              e.stopPropagation()

              handleEdit()
            }}
          >
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
          {/* )} */}
        </Box>
      )
    }
  ]

  const headerAction = (
    <AddButtonContained
      title='Add Purpose'
      action={() => setOpenDrawer(true)}
      fullWidth='fullWidth'
      styles={{
        margin: 0
      }}
    />
  )

  return (
    <PageCardLayout title=' Purpose Of Anaesthesia' action={headerAction}>
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
      </Grid>
    </PageCardLayout>
  )
}

export default PurposeOfAnaesthesia
