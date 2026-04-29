import React, { useEffect, useState } from 'react'
import useSafeRouter from 'src/hooks/useSafeRouter'

import {
  Button,
  Typography,
  Box,
  Avatar,
  IconButton,
  MenuItem,
  Menu,
  Drawer,
  Tooltip,
  CircularProgress,
  Skeleton
} from '@mui/material'

import { border, Grid } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import MuiTimeline from '@mui/lab/Timeline'
import { styled } from '@mui/material/styles'

import moment from 'moment'
import Icon from 'src/@core/components/icon'
import Utility from 'src/utility'

import AnimalInsightsCard from 'src/views/utility/insights/AnimalInsightsCard'
import ReportFoundForm from './ReportFoundForm'
import CreateMissingIncident from './CreateMissingIncident'
import MissReportIncidentForm from './MissReportIncidentForm'
import { getAnimalIncidentDetails, getAnimalIncidentList } from 'src/lib/api/housing'
import IncidentDetailsCard from './IncidentDetailsCard'
import AnimalParentCard from 'src/views/utility/animalParentCard'
import NoDataFound from 'src/views/utility/NoDataFound'
import { useTranslation } from 'react-i18next'

interface IncidentDetail {
  id?: number
  incident_type?: string
  incident_date?: string
  created_at?: string
  additional_info?: {
    action_taken?: string
    animal_behaviour_before_incident?: string
    steps_to_prevent?: string
    last_seen?: string
  }
  reported_by?: {
    user_id?: string
    user_name?: string
  }
  reported_by_id?: string
  reported_by_name?: string
  notes?: string
  attachment?: string
}

interface Incident {
  incident_id?: number
  incident_code?: string
  current_incident_type?: string
  created_at?: string
  site_name?: string
  section_name?: string
  incident_details?: IncidentDetail[]
  incident_label?: string
}

interface IncidentDetailsData {
  incident_code?: string
  incident_label?: string
  current_incident_type?: string
  incident_details?: IncidentDetail[]
}

interface IncidentCardListProps {
  data: Incident[]
  onViewDetails: () => void
  onEdit: () => void
  onMisreport: (incident: Incident, type: string) => void
  onReportFound: () => void
}

