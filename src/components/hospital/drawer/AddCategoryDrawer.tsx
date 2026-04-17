'use client'

import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import { Box, Drawer, IconButton, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import Toaster from 'src/components/Toaster'
import { addMedicalCategory } from 'src/lib/api/medical/masters'
import { useState } from 'react'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import type { BaseDrawerProps } from 'src/types/hospital'

interface AddCategoryDrawerProps extends BaseDrawerProps {
  onSuccess?: (newCategory: any) => void
  type?: string
}

interface FormValues {
  label_name: string
}

const schema = yup.object().shape({
  label_name: yup.string().trim().required('Label is required')
})

const AddCategoryDrawer = (props: AddCategoryDrawerProps) => {
  const { open, onClose, onSuccess, type } = props
  const theme: any = useTheme()
  const [loading, setLoading] = useState(false)

  const defaultValues: FormValues = {
    label_name: ''
  }

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema) as any,
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const onSubmit = async (params: FormValues) => {
    const payload = {
      label: params?.label_name,
      type: type || ''
    }

    try {
      setLoading(true)
      const response: any = await addMedicalCategory(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Category added successfully' })

        // Create the new category object to pass back
        const newCategory = {
          id: response?.data,
          category: params?.label_name,
          label: params?.label_name,
          med_cat_id: response?.data
        }

        reset(defaultValues)
        onClose()

        if (onSuccess) {
          onSuccess(newCategory)
        }
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to add category' })
      }
    } catch (error: any) {
      console.error('Error adding category:', error)
      Toaster({ type: 'error', message: error.message || 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset(defaultValues)
    onClose()
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '550px'] },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        zIndex: 1400
      }}
    >
      <Box sx={{ bgcolor: theme.palette.customColors.lightBg, width: '100%', height: '100%' }}>
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: (theme: any) => theme.spacing(3, 3.255, 3, 5.255),
            px: '24px',
            bgcolor: theme.palette.customColors.lightBg
          }}
        >
          <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <Icon
              style={{ marginLeft: -8 }}
              icon='material-symbols-light:add-notes-outline-rounded'
              fontSize={'32px'}
            />
            <Typography variant='h6'>Add Category</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size='small' onClick={handleClose} sx={{ color: 'text.primary' }}>
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
        </Box>

        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Box
            sx={{
              m: 5,
              px: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              backgroundColor: theme.palette.customColors.OnPrimary,
              borderRadius: '8px',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
              paddingTop: 6
            }}
          >
            <ControlledTextField
              name='label_name'
              control={control}
              errors={errors}
              label='Category*'
              placeholder='Category'
            />

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  position: 'fixed',
                  right: 0,
                  width: '100%',
                  maxWidth: '550px',
                  bottom: 0,
                  px: 4,
                  py: 6,
                  bgcolor: theme.palette.customColors.OnPrimary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  display: 'flex',
                  zIndex: 1401
                }}
              >
                <LoadingButton fullWidth variant='contained' type='submit' size='large' loading={loading}>
                  Add Category
                </LoadingButton>
              </Box>
            </Box>
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddCategoryDrawer
