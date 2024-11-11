import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import Button from '@mui/material/Button'
import Utility from 'src/utility'
import Icon from 'src/@core/components/icon'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const DashboardExelExportButton = ({ tab_Value, data }) => {
  const theme = useTheme()

  const [xlsxList, setXlsxList] = useState([])
  const [fileName, setFileName] = useState('Egg Table List')

  // console.log('tab_Value :>> ', tab_Value)

  useEffect(() => {
    if (tab_Value === 'species') {
      setFileName('Species')

      const formattedData = data?.map((item, index) => ({
        NO: index + 1,
        SPECIES: `${item.complete_name || '-'} (${item?.default_common_name || '-'})`,
        'TOTAL EGGS': item.total_eggs || '-',
        'CURRENTLY IN NEST': item.currently_in_nest || '-',
        'CURRENTLY IN NURSERY': item.currently_in_nursery || '-',
        'HATCHED IN NEST %': `${
          Number(item.hatched_in_nest) + Number(item.discarded_at_site) + Number(item.ready_tobe_discarded_at_nursery) >
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

      const formattedData = data?.map((item, index) => ({
        NO: index + 1,
        SITES: item.site_name || '-',
        'TOTAL EGGS': item.total_eggs || '-',
        'CURRENTLY IN NEST': item.currently_in_nest || '-',
        'CURRENTLY IN NURSERY': item.currently_in_nursery || '-',
        'HATCHED IN NEST %': `${
          Number(item.hatched_in_nest) + Number(item.discarded_at_site) + Number(item.ready_tobe_discarded_at_nursery) >
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

      const formattedData = data.map((item, index) => ({
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
  }, [tab_Value, data])

  const handleExport = () => {
    // Create a worksheet from the data
    const worksheet = XLSX.utils.json_to_sheet([])

    // Add static header data
    const headerData = [
      // ['Egg Data Report'], // Header text
      // ['Name'] // Column header
    ]

    // Add the header data to the worksheet
    XLSX.utils.sheet_add_aoa(worksheet, headerData, { origin: 'A1' })

    // Add table data starting from row 3 (A3)
    XLSX.utils.sheet_add_json(worksheet, xlsxList, { origin: 'A3' })

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')

    // Convert the workbook to binary and create a blob
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    })

    const dataBlob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    // Create a download link and trigger it
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          gap: '5px'
        }}
        onClick={handleExport}
      >
        <Typography
          sx={{ fontSize: '14px', fontWeight: '500', letterSpacing: '0.1px', lineHeight: '16.94px', color: '#006D35' }}
        >
          Download
        </Typography>
        <Icon color='#006D35' icon='solar:download-square-outline' fontSize={22} />
      </Box>
    </>
  )
}

export default DashboardExelExportButton
