import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Drawer,
  FormControlLabel,
  IconButton,
  Typography,
  useTheme
} from '@mui/material'
import React, { useState } from 'react'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import { getPatientVisitSummary } from 'src/lib/api/hospital/inpatient'
import Utility, { downloadPDF } from 'src/utility'

const ALL_REPORTS_KEY = 'all_reports'

const REPORT_OPTIONS = [
  { key: 'treatment_monitoring', label: 'Treatment Monitoring' },
  { key: 'symptoms', label: 'Symptoms' },
  { key: 'clinical_assessment', label: 'Clinical Assessment' },
  { key: 'clinical_notes', label: 'Clinical Notes' },
  { key: 'other_treatments', label: 'Other Treatments' },
  { key: 'prescription', label: 'Prescriptions' },
  { key: 'anaesthesia', label: 'Anesthesia' },
  { key: 'surgery', label: 'Surgery' }
]

const PatientVisitSummaryFilterDrawer = ({ open, onClose, caseId, animalId }) => {
  const theme = useTheme()

  const [submitLoader, setSubmitLoader] = useState(false)

  const [selectedReports, setSelectedReports] = useState(REPORT_OPTIONS.map(option => option.key))

  const isAllSelected = selectedReports.length === REPORT_OPTIONS.length

  const handleToggleAll = () => {
    setSelectedReports(isAllSelected ? [] : REPORT_OPTIONS.map(o => o.key))
  }

  const handleToggleOption = key => {
    setSelectedReports(prev => (prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]))
  }

  const handleDownload = async () => {
    setSubmitLoader(true)

    try {
      const isAllSelected = selectedReports.length === REPORT_OPTIONS.length

      const sectionsValue = isAllSelected ? ALL_REPORTS_KEY : selectedReports.join(',')

      const payload = {
        sections: sectionsValue,
        animal_id: animalId,
        hospital_case_id: caseId
      }

      await downloadPDF({
        apiCall: getPatientVisitSummary,
        params: payload,
        fileName: `hospital_visit_summary_${Date.now()}.pdf`
      })

      // const response = await getPatientVisitSummary(payload)

      // if (response?.success) {
      //   Utility.downloadFileFromURL(response.data.download_url)
      //   Toaster({ type: 'success', message: response?.message })
      // } else {
      //   Toaster({ type: 'error', message: response?.message || 'Failed to download visit summary' })
      //   setSubmitLoader(false)
      // }
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitLoader(false)
    }
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: '80%', md: 560 },

              // height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.palette.customColors.Background,
              p: 0
            }
          }
        }}
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            pb: 0,
            p: 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'

            // borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center' }}>
            <Icon icon='hugeicons:download-square-02' />
            <Typography sx={{ fontWeight: 500, fontSize: '24px', color: theme.palette.customColors.onSurfaceVariant }}>
              Download Hospital Visit Summary
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            background: theme.palette.customColors.Background,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            minHeight: 0,
            px: 6
          }}
        >
          <Box
            sx={{
              background: theme.palette.customColors.OnPrimary,
              py: 4,
              px: 6,
              borderRadius: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={selectedReports.length > 0 && !isAllSelected}
                  onChange={handleToggleAll}
                />
              }
              label={<Typography fontWeight={600}>All Reports</Typography>}
            />

            {REPORT_OPTIONS.map(option => (
              <FormControlLabel
                key={option.key}
                control={
                  <Checkbox
                    checked={selectedReports.includes(option.key)}
                    onChange={() => handleToggleOption(option.key)}
                  />
                }
                label={
                  <Typography
                    sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.onSurfaceVariant }}
                  >
                    {option.label}
                  </Typography>
                }
              />
            ))}
          </Box>
        </Box>
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            width: '100%',
            p: 5,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            zIndex: 1,
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)',
            flexShrink: 0,
            display: 'flex',
            gap: 4
          }}
        >
          <Button variant='contained' fullWidth color='primary' sx={{ p: 3, fontWeight: 600 }} onClick={handleDownload}>
            {submitLoader ? <CircularProgress size={24} /> : 'Download'}
          </Button>
        </Box>
      </Drawer>
    </>
  )
}

export default PatientVisitSummaryFilterDrawer
