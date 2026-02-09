import React, { useState, useEffect } from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Chip,
  Skeleton,
  Divider,
  Avatar
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import {
  Close as CloseIcon,
  MedicalServices as DxIcon,
  Pets as CxIcon,
  Description as RxIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Sms as SmsIcon,
  CalendarToday as CalendarIcon,
  AttachFile as AttachmentIcon,
  Notes as NotesIcon,
  Event as FollowUpIcon,
  Favorite as CaseTypeIcon,
  Science as LabIcon,
  Lightbulb as AdviceIcon,
  History as HistoryIcon
} from '@mui/icons-material'
import { getMedicalRecordDetails } from 'src/lib/api/necropsy/medicalHistory'
import { MedicalIdChip } from 'src/views/pages/hospital/utility/hospitalSnippets'
import AnimalCard from 'src/views/utility/AnimalCard'
import MedicalJournalDrawer from './MedicalJournalDrawer'
import Utility from 'src/utility'

const TAB_ICONS = [
  { id: 'case_type', icon: CaseTypeIcon, label: 'Case Type' },
  { id: 'complaints', icon: CxIcon, label: 'Symptoms' },
  { id: 'diagnosis', icon: DxIcon, label: 'Diagnosis' },
  { id: 'prescription', icon: RxIcon, label: 'Prescription' },
  { id: 'advice', icon: AdviceIcon, label: 'Advice' },
  { id: 'lab', icon: LabIcon, label: 'Lab Tests' },
  { id: 'attachments', icon: AttachmentIcon, label: 'Attachments' },
  { id: 'notes', icon: NotesIcon, label: 'Notes' },
  { id: 'followup', icon: FollowUpIcon, label: 'Follow-up' }
]

