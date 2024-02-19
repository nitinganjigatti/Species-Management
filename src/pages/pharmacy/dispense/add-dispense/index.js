import {
  Autocomplete,
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
  TableRow,
  TextField,
  debounce
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import React, { useCallback, useEffect, useState } from 'react'
import { AddButton } from 'src/components/Buttons'
import CommonDialogBox from 'src/components/CommonDialogBox'
import { getAnimalList, getUserList, submitDispense } from 'src/lib/api/pharmacy/dispenseProduct'
import { readAsync } from 'src/lib/windows/utils'
import * as Yup from 'yup'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import ProductForm from './ProductForm'
import Router from 'next/router'

function AddDispense() {
  const [currentDate] = useState(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0') // Months are zero-based
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [users, setUsers] = useState([])
  const [animals, setAnimals] = useState([])
  const [animalList, setAnimalList] = useState([])

  const [showProductFormDialog, setShowProductFormDialog] = useState(false)
  const [productArrayUi, setProductArrayUi] = useState([])
  const [productArray, setProductArray] = useState([])

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [dataForEditRow, setDataForEditRow] = useState({})

  const [addedProcuctQty, setAddedProductQty] = useState(0)

  const PayloadInitialState = {
    user_id: {
      label: '',
      value: ''
    },
    animal_id: [],
    dispense_item_details: []
  }

  const PayloadValidationSchema = Yup.object().shape({
    user_id: Yup.object({
      value: Yup.string().required('User Id is required')
    }),
    animal_id: Yup.array()
      .of(
        Yup.object().shape({
          id: Yup.string().required('Each animal ID in the array is required')
        })
      )
      .min(1, 'At least one animal ID is required'),

    dispense_item_details: Yup.array()
      .of(
        Yup.object().shape({
          // Define the schema for each item in the array if needed
        })
      )
      .min(1, 'At least one item in dispense_item_details is required')
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

  const searchAnimalData = useCallback(
    debounce(async searchText => {
      try {
        await getAnimalList({
          end_date: currentDate,
          page_no: '1',
          q: searchText,
          start_date: '',
          type: 'all_animals',
          selected_user_id: `${getValues('user_id.value')}`
        }).then(res => {
          if (res?.data?.animals.length > 0) {
            setAnimalList(
              res?.data?.animals?.map(item => ({
                label: item?.default_common_name,
                id: item?.animal_id
              }))
            )
          }
        })
      } catch (error) {
        console.error(error)
      }
    }, 500),
    []
  )

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
  const editRowData = (stock_id, batch_no) => {
    const rowData = productArrayUi.find(item => item.stock_id?.value === stock_id && item.batch_no?.value === batch_no)
    setSelectedIndex(productArrayUi.indexOf(rowData))

    if (rowData) {
      setEditMode(true)
      // Print or use the rowData as needed
      setDataForEditRow(rowData)
    } else {
      console.error('Data not found')
    }
  }

  // Function to remove
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

  const DeleteModal = () => {
    return (
      <CardContent>
        <p>Delete</p>
      </CardContent>
    )
  }

  const submitForm = async data => {
    const payload = {
      user_id: getValues('user_id.value'),
      animal_count: 10,
      animal_id: data?.animal_id?.map(i => i?.id),
      dispense_item_details: productArray
    }
    await submitDispense(payload).then(res => {
      if (res?.success) {
        reset()
        setProductArray([])
        setProductArrayUi([])
        Router.push('/pharmacy/dispense')
      }
    })
  }
  return (
    <>
      <Card>
        <Grid container>
          <CommonDialogBox
            title={'Add Request Item'}
            dialogBoxStatus={showProductFormDialog}
            formComponent={
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
            }
            close={closeDialog}
            show={showDialog}
          />
          <CommonDialogBox
            title={'Delete'}
            dialogBoxStatus={showDeleteDialog}
            formComponent={<DeleteModal />}
            close={() => setShowDeleteDialog(false)}
            show={() => setShowDeleteDialog(true)}
          />
        </Grid>
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
        <form onSubmit={handleSubmit(submitForm)}>
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
                          getOptionLabel={option => option?.label || ''}
                          renderInput={params => (
                            <TextField {...params} label='Users*' error={Boolean(errors.user_id)} />
                          )}
                          onChange={(event, newValue) => {
                            field.onChange(newValue)
                          }}
                        />
                        {errors.user_id && (
                          <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                            {errors.user_id.message === 'user_id cannot be null'
                              ? 'User Id is required'
                              : errors.user_id.message || 'User Id is required'}
                          </FormHelperText>
                        )}
                      </>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <Controller
                  name='animal_id' // <-- Adjust the name as per your requirement
                  control={control}
                  defaultValue={[]} // Set a default value if needed
                  render={({ field: { value, onChange } }) => (
                    <>
                      <Autocomplete
                        multiple
                        id='multi-select'
                        options={animalList}
                        disabled={watch('user_id')?.value === ''}
                        onChange={(event, value) => {
                          setAnimals([...animals, value[value.length - 1]?.id])
                          onChange(value)
                        }}
                        getOptionLabel={option => option.label}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        renderInput={params => (
                          <TextField
                            onKeyUp={e => searchAnimalData(e.target.value)}
                            {...params}
                            variant='outlined'
                            label='Select Animals'
                            placeholder='Search Animals'
                          />
                        )}
                      />
                      {errors.animal_id && (
                        <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                          {errors.animal_id.message || 'Animal Id is required'}
                        </FormHelperText>
                      )}
                    </>
                  )}
                />
              </Grid>
              <Grid
                item
                spacing={6}
                sm={12}
                xs={12}
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  mb: 4
                }}
              >
                <AddButton
                  disabled={watch('animal_id')?.length === 0}
                  title='Add Dispense Item'
                  action={() => {
                    handleOpenAddDispense()
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
          <TableContainer>
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
                  ? productArrayUi.map((el, index) => {
                      return (
                        <TableRow key={index}>
                          <TableCell>{el.stock_id?.label}</TableCell>
                          <TableCell>{el.batch_no?.label}</TableCell>
                          <TableCell>{el.qty}</TableCell>
                          <TableCell>
                            <IconButton
                              size='small'
                              sx={{ mr: 0.5 }}
                              aria-label='Edit'
                              onClick={() => {
                                editRowData(el.stock_id?.value, el.batch_no?.value)
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
                              <Icon color='red' icon='mdi:delete-outline' />
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
                <Button disabled={productArrayUi?.length === 0} type='submit' variant='contained'>
                  Submit
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </form>
      </Card>
    </>
  )
}

export default AddDispense
