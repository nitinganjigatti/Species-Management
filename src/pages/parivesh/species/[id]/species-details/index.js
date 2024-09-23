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
import {
  addSpeciesToOrganization,
  getSpeciesListByOrg,
  updateSpeciesToOrganization
} from 'src/lib/api/parivesh/addSpecies'
import toast from 'react-hot-toast'
import { getEntryList } from 'src/lib/api/parivesh/entryList'
import { usePariveshContext } from 'src/context/PariveshContext'
import { getOrgCountList } from 'src/lib/api/parivesh/organizationCount'
import ImageLightbox from 'src/components/parivesh/ImageLightbox'
import Utility from 'src/utility'
import Error404 from 'src/pages/404'
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
  const [organizationCountList, setOrganizationCountList] = useState([])
  const [speciesDetails, setSpeciesDetails] = useState({})

  const { selectedParivesh } = usePariveshContext()

  const authData = useContext(AuthContext)
  const pariveshAccess = authData?.userData?.roles?.settings?.enable_parivesh

  const router = useRouter()
  const { id, tsn_id, tsn_relation } = router.query

  // console.log(tsn_relation, id, tsn, router, 'router')

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

  const columns = [
    {
      flex: 0.2,
      minWidth: 30,
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
      field: 'image_type',
      headerName: 'IMAGE',
      sortable: false,
      renderCell: params => (
        <>
          <div onClick={event => event.stopPropagation()}>
            <ImageLightbox images={params.row.species_image} />
            {/* <Avatar variant='square' src={params.row.species_image} alt={''} sx={{ height: 'auto', padding: '2px' }} /> */}
          </div>

          {/* <Tooltip title={params.row.image_type} placement='right'>
            <Typography
              variant='body2'
              sx={{ ml: 2, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {' '}
              {params.row.image_type}
            </Typography>
          </Tooltip> */}
        </>
      )
    },
    // {
    //   flex: 0.3,
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
    //   flex: 0.3,
    //   minWidth: 10,
    //   field: 'scientific_name',
    //   headerName: 'SCIENTIFIC NAME',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.scientific_name ? params.row.scientific_name : '-'}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.4,
      minWidth: 30,
      field: 'common_name',
      headerName: 'COMMON NAME',
      sortable: false,
      renderCell: params => (
        <Tooltip title={params.row.common_name || '-'}>
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
            {params.row.common_name ? params.row.common_name : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.4,
      minWidth: 10,
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
    },
    {
      flex: 0.4,
      minWidth: 10,
      field: 'gender_count',
      headerName: 'Gender / Count',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.gender
            ? params.row.gender.charAt(0).toUpperCase() + params.row.gender.slice(1) + ' : ' + params.row.animal_count
            : '-'}
        </Typography>
      )
    },
    // {
    //   flex: 0.3,
    //   minWidth: 30,
    //   field: 'gender',
    //   headerName: 'GENDER / COUNT',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.gender ? params.row.gender + ' : ' + params.row.animal_count : '-'}
    //     </Typography>
    //   )
    // },
    // {
    //   flex: 0.3,
    //   minWidth: 30,
    //   field: 'age',
    //   headerName: 'Age',
    //   renderCell: params => (
    //     <Box sx={{ display: 'flex', alignItems: 'center' }}>
    //       <Box sx={{ display: 'flex', flexDirection: 'column' }}>
    //         <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
    //           {params.row.age ? params.row.age : '-'}
    //         </Typography>
    //       </Box>
    //     </Box>
    //   )
    // },

    {
      flex: 0.3,
      minWidth: 30,
      field: 'transaction_date',
      headerName: 'DATE',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.transaction_date
              ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.transaction_date))
              : '-'}
          </Typography>
          <Typography variant='body2' sx={{ color: '#839D8D', fontSize: '12px' }}>
            {params.row.transaction_date
              ? Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(params.row.transaction_date))
              : '-'}
          </Typography>
        </Box>
        // <Typography variant='body2' sx={{ color: 'text.primary' }}>
        //   {params.row.transaction_date ? moment.utc(params.row.transaction_date).format('DD MMMM YYYY') : '-'}
        // </Typography>
      )
    }
  ]

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
    setEditParams({ id: null, name: null, active: null })
    setResetForm(true)
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
          tsn_id: tsn_id,
          tsn_relation: tsn_relation,
          page: paginationModel.page + 1,
          sortBy: sort,
          sortColumn,
          org_id: selectedParivesh?.id,
          limit: paginationModel.pageSize
        }

        await getEntryList({ params: params }).then(res => {
          // console.log('list response', res)
          setSpeciesDetails({ scientific_name: res.data.scientific_name, common_name: res.data.common_name })
          // Generate uid field based on the index
          let listWithId = res.data.data.map((el, i) => {
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

  const fetchOrgCountData = useCallback(
    async id => {
      try {
        const params = {
          org_id: id,
          tsn_relation: tsn_relation,
          tsn_id: tsn_id
        }

        await getOrgCountList({ params: params }).then(res => {
          const filteredData = res.data.filter(org => org.org_id === selectedParivesh?.id)

          const transformedData = filteredData.map(org => ({
            organization_name: org.organization_name,
            org_id: org.org_id,
            species_image: org?.species_image,
            cover_image: org?.cover_image,
            approvedAccordionData: {
              title: 'Approved by Parivesh',
              data: [
                {
                  value: org.approved_count_data.total_animal,
                  label: 'ANIMAL RECORDS ',
                  color: '#FFFFFF',
                  borderColor: '#FFFFFF'
                },
                {
                  value: org.approved_count_data.net_animal,
                  label: 'NET ANIMALS ',
                  color: '#FFFFFF',
                  borderColor: '#FFFFFF'
                },
                { value: org.approved_count_data.male_count, label: 'MALE', color: '#00AFD6', borderColor: '#00AFD6' },
                {
                  value: org.approved_count_data.female_count,
                  label: 'FEMALE',
                  color: '#FFD3D3',
                  borderColor: '#FFD3D3'
                },
                {
                  value: org.approved_count_data.other_count,
                  label: 'OTHERS',
                  color: '#FFFFFF',
                  borderColor: '#FFFFFF'
                },
                {
                  value: org.approved_count_data.species_count,
                  label: 'TOTAL SPECIES',
                  color: '#E4B819',
                  borderColor: '#E4B819'
                }
              ],
              cards: [
                {
                  value: org.approved_count_data.possession_counts.births.total,
                  content: 'Births',
                  bgColor: '#37BD69',
                  items: [
                    { value: org.approved_count_data.possession_counts.births.male, bgColor: '#00AFD6' },
                    { value: org.approved_count_data.possession_counts.births.female, bgColor: '#FFD3D3' },
                    { value: org.approved_count_data.possession_counts.births.other, bgColor: '#FFFFFF' }
                  ]
                },
                {
                  value: org.approved_count_data.possession_counts.deaths.total,
                  content: 'Deaths',
                  bgColor: '#E93353',
                  items: [
                    { value: org.approved_count_data.possession_counts.deaths.male, bgColor: '#00AFD6' },
                    { value: org.approved_count_data.possession_counts.deaths.female, bgColor: '#FFD3D3' },
                    { value: org.approved_count_data.possession_counts.deaths.other, bgColor: '#FFFFFF' }
                  ]
                },
                {
                  value: org.approved_count_data.possession_counts.acquisitions.total,
                  content: 'Acquisition',
                  bgColor: '#37BD69',
                  items: [
                    { value: org.approved_count_data.possession_counts.acquisitions.male, bgColor: '#00AFD6' },
                    { value: org.approved_count_data.possession_counts.acquisitions.female, bgColor: '#FFD3D3' },
                    { value: org.approved_count_data.possession_counts.acquisitions.other, bgColor: '#FFFFFF' }
                  ]
                },
                {
                  value: org.approved_count_data.possession_counts.transfers.total,
                  content: 'Transfers',
                  bgColor: '#FA6140',
                  items: [
                    { value: org.approved_count_data.possession_counts.transfers.male, bgColor: '#00AFD6' },
                    {
                      value: org.approved_count_data.possession_counts.transfers.female,
                      bgColor: '#FFD3D3'
                    },
                    { value: org.approved_count_data.possession_counts.transfers.other, bgColor: '#FFFFFF' }
                  ]
                }
              ]
            },
            yetToSubmitAccordionData: {
              title: 'To be submitted',
              data: [
                {
                  value: org.yet_to_submitted_count.total_animal,
                  label: 'ANIMAL RECORDS ',
                  color: '#FFFFFF',
                  borderColor: '#FFFFFF'
                },
                {
                  value: org.yet_to_submitted_count.net_animal,
                  label: 'NET ANIMALS ',
                  color: '#FFFFFF',
                  borderColor: '#FFFFFF'
                },
                {
                  value: org.yet_to_submitted_count.male_count,
                  label: 'MALE',
                  color: '#00AFD6',
                  borderColor: '#00AFD6'
                },
                {
                  value: org.yet_to_submitted_count.female_count,
                  label: 'FEMALE',
                  color: '#FFD3D3',
                  borderColor: '#FFD3D3'
                },
                {
                  value: org.yet_to_submitted_count.other_count,
                  label: 'OTHERS',
                  color: '#FFFFFF',
                  borderColor: '#FFFFFF'
                },
                {
                  value: org.yet_to_submitted_count.species_count,
                  label: 'TOTAL SPECIES',
                  color: '#E4B819',
                  borderColor: '#E4B819'
                }
              ],
              cards: [
                {
                  value: org.yet_to_submitted_count.possession_counts.births.total,
                  content: 'Births',
                  bgColor: '#37BD69',
                  items: [
                    { value: org.yet_to_submitted_count.possession_counts.births.male, bgColor: '#00AFD6' },
                    { value: org.yet_to_submitted_count.possession_counts.births.female, bgColor: '#FFD3D3' },
                    { value: org.yet_to_submitted_count.possession_counts.births.other, bgColor: '#FFFFFF' }
                  ]
                },
                {
                  value: org.yet_to_submitted_count.possession_counts.deaths.total,
                  content: 'Deaths',
                  bgColor: '#E93353',
                  items: [
                    { value: org.yet_to_submitted_count.possession_counts.deaths.male, bgColor: '#00AFD6' },
                    { value: org.yet_to_submitted_count.possession_counts.deaths.female, bgColor: '#FFD3D3' },
                    { value: org.yet_to_submitted_count.possession_counts.deaths.other, bgColor: '#FFFFFF' }
                  ]
                },
                {
                  value: org.yet_to_submitted_count.possession_counts.acquisitions.total,
                  content: 'Acquisition',
                  bgColor: '#37BD69',
                  items: [
                    { value: org.yet_to_submitted_count.possession_counts.acquisitions.male, bgColor: '#00AFD6' },
                    { value: org.yet_to_submitted_count.possession_counts.acquisitions.female, bgColor: '#FFD3D3' },
                    { value: org.yet_to_submitted_count.possession_counts.acquisitions.other, bgColor: '#FFFFFF' }
                  ]
                },
                {
                  value: org.yet_to_submitted_count.possession_counts.transfers.total,
                  content: 'Transfers',
                  bgColor: '#FA6140',
                  items: [
                    { value: org.yet_to_submitted_count.possession_counts.transfers.male, bgColor: '#00AFD6' },
                    {
                      value: org.yet_to_submitted_count.possession_counts.transfers.female,
                      bgColor: '#FFD3D3'
                    },
                    { value: org.yet_to_submitted_count.possession_counts.transfers.other, bgColor: '#FFFFFF' }
                  ]
                }
              ]
            },
            submittedAccordionData: {
              title: 'Submitted Data',
              data: [
                {
                  value: org.submitted_count_data.total_animal,
                  label: 'ANIMAL RECORDS ',
                  color: '#FFFFFF',
                  borderColor: '#FFFFFF'
                },
                {
                  value: org.submitted_count_data.net_animal,
                  label: 'NET ANIMALS ',
                  color: '#FFFFFF',
                  borderColor: '#FFFFFF'
                },
                {
                  value: org.submitted_count_data.male_count,
                  label: 'MALE',
                  color: '#00AFD6',
                  borderColor: '#00AFD6'
                },
                {
                  value: org.submitted_count_data.female_count,
                  label: 'FEMALE',
                  color: '#FFD3D3',
                  borderColor: '#FFD3D3'
                },
                {
                  value: org.submitted_count_data.other_count,
                  label: 'OTHERS',
                  color: '#FFFFFF',
                  borderColor: '#FFFFFF'
                },
                {
                  value: org.submitted_count_data.species_count,
                  label: 'TOTAL SPECIES',
                  color: '#E4B819',
                  borderColor: '#E4B819'
                }
              ],
              cards: [
                {
                  value: org.submitted_count_data.possession_counts.births.total,
                  content: 'Births',
                  bgColor: '#37BD69',
                  items: [
                    { value: org.submitted_count_data.possession_counts.births.male, bgColor: '#00AFD6' },
                    { value: org.submitted_count_data.possession_counts.births.female, bgColor: '#FFD3D3' },
                    { value: org.submitted_count_data.possession_counts.births.other, bgColor: '#FFFFFF' }
                  ]
                },
                {
                  value: org.submitted_count_data.possession_counts.deaths.total,
                  content: 'Deaths',
                  bgColor: '#E93353',
                  items: [
                    { value: org.submitted_count_data.possession_counts.deaths.male, bgColor: '#00AFD6' },
                    { value: org.submitted_count_data.possession_counts.deaths.female, bgColor: '#FFD3D3' },
                    { value: org.submitted_count_data.possession_counts.deaths.other, bgColor: '#FFFFFF' }
                  ]
                },
                {
                  value: org.submitted_count_data.possession_counts.acquisitions.total,
                  content: 'Acquisition',
                  bgColor: '#37BD69',
                  items: [
                    { value: org.submitted_count_data.possession_counts.acquisitions.male, bgColor: '#00AFD6' },
                    { value: org.submitted_count_data.possession_counts.acquisitions.female, bgColor: '#FFD3D3' },
                    { value: org.submitted_count_data.possession_counts.acquisitions.other, bgColor: '#FFFFFF' }
                  ]
                },
                {
                  value: org.submitted_count_data.possession_counts.transfers.total,
                  content: 'Transfers',
                  bgColor: '#FA6140',
                  items: [
                    { value: org.submitted_count_data.possession_counts.transfers.male, bgColor: '#00AFD6' },
                    {
                      value: org.submitted_count_data.possession_counts.transfers.female,
                      bgColor: '#FFD3D3'
                    },
                    { value: org.submitted_count_data.possession_counts.transfers.other, bgColor: '#FFFFFF' }
                  ]
                }
              ]
            }
          }))

          setOrganizationCountList(transformedData)
        })
      } catch (e) {
        console.log(e)
      }
    },
    [selectedParivesh?.id]
  )

  useEffect(() => {
    fetchOrgCountData(selectedParivesh?.id, tsn_id, tsn_relation)
  }, [fetchOrgCountData])

  const handleSubmitData = async data => {
    const payload = {
      ...data,
      tsn_id: tsn_id,
      tsn_relation: tsn_relation
    }

    try {
      setSubmitLoader(true)
      let response
      if (editParams?.id !== null) {
        response = await updateSpeciesToOrganization(editParams?.id, payload)
      } else {
        response = await addSpeciesToOrganization(payload)
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
    <>
      <div>
        <Button
          size='medium'
          variant='contained'
          onClick={() => addEventSidebarOpen()}
          sx={{
            background: '#1F515B',
            color: '#FFFFFF',
            '&:hover': {
              // CSS pseudo-class for hover effect
              backgroundColor: '#0D2B3E' // Darker shade for hover background color
            }
          }}
        >
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; New Entries
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
            <CardHeader title={`Entries`} action={headerAction} />
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
              columns={columns}
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

  return (
    <>
      {pariveshAccess ? (
        <>
          <Box sx={{ mb: 6 }}>
            <Breadcrumbs aria-label='breadcrumb'>
              <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => Router.push('/parivesh/species')}>
                Species
              </Typography>
              <Typography color='text.primary'>{speciesDetails?.common_name}</Typography>
            </Breadcrumbs>
          </Box>
          <Box>
            <Card>
              {organizationCountList.length > 0 &&
                organizationCountList.map((org, inx) => {
                  console.log(org, 'ppppp')
                  return (
                    <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
                      <CustomAccordion
                        title='Approved by Parivesh'
                        summaryIcon='ion:checkmark'
                        data={org?.approvedAccordionData?.data}
                        cards={org?.approvedAccordionData?.cards}
                        backgroundImage={org?.cover_image}
                        isOrganization
                        organizationName={org.organization_name}
                      />
                      <Box
                        sx={{
                          mt: 3
                        }}
                      >
                        <CustomAccordion
                          title='To be submitted'
                          summaryIcon='mdi:arrow-top-right'
                          data={org?.yetToSubmitAccordionData?.data}
                          cards={org?.yetToSubmitAccordionData?.cards}
                          backgroundImage={org?.cover_image}
                        />
                      </Box>
                      <Box
                        sx={{
                          mt: 3
                        }}
                      >
                        <CustomAccordion
                          title='Submitted'
                          summaryIcon='mdi:checkbox-marked'
                          data={org?.submittedAccordionData?.data}
                          cards={org?.submittedAccordionData?.cards}
                          backgroundImage={org?.cover_image}
                        />
                      </Box>
                    </CardContent>
                  )
                })}
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
            speciesDetails={speciesDetails}
          />
        </>
      ) : (
        <Error404></Error404>
      )}
    </>
  )
}

export default SpeciesDetails
