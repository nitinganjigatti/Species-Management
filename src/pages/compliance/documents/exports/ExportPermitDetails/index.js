import React, { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  Box,
  Breadcrumbs,
  Typography,
  Button,
  Divider,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Paper
} from '@mui/material'
import {
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  FileDownload as FileDownloadIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material'
import { AuthContext } from 'src/context/AuthContext'
import Toaster from 'src/components/Toaster'

// import { citesExportPermitAPI } from 'src/services/api'

const dummyPermitData = {
  certificate_id: 'CITES-EXP-2025-001',
  status: 'APPROVED',
  date_of_issue: '2025-05-01',
  last_day_of_validity: '2025-12-31',
  country_of_origin: 'India',
  exporting_country: 'India',
  exporter_name: 'Wildlife Exporters Ltd.',
  importer: 'Global Fauna Imports, Germany',
  purpose_of_transfer: 'Scientific Research',

  species: [
    {
      id: 1,
      common_name: 'Indian Star Tortoise',
      scientific_name: 'Geochelone elegans',
      cites_appendix: 'I',
      total_count: 5,
      animals: [
        { id: 101, gender: 'M', count: 2 },
        { id: 102, gender: 'F', count: 3 }
      ]
    },
    {
      id: 2,
      common_name: 'Bengal Monitor',
      scientific_name: 'Varanus bengalensis',
      cites_appendix: 'I',
      total_count: 3,
      animals: [
        { id: 103, gender: 'U', count: 3 }
      ]
    }
  ],

  animals: [
    { id: 101, species_id: 1, gender: 'M', count: 2 },
    { id: 102, species_id: 1, gender: 'F', count: 3 },
    { id: 103, species_id: 2, gender: 'U', count: 3 }
  ],

  supporting_documents: [
    {
      name: 'Health Certificate',
      filename: 'health_cert.pdf',
      uploaded_at: '2025-04-20'
    },
    {
      name: 'Export Approval',
      filename: 'export_approval.pdf',
      uploaded_at: '2025-04-22'
    }
  ],

  linked_imports: [
    {
      certificate_id: 'CITES-IMP-2023-011',
      country: 'Nepal',
      date: '2023-08-15'
    }
  ],

  linked_shipments: [
    {
      shipment_id: 'SHIP-EXP-2025-004',
      destination: 'Frankfurt Zoo, Germany',
      date: '2025-06-01'
    }
  ]
}


const ExportPermitDetails = () => {
  const router = useRouter()
  const { id } = router.query
  const { userData } = useContext(AuthContext)
  const canEdit = userData?.roles?.settings?.cites_export_permit_module === 'EDIT'

  const [permitData, setPermitData] = useState(dummyPermitData)
  const [loading, setLoading] = useState(false)
  
  const [expandedSections, setExpandedSections] = useState({
    supportingDocs: false,
    linkedImport: false,
    linkedShipments: false
  })
  const [animalDetailsModalOpen, setAnimalDetailsModalOpen] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState(null)

  useEffect(() => {
    if (id) {
      fetchPermitDetails()
    }
  }, [id])

  const fetchPermitDetails = async () => {
    try {
      setLoading(true)
      setPermitData(dummyPermitData)

      // const res = await citesExportPermitAPI.getById(id)
      // if (res.success) {
      //   setPermitData(res.data)
      // } else {
      //   Toaster({ type: 'error', message: 'Failed to fetch permit details' })
      // }
    } catch (error) {
      console.error('Error fetching permit details:', error)
      Toaster({ type: 'error', message: 'Failed to fetch permit details' })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    
return new Date(dateString).toLocaleDateString('en-GB')
  }

  const handleSectionToggle = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleAnimalClick = (animal) => {
    setSelectedAnimal(animal)
    setAnimalDetailsModalOpen(true)
  }

  const renderSpeciesCard = (species) => (
    <Card key={species.id} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: '#1976d2', mr: 2, width: 32, height: 32, fontSize: '0.875rem' }}>
            {species.common_name?.charAt(0) || species.scientific_name?.charAt(0)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
              {species.common_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {species.scientific_name}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              CITES Appendix {species.cites_appendix}
            </Typography>
            <Typography variant="h6" sx={{ fontSize: '1rem' }}>
              Count: {species.total_count}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {species.animals?.map(animal => (
            <Chip
              key={animal.id}
              size="small"
              sx={{
                fontSize: '0.75rem'
              }}
              label={`${animal.gender} - ${animal.count}`}
              onClick={() => handleAnimalClick(animal)}
            />
          ))}
        </Box>

        <IconButton
          size="small"
          onClick={() => handleAnimalClick({ species_id: species.id, species })}
          sx={{ mt: 1 }}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </CardContent>
    </Card>
  )

  if (loading) {
    return <Typography>Loading...</Typography>
  }

  // if (!permitData) {
  //   return <Typography>Permit not found</Typography>
  // }

  return (
    <>
      <Box sx={{ mb: 5 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Typography 
            sx={{ cursor: 'pointer', color: 'inherit' }}
            onClick={() => router.push('/compliance')}
          >
            Compliance
          </Typography>
          <Typography 
            sx={{ cursor: 'pointer', color: 'inherit' }}
            onClick={() => router.push('/compliance/cites-export-permit')}
          >
            CITES Export Permit
          </Typography>
          <Typography sx={{ color: 'text.primary' }}>
            {permitData.certificate_id}
          </Typography>
        </Breadcrumbs>
      </Box>

      <Card>
        <CardHeader
          title={`CITES Export Permit - ${permitData.certificate_id}`}
          titleTypographyProps={{ fontSize: '1.5rem !important', fontWeight: 'bold' }}
          action={
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip
                label={permitData.status || 'DRAFT'}
                sx={{
                  // backgroundColor: getStatusColor(permitData.status) + '20',
                  // color: getStatusColor(permitData.status),
                  fontWeight: 'bold'
                }}
              />
              {canEdit && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => router.push(`/compliance/cites-export-permit/edit/${id}`)}
                >
                  Edit
                </Button>
              )}
            </Box>
          }
          sx={{ px: 5 }}
        />

        <CardContent sx={{ px: 5 }}>
          {/* Export Permit Details */}
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            Details
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Certificate ID</Typography>
              <Typography variant="body1">{permitData.certificate_id || '-'}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Date Of Issue</Typography>
              <Typography variant="body1">{formatDate(permitData.date_of_issue)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Last Day Of Validity</Typography>
              <Typography variant="body1">{formatDate(permitData.last_day_of_validity)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Country Of Origin</Typography>
              <Typography variant="body1">{permitData.country_of_origin || '-'}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Exporting Country</Typography>
              <Typography variant="body1">{permitData.exporting_country || '-'}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Exporter Name</Typography>
              <Typography variant="body1">{permitData.exporter_name || '-'}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Importer</Typography>
              <Typography variant="body1">{permitData.importer || '-'}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Purpose Of Transfer</Typography>
              <Typography variant="body1">{permitData.purpose_of_transfer || '-'}</Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Species and Animals */}
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            {permitData.species?.length || 0} Species • {permitData.animals?.length || 0} Animals
          </Typography>

          {permitData.species?.map(species => renderSpeciesCard(species))}

          <Divider sx={{ my: 3 }} />

          {/* Supporting Documents */}
          <Box sx={{ mb: 3 }}>
            <Box 
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => handleSectionToggle('supportingDocs')}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                Supporting Documents
              </Typography>
              <Chip 
                label={`${permitData.supporting_documents?.length || 0}/14 Documents added`}
                size="small"
                sx={{ mr: 1 }}
              />
              <IconButton size="small">
                {expandedSections.supportingDocs ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            
            <Collapse in={expandedSections.supportingDocs}>
              <Paper sx={{ mt: 2, p: 2 }}>
                {permitData.supporting_documents?.length > 0 ? (
                  <List dense>
                    {permitData.supporting_documents.map((doc, index) => (
                      <ListItem key={index} sx={{ pl: 0 }}>
                        <ListItemText
                          primary={doc.name || doc.filename}
                          secondary={`Uploaded: ${formatDate(doc.uploaded_at)}`}
                        />
                        <IconButton size="small">
                          <FileDownloadIcon fontSize="small" />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No supporting documents added
                  </Typography>
                )}
              </Paper>
            </Collapse>
          </Box>

          {/* Linked Import */}
          <Box sx={{ mb: 3 }}>
            <Box 
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => handleSectionToggle('linkedImport')}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                Linked Import
              </Typography>
              <Chip 
                label={`- ${permitData.linked_imports?.length || 0}`}
                size="small"
                sx={{ mr: 1 }}
              />
              <IconButton size="small">
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Collapse in={expandedSections.linkedImport}>
              <Paper sx={{ mt: 2, p: 2 }}>
                {permitData.linked_imports?.length > 0 ? (
                  <List dense>
                    {permitData.linked_imports.map((importItem, index) => (
                      <ListItem key={index} sx={{ pl: 0 }}>
                        <ListItemText
                          primary={importItem.certificate_id || `Import ${index + 1}`}
                          secondary={`Country: ${importItem.country} | Date: ${formatDate(importItem.date)}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No linked imports
                  </Typography>
                )}
              </Paper>
            </Collapse>
          </Box>

          {/* Linked Shipments */}
          <Box sx={{ mb: 3 }}>
            <Box 
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => handleSectionToggle('linkedShipments')}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                Linked Shipments
              </Typography>
              <Chip 
                label={`- ${permitData.linked_shipments?.length || 0}`}
                size="small"
                sx={{ mr: 1 }}
              />
              <IconButton size="small">
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Collapse in={expandedSections.linkedShipments}>
              <Paper sx={{ mt: 2, p: 2 }}>
                {permitData.linked_shipments?.length > 0 ? (
                  <List dense>
                    {permitData.linked_shipments.map((shipment, index) => (
                      <ListItem key={index} sx={{ pl: 0 }}>
                        <ListItemText
                          primary={shipment.shipment_id || `Shipment ${index + 1}`}
                          secondary={`Destination: ${shipment.destination} | Date: ${formatDate(shipment.date)}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No linked shipments
                  </Typography>
                )}
              </Paper>
            </Collapse>
          </Box>
        </CardContent>
      </Card>
    </>
  )
}

export default ExportPermitDetails