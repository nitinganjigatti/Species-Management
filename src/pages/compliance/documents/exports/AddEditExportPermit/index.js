import React, { useState, useContext } from 'react'
import { useRouter } from 'next/router'
import { CardHeader, Box, Breadcrumbs, Typography } from '@mui/material'
import { AuthContext } from 'src/context/AuthContext'

import CustomAccordion from 'src/views/utility/CustomAccordion'
import ExportPermitForm from 'src/views/pages/compliance/documents/exports/forms/ExportPermitForm'
import SupportingDocuments from 'src/views/pages/compliance/documents/exports/forms/SupportingDocuments'
import LinkedImports from 'src/views/pages/compliance/documents/exports/forms/LinkedImports'
import LinkedShipments from 'src/views/pages/compliance/documents/exports/forms/LinkedShipments'

const testDocuments = [
  {
    document_type_id: '1',
    file_path: 'https://example.com/documents/donation-letter.pdf',
    file_original_name: 'Donation_Letter_2025.pdf'
  },
  {
    document_type_id: '3',
    file_path: 'https://example.com/documents/agreement.docx',
    file_original_name: 'Export_Agreement.docx'
  },
  {
    document_type_id: '5',
    file_path: 'https://example.com/documents/cza-approval.pdf',
    file_original_name: 'CZA_Approval_Notice.pdf'
  },
  {
    document_type_id: '8',
    file_path: 'https://example.com/documents/health-certificate.pdf',
    file_original_name: 'Health_Certificate_Zebra.pdf'
  },
  {
    document_type_id: '12',
    file_path: 'https://example.com/documents/aqcs-clearance.pdf',
    file_original_name: 'AQCS_Final_Clearance.pdf'
  }
]

// Example usage with sample data:
const sampleLinkedImports = [
  { certificateId: '123456789', dateOfIssue: '24/01/24', linkedImportsCount: 3 },
  { certificateId: '987654321', dateOfIssue: '15/03/24', linkedImportsCount: 1 }
]

// Example usage:
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

const AddEditExportPermit = () => {
  const router = useRouter()
  const { id } = router.query
  const isEdit = Boolean(id && id !== 'new')
  const { userData } = useContext(AuthContext)
  const [expanded, setExpanded] = useState('permit-details') // Accordion open state

  return (
    <>
      <Box sx={{ mb: 5 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Typography onClick={() => router.push('/compliance')} sx={{ cursor: 'pointer' }}>
            Compliance
          </Typography>
          <Typography onClick={() => router.push('/compliance/cites-export-permit')} sx={{ cursor: 'pointer' }}>
            CITES Export Permit
          </Typography>
          <Typography color='text.primary'>{isEdit ? 'Edit Export Permit' : 'New Export Permit'}</Typography>
        </Breadcrumbs>
      </Box>

      <CardHeader
        title={isEdit ? 'Edit CITES Export Permit' : 'CITES Export Permit'}
        titleTypographyProps={{ fontSize: '1.5rem !important', fontWeight: 'bold' }}
      />

      {/* PERMIT DETAILS SECTION */}
      <CustomAccordion
        id='permit-details'
        title='Details'
        expanded={expanded}
        onChange={panelId => setExpanded(prev => (prev === panelId ? null : panelId))}
      >
        <ExportPermitForm id={id} />
      </CustomAccordion>

      <CustomAccordion
        id='supporting-documents'
        title='Supporting Documents'
        docsCount='0/14 Documents added'
        expanded={expanded}
        onChange={panelId => setExpanded(prev => (prev === panelId ? null : panelId))}
      >
        <SupportingDocuments initialDocuments={testDocuments} />
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

export default AddEditExportPermit
