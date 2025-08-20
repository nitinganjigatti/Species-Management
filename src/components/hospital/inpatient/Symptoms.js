import React, { useEffect, useState } from 'react'
import { Box, Button, Typography, FormControlLabel } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useRouter } from 'next/router'
import Search from 'src/views/utility/Search'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
import { useTheme } from '@mui/material/styles'
import SymptomsCard from 'src/views/pages/hospital/inpatient/SymptomsCard'

// Sample medical records data
const symptomsRecords = [
  {
    id: 'MED-12345/25',
    title: 'Gum infection',
    type: 'Diagnosis',
    status: 'resolved',
    severity: 'Low',
    category: 'Chronic',
    activity: '+2',
    days: 10,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore',
    lastUpdated: '12:05 PM • 19 May 2025',
    resolvedBy: {
      name: 'Jordan Stevenson',
      avatar: 'JS',
      date: '02 Jan 2025 • 12:35 PM'
    }
  },
  {
    id: 'MED-12345/25',
    title: 'Gum infection',
    type: 'Diagnosis',
    status: 'active',
    severity: 'Medium',
    category: 'Chronic',
    activity: '+2',
    days: 10,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore',
    lastUpdated: '12:05 PM • 19 May 2025',
    resolvedBy: {
      name: 'Jordan Stevenson',
      avatar: 'JS',
      date: '02 Jan 2025 • 12:35 PM'
    }
  },
  {
    id: 'MED-12345/25',
    title: 'Coagulopathy',
    type: 'Diagnosis',
    status: 'active',
    severity: 'High',
    category: 'Chronic',
    activity: '+2',
    days: 10,
    clinicalAssessment: 'Differential → Diagnosis',
    chronic: 'No',
    prognosis: 'Favourable',
    notes:
      'Mild oral plaque formation inside beak noted Mild oral plaque formation inside beak noted Mild oral plaque formation inside beak noted',
    lastUpdated: '12:05 PM • 19 May 2025',
    resolvedBy: {
      name: 'Jordan Stevenson',
      avatar: 'JS',
      date: '02 Jan 2025 • 12:35 PM'
    }
  },
  {
    id: 'MED-12345/25',
    title: 'Assessment Name 3',
    type: 'Diagnosis',
    status: 'active',
    severity: 'Extreme',
    category: 'Chronic',
    activity: '+2',
    days: 10,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore',
    lastUpdated: '12:05 PM • 19 May 2025',
    resolvedBy: {
      name: 'Jordan Stevenson',
      avatar: 'JS',
      date: '02 Jan 2025 • 12:35 PM'
    }
  },
  {
    id: 'MED-12345/25',
    title: 'Assessment Name 3',
    type: 'Diagnosis',
    status: 'active',
    severity: 'Low',
    category: 'Chronic',
    activity: '+2',
    days: 10,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore',
    lastUpdated: '12:05 PM • 19 May 2025',
    resolvedBy: {
      name: 'Jordan Stevenson',
      avatar: 'JS',
      date: '02 Jan 2025 • 12:35 PM'
    }
  },
  {
    id: 'MED-12345/25',
    title: 'Assessment Name 3',
    type: 'Diagnosis',
    status: 'active',
    severity: 'Medium',
    category: 'Chronic',
    activity: '+2',
    days: 10,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore',
    lastUpdated: '12:05 PM • 19 May 2025',
    resolvedBy: {
      name: 'Jordan Stevenson',
      avatar: 'JS',
      date: '02 Jan 2025 • 12:35 PM'
    }
  },
  {
    id: 'MED-12345/25',
    title: 'Gum infection',
    type: 'Differential',
    status: 'active',
    severity: 'Extreme',
    category: null,
    activity: '+2',
    days: 10,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore',
    lastUpdated: '12:05 PM • 19 May 2025',
    highlighted: true
  }
]

const Symptoms = () => {
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState('Active')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentRecordOnly, setCurrentRecordOnly] = useState(false)
  const [records, setRecords] = useState([])

  const activeRecords = symptomsRecords.filter(record => record.status === 'active')
  const resolvedRecords = symptomsRecords.filter(record => record.status === 'resolved')

  const theme = useTheme()

  const tabs = ['Active', 'Resolved', 'All']

  const getFilteredRecords = () => {
    let records = symptomsRecords

    switch (currentTab) {
      case 'Active':
        records = activeRecords
        break
      case 'Resolved':
        records = resolvedRecords
        break
      case 'All':
      default:
        records = symptomsRecords
        break
    }

    if (searchQuery) {
      records = records.filter(
        record =>
          record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    setRecords(records)

    return records
  }

  const handleTabChange = newValue => {
    setCurrentTab(newValue)
  }

  useEffect(() => {
    getFilteredRecords()
  }, [currentTab])

  return (
    <Box>
      {/* Header with Tabs and Controls */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 6,
            flexWrap: 'wrap',
            rowGap: 4
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                flex: '1 1 auto',
                minWidth: 0,
                overflowX: 'auto',
                scrollbarColor: 'transparent transparent',
                columnGap: 4
              }}
            >
              <Box sx={{ display: 'inline-flex', gap: 3, pr: 1, alignItems: 'center' }}>
                {tabs.map(tab => (
                  <Box
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    sx={{
                      flexShrink: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      px: '16px',
                      py: '8px',
                      borderRadius: '8px',
                      backgroundColor:
                        currentTab === tab ? theme.palette.secondary.dark : theme.palette.customColors.mdAntzNeutral,
                      cursor: 'pointer'
                    }}
                  >
                    <Typography
                      sx={{
                        color:
                          currentTab === tab
                            ? theme.palette.primary.contrastText
                            : theme.palette.customColors.neutralPrimary,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tab}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <Search value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <Button variant='contained' startIcon={<AddIcon />} onClick={() => router.push('/hospital/symptoms')}>
              ADD NEW
            </Button>
          </Box>
        </Box>

        {/* <FormControlLabel
          control={
            <MUISwitch
              checked={currentRecordOnly}
              onChange={e => setCurrentRecordOnly(e.target.checked)}
              size='small'
            />
          }
          label='Current Medical Record Only'
          sx={{ ml: 0.5 }}
        /> */}
      </Box>

      {/* Records List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {records?.map((record, index) => (
          <SymptomsCard
            key={index}
            record={record}
            isDifferential={record.type === 'Differential'}
            isResolved={record.status === 'resolved'}
          />
        ))}
      </Box>
    </Box>
  )
}

export default Symptoms
