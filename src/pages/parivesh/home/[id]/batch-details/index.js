import {
  Avatar,
  Button,
  Card,
  CardHeader,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText,
  TextField
} from '@mui/material'
import { Box } from '@mui/system'
import React, { useState } from 'react'
import { styled } from '@mui/system'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import IconButton from '@mui/material/IconButton'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import ConfirmationCheckBox from 'src/views/forms/form-elements/confirmationCheckBox'
import { useTheme } from '@mui/material/styles'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { DataGrid } from '@mui/x-data-grid'
import moment from 'moment'
import Icon from 'src/@core/components/icon'
import Router, { useRouter } from 'next/router'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { Controller, useForm } from 'react-hook-form'

const CustomDropdownIcon = styled(ArrowDropDownIcon)({
  color: '#FFFFFF' // Change this to your desired color
})

const batchData = {
  requestId: '1',
  batchId: '123',
  organization: 'RKT',
  dateSubmitted: '22/04/2024',
  batchCreated: '22/04/2024',
  registrationId: '1223',
  submittedBy: 'sr',
  rows: [
    {
      uid: '01',
      id: '1',
      common_name: 'Cheetah',
      scientific_name: 'Speckled pigeon',
      gender_count: {
        gender: 'Male',
        count: 3
      },
      age: 'Juvenile',
      category: 'Birth',
      created_at: '2024-06-03 16:07:17',
      date: '2024-06-06 16:07:17',
      created_by_user: {
        user_name: 'sr',
        email: 'sr@mailinator.com',
        profile_pic: 'https://api.dev.antzsystems.com/uploads/11/diet/ingredients/665d9cdd975011717411037.jpg'
      }
    }
  ]
}

const dropdownOptions = [
  { value: 1, label: 'Yet to Submitted' },
  { value: 2, label: 'Submitted' }
]

