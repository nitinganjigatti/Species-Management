import React, { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import { CardHeader, Box, Breadcrumbs, Typography, CircularProgress, alpha } from '@mui/material'
import { AuthContext } from 'src/context/AuthContext'
import Toaster from 'src/components/Toaster'
import { getDocumentTypeList, getExportDetails } from 'src/lib/api/compliance/exports'
import CustomAccordion from 'src/views/utility/CustomAccordion'
import { useTheme } from '@mui/material/styles'
import SpeciesDetail from 'src/components/compliance/SpeciesDetail'
import ExportPermitDetailsContent from 'src/views/pages/compliance/documents/exports/ExportPermitDetailsContent'
import LinkedImports from 'src/components/compliance/LinkedImports'
import LinkedShipments from 'src/components/compliance/LinkedShipments'
import SupportingDocuments from 'src/components/compliance/SupportingDocuments'

// Example usage with sample data:
const sampleLinkedImports = [
  { certificateId: '123456789', dateOfIssue: '24/01/24', linkedImportsCount: 3 },
  { certificateId: '987654321', dateOfIssue: '15/03/24', linkedImportsCount: 1 }
]

// Example usage:
export const shipmentsDataNoFile = []

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

const ExportPermitDetails = () => {
  const router = useRouter()
  const theme = useTheme()
  const { id } = router.query
  const { userData } = useContext(AuthContext)
  const canEdit = userData?.roles?.settings?.cites_export_permit_module === 'EDIT'
  const [expanded, setExpanded] = useState('permit-details') // Accordion open state
  const [isFetching, setIsFetching] = useState(false)
  const [documentList, setDocumentList] = useState([])
  const [totalCount, setTotalCount] = useState(0)

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

  const fetchDocumentTypeList = async exportId => {
    setIsFetching(true)
    try {
      const params = {
        export_id: id || exportId,
        type: 'export'
      }
      const res = await getDocumentTypeList(params)
      if (res.success) {
        console.log('res.data', res.data)
        setDocumentList(res.data.items)
        setTotalCount(res.data.total)
      } else {
        Toaster({ type: 'error', message: res.message || 'Failed to fetch export details' })
      }
    } catch (error) {
      console.error('Error fetching export details:', error)
      Toaster({ type: 'error', message: 'Error fetching export details' })
    } finally {
      setIsFetching(false)
    }
  }

  const fetchExportDetails = async () => {
    setLoading(true)
    try {
      const res = await getExportDetails(id)
      if (res.success) {
        console.log('res.data', res.data)
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

  const uploadedFileCount = documentList?.filter(doc => doc.file_path).length || 0

  const handleAddEditSuccess = () => {
    fetchDocumentTypeList()
  }

  useEffect(() => {
    if (id) {
      fetchExportDetails()
      fetchDocumentTypeList()
    }
  }, [id])

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
            <ExportPermitDetailsContent exportData={exportData} loading={loading} />
            <SpeciesDetail species={exportData?.species || []} totalShipped={25} totalAllowed={60} />
          </>
        )}
      </CustomAccordion>
      <CustomAccordion
        id='supporting-documents'
        title='Supporting Documents'
        docsCount={`${uploadedFileCount}/${totalCount}`}
        expanded={expanded}
        onChange={panelId => setExpanded(prev => (prev === panelId ? null : panelId))}
      >
        <SupportingDocuments
          isFetching={isFetching}
          documentList={documentList}
          totalCount={totalCount}
          onAddEditSuccess={handleAddEditSuccess}
        />
      </CustomAccordion>
      <CustomAccordion
        id='linked-imports'
        title={`Linked Imports - ${sampleLinkedImports.length}`}
        expanded={expanded}
        onChange={panelId => setExpanded(prev => (prev === panelId ? null : panelId))}
      >
        <LinkedImports imports={sampleLinkedImports} />
      </CustomAccordion>

      <CustomAccordion
        id='linked-shipments'
        title={`Linked Shipments - ${shipmentsData.length}`}
        expanded={expanded}
        onChange={panelId => setExpanded(prev => (prev === panelId ? null : panelId))}
      >
        <LinkedShipments shipments={shipmentsData} totalShipped={25} totalAllowed={60} />
      </CustomAccordion>
    </>
  )
}

export default ExportPermitDetails
