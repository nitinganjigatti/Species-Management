import React, { useCallback, useState } from 'react'
import { Button, Typography, styled, Box, useTheme, IconButton, Tooltip, alpha } from '@mui/material'
import Icon from 'src/@core/components/icon'

import { Add as AddIcon } from '@mui/icons-material'
import AddMedicationDrawer from './AddMedicationDrawer'
import AddGasDrawer from './AddGasDrawer'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'

const medicationsData = [
  {
    id: 1,
    drug: 'Ketamine 100 MG Tablet',
    purpose_stage: 'Induction',
    amount: '10 mg',
    route: 'Intramuscular',
    delivery_time: '12:00 AM',
    delivery: 'Completed',
    notes: 'Time taken for effect looks normal'
  },
  {
    id: 2,
    drug: 'Acepromazine',
    purpose_stage: 'Antiemetic',
    amount: '10 mg',
    route: 'Intramuscular',
    delivery_time: '12:00 AM',
    delivery: 'Completed',
    notes: 'Time taken for effect looks normal'
  }
]

const gasData = [
  {
    id: 1,
    gas: 'Halothane',
    o2_flow: '100 mg',
    concentration: '3',
    route: 'Subcutaneous',
    start_time: '12:00 AM',
    end_time: '6:00 AM'
  },
  {
    id: 2,
    gas: 'Acepromazine',
    o2_flow: '30 mg',
    concentration: '8',
    route: 'Intramuscular',
    start_time: '12:00 AM',
    end_time: '6:00 AM'
  }
]
function MedicationsGasSection() {
  const theme = useTheme()
  const [drawerType, setDrawerType] = useState(null)
  const [submitLoader, setSubmitLoader] = useState(false)

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
            text={params.row.drug ?? '-'}
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
      renderCell: params => <StyledTypography>{params.row.amount}</StyledTypography>
    },
    {
      field: 'route',
      headerName: 'Route',
      minWidth: 140,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.route}</StyledTypography>
    },
    {
      field: 'delivery_time',
      headerName: 'Delivery Time',
      minWidth: 130,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.delivery_time}</StyledTypography>
    },
    {
      field: 'delivery',
      headerName: 'Delivery',
      minWidth: 120,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.delivery}</StyledTypography>
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
            <IconButton size='small' onClick={() => {}}>
              <Icon icon='mdi:pencil-outline' fontSize={20} color={theme.palette.customColors.OnSurfaceVariant} />
            </IconButton>
          </Tooltip>

          <Tooltip title='Delete'>
            <IconButton size='small' onClick={() => {}}>
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
            text={params.row.gas ?? '-'}
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
      renderCell: params => <StyledTypography>{params.row.route}</StyledTypography>
    },
    {
      field: 'start_time',
      headerName: 'Start Time',
      minWidth: 120,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.start_time}</StyledTypography>
    },
    {
      field: 'end_time',
      headerName: 'End Time',
      minWidth: 120,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.end_time}</StyledTypography>
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
            <IconButton size='small' onClick={() => {}}>
              <Icon icon='mdi:pencil-outline' fontSize={20} color={theme.palette.customColors.OnSurfaceVariant} />
            </IconButton>
          </Tooltip>

          <Tooltip title='Delete'>
            <IconButton size='small' onClick={() => {}}>
              <Icon icon='mdi:delete-outline' fontSize={20} color={theme.palette.customColors.Error} />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ]

  // Add Medications /Gas handler
  const handleSubmitData = useCallback(async payload => {
    setSubmitLoader(true)
    try {
      alert(JSON.stringify(payload))
    } catch (error) {
      console.error('Error adding data:', error)
    } finally {
      setSubmitLoader(false)
      setDrawerType(null)
    }
  }, [])

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
        onClick={() => setDrawerType(type)}
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

  return (
    <Box sx={{ p: '0 24px 24px 24px' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
        {renderAddSection('Medication', 'medication', 'Add Drug')}
        {renderAddSection('Gas', 'gas', 'Add Gas')}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <StyledTypography fontSize={'1rem'} fontWeight={600}>
          Medication - 3
        </StyledTypography>
        <Button variant='contained' endIcon={<AddIcon />} onClick={() => setDrawerType('medication')}>
          Add New{' '}
        </Button>
      </Box>
      {/* {drawerType === 'medication' && ( */}
      <CommonTable
        columns={medicationColumns}
        // loading={loading}
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
      {/* )} */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <StyledTypography fontSize={'1rem'} fontWeight={600}>
          Gas - 3
        </StyledTypography>
        <Button variant='contained' endIcon={<AddIcon />} onClick={() => setDrawerType('medication')}>
          Add New{' '}
        </Button>
      </Box>
      {/* {drawerType === 'gas' && ( */}
      <CommonTable
        columns={gasColumns}
        // loading={loading}
        indexedRows={gasData}
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
      {/* )} */}

      {drawerType === 'medication' && (
        <AddMedicationDrawer
          handleSidebarOpen={Boolean(drawerType)}
          handleSubmitData={handleSubmitData}
          handleSidebarClose={() => setDrawerType(null)}
          submitLoader={submitLoader}
        />
      )}
      {drawerType === 'gas' && (
        <AddGasDrawer
          handleSidebarOpen={Boolean(drawerType)}
          handleSubmitData={handleSubmitData}
          handleSidebarClose={() => setDrawerType(null)}
          submitLoader={submitLoader}
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
