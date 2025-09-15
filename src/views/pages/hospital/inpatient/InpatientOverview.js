import { Divider, Tooltip, Typography, useTheme } from '@mui/material'
import { Box, Grid } from '@mui/system'
import React from 'react'
import MoreMediaListing from 'src/components/MoreMediaListing'
import { renderUserAvatarDetails } from 'src/utility/render'
import HealthcareOverview from './TreatmentOverview'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'

const sampleMediaItems = [
  {
    id: 'm1',
    file_original_name: 'Antz Yelahanka Site Visit - Photos.jpg',
    file: 'https://example.com/media/site-visit-photo.jpg',
    type: 'image',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm2',
    file_original_name: 'Antz Yelahanka Site Visit - Report.pdf',
    file: 'https://example.com/media/site-visit-report.pdf',
    type: 'document',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm3',
    file_original_name: 'Antz Yelahanka Site Visit - Walkthrough.mp4',
    file: 'https://example.com/media/walkthrough.mp4',
    type: 'video',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm4',
    file_original_name: 'Antz Yelahanka Site Visit - Sheet.xlsx',
    file: 'https://example.com/media/visit-sheet.xlsx',
    type: 'document',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm5',
    file_original_name: 'Enclosure Reference Image.png',
    file: 'https://example.com/media/enclosure.png',
    type: 'image',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm6',
    file_original_name: 'Site Voice Note.m4a',
    file: 'https://example.com/media/voice-note.m4a',
    type: 'audio',
    created_at: '2025-08-12T12:23:00Z'
  }
]

const rows = [
  {
    id: 1,
    medical_record: '87546/24',
    hospital_name: 'Hospital name',
    site: '73 Acres',
    admission_date: '1 Jan 2025',
    admission_time: '11:25AM',
    discharged_date: '11 Jan 2025',
    discharge_time: '2:25PM',
    duration: '12 Days',
    case_type: '1st Follow up',
    chief_doctor: 'Dr. Nitin Ashok Ganjigatti'
  },
  {
    id: 2,
    medical_record: '87546/24',
    hospital_name: 'Hospital name',
    site: '73 Acres',
    admission_date: '1 Jan 2025',
    admission_time: '11:25AM',
    discharged_date: '11 Jan 2025',
    discharge_time: '2:25PM',
    duration: '12 Days',
    case_type: 'Routine',
    chief_doctor: 'Dr. Nitin Ashok Ganjigatti'
  }
]

const InpatientOverview = () => {
  const theme = useTheme()

  const columns = [
    {
      field: 'no',
      sortable: false,
      headerName: 'S.NO',
      width: 80,
      headerAlign: 'left',
      align: 'left',
      renderCell: params => (
        <Typography sx={{ fontSize: '12px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
          {params.row.id}
        </Typography>
      )
    },
    {
      field: 'medical_record',
      headerName: 'Medical Record',
      width: 150,
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: params => (
        <Typography sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
          {params.row.medical_record}
        </Typography>
      )
    },
    {
      field: 'hospital_name',
      headerName: 'Hospital & SITE',
      width: 150,
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: params => (
        <Tooltip
          title={
            <Box>
              <Typography sx={{ fontSize: '12px', fontWeight: 400, color: '#FFF' }}>
                {params.row.hospital_name}
              </Typography>
              <Typography sx={{ fontSize: '12px', fontWeight: 400, color: '#FFF' }}>{params.row.site}</Typography>
            </Box>
          }
          arrow
          placement='top'
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              overflow: 'hidden',
              width: '100%',
              cursor: 'pointer'
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                color: theme.palette.customColors.OnSurfaceVariant,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%'
              }}
            >
              {params.row.hospital_name}
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                color: theme.palette.customColors.neutralSecondary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%'
              }}
            >
              {params.row.site}
            </Typography>
          </Box>
        </Tooltip>
      )
    },
    {
      field: 'discharge_date',
      headerName: 'ADMISSION',
      width: 150,
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
            {params.row.admission_date}
          </Typography>
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.neutralSecondary }}>
            {params.row.admission_time}
          </Typography>
        </Box>
      )
    },
    {
      field: 'discharged_date',
      headerName: 'DISCHARGED',
      width: 150,
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
            {params.row.discharged_date}
          </Typography>
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.neutralSecondary }}>
            {params.row.discharge_time}
          </Typography>
        </Box>
      )
    },
    {
      field: 'duration',
      headerName: 'DURATION',
      width: 120,
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: params => (
        <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
          {params.row.duration}
        </Typography>
      )
    },
    {
      field: 'case_type',
      headerName: 'CASE TYPE',
      width: 150,
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: params => (
        <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
          {params.row.case_type}
        </Typography>
      )
    },
    {
      field: 'chief_doctor',
      headerName: 'CHIEF DOCTOR',
      width: 200,
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: params => (
        <Tooltip title={params.row.chief_doctor} arrow placement='top'>
          <Typography
            noWrap
            sx={{
              fontSize: '14px',
              fontWeight: 400,
              color: theme.palette.customColors.OnSurfaceVariant,
              cursor: 'pointer',
              width: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block'
            }}
          >
            {params.row.chief_doctor}
          </Typography>
        </Tooltip>
      )
    }
  ]

  return (
    <>
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Box>
          <HealthcareOverview />
        </Box>
        <Grid container spacing={6} sx={{ borderRadius: 2, p: 4 }}>
          <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.neutralPrimary }}>
              Reason for Admission
            </Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
              <UserAvatarDetails user_name={'Steve Rogers'} date={new Date()} show_time size='medium' />
            </Box>
          </Grid>
          <Grid
            size={{ xs: 12, md: 5 }}
            sx={{ pl: 6, pt: 6, pr: 6, borderLeft: { md: `0.5px solid ${theme.palette.divider}`, xs: 'none' } }}
          >
            {/* <MoreMediaListing mediaItems={sampleMediaItems} maxVisibleItems={2} /> */}
          </Grid>
          <Grid size={{ xs: 12 }}>
            <CommonTable
              columns={columns}
              indexedRows={rows}
              total={rows.length}
              getRowHeight={() => 'auto'}
              externalTableStyle={{
                '& .MuiDataGrid-cell': {
                  padding: 4
                }
              }}
            />
          </Grid>
        </Grid>
      </Box>
    </>
  )
}

export default InpatientOverview
