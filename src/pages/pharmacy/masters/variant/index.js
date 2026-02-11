import { Box, IconButton, debounce, Grid, Typography } from '@mui/material'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'

import { AddButtonContained } from 'src/components/ButtonContained'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AuthContext } from 'src/context/AuthContext'
import { useTheme } from '@emotion/react'
import AddVariant from 'src/views/pages/pharmacy/medicine/variant/addVariant'
import { addVariant, getVariants, updateVariant } from 'src/lib/api/pharmacy/variant'
import toast from 'react-hot-toast'

import Error404 from 'src/pages/404'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import Utility from 'src/utility'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import { ExportButton } from 'src/views/utility/render-snippets'

const VariantList = () => {
  const theme = useTheme()
  const { selectedPharmacy } = usePharmacyContext()
  const editParamsInitialState = { id: null, unit_multiplier: null, description: null, active: null }

  const [openDrawer, setOpenDrawer] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const authData = useContext(AuthContext)
  const pharmacyRole = authData?.userData?.roles?.settings?.add_pharmacy

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('unit_multiplier')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }

  const addEventSidebarOpen = () => {
    setEditParams({ id: null, unit_multiplier: null, description: null, active: null })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleEdit = async (id, unit_multiplier, description, active) => {
    setEditParams({ id: id, unit_multiplier: unit_multiplier, description: description, active: active })
    setOpenDrawer(true)
  }

  const columns = [
    {
      minWidth: 50,
      field: 'id',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      minWidth: 200,
      field: 'unit_multiplier',
      headerName: 'Unit Multiplier',
      textAlign: 'center',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.unit_multiplier}
        </Typography>
      )
    },
    {
      minWidth: 300,
      field: 'description',
      headerName: 'Description',
      textAlign: 'center',
      renderCell: params => (
        <>
          {params.row?.description ? (
            <TextEllipsisWithModal
              text={params.row.description}
              style={{
                color: theme.palette.customColors.customHeadingTextColor,
                fontSize: '14px',
                fontWeight: 500
              }}
            />
          ) : (
            <Typography
              sx={{
                color: theme.palette.customColors.customHeadingTextColor,
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              NA
            </Typography>
          )}
        </>
      )
    },

    {
      minWidth: 250,
      field: 'active',
      headerName: 'STATUS',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.active === '1' ? 'Active' : 'Inactive'}
        </Typography>
      )
    },
    {
      minWidth: 200,
      field: 'Action',
      headerName: 'Action',
      renderCell: params => (
        <>
          {pharmacyRole && (
            <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
              {parseInt(params.row.zoo_id) === 0 ? null : (
                <IconButton
                  size='small'
                  sx={{ mr: 0.5 }}
                  onClick={() =>
                    handleEdit(params.row.id, params.row.unit_multiplier, params.row.description, params.row.active)
                  }
                  aria-label='Edit'
                >
                  <Icon icon='mdi:pencil-outline' />
                </IconButton>
              )}
            </Box>
          )}
        </>
      )
    }
  ]

  const fetchTableData = useCallback(
    async (sort, q, column) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getVariants({ params: params }).then(res => {
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )
  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
  }, [fetchTableData])

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
    } else {
    }
  }

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
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
  }

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSubmitData = async payload => {
    try {
      setSubmitLoader(true)
      var response

      if (editParams?.id !== null) {
        response = await updateVariant(editParams?.id, payload)
      } else {
        response = await addVariant(payload)
      }

      if (response?.success) {
        toast.success(response?.message)

        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)

        await fetchTableData(sort, searchValue, sortColumn)
      } else {
        setSubmitLoader(false)

        if (typeof response?.message === 'object') {
          Utility.errorMessageExtractorFromObject(response.message)
        } else {
          toast.error(response.message)
        }
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)

      toast.error(JSON.stringify(e))
    }
  }

  const headerAction = (
    <div>
      {pharmacyRole && (
        <Grid item>
          <AddButtonContained
            title='Add Variant'
            styles={{ margin: 0 }}
            action={() => addEventSidebarOpen()}
            fullWidth='fullWidth'
          />
        </Grid>
      )}
    </div>
  )

  const handleExport = async () => {
    const params = {
      q: searchValue,
      sort: sort,
      column: sortColumn,
      response_type: 'csv'
    }
    try {
      setExportLoading(true)
      const response = await getVariants({ params })
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
    <>
      {selectedPharmacy.type === 'central' ? (
        <PageCardLayout title={'Variants'} action={headerAction}>
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
          <Grid>
            <CommonTable
              onRowClick={''}
              indexedRows={indexedRows}
              total={total}
              columns={columns}
              paginationModel={paginationModel}
              handleSortModel={handleSortModel}
              setPaginationModel={setPaginationModel}
              loading={loading}
              searchValue={searchValue}
            />
          </Grid>
        </PageCardLayout>
      ) : (
        <Error404 />
      )}

      <AddVariant
        drawerWidth={400}
        addEventSidebarOpen={openDrawer}
        handleSidebarClose={handleSidebarClose}
        handleSubmitData={handleSubmitData}
        resetForm={resetForm}
        submitLoader={submitLoader}
        editParams={editParams}
      />
    </>
  )
}

export default React.memo(VariantList)
