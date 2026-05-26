import React, { useState, useEffect, useCallback } from 'react'

import { getProductCategoriesList, addProductCategory, updateProductCategory } from 'src/lib/api/pharmacy/getCategories'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports

import { useTheme } from '@emotion/react'
import { Box, Grid, Tooltip, IconButton, Typography } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

import { debounce } from 'lodash'

import AddProductCategory from 'src/views/pages/pharmacy/medicine/productCategory/addProductCategory'

import toast from 'react-hot-toast'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'

import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import Utility from 'src/utility'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import { ExportButton } from 'src/views/utility/render-snippets'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'

const ListOfProductCategory = () => {
  const theme = useTheme()

  const [loader, setLoader] = useState(false)

  /*** Drawer ****/
  const editParamsInitialState = { id: null, category_name: null, description: null, active: null }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const [exportLoading, setExportLoading] = useState(false)

  const { selectedPharmacy } = usePharmacyContext()

  const authData = useContext(AuthContext)
  const pharmacyRole = authData?.userData?.roles?.settings?.add_pharmacy

  const addEventSidebarOpen = () => {
    setEditParams(editParamsInitialState)
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  const handleEdit = async (id, category_name, description, active) => {
    setEditParams({ id, category_name, description, active })
    setResetForm(false)
    setOpenDrawer(true)
  }

  const columns = [
    {
      minWidth: 100,
      field: 'id',
      headerName: 'SL.NO',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      flex: 1,
      minWidth: 220,
      field: 'category_name',
      headerName: 'CATEGORY NAME',
      renderCell: params => (
        <Tooltip title={params.row.category_name}>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {params.row.category_name}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 1,
      minWidth: 250,
      field: 'description',
      headerName: 'DESCRIPTION',
      sortable: false,
      renderCell: params => (
        <Tooltip title={params.row.description || ''}>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {params.row.description || '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.2,
      minWidth: 130,
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
          {params.row.active === '1' || params.row.active === 1 ? 'Active' : 'Inactive'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 200,
      field: 'created_by',
      headerName: 'CREATED BY',
      sortable: false,
      renderCell: params => (
        <UserAvatarDetails
          profile_image={params?.row?.user_created_profile_pic}
          user_name={params?.row?.created_by}
          date={params?.row?.created_at}
        />
      )
    },
    {
      flex: 0.2,
      minWidth: 200,
      field: 'updated_by',
      headerName: 'UPDATED BY',
      sortable: false,
      renderCell: params => (
        <UserAvatarDetails
          profile_image={params?.row?.user_updated_profile_pic}
          user_name={params?.row?.updated_by}
          date={params?.row?.updated_at}
        />
      )
    },
    {
      flex: 0.2,
      minWidth: 100,
      field: 'Action',
      headerName: 'ACTION',
      sortable: false,
      renderCell: params => (
        <>
          {pharmacyRole && (
            <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
              {parseInt(params.row.zoo_id) === 0 ? null : (
                <IconButton
                  size='small'
                  sx={{ mr: 0.5 }}
                  onClick={() =>
                    handleEdit(params.row.id, params.row.category_name, params.row.description, params.row.active)
                  }
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

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('category_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [loading, setLoading] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }

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

        await getProductCategoriesList({ params }).then(res => {
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
        })
        setLoading(false)
      } catch {
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
  }, [fetchTableData, selectedPharmacy?.id])

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

  const headerAction = (
    <div>
      {pharmacyRole && (
        <Grid item>
          <AddButtonContained
            title='Add Product Category'
            action={() => addEventSidebarOpen()}
            fullWidth='fullWidth'
            styles={{
              margin: 0
            }}
          />
        </Grid>
      )}
    </div>
  )

  const handleSubmitData = async payload => {
    try {
      setSubmitLoader(true)
      var response
      if (editParams?.id !== null) {
        response = await updateProductCategory(editParams?.id, payload)
      } else {
        response = await addProductCategory(payload)
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

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleExport = async () => {
    const params = {
      q: searchValue,
      sort: sort,
      column: sortColumn,
      response_type: 'csv'
    }

    try {
      setExportLoading(true)
      const response = await getProductCategoriesList({ params })
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
      {pharmacyRole ? (
        <>
          {loader ? (
            <FallbackSpinner />
          ) : (
            <>
              <PageCardLayout title='Product Category' action={headerAction}>
                <Grid container>
                  <Grid item container sx={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <Grid size={{ xs: 'grow', sm: 3.5, md: 3.5, lg: 3, xl: 2.5 }}>
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
                    </Grid>
                    <Grid>
                      <ExportButton onClick={handleExport} loading={loading || exportLoading} disabled={total === 0} />
                    </Grid>
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
              <AddProductCategory
                drawerWidth={400}
                addEventSidebarOpen={openDrawer}
                handleSidebarClose={handleSidebarClose}
                handleSubmitData={handleSubmitData}
                resetForm={resetForm}
                submitLoader={submitLoader}
                editParams={editParams}
              />
            </>
          )}
        </>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default ListOfProductCategory
