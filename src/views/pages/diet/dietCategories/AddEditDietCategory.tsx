import React, { useEffect, useCallback, Fragment } from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import { RadioGroup, FormLabel, Radio } from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import { useForm, Controller } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import { getDietCategoryById } from 'src/lib/api/diet/settings/dietCategory'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import { useTranslation } from 'react-i18next'

const schema = yup.object().shape({
  label: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .required('Diet Category Name is required'),
  active: yup.string().nullable()
})

const defaultValues = {
  label: '',
  active: '1'
}

interface Props {
  addEventSidebarOpen: boolean
  handleSidebarClose: (...args: any[]) => void
  handleSubmitData: (...args: any[]) => void
  resetForm: any
  submitLoader: boolean
  editParams: any
}

const AddEditDietCategory = (props: Props) => {
  const { addEventSidebarOpen, handleSidebarClose, handleSubmitData, resetForm, submitLoader, editParams } = props
  const { t } = useTranslation()
  const {
    reset,
    control,
    watch,
    handleSubmit,
    formState: { errors }
  } = useForm<any>({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const onSubmit = async (params: any) => {
    const { label, active } = params

    const payload = {
      label: label.trim(),
      active: active
    }

    await handleSubmitData(payload)
  }

  const getDietCategory = useCallback(
    async (id: any) => {
      const response = await getDietCategoryById(id)
      if (response?.success) {
        console.log('response?.data', response?.data)
        reset({
          label: response.data.label || '',
          active: response.data.active === '1' ? '1' : '0'
        })
      }
    },
    [reset]
  )

  useEffect(() => {
    reset()
    if (resetForm) {
      reset(defaultValues)
    }
    console.log('editParams?.id', editParams?.id)
    if (editParams?.id) {
      getDietCategory(editParams.id)
    }
  }, [resetForm, editParams, reset, getDietCategory])

  const RenderSidebarFooter = () => {
    return (
      <Fragment>
        <LoadingButton disabled={!watch('label')} size='large' type='submit' variant='contained' loading={submitLoader}>
          {editParams?.id ? 'Update' : 'Add'}
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
          p: (theme: any) => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Typography variant='h6'>
          {editParams?.id ? 'Update' : 'Add'} {t('navigation.diet_category')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size='small' onClick={handleSidebarClose} sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
      </Box>

      <Box className='sidebar-body' sx={{ p: (theme: any) => theme.spacing(5, 6) }}>
        <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : undefined}>
          <ControlledTextField
            name='label'
            label={t('diet_module.diet_category_name')}
            control={control}
            errors={errors}
            required={true}
            inputProps={{ placeholder: t('diet_module.diet_category_name') }}
            sx={{ mb: 6 }}
          />
          {editParams?.id && (
            <FormControl fullWidth sx={{ mb: 6 }} error={Boolean(errors.active)}>
              <FormLabel>{t('status')}</FormLabel>
              <Controller
                name='active'
                control={control}
                render={({ field }: any) => (
                  <RadioGroup row {...field}>
                    <FormControlLabel
                      value='1'
                      label='Active'
                      control={<Radio />}
                      sx={errors.active ? { color: 'error.main' } : null}
                    />
                    <FormControlLabel
                      value='0'
                      label='Inactive'
                      control={<Radio />}
                      sx={errors.active ? { color: 'error.main' } : null}
                    />
                  </RadioGroup>
                )}
              />
            </FormControl>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RenderSidebarFooter />
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default React.memo(AddEditDietCategory)
