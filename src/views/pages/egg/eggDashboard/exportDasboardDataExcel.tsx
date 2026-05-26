'use client'

import React, { FC, useCallback, useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import Button from '@mui/material/Button'
import Utility from 'src/utility'
import Icon from 'src/@core/components/icon'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'

interface DashboardExelExportButtonProps {
  tab_Value: string
  data: any[]
  loading: boolean
  exportExcelDataCall: (callback: (data: any[]) => void) => void
}

const DashboardExelExportButton: FC<DashboardExelExportButtonProps> = ({ tab_Value, data, loading, exportExcelDataCall }) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const [xlsxList, setXlsxList] = useState<any[]>([])
  const [fileName, setFileName] = useState<string>('Egg Table List')

  const handleExport = useCallback(
    (data: any[]) => {
      let formattedData: any
      if (tab_Value === 'species') {
        setFileName('Species')

        formattedData = data?.map((item: any, index: any) => ({
          NO: index + 1,
          SPECIES: `${item.complete_name || '-'} (${item?.default_common_name || '-'})`,
          'TOTAL EGGS': item.total_eggs || '-',
          'CURRENTLY IN NEST': item.currently_in_nest || '-',
          'CURRENTLY IN NURSERY': item.currently_in_nursery || '-',
          'HATCHED IN NEST %': `${
            Number(item.hatched_in_nest) +
              Number(item.discarded_at_site) +
              Number(item.ready_tobe_discarded_at_nursery) >
            0
              ? Math.round(
                  (Number(item.hatched_in_nest) /
                    (Number(item.hatched_in_nest) +
                      Number(item.discarded_at_site) +
                      Number(item.ready_tobe_discarded_at_nursery))) *
                    100
                )
              : 0
          } %`,
          'HATCHED IN NEST': `${item.hatched_in_nest ? `${item.hatched_in_nest}` : '-'}`,
          'HATCHED IN NURSERY %': `${
            Number(item.hatched_in_nursery) +
              Number(item.discarded_at_nursery) +
              Number(item.ready_tobe_discarded_at_nursery) >
            0
              ? Math.round(
                  (Number(item.hatched_in_nursery) /
                    (Number(item.hatched_in_nursery) +
                      Number(item.discarded_at_nursery) +
                      Number(item.ready_tobe_discarded_at_nursery))) *
                    100
                )
              : 0
          } %`,
          'HATCHED IN NURSERY': `${item.hatched_in_nursery ? `${item.hatched_in_nursery}` : '-'}`,
          'TOTAL HATCHED %': `${
            Number(item.total_hatch) + Number(item.total_discard) + 0
              ? Math.round((Number(item.total_hatch) / (Number(item.total_hatch) + Number(item.total_discard))) * 100)
              : 0
          } %`,
          'TOTAL HATCHED': `${item.total_hatch ? `${item.total_hatch}` : '-'}`,
          'DISCARDED AT SITE': item.discarded_at_site || '-',
          'DISCARDED AT NURSERY': item.discarded_at_nursery || '-',
          'TOTAL DISCARDED': item.total_discarded || '-',
          'IN TRANSIT': item.in_transit || '-'
        }))
        setXlsxList(formattedData)
      } else if (tab_Value === 'site') {
        setFileName('Site')

        formattedData =
          data.length &&
          data?.map((item: any, index: any) => ({
            NO: index + 1,
            SITES: item.site_name || '-',
            'TOTAL EGGS': item.total_eggs || '-',
            'CURRENTLY IN NEST': item.currently_in_nest || '-',
            'CURRENTLY IN NURSERY': item.currently_in_nursery || '-',
            'HATCHED IN NEST %': `${
              Number(item.hatched_in_nest) +
                Number(item.discarded_at_site) +
                Number(item.ready_tobe_discarded_at_nursery) >
              0
                ? Math.round(
                    (Number(item.hatched_in_nest) /
                      (Number(item.hatched_in_nest) +
                        Number(item.discarded_at_site) +
                        Number(item.ready_tobe_discarded_at_nursery))) *
                      100
                  )
                : 0
            } %`,
            'HATCHED IN NEST': `${item.hatched_in_nest ? `${item.hatched_in_nest}` : '-'}`,
            'HATCHED IN NURSERY %': `${
              Number(item.hatched_in_nursery) +
                Number(item.discarded_at_nursery) +
                Number(item.ready_tobe_discarded_at_nursery) >
              0
                ? Math.round(
                    (Number(item.hatched_in_nursery) /
                      (Number(item.hatched_in_nursery) +
                        Number(item.discarded_at_nursery) +
                        Number(item.ready_tobe_discarded_at_nursery))) *
                      100
                  )
                : 0
            } %`,
            'HATCHED IN NURSERY': `${item.hatched_in_nursery ? `${item.hatched_in_nursery}` : '-'}`,
            'TOTAL HATCHED %': `${
              Number(item.total_hatch) + Number(item.total_discard) + 0
                ? Math.round((Number(item.total_hatch) / (Number(item.total_hatch) + Number(item.total_discard))) * 100)
                : 0
            } %`,
            'TOTAL HATCHED': `${item.total_hatch ? `${item.total_hatch}` : '-'}`,
            'DISCARDED AT SITE': item.discarded_at_site || '-',
            'DISCARDED AT NURSERY': item.discarded_at_nursery || '-',
            'TOTAL DISCARDED': item.total_discarded || '-',
            'IN TRANSIT': item.in_transit || '-'
          }))
        setXlsxList(formattedData)
      } else if (tab_Value == 'nursery') {
        setFileName('Nursery')

        formattedData =
          data.length &&
          data.map((item: any, index: any) => ({
            NO: index + 1,
            NURSERIES: item.nursery_name || '-',
            'TOTAL EGGS': item.total_eggs || '-',
            'CURRENTLY IN INCUBATOR': item.currently_in_incubator || '-',
            'CURRENTLY IN NURSERY': item.currently_in_nursery || '-',
            'HATCHED IN NURSERY %': `${
              Number(item.hatched_in_nursery) +
                Number(item.discarded_at_nursery) +
                Number(item.ready_tobe_discarded_at_nursery) >
              0
                ? Math.round(
                    (Number(item.hatched_in_nursery) /
                      (Number(item.hatched_in_nursery) +
                        Number(item.discarded_at_nursery) +
                        Number(item.ready_tobe_discarded_at_nursery))) *
                      100
                  )
                : 0
            } %`,
            'HATCHED IN NURSERY': `${item.hatched_in_nursery ? `${item.hatched_in_nursery}` : '-'}`,
            'DISCARDED AT NURSERY': item.discarded_at_nursery || '-',
            'IN TRANSIT': item.in_transit || '-'
          }))
        setXlsxList(formattedData)
      }
      const worksheet = XLSX.utils.json_to_sheet([])

      const headerData: string[][] = [
      ]

      XLSX.utils.sheet_add_aoa(worksheet, headerData, { origin: 'A1' })

      XLSX.utils.sheet_add_json(worksheet, formattedData, { origin: 'A3' })

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')

      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      })

      const dataBlob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    [data]
  )

  return (
    <>
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: '500',
              letterSpacing: '0.1px',
              lineHeight: '16.94px',
              color: '#006D35'
            }}
          >
            {t('download')}
          </Typography>
          <CircularProgress size='22px' />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            gap: '5px'
          }}
          onClick={() => exportExcelDataCall(!loading && handleExport)}
        >
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: '500',
              letterSpacing: '0.1px',
              lineHeight: '16.94px',
              color: '#006D35'
            }}
          >
            {t('download')}
          </Typography>

          <Icon color='#006D35' icon='solar:download-square-outline' fontSize={22} />
        </Box>
      )}
    </>
  )
}

export default DashboardExelExportButton
