'use client'

import { useEffect, useState } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Drawer,
  IconButton,
  Typography,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import Toaster from 'src/components/Toaster'
import { addMedicalComplaintOrDiagnosis } from 'src/lib/api/medical/masters'
import { getDiagnosisList } from 'src/lib/api/hospital/clinicalAssessment'
import AddCategoryDrawer from './AddCategoryDrawer'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import type { BaseDrawerProps } from 'src/types/hospital'

interface AddDiagnosisDrawerProps extends BaseDrawerProps {
  onSuccess?: (payload: any) => void
  categoryOptions?: any[]
  medicalRecordId?: string | number
}

interface FormValues {
  category: any
  label_name: string
}

const schema = yup.object().shape({
  category: yup.object().nullable().required('Category is required'),
  label_name: yup.string().trim().required('Label is required')
})

const AddDiagnosisDrawer = (props: AddDiagnosisDrawerProps) => {
  const { open, onClose, onSuccess, categoryOptions: initialCategoryOptions, medicalRecordId } = props
  const theme: any = useTheme()
  const [loading, setLoading] = useState(false)
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState<any[]>(initialCategoryOptions || [])
  const [categoryLoading, setCategoryLoading] = useState(false)

  const defaultValues: FormValues = {
    category: null,
    label_name: ''
  }

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema) as any,
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  useEffect(() => {
    setCategoryOptions(initialCategoryOptions || [])
  }, [initialCategoryOptions])

  // Fetch categories from API
  const fetchCategories = async (): Promise<any[]> => {
    try {
      setCategoryLoading(true)

      const params = {
        include_all: 1,
        type: 'diagnosis',
        request_from: 'web_hospital',
        medical_record_id: medicalRecordId || ''
      }
      const res: any = await getDiagnosisList(params)
      if (res?.success) {
        const categories = res.data?.result || []
        setCategoryOptions(categories)

        return categories
      }

      return []
    } catch (error) {
      console.error('Error fetching categories:', error)
      Toaster({ type: 'error', message: 'Failed to fetch categories' })

      return []
    } finally {
      setCategoryLoading(false)
    }
  }

  const onSubmit = async (params: FormValues) => {
    const payload = {
      label: params?.label_name,
      category_id: params?.category?.id
    }

    try {
      setLoading(true)
      const response: any = await addMedicalComplaintOrDiagnosis('diagnosis', payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Clinical assessment added successfully' })
        reset(defaultValues)
        onClose()
        if (onSuccess) {
          onSuccess({
            name: params?.label_name,
            id: response?.data
          })
        }
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to add clinical assessment' })
      }
    } catch (error: any) {
      console.error('Error adding diagnosis:', error)
      Toaster({ type: 'error', message: error.message || 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryAdded = async (newCategory: any) => {
    // Refetch categories to get the updated list
    const updatedCategories = await fetchCategories()

    // Find and auto-select the newly added category
    const addedCategory = updatedCategories.find((cat: any) => cat.id == newCategory.id)

    if (addedCategory) {
      setValue('category', addedCategory)
    } else if (newCategory) {
      // Fallback: if not found in the list, use the passed category
      setValue('category', newCategory)
    }
  }

  const handleClose = () => {
    reset(defaultValues)
    onClose()
  }

  return (
    <>
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
          zIndex: 1300
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
              <Typography variant='h6'>Add Clinical Assessment</Typography>
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
                label='Clinical Assessment*'
                placeholder='Clinical Assessment'
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <ControlledAutocomplete
                  name='category'
                  control={control}
                  errors={errors}
                  label='Category*'
                  options={categoryOptions?.filter((cat: any) => cat.id !== '0') || []}
                  loading={categoryLoading}
                  required
                  getOptionLabel={(option: any) => option?.category || option?.label || ''}
                  isOptionEqualToValue={(option: any, value: any) => {
                    if (!option || !value) return false
                    const optionId = option.id
                    const valueId = value.id

                    return optionId === valueId
                  }}
                />
                <IconButton
                  onClick={() => setCategoryDrawerOpen(true)}
                  sx={{
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: 1,
                    height: '56px',
                    width: '56px'
                  }}
                >
                  <Icon icon='mdi:plus' fontSize={28} />
                </IconButton>
              </Box>

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
                    zIndex: 1301
                  }}
                >
                  <LoadingButton fullWidth variant='contained' type='submit' size='large' loading={loading}>
                    Add Clinical Assessment
                  </LoadingButton>
                </Box>
              </Box>
            </Box>
          </form>
        </Box>
      </Drawer>

      {categoryDrawerOpen && (
        <AddCategoryDrawer
          open={categoryDrawerOpen}
          onClose={() => setCategoryDrawerOpen(false)}
          onSuccess={handleCategoryAdded}
          type='diagnosis'
        />
      )}
    </>
  )
}

export default AddDiagnosisDrawer
