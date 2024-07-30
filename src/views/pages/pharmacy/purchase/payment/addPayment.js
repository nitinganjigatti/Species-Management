// // ** React Imports
import { useState, useEffect, useCallback, Fragment, forwardRef } from 'react'

// // ** MUI Imports
// import Box from '@mui/material/Box'
// import Drawer from '@mui/material/Drawer'
// import Grid from '@mui/material/Grid'

// import TextField from '@mui/material/TextField'
// import IconButton from '@mui/material/IconButton'
// import Typography from '@mui/material/Typography'
// import FormControl from '@mui/material/FormControl'
// import FormHelperText from '@mui/material/FormHelperText'
// import Select from '@mui/material/Select'
// import MenuItem from '@mui/material/MenuItem'
// import InputLabel from '@mui/material/InputLabel'
// import DatePicker from 'react-datepicker'
// import SingleDatePicker from 'src/components/SingleDatePicker'

// import * as yup from 'yup'
// import { yupResolver } from '@hookform/resolvers/yup'
// import { LoadingButton } from '@mui/lab'
// import { useRouter } from 'next/router'
// import { RadioGroup, FormLabel, FormControlLabel, Radio, TextareaAutosize } from '@mui/material'

// // ** Third Party Imports
// import { useForm, Controller } from 'react-hook-form'

// // ** Icon Imports
// import Icon from 'src/@core/components/icon'
// import { getSuppliers } from 'src/lib/api/pharmacy/getSupplierList'
// import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'

// // ** Styled Components

// const defaultValues = {
//   supplier_id: null,
//   date: '',
//   total_due_amount: 0,
//   amount: null,
//   payment_mode: 'cash',
//   txn_no: null,
//   type: 'dr'
// }

// const CustomInput = forwardRef(({ ...props }, ref) => {
//   return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
// })

// const AddPayment = props => {
//   // ** Props
//   const { addEventSidebarOpen, handleSidebarClose, handleSubmitData, resetForm, submitLoader, editParams } = props
//   console.log('props', props)

//   // ** States
//   const [values, setValues] = useState(defaultValues)
//   const [suppliers, setSuppliers] = useState([])

//   const schema = yup.object().shape({
//     supplier_id: yup.string().required('Supplier name is required'),
//     date: yup.string().required('Date required'),
//     total_due_amount: yup.string().required('Total due amount is required'),
//     amount: yup.string().required('Amount is required'),
//     payment_mode: yup.string().required('Payment method is required'),
//     txn_no: values.payment_mode === 'online' ? yup.required('Payment id is required') : yup.string().nullable()
//   })

//   const {
//     control,
//     handleSubmit,
//     formState: { errors },
//     reset,
//     setValue,
//     watch
//     // eslint-disable-next-line react-hooks/rules-of-hooks
//   } = useForm({
//     defaultValues,
//     resolver: yupResolver(schema),
//     shouldUnregister: false,
//     mode: 'onBlur',
//     reValidateMode: 'onChange'
//   })

//   const watchPaymentMethod = watch('payment_mode')

//   const onSubmit = async params => {
//     const { date, supplier_id, total_due_amount, amount, payment_mode, txn_no, type } = { ...params }

//     const payload = {
//       supplier_id,
//       date,
//       total_due_amount,
//       amount,
//       payment_mode,
//       txn_no,
//       type
//     }
//     await handleSubmitData(payload)
//   }

//   function formatDate(dateString) {
//     const date = new Date(dateString)
//     const year = date.getFullYear()
//     const month = String(date.getMonth() + 1).padStart(2, '0')
//     const day = String(date.getDate()).padStart(2, '0')

//     return `${year}-${month}-${day}`
//   }
//   function parseFormattedDate(formattedDate) {
//     const parts = formattedDate.split('-')
//     const year = parts[0]
//     const month = Number(parts[1]) - 1
//     const day = parts[2]

//     return new Date(year, month, day)
//   }

//   const getSuppliersLists = async () => {
//     const response = await getSuppliers()
//     if (response.data.data?.length > 0) {
//       console.log('list in addpayment', response)
//       const result = response.data.data
//       result.sort((a, b) => a.id - b.id)
//       setSuppliers(result)
//     }
//   }

