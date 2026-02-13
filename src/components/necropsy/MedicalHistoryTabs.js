import React, { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import MedicalRecordsList from './MedicalRecordsList'
import DiagnosisList from './DiagnosisList'
import PrescriptionList from './PrescriptionList'
import LabRequestsList from './LabRequestsList'

const TABS = ['Medical Records', 'Diagnosis', 'Prescription', 'Lab Requests']

const MedicalHistoryTabs = ({ animalId }) => {
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState('Medical Records')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Medical Records':
        return <MedicalRecordsList animalId={animalId} />
      case 'Diagnosis':
        return <DiagnosisList animalId={animalId} />
      case 'Prescription':
        return <PrescriptionList animalId={animalId} />
      case 'Lab Requests':
        return <LabRequestsList animalId={animalId} />
      default:
        return null
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Typography
        sx={{
          fontSize: '16px',
          fontWeight: 600,
          color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
        }}
      >
        Medical History
      </Typography>

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
            {TABS.map(tab => (
              <Box
                key={tab}
                onClick={() => setActiveTab(tab)}
                sx={{
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  px: '16px',
                  py: '8px',
                  borderRadius: '8px',
                  backgroundColor:
                    activeTab === tab ? theme.palette.secondary.dark : theme.palette.customColors.mdAntzNeutral,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <Typography
                  sx={{
                    color:
                      activeTab === tab
                        ? theme.palette.primary.contrastText
                        : theme.palette.customColors.neutralPrimary,
                    whiteSpace: 'nowrap',
                    fontSize: { xs: '13px', sm: '14px' },
                    fontWeight: 500
                  }}
                >
                  {tab}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {renderTabContent()}
    </Box>
  )
}

export default MedicalHistoryTabs
