import { Breadcrumbs, Card, CardContent, Grid, Typography, Avatar, Button, Tooltip, debounce } from '@mui/material'
import { Box } from '@mui/system'
import Router from 'next/router'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import CustomAccordion from 'src/components/parivesh/CustomAccordion'
import AddSpeciesNewEntry from 'src/views/pages/parivesh/addSpeciesEntry/addSpeciesEntry'
import Icon from 'src/@core/components/icon'
import { AuthContext } from 'src/context/AuthContext'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import ConfirmationCheckBox from 'src/views/forms/form-elements/confirmationCheckBox'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import moment from 'moment'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { getSpeciesListByOrg } from 'src/lib/api/parivesh/addSpecies'
import toast from 'react-hot-toast'
// import { getSpeciesListByOrg } from 'src/lib/api/parivesh'

const SpeciesDetails = () => {
  const theme = useTheme()
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('overview')
  const [loader, setLoader] = useState(false)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('scientific_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)

  const [dialog, setDialog] = useState(false)
  const [check, setCheck] = useState(false)
  const editParamsInitialState = { id: null, name: null, active: null }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const authData = useContext(AuthContext)

  const router = useRouter()
  const { id, tsn, tsn_relation } = router.query

  console.log(tsn_relation, id, tsn, router, 'router')

  const onClose = () => {
    setDialog(false)
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    setStatus(newValue)
  }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  // const columns = [
  //   {
  //     flex: 0.2,
  //     Width: 40,
  //     field: 'id',
  //     headerName: 'S.NO',
  //     renderCell: params => (
  //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
  //         {params.row.id}
  //       </Typography>
  //     )
  //   },

  //   {
  //     flex: 0.2,
  //     minWidth: 30,
  //     field: 'image_type',
  //     headerName: 'IMAGE',
  //     renderCell: params => (
  //       <>
  //         {console.log(params, 'asd')}
  //         <Avatar variant='square' src={params.row.species_image} alt={params.row.id} />
  //         {/* <Tooltip title={params.row.image_type} placement='right'>
  //           <Typography
  //             variant='body2'
  //             sx={{ ml: 2, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis' }}
  //           >
  //             {' '}
  //             {params.row.image_type}
  //           </Typography>
  //         </Tooltip> */}
  //       </>
  //     )
  //   },
  //   {
  //     flex: 0.3,
  //     minWidth: 30,
  //     field: 'common_name',
  //     headerName: 'COMMON NAME',
  //     renderCell: params => (
  //       <Box sx={{ display: 'flex', alignItems: 'center' }}>
  //         <Box sx={{ display: 'flex', flexDirection: 'column' }}>
  //           <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
  //             {params.row.common_name ? params.row.common_name : '-'}
  //           </Typography>
  //         </Box>
  //       </Box>
  //     )
  //   },
  //   {
  //     flex: 0.4,
  //     minWidth: 10,
  //     field: 'scientific_name',
  //     headerName: 'SCIENTIFIC NAME',
  //     renderCell: params => (
  //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
  //         {params.row.scientific_name ? params.row.scientific_name : '-'}
  //       </Typography>
  //     )
  //   },
  //   {
  //     flex: 0.4,
  //     minWidth: 10,
  //     field: 'rkt',
  //     headerName: 'RKT',
  //     renderCell: params => (
  //       <Typography variant='body2' sx={{ color: '#37BD69' }}>
  //         {params.row.rkt ? params.row.rkt : '-'}
  //       </Typography>
  //     )
  //   },
  //   {
  //     flex: 0.4,
  //     minWidth: 10,
  //     field: 'kmt',
  //     headerName: 'KMT',
  //     renderCell: params => (
  //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
  //         {params.row.kmt ? params.row.kmt : '-'}
  //       </Typography>
  //     )
  //   },
  //   {
  //     flex: 0.4,
  //     minWidth: 10,
  //     field: 'rktwt',
  //     headerName: 'RKTWT',
  //     renderCell: params => (
  //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
  //         {params.row.rktwt ? params.row.rktwt : '-'}
  //       </Typography>
  //     )
  //   }
  // ]

  const getColumns = rows => {
    // Create base columns
    const baseColumns = [
      {
        flex: 0.2,
        Width: 40,
        field: 'sl_no',
        headerName: 'S.NO',
        renderCell: params => (
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.uid}
          </Typography>
        )
      },
      {
        flex: 0.2,
        minWidth: 30,
        field: 'species_image',
        headerName: 'IMAGE',
        renderCell: params => (
          <>
            <Avatar variant='square' src={params.row.species_image} alt={params.row.uid} />
          </>
        )
      },
      {
        flex: 0.3,
        minWidth: 30,
        field: 'common_name',
        headerName: 'COMMON NAME',
        renderCell: params => (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
                {params.row.common_name ? params.row.common_name : '-'}
              </Typography>
            </Box>
          </Box>
        )
      },
      {
        flex: 0.4,
        minWidth: 10,
        field: 'scientific_name',
        headerName: 'SCIENTIFIC NAME',
        renderCell: params => (
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.scientific_name ? params.row.scientific_name : '-'}
          </Typography>
        )
      }
    ]

    // Extract unique organization names
    const organizationNames = [...new Set(rows.flatMap(row => row.organizations.map(org => org.organization_name)))]

    // Create columns for each organization
    const organizationColumns = organizationNames.map((orgName, index) => ({
      flex: 0.4,
      minWidth: 10,
      field: `org_${index}`,
      headerName: orgName,
      renderCell: params => {
        const org = params.row.organizations.find(org => org.organization_name === orgName)
        return (
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {org ? org.animal_count : '-'}
          </Typography>
        )
      }
    }))

    // Combine base columns with organization columns
    return [...baseColumns, ...organizationColumns]
  }

  const onCellClick = params => {
    // Router.push(`/parivesh/species/${params?.id}/species-details`)
    // console.log(params, 'params')
    // const clickedColumn = params.field !== 'switch'
    // if (clickedColumn) {
    //   const data = params.row
    //   Router.push({
    //     pathname: `/diet/ingredient/${data?.id}`
    //   })
    // } else {
    //   return
    // }
  }
  const addEventSidebarOpen = () => {
    setEditParams({ id: null, name: null, active: null })
    setResetForm(true)
    setOpenDrawer(true)
  }
  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async (sort, q, sortColumn, status) => {
      try {
        setLoading(true)

        const params = {
          q,
          page: paginationModel.page + 1,
          sortBy: sort,
          sortColumn,
          limit: paginationModel.pageSize
        }

        await getSpeciesListByOrg({ params: params }).then(res => {
          // console.log('response', res)
          // Generate uid field based on the index
          let listWithId = res.data.species_data.map((el, i) => {
            return { ...el, id: i + 1 }
          })
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, listWithId))
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
    fetchTableData(sort, searchValue, sortColumn, status)
  }, [fetchTableData, status])

  const handleSubmitData = async payload => {
    console.log(payload)
    // try {
    //   setSubmitLoader(true)
    //   var response
    //   if (editParams?.id !== null) {
    //     response = await updateDrug(editParams?.id, payload)
    //   } else {
    //     response = await addDrug(payload)
    //   }
    //   if (response?.success) {
    //     toast.success(response?.message)
    //     setSubmitLoader(false)
    //     setResetForm(true)
    //     setOpenDrawer(false)
    //     await fetchTableData(sort, searchValue, sortColumn)
    //   } else {
    //     setSubmitLoader(false)
    //     if (typeof response?.message === 'object') {
    //       Utility.errorMessageExtractorFromObject(response.message)
    //     } else {
    //       toast.error(response.message)
    //     }
    //   }
    // } catch (e) {
    //   console.log(e)
    //   setSubmitLoader(false)
    //   toast.error(JSON.stringify(e))
    // }
  }

  const headerAction = (
    <>
      <div>
        <Button size='medium' variant='contained' onClick={() => addEventSidebarOpen()} sx={{ background: '#1F515B' }}>
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; new Entry
        </Button>
      </div>
    </>
  )

  const searchTableData = useCallback(
    debounce(async (sort, q, sortColumn, status) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, sortColumn, status)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
    } else {
    }
  }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn, status)
  }

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <Card sx={{ mt: 4 }}>
            <CardHeader title={`Entry's`} action={headerAction} />
            <ConfirmationDialog
              // icon={'mdi:delete'}
              image={'https://app.antzsystems.com/uploads/6515471031963.jpg'}
              iconColor={'#ff3838'}
              title={'Are you sure you want to delete this species?'}
              // description={`Since ingredient IND000123 isn't included in any recipe or diet, you can delete it.`}
              formComponent={
                <ConfirmationCheckBox
                  title={'This ingredient is part of 15 recipes and 10 diets.'}
                  label={'Deactivate this ingredient in all records'}
                  description={
                    'Deactivating this ingredient prevents its addition to new recipes or diets, but you can swap it with another ingredient.'
                  }
                  color={theme.palette.formContent?.tertiary}
                  value={check}
                  setValue={setCheck}
                />
              }
              dialogBoxStatus={dialog}
              onClose={onClose}
              ConfirmationText={'Delete'}
              confirmAction={onClose}
            />
            <DataGrid
              sx={{
                '.MuiDataGrid-cell:focus': {
                  outline: 'none'
                },

                '& .MuiDataGrid-row:hover': {
                  cursor: 'pointer'
                }
              }}
              columnVisibilityModel={{
                sl_no: false
              }}
              hideFooterSelectedRowCount
              disableColumnSelector={true}
              autoHeight
              pagination
              rows={indexedRows === undefined ? [] : indexedRows}
              columns={getColumns(indexedRows)}
              rowCount={total}
              sortingMode='server'
              paginationMode='server'
              pageSizeOptions={[7, 10, 25, 50]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              slots={{ toolbar: ServerSideToolbarWithFilter }}
              onPaginationModelChange={setPaginationModel}
              loading={loading}
              slotProps={{
                baseButton: {
                  variant: 'outlined'
                },
                toolbar: {
                  value: searchValue,
                  clearSearch: () => handleSearch(''),
                  onChange: event => handleSearch(event.target.value)
                }
              }}
              onCellClick={onCellClick}
            />
          </Card>
        )}
      </>
    )
  }

  const data = [
    { value: 200, label: 'TOTAL ANIMALS', color: '#FFFFFF', borderColor: '#FFFFFF' },
    { value: 103, label: 'MALE', color: '#00AFD6', borderColor: '#00AFD6' },
    { value: 74, label: 'FEMALE', color: '#FFD3D3', borderColor: '#FFD3D3' },
    { value: 23, label: 'OTHERS', color: '#FFFFFF', borderColor: '#FFFFFF' },
    { value: 156, label: 'TOTAL SPECIES', color: '#E4B819', borderColor: '#E4B819' }
  ]

  const cards = [
    {
      value: 60,
      content: 'Parent Stock',
      bgColor: '#37BD69',
      items: [
        { value: 6, bgColor: '#00AFD6' },
        { value: 5, bgColor: '#FFD3D3' },
        { value: 10, bgColor: '#FFFFFF' }
      ]
    },
    {
      value: 25,
      content: 'Acquisition',
      bgColor: '#37BD69',
      items: [
        { value: 11, bgColor: '#00AFD6' },
        { value: 7, bgColor: '#FFD3D3' },
        { value: 6, bgColor: '#FFFFFF' }
      ]
    },
    {
      value: 5,
      content: 'Births',
      bgColor: '#37BD69',
      items: [
        { value: 21, bgColor: '#00AFD6' },
        { value: 2, bgColor: '#FFD3D3' },
        { value: 7, bgColor: '#FFFFFF' }
      ]
    },
    {
      value: 5,
      content: 'Deaths',
      bgColor: '#E93353',
      items: [
        { value: 2, bgColor: '#00AFD6' },
        { value: 6, bgColor: '#FFD3D3' },
        { value: 6, bgColor: '#FFFFFF' }
      ]
    },
    {
      value: 5,
      content: 'Transfers',
      bgColor: '#FA6140',
      items: [
        { value: 6, bgColor: '#00AFD6' },
        { value: 11, bgColor: '#FFD3D3' },
        { value: 3, bgColor: '#FFFFFF' }
      ]
    }
  ]
  return (
    <>
      <Box sx={{ mb: 6 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => Router.push('/parivesh/species')}>
            Species
          </Typography>
          <Typography color='text.primary'>Lear’s Macaw</Typography>
        </Breadcrumbs>
      </Box>
      <Box>
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
            <CustomAccordion
              title='Approved by Parivesh'
              summaryIcon='ion:checkmark'
              data={data}
              backgroundImage='https://images.pexels.com/photos/1599452/pexels-photo-1599452.jpeg'
              cards={cards}
              isRKT={true}
              valueRKT={'RKT'}
            />
            <Box
              sx={{
                mt: 3
              }}
            >
              <CustomAccordion
                title='To be submitted'
                summaryIcon='ion:checkmark'
                data={data}
                backgroundImage='https://images.pexels.com/photos/1599452/pexels-photo-1599452.jpeg'
                cards={cards}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Grid>{tableData()}</Grid>

      <AddSpeciesNewEntry
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

export default SpeciesDetails
