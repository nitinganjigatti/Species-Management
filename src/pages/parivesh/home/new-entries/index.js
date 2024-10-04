import React, { useState, useEffect, useCallback, useContext, useRef } from 'react'

import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import moment from 'moment'
import {
  Avatar,
  Button,
  Tooltip,
  Box,
  Switch,
  Divider,
  CardContent,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material'
import CustomChip from 'src/@core/components/mui/chip'

// ** MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import { LoadingButton } from '@mui/lab'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import Router, { useRouter } from 'next/router'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import DeleteDialogConfirmation from 'src/components/utility/DeleteDialogConfirmation'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import ConfirmationCheckBox from 'src/views/forms/form-elements/confirmationCheckBox'
import { useTheme } from '@mui/material/styles'
import { AuthContext } from 'src/context/AuthContext'
import Toaster from 'src/components/Toaster'
import CustomAccordion from 'src/components/parivesh/CustomAccordion'
import { usePariveshContext } from 'src/context/PariveshContext'
import { addBatches } from 'src/lib/api/parivesh/addBatch'
import { getEntryList } from 'src/lib/api/parivesh/entryList'
import { getOrgCountList } from 'src/lib/api/parivesh/organizationCount'
import { deleteSpeciesToOrganization } from 'src/lib/api/parivesh/addSpecies'
import Image from 'next/image'
import { display } from '@mui/system'
import ImageLightbox from 'src/components/parivesh/ImageLightbox'
import Utility from 'src/utility'
import { Details } from '@mui/icons-material'
import NewEntryDetailsDialog from './new-entry-details/index'
import Error404 from 'src/pages/404'

// import { addBatches, getEntryList, getOrgCountList } from 'src/lib/api/parivesh'

const NewEntry = ({}) => {
  const theme = useTheme()
  const router = useRouter()

  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [check, setCheck] = useState(false)
  const [sortColumn, setSortColumn] = useState('scientific_name')

  const authData = useContext(AuthContext)
  const { selectedParivesh } = usePariveshContext()
  const [selectAll, setSelectAll] = useState(false)
  const [selectedRows, setSelectedRows] = useState([])
  const [btnLoader, setBtnLoader] = useState(false)
  const [organizationCountList, setOrganizationCountList] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [detailData, setDetailData] = useState()
  const [isEditModal, setIsEditModal] = useState(false)

  const pariveshAccess = authData?.userData?.roles?.settings?.enable_parivesh

  function loadServerRows(currentPage, data) {
    return data
  }

  // const handleSelectAll = event => {
  //   event.stopPropagation()
  //   setSelectAll(event.target.checked)
  //   if (event.target.checked) {
  //     setSelectedRows(rows.map(row => row.id))
  //   } else {
  //     setSelectedRows([])
  //   }
  // }

  const updateSelectAllState = paginationModel => {
    const startIndex = paginationModel.page * paginationModel.pageSize
    const endIndex = startIndex + paginationModel.pageSize
    const currentPageRows = rows.slice(startIndex, endIndex)
    const allCurrentPageSelected = currentPageRows.every(row => selectedRows.includes(row.id))
    setSelectAll(allCurrentPageSelected && currentPageRows.length > 0)
  }
  const handleSelectAll = event => {
    event.stopPropagation()
    const isChecked = event.target.checked
    setSelectAll(isChecked)

    const startIndex = paginationModel.page * paginationModel.pageSize
    const endIndex = startIndex + paginationModel.pageSize
    const currentPageRows = rows.slice(startIndex, endIndex)

    if (isChecked) {
      setSelectedRows(prevSelected => [...new Set([...prevSelected, ...currentPageRows.map(row => row.id)])])
    } else {
      setSelectedRows(prevSelected => prevSelected.filter(id => !currentPageRows.some(row => row.id === id)))
    }
  }

  useEffect(() => {
    if (isModalOpen) {
      setIsEditModal(false) // Close the edit modal when the delete modal opens
    }
  }, [isModalOpen])

  const handleCreateBatch = async () => {
    const payload = {
      org_id: selectedParivesh?.id,
      id: selectedRows
    }
    if (selectedRows.length > 0) {
      try {
        setBtnLoader(true)
        await addBatches(payload).then(res => {
          if (res?.success) {
            setBtnLoader(false)
            Toaster({ type: 'success', message: res?.message })
            setSelectedRows([])
            setSelectAll(false)
            router.push(`?tab=batches`, undefined, { shallow: true })
          } else {
            setBtnLoader(false)
            Toaster({ type: 'error', message: res?.message })
          }
        })
      } catch (error) {
        console.log('error', error)
      }
    } else {
      router.push(`?tab=batches`, undefined, { shallow: true })
    }
  }

  // const handleRowSelection = id => {
  //   const selectedIndex = selectedRows.indexOf(id)
  //   let newSelected = []

  //   if (selectedIndex === -1) {
  //     newSelected = [...selectedRows, id]
  //   } else {
  //     newSelected = selectedRows.filter(rowId => rowId !== id)
  //   }
  //   // Update selectedRows state
  //   setSelectedRows(newSelected)
  //   // Update selectAll state
  //   setSelectAll(newSelected.length === rows.length)
  // }

  const handleRowSelection = id => {
    setSelectedRows(prevSelected => {
      const newSelected = prevSelected.includes(id) ? prevSelected.filter(rowId => rowId !== id) : [...prevSelected, id]

      updateSelectAllState(paginationModel)
      return newSelected
    })
  }
  useEffect(() => {
    updateSelectAllState(paginationModel)
  }, [rows, selectedRows, paginationModel])

  const handleChange = (event, newValue) => {
    setTotal(0)
    setValue(newValue)
  }

  const onClose = () => {
    setDialog(false)
  }

  const fetchTableData = useCallback(
    async (sort, q, sortColumn) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          org_id: selectedParivesh?.id,
          sortColumn,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getEntryList({ params: params }).then(res => {
          // Generate uid field based on the index
          let listWithId = res?.data?.data.map((el, i) => {
            return { ...el, uid: i + 1 }
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
    [paginationModel, selectedParivesh]
  )

  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
  }, [fetchTableData])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    console.log(newModel, 'newModel')
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
    } else {
    }
  }

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

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
  }

  const handleEdit = async (event, params) => {
    event.stopPropagation()
    // console.log('params >>', params)

    // Ensure params.id exists and is a string or number
    if (params?.id) {
      Router.push({
        pathname: '/parivesh/home/new-entries/add-newentry',
        query: { id: params.id } // Pass id in the query object
      })
    }
  }

  const handleDelete = async id => {
    setSelectedId(id)
    setIsModalOpen(true)
  }

  const confirmDeleteAction = async () => {
    try {
      const payload = {
        org_id: selectedParivesh?.id
      }
      setIsModalOpen(false)
      const response = await deleteSpeciesToOrganization(selectedId, payload)
      if (response.success === true) {
        Toaster({ type: 'success', message: `Species has been successfully deleted` })
        // Reload the table data
        fetchTableData(sort, searchValue, sortColumn)
      } else {
        Toaster({ type: 'error', message: 'something went wrong' })
      }
    } catch (error) {}
  }

  const columns = [
    {
      flex: 0.2,
      Width: 40,
      field: 'sl_no',
      headerName: 'S.NO',
      sortColumn: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid}
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
          {/* <Box className='relative h-20'>
            <Image src={params.row.species_image} alt={params.row.uid} width={40} height={40} />
          </Box> */}
          <div onClick={event => event.stopPropagation()}>
            <ImageLightbox images={params.row.species_image} />

            {/* <Avatar variant='square' src={params.row.species_image} alt={''} sx={{ height: 'auto', p: 0.5 }} /> */}
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
    // {
    //   flex: 0.4,
    //   minWidth: 10,
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
      flex: 0.4,
      minWidth: 10,
      field: 'gender',
      headerName: 'GENDER / COUNT',
      sortable: false,
      renderCell: params => {
        let gender = params.row.gender ? params.row.gender : '-'

        if (gender !== '-') {
          gender = gender.charAt(0).toUpperCase() + gender.slice(1)
        }

        return (
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {gender !== '-' ? `${gender} : ${params.row.animal_count}` : '-'}
          </Typography>
        )
      }
    },

    // {
    //   flex: 0.3,
    //   minWidth: 30,
    //   field: 'possession_type',
    //   headerName: 'Category',
    //   renderCell: params => (
    //     <Box sx={{ display: 'flex', alignItems: 'center' }}>
    //       <Box sx={{ display: 'flex', flexDirection: 'column' }}>
    //         <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
    //           {params.row.possession_type ? params.row.possession_type : '-'}
    //         </Typography>
    //       </Box>
    //     </Box>
    //   )
    // },
    {
      flex: 0.3,
      minWidth: 30,
      field: 'possession_type',
      headerName: 'Category',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
              {params.row.possession_type
                ? params.row.possession_type.charAt(0).toUpperCase() + params.row.possession_type.slice(1)
                : '-'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'transaction_date',
      headerName: 'DATE',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography noWrap variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.transaction_date
              ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.transaction_date))
              : '-'}
          </Typography>
          <Typography noWrap variant='body2' sx={{ color: '#839D8D', fontSize: '12px' }}>
            {params.row.transaction_date
              ? Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(params.row.transaction_date))
              : '-'}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',
      sortable: false,
      renderCell: params => (
        <>
          <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
            <IconButton size='small' sx={{ mr: 0.5 }} onClick={e => handleEdit(e, params.row)} aria-label='Edit'>
              <Icon icon='mdi:pencil-outline' />
            </IconButton>
            <IconButton size='small' sx={{ mr: 0.5 }} onClick={() => handleDelete(params.row.id)} aria-label='Edit'>
              <Icon icon='mdi:delete-outline' />
            </IconButton>
          </Box>
        </>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'checkbox',
      sortable: false,
      // headerName: (
      //   <Checkbox checked={selectAll} onChange={handleSelectAll} inputProps={{ 'aria-label': 'Select All Rows' }} />
      // ),
      headerName: (
        <Checkbox
          checked={selectAll}
          indeterminate={selectedRows.length > 0 && !selectAll}
          onChange={handleSelectAll}
          inputProps={{ 'aria-label': 'Select All Rows' }}
        />
      ),
      renderCell: params => (
        <Checkbox
          checked={selectedRows.includes(params.row.id)}
          onClick={e => e.stopPropagation()}
          onChange={() => handleRowSelection(params.row.id)}
        />
      )
    }
  ]

  const onCellClick = params => {
    console.log(params, 'params  12345>>>')
    setIsEditModal(true)
    setDetailData(params?.row)
    // Router.push('/parivesh/home/new-entries/add-newentry')
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

  const headerAction = (
    <>
      <Button size='medium' variant='contained' onClick={() => Router.push('/parivesh/home/new-entries/add-newentry')}>
        <Icon icon='mdi:add' fontSize={20} />
        &nbsp; ADD ENTRY
      </Button>

      <LoadingButton
        loading={btnLoader}
        size='medium'
        variant='contained'
        sx={{
          m: 2,
          backgroundColor: '#1F415B',
          color: '#FFFFFF',
          '&:hover': {
            // CSS pseudo-class for hover effect
            backgroundColor: '#0D2B3E' // Darker shade for hover background color
          }
        }}
        onClick={handleCreateBatch}
        disabled={selectedRows.length > 0 ? false : true}
      >
        {'CREATE BATCH'}
      </LoadingButton>
    </>
  )

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <Card sx={{ mt: 4 }}>
            <CardHeader title={'New Entries'} action={headerAction} />
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
              rowCount={total}
              columns={columns}
              sortingMode='server'
              paginationMode='server'
              pageSizeOptions={[7, 10, 25, 50]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              slots={{ toolbar: ServerSideToolbarWithFilter }}
              // onPaginationModelChange={setPaginationModel}
              onPaginationModelChange={newModel => {
                setPaginationModel(newModel)
                updateSelectAllState(newModel)
              }}
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

  const fetchOrgCountData = useCallback(
    async (q, id) => {
      try {
        const params = {
          q,
          id
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
    fetchOrgCountData(selectedParivesh?.id)
  }, [fetchOrgCountData])

  console.log('Details', detailData)
  const capitalizeFirstLetter = str => {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  return (
    <>
      {pariveshAccess ? (
        <>
          {organizationCountList.length > 0 && (
            <Card>
              <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
                {organizationCountList.map((org, inx) => {
                  return (
                    <CustomAccordion
                      title='To be submitted'
                      summaryIcon='mdi:arrow-top-right'
                      data={org?.yetToSubmitAccordionData?.data}
                      cards={org?.yetToSubmitAccordionData?.cards}
                      backgroundImage={org?.cover_image !== '' && org?.cover_image}
                      isOrganization={selectedParivesh.id !== 'all' ? true : false}
                      organizationName={selectedParivesh.id !== 'all' ? selectedParivesh.organization_name : null}
                    />
                  )
                })}
              </CardContent>
            </Card>
          )}

          <Grid>{tableData()}</Grid>

          <NewEntryDetailsDialog isEditModal={isEditModal} setIsEditModal={setIsEditModal} detailData={detailData} />

          <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <DialogTitle>
              <IconButton
                aria-label='close'
                onClick={() => setIsModalOpen(false)}
                sx={{ top: 10, right: 10, position: 'absolute', color: 'grey.500' }}
              >
                <Icon icon='mdi:close' />
              </IconButton>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '32px',

                  // padding: '40px',
                  alignItems: 'center'
                }}
              >
                <Box
                  sx={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: theme.palette.customColors.mdAntzNeutral
                  }}
                >
                  <Icon width='70px' height='70px' color={'#ff3838'} icon={'mdi:delete'} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 24, textAlign: 'center', mb: '12px' }}>
                    Are you sure you want to delete this species?
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
                  <Button
                    disabled={btnLoader}
                    onClick={() => setIsModalOpen(false)}
                    variant='outlined'
                    sx={{
                      color: 'gray',
                      width: '45%'
                    }}
                  >
                    Cancel
                  </Button>

                  <LoadingButton
                    loading={btnLoader}
                    size='large'
                    variant='contained'
                    sx={{ width: '45%' }}
                    onClick={() => confirmDeleteAction()}
                  >
                    Delete
                  </LoadingButton>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent />
          </Dialog>
        </>
      ) : (
        <Error404></Error404>
      )}
    </>
  )
}

export default NewEntry
