'use client'

import { useEffect, useState } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import { Box, Drawer, IconButton, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import Toaster from 'src/components/Toaster'
import { getCategoriesList, addMedicalComplaintOrDiagnosis } from 'src/lib/api/medical/masters'
import AddCategoryDrawer from './AddCategoryDrawer'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import { AddSymptomsPayload, AddSymptomsResponse } from 'src/types/hospital/api/Inpatient/symptoms'
import { Category } from 'src/types/hospital/models'
import { CategoryResponse } from 'src/types/hospital/api/Inpatient/symptomClinical'

interface AddComplaintDrawerProps {
  open: boolean
  setOpen: (open: boolean) => void
  onComplaintAdded?: (complaint: any) => void
}

interface FormValues {
  category: any
  label_name: string
}

const createSchema = (t: any) => yup.object().shape({
  category: yup.object().nullable().required(t('hospital_module.category_is_required') || 'Category is required'),
  label_name: yup.string().trim().required(t('hospital_module.label_is_required') || 'Label is required')
})

const AddComplaintDrawer = (props: AddComplaintDrawerProps) => {
  const { open, setOpen, onComplaintAdded } = props
  const theme: any = useTheme()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
  const [categoriesList, setCategoriesList] = useState<any[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  const defaultValues: FormValues = {
    category: null,
    label_name: ''
  }

  const validationSchema = createSchema(t)

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(validationSchema) as any,
    mode: 'onBlur'
  })

  const fetchCategories = async (): Promise<Category[]>  => {
    try {
      setCategoriesLoading(true)

      const params = {
        type: 'complaints',
        q: ''
      }
      const response: CategoryResponse = await getCategoriesList({ params })
      if (response?.success) {
        const data = response?.data || []
        setCategoriesList(data)
        return data
      }
      return []
    } catch (error) {
      console.error('Error fetching categories:', error)
      return [] 
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

      const payload: AddSymptomsPayload = {
        label: params?.label_name,
        category_id: params?.category?.med_cat_id
      }

      const response: AddSymptomsResponse = await addMedicalComplaintOrDiagnosis('complaints', payload)

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
      Toaster({ type: 'error', message: t('hospital_module.something_went_wrong') || 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryAdded = async (newCategory: Category) => {
    const updatedCategories: Category[] = await fetchCategories()

    // Find and auto-select the newly added category
    const addedCategory = updatedCategories?.find((cat) => cat.id == newCategory.id)

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
              <Typography variant='h6'>{t('hospital_module.add_complaint')}</Typography>
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
                label={t('hospital_module.complaint') + '*'}
                placeholder={(t('hospital_module.complaint') as string)}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <ControlledAutocomplete
                  name='category'
                  control={control}
                  errors={errors}
                  label={t('hospital_module.category') + '*'}
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
                    {t('hospital_module.add_complaint')}
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