const MedicalRecordDetailDrawer = ({ open, onClose, medicalRecordId }) => {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('case_type')
  const [journalDrawerOpen, setJournalDrawerOpen] = useState(false)

  useEffect(() => {
    if (open && medicalRecordId) {
      fetchDetails()
    }
  }, [open, medicalRecordId])

  useEffect(() => {
    if (data) {
      // Set initial active tab to first available section
      const availableTabs = getAvailableTabs()
      if (availableTabs.length > 0 && !availableTabs.find(t => t.id === activeTab)) {
        setActiveTab(availableTabs[0].id)
      }
    }
  }, [data])

  const fetchDetails = async () => {
    try {
      setLoading(true)
      const res = await getMedicalRecordDetails(medicalRecordId)
      if (res?.success) {
        setData(res.data)
      }
    } catch (error) {
      console.error('Error fetching medical record details:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAvailableTabs = () => {
    if (!data) return []

    return TAB_ICONS.filter(tab => {
      switch (tab.id) {
        case 'case_type':
          return data?.case_type?.label
        case 'complaints':
          return data?.complaints?.length > 0
        case 'diagnosis':
          return data?.diagnosis?.length > 0
        case 'prescription':
          return data?.prescription?.length > 0
        case 'advice':
          return data?.advices?.length > 0
        case 'lab':
          return data?.lab?.length > 0 || data?.lab_data?.length > 0
        case 'attachments':
          return data?.notes?.images?.length > 0 || data?.notes?.documents?.length > 0 || data?.notes?.videos?.length > 0
        case 'notes':
          return data?.notes?.notes?.length > 0
        case 'followup':
          return data?.follow_up_date
        default:
          return false
      }
    })
  }

  const renderShimmer = () => (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Skeleton variant='circular' width={40} height={40} />
        <Box>
          <Skeleton variant='text' width={150} height={28} />
          <Skeleton variant='text' width={200} height={20} />
        </Box>
      </Box>
      <Skeleton variant='rectangular' height={80} sx={{ mb: 3, borderRadius: 1 }} />
      <Skeleton variant='rectangular' height={100} sx={{ mb: 3, borderRadius: 2 }} />
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} variant='circular' width={40} height={40} />
        ))}
      </Box>
      <Skeleton variant='rectangular' height={150} sx={{ borderRadius: 1 }} />
    </Box>
  )

  const animalData = data?.animal_details?.[0]

  const activeComplaints = data?.complaints?.filter(c => c?.additional_info?.status === 'active') || []
  const closedComplaints = data?.complaints?.filter(c => c?.additional_info?.status === 'closed') || []
  const activeDiagnosis = data?.diagnosis?.filter(d => d?.additional_info?.status === 'active') || []
  const closedDiagnosis = data?.diagnosis?.filter(d => d?.additional_info?.status === 'closed') || []
  const activePrescription = data?.prescription?.filter(p => p?.status === 'active') || []
  const closedPrescription = data?.prescription?.filter(p => p?.status === 'close' || p?.status === 'closed') || []

  const availableTabs = getAvailableTabs()

  const renderTabContent = () => {
    switch (activeTab) {
      case 'case_type':
        return (
          <Box>
            <SectionHeader icon={CaseTypeIcon} title='Case Type' theme={theme} />
            <Box sx={{ ml: 4 }}>
              <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.success.main }}>
                {data?.case_type?.label}
              </Typography>
            </Box>
          </Box>
        )

      case 'complaints':
        return (
          <Box>
            <SectionHeader icon={CxIcon} title='Symptoms' theme={theme} />
            <Box sx={{ ml: 4 }}>
              {activeComplaints.length > 0 && (
                <>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.primary, mb: 2 }}>
                    {activeComplaints.length} Active
                  </Typography>
                  {activeComplaints.map((item, idx) => (
                    <ComplaintCard key={idx} item={item} theme={theme} />
                  ))}
                </>
              )}
              {closedComplaints.length > 0 && (
                <>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.secondary, mb: 2, mt: 3 }}>
                    {closedComplaints.length} Closed
                  </Typography>
                  {closedComplaints.map((item, idx) => (
                    <ComplaintCard key={idx} item={item} theme={theme} isClosed />
                  ))}
                </>
              )}
            </Box>
          </Box>
        )

      case 'diagnosis':
        return (
          <Box>
            <SectionHeader icon={DxIcon} title='Clinical Assessment' theme={theme} />
            <Box sx={{ ml: 4 }}>
              {activeDiagnosis.length > 0 && (
                <>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.primary, mb: 2 }}>
                    {activeDiagnosis.length} Active
                  </Typography>
                  {activeDiagnosis.map((item, idx) => (
                    <DiagnosisCard key={idx} item={item} theme={theme} />
                  ))}
                </>
              )}
              {closedDiagnosis.length > 0 && (
                <>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.secondary, mb: 2, mt: 3 }}>
                    {closedDiagnosis.length} Closed
                  </Typography>
                  {closedDiagnosis.map((item, idx) => (
                    <DiagnosisCard key={idx} item={item} theme={theme} isClosed />
                  ))}
                </>
              )}
            </Box>
          </Box>
        )

      case 'prescription':
        return (
          <Box>
            <SectionHeader icon={RxIcon} title='Prescription' theme={theme} />
            <Box sx={{ ml: 4 }}>
              {activePrescription.length > 0 && (
                <>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.primary, mb: 2 }}>
                    {activePrescription.length} Active
                  </Typography>
                  {activePrescription.map((item, idx) => (
                    <PrescriptionCard key={idx} item={item} theme={theme} />
                  ))}
                </>
              )}
              {closedPrescription.length > 0 && (
                <>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.secondary, mb: 2, mt: 3 }}>
                    {closedPrescription.length} Stopped
                  </Typography>
                  {closedPrescription.map((item, idx) => (
                    <PrescriptionCard key={idx} item={item} theme={theme} isStopped />
                  ))}
                </>
              )}
            </Box>
          </Box>
        )

      case 'advice':
        return (
          <Box>
            <SectionHeader icon={AdviceIcon} title='Advice' theme={theme} />
            <Box sx={{ ml: 4, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {data?.advices?.map((item, idx) => (
                <Chip
                  key={idx}
                  label={item.name}
                  size='small'
                  sx={{
                    fontSize: '13px',
                    fontWeight: 500,
                    height: 28,
                    borderRadius: '6px',
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    color: theme.palette.text.primary
                  }}
                />
              ))}
            </Box>
          </Box>
        )

      case 'lab':
        return (
          <Box>
            <SectionHeader icon={LabIcon} title='Lab Test Requests' theme={theme} />
            <Box sx={{ ml: 4 }}>
              {data?.lab?.map((item, idx) => (
                <LabCard key={idx} item={item} theme={theme} />
              ))}
              {data?.lab_data?.map((item, idx) => (
                <LabCard key={`data_${idx}`} item={item} theme={theme} />
              ))}
            </Box>
          </Box>
        )

      case 'attachments':
        return (
          <Box>
            <SectionHeader icon={AttachmentIcon} title='Attachments' theme={theme} />
            <Box sx={{ ml: 4 }}>
              <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: 2 }}>
                {(data?.notes?.images?.length || 0) + (data?.notes?.documents?.length || 0) + (data?.notes?.videos?.length || 0)} file(s) attached
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {data?.notes?.images?.map((file, idx) => (
                  <Box
                    key={`img_${idx}`}
                    component='a'
                    href={file.file || file.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    sx={{
                      width: 70,
                      height: 70,
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <Box
                      component='img'
                      src={file.file || file.url}
                      alt={file.file_original_name || 'Image'}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                ))}
                {data?.notes?.documents?.map((file, idx) => (
                  <Box
                    key={`doc_${idx}`}
                    component='a'
                    href={file.file || file.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.5,
                      textDecoration: 'none',
                      color: 'inherit',
                      minWidth: 70,
                      '&:hover': { bgcolor: theme.palette.action.hover }
                    }}
                  >
                    <RxIcon sx={{ fontSize: 24, color: theme.palette.text.secondary }} />
                    <Typography sx={{ fontSize: '10px', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.file_original_name || 'Doc'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )

      case 'notes':
        return (
          <Box>
            <SectionHeader icon={NotesIcon} title='Notes' theme={theme} />
            <Box sx={{ ml: 4 }}>
              {data?.notes?.notes?.map((note, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 1,
                    bgcolor: theme.palette.customColors?.notes || alpha(theme.palette.info.main, 0.08)
                  }}
                >
                  {note.created_at && (
                    <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary, mb: 1 }}>
                      {Utility.convertUtcToLocalReadableDate(note.created_at)} {Utility.convertUTCToLocaltime(note.created_at)}
                    </Typography>
                  )}
                  <Typography sx={{ fontSize: '14px', color: theme.palette.text.primary, whiteSpace: 'pre-wrap' }}>
                    {note.note?.replace(/\\n/g, '\n') || note.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )

      case 'followup':
        return (
          <Box>
            <SectionHeader icon={FollowUpIcon} title='Next Visit / Follow-up' theme={theme} />
            <Box
              sx={{
                ml: 4,
                p: 2,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.warning.main, 0.08),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <CalendarIcon sx={{ fontSize: 18, color: theme.palette.warning.dark }} />
              <Typography sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.warning.dark }}>
                {Utility.convertUtcToLocalReadableDate(data?.follow_up_date)}
              </Typography>
            </Box>
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 480, md: 520 },
          maxWidth: '100%'
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper
        }}
      >
        <Typography sx={{ fontSize: '16px', fontWeight: 600, color: theme.palette.text.primary }}>
          Medical Record
        </Typography>
        <IconButton onClick={onClose} size='small'>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          renderShimmer()
        ) : !data ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color='text.secondary'>Failed to load medical record details</Typography>
          </Box>
        ) : (
          <Box>
            {/* Medical Record Header */}
            <Box sx={{ p: 3, bgcolor: theme.palette.background.paper }}>
              {/* Record ID and History Icon */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {data?.case_type?.default_icon ? (
                    <Avatar
                      src={data.case_type.default_icon}
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: data.case_type.color_code || theme.palette.primary.main
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        bgcolor: theme.palette.success.main,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <CaseTypeIcon sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                  )}
                  <Typography sx={{ fontSize: '18px', fontWeight: 600, color: theme.palette.text.primary }}>
                    {data?.medical_record_code || `MR-${data?.id}`}
                  </Typography>
                </Box>
                <IconButton
                  size='small'
                  sx={{ bgcolor: theme.palette.grey[100] }}
                  onClick={() => setJournalDrawerOpen(true)}
                >
                  <HistoryIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>

              {/* Case Type + Date */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {data?.case_type?.label && (
                  <Typography sx={{ fontSize: '13px', fontWeight: 500, color: theme.palette.success.main }}>
                    {data.case_type.label}
                  </Typography>
                )}
                {data?.created_at && (
                  <>
                    <Box component='span' sx={{ color: theme.palette.text.disabled }}>&bull;</Box>
                    <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
                      {Utility.convertUtcToLocalReadableDate(data.created_at)} {Utility.convertUTCToLocaltime(data.created_at)}
                    </Typography>
                  </>
                )}
              </Box>

              {/* Created By */}
              {data?.user_details && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>By</Typography>
                  <Chip
                    icon={<PersonIcon sx={{ fontSize: 16 }} />}
                    label={data.user_details.user_full_name || 'N/A'}
                    size='small'
                    sx={{
                      bgcolor: theme.palette.customColors?.surfaceVariant || theme.palette.grey[100],
                      '& .MuiChip-label': { fontSize: '13px' }
                    }}
                  />
                  <IconButton size='small' sx={{ bgcolor: theme.palette.customColors?.surfaceVariant || theme.palette.grey[100] }}>
                    <PhoneIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton size='small' sx={{ bgcolor: theme.palette.customColors?.surfaceVariant || theme.palette.grey[100] }}>
                    <SmsIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Divider />

            {/* Animal Card */}
            {animalData && (
              <Box sx={{ p: 3, bgcolor: theme.palette.background.paper }}>
                <AnimalCard data={animalData} />
              </Box>
            )}

            {/* Horizontal Scrollable Tab Icons */}
            {availableTabs.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  borderTop: `1px solid ${theme.palette.divider}`,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  bgcolor: theme.palette.background.paper,
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': { display: 'none' }
                }}
              >
                {availableTabs.map(tab => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id

                  return (
                    <Box
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      sx={{
                        flex: '1 0 auto',
                        minWidth: 60,
                        py: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        borderBottom: isActive ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.04)
                        }
                      }}
                    >
                      <Icon
                        sx={{
                          fontSize: 22,
                          color: isActive
                            ? theme.palette.primary.main
                            : theme.palette.text.secondary
                        }}
                      />
                    </Box>
                  )
                })}
              </Box>
            )}

            {/* Tab Content */}
            <Box sx={{ p: 3, bgcolor: theme.palette.grey[50], minHeight: 300 }}>
              {renderTabContent()}
            </Box>
          </Box>
        )}
      </Box>

      {/* Medical Journal Drawer */}
      <MedicalJournalDrawer
        open={journalDrawerOpen}
        onClose={() => setJournalDrawerOpen(false)}
        animalId={animalData?.animal_id}
        medicalRecordId={medicalRecordId}
      />
    </Drawer>
  )
}

