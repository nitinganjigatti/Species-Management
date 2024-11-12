import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import Button from '@mui/material/Button'
import Utility from 'src/utility'
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const ExcelExportButton = ({ tab_Value, subTab_value, data = [] }) => {
  const theme = useTheme()

  const [xlsxList, setXlsxList] = useState([])
  const [fileName, setFileName] = useState('Egg Table List')

  //   console.log('xlsxList :>> ', xlsxList)
  // console.log('tab_Value :>> ', tab_Value)

  useEffect(() => {
    if (tab_Value === 'eggs_received') {
      setFileName('Eggs Received')

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
    } else if (tab_Value === 'eggs_incubation') {
      setFileName('Eggs Incubation')

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
    } else if (tab_Value == 'eggs_hatched') {
      setFileName('Egg Hatched')

      const formattedData = data?.map((item, index) => ({
        NO: index + 1,
        'DEFAULT COMMON NAME': item.default_common_name || 'Unknown',
        'SCIENTIFIC NAME': item.complete_name || 'Unknown',
        UEID: item.egg_number,
        AEID: item.egg_code,
        IDENTIFIER: `${item.local_id_type} : ${item.local_identifier_value}`,
        'ANIMAL ID': `AAID :${item.animal_id}`,
        'COLLECTED ON': Utility.formatDisplayDate(Utility.convertUTCToLocal(item.collection_date)),
        'HATCHED ON': `${Utility.formatDisplayDate(Utility.convertUTCToLocal(item.hatched_date))} `
      }))
      setXlsxList(formattedData)
    } else if (tab_Value == 'eggs_ready_to_be_discarded_at_nursery') {
      setFileName('Egg To Be discarded')

      const formattedData = data?.map((item, index) => ({
        NO: index + 1,
        'DEFAULT COMMON NAME': item.default_common_name || 'Unknown',
        'SCIENTIFIC NAME': item.complete_name || 'Unknown',
        UEID: item.egg_number,
        AEID: item.egg_code,
        REASON: item.egg_state,
        'COLLECTED ON': Utility.formatDisplayDate(Utility.convertUTCToLocal(item.collection_date)),
        'SITE NAME': item.site_name,
        'INITIATED BY': `${Utility.formatDisplayDate(Utility.convertUTCToLocal(item.ready_to_be_discarded_date))} `
      }))
      setXlsxList(formattedData)
    } else if (tab_Value === 'all') {
      setFileName('All Egg')

      const formattedData = data?.map((item, index) => ({
        NO: index + 1,
        'DEFAULT COMMON NAME': item.default_common_name || 'Unknown',
        'SCIENTIFIC NAME': item.complete_name || 'Unknown',
        UEID: item.egg_number,
        AEID: item.egg_code,
        STATE: `${item.egg_status}`,
        'SITE NAME': item.site_name,
        NURSERY: item.nursery_name,
        'COLLECTED ON': Utility.formatDisplayDate(Utility.convertUTCToLocal(item.collection_date)),
        'COLLECTED BY': `${item.user_full_name} ${Utility.formatDisplayDate(
          Utility.convertUTCToLocal(item.created_at)
        )} `
      }))
      setXlsxList(formattedData)
    } else if (tab_Value === 'eggs_discarded' && subTab_value === 'eggs_discarded_at_nursery') {
      setFileName('Eggs Discarded')

      const formattedData = data?.map((item, index) => ({
        NO: index + 1,
        'DEFAULT COMMON NAME': item.default_common_name || 'Unknown',
        'SCIENTIFIC NAME': item.complete_name || 'Unknown',
        UEID: item.egg_number,
        AEID: item.egg_code,
        REASON: `${item.egg_state}`,
        'COLLECTED ON': Utility.formatDisplayDate(Utility.convertUTCToLocal(item.collection_date)),
        'SAMPLE TAKEN':
          item.necropsy_file_uploaded === '0'
            ? item.is_necropsy_needed === '1'
              ? 'Not Yet'
              : 'NA'
            : item.is_sample_collected === '1'
            ? 'Taken'
            : 'NA',
        'NECROPSY REPORT':
          item.necropsy_file_uploaded === '1' ? 'Yes' : item.is_necropsy_needed === '1' ? 'Attach File' : 'NA',

        'INITIATED BY': `${item.user_full_name} ${Utility.formatDisplayDate(
          Utility.convertUTCToLocal(item.created_at)
        )} `
      }))
      setXlsxList(formattedData)
    } else if (tab_Value === 'eggs_discarded' && subTab_value === 'eggs_discarded') {
      setFileName('Eggs Batch Discarded')

      const formattedData = data?.map((item, index) => ({
        NO: index + 1,
        'REQUEST ID & EGGS': `${item.request_id} , Egg Count:${item.egg_count}`,
        'REQUEST CREATED ON': `${Utility.formatDisplayDate(
          Utility.convertUTCToLocal(item.requested_on)
        )} | ${Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(item.requested_on))}`,

        NURSERY: item.nursery_name,

        'CREATED BY': `${item.requested_name} , ${Utility.formatDisplayDate(
          Utility.convertUTCToLocal(item.requested_on)
        )} | ${Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(item.requested_on))} `,
        'SECURITY CHECK':
          item.activity_status === 'DISCARD_REQUEST_GENERATED'
            ? 'Pending'
            : item.activity_status === 'COMPLETED'
            ? `Security Checked ${item.discarded_person_name}`
            : `Canceled ${item.commented_by}`
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

      {/* <Button
        variant='contained'
        color='primary'
        onClick={handleExport}
        sx={{ alignItems: 'center', justifyContent: 'center', gap: 1 }}
      >
        Excel
      </Button> */}
    </>
  )
}

export default ExcelExportButton