const BatchDetails = ({ params, searchParams }) => {
  const router = useRouter()
  const { id } = router.query
  console.log(id, router, 'fff')
  const theme = useTheme()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm()
  const [searchValue, setSearchValue] = useState('')
  const [total, setTotal] = useState(0)
  const [loader, setLoader] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [check, setCheck] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState(batchData.rows)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleStatusChange = event => {
    const value = event.target.value
    setSelectedStatus(value)
    setIsModalOpen(prevState => (value === 2 ? !prevState : false))
  }

  const onClose = () => {
    setDialog(false)
  }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))
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
      field: 'image_type',
      headerName: 'IMAGE',
      renderCell: params => (
        <>
          <Avatar variant='square' src={params.row.created_by_user?.profile_pic} alt={params.row.id} />
          <Tooltip title={params.row.image_type} placement='right'>
            <Typography
              variant='body2'
              sx={{ ml: 2, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {' '}
              {params.row.image_type}
            </Typography>
          </Tooltip>
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
      flex: 0.3,
      minWidth: 10,
      field: 'scientific_name',
      headerName: 'SCIENTIFIC NAME',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.scientific_name ? params.row.scientific_name : '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 10,
      field: 'gender_count',
      headerName: 'GENDER / COUNT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.gender_count?.gender
            ? params.row.gender_count?.gender + ' : ' + params.row.gender_count?.count
            : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 30,
      field: 'age',
      headerName: 'Age',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
              {params.row.age ? params.row.age : '-'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 30,
      field: 'category',
      headerName: 'Category',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
              {params.row.category ? params.row.category : '-'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'date',
      headerName: 'DATE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.date ? moment(params.row.date).format('DD/MM/YYYY') : '-'}
        </Typography>
      )
    }
  ]

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <Card sx={{ mt: 4 }}>
            <ConfirmationDialog
              image={'https://app.antzsystems.com/uploads/6515471031963.jpg'}
              iconColor={'#ff3838'}
              title={'Are you sure you want to delete this ingredient?'}
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
  const onCellClick = params => {
    // Handle cell click logic here
  }
  return (
    <>
      <Card>
        <CardHeader
          avatar={
            <Icon
              style={{ cursor: 'pointer' }}
              onClick={() => {
                Router.push({
                  pathname: '/parivesh/home'
                })
              }}
              icon='ep:back'
            />
          }
          title={`Request - ${batchData.requestId}`}
        />
        <Box sx={{ background: '#C3CEC7', borderRadius: '10px', m: 6, p: 6 }}>
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant='subtitle1' style={{ color: '#44544A' }}>
                  Batch ID: <span style={{ color: '#37BD69' }}>{batchData.batchId}</span>
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant='subtitle1' style={{ color: '#44544A' }}>
                  Organization: <span style={{ color: '#37BD69' }}>{batchData.organization}</span>
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant='subtitle1' style={{ color: '#44544A' }}>
                  Date of Submitted: <span style={{ color: '#37BD69' }}>{batchData.dateSubmitted}</span>
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant='subtitle1'>Status</Typography>
              </Grid>
            </Grid>
          </Box>
          <Box sx={{ mt: 6 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant='subtitle1' style={{ color: '#44544A' }}>
                  Batch Created: <span style={{ color: '#37BD69' }}>{batchData.batchCreated}</span>
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant='subtitle1' style={{ color: '#44544A' }}>
                  Registration ID : <span style={{ color: '#37BD69' }}>{batchData.registrationId}</span>
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant='subtitle1' style={{ color: '#44544A' }}>
                  Submitted By: <span style={{ color: '#37BD69' }}>{batchData.submittedBy}</span>
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Select
                  displayEmpty
                  sx={{
                    minWidth: 200,
                    background: '#00AFD6',
                    color: '#FFFFFF',
                    borderColor: '#00AFD6',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00AFD6'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00AFD6'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00AFD6'
                    },
                    '& .MuiSelect-icon': {
                      color: '#FFFFFF'
                    }
                  }}
                  IconComponent={CustomDropdownIcon}
                  value={selectedStatus}
                  onChange={handleStatusChange}
                >
                  <MenuItem value='' disabled>
                    Select Status
                  </MenuItem>
                  {dropdownOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
            </Grid>
          </Box>
        </Box>
        <Box sx={{ pl: 6, pr: 6, pb: 6 }}>
          <Grid>{tableData()}</Grid>
        </Box>
      </Card>
      <Card sx={{ mt: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 6 }}>
          <Button variant='contained' sx={{ background: '#1F415B' }}>
            <Icon icon='mdi:add' fontSize={20} />
            &nbsp; Print
          </Button>
          <Button variant='contained' color='primary'>
            SAVE
          </Button>
        </Box>
      </Card>
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogTitle>
          Registration ID*
          <IconButton
            aria-label='close'
            onClick={() => setIsModalOpen(false)}
            sx={{ top: 10, right: 10, position: 'absolute', color: 'grey.500' }}
          >
            <Icon icon='mdi:close' />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 6 }}>
            <FormControl fullWidth>
              <Controller
                name='registrationId'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    label='Registration ID'
                    value={value}
                    onChange={onChange}
                    placeholder='Enter Registration ID'
                    error={Boolean(errors.registrationId)}
                    name='registrationId'
                  />
                )}
              />
              {errors.registrationId && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.registrationId?.message}</FormHelperText>
              )}
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button sx={{ width: '100%' }} variant='contained' color='primary'>
            Add ID
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default BatchDetails

// import {
//   Avatar,
//   Button,
//   Card,
//   CardHeader,
//   FormControl,
//   Grid,
//   InputLabel,
//   MenuItem,
//   Select,
//   Tooltip,
//   Typography,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   DialogContentText,
//   Input,
//   TextField,
//   FormHelperText
// } from '@mui/material'
// import { Box } from '@mui/system'
// import React, { useState } from 'react'
// import { styled } from '@mui/system'
// import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
// import IconButton from '@mui/material/IconButton'
// import ConfirmationDialog from 'src/components/confirmation-dialog'
// import ConfirmationCheckBox from 'src/views/forms/form-elements/confirmationCheckBox'
// import { useTheme } from '@mui/material/styles'
// import FallbackSpinner from 'src/@core/components/spinner/index'
// import { DataGrid } from '@mui/x-data-grid'
// import moment from 'moment'
// import Icon from 'src/@core/components/icon'
// import Router from 'next/router'
// import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
// import { Controller, useForm } from 'react-hook-form'

// const CustomDropdownIcon = styled(ArrowDropDownIcon)({
//   color: '#FFFFFF' // Change this to your desired color
// })

