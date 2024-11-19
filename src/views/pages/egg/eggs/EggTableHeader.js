import { CircularProgress, IconButton, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import EggFilterDrawer from './eggFilterDrawer'
import { useRouter } from 'next/router'
import * as XLSX from 'xlsx'
import ExcelExportButton from './exportEggListExcel'
import Utility from 'src/utility'

const EggTableHeader = ({
  totalCount,
  setFilterList,
  handleSearch,
  filterList,
  setSelectedFiltersOptions,
  selectedFiltersOptions,
  searchQuery,
  setSearchQuery,
  selectedOptions,
  setSelectedOptions,
  data,
  loading
}) => {
  // console.log('data :>> ', data)

  // debugger
  const theme = useTheme()
  const router = useRouter()
  const { search_value, subTab_value = 'eggs_discarded', tab_Value = 'eggs_incubation' } = router.query

  // console.log('tab_Value :>> ', tab_Value)
  // console.log('subTab_value :>> ', subTab_value)

  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)

  const [selectedDate, setSelectedDate] = useState(null)

  const handleRemoveFilter = item => {
    const updatedFilterList = filterList.filter(filter => filter.id !== item.id || filter.name !== item.name)
    setFilterList(updatedFilterList)

    const newSelectedFilters = { ...selectedFiltersOptions }

    // console.log('newSelectedFilters :>> ', newSelectedFilters)

    if (item?.id === 'collected_date') {
      newSelectedFilters.collected_date = null
      setSelectedDate(null)
    }

    // else if (item?.id === 'search') {
    //   setSearchQuery('')
    //   handleSearch('')
    //   router.push({ query: { ...router.query, search_value: '' } }, undefined, { shallow: true }) // Update the URL without a page refresh
    // }
    else {
      newSelectedFilters.status = null
    }

    for (const category in newSelectedFilters) {
      if (Array.isArray(newSelectedFilters[category])) {
        newSelectedFilters[category] = newSelectedFilters[category].filter(
          filter => filter.id !== item.id || filter.name !== item.name
        )
      }
    }

    // Update the state with the new selected filters
    setSelectedFiltersOptions(newSelectedFilters)
    setSelectedOptions(newSelectedFilters)

    // Optionally refetch the table data if needed
    // fetchTableData();
  }

  // Download excel

  const [xlsxList, setXlsxList] = useState([])

  // console.log('xlsxList :>> ', xlsxList)
  const [fileName, setFileName] = useState('Eggs Incubation')

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
        'INITIAL WEIGHT IN GM': item.initial_weight,
        'CURRENT WEIGHT IN GM': item.current_weight,
        'LENGTH IN MM': item.initial_length,
        'WIDTH IN MM': item.initial_width,
        'NO.EGGS / CLUTCH': item.no_of_eggs_in_clutch,
        'CLUTCH ID': item.clutch_id,
        ENCLOSURE: item.enclosure_name,
        'SITE NAME': item.site_name,
        NURSERY: item.nursery_name,

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 4, py: 4 }}>
        <Box>
          <Typography sx={{ fontSize: '14px', fontWeight: 300 }}>
            {' '}
            {tab_Value === 'eggs_received'
              ? 'Total eggs in  received'
              : tab_Value === 'eggs_hatched'
              ? 'Total eggs in hatched'
              : tab_Value === 'eggs_incubation'
              ? 'Total eggs in incubation'
              : tab_Value === 'eggs_ready_to_be_discarded_at_nursery'
              ? 'Total eggs to be discarded'
              : tab_Value === 'eggs_discarded' && subTab_value === 'eggs_discarded'
              ? 'Total batch discarded'
              : tab_Value === 'eggs_discarded' && subTab_value === 'eggs_discarded_at_nursery'
              ? 'Total eggs discarded'
              : 'Total eggs'}{' '}
            : <span style={{ fontWeight: 500, color: '#000000' }}>{totalCount}</span>
          </Typography>
        </Box>
        <Box sx={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #C3CEC7',
              borderRadius: '4px',
              padding: '0 8px',
              height: '40px'
            }}
          >
            <Icon icon='mi:search' fontSize={20} />
            <TextField
              variant='outlined'
              placeholder='Search'
              value={searchQuery}
              InputProps={{
                disableUnderline: true
              }}
              onChange={e => {
                setSearchQuery(e.target.value)
                handleSearch(e.target.value)

                router.push({ query: { ...router.query, search_value: e.target.value } }, undefined, { shallow: true })
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  border: 'none',
                  padding: '0',
                  '& fieldset': {
                    border: 'none'
                  }
                }
              }}
            />
          </Box>

          {/* <ExcelExportButton tab_Value={tab_Value} subTab_value={subTab_value} data={data} /> */}

          <>
            {loading ? (
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
              >
                <CircularProgress color='success' size={30} />
              </Box>
            ) : (
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
            )}
          </>

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
            onClick={() => setOpenFilterDrawer(true)}
          >
            <Icon icon='mage:filter' fontSize={24} />
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: '12px', px: 4, mb: 4, flexWrap: 'wrap' }}>
        {filterList?.length > 0 &&
          filterList?.map((item, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '6px',
                p: '8px',
                py: '2px',
                bgcolor: '#EFF5F2',
                borderRadius: '8px'
              }}
            >
              <Typography sx={{ fontSize: '14px', fontWeight: 'bold', color: '#000000', textTransform: 'capitalize' }}>
                {item?.name}
              </Typography>{' '}
              <IconButton onClick={() => handleRemoveFilter(item)}>
                <Icon icon='mdi:close' fontSize={18} color={'#1F515B'} />
              </IconButton>
            </Box>
          ))}
      </Box>
      {openFilterDrawer && (
        <EggFilterDrawer
          setOpenFilterDrawer={setOpenFilterDrawer}
          openFilterDrawer={openFilterDrawer}
          setFilterList={setFilterList}
          filterLi={filterList}
          setSelectedFiltersOptions={setSelectedFiltersOptions}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      )}
    </>
  )
}

export default EggTableHeader
