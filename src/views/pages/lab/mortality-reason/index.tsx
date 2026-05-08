import { useCallback, useEffect, Fragment, useRef } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import { Box, Drawer, FormControl, FormHelperText, IconButton, TextField, Typography } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import { getMortalityReasonsById } from 'src/lib/api/lab/mortality'
import type { AddMortalityReasonsProps } from 'src/types/lab'

const schema = yup.object().shape({
  name: yup.string().trim().required('Test mortality reason is required')
})

interface MortalityFormValues {
  name: string
  description: string
  active: boolean
}

const defaultValues: MortalityFormValues = {
  name: '',
  description: '',
  active: false
}

const AddMortalityReasons = (props: AddMortalityReasonsProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { addEventSidebarOpen, setOpenDrawer, handleSubmitData, resetForm, submitLoader, editParams } = props

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<MortalityFormValues>({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const getMortalityReasonById = useCallback(
    async (id: number) => {
      const response = await getMortalityReasonsById(id)
      if (response?.is_success) {
        const data = {
          ...response.data,
          name: (response.data as { name?: string })?.name ?? '',
          description: (response.data as { description?: string })?.description ?? '',
          active: (response.data as { active?: boolean })?.active ?? false
        }
        reset(data as MortalityFormValues)
      }
    },
    [reset]
  )

  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
    }

    if (editParams?.id !== null) {
      getMortalityReasonById(editParams?.id as number)
    }
  }, [resetForm, editParams, reset, getMortalityReasonById])

  const onSubmit = async (params: MortalityFormValues) => {
    const { name } = { ...params }

    const payload = {
      name
    }

    await handleSubmitData(payload)
  }

  useEffect(() => {
    if (inputRef.current && control._formValues.name) {
      inputRef.current.focus()
    }
  }, [control._formValues.name])

  const RenderSidebarFooter = () => {
    return (
      <Fragment>
        <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader}>
          {editParams?.id ? 'Update' : 'Add'}
        </LoadingButton>
      </Fragment>
    )
  }

  return (
    <>
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
            p: (theme: { spacing: (...args: number[]) => string }) => theme.spacing(3, 3.255, 3, 5.255)
          }}
        >
          <Typography variant='h6'>
            {editParams?.id !== null ? 'Edit Mortality Reason' : 'Add  Mortality Reason'}{' '}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size='small' onClick={() => setOpenDrawer(false)} sx={{ color: 'text.primary' }}>
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
        </Box>
        <Box className='sidebar-body' sx={{ p: (theme: { spacing: (...args: number[]) => string }) => theme.spacing(5, 6) }}>
          <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : undefined}>
            <FormControl fullWidth sx={{ mb: 6 }}>
              <Controller
                name='name'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    label='Reason*'
                    value={value}
                    inputRef={inputRef}
                    onChange={onChange}
                    placeholder='Reason'
                    error={Boolean(errors.name)}
                    name='name'
                  />
                )}
              />
              {errors.name && <FormHelperText sx={{ color: 'error.main' }}>{errors.name.message}</FormHelperText>}
            </FormControl>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <RenderSidebarFooter />
            </Box>
          </form>
        </Box>
      </Drawer>
    </>
  )
}

export default AddMortalityReasons