// const BatchDetails = () => {
//   const theme = useTheme()
//   const {
//     register,
//     handleSubmit,
//     control,
//     formState: { errors }
//   } = useForm()
//   const [searchValue, setSearchValue] = useState('')
//   const [total, setTotal] = useState(0)
//   const [loader, setLoader] = useState(false)
//   const [dialog, setDialog] = useState(false)
//   const [check, setCheck] = useState(false)
//   const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
//   const [loading, setLoading] = useState(false)
//   const [rows, setRows] = useState([
//     {
//       uid: '01',
//       id: '1',
//       common_name: 'Cheetah',
//       scientific_name: 'Speckled pigeon',
//       gender_count: {
//         gender: 'Male',
//         count: 3
//       },
//       age: 'Juvenile',
//       category: 'Birth',
//       created_at: '2024-06-03 16:07:17',
//       date: '2024-06-06 16:07:17',
//       created_by_user: {
//         user_name: 'sr',
//         email: 'sr@mailinator.com',
//         profile_pic: 'https://api.dev.antzsystems.com/uploads/11/diet/ingredients/665d9cdd975011717411037.jpg'
//       }
//     }
//   ])
//   const [selectedStatus, setSelectedStatus] = useState('')
//   const [isModalOpen, setIsModalOpen] = useState(false)

//   const handleStatusChange = event => {
//     const value = event.target.value
//     setSelectedStatus(value)
//     setIsModalOpen(prevState => (value === 2 ? !prevState : false))
//   }

//   const onClose = () => {
//     setDialog(false)
//   }

//   const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

//   const indexedRows = rows?.map((row, index) => ({
//     ...row,
//     sl_no: getSlNo(index)
//   }))
//   const columns = [
//     {
//       flex: 0.2,
//       Width: 40,
//       field: 'uid',
//       headerName: 'S.NO',
//       renderCell: params => (
//         <Typography variant='body2' sx={{ color: 'text.primary' }}>
//           {params.row.uid}
//         </Typography>
//       )
//     },

//     {
//       flex: 0.2,
//       minWidth: 30,
//       field: 'image_type',
//       headerName: 'IMAGE',
//       renderCell: params => (
//         <>
//           <Avatar variant='square' src={params.row.created_by_user?.profile_pic} alt={params.row.id} />
//           <Tooltip title={params.row.image_type} placement='right'>
//             <Typography
//               variant='body2'
//               sx={{ ml: 2, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis' }}
//             >
//               {' '}
//               {params.row.image_type}
//             </Typography>
//           </Tooltip>
//         </>
//       )
//     },
//     {
//       flex: 0.3,
//       minWidth: 30,
//       field: 'common_name',
//       headerName: 'COMMON NAME',
//       renderCell: params => (
//         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//           <Box sx={{ display: 'flex', flexDirection: 'column' }}>
//             <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
//               {params.row.common_name ? params.row.common_name : '-'}
//             </Typography>
//           </Box>
//         </Box>
//       )
//     },
//     {
//       flex: 0.3,
//       minWidth: 10,
//       field: 'scientific_name',
//       headerName: 'SCIENTIFIC NAME',
//       renderCell: params => (
//         <Typography variant='body2' sx={{ color: 'text.primary' }}>
//           {params.row.scientific_name ? params.row.scientific_name : '-'}
//         </Typography>
//       )
//     },
//     {
//       flex: 0.4,
//       minWidth: 10,
//       field: 'gender_count',
//       headerName: 'GENDER / COUNT',
//       renderCell: params => (
//         <Typography variant='body2' sx={{ color: 'text.primary' }}>
//           {params.row.gender_count?.gender
//             ? params.row.gender_count?.gender + ' : ' + params.row.gender_count?.count
//             : '-'}
//         </Typography>
//       )
//     },
//     {
//       flex: 0.3,
//       minWidth: 30,
//       field: 'age',
//       headerName: 'Age',
//       renderCell: params => (
//         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//           <Box sx={{ display: 'flex', flexDirection: 'column' }}>
//             <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
//               {params.row.age ? params.row.age : '-'}
//             </Typography>
//           </Box>
//         </Box>
//       )
//     },
//     {
//       flex: 0.3,
//       minWidth: 30,
//       field: 'category',
//       headerName: 'Category',
//       renderCell: params => (
//         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//           <Box sx={{ display: 'flex', flexDirection: 'column' }}>
//             <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
//               {params.row.category ? params.row.category : '-'}
//             </Typography>
//           </Box>
//         </Box>
//       )
//     },
//     {
//       flex: 0.4,
//       minWidth: 20,
//       field: 'date',
//       headerName: 'DATE',
//       renderCell: params => (
//         <Typography variant='body2' sx={{ color: 'text.primary' }}>
//           {params.row.date ? moment(params.row.date).format('DD/MM/YYYY') : '-'}
//         </Typography>
//       )
//     }
//   ]

