import {
  Autocomplete,
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  Typography,
  TableRow,
  TextField,
  Box,
  Dialog,
  CircularProgress
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import React, { useEffect, useState } from 'react'
import { AddButton } from 'src/components/Buttons'
import { getUserList, submitDispense } from 'src/lib/api/pharmacy/dispenseProduct'
import { readAsync } from 'src/lib/windows/utils'
import * as Yup from 'yup'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import ProductForm from '../../../../components/pharmacy/dispense/ProductForm'
import Router from 'next/router'
import AddAnimals from '../../../../components/pharmacy/dispense/addAnimals'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'
import UserSnackbar from 'src/components/utility/snackbar'

function AddDispense() {
  const [currentDate] = useState(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0') // Months are zero-based
    const day = String(today.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  })
  const { selectedPharmacy } = usePharmacyContext()
  const [users, setUsers] = useState([])
  const [animals_s, setAnimals_s] = useState([])

  const [showProductFormDialog, setShowProductFormDialog] = useState(false)
  const [productArrayUi, setProductArrayUi] = useState([])
  const [productArray, setProductArray] = useState([])

  const [submitLoading, setSubmitLoading] = useState(false)

  const [editMode, setEditMode] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [dataForEditRow, setDataForEditRow] = useState({})

  const [addedProcuctQty, setAddedProductQty] = useState(0)

  const [openDrawer, setOpenDrawer] = useState(false)

  const [openSnackbar, setOpenSnackbar] = useState({
    open: false,
    severity: '',
    message: ''
  })

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  const PayloadInitialState = {
    user_id: {
      label: '',
      value: ''
    },
    dispense_item_details: []
  }

  const PayloadValidationSchema = Yup.object().shape({
    user_id: Yup.object({
      value: Yup.string().required('Select the user')
    })
  })

  const form = useForm({
    defaultValues: PayloadInitialState,
    resolver: yupResolver(PayloadValidationSchema),
    shouldUnregister: false,
    reValidateMode: 'onChange',
    mode: 'onChange'
  })
  const { control, handleSubmit, formState, getValues, watch, setValue, reset } = form

  const { errors } = formState

  const getUserLists = async () => {
    try {
      const userDetails = await readAsync('userDetails')
      if (userDetails?.user?.zoos.length > 0) {
        let zoo_id = userDetails?.user?.zoos[0].zoo_id
        await getUserList({ zoo_id }).then(res => {
          if (res?.data?.length > 0) {
            setUsers(
              res?.data?.map(item => ({
                label: item?.user_name,
                value: item?.user_id
              }))
            )
          }
        })
      }
    } catch (error) {
      console.log('user error', error)
    }
  }

  useEffect(() => {
    getUserLists()
  }, [])

  const handleOpenAddDispense = () => {
    showDialog()
  }

  const showDialog = () => {
    setShowProductFormDialog(true)
  }

  const closeDialog = () => {
    setShowProductFormDialog(false)
    setEditMode(false)
    setDataForEditRow({})
    setAddedProductQty(0)
  }

  const setDispensesPayload = data => {
    setValue('dispense_item_details', data)
  }

  // Example usage: Assuming you have an identifier available when handling the edit action
  const editRowData = index => {
    const rowData = productArrayUi[index]
    setSelectedIndex(index)
    if (rowData) {
      setEditMode(true)

      // Print or use the rowData as needed
      // Perform edit action using the rowData
      setDataForEditRow(rowData)
    } else {
      console.error('Data not found')
    }
  }

  // Function to remove Dispense
  const deleteRowData = index => {
    const newArray = [...productArray]
    const newArrayUi = [...productArrayUi]

    // Remove the element at the specified index
    newArray.splice(index, 1)
    newArrayUi.splice(index, 1)

    // Update the state with the modified array
    setProductArray(newArray)
    setProductArrayUi(newArrayUi)
    setDispensesPayload(newArrayUi)
  }

  // Function to remove Animal
  const deleteAnimalRow = index => {
    const newArray = [...animals_s]
    newArray.splice(index, 1)
    setAnimals_s(newArray)
  }

  const onError = errors => {
    console.log('Form errros', errors)
  }

  const submitForm = async data => {
    const payload = {
      user_id: getValues('user_id.value'),
      animal_id: animals_s.map(i => i?.animal_id),
      dispense_item_details: productArray
    }
    setSubmitLoading(true)
    try {
      await submitDispense(payload).then(res => {
        if (res?.success) {
          reset()
          setOpenSnackbar({
            ...openSnackbar,
            open: true,
            message: JSON.stringify(res?.message),
            severity: 'success'
          })
          setSubmitLoading(false)
          setProductArray([])
          setProductArrayUi([])
          Router.push({
            pathname: `/pharmacy/dispense/${res?.data}`

            // query: { id: res?.data }
          })

          // Router.push('/pharmacy/dispense')
        } else {
          setSubmitLoading(false)
          setOpenSnackbar({
            ...openSnackbar,
            open: true,
            message: JSON.stringify(res?.message),
            severity: 'error'
          })
        }
      })
    } catch (error) {
      setOpenSnackbar({ ...openSnackbar, open: true, message: JSON.stringify(error), severity: 'error' })
      setSubmitLoading(false)
    }
  }

  return (
    <>
      {selectedPharmacy.permission.pharmacy_module === 'allow_full_access' ||
      selectedPharmacy.permission.dispense_medicine ? (
        <Card>
          <Dialog
            fullWidth
            open={showProductFormDialog}
            maxWidth='md'
            height='auto'
            scroll='body'
            onClose={() => closeDialog()}
            onBackdropClick={() => closeDialog()}
          >
            <Card>
              <CardHeader
                sx={{ mx: 1.4 }}
                title={editMode ? 'Edit Dispense Item' : 'Add Dispense Item'}
                action={
                  <IconButton size='small' onClick={() => closeDialog()} sx={{ mx: 4 }}>
                    <Icon icon='mdi:close' />
                  </IconButton>
                }
              />
              <CardContent sx={{ pt: 0 }}>
                <ProductForm
                  closeDialog={closeDialog}
                  productArray={productArray}
                  setProductArray={setProductArray}
                  productArrayUi={productArrayUi}
                  setProductArrayUi={setProductArrayUi}
                  editMode={editMode}
                  setEditMode={setEditMode}
                  dataForEditRow={dataForEditRow}
                  setDataForEditRow={setDataForEditRow}
                  selectedIndex={selectedIndex}
                  setSelectedIndex={setSelectedIndex}
                  addedProcuctQty={addedProcuctQty}
                  setAddedProductQty={setAddedProductQty}
                  setDispensesPayload={setDispensesPayload}
                />
              </CardContent>
            </Card>
          </Dialog>
          <Grid
            container
            sm={12}
            xs={12}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Grid item>
              <CardHeader
                title='Add Dispense'
                avatar={
                  <Icon
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      Router.push('/pharmacy/dispense')
                    }}
                    icon='ep:back'
                  />
                }
              />
            </Grid>
          </Grid>
          <form onSubmit={handleSubmit(submitForm, onError)}>
            <CardContent>
              <Grid container spacing={5}>
                <Grid item xs={12} sm={12} md={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='user_id'
                      control={control}
                      render={({ field }) => (
                        <>
                          <Autocomplete
                            forcePopupIcon={false}
                            inputProps={{ tabIndex: '6' }}
                            disablePortal
                            value={field?.value}
                            options={users}
                            noOptionsText='Type to search'
                            getOptionLabel={option => option?.label || ''}
                            renderInput={params => (
                              <TextField
                                {...params}
                                label='Dispense To*'
                                placeholder='Search & Select'
                                error={Boolean(errors.user_id)}
                              />
                            )}
                            onChange={(event, newValue) => {
                              field.onChange(newValue)
                            }}
                          />
                          {errors.user_id && (
                            <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                              {errors.user_id?.message === 'user_id cannot be null'
                                ? 'Select the user'
                                : errors.user_id?.message || 'Select the user'}
                            </FormHelperText>
                          )}
                        </>
                      )}
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 4.5,
                py: 2
              }}
            >
              <Typography variant='h6'>Add Dispense Item</Typography>
              <AddButton
                disabled={watch('user_id')?.value === '' || errors.user_id}
                title='Add Dispense Item'
                action={() => {
                  handleOpenAddDispense()
                }}
              />
            </Box>
            <TableContainer sx={{ mb: 5 }}>
              <Table>
                <TableHead sx={{ backgroundColor: '#F5F5F7' }}>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell>Batch No.</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productArrayUi.length > 0
                    ? productArrayUi.map((el, index, array) => {
                        // Check if it's the first row with this Product Name
                        const isFirstRow =
                          index === array.findIndex(item => item?.stock_id?.label === el?.stock_id?.label)

                        return (
                          <TableRow key={index}>
                            {isFirstRow && (
                              <TableCell
                                rowSpan={array.filter(item => item?.stock_id?.label === el?.stock_id?.label).length}
                                style={{
                                  borderRight: '1px solid #ccc'
                                }}
                              >
                                {el?.stock_id?.label}
                              </TableCell>
                            )}
                            <TableCell>{el?.batch_no?.label}</TableCell>
                            <TableCell>{el?.qty}</TableCell>
                            <TableCell>
                              <IconButton
                                size='small'
                                sx={{ mr: 0.5 }}
                                aria-label='Edit'
                                onClick={() => {
                                  editRowData(index)
                                  showDialog()
                                }}
                              >
                                <Icon icon='mdi:pencil-outline' />
                              </IconButton>
                              <IconButton
                                onClick={() => {
                                  deleteRowData(index)
                                }}
                                size='small'
                                sx={{ mr: 0.5 }}
                              >
                                <Icon icon='mdi:delete-outline' />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    : null}
                </TableBody>
              </Table>
            </TableContainer>
            <TableContainer>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: 4.5,
                  py: 2
                }}
              >
                <Typography variant='h6'>Add Animals</Typography>

                <AddButton
                  title='Add Animals'
                  disabled={productArray.length < 1 || errors.user_id}
                  action={() => setOpenDrawer(true)}
                />
              </Box>
              <Table>
                <TableHead sx={{ backgroundColor: '#F5F5F7' }}>
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell>Animal Id</TableCell>
                    <TableCell>animal Name</TableCell>
                    <TableCell>enclosure Id</TableCell>
                    <TableCell>section Name</TableCell>
                    <TableCell>gender</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {animals_s.length > 0
                    ? animals_s.map((elmnt, index) => {
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              {' '}
                              <Avatar
                                sx={{
                                  '& > img': {
                                    objectFit: 'contain'
                                  }
                                }}
                                variant='rounded'
                                alt={elmnt?.icon}
                                src={elmnt?.icon}
                              />
                            </TableCell>
                            <TableCell>{elmnt?.animal_id}</TableCell>
                            <TableCell>{elmnt?.animalName}</TableCell>
                            <TableCell>{elmnt?.enclosure_id}</TableCell>
                            <TableCell>{elmnt?.section_name}</TableCell>
                            <TableCell>{elmnt?.gender}</TableCell>
                            <TableCell>
                              <IconButton
                                onClick={() => {
                                  deleteAnimalRow(index)
                                }}
                                size='small'
                                sx={{ mr: 0.5 }}
                              >
                                <Icon icon='mdi:delete-outline' />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    : null}
                </TableBody>
              </Table>
            </TableContainer>
            <CardContent>
              <Grid item xs={12} sm={12} md={6}>
                <Grid Grid sx={{ height: '100%' }} alignItems='flex-end' justifyContent='flex-end' container>
                  <Button
                    sx={{ width: '100px', height: '40px' }}
                    disabled={productArrayUi?.length === 0 || errors.user_id || submitLoading}
                    type='submit'
                    variant='contained'
                  >
                    {submitLoading ? <CircularProgress size={'16px'} /> : 'Submit'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
            {openSnackbar.open ? (
              <UserSnackbar
                handleClose={() =>
                  setOpenSnackbar({
                    ...openSnackbar,
                    open: false
                  })
                }
                severity={openSnackbar?.severity}
                status={true}
                message={openSnackbar?.message}
              />
            ) : null}
          </form>
          <AddAnimals
            drawerWidth={400}
            addEventSidebarOpen={openDrawer}
            handleSidebarClose={handleSidebarClose}
            getValues={getValues}
            animals_s={animals_s}
            setAnimals_s={setAnimals_s}
          />
        </Card>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default AddDispense
