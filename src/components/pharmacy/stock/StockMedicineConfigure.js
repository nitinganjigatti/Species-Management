import React, { useState, useEffect } from 'react'
import {
  Grid,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  TextField,
  Box,
  Button,
  Chip,
  Divider
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import toast from 'react-hot-toast'

import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Avatar from '@mui/material/Avatar'
import Icon from 'src/@core/components/icon'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { getRackList } from 'src/lib/api/pharmacy/getRackList'
import {
  getMedicineConfig,
  addMedicineConfig,
  addMedicineMinQuantity,
  deleteMedicineConfig,
  updateMedicineConfig
} from 'src/lib/api/pharmacy/getMedicineList'
import DialogConfirmation from 'src/components/utility/DialogConfirmation'

const StockMedicineConfigure = ({ configureMedId, storeId, close }) => {
  const defaultValues = {
    rack_id: '',
    store_id: storeId,
    shelf_id: '',
    min_qty: '',
    config_id: ''
  }
  const [values, setValues] = useState(defaultValues)
  const [stores, setStores] = useState([])
  const [racks, setRacks] = useState([])
  const [shouldGetShelf, setShouldGetShelf] = useState(false)

  const [selectedRacks, setSelectedRacks] = useState([])
  const [selectedShelf, setSelectedShelf] = useState([])
  const [tableData, setTableData] = useState([])
  const [showQtyForm, setQtyForm] = useState(false)
  const [deleteRowId, setDeleteRowId] = useState('')

  const [deleteDialogBox, setDeleteDialogBox] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const handleClickOpen = () => setDeleteDialogBox(true)
  const handleClose = () => setDeleteDialogBox(false)
  let schema = ''
  {
    showQtyForm === true
      ? (schema = yup.object().shape({
          store_id: yup.string().required('Store is required'),
          min_qty: yup
            .number()
            .required('Minimum quantity is required')
            .positive('Minimum quantity must be a positive number')
            .integer('Minimum quantity must be an integer')
            .typeError('Minimum quantity must be a number')
        }))
      : (schema = yup.object().shape({
          rack_id: yup.string().required('Rack is required'),
          store_id: yup.string().required('Store is required'),
          shelf_id: yup.string().required('Shelf is required')
        }))
  }

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const getStoresLists = async () => {
    try {
      const response = await getStoreList()
      if (response?.length > 0) {
        setStores(response)
      }
    } catch (error) {
      console.error('Error fetching store list:', error)
    }
  }

  const getRacksLists = async () => {
    try {
      const response = await getRackList()
      // console.log('racks', response)
      if (response?.length > 0) {
        setRacks(response)
      }
    } catch (error) {
      console.error('Error fetching rack list:', error)
    }
  }

  const getRackFromStore = id => {
    if (id) {
      const filteredRacks = racks.filter(el => el.store_id === id)

      setSelectedRacks(filteredRacks)
      setShouldGetShelf(true)
    }
  }
  useEffect(() => {
    if (shouldGetShelf && selectedRacks.length > 0) {
      const id = selectedRacks[0].id
      getShelfFromRacks(id)
      setShouldGetShelf(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldGetShelf, selectedRacks])

  const getShelfFromRacks = id => {
    if (selectedRacks.length > 0) {
      const filteredShelf = selectedRacks?.filter(el => el.id === id)

      setSelectedShelf(filteredShelf[0]?.shelf_config || [])
    }
  }

  const addMedicineConfiguration = async params => {
    setSubmitLoader(true)
    const { rack_id, store_id, shelf_id, config_id } = params
    if (config_id !== '') {
      try {
        const payload = { rack_id, store_id, shelf_id }
        const result = await updateMedicineConfig(payload, configureMedId, config_id)
        if (result?.success == true) {
          toast.success(result.data)
          setDeleteRowId('')
          configureMedicine(configureMedId)

          reset(defaultValues)
          close()
        } else {
          toast.error(result.data.config)
        }
        setSubmitLoader(false)
      } catch (error) {
        setSubmitLoader(false)
        console.error('Error adding medicine configuration:', error)
      }
    } else {
      try {
        const payload = { rack_id, store_id, shelf_id }
        const result = await addMedicineConfig(payload, configureMedId)
        if (result.success == true) {
          // console.log('result', result)
          toast.success(result.data)
          configureMedicine(configureMedId)
          setDeleteRowId('')

          reset(defaultValues)
          close()
        } else {
          toast.error(result.data.config)
        }
        setSubmitLoader(false)
      } catch (error) {
        setSubmitLoader(false)
        console.error('Error adding medicine configuration:', error)
      }
    }
  }

  const addMinQuantity = async params => {
    setSubmitLoader(true)

    try {
      const { min_qty, store_id } = params
      const payload = { min_qty, store_id }
      const result = await addMedicineMinQuantity(payload, configureMedId)
      if (result.success == true) {
        // console.log('result', result)
        toast.success(result.data)
        configureMedicine(configureMedId)

        reset(defaultValues)
        close()
      } else {
        toast.error(result.data.config)
      }
      setSubmitLoader(false)
    } catch (error) {
      setSubmitLoader(false)

      console.error('Error adding minimum quantity:', error)
    }
  }

  const configureMedicine = async id => {
    try {
      const result = await getMedicineConfig(id)

      console.log('Medicine config', result)
      if (result?.length > 0) {
        const listWithId = result.map((el, i) => ({ ...el, uid: i + 1 }))
        setTableData(listWithId)
      } else {
        setTableData([])
      }
    } catch (error) {
      console.error('Error configuring medicine:', error)
    }
  }

  const handleEdit = (store, shelf) => {
    const valuesObject = {
      store_id: store.store_id,
      rack_id: store.racks[0].id,
      shelf_id: shelf.id,
      config_id: shelf.config_id
    }
    reset(valuesObject)
    getRackFromStore(store.store_id)
  }

  const editQty = el => {
    const valuesObject = {
      store_id: el.store_id,
      min_qty: el.min_qty
    }
    reset(valuesObject)
  }

  const confirmDeleteAction = async () => {
    const response = await deleteMedicineConfig(deleteRowId)

    if (response?.success === true) {
      toast.success(response?.data)
      configureMedicine(configureMedId)
      reset(defaultValues)

      handleClose()

      setDeleteRowId('')
    } else {
      handleClose()
      toast.error(response?.message)
    }
  }

  useEffect(() => {
    if (configureMedId) {
      configureMedicine(configureMedId)
      getRackFromStore(storeId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configureMedId])

  useEffect(() => {
    if (storeId) {
      getRackFromStore(storeId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [racks])

  useEffect(() => {
    getStoresLists()
    getRacksLists()

    // if (storeId) {
    //   setValues('store_id', storeId)
    // }
  }, [])

  return (
    <>
      <Grid container spacing={2} alignItems='center'>
        <DialogConfirmation
          handleClose={handleClose}
          action={confirmDeleteAction}
          open={deleteDialogBox}
          message={'Are you sure to delete'}
        />
        {tableData.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#F5F5F7' }}>
                <TableRow>
                  <TableCell>Sl</TableCell>
                  <TableCell>Store Name</TableCell>
                  <TableCell>Rack</TableCell>
                  <TableCell>Shelf</TableCell>
                  <TableCell>Reorder Level</TableCell>
                  <TableCell>Qty in Store</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map((elm, index) => (
                  <TableRow key={index}>
                    <TableCell>{elm.uid}</TableCell>
                    <TableCell>{elm.store_name}</TableCell>
                    <TableCell>{elm.rack}</TableCell>
                    <TableCell>
                      {elm.racks[0]?.shelf_configs?.map(el => (
                        <>
                          <Chip
                            key={el.id}
                            label={el.name}
                            color='primary'
                            sx={{ m: 1 }}
                            onDelete={() => {
                              handleEdit(elm, el)
                              setQtyForm(false)
                              setDeleteRowId(el.config_id)
                            }}
                            onClick={() => {
                              handleEdit(elm, el)
                              setQtyForm(false)
                              setDeleteRowId(el.config_id)
                            }}
                            deleteIcon={<Icon icon='mdi:pencil-outline' />}
                          />
                        </>
                      ))}
                      {/* {elm.racks.map((rack, rackIndex) => (
                        <div key={rack.id}>
                          {rack.shelf_configs.map(shelf => (
                            <Chip
                              key={shelf.id}
                              label={shelf.name}
                              color='primary'
                              sx={{ m: 1 }}
                              onDelete={() => {
                                console.log('onclick', shelf)
                                handleEdit(elm, shelf)
                                setQtyForm(false)
                                setDeleteRowId(shelf.config_id)
                              }}
                              onClick={() => {
                                handleEdit(elm, shelf)
                                setQtyForm(false)
                                setDeleteRowId(shelf.config_id)
                              }}
                              deleteIcon={<Icon icon='mdi:pencil-outline' />}
                            />
                          ))}
                        </div>
                      ))} */}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={elm.min_qty}
                        color='primary'
                        onDelete={() => {
                          setQtyForm(true)
                          editQty(elm)
                        }}
                        onClick={() => {
                          setQtyForm(true)
                          editQty(elm)
                        }}
                        deleteIcon={<Icon icon='mdi:pencil-outline' />}
                      />
                    </TableCell>
                    <TableCell>{elm.stock_qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : null}
        {/* {showQtyForm === false ? ( */}
        <Grid xs={12} sm={12} sx={{ display: 'flex', my: 6 }}>
          <form autoComplete='off' style={{ width: '50%' }} onSubmit={handleSubmit(addMedicineConfiguration)}>
            <Grid container spacing={2} xs={12} sm={12}>
              <Grid item xs={12} sm={12}>
                <FormControl fullWidth sx={{ mb: 6 }}>
                  <InputLabel error={Boolean(errors?.rack_id)} id='rack_id'>
                    Rack
                  </InputLabel>
                  <Controller
                    name='rack_id'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        name='rack_id'
                        value={value}
                        label='Rack'
                        onChange={e => {
                          onChange(e)
                          getShelfFromRacks(e.target.value)
                        }}
                        error={Boolean(errors?.rack_id)}
                      >
                        {selectedRacks?.map((item, index) => (
                          <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                            {item?.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors?.rack_id && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.rack_id?.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12}>
                <FormControl fullWidth>
                  <InputLabel error={Boolean(errors?.shelf_id)} id='shelf_id'>
                    Shelf
                  </InputLabel>
                  <Controller
                    name='shelf_id'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        name='shelf_id'
                        value={value}
                        label='Shelf'
                        onChange={e => {
                          onChange(e)
                        }}
                        error={Boolean(errors?.shelf_id)}
                      >
                        {selectedShelf?.map((item, index) => (
                          <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                            {item?.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors?.shelf_id && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.shelf_id?.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={12}>
                {deleteRowId ? (
                  <Button
                    variant='contained'
                    size='medium'
                    color='error'
                    sx={{ mx: 2 }}
                    onClick={() => {
                      handleClickOpen()
                    }}
                  >
                    Delete Shelf
                  </Button>
                ) : null}

                <LoadingButton
                  sx={{ my: 4 }}
                  size='medium'
                  variant='contained'
                  type='submit'
                  onClick={() => {
                    setQtyForm(false)
                  }}
                  loading={submitLoader}
                >
                  Configure medicine
                </LoadingButton>
              </Grid>
            </Grid>
          </form>
          {/* ) : ( */}
          <form style={{ width: '50%' }} autoComplete='off' onSubmit={handleSubmit(addMinQuantity)}>
            <Grid container spacing={2} xs={12} sm={12}>
              <Grid item xs={12} sm={12}>
                <FormControl fullWidth>
                  <Controller
                    name='min_qty'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        type='number'
                        label='Reorder Level'
                        value={value}
                        onChange={onChange}
                        placeholder='Reorder Level'
                        error={Boolean(errors.min_qty)}
                        name='min_qty'
                      />
                    )}
                  />
                  {errors.min_qty && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors.min_qty.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12}>
                <LoadingButton
                  sx={{ my: 4 }}
                  size='medium'
                  variant='contained'
                  type='submit'
                  onClick={() => {
                    setQtyForm(true)
                  }}
                  loading={submitLoader}
                >
                  Save
                </LoadingButton>
              </Grid>
            </Grid>
          </form>
        </Grid>
      </Grid>
    </>
  )
}

export default StockMedicineConfigure
