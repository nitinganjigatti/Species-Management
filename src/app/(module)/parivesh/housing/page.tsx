'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Box, Button, Card, CardHeader, CircularProgress, Grid, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { getUsersReportList, getHousingReport, getSpeciesReport } from 'src/lib/api/parivesh/housing'
import Toaster from 'src/components/Toaster'

// ==================== Helpers ====================

const jsonToCsv = (jsonData: any[]): string => {
  if (!jsonData || jsonData.length === 0) return ''
  const keys = Object.keys(jsonData[0])
  const csvRows = jsonData.map(item => keys.map(key => item[key] || '').join(','))
  return [keys.join(','), ...csvRows].join('\n')
}

const downloadCsvFile = (csvContent: string, fileName: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ==================== Component ====================

const PariveshHousingPage: React.FC = () => {
  const { t } = useTranslation()

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['parivesh-users-report'],
    queryFn: () => getUsersReportList()
  })

  const { data: housingData, isLoading: housingLoading } = useQuery({
    queryKey: ['parivesh-housing-report'],
    queryFn: () => getHousingReport()
  })

  const { data: speciesData, isLoading: speciesLoading } = useQuery({
    queryKey: ['parivesh-species-report'],
    queryFn: () => getSpeciesReport()
  })

  const isLoading = usersLoading || housingLoading || speciesLoading

  const housingCsv = useMemo(() => housingData?.data ? jsonToCsv(housingData.data as any[]) : '', [housingData])
  const speciesCsv = useMemo(() => speciesData?.data ? jsonToCsv(speciesData.data as any[]) : '', [speciesData])

  const handleSpeciesExport = () => {
    if (!speciesCsv) { Toaster({ type: 'error', message: t('something_went_wrong') }); return }
    downloadCsvFile(speciesCsv, 'species_data.csv')
  }

  const handleHousingExport = () => {
    if (!housingCsv) { Toaster({ type: 'error', message: t('something_went_wrong') }); return }
    downloadCsvFile(housingCsv, 'housing_data.csv')
  }

  const handleUsersExport = () => {
    if (!usersData) { Toaster({ type: 'error', message: t('something_went_wrong') }); return }
    const csv = jsonToCsv(Array.isArray(usersData) ? usersData : [usersData])
    downloadCsvFile(csv, 'user_data.csv')
  }

  return (
    <Card sx={{ height: '200px' }}>
      <CardHeader title={t('parivesh_module.housing_module')} />
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Grid sx={{ display: 'flex', justifyContent: 'space-around', mt: 10 }}>
          <Grid>
            <Button
              variant='contained'
              disabled={!speciesCsv}
              onClick={handleSpeciesExport}
            >
              {t('parivesh_module.species')}
            </Button>
          </Grid>
          <Grid>
            <Button
              variant='contained'
              disabled={!housingCsv}
              onClick={handleHousingExport}
            >
              {t('parivesh_module.housing')}
            </Button>
          </Grid>
          <Grid>
            <Button
              variant='contained'
              disabled={!usersData}
              onClick={handleUsersExport}
            >
              {t('parivesh_module.users')}
            </Button>
          </Grid>
        </Grid>
      )}
    </Card>
  )
}

export default PariveshHousingPage
