import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { CircularProgress, IconButton, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import dayjs from 'dayjs'

import Icon from 'src/@core/components/icon'
import EggFilterDrawer from './eggFilterDrawer'
import Utility from 'src/utility'
import { GetEggList } from 'src/lib/api/egg/egg'
import { DiscardedEggList } from 'src/lib/api/egg/discard'

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
  loading,
  filterByNurseryId,
  tableSearch
}) => {
  // debugger
  const theme = useTheme()
  const router = useRouter()
  const { search_value, subTab_value = 'eggs_discarded', tab_Value = 'eggs_incubation' } = router.query

  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)

  const [selectedDate, setSelectedDate] = useState(null)
  const [excelLoading, setExcelLoading] = useState(false)

  const handleRemoveFilter = item => {
    const updatedFilterList = filterList.filter(filter => filter.id !== item.id || filter.name !== item.name)
    setFilterList(updatedFilterList)

    const newSelectedFilters = { ...selectedFiltersOptions }

    if (item?.id === 'collected_date') {
      newSelectedFilters.collected_date = null
      setSelectedDate(null)
    } else {
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
  }

  const handleExport = async () => {
    try {
      console.log('export')
      setExcelLoading(true)
      const eggStateIds = selectedFiltersOptions.Stage?.map(option => option.id) || []

      const collectedByIds =
        tab_Value === 'eggs_ready_to_be_discarded_at_nursery'
          ? selectedFiltersOptions['Discarded By']?.map(option => option.id) || []
          : tab_Value === 'eggs_discarded'
          ? selectedFiltersOptions['Discarded By']?.map(option => option.id) || []
          : selectedFiltersOptions['Collected By']?.map(option => option.id) || []
      const siteIds = selectedFiltersOptions.Site?.map(option => option.id) || []

      const statusId = selectedFiltersOptions.status?.id ? [selectedFiltersOptions.status?.id] : ''

      const collectedDate = selectedFiltersOptions.collected_date
        ? dayjs(selectedFiltersOptions.collected_date).format('YYYY-MM-DD')
        : ''

      const discardedByIds = selectedFiltersOptions['Discarded By']?.map(option => option.id) || []
      const activeStatus = selectedFiltersOptions['Security Check']?.map(option => option.id) || []

      // const siteIds = selectedFiltersOptions?.Site?.map(option => option.id) || []
      // const statusId = selectedFiltersOptions?.status ? [selectedFiltersOptions.status] : []

      const discardedDate = selectedFiltersOptions?.collected_date
        ? dayjs(selectedFiltersOptions?.collected_date).format('YYYY-MM-DD')
        : ''

      const apiToUse =
        tab_Value === 'eggs_discarded' && subTab_value === 'eggs_discarded' ? DiscardedEggList : GetEggList

      let params = {}

      if (tab_Value === 'eggs_discarded' && subTab_value === 'eggs_discarded') {
        params = {
          // sort,
          q: tableSearch ? tableSearch : '',
          nursery_id: filterByNurseryId || '',

          // egg_state_id: eggStateIds,
          discarded_by: discardedByIds?.length > 0 ? JSON.stringify(discardedByIds) : '',
          site_id: siteIds?.length > 0 ? JSON.stringify(siteIds) : '',
          activity_status: activeStatus?.length > 0 ? JSON.stringify(activeStatus) : '',

          // egg_status_id: eggStateIds.length > 0 ? statusId : [],
          discarded_on: discardedDate ? discardedDate : ''
        }
      } else {
        params = {
          q: tableSearch ? tableSearch : '',
          sorting_by_date: 'latest_date',
          egg_state_id: eggStateIds?.length > 0 ? JSON.stringify(eggStateIds) : '',
          collected_by: collectedByIds?.length > 0 ? JSON.stringify(collectedByIds) : '',
          site_id: siteIds?.length > 0 ? JSON.stringify(siteIds) : '',
          nursery_id: filterByNurseryId || '',
          egg_status_id: (() => {
            if (tab_Value === 'eggs_incubation' || tab_Value === 'all') {
              return statusId ? JSON.stringify(statusId) : ''
            } else {
              return eggStateIds?.length > 0 ? (statusId ? JSON.stringify(statusId) : '') : ''
            }
          })(),
          collected_date: collectedDate ? collectedDate : '',
          type:
            tab_Value === 'eggs_discarded' && subTab_value === 'eggs_discarded_at_nursery' ? subTab_value : tab_Value
        }
      }

      await apiToUse({ params: params }).then(res => {
        if (res.success || res.data.success) {
          const ListData = res.data.success ? res?.data?.data?.result : res.data.result

          const tableData = ListData.map((item, index) => {
            if (tab_Value === 'eggs_received') {
              return {
                NO: index + 1,
                'DEFAULT COMMON NAME': item.default_common_name || 'Unknown',
                'SCIENTIFIC NAME': item.complete_name || 'Unknown',
                UEID: item.egg_number,
                AEID: item.egg_code,
                CONDITION: `${item.egg_condition} ${item.egg_initial_temperature}`,
                'SITE NAME': item.site_name,
                NURSERY: item.nursery_name,
                'COLLECTED ON': Utility.formatDisplayDate(Utility.convertUTCToLocal(item.collection_date)),
                'COLLECTED BY': item.user_full_name,
                'CREATED ON': `${Utility.formatDisplayDate(Utility.convertUTCToLocal(item.created_at))}`
              }
            } else if (tab_Value === 'eggs_incubation') {
              return {
                NO: index + 1,
                'DEFAULT COMMON NAME': item.default_common_name || 'Unknown',
                'SCIENTIFIC NAME': item.complete_name || 'Unknown',
                UEID: item.egg_number,
                AEID: item.egg_code,
                'STATE ': `${item.egg_status}`,
                STAGE: item.egg_state && item.egg_state,
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
                'ALLOCATED BY': item.user_full_name,
                'ALLOCATED ON': `${Utility.formatDisplayDate(Utility.convertUTCToLocal(item.allocate_date))} `
              }
            } else if (tab_Value === 'eggs_hatched') {
              return {
                NO: index + 1,
                'DEFAULT COMMON NAME': item.default_common_name || 'Unknown',
                'SCIENTIFIC NAME': item.complete_name || 'Unknown',
                UEID: item.egg_number,
                AEID: item.egg_code,
                IDENTIFIER:
                  item.local_id_type || item.local_identifier_value
                    ? `${item.local_id_type} : ${item.local_identifier_value}`
                    : '',
                'ANIMAL ID': item.animal_id && `AAID :${item.animal_id}`,
                'COLLECTED ON': Utility.formatDisplayDate(Utility.convertUTCToLocal(item.collection_date)),
                'HATCHED ON': `${Utility.formatDisplayDate(Utility.convertUTCToLocal(item.hatched_date))} `
              }
            } else if (tab_Value == 'eggs_ready_to_be_discarded_at_nursery') {
              return {
                NO: index + 1,
                'DEFAULT COMMON NAME': item.default_common_name || 'Unknown',
                'SCIENTIFIC NAME': item.complete_name || 'Unknown',
                UEID: item.egg_number,
                AEID: item.egg_code,
                REASON: item.egg_state,
                'COLLECTED ON': Utility.formatDisplayDate(Utility.convertUTCToLocal(item.collection_date)),
                'SITE NAME': item.site_name,
                'INITIATED BY': item.user_full_name,
                'INITIATED ON': `${Utility.formatDisplayDate(
                  Utility.convertUTCToLocal(item.ready_to_be_discarded_date)
                )} `
              }
            } else if (tab_Value === 'all') {
              return {
                NO: index + 1,
                'DEFAULT COMMON NAME': item.default_common_name || 'Unknown',
                'SCIENTIFIC NAME': item.complete_name || 'Unknown',
                UEID: item.egg_number,
                AEID: item.egg_code,
                STATE: `${item.egg_status}`,
                'SITE NAME': item.site_name,
                NURSERY: item.nursery_name,
                'COLLECTED ON': Utility.formatDisplayDate(Utility.convertUTCToLocal(item.collection_date)),
                'COLLECTED BY': item.user_full_name,
                'CREATED ON': `${Utility.formatDisplayDate(Utility.convertUTCToLocal(item.created_at))} `
              }
            } else if (tab_Value === 'eggs_discarded' && subTab_value === 'eggs_discarded_at_nursery') {
              return {
                NO: index + 1,
                'DEFAULT COMMON NAME': item.default_common_name || 'Unknown',
                'SCIENTIFIC NAME': item.complete_name || 'Unknown',
                UEID: item.egg_number,
                AEID: item.egg_code,
                REASON: item.egg_state && item.egg_state,
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

                'INITIATED BY': item.user_full_name,
                'INITIATED ON': Utility.formatDisplayDate(Utility.convertUTCToLocal(item.created_at))
              }
            } else if (tab_Value === 'eggs_discarded' && subTab_value === 'eggs_discarded') {
              return {
                NO: index + 1,
                'REQUEST ID ': item.request_id,
                'EGGS COUNT': item.egg_count,
                'REQUEST CREATED ON': `${Utility.formatDisplayDate(
                  Utility.convertUTCToLocal(item.requested_on)
                )} | ${Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(item.requested_on))}`,

                NURSERY: item.nursery_name,

                'CREATED BY': item.requested_name,

                'SECURITY CHECK':
                  item?.activity_status === 'DISCARD_REQUEST_GENERATED'
                    ? 'Pending'
                    : item?.activity_status === 'COMPLETED'
                    ? `Security Checked `
                    : `Canceled `,
                'SECURITY CHECK BY':
                  item.activity_status === 'CANCELED' ? item.requested_name : item.discarded_person_name,
                'SECURITY CHECK ON': Utility.formatDisplayDate(Utility.convertUTCToLocal(item?.discarded_on))
              }
            }
          })
          let fileName = ''
          if (tab_Value === 'eggs_received') {
            fileName = 'Eggs Received'
          } else if (tab_Value === 'eggs_incubation') {
            fileName = 'Eggs Incubation'
          } else if (tab_Value === 'eggs_hatched') {
            fileName = 'Eggs Hatched'
          } else if (tab_Value === 'eggs_ready_to_be_discarded_at_nursery') {
            fileName = 'Eggs To Be Discarded'
          } else if (tab_Value === 'all') {
            fileName = 'All Eggs'
          } else if (tab_Value === 'eggs_discarded' && subTab_value === 'eggs_discarded_at_nursery') {
            fileName = 'Eggs Discarded'
          } else if (tab_Value === 'eggs_discarded' && subTab_value === 'eggs_discarded') {
            fileName = 'Eggs Batch Discarded'
          }
          Utility.exportToCSV(tableData, fileName)
        } else {
          console.log('excel download fail')
        }
      })
      setExcelLoading(false)
    } catch (error) {
      console.log('error', error)
      setExcelLoading(true)
    }
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
            : <span style={{ fontWeight: 500, color: theme.palette.primary.deepDark }}>{totalCount}</span>
          </Typography>
        </Box>
        <Box sx={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
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

          <>
            {loading || excelLoading ? (
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
                bgcolor: theme?.palette.customColors.lightBg,
                borderRadius: '8px'
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: theme.palette.primary.deepDark,
                  textTransform: 'capitalize'
                }}
              >
                {item?.name}
              </Typography>{' '}
              <IconButton onClick={() => handleRemoveFilter(item)}>
                <Icon icon='mdi:close' fontSize={18} color={theme.palette.primary.light} />
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