const AnimalIncidents: React.FC = () => {
  const theme = useTheme() as any
  const { t } = useTranslation()
  const router = useSafeRouter()
  const { id: animalId } = router.query

  const [activtyLogSideBar, setActivtyLogSideBar] = useState<boolean>(false)

  // Inside your component
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const [animalListLoading, setAnimalListLoading] = useState<boolean>(false)
  const [animalListData, setAnimalListData] = useState<Incident[]>([])
  const [animalListCount, setAnimalListCount] = useState<number>(0)
  const [incidentDetailsData, setIncidentDetailsData] = useState<IncidentDetailsData>({})
  const [incidentDetailsDate, setIncidentDetailsDate] = useState<string>('')

  const [animalIncidentForm, setAnimalIncidentForm] = useState<boolean>(false)
  const [isEdit, setIsEdit] = useState<boolean>(false)
  const [editData, setEditData] = useState<IncidentDetail | null>(null)

  const [missReportIncidence, setMissReportIncidence] = useState<string>('')
  const [missReportIncidentForm, setMissReportIncidentForm] = useState<boolean>(false)
  const [missReportIncidentId, setMissReportIncidentId] = useState<number | null>(null)
  const [reportFoundForm, setReportFoundForm] = useState<boolean>(false)

  const fetchAnimalIncidents = async (): Promise<void> => {
    try {
      setAnimalListLoading(true)
      const id = Array.isArray(animalId) ? animalId[0] : animalId

      // console.log('sam', animalId)
      if (id) {
        const res = await getAnimalIncidentList(id)

        // console.log('res', res)
        setAnimalListData((res?.data?.result || []) as Incident[])
        setAnimalListCount(res?.data?.total_count || 0)
      }
    } catch (error) {
      console.error('❌ Error fetching animal incidents:', error)
    } finally {
      setAnimalListLoading(false)
    }
  }

  useEffect(() => {
    fetchAnimalIncidents()
  }, [animalId])

  const fetchAnimalIncidentDetails = async (incidentId: number): Promise<void> => {
    try {
      if (incidentId) {
        const res = await getAnimalIncidentDetails(incidentId)
        console.log('getAnimalIncidentDetails + res', res)
        setIncidentDetailsData((res?.data || {}) as IncidentDetailsData)
      }
    } catch (error) {
      console.error('❌ Error fetching animal incidents:', error)
    }
  }

  const IncidentCardList: React.FC<IncidentCardListProps> = ({
    data,
    onViewDetails,
    onEdit,
    onMisreport,
    onReportFound
  }) => {
    const theme = useTheme() as any
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
    const open = Boolean(anchorEl)

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, incident: Incident): void => {
      setAnchorEl(event.currentTarget)
      setSelectedIncident(incident)
    }
    const handleMenuClose = (): void => setAnchorEl(null)

    return data.map((incident, index) => (
      <Box key={index}>
        <Grid
          container
          sx={{
            padding: '8px 12px 8px 8px',
            backgroundColor:
              incident.current_incident_type === 'found'
                ? theme.palette.customColors.OnBackground
                : theme.palette.customColors.Tertiary20,
            borderRadius: '8px',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
          spacing={4}
        >
          <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                minWidth: '120px',
                backgroundColor:
                  incident.current_incident_type === 'found'
                    ? theme.palette.primary.dark
                    : theme.palette.customColors.Tertiary,
                borderRadius: '8px',
                padding: '12px'
              }}
            >
              <Typography
                sx={{ textAlign: 'center', color: theme.palette.primary.contrastText, fontSize: 14, fontWeight: 600 }}
              >
                {moment(Utility.convertUTCToLocalDate(incident.created_at)).format('DD MMM YYYY')}
              </Typography>
              <Typography
                sx={{ textAlign: 'center', color: theme.palette.primary.contrastText, fontSize: 14, fontWeight: 600 }}
              >
                {Utility.convertUTCToLocaltime(incident.created_at)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', minWidth: '100px', maxWidth: '1000px', flexDirection: 'column', gap: '6px' }}>
              <Tooltip title={incident.incident_code}>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: 20,
                    fontWeight: 500,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {incident.incident_code}
                </Typography>
              </Tooltip>
              <Tooltip
                title={
                  incident.current_incident_type === 'found'
                    ? t('animals_module.animal_found')
                    : t('animals_module.animal_missing')
                }
              >
                <Typography
                  sx={{
                    color:
                      incident.current_incident_type === 'found'
                        ? theme.palette.primary.dark
                        : theme.palette.customColors.Tertiary,
                    fontSize: 16,
                    fontWeight: 500,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {incident.current_incident_type === 'found'
                    ? t('animals_module.animal_found')
                    : t('animals_module.animal_missing')}
                </Typography>
              </Tooltip>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }} sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Tooltip title={t('housing_module.site')}>
              <Typography
                sx={{
                  color: theme.palette.customColors.neutralSecondary,
                  fontSize: 14,
                  fontWeight: 400,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {t('housing_module.site')}
              </Typography>
            </Tooltip>
            <Tooltip title={incident.site_name}>
              <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: 16,
                  fontWeight: 500,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {incident.site_name}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }} sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Tooltip title={t('section')}>
              <Typography
                sx={{
                  color: theme.palette.customColors.neutralSecondary,
                  fontSize: 14,
                  fontWeight: 400,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {t('section')}
              </Typography>
            </Tooltip>
            <Tooltip title={incident.section_name}>
              <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: 16,
                  fontWeight: 500,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {incident.section_name}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 10, sm: 5, md: 2 }} sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Tooltip title={t('housing_module.enclosure')}>
              <Typography
                sx={{
                  color: theme.palette.customColors.neutralSecondary,
                  fontSize: 14,
                  fontWeight: 400,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {t('housing_module.enclosure')}
              </Typography>
            </Tooltip>
            <Tooltip title={''}>
              <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: 16,
                  fontWeight: 500,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {''}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 2, sm: 1, md: 0.5 }}>
            <IconButton size='small' onClick={(e: React.MouseEvent<HTMLElement>) => handleMenuOpen(e, incident)}>
              <Icon color={theme.palette.customColors.OnSurfaceVariant} icon='mdi:dots-vertical' />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem
                onClick={() => {
                  setIncidentDetailsDate(selectedIncident?.created_at || '')
                  setTimeout(() => {
                    fetchAnimalIncidentDetails(selectedIncident?.incident_id as number)
                    setActivtyLogSideBar(true)
                    handleMenuClose()
                  }, 200)
                }}
              >
                {t('animals_module.view_details')}
              </MenuItem>

              <MenuItem
                onClick={() => {
                  setIsEdit(true)

                  // Prefer the 'missing' detail if available; otherwise fallback to first
                  const editDetail =
                    selectedIncident?.incident_details?.find(d => d?.incident_type === 'missing') ||
                    selectedIncident?.incident_details?.[0]
                  setEditData(editDetail || null)
                  setAnimalIncidentForm(true)
                  handleMenuClose()
                }}
              >
                {t('animals_module.edit_incident')}
              </MenuItem>
              {selectedIncident?.current_incident_type !== 'missing' && (
                <MenuItem
                  onClick={() => {
                    setIncidentDetailsDate(selectedIncident?.incident_details?.[0]?.created_at || '')
                    setMissReportIncidence('Found')
                    setMissReportIncidentId(selectedIncident?.incident_id || null)
                    setMissReportIncidentForm(true)
                    handleMenuClose()
                  }}
                >
                  {t('animals_module.misreport_found')}
                </MenuItem>
              )}

              <MenuItem
                onClick={() => {
                  setMissReportIncidence('Missing')
                  setMissReportIncidentId(selectedIncident?.incident_id || null)
                  setMissReportIncidentForm(true)
                  handleMenuClose()
                }}
              >
                {t('animals_module.misreport_missing')}
              </MenuItem>

              {selectedIncident?.current_incident_type !== 'found' && (
                <MenuItem
                  onClick={() => {
                    setReportFoundForm(true)
                    handleMenuClose()
                  }}
                >
                  {t('animals_module.report_found')}
                </MenuItem>
              )}
            </Menu>
          </Grid>
        </Grid>
      </Box>
    ))
  }

  const IncidentTimeline: React.FC = () => {
    // Styled Timeline component
    const Timeline = styled(MuiTimeline)({
      paddingLeft: 0,
      paddingRight: 0,
      '& .MuiTimelineItem-root': {
        width: '100%',
        '&:before': {
          display: 'none'
        }
      }
    })

    return (
      <Box sx={{ display: 'flex', marginLeft: 'auto', cursor: 'pointer' }}>
        <Drawer
          anchor='right'
          open={activtyLogSideBar}
          ModalProps={{ keepMounted: true }}
          sx={{
            // Ensure the Drawer paper fills the viewport height and uses flex layout
            '& .MuiDrawer-paper': {
              width: ['100%', 520],
              height: '100vh',
              maxHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            },
            height: '100vh',
            '& .css-e1dg5m-MuiCardContent-root': {
              pt: 0
            }
          }}
        >
          {/* Header (sticky) */}
          <Box
            sx={{
              pb: 4,
              pt: 4,
              px: 4,
              position: 'sticky',
              top: 0,
              backgroundColor: theme.palette.customColors.Background,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              zIndex: 100
            }}
          >
            <Box
              className='sidebar-header'
              sx={{
                display: 'flex',
                width: '100%',
                gap: '12px',
                justifyContent: 'space-between',
                alignItems: 'start'
              }}
            >
              <Box
                sx={{
                  padding: '4px',
                  borderRadius: '4px',
                  height: '32px',
                  width: '32px'
                }}
              >
                <Icon icon={'ion:time-outline'} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: '24px' }}>
                  {t('animals_module.incident_details')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size='small' onClick={() => setActivtyLogSideBar(false)} sx={{ color: 'text.primary' }}>
                  <Icon icon='mdi:close' fontSize={24} />
                </IconButton>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              px: 4,
              py: 6,
              overflowY: 'auto',
              backgroundColor: theme.palette.customColors.Background,
              flex: 1
            }}
          >
            <Box
              sx={{
                backgroundColor: theme.palette.primary.contrastText,
                borderRadius: '8px',
                border: `1px solid ${theme.palette.customColors.OutlineVariant},`,
                p: '24px'
              }}
            >
              <Box
                sx={{
                  backgroundColor:
                    incidentDetailsData?.current_incident_type === 'found'
                      ? theme.palette.customColors.OnBackground
                      : theme.palette.customColors.Tertiary20,
                  padding: '12px',
                  display: 'flex',
                  borderRadius: '8px',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <Typography
                    sx={{
                      fontSize: 16,
                      letterSpacing: 0,
                      fontWeight: 500,
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {incidentDetailsData?.incident_code}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 20,
                      letterSpacing: 0,
                      fontWeight: 600,
                      color: theme.palette.customColors.Tertiary
                    }}
                  >
                    {incidentDetailsData?.incident_label}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <Typography
                    sx={{
                      fontSize: 14,
                      letterSpacing: 0,
                      fontWeight: 400,
                      color: theme.palette.customColors.neutralSecondary
                    }}
                  >
                    {t('animals_module.missing_since')}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 16,
                      letterSpacing: 0,
                      fontWeight: 500,
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {moment(Utility.convertUTCToLocalDate(incidentDetailsDate)).format('DD MMM YYYY')} •
                    {Utility.convertUTCToLocaltime(incidentDetailsDate)}
                  </Typography>
                </Box>
              </Box>
              <AnimalParentCard
                data={incidentDetailsData as any}
                size={14}
                animal={true}
                backgroundColor=''
                sx={{ paddingLeft: 0 }}
              />
            </Box>
            <Box
              sx={{
                backgroundColor: theme.palette.primary.contrastText,
                padding: '12px',
                mt: '24px',
                borderRadius: '8px'
              }}
            >
              <Typography
                sx={{
                  fontWeight: 500,
                  letterSpacing: 0,
                  fontSize: 20,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {t('animals_module.incident_timeline')}
              </Typography>

              {incidentDetailsData?.incident_details?.length && incidentDetailsData.incident_details.length > 0 ? (
                <Timeline>
                  {incidentDetailsData?.incident_details?.map((item, index) => (
                    <IncidentDetailsCard
                      data={incidentDetailsData?.incident_details}
                      item={item}
                      index={index}
                      key={index}
                    />
                  ))}
                </Timeline>
              ) : null}
            </Box>
          </Box>
          {/* {reachedEnd ? <LinearProgress /> : null} */}
        </Drawer>{' '}
      </Box>
    )
  }

  return (
    <>
      <Box sx={{ mt: 4, p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
          >
            {' '}
            {animalListLoading ? (
              <Box sx={{ textAlign: 'center' }}>
                <Skeleton variant='rectangular' height={40} width={200} sx={{ borderRadius: 1, mb: 1 }} />
              </Box>
            ) : (
              <Typography
                sx={{
                  fontSize: 20,
                  letterSpacing: 0,
                  fontWeight: 500,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {animalListCount > 0 &&
                  `${
                    animalListCount > 1 ? t('animals_module.incidents') : t('animals_module.incident')
                  } (${animalListCount})`}
              </Typography>
            )}
            <Button
              onClick={() => {
                setIsEdit(false)
                setEditData(null)
                setAnimalIncidentForm(true)
              }}
              variant='contained'
              sx={{ height: '40px' }}
            >
              <Icon icon='mdi:plus' />
              {t('animals_module.report_incident')}
            </Button>
          </Box>

          {animalListLoading ? (
            <Box sx={{ textAlign: 'center' }}>
              <Skeleton variant='rectangular' height={84} sx={{ borderRadius: 1, mb: 1 }} />
            </Box>
          ) : animalListData?.length > 0 ? (
            <IncidentCardList
              data={animalListData?.length ? animalListData : []}
              onViewDetails={() => setActivtyLogSideBar(true)}
              onEdit={() => console.log('Edit incident')}
              onMisreport={(incident: Incident, type: string) => {
                setMissReportIncidence(type)
                setMissReportIncidentId(incident?.incident_id || null)
                setMissReportIncidentForm(true)
              }}
              onReportFound={() => setReportFoundForm(true)}
            />
          ) : (
            <NoDataFound />
          )}
        </Box>
      </Box>

      <IncidentTimeline />
      <CreateMissingIncident
        isEdit={isEdit}
        editData={editData}
        animalId={animalId}
        fetchAnimalIncidents={fetchAnimalIncidents}
        animalIncidentForm={animalIncidentForm}
        setAnimalIncidentForm={setAnimalIncidentForm}
      />
      <MissReportIncidentForm
        animalId={animalId}
        missReportIncidentForm={missReportIncidentForm}
        missReportIncidence={missReportIncidence}
        setMissReportIncidentForm={setMissReportIncidentForm}
        incidentId={missReportIncidentId}
        fetchAnimalIncidents={fetchAnimalIncidents}
      />
      <ReportFoundForm animalId={animalId} reportFoundForm={reportFoundForm} setReportFoundForm={setReportFoundForm} />
    </>
  )
}

export default AnimalIncidents
