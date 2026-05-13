'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { Button, Typography, styled, Box, useTheme, Grid, IconButton, Tooltip } from '@mui/material'
import { useTranslation } from 'react-i18next'
import Icon from 'src/@core/components/icon'
import { Add as AddIcon } from '@mui/icons-material'
import { useFormContext } from 'react-hook-form'
import dayjs from 'dayjs'

import AddReversalDrug from './AddReversalDrug'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import { deliveryRouteList } from 'src/lib/api/hospital/anesthesia'
import { getMedicineProductList } from 'src/lib/api/hospital/anesthesia'
import Toaster from 'src/components/Toaster'

interface RecoveryAndReversalProps {
  unitList?: any[]
  recoveryTypeOptions?: any[]
  anesthesiaRatingOptions?: any[]
  onAddReversalDrug?: (data: any) => void
  onUpdateReversalDrug?: (index: number, data: any) => void
  onDeleteReversalDrug?: (index: number, id: any) => void
}

function RecoveryAndReversal({
  unitList = [],
  recoveryTypeOptions = [],
  anesthesiaRatingOptions = [],
  onAddReversalDrug,
  onUpdateReversalDrug,
  onDeleteReversalDrug
}: RecoveryAndReversalProps) {
  const { t } = useTranslation()
  const theme: any = useTheme()
  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [editIndex, setEditIndex] = useState<any>(null)
  const [submitLoader, setSubmitLoader] = useState<boolean>(false)
  const [deliveryRouteOptionsState, setDeliveryRouteOptionsState] = useState<any[]>([])
  const [medicationGasList, setMedicationGasList] = useState<any[]>([])
  const [productPage, setProductPage] = useState<number>(1)
  const [productTotal, setProductTotal] = useState<number>(0)
  const [isProductLoading, setIsProductLoading] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')

  const {
    control,
    watch,
    setValue,
    getValues,
    formState: { errors }
  } = useFormContext()
  const reversalDrugs: any[] = watch('recoveryAndReversal.reversalDrugs') || []
  const recoveryType = watch('recoveryAndReversal.recovery_type')
  const recoveryFirstEffect = watch('recoveryAndReversal.recovery_first_effect')
  const recoveryFullEffect = watch('recoveryAndReversal.recovery_full_effect')

  const fetchDeliveryList = async () => {
    try {
      const response: any = await (deliveryRouteList as any)()

      if (response?.success && response?.data?.length > 0) {
        setDeliveryRouteOptionsState(response?.data)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {}
  }

  useEffect(() => {
    const now = dayjs()

    if (!recoveryFirstEffect) {
      setValue('recoveryAndReversal.recovery_first_effect', now, {
        shouldValidate: true,
        shouldDirty: false
      })
    }

    if (!recoveryFullEffect) {
      setValue('recoveryAndReversal.recovery_full_effect', now, {
        shouldValidate: true,
        shouldDirty: false
      })
    }
  }, [recoveryFirstEffect, recoveryFullEffect, setValue])

  const fetchMedicationGasList = async (pageToLoad: number = 1, append: boolean = false, q: string = '') => {
    if (isProductLoading) return

    setIsProductLoading(true)

    const params = {
      sort: 'asc',
      q,
      limit: 50,
      screen: 'Medicine',
      page_no: pageToLoad
    }
    try {
      const response: any = await getMedicineProductList({ params } as any)

      if (response?.success && response?.data?.brand_name?.result?.length > 0) {
        const newItems = response?.data?.brand_name?.result || []
        const totalCount = response?.data?.brand_name?.count || 0

        setProductTotal(totalCount)
        setMedicationGasList((prev: any[]) => (append ? [...prev, ...newItems] : newItems))
        setProductPage(pageToLoad)
      }
    } catch (error) {
      Toaster({ type: 'error', message: t('hospital_module.failed_to_fetch_products') })
    } finally {
      setIsProductLoading(false)
    }
  }

  useEffect(() => {
    if (openDrawer) {
      fetchDeliveryList()
    }
  }, [openDrawer])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)

    return () => clearTimeout(handler)
  }, [searchTerm])

  useEffect(() => {
    if (openDrawer) {
      fetchMedicationGasList(1, false, debouncedSearch)
    }
  }, [debouncedSearch, openDrawer])

  const hasMoreProducts = medicationGasList.length < productTotal

  const getUnitAbbr = (unitId: any) => {
    const unit = unitList?.find((item: any) => String(item.id) === String(unitId))

    return unit?.uom_abbr || '-'
  }

  const safeFormat = (v: any) => {
    if (!v) return '-'
    const d = dayjs(v)

    return d.isValid() ? d.format('hh:mm A') : '-'
  }

  const parseTimeFromDrawer = (v: any) => {
    if (!v) return null
    if (dayjs.isDayjs(v)) return v
    if (v instanceof Date) return dayjs(v)

    const s = String(v).trim()
    const formats = ['YYYY-MM-DD HH:mm:ss', 'HH:mm:ss', 'HH:mm', 'hh:mm A', 'hh:mm a']
    for (const f of formats) {
      const p = dayjs(s, f, true)
      if (p.isValid()) {
        if (f === 'HH:mm' || f === 'HH:mm:ss' || f === 'hh:mm A' || f === 'hh:mm a') {
          const today = dayjs().format('YYYY-MM-DD')
          const candidate = dayjs(`${today} ${p.format('HH:mm:ss')}`, 'YYYY-MM-DD HH:mm:ss', true)
          if (candidate.isValid()) return candidate
        }

        return p
      }
    }

    const loose = dayjs(s)

    return loose.isValid() ? loose : null
  }

  const asStorageString = (d: any) => {
    if (!d) return ''
    const parsed = parseTimeFromDrawer(d)

    return parsed && parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : ''
  }

  const handleEditDrug = (index: number) => {
    setEditIndex(index)
    setOpenDrawer(true)
  }

  const handleSubmitData = useCallback(
    async (payload: any) => {
      setSubmitLoader(true)
      try {
        const normalized = {
          ...payload,
          delivery_time: asStorageString(payload.delivery_time),
          max_effect_time: asStorageString(payload.max_effect_time)
        }

        if (editIndex !== null) {
          onUpdateReversalDrug && onUpdateReversalDrug(editIndex, normalized)
        } else {
          onAddReversalDrug && onAddReversalDrug(normalized)
        }
      } catch (error) {
      } finally {
        setSubmitLoader(false)
        setOpenDrawer(false)
        setEditIndex(null)
      }
    },
    [editIndex, onAddReversalDrug, onUpdateReversalDrug]
  )

  const handleCloseDrawer = () => {
    setOpenDrawer(false)
    setEditIndex(null)
  }

  const drugColumns: any[] = [
    {
      field: 'id',
      headerName: 'Sl.NO',
      minWidth: 80,
      flex: 1,
      sortable: false,
      renderCell: (params: any) => <StyledTypography sx={{ pl: 5 }}>{params.row.id}</StyledTypography>
    },
    {
      field: 'drug_name',
      headerName: t('drug'),
      minWidth: 260,
      flex: 1,
      sortable: false,
      renderCell: (params: any) => (
        <TextEllipsisWithModal
          enableDialog={false}
          text={params.row.drug_name?.name ?? '-'}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500,
            pl: 2,
            maxWidth: '240px'
          }}
        />
      )
    },
    {
      field: 'amount',
      headerName: t('amount'),
      minWidth: 100,
      sortable: false,
      renderCell: (params: any) => (
        <StyledTypography>
          {params.row.amount} {getUnitAbbr(params.row.unit)}
        </StyledTypography>
      )
    },
    {
      field: 'route',
      headerName: t('delivery_route'),
      minWidth: 140,
      sortable: false,
      renderCell: (params: any) => <StyledTypography>{params.row.delivery_route?.delivery || ''}</StyledTypography>
    },
    {
      field: 'delivery_time',
      headerName: t('hospital_module.delivery_time'),
      minWidth: 130,
      sortable: false,
      renderCell: (params: any) => {
        return <StyledTypography>{params.row.display_delivery_time ?? '-'}</StyledTypography>
      }
    },
    {
      field: 'delivery_status',
      headerName: t('hospital_module.delivery'),
      minWidth: 120,
      sortable: false,
      renderCell: (params: any) => <StyledTypography>{params.row.delivery_status || '-'}</StyledTypography>
    },
    {
      field: 'max_effect_time',
      headerName: t('hospital_module.max_effect'),
      minWidth: 130,
      sortable: false,
      renderCell: (params: any) => {
        return <StyledTypography>{params.row.display_max_effect_time ?? '-'}</StyledTypography>
      }
    },
    {
      field: 'actions',
      headerName: t('action'),
      headerAlign: 'center',
      align: 'center',
      width: 120,
      sortable: false,
      renderCell: (params: any) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {params?.row?.reversal_row_id !== undefined ? (
            <>
              <Tooltip title={(t('edit') as string)}>
                <IconButton size='small' onClick={() => handleEditDrug(params.row.id - 1)}>
                  <Icon icon='mdi:pencil-outline' fontSize={20} color={theme.palette.customColors.OnSurfaceVariant} />
                </IconButton>
              </Tooltip>

              <Tooltip title={(t('delete') as string)}>
                <IconButton
                  size='small'
                  onClick={() => onDeleteReversalDrug && onDeleteReversalDrug(params.row.id - 1, params?.row?.reversal_row_id)}
                >
                  <Icon icon='mdi:delete-outline' fontSize={20} color={theme.palette.customColors.Error} />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            '-'
          )}
        </Box>
      )
    }
  ]

  const reversalDrugsData = reversalDrugs.map((drug: any, index: number) => ({
    ...drug,
    reversal_row_id: drug?.id,
    id: index + 1,
    display_delivery_time: safeFormat(drug.delivery_time),
    display_max_effect_time: safeFormat(drug.max_effect_time)
  }))

  return (
    <Box>
      {reversalDrugs?.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', mb: 4 }}>
          <Button
            variant='outlined'
            endIcon={<AddIcon />}
            onClick={() => {
              setEditIndex(null)
              setOpenDrawer(true)
            }}
            sx={{
              flex: 1,
              py: '8px',
              borderRadius: '8px',
              borderColor: theme.palette.primary.main,
              fontSize: '1rem',
              fontWeight: 500
            }}
          >
            {t('hospital_module.add_reversal_drug')}
          </Button>
        </Box>
      ) : (
        ''
      )}

      {reversalDrugs.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <StyledTypography {...({ fontSize: '1rem', fontWeight: 600 } as any)}>
              {t('hospital_module.reversal_drug_section')} - {reversalDrugs.length}
            </StyledTypography>
            <Button
              variant='contained'
              endIcon={<AddIcon />}
              onClick={() => {
                setEditIndex(null)
                setOpenDrawer(true)
              }}
            >
              {t('add_new')}
            </Button>
          </Box>

          <CommonTable
            columns={drugColumns}
            indexedRows={reversalDrugsData}
            rowHeight={64}
            total={reversalDrugsData?.length || 0}
            hideFooterPagination
            externalTableStyle={{
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: theme.palette.customColors.neutral05,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: theme.palette.customColors.OnSurfaceVariant
              }
            }}
          />
        </>
      )}

      <Box sx={{ width: '100%', mt: 6 }}>
        <Typography
          sx={{
            fontSize: '1rem',
            fontWeight: 600,
            mb: 6,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {t('hospital_module.recovery_details')}
        </Typography>
        <Grid container spacing={6}>
          <Grid size={{ xs: 4 }}>
            <ControlledSelect
              control={control}
              name='recoveryAndReversal.recovery_type'
              errors={errors}
              label={`${t('hospital_module.recovery_type')}*`}
              options={recoveryTypeOptions}
              getOptionLabel={(option: any) => option.label}
              getOptionValue={(option: any) => option.value}
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <ControlledTimePicker
              control={control}
              name={'recoveryAndReversal.recovery_first_effect'}
              label={`${t('hospital_module.recovery_first_effect')}*`}
              errors={errors}
              inputProps={{ 'data-field': 'recovery_first_effect' }}
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <ControlledTimePicker
              control={control}
              name={'recoveryAndReversal.recovery_full_effect'}
              label={`${t('hospital_module.recovery_full_effect')}*`}
              errors={errors}
              inputProps={{ 'data-field': 'recovery_full_effect' }}
            />
          </Grid>
          {recoveryType === 'Problem' && (
            <Grid size={{ xs: 12 }}>
              <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, mb: 2 }}>
                {t('hospital_module.describe_the_problem')}
              </Typography>
              <ControlledTextArea
                name='recoveryAndReversal.describe_problem'
                control={control}
                placeholder={(t('hospital_module.enter_the_problem') as string)}
                fullWidth={true}
                rows={2}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12 }}>
            <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, mb: 2 }}>{t('notes')}</Typography>
            <ControlledTextArea
              name='recoveryAndReversal.notes'
              control={control}
              placeholder={(t('hospital_module.enter_notes') as string)}
              fullWidth={true}
              rows={2}
              inputBackgroundColor={theme.palette.customColors.Notes}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <StyledTypography {...({ fontSize: '1rem', fontWeight: 600 } as any)}>
              {t('hospital_module.anesthesia_ratings')}
            </StyledTypography>
          </Grid>
          <Grid size={{ xs: 3 }}>
            <ControlledSelect
              control={control}
              name='recoveryAndReversal.induction'
              errors={errors}
              label={`${t('hospital_module.induction')}*`}
              options={anesthesiaRatingOptions}
              getOptionLabel={(option: any) => option.label}
              getOptionValue={(option: any) => option.value}
            />
          </Grid>
          <Grid size={{ xs: 3 }}>
            <ControlledSelect
              control={control}
              name='recoveryAndReversal.tolerance'
              errors={errors}
              label={`${t('hospital_module.tolerance')}*`}
              options={anesthesiaRatingOptions}
              getOptionLabel={(option: any) => option.label}
              getOptionValue={(option: any) => option.value}
            />
          </Grid>
          <Grid size={{ xs: 3 }}>
            <ControlledSelect
              control={control}
              name='recoveryAndReversal.recovery'
              errors={errors}
              label={`${t('hospital_module.recovery')}*`}
              options={anesthesiaRatingOptions}
              getOptionLabel={(option: any) => option.label}
              getOptionValue={(option: any) => option.value}
            />
          </Grid>
          <Grid size={{ xs: 3 }}>
            <ControlledSelect
              control={control}
              name='recoveryAndReversal.overall'
              errors={errors}
              label={`${t('hospital_module.overall')}*`}
              options={anesthesiaRatingOptions}
              getOptionLabel={(option: any) => option.label}
              getOptionValue={(option: any) => option.value}
            />
          </Grid>
        </Grid>
      </Box>

      {openDrawer && (
        <AddReversalDrug
          handleSidebarOpen={openDrawer}
          handleSubmitData={handleSubmitData}
          handleSidebarClose={handleCloseDrawer}
          submitLoader={submitLoader}
          editData={editIndex !== null ? reversalDrugs[editIndex] : null}
          {...({
            drugOptions: medicationGasList,
            existingMedications: reversalDrugs,
            unitList: unitList,
            deliveryRouteOptions: deliveryRouteOptionsState,
            onSearch: setSearchTerm,
            onLoadMoreDrugs: () => {
              if (hasMoreProducts && !isProductLoading) {
                fetchMedicationGasList(productPage + 1, true, debouncedSearch)
              }
            },
            hasMoreDrugs: hasMoreProducts,
            isLoadingDrugs: isProductLoading
          } as any)}
        />
      )}
    </Box>
  )
}

export default RecoveryAndReversal

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color, sx = {} }: any) => ({
  fontSize: fontSize || '14px',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant,
  paddingLeft: '8px',
  ...sx
}))
