'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Button, Typography, styled, Box, useTheme, IconButton, Tooltip } from '@mui/material'
import { Theme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import Icon from 'src/@core/components/icon'
import { Add as AddIcon } from '@mui/icons-material'
import { useFormContext } from 'react-hook-form'
import AddMedicationDrawer from './AddMedicationDrawer'
import AddGasDrawer from './AddGasDrawer'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import dayjs, { Dayjs } from 'dayjs'
import { deliveryRouteList } from 'src/lib/api/hospital/anesthesia'
import { getMedicineProductList } from 'src/lib/api/hospital/anesthesia'
import Toaster from 'src/components/Toaster'
import { Id } from 'src/types/hospital/models'
import { DeliveryRoute, MedicationDrugOption, UnitParams } from 'src/types/hospital/models/anesthesia'
import { SelectOption } from 'src/types/hospital/api'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { GetMedicineListResponse } from 'src/types/hospital/api/PrescriptionMonitoring/medicineBatch'
import { MedicationFormData, GasFormData } from 'src/components/hospital/shared/AddAnesthesiaRecordPage'

interface MedicationRow extends MedicationFormData {
  medication_row_id?: Id
  display_delivery_time?: string
  display_max_effect_time?: string
}

interface GasRow extends GasFormData {
  gas_row_id?: Id
  display_start_time?: string
  display_end_time?: string
}

interface MedicationsGasSectionProps {
  onAddMedication?: (data: MedicationFormData) => void
  onAddGas?: (data: GasFormData) => void
  onUpdateMedication?: (index: number, data: MedicationFormData) => void
  onUpdateGas?: (index: number, data: GasFormData) => void
  onDeleteMedication?: (index: number, id: Id) => void
  onDeleteGas?: (index: number, id: Id) => void
  purposeStageOptions?: SelectOption[]
  unitList?: UnitParams[]
}

function MedicationsGasSection({
  onAddMedication,
  onAddGas,
  onUpdateMedication,
  onUpdateGas,
  onDeleteMedication,
  onDeleteGas,
  purposeStageOptions,
  unitList
}: MedicationsGasSectionProps) {
  const { t } = useTranslation()
  const theme: Theme = useTheme()
  const [drawerType, setDrawerType] = useState<'medication' | 'gas' | null>(null)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [submitLoader, setSubmitLoader] = useState<boolean>(false)

  const [deliveryRouteOptions, setdeliveryRouteList] = useState<DeliveryRoute[]>([])
  const [medicationGasList, setmedicationGasList] = useState<MedicationDrugOption[]>([])
  const [productPage, setProductPage] = useState<number>(1)
  const [productTotal, setProductTotal] = useState<number>(0)
  const [isProductLoading, setIsProductLoading] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')

  const { watch } = useFormContext()
  const medications: MedicationFormData[] = (watch('medicationsGas.medications') as MedicationFormData[]) || []
  const gases: GasFormData[] = (watch('medicationsGas.gases') as GasFormData[]) || []

  const fetchDeliveryList = async () => {
    try {
      const response = await deliveryRouteList()

      if (response?.success && response?.data?.length > 0) {
        setdeliveryRouteList(response?.data)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {}
  }

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
      const response: GetMedicineListResponse = await getMedicineProductList({ params })
      if (response?.success === true && response?.data?.brand_name?.result?.length > 0) {
        const newItems = response?.data?.brand_name?.result || []
        const totalCount = Number(response?.data?.brand_name?.count) || 0

        setProductTotal(totalCount)
        setmedicationGasList((prev: MedicationDrugOption[]) => (append ? [...prev, ...newItems] : newItems))
        setProductPage(pageToLoad)
      }
    } catch (error) {
      Toaster({ type: 'error', message: t('hospital_module.failed_to_fetch_products') })
    } finally {
      setIsProductLoading(false)
    }
  }

  useEffect(() => {
    if (drawerType) {
      fetchDeliveryList()
    }
  }, [drawerType])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)

    return () => clearTimeout(handler)
  }, [searchTerm])

  useEffect(() => {
    if (drawerType) {
      fetchMedicationGasList(1, false, debouncedSearch)
    }
  }, [debouncedSearch, drawerType])

  const hasMoreProducts = medicationGasList.length < productTotal

  const getUnitAbbr = (unitId: Id | null | undefined) => {
    const unit = unitList?.find((item: UnitParams) => String(item.id) === String(unitId))

    return unit?.uom_abbr || '-'
  }

  const safeFormat = (v: string | Dayjs | null | undefined) => {
    if (!v) return '-'
    const d = dayjs(v)

    return d.isValid() ? d.format('hh:mm A') : '-'
  }

  const medicationColumns: GridColDef[] = [
    {
      field: 'id',
      headerName: t('sl_no'),
      minWidth: 80,
      flex: 1,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => <StyledTypography sx={{ pl: 5 }}>{params.row.id}</StyledTypography>
    },
    {
      field: 'drug',
      headerName: t('hospital_module.drug'),
      minWidth: 220,
      flex: 1,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        return (
          <TextEllipsisWithModal
            enableDialog={false}
            text={params.row.drug_name?.name ?? '-'}
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '14px',
              fontWeight: 500,
              pl: 2,
              maxWidth: '200px'
            }}
          />
        )
      }
    },
    {
      field: 'purpose_stage',
      headerName: t('hospital_module.purpose_stage'),
      minWidth: 180,
      flex: 1,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <TextEllipsisWithModal
          enableDialog={false}
          text={params.row.purpose_stage ?? '-'}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500,
            pl: 2,
            maxWidth: '150px'
          }}
        />
      )
    },
    {
      field: 'amount',
      headerName: t('amount'),
      minWidth: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <StyledTypography>
          {params.row.amount} {getUnitAbbr(params.row.unit)}
        </StyledTypography>
      )
    },
    {
      field: 'route',
      headerName: t('hospital_module.delivery_route'),
      minWidth: 140,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => <StyledTypography>{params.row.delivery_route?.delivery || ''}</StyledTypography>
    },
    {
      field: 'delivery_time',
      headerName: t('hospital_module.delivery_time'),
      minWidth: 130,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        return <StyledTypography>{params.row.display_delivery_time || '-'}</StyledTypography>
      }
    },
    {
      field: 'delivery',
      headerName: t('hospital_module.delivery'),
      minWidth: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => <StyledTypography>{params.row.delivery_status || '-'}</StyledTypography>
    },
    {
      field: 'notes',
      headerName: t('notes'),
      minWidth: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <TextEllipsisWithModal
          enableDialog={false}
          text={params.row.notes ?? '-'}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500,
            pl: 2,
            maxWidth: '170px'
          }}
        />
      )
    },
    {
      field: 'actions',
      headerName: t('action'),
      headerAlign: 'center',
      align: 'center',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {params?.row?.medication_row_id !== undefined ? (
            <>
              <Tooltip title={(t('edit') as string)}>
                <IconButton size='small' onClick={() => handleEditMedication(params.row.id - 1)}>
                  <Icon icon='mdi:pencil-outline' fontSize={20} color={theme.palette.customColors.OnSurfaceVariant} />
                </IconButton>
              </Tooltip>

              <Tooltip title={(t('delete') as string)}>
                <IconButton
                  size='small'
                  onClick={() => onDeleteMedication && onDeleteMedication(params.row.id - 1, params?.row?.medication_row_id)}
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

  const gasColumns: GridColDef[] = [
    {
      field: 'id',
      headerName: t('hospital_module.sl_no'),
      minWidth: 80,
      flex: 1,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => <StyledTypography sx={{ pl: 5 }}>{params.row.id}</StyledTypography>
    },
    {
      field: 'gas',
      headerName: t('hospital_module.gas'),
      minWidth: 220,
      flex: 1,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <TextEllipsisWithModal
            enableDialog={false}
            text={params.row.gas_name?.name ?? '-'}
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '14px',
              fontWeight: 500,
              pl: 2,
              maxWidth: '150px'
            }}
          />
        </Box>
      )
    },
    {
      field: 'o2_flow',
      headerName: t('hospital_module.o2_l_min'),
      minWidth: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => <StyledTypography>{params.row.o2_flow}</StyledTypography>
    },
    {
      field: 'concentration',
      headerName: t('hospital_module.concentration_percent'),
      minWidth: 180,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => <StyledTypography>{params.row.concentration}</StyledTypography>
    },
    {
      field: 'route',
      headerName: t('hospital_module.delivery_route'),
      minWidth: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => <StyledTypography>{params.row.delivery_route?.delivery || ''}</StyledTypography>
    },
    {
      field: 'start_time',
      headerName: t('hospital_module.start_time'),
      minWidth: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => <StyledTypography>{params.row.display_start_time ?? '-'}</StyledTypography>
    },
    {
      field: 'end_time',
      headerName: t('hospital_module.end_time'),
      minWidth: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => <StyledTypography>{params.row.display_end_time ?? '-'}</StyledTypography>
    },
    {
      field: 'actions',
      headerName: t('action'),
      headerAlign: 'center',
      align: 'center',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {params?.row?.gas_row_id !== undefined ? (
              <>
                <Tooltip title={(t('edit') as string)}>
                  <IconButton size='small' onClick={() => handleEditGas(params.row.id - 1)}>
                    <Icon icon='mdi:pencil-outline' fontSize={20} color={theme.palette.customColors.OnSurfaceVariant} />
                  </IconButton>
                </Tooltip>

                <Tooltip title={(t('delete') as string)}>
                  <IconButton size='small' onClick={() => onDeleteGas && onDeleteGas(params.row.id - 1, params?.row?.gas_row_id)}>
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
    }
  ]

  const handleEditMedication = (index: number) => {
    setEditIndex(index)
    setDrawerType('medication')
  }

  const handleEditGas = (index: number) => {
    setEditIndex(index)
    setDrawerType('gas')
  }

  const parseTimeFromDrawer = (v: string | Dayjs | Date | null | undefined) => {
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

  const asStorageString = (d: string | Dayjs | Date | null | undefined) => {
    if (!d) return ''
    const parsed = parseTimeFromDrawer(d)

    return parsed && parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : ''
  }

  const handleSubmitMedication = useCallback(
    async (payload: MedicationFormData) => {
      const normalized: MedicationFormData = {
        ...payload,
        delivery_time: asStorageString(payload.delivery_time),
        max_effect_time: asStorageString(payload.max_effect_time)
      }

      if (editIndex !== null) {
        onUpdateMedication && onUpdateMedication(editIndex, normalized)
      } else {
        onAddMedication && onAddMedication(normalized)
      }
    },
    [editIndex, onAddMedication, onUpdateMedication]
  )

  const handleSubmitGas = useCallback(
    async (payload: GasFormData) => {
      const normalized: GasFormData = {
        ...payload,
        start_time: asStorageString(payload.start_time),
        end_time: asStorageString(payload.end_time)
      }

      if (editIndex !== null) {
        onUpdateGas && onUpdateGas(editIndex, normalized)
      } else {
        onAddGas && onAddGas(normalized)
      }
    },
    [editIndex, onAddGas, onUpdateGas]
  )

  const handleCloseDrawer = () => {
    setDrawerType(null)
    setEditIndex(null)
  }

  const renderAddSection = (label: string, type: 'medication' | 'gas', buttonText: string) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      <Typography
        sx={{
          fontSize: '1rem',
          fontWeight: 600,
          color: theme.palette.customColors.OnSurfaceVariant
        }}
      >
        {label}
      </Typography>
      <Button
        variant='outlined'
        endIcon={<AddIcon />}
        onClick={() => {
          setEditIndex(null)
          setDrawerType(type)
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
        {buttonText}
      </Button>
    </Box>
  )

  const medicationsData: MedicationRow[] = (medications || []).map((med: MedicationFormData, index: number) => {
    return {
      ...med,
      medication_row_id: med?.id,
      id: index + 1,
      display_delivery_time: safeFormat(med.delivery_time),
      display_max_effect_time: safeFormat(med.max_effect_time)
    }
  })

  const gasesData: GasRow[] = (gases || []).map((gas: GasFormData, index: number) => {
    return {
      ...gas,
      gas_row_id: gas?.id,
      id: index + 1,
      display_start_time: safeFormat(gas.start_time),
      display_end_time: safeFormat(gas.end_time)
    }
  })

  return (
    <Box sx={{ p: 0 }}>
      {medications.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <StyledTypography {...({ fontSize: '1rem', fontWeight: 600 } as any)}>
              {t('hospital_module.medication')} - {medications.length}
            </StyledTypography>
            <Button
              variant='contained'
              endIcon={<AddIcon />}
              onClick={() => {
                setEditIndex(null)
                setDrawerType('medication')
              }}
            >
              {t('add_new')}
            </Button>
          </Box>
          <CommonTable
            columns={medicationColumns}
            indexedRows={medicationsData}
            rowHeight={64}
            hideFooterPagination
            total={medicationsData?.length || 0}
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

      {gases.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 4 }}>
            <StyledTypography {...({ fontSize: '1rem', fontWeight: 600 } as any)}>
              {t('hospital_module.gas')} - {gases.length}
            </StyledTypography>
            <Button
              variant='contained'
              endIcon={<AddIcon />}
              onClick={() => {
                setEditIndex(null)
                setDrawerType('gas')
              }}
            >
              {t('add_new')}
            </Button>
          </Box>
          <CommonTable
            columns={gasColumns}
            indexedRows={gasesData}
            hideFooterPagination
            rowHeight={64}
            total={gasesData?.length || 0}
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

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', mb: 4 }}>
        {medications.length === 0 && renderAddSection(t('hospital_module.medication'), 'medication', t('hospital_module.add_drug'))}
        {gases.length === 0 && renderAddSection(t('hospital_module.gas'), 'gas', t('hospital_module.add_gas'))}
      </Box>

      {drawerType === 'medication' && (
        <AddMedicationDrawer
          handleSidebarOpen={Boolean(drawerType)}
          handleSubmitData={handleSubmitMedication}
          handleSidebarClose={handleCloseDrawer}
          submitLoader={submitLoader}
          editData={editIndex !== null ? medications[editIndex] : null}
          {...({
            drugOptions: medicationGasList,
            existingMedications: medications,
            purposeStageOptions: purposeStageOptions,
            deliveryRouteOptions: deliveryRouteOptions,
            unitList: unitList,
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
      {drawerType === 'gas' && (
        <AddGasDrawer
          handleSidebarOpen={Boolean(drawerType)}
          handleSubmitData={handleSubmitGas}
          handleSidebarClose={handleCloseDrawer}
          submitLoader={submitLoader}
          editData={editIndex !== null ? gases[editIndex] : null}
          {...({
            gasOptions: medicationGasList,
            existingMedications: gases,
            deliveryRouteOptions: deliveryRouteOptions,
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

export default MedicationsGasSection

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color, sx = {} }: any) => ({
  fontSize: fontSize || '14px',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant,
  paddingLeft: '8px',
  ...sx
}))
