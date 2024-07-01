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
  const [editParams, setEditParams] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [detailData, setDetailData] = useState()
  const [isEditModal, setIsEditModal] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleSelectAll = event => {
    event.stopPropagation()
    setSelectAll(event.target.checked)
    if (event.target.checked) {
      setSelectedRows(rows.map(row => row.id))
    } else {
      setSelectedRows([])
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

  const handleRowSelection = id => {
    const selectedIndex = selectedRows.indexOf(id)
    let newSelected = []

    if (selectedIndex === -1) {
      newSelected = [...selectedRows, id]
    } else {
      newSelected = selectedRows.filter(rowId => rowId !== id)
    }
    // Update selectedRows state
    setSelectedRows(newSelected)
    // Update selectAll state
    setSelectAll(newSelected.length === rows.length)
  }

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
          org_id: selectedParivesh?.id !== 'all' ? selectedParivesh?.id : null,
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
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
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
    console.log('params >>', params)
    setEditParams(params)

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
      setIsModalOpen(false)
      const response = await deleteSpeciesToOrganization(selectedId)
      if (response.success === true) {
        Toaster({ type: 'success', message: `Species ${selectedId} has been successfully deleted` })
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
      field: 'uid',
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
          {/* <Box className='relative h-20'>
            <Image src={params.row.species_image} alt={params.row.uid} width={40} height={40} />
          </Box> */}

          <Avatar variant='square' src={params.row.species_image} alt={params.row.uid} sx={{ height: 'auto' }} />

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
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.transaction_date ? moment(params.row.transaction_date).format('DD/MM/YYYY') : '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',
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
      headerName: (
        <Checkbox checked={selectAll} onChange={handleSelectAll} inputProps={{ 'aria-label': 'Select All Rows' }} />
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
      <div>
        <Button
          size='medium'
          variant='contained'
          onClick={() => Router.push('/parivesh/home/new-entries/add-newentry')}
        >
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
    { value: 200, label: 'ANIMAL RECORDS ', color: '#FFFFFF', borderColor: '#FFFFFF' },
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
                  value: org.approved_count_data.net_animal ? org.approved_count_data.net_animal : 0,
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
                  value: org.approved_count_data.net_animal ? org.approved_count_data.net_animal : 0,
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
                  value: org.approved_count_data.net_animal ? org.approved_count_data.net_animal : 0,
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

  // console.log(organizationCountList, 'organizationCountList')

  return (
    <>
      {selectedParivesh?.id !== 'all' && organizationCountList.length > 0 && (
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
            {organizationCountList.map((org, inx) => {
              return (
                <CustomAccordion
                  title='To be submitted'
                  summaryIcon='mdi:arrow-top-right'
                  data={org?.yetToSubmitAccordionData?.data}
                  cards={org?.yetToSubmitAccordionData?.cards}
                  backgroundImage={org?.species_image !== '' && orgData?.species_image}
                  isOrganization={selectedParivesh.id !== 'all' ? true : false}
                  organizationName={selectedParivesh.id !== 'all' ? selectedParivesh.organization_name : null}
                />
              )
            })}
          </CardContent>
        </Card>
      )}

      <Grid>{tableData()}</Grid>

      <Dialog open={isEditModal} onClose={() => setIsEditModal(false)} fullWidth maxWidth='sm'>
        <DialogTitle>
          <IconButton
            aria-label='close'
            onClick={() => setIsEditModal(false)}
            sx={{ top: 10, right: 0, position: 'absolute', color: 'grey.500' }}
          >
            <Icon icon='mdi:close' />
          </IconButton>
          <Grid sx={{ display: 'flex', mt: 3 }}>
            <Grid>
              <Avatar variant='square' />
            </Grid>
            <Grid>
              <Typography sx={{ ml: 2, mt: 2 }}>Created By: {''}</Typography>
            </Grid>
          </Grid>
          <Box
            sx={{
              display: 'flex',
              height: '80px',
              mr: 10,
              mt: 2
            }}
          >
            <Box
              sx={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: theme.palette.customColors.mdAntzNeutral,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {/* <Icon width='60px' height='40px' color={'#ff3838'} icon={'mdi:delete'} /> */}

              <Avatar src={detailData?.species_image} alt={detailData?.id} variant='square' sx={{ height: 'auto' }} />
            </Box>
            <Box>
              <Typography variant='h6' sx={{ ml: 4, mt: 2, color: '#00afd6' }}>
                {detailData?.scientific_name}
              </Typography>
              <Typography variant='h6' sx={{ ml: 4 }}>
                ({detailData?.common_name})
              </Typography>
            </Box>
            {/* <div style='border-bottom: 1px solid black;'></div> */}
          </Box>
          <Box sx={{ borderBottom: '1px solid #839D8D', opacity: '30%', mt: 5 }}></Box>
          <Grid sx={{ display: 'flex', mt: 2 }}>
            <Grid sx={{ mt: 2 }}>
              {' '}
              <Typography variant='h6'>Gender</Typography>
            </Grid>
            <Grid sx={{ mt: 2 }}>
              {' '}
              <Typography variant='h6' sx={{ ml: 58 }}>
                {detailData?.gender.charAt(0).toUpperCase() + detailData?.gender.slice(1)}
              </Typography>
            </Grid>
          </Grid>
          <Grid sx={{ display: 'flex' }}>
            <Grid sx={{ mt: 2 }}>
              {' '}
              <Typography variant='h6'>Age</Typography>
            </Grid>
            <Grid sx={{ mt: 2 }}>
              {' '}
              <Typography variant='h6' sx={{ ml: 66 }}>
                {detailData?.age.charAt(0).toUpperCase() + detailData?.age.slice(1)}
              </Typography>
            </Grid>
          </Grid>
          <Grid sx={{ display: 'flex' }}>
            <Grid sx={{ mt: 2 }}>
              {' '}
              <Typography variant='h6'>Reason for Entry</Typography>
            </Grid>
            <Grid sx={{ mt: 2 }}>
              {' '}
              <Typography variant='h6' sx={{ ml: 36 }}>
                {detailData?.possession_type.charAt(0).toUpperCase() + detailData?.possession_type.slice(1)}
              </Typography>
            </Grid>
          </Grid>
          <Grid sx={{ display: 'flex', mt: 2 }}>
            <Grid sx={{ mt: 2 }}>
              {' '}
              <Typography variant='h6'>Total Count</Typography>
            </Grid>
            <Grid sx={{ mt: 2 }}>
              {' '}
              <Typography variant='h6' sx={{ ml: 50 }}>
                {detailData?.animal_count}
              </Typography>
            </Grid>
          </Grid>
          <Grid sx={{ display: 'flex', mt: 2 }}>
            <Grid sx={{ mt: 2 }}>
              {' '}
              <Typography variant='h6'>Entry Date</Typography>
            </Grid>
            <Grid sx={{ mt: 2 }}>
              {' '}
              <Typography variant='h6' sx={{ ml: 50 }}>
                {detailData?.transaction_date
                  ? moment(detailData?.transaction_date.split(' ')[0]).format('DD/MM/YYYY')
                  : ''}
              </Typography>
            </Grid>
          </Grid>
        </DialogTitle>
      </Dialog>

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
  )
}

export default NewEntry
