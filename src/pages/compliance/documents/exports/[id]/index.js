import React, { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import {
  CardHeader,
  Grid,
  Box,
  Breadcrumbs,
  Typography,
  CircularProgress,
  alpha
} from '@mui/material'
import { AuthContext } from 'src/context/AuthContext'
import Toaster from 'src/components/Toaster'
import { getExportDetails } from 'src/lib/api/compliance/exports'
import CustomAccordion from 'src/views/utility/CustomAccordion'
import Utility from 'src/utility'
import PdfFileCard from 'src/views/pages/compliance/documents/exports/PdfFileCard'
import { useTheme } from '@mui/material/styles'
import SpeciesDetail from 'src/views/pages/compliance/documents/exports/forms/SpeciesDetail'

export const shipmentsData = [
  {
    shipmentId: '123123412',
    shipmentDate: '24/01/24',
    shippedAnimals: 5,
    totalAllowed: 60,
    speciesName: 'Red fox',
    scientificName: 'Vulpes vulpes',
    cites: 'Appendix I',
    totalAnimals: 5,
    maleCount: 3,
    femaleCount: 2,
    unknownCount: 0,
    fileName: 'file.pdf',
    species: [
      {
        commonName: 'Rainbow Lorikeet',
        scientificName: 'Lorikeet',
        microchipId: '132143124132143124',
        gender: 'M',
        totalCount: 5,
        maleCount: 3,
        femaleCount: 2,
        unknownCount: 0
      },
      {
        commonName: 'Rainbow Lorikeet',
        scientificName: 'Lorikeet',
        microchipId: '132143124132143125',
        gender: 'F',
        totalCount: 5,
        maleCount: 3,
        femaleCount: 2,
        unknownCount: 5
      },
      {
        commonName: 'Rainbow Lorikeet',
        scientificName: 'Lorikeet',
        microchipId: '132143124132143126',
        gender: 'U',
        totalCount: 5,
        maleCount: 0,
        femaleCount: 0,
        unknownCount: 0
      }
    ]
  },
  {
    shipmentId: '12312341',
    shipmentDate: '24/01/24',
    shippedAnimals: 5,
    totalAllowed: 60,
    speciesName: 'Red fox',
    scientificName: 'Vulpes vulpes',
    cites: 'Appendix I',
    totalAnimals: 5,
    maleCount: 3,
    femaleCount: 2,
    unknownCount: 0,
    fileName: 'file.pdf',
    species: [
      {
        commonName: 'Rainbow Lorikeet',
        scientificName: 'Lorikeet',
        microchipId: '132143124132143124',
        gender: 'M',
        totalCount: 5,
        maleCount: 3,
        femaleCount: 2,
        unknownCount: 0
      },
      {
        commonName: 'Rainbow Lorikeet',
        scientificName: 'Lorikeet',
        microchipId: '132143124132143125',
        gender: 'F',
        totalCount: 5,
        maleCount: 3,
        femaleCount: 2,
        unknownCount: 5
      },
      {
        commonName: 'Rainbow Lorikeet',
        scientificName: 'Lorikeet',
        microchipId: '132143124132143126',
        gender: 'U',
        totalCount: 5,
        maleCount: 0,
        femaleCount: 0,
        unknownCount: 0
      }
    ]
  }
]

export const speciesData = [
  {
    id: 'species-123',
    taxonomy_id: 'tax123',
    common_name: 'Indian Star Tortoise',
    scientific_name: 'Geochelone elegans',
    appendix: 'Appendix 1',
    male_count: 3,
    female_count: 2,
    undeterminate_count: 0,
    total_count: 5,
    animals: [
      {
        id: 'animal-1',
        animal_type: 'Tortoise',
        animal_count: 1,
        gender: 'M',
        identifier_type: 'Microchip',
        identifier_value: 'MICRO12345'
      },
      {
        id: 'animal-2',
        animal_type: 'Tortoise',
        animal_count: 1,
        gender: 'F',
        identifier_type: 'Microchip',
        identifier_value: 'MICRO12346'
      }
    ]
  },
  {
    id: 'species-12',
    taxonomy_id: 'tax1234',
    common_name: 'Indian Star Tortoise 1',
    scientific_name: 'Geochelone elegans1',
    appendix: 'Appendix 1',
    male_count: 3,
    female_count: 2,
    undeterminate_count: 0,
    total_count: 5,
    animals: [
      {
        id: 'animal-1',
        animal_type: 'Tortoise',
        animal_count: 1,
        gender: 'M',
        identifier_type: 'Microchip',
        identifier_value: 'MICRO12345'
      },
      {
        id: 'animal-2',
        animal_type: 'Tortoise',
        animal_count: 1,
        gender: 'F',
        identifier_type: 'Microchip',
        identifier_value: 'MICRO12346'
      }
    ]
  }
]

const ExportPermitDetails = () => {
  const router = useRouter()
  const theme = useTheme()
  const { id } = router.query
  const { userData } = useContext(AuthContext)
  const canEdit = userData?.roles?.settings?.cites_export_permit_module === 'EDIT'
  const [expanded, setExpanded] = useState('permit-details') // Accordion open state

  const [loading, setLoading] = useState(true)

  const [exportData, setExportData] = useState({
    id: '',
    export_number: '',
    export_date: '',
    issued_date: '',
    valid_until: '',
    export_purpose: '',
    origin_country: '',
    exporting_country: '',
    importer_name: '',
    exporter_name: '',
    species: [],
    documents: [],
    linked_imports: [], // Added default value
    linked_shipments: [] // Added default value
  })

  useEffect(() => {
    if (id) {
      fetchExportDetails()
    }
  }, [id])

  const fetchExportDetails = async () => {
    setLoading(true)
    try {
      const res = await getExportDetails(id)
      if (res.success) {
        setExportData({
          ...res.data,

          // Ensure all required fields have default values if not provided by API
          species: res.data.species || [],
          documents: res.data.documents || [],
          linked_imports: res.data.linked_imports || [],
          linked_shipments: res.data.linked_shipments || []
        })
      } else {
        Toaster({ type: 'error', message: res.message || 'Failed to fetch export details' })
      }
    } catch (error) {
      console.error('Error fetching export details:', error)
      Toaster({ type: 'error', message: 'Error fetching export details' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Box sx={{ mb: 5 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Typography sx={{ cursor: 'pointer', color: 'inherit' }} onClick={() => router.push('/compliance')}>
            Compliance
          </Typography>
          <Typography
            sx={{ cursor: 'pointer', color: 'inherit' }}
            onClick={() => router.push('/compliance/cites-export-permit')}
          >
            CITES Export Permit
          </Typography>
          <Typography sx={{ color: 'text.primary' }}>{exportData.export_number || 'Export Permit'}</Typography>
        </Breadcrumbs>
      </Box>

      <CardHeader
        title={`CITES Export Permit - ${exportData.export_number || 'No ID'}`}
        titleTypographyProps={{ fontSize: '1.5rem !important', fontWeight: 'bold' }}
      />
      <CustomAccordion
        id='permit-details'
        title='Details'
        expanded={expanded}
        onChange={panelId => setExpanded(prev => (prev === panelId ? null : panelId))}
        editable
        handleEditClick={() => router.push(`/compliance/documents/exports/AddEditExportPermit?id=${id}`)}
      >
        {loading ? (
          <Box display='flex' justifyContent='center' alignItems='center' minHeight='300px'>
            <CircularProgress />
          </Box>
        ) : (
          <>
          <Box
            sx={{
              alignItems: 'flex-start',
              px: 6,
              py: 4,
              border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
              borderRadius: '8px',
              backgroundColor: alpha(theme.palette.customColors.displaybgPrimary, 0.4)
            }}
          >
            <Grid container spacing={4} sx={{ alignItems: 'center' }}>
              {/* First Column */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Box sx={{ mb: 4 }}>
                  <Typography
                    sx={{ fontWeight: 500, color: theme.palette.customColors.neutralSecondary, fontSize: '1rem' }}
                  >
                    Certificate ID
                  </Typography>
                  <Typography
                    sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}
                  >
                    {exportData.export_number || '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{ fontWeight: 500, color: theme.palette.customColors.neutralSecondary, fontSize: '1rem' }}
                  >
                    Exporting Country
                  </Typography>
                  <Typography
                    sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}
                  >
                    {exportData.exporting_country || '-'}
                  </Typography>
                </Box>
              </Grid>

              {/* Second Column */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Box sx={{ mb: 4 }}>
                  <Typography
                    sx={{ fontWeight: 500, color: theme.palette.customColors.neutralSecondary, fontSize: '1rem' }}
                  >
                    Date Of Issue
                  </Typography>
                  <Typography
                    sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}
                  >
                    {Utility.formatDate(exportData.issued_date)}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{ fontWeight: 500, color: theme.palette.customColors.neutralSecondary, fontSize: '1rem' }}
                  >
                    Exporter Name
                  </Typography>
                  <Typography
                    sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}
                  >
                    {exportData.exporter_name || '-'}
                  </Typography>
                </Box>
              </Grid>

              {/* Third Column */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Box sx={{ mb: 4 }}>
                  <Typography
                    sx={{ fontWeight: 500, color: theme.palette.customColors.neutralSecondary, fontSize: '1rem' }}
                  >
                    Last Day Of Validity
                  </Typography>
                  <Typography
                    sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}
                  >
                    {Utility.formatDate(exportData.valid_until)}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{ fontWeight: 500, color: theme.palette.customColors.neutralSecondary, fontSize: '1rem' }}
                  >
                    Importer
                  </Typography>
                  <Typography
                    sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}
                  >
                    {exportData.importer_name || '-'}
                  </Typography>
                </Box>
              </Grid>

              {/* Fourth Column */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Box sx={{ mb: 4 }}>
                  <Typography
                    sx={{ fontWeight: 500, color: theme.palette.customColors.neutralSecondary, fontSize: '1rem' }}
                  >
                    Country Of Origin
                  </Typography>
                  <Typography
                    sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}
                  >
                    {exportData.origin_country || '-'}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    sx={{ fontWeight: 500, color: theme.palette.customColors.neutralSecondary, fontSize: '1rem' }}
                  >
                    Purpose Of Transfer
                  </Typography>
                  <Typography
                    sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}
                  >
                    {exportData.export_purpose || '-'}
                  </Typography>
                </Box>
              </Grid>

              {/* Fifth Column - File Card */}
              <Grid item xs={12} sm={6} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <PdfFileCard
                  media={{
                    file: exportData.documents?.[0]?.file_path,
                    file_original_name: exportData.documents?.[0]?.file_original_name || 'Export_document.pdf',
                    created_at: exportData.documents?.[0]?.uploaded_at
                  }}
                  isBorderedCard
                />
              </Grid>
            </Grid>
          </Box>
        <Box>
          <SpeciesDetail species={speciesData} totalShipped={25} totalAllowed={60} />
        </Box>
          </>
        )}
      </CustomAccordion>
    </>
  )
}

export default ExportPermitDetails
