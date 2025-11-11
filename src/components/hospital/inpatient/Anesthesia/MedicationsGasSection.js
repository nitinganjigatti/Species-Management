import React, { useCallback, useState } from 'react'
import { Button, Typography, styled, Box, useTheme, IconButton, Tooltip } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { Add as AddIcon } from '@mui/icons-material'
import { useFormContext } from 'react-hook-form'
import AddMedicationDrawer from './AddMedicationDrawer'
import AddGasDrawer from './AddGasDrawer'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import dayjs from 'dayjs'

function MedicationsGasSection({
  onAddMedication,
  onAddGas,
  onUpdateMedication,
  onUpdateGas,
  onDeleteMedication,
  onDeleteGas,
  drugOptions,
  gasOptions,
  unitOptions,
  deliveryRouteOptions
}) {
  const theme = useTheme()
  const [drawerType, setDrawerType] = useState(null)
  const [editIndex, setEditIndex] = useState(null)
  const [submitLoader, setSubmitLoader] = useState(false)

  const { watch } = useFormContext()
  const medications = watch('medicationsGas.medications') || []
  const gases = watch('medicationsGas.gases') || []

  const medicationColumns = [
    {
      field: 'id',
      headerName: 'Sl.NO',
      minWidth: 80,
      flex: 1,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.id}</StyledTypography>
    },
    {
      field: 'drug',
      headerName: 'Drug',
      minWidth: 220,
      flex: 1,
      sortable: false,
      renderCell: params => (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <TextEllipsisWithModal
            enableDialog={false}
            text={params.row.drug_name?.drug_name ?? '-'}
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '14px',
              fontWeight: 500,
              pl: 2,
              maxWidth: '200px'
            }}
          />
        </Box>
      )
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
          {params.row.amount} {params.row.unit}
        </StyledTypography>
      )
    },
    {
      field: 'route',
      headerName: 'Route',
      minWidth: 140,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.delivery_route}</StyledTypography>
    },
    {
      field: 'delivery_time',
      headerName: 'Delivery Time',
      minWidth: 130,
      sortable: false,
      renderCell: params => {
        const time = params.row.delivery_time ? (params.row.delivery_time ? params.row.delivery_time : '-') : '-'
        return <StyledTypography>{time}</StyledTypography>
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
          <Tooltip title='Edit'>
            <IconButton size='small' onClick={() => handleEditMedication(params.row.id - 1)}>
              <Icon icon='mdi:pencil-outline' fontSize={20} color={theme.palette.customColors.OnSurfaceVariant} />
            </IconButton>
          </Tooltip>

          <Tooltip title='Delete'>
            <IconButton size='small' onClick={() => onDeleteMedication(params.row.id - 1)}>
              <Icon icon='mdi:delete-outline' fontSize={20} color={theme.palette.customColors.Error} />
            </IconButton>
          </Tooltip>
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
      renderCell: params => <StyledTypography>{params.row.id}</StyledTypography>
    },
    {
      field: 'gas',
      headerName: 'Gas',
      minWidth: 180,
      flex: 1,
      sortable: false,
      renderCell: params => (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <TextEllipsisWithModal
            enableDialog={false}
            text={params.row.gas_name?.gas_name ?? '-'}
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
      renderCell: params => <StyledTypography>{params.row.delivery_route}</StyledTypography>
    },
    {
      field: 'start_time',
      headerName: 'Start Time',
      minWidth: 120,
      sortable: false,
      renderCell: params => {
        const time = params.row.start_time ? (params.row.start_time ? params.row.start_time : '-') : '-'
        return <StyledTypography>{time}</StyledTypography>
      }
    },
    {
      field: 'end_time',
      headerName: 'End Time',
      minWidth: 120,
      sortable: false,
      renderCell: params => {
        // const time = params.row.end_time
        //   ? dayjs(params.row.end_time).isValid()
        //     ? dayjs(params.row.end_time).format('hh:mm A')
        //     : '-'
        //   : '-'
        const time = params.row.end_time ? (params.row.end_time ? params.row.end_time : '-') : '-'
        return <StyledTypography>{time}</StyledTypography>
      }
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
          <Tooltip title='Edit'>
            <IconButton size='small' onClick={() => handleEditGas(params.row.id - 1)}>
              <Icon icon='mdi:pencil-outline' fontSize={20} color={theme.palette.customColors.OnSurfaceVariant} />
            </IconButton>
          </Tooltip>

          <Tooltip title='Delete'>
            <IconButton size='small' onClick={() => onDeleteGas(params.row.id - 1)}>
              <Icon icon='mdi:delete-outline' fontSize={20} color={theme.palette.customColors.Error} />
            </IconButton>
          </Tooltip>
        </Box>
      )
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

  const handleSubmitMedication = useCallback(
    async payload => {
      setSubmitLoader(true)
      try {
        if (editIndex !== null) {
          onUpdateMedication(editIndex, payload)
        } else {
          onAddMedication(payload)
        }
      } catch (error) {
        console.error('Error adding/updating medication:', error)
      } finally {
        setSubmitLoader(false)
        setDrawerType(null)
        setEditIndex(null)
      }
    },
    [editIndex, onAddMedication, onUpdateMedication]
  )

  const handleSubmitGas = useCallback(
    async payload => {
      setSubmitLoader(true)
      try {
        if (editIndex !== null) {
          onUpdateGas(editIndex, payload)
        } else {
          onAddGas(payload)
        }
      } catch (error) {
        console.error('Error adding/updating gas:', error)
      } finally {
        setSubmitLoader(false)
        setDrawerType(null)
        setEditIndex(null)
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

  const medicationsData = medications.map((med, index) => ({
    ...med,
    id: index + 1
  }))

  const gasesData = gases.map((gas, index) => ({
    ...gas,
    id: index + 1
  }))

  return (
    <Box sx={{ p: '0 0px 24px 0px' }}>
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
          drugOptions={drugOptions}
          unitOptions={unitOptions}
          deliveryRouteOptions={deliveryRouteOptions}
        />
      )}
      {drawerType === 'gas' && (
        <AddGasDrawer
          handleSidebarOpen={Boolean(drawerType)}
          handleSubmitData={handleSubmitGas}
          handleSidebarClose={handleCloseDrawer}
          submitLoader={submitLoader}
          editData={editIndex !== null ? gases[editIndex] : null}
          gasOptions={gasOptions}
          deliveryRouteOptions={deliveryRouteOptions}
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
