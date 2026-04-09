'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Button, Typography, styled, Box, useTheme, IconButton, Tooltip } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { Add as AddIcon } from '@mui/icons-material'
import { useFormContext } from 'react-hook-form'
import AddMedicationDrawer from './AddMedicationDrawer'
import AddGasDrawer from './AddGasDrawer'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import dayjs from 'dayjs'
import { deliveryRouteList } from 'src/lib/api/hospital/anesthesia'
import { getMedicineProductList } from 'src/lib/api/hospital/anesthesia'
import Toaster from 'src/components/Toaster'

function MedicationsGasSection({
  onAddMedication,
  onAddGas,
  onUpdateMedication,
  onUpdateGas,
  onDeleteMedication,
  onDeleteGas,
  purposeStageOptions,
  unitList
}) {
  const theme = useTheme()
  const [drawerType, setDrawerType] = useState(null)
  const [editIndex, setEditIndex] = useState(null)
  const [submitLoader, setSubmitLoader] = useState(false)

  const [deliveryRouteOptions, setdeliveryRouteList] = useState([])
  const [medicationGasList, setmedicationGasList] = useState([])
  const [productPage, setProductPage] = useState(1)
  const [productTotal, setProductTotal] = useState(0)
  const [isProductLoading, setIsProductLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const { watch } = useFormContext()
  const medications = watch('medicationsGas.medications') || []
  const gases = watch('medicationsGas.gases') || []

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

  const fetchMedicationGasList = async (pageToLoad = 1, append = false, q = '') => {
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
      const response = await getMedicineProductList({ params })
      if (response?.success && response?.data?.brand_name?.result?.length > 0) {
        const newItems = response?.data?.brand_name?.result || []
        const totalCount = response?.data?.brand_name?.count || 0

        setProductTotal(totalCount)
        setmedicationGasList(prev => (append ? [...prev, ...newItems] : newItems))
        setProductPage(pageToLoad)
      }
      // else {
      //   Toaster({ type: 'error', message: response?.message || '' })
      // }
    } catch (error) {
      Toaster({ type: 'error', message: 'Failed to fetch products' })
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

  const getUnitAbbr = unitId => {
    const unit = unitList?.find(item => String(item.id) === String(unitId))

    return unit?.uom_abbr || '-'
  }

  const safeFormat = v => {
    if (!v) return '-'
    const d = dayjs(v)

    return d.isValid() ? d.format('hh:mm A') : '-'
  }

  const medicationColumns = [
    {
      field: 'id',
      headerName: 'Sl.NO',
      minWidth: 80,
      flex: 1,
      sortable: false,
      renderCell: params => <StyledTypography sx={{ pl: 5 }}>{params.row.id}</StyledTypography>
    },
    {
      field: 'drug',
      headerName: 'Drug',
      minWidth: 220,
      flex: 1,
      sortable: false,
      renderCell: params => {
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
      headerName: 'Purpose/Stage',
      minWidth: 180,
      flex: 1,
      sortable: false,
      renderCell: params => (
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
      headerName: 'Amount',
      minWidth: 100,
      sortable: false,
      renderCell: params => (
        <StyledTypography>
          {params.row.amount} {getUnitAbbr(params.row.unit)}
        </StyledTypography>
      )
    },
    {
      field: 'route',
      headerName: 'Route',
      minWidth: 140,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.delivery_route?.delivery || ''}</StyledTypography>
    },
    {
      field: 'delivery_time',
      headerName: 'Delivery Time',
      minWidth: 130,
      sortable: false,
      renderCell: params => {
        return <StyledTypography>{params.row.display_delivery_time || '-'}</StyledTypography>
      }
    },
    {
      field: 'delivery',
      headerName: 'Delivery',
      minWidth: 120,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.delivery_status || '-'}</StyledTypography>
    },
    {
      field: 'notes',
      headerName: 'Notes',
      minWidth: 200,
      sortable: false,
      renderCell: params => (
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
      headerName: 'Actions',
      headerAlign: 'center',
      align: 'center',
      width: 120,
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {params?.row?.medication_row_id !== undefined ? (
            <>
              <Tooltip title='Edit'>
                <IconButton size='small' onClick={() => handleEditMedication(params.row.id - 1)}>
                  <Icon icon='mdi:pencil-outline' fontSize={20} color={theme.palette.customColors.OnSurfaceVariant} />
                </IconButton>
              </Tooltip>

              <Tooltip title='Delete'>
                <IconButton
                  size='small'
                  onClick={() => onDeleteMedication(params.row.id - 1, params?.row?.medication_row_id)}
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

  const gasColumns = [
    {
      field: 'id',
      headerName: 'Sl.NO',
      minWidth: 80,
      flex: 1,
      sortable: false,
      renderCell: params => <StyledTypography sx={{ pl: 5 }}>{params.row.id}</StyledTypography>
    },
    {
      field: 'gas',
      headerName: 'Gas',
      minWidth: 220,
      flex: 1,
      sortable: false,
      renderCell: params => (
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
      headerName: 'O2 L/Min',
      minWidth: 100,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.o2_flow}</StyledTypography>
    },
    {
      field: 'concentration',
      headerName: 'Concentration %',
      minWidth: 180,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.concentration}</StyledTypography>
    },
    {
      field: 'route',
      headerName: 'Route',
      minWidth: 150,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.delivery_route?.delivery || ''}</StyledTypography>
    },
    {
      field: 'start_time',
      headerName: 'Start Time',
      minWidth: 120,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.display_start_time ?? '-'}</StyledTypography>
    },
    {
      field: 'end_time',
      headerName: 'End Time',
      minWidth: 120,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.display_end_time ?? '-'}</StyledTypography>
    },
    {
      field: 'actions',
      headerName: 'Actions',
      headerAlign: 'center',
      align: 'center',
      width: 120,
      sortable: false,
      renderCell: params => {
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {params?.row?.gas_row_id !== undefined ? (
              <>
                <Tooltip title='Edit'>
                  <IconButton size='small' onClick={() => handleEditGas(params.row.id - 1)}>
                    <Icon icon='mdi:pencil-outline' fontSize={20} color={theme.palette.customColors.OnSurfaceVariant} />
                  </IconButton>
                </Tooltip>

                <Tooltip title='Delete'>
                  <IconButton size='small' onClick={() => onDeleteGas(params.row.id - 1, params?.row?.gas_row_id)}>
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

  const handleEditMedication = index => {
    setEditIndex(index)
    setDrawerType('medication')
  }

  const handleEditGas = index => {
    setEditIndex(index)
    setDrawerType('gas')
  }

  const parseTimeFromDrawer = v => {
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

  const asStorageString = d => {
    if (!d) return ''
    const parsed = parseTimeFromDrawer(d)

    return parsed && parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : ''
  }

  const handleSubmitMedication = useCallback(
    async payload => {
      const normalized = {
        ...payload,
        delivery_time: asStorageString(payload.delivery_time),
        max_effect_time: asStorageString(payload.max_effect_time)
      }

      if (editIndex !== null) {
        onUpdateMedication(editIndex, normalized)
      } else {
        onAddMedication(normalized)
      }
    },
    [editIndex, onAddMedication, onUpdateMedication]
  )

  const handleSubmitGas = useCallback(
    async payload => {
      const normalized = {
        ...payload,
        start_time: asStorageString(payload.start_time),
        end_time: asStorageString(payload.end_time)
      }

      if (editIndex !== null) {
        onUpdateGas(editIndex, normalized)
      } else {
        onAddGas(normalized)
      }
    },
    [editIndex, onAddGas, onUpdateGas]
  )

  const handleCloseDrawer = () => {
    setDrawerType(null)
    setEditIndex(null)
  }

  const renderAddSection = (label, type, buttonText) => (
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

  const medicationsData = (medications || []).map((med, index) => {
    return {
      ...med,
      medication_row_id: med?.id,
      id: index + 1,
      display_delivery_time: safeFormat(med.delivery_time),
      display_max_effect_time: safeFormat(med.max_effect_time)
    }
  })

  const gasesData = (gases || []).map((gas, index) => {
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
            <StyledTypography fontSize={'1rem'} fontWeight={600}>
              Medication - {medications.length}
            </StyledTypography>
            <Button
              variant='contained'
              endIcon={<AddIcon />}
              onClick={() => {
                setEditIndex(null)
                setDrawerType('medication')
              }}
            >
              Add New
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
            <StyledTypography fontSize={'1rem'} fontWeight={600}>
              Gas - {gases.length}
            </StyledTypography>
            <Button
              variant='contained'
              endIcon={<AddIcon />}
              onClick={() => {
                setEditIndex(null)
                setDrawerType('gas')
              }}
            >
              Add New
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
        {medications.length === 0 && renderAddSection('Medication', 'medication', 'Add Drug')}
        {gases.length === 0 && renderAddSection('Gas', 'gas', 'Add Gas')}
      </Box>

      {drawerType === 'medication' && (
        <AddMedicationDrawer
          handleSidebarOpen={Boolean(drawerType)}
          handleSubmitData={handleSubmitMedication}
          handleSidebarClose={handleCloseDrawer}
          submitLoader={submitLoader}
          editData={editIndex !== null ? medications[editIndex] : null}
          drugOptions={medicationGasList}
          existingMedications={medications}
          purposeStageOptions={purposeStageOptions}
          deliveryRouteOptions={deliveryRouteOptions}
          unitList={unitList}
          onSearch={setSearchTerm}
          onLoadMoreDrugs={() => {
            if (hasMoreProducts && !isProductLoading) {
              fetchMedicationGasList(productPage + 1, true, debouncedSearch)
            }
          }}
          hasMoreDrugs={hasMoreProducts}
          isLoadingDrugs={isProductLoading}
        />
      )}
      {drawerType === 'gas' && (
        <AddGasDrawer
          handleSidebarOpen={Boolean(drawerType)}
          handleSubmitData={handleSubmitGas}
          handleSidebarClose={handleCloseDrawer}
          submitLoader={submitLoader}
          editData={editIndex !== null ? gases[editIndex] : null}
          gasOptions={medicationGasList}
          existingMedications={gases}
          deliveryRouteOptions={deliveryRouteOptions}
          onSearch={setSearchTerm}
          onLoadMoreDrugs={() => {
            if (hasMoreProducts && !isProductLoading) {
              fetchMedicationGasList(productPage + 1, true, debouncedSearch)
            }
          }}
          hasMoreDrugs={hasMoreProducts}
          isLoadingDrugs={isProductLoading}
        />
      )}
    </Box>
  )
}

export default MedicationsGasSection

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color, sx = {} }) => ({
  fontSize: fontSize || '14px',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant,
  paddingLeft: '8px',
  ...sx
}))
