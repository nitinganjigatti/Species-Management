import { useTheme } from '@emotion/react'
import { Button, Card, CardContent, CardHeader, CircularProgress, Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { addDays, format, subDays } from 'date-fns'
import React, { useContext, useState } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import RenderUtility from 'src/utility/render'
import { ExportButton } from 'src/views/utility/render-snippets'
import DietReportView from 'src/views/pages/diet/kitchen/diet-report'
import SingleDatePicker from 'src/components/SingleDatePicker'
import { getMealGroupSummaryReport, getMealGroupWiseReport } from 'src/lib/api/diet/kitchen'
import Toaster from 'src/components/Toaster'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Utility from 'src/utility'
import Icon from 'src/@core/components/icon'

const schema = yup.object().shape({
  site: yup.object().required('Site is required').nullable()
})

const MealGroupReport = () => {
  const initialRows = [
    {
      id: 1,
      reportName: 'Meal Group Wise Report',
      reportAlias: 'meal_group_wise',
      downloadStatus: false
    },
    {
      id: 2,
      reportName: 'Meal Group Summary Report',
      reportAlias: 'meal_group_summary',
      downloadStatus: false
    }
  ]

  const authData = useContext(AuthContext)
  const sites = authData.userData.user.zoos[0]?.sites || []

  console.log(sites, 'sites')

  const siteOptions = sites.map(site => ({
    label: site.site_name,
    value: site.site_id
  }))

  const defaultValues = {
    site: siteOptions.find(site => site.value === 16) || null
  }

  const {
    control,
    formState: { errors },
    getValues
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const theme = useTheme()
  const [rows, setRows] = useState(initialRows)
  const [downloadStatus, setDownloadStatus] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const handleUpdateStatus = (reportId, status) => {
    setRows(currentRows => currentRows.map(row => (row.id === reportId ? { ...row, downloadStatus: status } : row)))
  }

  const handleDownload = async (reportId, reportAlias) => {
    const selectedSite = getValues('site')
    const site_id = selectedSite?.value || null
    try {
      const params = {
        site_id: site_id,
        file_type: 'pdf',
        is_portrait: 1,
        date: format(selectedDate, 'yyyy-MM-dd')
      }
      handleUpdateStatus(reportId, true)

      let data

      if (reportAlias === 'meal_group_wise') {
        data = await getMealGroupWiseReport({ params })
      } else if (reportAlias === 'meal_group_summary') {
        data = await getMealGroupSummaryReport({ params })
      }

      if (data?.success === false) {
        Toaster({ type: 'error', message: data?.message })
      }

      if (data?.success === true) {
        Toaster({ type: 'success', message: data?.message })
        if (data.data) {
          Utility.downloadFileFromURL(data.data)
        }
      }

      console.log(params, reportId)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      handleUpdateStatus(reportId, false)
    }
  }

  const columns = [
    {
      width: 80,
      field: 'id',
      headerName: 'SL.NO',
      headerAlign: 'center',
      alignItems: 'center',
      align: 'center',
      sortable: false,
      renderCell: params => params.value
    },
    {
      flex: 1,
      minWidth: 300,
      field: 'reportName',
      headerName: 'Report Name',
      sortable: false,
      renderCell: params => (
        <Box sx={{ minWidth: 40 }}>
          <Typography sx={{ color: 'customColors.OnSecondaryContainer', fontSize: '14px', fontWeight: '400px' }}>
            {params.row.reportName}
          </Typography>
          <Typography
            sx={{
              color: 'customColors.OnSecondaryContainer',
              fontSize: '14px',
              fontWeight: '400px',
              fontStyle: 'italic'
            }}
          >
            {params.row.reportTitle}
          </Typography>
        </Box>
      )
    },
    {
      width: 200,
      field: 'download',
      headerName: 'Download',
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: params => (
        <>
          {!params?.row.downloadStatus ? (
            <Button
              variant='contained'
              size='small'
              startIcon={<Icon icon='mdi:download' />}
              onClick={() => handleDownload(params.row.id, params.row.reportAlias)}
              disabled={params.row.downloadStatus}
            >
              Download
            </Button>
          ) : (
            <>
              <CircularProgress size={30} />
            </>
          )}
        </>
      )
    }
  ]

  const handleDateChange = date => {
    setSelectedDate(date)
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title={RenderUtility.pageTitle('Meal Group Reports')} />
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: { xs: 2, sm: 0 },
                width: '100%'
              }}
            >
              <Grid
                container
                spacing={4}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Grid item xs={12} sm={6} md={4}>
                  <SingleDatePicker
                    date={selectedDate}
                    onChangeHandler={handleDateChange}
                    maxDate={addDays(new Date(), 6)}
                    name='Select Date'
                    minDate={new Date()}
                    dateFormat='dd-MM-yyyy'
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Grid
                    item
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      justifyContent: { sm: 'flex-end', xs: 'flex-end' }
                    }}
                  >
                    <ControlledAutocomplete
                      name='site'
                      label='Select Site*'
                      control={control}
                      errors={errors}
                      options={siteOptions}
                      getOptionLabel={option => option.label || ''}
                      isOptionEqualToValue={(option, value) => option.value === value?.value}
                      required
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Box>
            <DietReportView rows={rows} columns={columns} loading={loading} downloadStatus={downloadStatus} />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default MealGroupReport