//   const tableData = () => {
//     return (
//       <>
//         {loader ? (
//           <FallbackSpinner />
//         ) : (
//           <Card sx={{ mt: 4 }}>
//             {/* <CardHeader title={'New entries'} action={headerAction} /> */}
//             <ConfirmationDialog
//               // icon={'mdi:delete'}
//               image={'https://app.antzsystems.com/uploads/6515471031963.jpg'}
//               iconColor={'#ff3838'}
//               title={'Are you sure you want to delete this ingredient?'}
//               // description={`Since ingredient IND000123 isn't included in any recipe or diet, you can delete it.`}
//               formComponent={
//                 <ConfirmationCheckBox
//                   title={'This ingredient is part of 15 recipes and 10 diets.'}
//                   label={'Deactivate this ingredient in all records'}
//                   description={
//                     'Deactivating this ingredient prevents its addition to new recipes or diets, but you can swap it with another ingredient.'
//                   }
//                   color={theme.palette.formContent?.tertiary}
//                   value={check}
//                   setValue={setCheck}
//                 />
//               }
//               dialogBoxStatus={dialog}
//               onClose={onClose}
//               ConfirmationText={'Delete'}
//               confirmAction={onClose}
//             />
//             <DataGrid
//               sx={{
//                 '.MuiDataGrid-cell:focus': {
//                   outline: 'none'
//                 },