// Helper Components
const SectionHeader = ({ icon: Icon, title, theme }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
    <Icon sx={{ fontSize: 20, color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary }} />
    <Typography
      sx={{
        fontSize: '14px',
        fontWeight: 500,
        color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
      }}
    >
      {title}
    </Typography>
  </Box>
)

const ComplaintCard = ({ item, theme, isClosed }) => {
  const severity = item?.additional_info?.severity || item?.severity
  const duration = item?.additional_info?.duration || item?.duration
  const notes = item?.notes || item?.additional_info?.notes

  return (
    <Box
      sx={{
        mb: 2,
        borderLeft: `4px solid ${isClosed ? theme.palette.grey[300] : '#4DB6AC'}`,
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderLeftWidth: 4,
        borderLeftColor: isClosed ? theme.palette.grey[300] : '#4DB6AC',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Title */}
        <Typography
          sx={{
            fontSize: '15px',
            fontWeight: 600,
            color: isClosed ? theme.palette.text.disabled : theme.palette.text.primary,
            textDecoration: isClosed ? 'line-through' : 'none'
          }}
        >
          {item.complaint || item.name}
        </Typography>

        {/* Severity • Duration row */}
        {(severity || duration) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            {severity && (
              <Typography sx={{ fontSize: '13px', color: '#4DB6AC', fontWeight: 500 }}>
                {severity}
              </Typography>
            )}
            {severity && duration && (
              <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>&bull;</Typography>
            )}
            {duration && (
              <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
                {duration}
              </Typography>
            )}
          </Box>
        )}

        {/* Info Box */}
        <Box sx={{ mt: 2, p: 1.5, bgcolor: theme.palette.grey[100], borderRadius: 1 }}>
          {severity && (
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: 0.5 }}>
              Severity : <strong style={{ color: theme.palette.text.primary }}>{severity}</strong>
            </Typography>
          )}
          {duration && (
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: notes ? 1.5 : 0.5 }}>
              Duration : <strong style={{ color: theme.palette.text.primary }}>{duration}</strong>
            </Typography>
          )}
          {notes && (
            <>
              <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>Notes</Typography>
              <Typography sx={{ fontSize: '14px', color: theme.palette.text.primary, mb: 1.5 }}>
                {notes}
              </Typography>
            </>
          )}
          {item.updated_at && (
            <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
              Last Updated: {Utility.convertUtcToLocalReadableDate(item.updated_at)} &bull; {Utility.convertUTCToLocaltime(item.updated_at)}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  )
}

