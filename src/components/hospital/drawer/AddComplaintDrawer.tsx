'use client'

import { useEffect, useState } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import { Box, Drawer, IconButton, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import Toaster from 'src/components/Toaster'
import { getCategoriesList, addMedicalComplaintOrDiagnosis } from 'src/lib/api/medical/masters'
import AddCategoryDrawer from './AddCategoryDrawer'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'

interface AddComplaintDrawerProps {
  open: boolean
  setOpen: (open: boolean) => void
  onComplaintAdded?: (complaint: any) => void
}

interface FormValues {
  category: any
  label_name: string
}

const schema = yup.object().shape({
  category: yup.object().nullable().required('Category is required'),
  label_name: yup.string().trim().required('Label is required')
})

const AddComplaintDrawer = (props: AddComplaintDrawerProps) => {
  const { open, setOpen, onComplaintAdded } = props
  const theme: any = useTheme()
  const [loading, setLoading] = useState(false)
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
  const [categoriesList, setCategoriesList] = useState<any[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

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
    mode: 'onBlur'
  })

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)

      const params = {
        type: 'complaints',
        q: ''
      }
      const response: any = await getCategoriesList({ params })
      if (response?.success) {
        setCategoriesList(response?.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setCategoriesLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchCategories()
    }
  }, [open])

  const onSubmit = async (params: FormValues) => {
    try {
      setLoading(true)

      const payload = {
        label: params?.label_name,
        category_id: params?.category?.med_cat_id
      }

      const response: any = await addMedicalComplaintOrDiagnosis('complaints', payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        console.log('Added complaint response:', response)
        reset(defaultValues)
        setOpen(false)
        if (onComplaintAdded) {
          onComplaintAdded({
            name: params?.label_name,
            id: response?.data
          })
        }
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      Toaster({ type: 'error', message: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryAdded = async (newCategory: any) => {
    const updatedCategories: any = await fetchCategories()

    // Find and auto-select the newly added category
    const addedCategory = updatedCategories?.find((cat: any) => cat.id == newCategory.id)

    if (addedCategory) {
      setValue('category', addedCategory)
    } else if (newCategory) {
      // Fallback: if not found in the list, use the passed category
      setValue('category', newCategory)
    }
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '550px'] }
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
              <Typography variant='h6'>Add Symptom</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={() => setOpen(false)} sx={{ color: 'text.primary' }}>
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
                label='Symptom*'
                placeholder='Symptom'
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <ControlledAutocomplete
                  name='category'
                  control={control}
                  errors={errors}
                  label='Category*'
                  options={categoriesList}
                  loading={categoriesLoading}
                  required
                  getOptionLabel={(option: any) => option?.category || option?.label || ''}
                  isOptionEqualToValue={(option: any, value: any) => {
                    if (!option || !value) return false
                    const optionId = option.med_cat_id || option.id
                    const valueId = value.med_cat_id || value.id

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
                    zIndex: 1234
                  }}
                >
                  <LoadingButton fullWidth variant='contained' type='submit' size='large' loading={loading}>
                    Add Symptom
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
          type='complaints'
        />
      )}
    </>
  )
}

export default AddComplaintDrawer
