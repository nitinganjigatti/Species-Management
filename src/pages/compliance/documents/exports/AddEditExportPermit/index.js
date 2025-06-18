import React, { useState, useContext } from 'react'
import { useRouter } from 'next/router'
import { CardHeader, Box, Breadcrumbs, Typography } from '@mui/material'
import { AuthContext } from 'src/context/AuthContext'

// import { citesExportPermitAPI } from 'src/services/api'

import CustomAccordion from 'src/views/utility/CustomAccordion'
import ExportPermitForm from 'src/views/pages/compliance/documents/exports/forms/ExportPermitForm'

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

      {/* <CustomAccordion
        id='supporting-documents'
        title='Supporting Documents'
        docsCount='0/14 Documents added'
        expanded={expanded}
        onChange={panelId => setExpanded(prev => (prev === panelId ? null : panelId))}
      >
        <SupportingDocumentsForm />
      </CustomAccordion>

      <CustomAccordion
        id='linked-imports'
        title='Linked Imports'
        expanded={expanded}
        onChange={panelId => setExpanded(prev => (prev === panelId ? null : panelId))}
      >
        <LinkedImportForm />
      </CustomAccordion>

      <CustomAccordion
        id='linked-shipments'
        title='Linked Shipments'
        expanded={expanded}
        onChange={panelId => setExpanded(prev => (prev === panelId ? null : panelId))}
      >
        <LinkedShipmentsForm />
      </CustomAccordion> */}
    </>
  )
}

export default AddEditExportPermit
