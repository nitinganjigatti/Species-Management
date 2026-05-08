import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Drawer,
  FormControl,
  FormHelperText,
  IconButton,
  TextField,
  Typography,
  Button,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import { getLabSampleListById } from 'src/lib/api/lab/master'
import type { AddSampleProps } from 'src/types/lab'

const schema = yup.object().shape({
  test_name: yup.string().trim().required('Test name is required')
})

interface SampleFormValues {
  test_name: string
}

const defaultValues: SampleFormValues = {
  test_name: ''
}

const AddSample = (props: AddSampleProps) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const { addEventSidebarOpen, setOpenDrawer, handleSubmitData, resetForm, submitLoader, editParams } = props

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<SampleFormValues>({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const getLabTestById = useCallback(
    async (id: number | string) => {
      const params = {
        id
      }
      const response = await getLabSampleListById(params)

      if (response?.success) {
        const result = response.data?.result as unknown as import('src/types/lab').LabSampleMaster | undefined
        const data = {
          ...result,
          test_name: result?.label,
          description: result?.lab_test_count
        }
        reset(data as SampleFormValues)
      }
    },
    [reset]
  )

  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
    }
    if (editParams?.id !== null) {
      getLabTestById(editParams?.id as number)
    }
  }, [resetForm, editParams, reset, getLabTestById])

  const onSubmit = async (params: SampleFormValues) => {
    const { test_name } = { ...params }

    const payload = {
      label: test_name
    }
    await handleSubmitData(payload)
  }

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current && control._formValues.test_name) {
      inputRef.current.focus()
    }
  }, [control._formValues.test_name])

  useEffect(() => {
    if (addEventSidebarOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 200)
    }
  }, [addEventSidebarOpen])

  return (
    <>
      <Drawer
        anchor='right'
        open={addEventSidebarOpen}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '500px'] },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        <Box sx={{ width: '100%', height: '100%' }}>
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              p: (theme: { spacing: (...args: number[]) => string }) => theme.spacing(3, 3.255, 3, 5.255),
              px: '24px',
              backgroundColor: 'background.default'
            }}
          >
            <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <Typography variant='h6'>
                {editParams?.id !== null ? t('lab_module.edit_lab_sample_details') : t('lab_module.add_new_lab_sample')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={() => setOpenDrawer(false)} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} onClick={() => setOpenDrawer(false)} />
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
                backgroundColor: '#fff',
                borderRadius: '8px',
                maxHeight: '79vh'
              }}
            >
              <FormControl fullWidth sx={{ mt: 6 }}>
                <Controller
                  name='test_name'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      inputRef={inputRef}
                      label={`${t('lab_module.sample_name')}*`}
                      value={value}
                      onChange={onChange}
                      placeholder={t('lab_module.sample_name')}
                      error={Boolean(errors.test_name)}
                      name='test_name'
                    />
                  )}
                />
                {errors.test_name && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.test_name.message}</FormHelperText>
                )}
              </FormControl>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {editParams?.zoo_id !== 0 && (
                  <Box
                    sx={{
                      height: '6rem',
                      width: '100%',
                      maxWidth: '500px',
                      position: 'fixed',
                      bottom: 0,
                      px: 4,
                      bgcolor: 'white',
                      alignItems: 'center',
                      justifyContent: 'center',
                      display: 'flex',
                      zIndex: 1234,
                      gap: 2
                    }}
                  >
                    <Button
                      fullWidth
                      onClick={() => setOpenDrawer(false)}
                      size='large'
                      type='reset'
                      color='error'
                      variant='outlined'
                      disabled={submitLoader}
                    >
                      {t('cancel')}
                    </Button>
                    <LoadingButton fullWidth variant='contained' type='submit' size='large' loading={submitLoader}>
                      {editParams?.id !== null ? t('update') : t('submit')}
                    </LoadingButton>
                  </Box>
                )}
              </Box>
            </Box>
          </form>
        </Box>
      </Drawer>
    </>
  )
}

export default AddSample