//   useEffect(() => {
//     getSuppliersLists()
//   }, [])

//   const RenderSidebarFooter = () => {
//     return (
//       <Fragment>
//         <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader}>
//           Submit
//         </LoadingButton>
//       </Fragment>
//     )
//   }

//   return (
//     <Drawer
//       anchor='right'
//       open={addEventSidebarOpen}
//       ModalProps={{ keepMounted: true }}
//       sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] } }}
//     >
//       <Box
//         className='sidebar-header'
//         sx={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           backgroundColor: 'background.default',
//           p: theme => theme.spacing(3, 3.255, 3, 5.255)
//         }}
//       >
//         <Typography variant='h6'>{editParams?.id !== null ? 'Edit' : 'Add'} Payment</Typography>
//         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//           <IconButton
//             size='small'
//             onClick={() => {
//               reset(defaultValues)
//               handleSidebarClose()
//             }}
//             sx={{ color: 'text.primary' }}
//           >
//             <Icon icon='mdi:close' fontSize={20} />
//           </IconButton>
//         </Box>
//       </Box>
//       <DatePickerWrapper>
//         <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
//           <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
//             <FormControl fullWidth sx={{ mb: 6 }}>
//               <InputLabel error={Boolean(errors?.state_id)} id='Supplier Name'>
//                 Supplier Name
//               </InputLabel>
//               <Controller
//                 name='supplier_id'
//                 control={control}
//                 rules={{ required: true }}
//                 render={({ field: { value, onChange } }) => (
//                   <Select
//                     name='supplier_id'
//                     value={value}
//                     label='Supplier Name'
//                     onChange={e => {
//                       onChange(e)
//                       let selectedSupplier = suppliers?.find(item => item.id === e.target.value)
//                       setValue('total_due_amount', Number(selectedSupplier?.total_due ?? 0))
//                     }}
//                     error={Boolean(errors?.supplier_id)}

//                     // labelId='store_id'
//                   >
//                     {suppliers?.map((item, index) => (
//                       <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
//                         {item?.name}
//                       </MenuItem>
//                     ))}
//                   </Select>
//                 )}
//               />
//               {errors?.state_id && (
//                 <FormHelperText sx={{ color: 'error.main' }}>{errors?.state_id?.message}</FormHelperText>
//               )}
//             </FormControl>
//             <FormControl fullWidth sx={{ mb: 6 }}>
//               <Controller
//                 name='date'
//                 control={control}
//                 rules={{ required: true }}
//                 render={({ field: { value, onChange } }) => (
//                   <SingleDatePicker
//                     fullWidth
//                     date={value ? parseFormattedDate(value) : null}
//                     width={'100%'}
//                     name={'date'}
//                     onChangeHandler={date => {
//                       let formatted = formatDate(date)
//                       onChange(formatted)
//                     }}
//                     customInput={<CustomInput label='Another Date' error={Boolean(errors.date)} />}
//                   />
//                 )}
//               />
//               {errors?.date && <FormHelperText sx={{ color: 'error.main' }}>{errors?.date?.message}</FormHelperText>}
//             </FormControl>

//             <FormControl fullWidth sx={{ mb: 6 }}>
//               <Controller
//                 name='total_due_amount'
//                 control={control}
//                 rules={{ required: true }}
//                 render={({ field: { value, onChange } }) => (
//                   <TextField
//                     disabled={true}
//                     label='Total Due Amount'
//                     value={value}
//                     onChange={onChange}
//                     placeholder='Total Due Amount'
//                     error={Boolean(errors.total_due_amount)}
//                     name='total_due_amount'
//                   />
//                 )}
//               />
//               {errors.total_due_amount && (
//                 <FormHelperText sx={{ color: 'error.main' }}>{errors.total_due_amount.message}</FormHelperText>
//               )}
//             </FormControl>

