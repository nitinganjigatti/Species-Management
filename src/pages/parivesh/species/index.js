import React, { useCallback, useContext, useEffect, useState } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import TabList from '@mui/lab/TabList'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { Avatar, Button, Tooltip, Typography, debounce } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { AuthContext } from 'src/context/AuthContext'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import ConfirmationCheckBox from 'src/views/forms/form-elements/confirmationCheckBox'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import { useTheme } from '@mui/material/styles'
import AddSpecies from 'src/views/pages/parivesh/addSpecies/addSpecies'
import Router from 'next/router'
import { addSpecies, getSpeciesListByOrg } from 'src/lib/api/parivesh/addSpecies'
import toast from 'react-hot-toast'
import { usePariveshContext } from 'src/context/PariveshContext'
import ImageLightbox from 'src/components/parivesh/ImageLightbox'
import Error404 from 'src/pages/404'
// import { addSpecies, getSpeciesListByOrg } from 'src/lib/api/parivesh'

const SpeciesList = () => {
  const theme = useTheme()
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('overview')
  const [loader, setLoader] = useState(false)
  const [sortBy, setSortBy] = useState('DESC')
  const [sortColumn, setSortColumn] = useState('scientific_name')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
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
  const { selectedParivesh } = usePariveshContext()
  const pariveshAccess = authData?.userData?.roles?.settings?.enable_parivesh

  const onClose = () => {
    setDialog(false)
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    setStatus(newValue)
  }

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  // const columns = [
  //   {
  //     flex: 0.2,
  //     Width: 40,
  //     field: 'sl_no',
  //     headerName: 'S.NO',
  //     renderCell: params => (
  //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
  //         {params.row.uid}
  //       </Typography>
  //     )
  //   },

  //   {
  //     flex: 0.2,
  //     minWidth: 30,
  //     field: 'species_image',
  //     headerName: 'IMAGE',
  //     renderCell: params => (
  //       <>
  //         <Avatar variant='square' src={params.row.species_image} alt={params.row.uid} />
  //         {/* <Tooltip title={params.row.species_image} placement='right'>
  //           <Typography
  //             variant='body2'
  //             sx={{ ml: 2, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis' }}
  //           >
  //             {params.row.species_image}
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
            {params.row.id}
          </Typography>
        )
      },
      {
        flex: 0.3,
        minWidth: 30,
        field: 'species_image',
        headerName: 'IMAGE',
        sortable: false,
        renderCell: params => (
          <>
            <div onClick={event => event.stopPropagation()}>
              <ImageLightbox images={params.row.species_image} />
              {/* <Avatar variant='square' src={params.row.species_image} alt={''} sx={{ height: 'auto' }} /> */}
            </div>
          </>
        )
      },
      // {
      //   flex: 0.5,
      //   minWidth: 30,
      //   field: 'common_name',
      //   headerName: 'COMMON NAME',
      //   renderCell: params => (
      //     <Box sx={{ display: 'flex', alignItems: 'center' }}>
      //       <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      //         <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
      //           {params.row.common_name ? params.row.common_name : '-'}
      //         </Typography>
      //       </Box>
      //     </Box>
      //   )
      // },
      // {
      //   flex: 0.5,
      //   minWidth: 30,
      //   field: 'scientific_name',
      //   headerName: 'SCIENTIFIC NAME',
      //   renderCell: params => (
      //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
      //       {params.row.scientific_name ? params.row.scientific_name : '-'}
      //     </Typography>
      //   )
      // }
      {
        flex: 0.5,
        minWidth: 30,
        field: 'common_name',
        headerName: 'COMMON NAME',
        sortable: false,
        renderCell: params => (
          <Tooltip title={params.row.common_name || '-'}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: '500' }}>
              {params.row.common_name ? params.row.common_name : '-'}
            </Typography>
          </Tooltip>
        )
      },
      {
        flex: 0.4,
        minWidth: 30,
        field: 'scientific_name',
        headerName: 'SCIENTIFIC NAME',
        sortable: false,
        renderCell: params => (
          <Tooltip title={params.row.scientific_name || '-'}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary' }}>
              {params.row.scientific_name ? params.row.scientific_name : '-'}
            </Typography>
          </Tooltip>
        )
      }
    ]

    // Extract unique organization names
    const organizationNames = [...new Set(rows.flatMap(row => row.organizations.map(org => org.organization_name)))]

    // Create columns for each organization
    const organizationColumns = organizationNames.map((orgName, index) => ({
      flex: 0.4,
      minWidth: 30,
      field: `org_${index}`,
      headerName: orgName,
      sortable: false,
      renderCell: params => {
        const org = params.row.organizations.find(org => org.organization_name === orgName)
        const isSelected = selectedParivesh && org && org.org_id === selectedParivesh.id
        return (
          // <Typography variant='body2' sx={{ color: isSelected ? '#37BD69' : 'text.primary' }}>
          //   {org ? org.animal_count : '-'}
          // </Typography>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {org ? org.animal_count : '-'}
          </Typography>
        )
      }
    }))

    // Combine base columns with organization columns
    return [...baseColumns, ...organizationColumns]
  }

  // const getColumns = rows => {
  //   // Create base columns
  //   const baseColumns = [
  //     {
  //       flex: 0.2,
  //       Width: 40,
  //       field: 'sl_no',
  //       headerName: 'S.NO',
  //       renderCell: params => (
  //         <Typography variant='body2' sx={{ color: 'text.primary' }}>
  //           {params.row.id}
  //         </Typography>
  //       )
  //     },
  //     {
  //       flex: 0.3,
  //       minWidth: 30,
  //       field: 'species_image',
  //       headerName: 'IMAGE',
  //       sortable: false,
  //       renderCell: params => (
  //         <>
  //           <Avatar variant='square' src={params.row.species_image} alt={params.row.uid} sx={{ height: 'auto' }} />
  //         </>
  //       )
  //     },
  //     {
  //       flex: 0.4,
  //       minWidth: 30,
  //       field: 'common_name',
  //       headerName: 'COMMON NAME',
  //       sortable: false,
  //       renderCell: params => (
  //         <Tooltip title={params.row.common_name || '-'}>
  //           <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
  //             {params.row.common_name ? params.row.common_name : '-'}
  //           </Typography>
  //         </Tooltip>
  //       )
  //     },
  //     {
  //       flex: 0.4,
  //       minWidth: 30,
  //       field: 'scientific_name',
  //       headerName: 'SCIENTIFIC NAME',
  //       sortable: false,
  //       renderCell: params => (
  //         <Tooltip title={params.row.scientific_name || '-'}>
  //           <Typography noWrap variant='body2' sx={{ color: 'text.primary' }}>
  //             {params.row.scientific_name ? params.row.scientific_name : '-'}
  //           </Typography>
  //         </Tooltip>
  //       )
  //     }
  //   ]

  //   // Create column for the selected organization
  //   const organizationColumns = rows.some(row => row.organizations.some(org => org.org_id === selectedParivesh.id))
  //     ? [
  //         {
  //           flex: 0.4,
  //           minWidth: 30,
  //           field: `org_selected`,
  //           headerName: selectedParivesh.organization_name, // Assuming `selectedParivesh` contains `organization_name`
  //           sortable: false,
  //           renderCell: params => {
  //             const org = params.row.organizations.find(org => org.org_id === selectedParivesh.id)
  //             const isSelected = org && org.org_id === selectedParivesh.id
  //             return (
  //               <Typography variant='body2' sx={{ color: isSelected ? '#37BD69' : 'text.primary' }}>
  //                 {org ? org.animal_count : '-'}
  //               </Typography>
  //             )
  //           }
  //         }
  //       ]
  //     : []

  //   // Combine base columns with organization columns
  //   return [...baseColumns, ...organizationColumns]
  // }

  const onCellClick = params => {
    console.log(params, 'params')
    const clickedColumn = params.field !== 'switch'
    if (clickedColumn) {
      const data = params?.row?.tsn_id
      Router.push({
        pathname: `/parivesh/species/${data}/species-details`,
        query: {
          tsn_relation: params?.row?.tsn_relation, // Assuming tsn_relation holds the value you need
          tsn_id: params?.row?.tsn_id
        }
      })
    } else {
      return
    }
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
    async (sortBy, q, sortColumn, status) => {
      try {
        setLoading(true)

        const params = {
          q,
          page: paginationModel.page + 1,
          sortBy,
          sortColumn,

          limit: paginationModel.pageSize
        }

        await getSpeciesListByOrg({ params: params }).then(res => {
          // console.log('responsewwww', res)
          // Generate uid field based on the index
          let listWithId = res.data.species_data.map((el, i) => {
            return { ...el, id: i + 1 }
          })
          console.log(listWithId, 'id')
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, listWithId))
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel, selectedParivesh]
  )

  useEffect(() => {
    fetchTableData(sortBy, searchValue, sortColumn, status)
  }, [fetchTableData, status])

  const handleSubmitData = async payload => {
    // console.log(payload, 'payload')
    try {
      setSubmitLoader(true)
      // var response
      // if (editParams?.id !== null) {
      //   response = await updateSpecies(editParams?.id, payload)
      // } else {
      //  let  response = await addSpecies(payload)
      // }
      const response = await addSpecies(payload)
      if (response?.success) {
        toast.success(response?.message)
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)
        await fetchTableData(sortBy, searchValue, sortColumn)
      } else {
        setSubmitLoader(false)

        if (typeof response?.message === 'object') {
          toast.error(response.message?.cover_image || response.message?.species_image)
          // Utility.errorMessageExtractorFromObject(response.message?.cover_image)
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

  const searchTableData = useCallback(
    debounce(async (sortBy, q, sortColumn, status) => {
      setSearchValue(q)
      try {
        await fetchTableData(sortBy, q, sortColumn, status)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )
  const handleSortModel = newModel => {
    if (newModel.length) {
      setSortBy(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
    } else {
    }
  }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sortBy, value, sortColumn, status)
  }

  const headerAction = (
    <>
      <div>
        <Button size='medium' variant='contained' onClick={() => addEventSidebarOpen()}>
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; ADD new species
        </Button>
      </div>
    </>
  )

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <Card sx={{ mt: 4 }}>
            <CardHeader title={'Species List'} action={headerAction} />
            <ConfirmationDialog
              // icon={'mdi:delete'}
              image={'https://app.antzsystems.com/uploads/6515471031963.jpg'}
              iconColor={'#ff3838'}
              title={'Are you sure you want to delete this ingredient?'}
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
              disableColumnMenu
              disableColumnFilter
              // disableColumnSorting
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
              rowCount={total}
              columns={getColumns(indexedRows)}
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

  return (
    <>
      {pariveshAccess ? (
        <>
          <Grid>
            <TabContext value={status}>
              <TabList onChange={handleChange} aria-label='simple tabs example'>
                <Tab
                  value='overview'
                  label={<TabBadge label='overview' totalCount={status === 'overview' ? total : null} />}
                />
              </TabList>

              <TabPanel value='overview'>
                <Grid>{tableData()}</Grid>
              </TabPanel>
            </TabContext>
          </Grid>
          <AddSpecies
            drawerWidth={400}
            addEventSidebarOpen={openDrawer}
            handleSidebarClose={handleSidebarClose}
            handleSubmitData={handleSubmitData}
            resetForm={resetForm}
            submitLoader={submitLoader}
            editParams={editParams}
          />
        </>
      ) : (
        <Error404></Error404>
      )}
    </>
  )
}

export default SpeciesList
