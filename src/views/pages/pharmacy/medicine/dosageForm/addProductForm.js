// ** React Imports
import { useState, useEffect, useCallback, Fragment } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import { useRouter } from 'next/router'
import { getProductFormById } from 'src/lib/api/pharmacy/productForms'

// ** Third Party Imports
import { useForm } from 'react-hook-form'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { getDosageFormById } from 'src/lib/api/pharmacy/productForms'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledRadioGroup from 'src/views/forms/form-fields/ControlledRadioGroup'

const schema = yup.object().shape({
  name: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .min(3, 'Product form must contain at least 3 characters')
    .required('Product Form is Required'),
  active: yup.string().required('Status is Required')
})

const defaultValues = {
  name: '',
  active: '1'
}

const AddProductForm = props => {
  const { addEventSidebarOpen, handleSidebarClose, handleSubmitData, resetForm, submitLoader, editParams } = props

  const [values, setValues] = useState(defaultValues)

  // const router = useRouter()
  // const { id, action } = router.query

  // const handleSidebarClose = () => {
  //   setOpenSidebar(false)
  // }

  const {
    reset,
    control,
    setValue,
    clearErrors,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const onSubmit = async params => {
    const { name, active } = { ...params }

    const payload = {
      name: name.trim(),
      active
    }
    await handleSubmitData(payload)
  }

  const getDosage = useCallback(
    async id => {
      try {
        const response = await getProductFormById(id)
        if (response?.success) {
          reset({ name: response.data.label, active: response.data.active, id: response.data.id })
        } else {
        }
      } catch (e) {
        console.log(e)
      }
    },
    [reset]
  )

  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
    }

    if (editParams?.id !== null) {
      console.log()

      getDosage(editParams?.id)
    }
  }, [resetForm, editParams, reset, getDosage])

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
        <Typography variant='h6'>{editParams?.id !== null ? 'Edit' : 'Add'} Product Form</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size='small' onClick={handleSidebarClose} sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
      </Box>
      <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
        <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
          <ControlledTextField
            name='name'
            control={control}
            placeholder='Product Form'
            error={Boolean(errors.name)}
            label='Product Form*'
            fullWidth
            required
            sx={{ mb: 6 }}
          />
          {editParams?.id !== null ? (
            <ControlledRadioGroup
              name='active'
              control={control}
              errors={errors}
              label='Status'
              required
              options={[
                { label: 'Active', value: '1' },
                { label: 'Inactive', value: '0' }
              ]}
              row
              gap={4}
              sx={{ mb: 6 }}
            />
          ) : null}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RenderSidebarFooter />
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddProductForm
