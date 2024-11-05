import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import Button from '@mui/material/Button'
import Utility from 'src/utility'
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const DashboardExelExportButton = ({ tab_Value, data }) => {
  const theme = useTheme()

  const [xlsxList, setXlsxList] = useState([])
  const [fileName, setFileName] = useState('Egg Table List')

  console.log('tab_Value :>> ', tab_Value)

  useEffect(() => {
    if (tab_Value === 'species') {
      setFileName('Species')

      const formattedData = data?.map((item, index) => ({
        NO: index + 1,
        'DEFAULT COMMON NAME': item.default_common_name || 'Unknown',
        'SCIENTIFIC NAME': item.complete_name || 'Unknown',
        UEID: item.egg_number,
        AEID: item.egg_code,
        CONDITION: `${item.egg_condition} ${item.egg_initial_temperature}`,
        'SITE NAME': item.site_name,
        NURSERY: item.nursery_name,
        'COLLECTED ON': Utility.formatDisplayDate(Utility.convertUTCToLocal(item.collection_date)),
        'COLLECTED BY': `${item.user_full_name} ${Utility.formatDisplayDate(
          Utility.convertUTCToLocal(item.created_at)
        )} `
      }))
      setXlsxList(formattedData)
    } else if (tab_Value === 'site') {
      setFileName('Site')

      const formattedData = data?.map((item, index) => ({
        NO: index + 1,
        'DEFAULT COMMON NAME': item.default_common_name || 'Unknown',
        'SCIENTIFIC NAME': item.complete_name || 'Unknown',
        UEID: item.egg_number,
        AEID: item.egg_code,
        'STATE & STAGE': `${item.egg_status} ${item.egg_state}`,
        'DAY IN INCUBATION': item.days_in_incubation,
        'INITIAL WEIGHT': item.initial_weight,
        'CURRENT WEIGHT': item.current_weight,
        'INITIAL SIZE-L': item.initial_length,
        'INITIAL SIZE-W': item.initial_width,
        NURSERY: item.nursery_name,
        'SITE NAME': item.site_name,
        'NO.EGGS / CLUTCH': item.no_of_eggs_in_clutch,
        'CLUTCH ID': item.clutch_id,
        ENCLOSURE: item.enclosure_name,
        'COLLECTED ON': Utility.formatDisplayDate(Utility.convertUTCToLocal(item.collection_date)),
        'ALLOCATED BY': `${item.user_full_name} ${Utility.formatDisplayDate(
          Utility.convertUTCToLocal(item.allocate_date)
        )} `
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
        } % ${item.hatched_in_nursery ? `(${item.hatched_in_nursery})` : '-'}`,
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
          width: '40px',
          height: '40px',
          borderRadius: '4px',
          bgcolor: theme?.palette.customColors?.lightBg,
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={handleExport}
      >
        <Icon icon='ic:round-download' fontSize={20} />
      </Box>
    </>
  )
}

export default DashboardExelExportButton