//             <FormControl fullWidth sx={{ mb: 6 }}>
//               <Controller
//                 name='amount'
//                 control={control}
//                 rules={{ required: true }}
//                 render={({ field: { value, onChange } }) => (
//                   <TextField
//                     type='number'
//                     label='Payment'
//                     value={value}
//                     onChange={onChange}
//                     placeholder='amount'
//                     error={Boolean(errors.amount)}
//                     name='amount'
//                   />
//                 )}
//               />
//               {errors.amount && <FormHelperText sx={{ color: 'error.main' }}>{errors.amount.message}</FormHelperText>}
//             </FormControl>
//             <FormControl fullWidth sx={{ mb: 6 }}>
//               <InputLabel error={Boolean(errors?.state_id)} id='Supplier Name'>
//                 Payment Method
//               </InputLabel>
//               <Controller
//                 name='payment_mode'
//                 control={control}
//                 rules={{ required: true }}
//                 render={({ field: { value, onChange } }) => (
//                   <Select
//                     name='payment_mode'
//                     label='Payment Method'
//                     value={value}
//                     onChange={onChange}
//                     error={Boolean(errors?.payment_mode)}

//                     // labelId='store_id'
//                   >
//                     <MenuItem value='cash'>Cash</MenuItem>
//                     <MenuItem value='online'>Online</MenuItem>
//                   </Select>
//                 )}
//               />
//               {errors?.payment_mode && (
//                 <FormHelperText sx={{ color: 'error.main' }}>{errors?.payment_mode?.message}</FormHelperText>
//               )}
//             </FormControl>

//             {watchPaymentMethod === 'online' ? (
//               <FormControl fullWidth sx={{ mb: 6 }}>
//                 <Controller
//                   name='txn_no'
//                   control={control}
//                   rules={{ required: true }}
//                   render={({ field: { value, onChange } }) => (
//                     <TextField
//                       label='Txn. Ref. No'
//                       value={value}
//                       onChange={onChange}
//                       placeholder='txn_no'
//                       error={Boolean(errors.txn_no)}
//                       name='txn_no'
//                     />
//                   )}
//                 />
//                 {errors.txn_no && <FormHelperText sx={{ color: 'error.main' }}>{errors.txn_no.message}</FormHelperText>}
//               </FormControl>
//             ) : null}

//             <Box sx={{ display: 'flex', alignItems: 'center' }}>
//               <RenderSidebarFooter />
//             </Box>
//           </form>
//         </Box>
//       </DatePickerWrapper>
//     </Drawer>
//   )
// }

// export default AddPayment