const DiagnosisCard = ({ item, theme, isClosed }) => {
  const isTentative = item?.additional_info?.clinical_assessment === 'tentative' || item?.clinical_assessment === 'tentative'
  const status = isClosed ? 'Closed' : (item?.additional_info?.status || item?.status || 'Active')

  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        bgcolor: theme.palette.background.paper,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      {/* Title */}
      <Typography
        sx={{
          fontSize: '15px',
          fontWeight: 600,
          color: isClosed ? theme.palette.text.disabled : theme.palette.text.primary,
          textDecoration: isClosed ? 'line-through' : 'none',
          mb: isTentative && !isClosed ? 1 : 1.5
        }}
      >
        {item.name || item.diagnosis}
      </Typography>

      {/* Tentative Chip */}
      {isTentative && !isClosed && (
        <Chip
          label='Tentative'
          size='small'
          sx={{
            fontSize: '12px',
            fontWeight: 500,
            height: 26,
            mb: 1.5,
            bgcolor: '#FFF3CD',
            color: '#856404',
            '& .MuiChip-label': { px: 1.5 }
          }}
        />
      )}

      {/* Info Box */}
      <Box sx={{ p: 1.5, bgcolor: theme.palette.grey[100], borderRadius: 1 }}>
        <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: 0.5 }}>
          Status : <strong style={{ color: theme.palette.text.primary }}>{status.charAt(0).toUpperCase() + status.slice(1)}</strong>
        </Typography>
        {item.updated_at && (
          <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
            Last Updated: {Utility.convertUtcToLocalReadableDate(item.updated_at)} &bull; {Utility.convertUTCToLocaltime(item.updated_at)}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

const PrescriptionCard = ({ item, theme, isStopped }) => (
  <Box
    sx={{
      mb: 2,
      p: 2,
      borderRadius: 2,
      bgcolor: isStopped
        ? alpha(theme.palette.grey[500], 0.08)
        : theme.palette.customColors?.displaybgPrimary || alpha(theme.palette.primary.main, 0.08)
    }}
  >
    <Typography
      sx={{
        fontSize: '15px',
        fontWeight: 600,
        color: isStopped ? theme.palette.text.disabled : theme.palette.text.primary,
        textDecoration: isStopped ? 'line-through' : 'none',
        mb: 1
      }}
    >
      {item.medicine_name || item.name}
    </Typography>
    {item.dosage && (
      <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
        Dosage: {item.dosage} {item.dosage_unit}
      </Typography>
    )}
    {item.frequency && (
      <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
        Frequency: {item.frequency}
      </Typography>
    )}
    {item.duration && (
      <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
        Duration: {item.duration} {item.duration_unit || item.duration_type}
      </Typography>
    )}
    {(item.start_date || item.end_date) && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
        {item.start_date && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: theme.palette.success.main }} />
            <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
              {Utility.convertUtcToLocalReadableDate(item.start_date)}
            </Typography>
          </Box>
        )}
        {item.end_date && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: theme.palette.error.main }} />
            <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
              {Utility.convertUtcToLocalReadableDate(item.end_date)}
            </Typography>
          </Box>
        )}
      </Box>
    )}
  </Box>
)

const LabCard = ({ item, theme }) => (
  <Box
    sx={{
      mb: 2,
      p: 2,
      borderRadius: 1,
      bgcolor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`
    }}
  >
    <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
      {item.test_name || item.name || 'Lab Test'}
    </Typography>
    {item.status && (
      <Chip
        label={item.status}
        size='small'
        sx={{
          mt: 1,
          fontSize: '11px',
          height: 20,
          bgcolor: item.status?.toLowerCase() === 'completed'
            ? alpha(theme.palette.success.main, 0.12)
            : alpha(theme.palette.warning.main, 0.12),
          color: item.status?.toLowerCase() === 'completed'
            ? theme.palette.success.main
            : theme.palette.warning.main
        }}
      />
    )}
  </Box>
)

export default MedicalRecordDetailDrawer
