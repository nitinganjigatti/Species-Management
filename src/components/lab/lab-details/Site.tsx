import { Box, Card, CardHeader, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GetLabSitesById } from 'src/lib/api/lab/labDetails'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { useTheme } from '@mui/material/styles'
import type { SiteProps, LabSite } from 'src/types/lab'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

const Site = ({ labId }: SiteProps) => {
  const theme = useTheme()
  const { t } = useTranslation()

  const columns: GridColDef[] = [
    {
      flex: 2.3,
      minWidth: 20,
      field: 'site',
      headerName: t('lab_module.sites'),
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params?.row?.site_name}
          </Typography>
        </>
      )
    }
  ]

  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<LabSite[]>([])
  const [loading, setLoading] = useState(false)

  const getSlNo = (index: number) => index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const getRowId = (row: LabSite) => row.site_id

  const LabSitesById = async (short?: string | number, id?: string | number) => {
    const params = {
      short: short as string,
      lab_id: id || labId
    }
    try {
      const res = await GetLabSitesById({ params })
      setLoading(false)
      setRows(res?.data ?? [])
    } catch (error) {}
  }

  useEffect(() => {
    if (labId) {
      setLoading(true)
      LabSitesById(labId as string)
    }
  }, [])

  return (
    <Card>
      <CardHeader title={t('lab_module.sites')} />
      {rows?.length > 0 ? (
        <CommonTable
          indexedRows={indexedRows}
          total={total}
          columns={columns}
          loading={loading}
          hideFooterPagination
          disablePagination
        />
      ) : (
        <Box sx={{ px: 4, pb: 3 }}>
          <Typography variant='subtitle1'>{t('lab_module.no_sites_associated')}</Typography>
        </Box>
      )}
    </Card>
  )
}

export default Site
