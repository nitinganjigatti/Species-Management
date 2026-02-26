// // ** React Imports
// import { useState, useEffect, useCallback, Fragment } from 'react'

// // ** MUI Imports
// import Box from '@mui/material/Box'
// import Drawer from '@mui/material/Drawer'

// import TextField from '@mui/material/TextField'
// import IconButton from '@mui/material/IconButton'
// import Typography from '@mui/material/Typography'
// import FormControl from '@mui/material/FormControl'
// import FormHelperText from '@mui/material/FormHelperText'
// import * as yup from 'yup'
// import { yupResolver } from '@hookform/resolvers/yup'
// import { LoadingButton } from '@mui/lab'
// import { useRouter } from 'next/router'
// import { RadioGroup, FormLabel, FormControlLabel, Radio } from '@mui/material'

// import { getCategoryById } from 'src/lib/api/pharmacy/getCategories'

// import { useForm, Controller } from 'react-hook-form'

// import Icon from 'src/@core/components/icon'

// const schema = yup.object().shape({
//   name: yup.string().required('Category Name is Required'),
//   status: yup.string().required('Status is Required')
// })

// const defaultValues = {
//   name: '',
//   status: 'active'
// }

// const AddMonitor = props => {
//   const { addEventSidebarOpen, handleSidebarClose, handleSubmitData, resetForm, submitLoader, editParams } = props

//   const [values, setValues] = useState(defaultValues)

//   const router = useRouter()
//   const { id, action } = router.query

//   // const handleSidebarClose = () => {
//   //   setOpenSidebar(false)
//   // }

//   const {
//     reset,
//     control,
//     setValue,
//     clearErrors,
//     handleSubmit,
//     formState: { errors }
//   } = useForm({
//     defaultValues,
//     resolver: yupResolver(schema),
//     shouldUnregister: false,
//     mode: 'onBlur',
//     reValidateMode: 'onChange'
//   })

//   const onSubmit = async params => {
//     const { name, status } = { ...params }

//     const payload = {
//       name,
//       status
//     }
//     await handleSubmitData(payload)
//   }

//   const getCategory = useCallback(
//     async id => {
//       const response = await getCategoryById(id)
//       if (response?.success) {
//         reset(response.data)
//       } else {
//       }
//     },
//     [reset]
//   )

//   useEffect(() => {
//     if (resetForm) {
//       reset(defaultValues)
//     }

//     if (editParams?.id !== null) {
//       console.log()

//       getCategory(editParams?.id)
//     }
//   }, [resetForm, editParams, reset, getCategory])

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
//         <Typography variant='h6'>{editParams?.id !== null ? 'Edit' : 'Add'} Category</Typography>
//         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//           <IconButton size='small' onClick={handleSidebarClose} sx={{ color: 'text.primary' }}>
//             <Icon icon='mdi:close' fontSize={20} />
//           </IconButton>
//         </Box>
//       </Box>
//       <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
//         <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
//           <FormControl fullWidth sx={{ mb: 6 }}>
//             <Controller
//               name='name'
//               control={control}
//               rules={{ required: true }}
//               render={({ field: { value, onChange } }) => (
//                 <TextField
//                   label='Category Name'
//                   value={value}
//                   onChange={onChange}
//                   placeholder='Category Name'
//                   error={Boolean(errors.name)}
//                   name='name'
//                 />
//               )}
//             />
//             {errors.name && <FormHelperText sx={{ color: 'error.main' }}>{errors.name.message}</FormHelperText>}
//           </FormControl>
//           {editParams?.id !== null ? (
//             <FormControl fullWidth sx={{ mb: 6 }} error={Boolean(errors.radio)}>
//               <FormLabel>Status</FormLabel>
//               <Controller
//                 name='status'
//                 control={control}
//                 rules={{ required: true }}
//                 render={({ field }) => (
//                   <RadioGroup row {...field} aria-label='gender' name='validation-basic-radio'>
//                     <FormControlLabel
//                       value='active'
//                       label='Active'
//                       sx={errors.status ? { color: 'error.main' } : null}
//                       control={<Radio sx={errors.status ? { color: 'error.main' } : null} />}
//                     />
//                     <FormControlLabel
//                       value='inactive'
//                       label='Inactive'
//                       sx={errors.status ? { color: 'error.main' } : null}
//                       control={<Radio sx={errors.status ? { color: 'error.main' } : null} />}
//                     />
//                   </RadioGroup>
//                 )}
//               />
//               {errors.radio && (
//                 <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-radio'>
//                   This field is required
//                 </FormHelperText>
//               )}
//             </FormControl>
//           ) : null}
//           <Box sx={{ display: 'flex', alignItems: 'center' }}>
//             <RenderSidebarFooter />
//           </Box>
//         </form>
//       </Box>
//     </Drawer>
//   )
// }

// export default AddMonitor

// ** React Imports
import { useEffect, useCallback, Fragment } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { LoadingButton } from '@mui/lab'
import { RadioGroup, FormLabel, FormControlLabel, Radio } from '@mui/material'

// ** Form Validation
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'

// ** Icons
import Icon from 'src/@core/components/icon'

// Validation Schema
const schema = yup.object().shape({
  name: yup.string().required('Category Name is Required'),
  status: yup.string().required('Status is Required')
})

// Default Form Values
const defaultValues = {
  label: ''

  // status: 'active'
}

const AddMonitor = ({
  addEventSidebarOpen,
  handleSidebarClose,
  handleSubmitData,
  resetForm,
  submitLoader,
  editParams
}) => {
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onBlur'
  })

  const onSubmit = async values => {
    const payload = {
      label: values.name,
      ref_type: 'animal'

      // ...(editParams?.id
      //   ? {
      //       treatment_master_id: editParams.id,
      //       treatment_name: values.name,
      //       is_active: values.status === 'active' ? '1' : '0'
      //     }
      //   : {})
    }

    console.log('FINAL API PAYLOAD:', payload)

    await handleSubmitData(payload)
  }

  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
    }

    if (editParams?.id) {
      reset({
        label: editParams?.name || ''

        // status: editParams?.status === '1' ? 'active' : 'inactive'
      })
    }
  }, [resetForm, editParams, reset])

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] } }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          p: 4
        }}
      >
        <Typography variant='h6'>{editParams?.id ? 'Edit' : 'Add'} Category</Typography>

        <IconButton size='small' onClick={handleSidebarClose}>
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ p: 6 }}>
        <form
          onSubmit={handleSubmit(onSubmit)}

          // onSubmit={alert('working')}
        >
          {/* Name */}
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='label'
              control={control}
              render={({ field }) => <TextField {...field} label='Category Name' error={Boolean(errors.name)} />}
            />
            {errors.name && <FormHelperText sx={{ color: 'error.main' }}>{errors.name.message}</FormHelperText>}
          </FormControl>

          {/* Status */}
          {/* <FormControl fullWidth sx={{ mb: 6 }}>
            <FormLabel>Status</FormLabel>
            <Controller
              name='status'
              control={control}
              render={({ field }) => (
                <RadioGroup row {...field}>
                  <FormControlLabel value='active' control={<Radio />} label='Active' />
                  <FormControlLabel value='inactive' control={<Radio />} label='Inactive' />
                </RadioGroup>
              )}
            />
            {errors.status && <FormHelperText sx={{ color: 'error.main' }}>{errors.status.message}</FormHelperText>}
          </FormControl> */}

          {/* Submit Button */}
          <LoadingButton fullWidth size='large' type='submit' variant='contained' loading={submitLoader}>
            Submit
          </LoadingButton>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddMonitor
