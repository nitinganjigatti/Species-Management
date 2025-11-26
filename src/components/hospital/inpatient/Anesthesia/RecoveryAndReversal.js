import React, { useCallback, useState } from 'react'
import { Button, Typography, styled, Box, useTheme, Grid, IconButton, Tooltip } from '@mui/material'
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

function RecoveryAndReversal({
  drugOptions = [],
  unitOptions = [],
  deliveryRouteOptions = [],
  recoveryTypeOptions = [],
  anesthesiaRatingOptions = [],
  onAddReversalDrug,
  onUpdateReversalDrug,
  onDeleteReversalDrug
}) {
  const theme = useTheme()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [editIndex, setEditIndex] = useState(null)
  const [submitLoader, setSubmitLoader] = useState(false)

  const {
    control,
    watch,
    formState: { errors }
  } = useFormContext()
  const reversalDrugs = watch('recoveryAndReversal.reversalDrugs') || []

  const handleEditDrug = index => {
    setEditIndex(index)
    setOpenDrawer(true)
  }

  const handleSubmitData = useCallback(
    async payload => {
      setSubmitLoader(true)
      try {
        if (editIndex !== null) {
          onUpdateReversalDrug(editIndex, payload)
        } else {
          onAddReversalDrug(payload)
        }
      } catch (error) {
        console.error('Error adding/updating reversal drug:', error)
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

  const drugColumns = [
    {
      field: 'id',
      headerName: 'Sl.NO',
      minWidth: 80,
      flex: 1,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.id}</StyledTypography>
    },
    {
      field: 'drug_name',
      headerName: 'Drug',
      minWidth: 220,
      flex: 1,
      sortable: false,
      renderCell: params => (
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
        const time = params.row.delivery_time
          ? dayjs(params.row.delivery_time).isValid()
            ? dayjs(params.row.delivery_time).format('hh:mm A')
            : '-'
          : '-'
        return <StyledTypography>{time}</StyledTypography>
      }
    },
    {
      field: 'delivery_status',
      headerName: 'Delivery',
      minWidth: 120,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.delivery_status || '-'}</StyledTypography>
    },
    {
      field: 'max_effect_time',
      headerName: 'Max.Effect',
      minWidth: 130,
      sortable: false,
      renderCell: params => {
        const time = params.row.max_effect_time
          ? dayjs(params.row.max_effect_time).isValid()
            ? dayjs(params.row.max_effect_time).format('hh:mm A')
            : '-'
          : '-'
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
            <IconButton size='small' onClick={() => handleEditDrug(params.row.id - 1)}>
              <Icon icon='mdi:pencil-outline' fontSize={20} color={theme.palette.customColors.OnSurfaceVariant} />
            </IconButton>
          </Tooltip>

          <Tooltip title='Delete'>
            <IconButton size='small' onClick={() => onDeleteReversalDrug(params.row.id - 1)}>
              <Icon icon='mdi:delete-outline' fontSize={20} color={theme.palette.customColors.Error} />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ]

  const reversalDrugsData = reversalDrugs.map((drug, index) => ({
    ...drug,
    id: index + 1
  }))

  return (
    <Box sx={{ p: '0 24px 24px 24px' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', mb: 4 }}>
        <Typography
          sx={{
            fontSize: '1rem',
            fontWeight: 600,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          Recovery and reversal
        </Typography>
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
          Add Reversal Drug
        </Button>
      </Box>

      {reversalDrugs.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <StyledTypography fontSize={'1rem'} fontWeight={600}>
              Reversal drug - {reversalDrugs.length}
            </StyledTypography>
            <Button
              variant='contained'
              endIcon={<AddIcon />}
              onClick={() => {
                setEditIndex(null)
                setOpenDrawer(true)
              }}
            >
              Add New
            </Button>
          </Box>

          <CommonTable
            columns={drugColumns}
            indexedRows={reversalDrugsData}
            rowHeight={64}
            total={reversalDrugsData?.length || 0}
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

      <Box sx={{ width: '100%', mt: 4 }}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 4 }}>
            <ControlledSelect
              control={control}
              name='recoveryAndReversal.recovery_type'
              errors={errors}
              label='Recovery Type*'
              options={recoveryTypeOptions}
              getOptionLabel={option => option.label}
              getOptionValue={option => option.value}
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <ControlledTimePicker
              control={control}
              name={'recoveryAndReversal.recovery_first_effect'}
              label='Recovery 1st Effect*'
              errors={errors}
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <ControlledTimePicker
              control={control}
              name={'recoveryAndReversal.recovery_full_effect'}
              label='Recovery Full Effect*'
              errors={errors}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <ControlledTextArea
              name='recoveryAndReversal.notes'
              control={control}
              label='Notes'
              placeholder='Enter notes'
              fullWidth={true}
              rows={2}
              inputBackgroundColor={theme.palette.customColors.Notes}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <StyledTypography fontSize={'1rem'} fontWeight={600}>
              Anaesthesia ratings
            </StyledTypography>
          </Grid>
          <Grid size={{ xs: 3 }}>
            <ControlledSelect
              control={control}
              name='recoveryAndReversal.induction'
              errors={errors}
              label='Induction*'
              options={anesthesiaRatingOptions}
              getOptionLabel={option => option.label}
              getOptionValue={option => option.value}
            />
          </Grid>
          <Grid size={{ xs: 3 }}>
            <ControlledSelect
              control={control}
              name='recoveryAndReversal.tolerance'
              errors={errors}
              label='Tolerance*'
              options={anesthesiaRatingOptions}
              getOptionLabel={option => option.label}
              getOptionValue={option => option.value}
            />
          </Grid>
          <Grid size={{ xs: 3 }}>
            <ControlledSelect
              control={control}
              name='recoveryAndReversal.recovery'
              errors={errors}
              label='Recovery*'
              options={anesthesiaRatingOptions}
              getOptionLabel={option => option.label}
              getOptionValue={option => option.value}
            />
          </Grid>
          <Grid size={{ xs: 3 }}>
            <ControlledSelect
              control={control}
              name='recoveryAndReversal.overall'
              errors={errors}
              label='Overall*'
              options={anesthesiaRatingOptions}
              getOptionLabel={option => option.label}
              getOptionValue={option => option.value}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Drawer component */}
      {openDrawer && (
        <AddReversalDrug
          handleSidebarOpen={openDrawer}
          handleSubmitData={handleSubmitData}
          handleSidebarClose={handleCloseDrawer}
          submitLoader={submitLoader}
          editData={editIndex !== null ? reversalDrugs[editIndex] : null}
          drugOptions={drugOptions}
          unitOptions={unitOptions}
          deliveryRouteOptions={deliveryRouteOptions}
        />
      )}
    </Box>
  )
}

export default RecoveryAndReversal

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color, sx = {} }) => ({
  fontSize: fontSize || '14px',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant,
  paddingLeft: '8px',
  ...sx
}))
