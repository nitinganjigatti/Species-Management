'use client'

import React, { useContext, useEffect, useMemo } from 'react'

import { useTheme, Card, Typography, IconButton, Drawer, Box, Grid } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useTranslation } from 'react-i18next'

import Icon from 'src/@core/components/icon'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'

import { AuthContext } from 'src/context/AuthContext'
import { useHospital } from 'src/context/HospitalContext'

const createSchema = (t: (key: string) => string) =>
  yup.object().shape({
    site_id: yup
      .object()
      .shape({
        site_id: yup.string().required(t('hospital_module.site_id_required')),
        site_name: yup.string().required(t('hospital_module.site_name_required'))
      })
      .required(t('hospital_module.site_name_required')),
    bed_name: yup.string().trim().required(t('hospital_module.enclosure_name_required')),
    prefix: yup.string().trim().required(t('hospital_module.bed_code_required')),
    no_of_bed: yup
      .number()
      .typeError(t('hospital_module.number_of_enclosures_must_be_a_number'))
      .required(t('hospital_module.number_of_enclosures_required'))
      .positive(t('hospital_module.number_of_enclosures_must_be_greater_than_zero'))
      .integer(t('hospital_module.number_of_enclosures_must_be_an_integer'))
      .required(t('hospital_module.number_of_enclosures_required'))
  })

const defaultValues: any = {
  site_id: null,
  bed_name: '',
  prefix: '',
  no_of_bed: null
}

interface AddEnclosuresProps {
  handleSidebarOpen?: boolean
  handleSidebarClose: () => void
  submitLoader?: boolean
  editParams?: any
  handleSubmitData: (payload: any) => Promise<any>
  resetForm?: boolean
}

const AddEnclosures = (props: AddEnclosuresProps) => {
  const { handleSidebarOpen, handleSidebarClose, submitLoader, editParams, handleSubmitData, resetForm } = props
  const { t } = useTranslation()
  const theme: any = useTheme()
  const authData: any = useContext(AuthContext)
  const { selectedHospital }: any = useHospital()

  const sitesList: any[] = useMemo(() => {
    return authData?.userData?.user?.zoos?.[0]?.sites || []
  }, [authData])

  const schema = useMemo(() => createSchema(t as (key: string) => string), [t])

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<any>({
    defaultValues,
    resolver: yupResolver(schema) as any,
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const onSubmit = async (data: any) => {
    const payLoad = {
      hospital_id: selectedHospital?.id,
      site_id: data?.site_id?.site_id,
      bed_name: data?.bed_name,
      prefix: data?.prefix,
      no_of_bed: data?.no_of_bed
    }
    try {
      await handleSubmitData(payLoad)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  useEffect(() => {
    if (editParams?.id) {
      const selectedSite = sitesList?.find((site: any) => site?.site_id === Number(editParams?.site_id))

      const prefill = {
        bed_name: editParams?.bed_name,
        prefix: editParams?.prefix,
        no_of_bed: editParams?.no_of_bed,
        site_id: selectedSite
      }

      reset(prefill)
    } else if (resetForm) {
      reset(defaultValues)
    }
  }, [resetForm, editParams, reset])

  return (
    <Drawer
      anchor='right'
      open={handleSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 500] } }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 6,
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
        }}
      >
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <Box component='img' src='/icons/activity_icon.png' sx={{ width: '30px', height: '30px' }} alt='Filter Icon'
          />
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {editParams?.id !== null ? t('hospital_module.edit_enclosure') : t('hospital_module.add_new_enclosure')}
          </Typography>
        </Box>
        <IconButton
          size='small'
          onClick={() => {
            reset(defaultValues)
            handleSidebarClose()
          }}
          sx={{ color: theme.palette.text.primary }}
        >
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      <Box
        className='sidebar-body'
        sx={{
          backgroundColor: theme.palette.background.default,
          p: 6,
          flexGrow: 1
        }}
      >
        <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : undefined}>
          <Card sx={{ p: 6, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12 }}>
                <ControlledAutocomplete
                  control={control}
                  name={'site_id'}
                  errors={errors}
                  label={t('hospital_module.site_name') as string}
                  options={sitesList}
                  getOptionLabel={(option: any) => option?.site_name || ''}
                  isOptionEqualToValue={(option: any, value: any) => option?.site_id === value?.site_id}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <ControlledTextField
                  name={'bed_name'}
                  control={control}
                  errors={errors}
                  label={t('hospital_module.enclosure_name') as string}
                  placeholder={t('hospital_module.enter_enclosure_name') as string}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ControlledTextField
                  name={'prefix'}
                  control={control}
                  errors={errors}
                  label={t('hospital_module.bed_code') as string}
                  placeholder={t('hospital_module.enter_bed_code') as string}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ControlledTextField
                  name={'no_of_bed'}
                  control={control}
                  errors={errors}
                  label={t('hospital_module.number_of_enclosures') as string}
                  placeholder={t('hospital_module.enter_number_of_enclosures') as string}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Card>
          {/* Footer button */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              p: 4,
              display: 'flex',
              justifyContent: 'center',
              boxShadow: '0px -2px 6px rgba(0, 0, 0, 0.1)',
              backgroundColor: theme.palette.background.paper
            }}
          >
            <LoadingButton variant='contained' type='submit' loading={submitLoader} sx={{ flex: 1, py: 2 }}>
              {editParams?.id ? t('update') : t('add')}
            </LoadingButton>
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddEnclosures
