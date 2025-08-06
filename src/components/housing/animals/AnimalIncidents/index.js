import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

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
import AnimalCard from 'src/views/pages/housing/animals/AnimalCard'

const AnimalIncidents = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id: animalId } = router.query

  const [activtyLogSideBar, setActivtyLogSideBar] = useState(false)

  // Inside your component
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const [animalListLoading, setAnimalListLoading] = useState(false)
  const [animalListData, setAnimalListData] = useState([])
  const [animalListCount, setAnimalListCount] = useState(0)
  const [incidentDetailsData, setIncidentDetailsData] = useState({})

  const [animalIncidentForm, setAnimalIncidentForm] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editData, setEditData] = useState(null)

  const [missReportIncidence, setMissReportIncidence] = useState('')
  const [missReportIncidentForm, setMissReportIncidentForm] = useState(false)
  const [reportFoundForm, setReportFoundForm] = useState(false)

  const fetchAnimalIncidents = async () => {
    try {
      setAnimalListLoading(true)
      console.log("sam", animalId)
      if (animalId) {
        const res = await getAnimalIncidentList(animalId)
        console.log('res', res)
        setAnimalListData(res?.data?.result)
        setAnimalListCount(res?.data?.total_count)

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


  const fetchAnimalIncidentDetails = async (incidentId) => {
    try {

      if (incidentId) {
        const res = await getAnimalIncidentDetails(incidentId)
        console.log('getAnimalIncidentDetails + res', res)
        setIncidentDetailsData(res?.data)
      }
    } catch (error) {
      console.error('❌ Error fetching animal incidents:', error)
    }
  }

  const IncidentCardList = ({ data, onViewDetails, onEdit, onMisreport, onReportFound }) => {
    const theme = useTheme()
    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(anchorEl)

    const handleMenuOpen = event => setAnchorEl(event.currentTarget)
    const handleMenuClose = () => setAnchorEl(null)

    if (animalListLoading === true) return <Box sx={{ textAlign: 'center' }}>
      <Skeleton variant='rectangular' height={84} sx={{ borderRadius: 1, mb: 1 }} />
    </Box>

    return data.map((incident, index) => (
      <Grid
        container
        key={incident.id}
        sx={{
          padding: '8px 12px 8px 8px',
          backgroundColor: incident.current_incident_type === 'found' ? theme.palette.customColors.OnBackground : theme.palette.customColors.Tertiary20,
          borderRadius: '8px',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
        spacing={4}
      >
        <Grid item size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              minWidth: '120px',
              backgroundColor: incident.current_incident_type === 'found' ? theme.palette.primary.dark : theme.palette.customColors.Tertiary,
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
            <Tooltip title={incident.current_incident_type}>
              <Typography
                sx={{
                  color: incident.current_incident_type === 'found' ? theme.palette.primary.dark : theme.palette.customColors.Tertiary,
                  fontSize: 16,
                  fontWeight: 500,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                Animal {incident.current_incident_type === 'found' ? 'Found' : 'Missing'}
              </Typography>
            </Tooltip>
          </Box>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 2 }} sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Tooltip title={'Site'}>
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
              Site
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
        <Grid item size={{ xs: 12, sm: 6, md: 2 }} sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Tooltip title={'Section'}>
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
              Section
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
        <Grid item size={{ xs: 10, sm: 5, md: 2 }} sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Tooltip title={'Enclosure'}>
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
              Enclosure
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
        <Grid item size={{ xs: 2, sm: 1, md: 0.5 }}>
          <IconButton size='small' onClick={handleMenuOpen}>
            <Icon color={theme.palette.customColors.OnSurfaceVariant} icon='mdi:dots-vertical' />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem
              onClick={() => {
                fetchAnimalIncidentDetails(incident?.incident_id)
                setActivtyLogSideBar(true)
                handleMenuClose()
              }}
            >
              View Details
            </MenuItem>
            <MenuItem onClick={() => {
              setIsEdit(true)
              setEditData(incident?.incident_details[index])
              setAnimalIncidentForm(true)
              handleMenuClose()
            }
            }>Edit Incident</MenuItem>
            <MenuItem
              onClick={() => {
                setMissReportIncidence('Found')
                setMissReportIncidentForm(true)
                handleMenuClose()
              }}
            >
              Misreport Found
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMissReportIncidence('Missing')
                setMissReportIncidentForm(true)
                handleMenuClose()
              }}
            >
              Misreport Missing
            </MenuItem>
            <MenuItem
              onClick={() => {
                setReportFoundForm(true)
                handleMenuClose()
              }}
            >
              Report Found
            </MenuItem>
          </Menu>
        </Grid>
      </Grid >
    ))
  }



  const IncidentTimeline = () => {
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
            '& .MuiDrawer-paper': { width: ['100%', 520] },
            height: '100vh',
            '& .css-e1dg5m-MuiCardContent-root': {
              pt: 0
            }
          }}
        >
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
                <Typography sx={{ fontWeight: 500, fontSize: '24px' }}>Incident Details</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size='small' onClick={() => setActivtyLogSideBar(false)} sx={{ color: 'text.primary' }}>
                  <Icon icon='mdi:close' fontSize={24} />
                </IconButton>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{ px: 4, py: 6, overflowY: 'auto', backgroundColor: theme.palette.customColors.Background }}
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
                  backgroundColor: incidentDetailsData?.current_incident_type === 'found' ? theme.palette.customColors.OnBackground : '#FFBDA833',
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
                    Missing since
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 16,
                      letterSpacing: 0,
                      fontWeight: 500,
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    10 Apr 2024 • 12:28 PM
                  </Typography>
                </Box>

              </Box>
              <AnimalCard animalParentCardStyle={{ paddingLeft: 0 }} sx={{ border: 'none' }} data={incidentDetailsData} />
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
                Incident Timeline
              </Typography>

              {incidentDetailsData?.incident_details?.length > 0 ? (
                <Timeline>
                  {incidentDetailsData?.incident_details?.map((item, index) => (
                    <IncidentDetailsCard data={incidentDetailsData?.incident_details} item={item} index={index} key={index} />
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography
              sx={{
                fontSize: 20,
                letterSpacing: 0,
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              {animalListCount > 0 && `${animalListCount > 1 ? 'Incidents' : 'Incident'} (${animalListCount})`}
            </Typography>
            <Button onClick={() => setAnimalIncidentForm(true)} variant='contained' sx={{ height: '40px' }}>
              <Icon icon='mdi:plus' />
              Report incident
            </Button>
          </Box>

          <IncidentCardList
            data={animalListData?.length ? animalListData : []}
            onViewDetails={() => setActivtyLogSideBar(true)}
            onEdit={() => console.log('Edit incident')}
            onMisreport={(incident, type) => {
              setMissReportIncidence(type)
              setMissReportIncidentForm(true)
            }}
            onReportFound={() => setReportFoundForm(true)}
          />
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
      />
      <ReportFoundForm
        animalId={animalId}
        reportFoundForm={reportFoundForm}
        setReportFoundForm={setReportFoundForm}
      />
    </>
  )
}

export default AnimalIncidents