const AddPayment = props => {
  // ** Props
  const { addEventSidebarOpen, handleSidebarClose, handleSubmitData, resetForm, submitLoader, editParams } = props
  console.log('props', props)

  // ** States
  const [values, setValues] = useState(defaultValues)
  const [suppliers, setSuppliers] = useState([])

  const schema = yup.object().shape({
    supplier_id: yup.string().required('Supplier name is required'),
    date: yup.string().required('Date required'),
    total_due_amount: yup.string().required('Total due amount is required'),
    amount: yup.string().required('Amount is required'),
    payment_mode: yup.string().required('Payment method is required'),
    txn_no: values.payment_mode === 'online' ? yup.required('Payment id is required') : yup.string().nullable()
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
    // eslint-disable-next-line react-hooks/rules-of-hooks
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const watchPaymentMethod = watch('payment_mode')

  const onSubmit = async params => {
    const { date, supplier_id, total_due_amount, amount, payment_mode, txn_no, type } = { ...params }

    const payload = {
      supplier_id,
      date,
      total_due_amount,
      amount,
      payment_mode,
      txn_no,
      type
    }
    await handleSubmitData(payload)
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }
  function parseFormattedDate(formattedDate) {
    const parts = formattedDate.split('-')
    const year = parts[0]
    const month = Number(parts[1]) - 1
    const day = parts[2]

    return new Date(year, month, day)
  }

  const getSuppliersLists = async () => {
    const response = await getSuppliers()
    if (response.data.data?.length > 0) {
      console.log('list in addpayment', response)
      const result = response.data.data
      result.sort((a, b) => a.id - b.id)
      setSuppliers(result)
    }
  }

  useEffect(() => {
    getSuppliersLists()
  }, [])

  const RenderSidebarFooter = () => {
    return (
      <Fragment>
        <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader}>
          Submit
        </LoadingButton>
      </Fragment>
    )
  }

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] } }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
          p: theme => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Typography variant='h6'>{editParams?.id !== null ? 'Edit' : 'Add'} Payment</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            size='small'
            onClick={() => {
              reset(defaultValues)
              handleSidebarClose()
            }}
            sx={{ color: 'text.primary' }}
          >
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
      </Box>
      <DatePickerWrapper>
        <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
          <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
            <FormControl fullWidth sx={{ mb: 6 }}>
              <InputLabel error={Boolean(errors?.state_id)} id='Supplier Name'>
                Supplier Name
              </InputLabel>
              <Controller
                name='supplier_id'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <Select
                    name='supplier_id'
                    value={value}
                    label='Supplier Name'
                    onChange={e => {
                      onChange(e)
                      let selectedSupplier = suppliers?.find(item => item.id === e.target.value)
                      setValue('total_due_amount', Number(selectedSupplier?.total_due ?? 0))
                    }}
                    error={Boolean(errors?.supplier_id)}

                    // labelId='store_id'
                  >
                    {suppliers?.map((item, index) => (
                      <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                        {item?.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors?.state_id && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.state_id?.message}</FormHelperText>
              )}
            </FormControl>
            <FormControl fullWidth sx={{ mb: 6 }}>
              <Controller
                name='date'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <SingleDatePicker
                    fullWidth
                    date={value ? parseFormattedDate(value) : null}
                    width={'100%'}
                    name={'date'}
                    onChangeHandler={date => {
                      let formatted = formatDate(date)
                      onChange(formatted)
                    }}
                    customInput={<CustomInput label='Date' error={Boolean(errors.date)} />}
                  />
                )}
              />
              {errors?.date && <FormHelperText sx={{ color: 'error.main' }}>{errors?.date?.message}</FormHelperText>}
            </FormControl>

            <FormControl fullWidth sx={{ mb: 6 }}>
              <Controller
                name='total_due_amount'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    disabled={true}
                    label='Total Due Amount'
                    value={value}
                    onChange={onChange}
                    placeholder='Total Due Amount'
                    error={Boolean(errors.total_due_amount)}
                    name='total_due_amount'
                  />
                )}
              />
              {errors.total_due_amount && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.total_due_amount.message}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth sx={{ mb: 6 }}>
              <Controller
                name='amount'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    type='number'
                    label='Payment'
                    value={value}
                    onChange={onChange}
                    placeholder='amount'
                    error={Boolean(errors.amount)}
                    name='amount'
                  />
                )}
              />
              {errors.amount && <FormHelperText sx={{ color: 'error.main' }}>{errors.amount.message}</FormHelperText>}
            </FormControl>
            <FormControl fullWidth sx={{ mb: 6 }}>
              <InputLabel error={Boolean(errors?.state_id)} id='Supplier Name'>
                Payment Method
              </InputLabel>
              <Controller
                name='payment_mode'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <Select
                    name='payment_mode'
                    label='Payment Method'
                    value={value}
                    onChange={onChange}
                    error={Boolean(errors?.payment_mode)}

                    // labelId='store_id'
                  >
                    <MenuItem value='cash'>Cash</MenuItem>
                    <MenuItem value='online'>Online</MenuItem>
                  </Select>
                )}
              />
              {errors?.payment_mode && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.payment_mode?.message}</FormHelperText>
              )}
            </FormControl>

            {watchPaymentMethod === 'online' ? (
              <FormControl fullWidth sx={{ mb: 6 }}>
                <Controller
                  name='txn_no'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label='Txn. Ref. No'
                      value={value}
                      onChange={onChange}
                      placeholder='txn_no'
                      error={Boolean(errors.txn_no)}
                      name='txn_no'
                    />
                  )}
                />
                {errors.txn_no && <FormHelperText sx={{ color: 'error.main' }}>{errors.txn_no.message}</FormHelperText>}
              </FormControl>
            ) : null}

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <RenderSidebarFooter />
            </Box>
          </form>
        </Box>
      </DatePickerWrapper>
    </Drawer>
  )
}

export default AddPayment