//                 '& .MuiDataGrid-row:hover': {
//                   cursor: 'pointer'
//                 }
//               }}
//               columnVisibilityModel={{
//                 sl_no: false
//               }}
//               hideFooterSelectedRowCount
//               disableColumnSelector={true}
//               autoHeight
//               pagination
//               rows={indexedRows === undefined ? [] : indexedRows}
//               rowCount={total}
//               columns={columns}
//               sortingMode='server'
//               paginationMode='server'
//               pageSizeOptions={[7, 10, 25, 50]}
//               paginationModel={paginationModel}
//               //   onSortModelChange={handleSortModel}
//               slots={{ toolbar: ServerSideToolbarWithFilter }}
//               onPaginationModelChange={setPaginationModel}
//               loading={loading}
//               slotProps={{
//                 baseButton: {
//                   variant: 'outlined'
//                 },
//                 toolbar: {
//                   value: searchValue,
//                   clearSearch: () => handleSearch(''),
//                   onChange: event => handleSearch(event.target.value)
//                 }
//               }}
//               onCellClick={onCellClick}
//             />
//           </Card>
//         )}
//       </>
//     )
//   }
//   const onCellClick = params => {
//     // Router.push('/parivesh/home/new-entries/add-newentry')
//     // console.log(params, 'params')
//     // const clickedColumn = params.field !== 'switch'
//     // if (clickedColumn) {
//     //   const data = params.row
//     //   Router.push({
//     //     pathname: `/diet/ingredient/${data?.id}`
//     //   })
//     // } else {
//     //   return
//     // }
//   }
//   return (
//     <>
//       <Card>
//         <CardHeader
//           avatar={
//             <Icon
//               style={{ cursor: 'pointer' }}
//               onClick={() => {
//                 Router.push({
//                   pathname: '/parivesh/home'
//                 })
//               }}
//               icon='ep:back'
//             />
//           }
//           title={`Request - ${1}`}
//         />
//         <Box sx={{ background: '#C3CEC7', borderRadius: '10px', m: 6, p: 6 }}>
//           <Box>
//             <Grid container spacing={2}>
//               <Grid item xs={12} sm={6} md={3}>
//                 <Typography variant='subtitle1' style={{ color: '#44544A' }}>
//                   Batch ID: <span style={{ color: '#37BD69' }}>123</span>
//                 </Typography>
//               </Grid>
//               <Grid item xs={12} sm={6} md={3}>
//                 <Typography variant='subtitle1' style={{ color: '#44544A' }}>
//                   Organization: <span style={{ color: '#37BD69' }}>RKT</span>
//                 </Typography>
//               </Grid>
//               <Grid item xs={12} sm={6} md={3}>
//                 <Typography variant='subtitle1' style={{ color: '#44544A' }}>
//                   Date of Submitted: <span style={{ color: '#37BD69' }}>22/04/2024</span>
//                 </Typography>
//               </Grid>
//               <Grid item xs={12} sm={6} md={3}>
//                 <Typography variant='subtitle1'>Status</Typography>
//               </Grid>
//             </Grid>
//           </Box>
//           <Box sx={{ mt: 6 }}>
//             <Grid container spacing={2}>
//               <Grid item xs={12} sm={6} md={3}>
//                 <Typography variant='subtitle1' style={{ color: '#44544A' }}>
//                   Batch Created: <span style={{ color: '#37BD69' }}>22/04/2024</span>
//                 </Typography>
//               </Grid>
//               <Grid item xs={12} sm={6} md={3}>
//                 <Typography variant='subtitle1' style={{ color: '#44544A' }}>
//                   Registration ID : <span style={{ color: '#37BD69' }}>1223</span>
//                 </Typography>
//               </Grid>
//               <Grid item xs={12} sm={6} md={3}>
//                 <Typography variant='subtitle1' style={{ color: '#44544A' }}>
//                   Submitted By: <span style={{ color: '#37BD69' }}>sr</span>
//                 </Typography>
//               </Grid>
//               <Grid item xs={12} sm={6} md={3}>
//                 <Select
//                   displayEmpty
//                   sx={{
//                     minWidth: 200,
//                     background: '#00AFD6',
//                     color: '#FFFFFF',
//                     borderColor: '#00AFD6',
//                     '& .MuiOutlinedInput-notchedOutline': {
//                       borderColor: '#00AFD6'
//                     },
//                     '&:hover .MuiOutlinedInput-notchedOutline': {
//                       borderColor: '#00AFD6'
//                     },
//                     '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                       borderColor: '#00AFD6'
//                     },
//                     '& .MuiSelect-icon': {
//                       color: '#FFFFFF'
//                     }
//                   }}
//                   IconComponent={CustomDropdownIcon}
//                   value={selectedStatus}
//                   onChange={handleStatusChange}
//                 >
//                   <MenuItem value='' disabled>
//                     Select Status
//                   </MenuItem>
//                   <MenuItem value={1}>Yet to Submitted</MenuItem>
//                   <MenuItem value={2}>Submitted</MenuItem>
//                 </Select>
//               </Grid>
//             </Grid>
//           </Box>
//         </Box>
//         <Box sx={{ pl: 6, pr: 6, pb: 6 }}>
//           <Grid>{tableData()}</Grid>
//         </Box>
//       </Card>
//       <Card sx={{ mt: 6 }}>
//         <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 6 }}>
//           <Button variant='contained' sx={{ background: '#1F415B' }}>
//             <Icon icon='mdi:add' fontSize={20} />
//             &nbsp; Print
//           </Button>
//           <Button variant='contained' color='primary'>
//             SAVE
//           </Button>
//         </Box>
//       </Card>
//       <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
//         <DialogTitle>
//           Registration ID*
//           <IconButton
//             aria-label='close'
//             onClick={() => setIsModalOpen(false)}
//             sx={{ top: 10, right: 10, position: 'absolute', color: 'grey.500' }}
//           >
//             <Icon icon='mdi:close' />
//           </IconButton>
//         </DialogTitle>
//         <DialogContent>
//           <Box sx={{ mt: 6 }}>
//             <FormControl fullWidth>
//               <Controller
//                 name='registrationId'
//                 control={control}
//                 rules={{ required: true }}
//                 render={({ field: { value, onChange } }) => (
//                   <TextField
//                     label='Registration ID'
//                     value={value}
//                     onChange={onChange}
//                     placeholder='Enter Registration ID'
//                     error={Boolean(errors.registrationId)}
//                     name='registrationId'
//                   />
//                 )}
//               />
//               {errors.registrationId && (
//                 <FormHelperText sx={{ color: 'error.main' }}>{errors.registrationId?.message}</FormHelperText>
//               )}
//             </FormControl>
//           </Box>
//         </DialogContent>
//         <DialogActions>
//           <Button sx={{ width: '100%' }} variant='contained' color='primary'>
//             Add ID
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </>
//   )
// }

// export default BatchDetails
