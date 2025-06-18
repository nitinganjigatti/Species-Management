import React, { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import { CardHeader, Box, Breadcrumbs, Typography, Button } from '@mui/material'
import { useForm } from 'react-hook-form'
import { AuthContext } from 'src/context/AuthContext'
import Toaster from 'src/components/Toaster'

// import { citesExportPermitAPI } from 'src/services/api'

import CustomAccordion from 'src/views/utility/CustomAccordion'
import ExportPermitForm from 'src/views/pages/compliance/documents/exports/forms/ExportPermitForm'

const AddEditExportPermit = () => {
  const router = useRouter()
  const { id } = router.query
  const isEdit = Boolean(id && id !== 'new')
  const { userData } = useContext(AuthContext)

  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState('permit-details') // Accordion open state

  useEffect(() => {
    // if (isEdit) {
    // fetchPermitData()
    // }
    console.log('id', id)
  }, [id, isEdit])

  const fetchPermitData = async () => {
    try {
      setLoading(true)

      // const res = await citesExportPermitAPI.getById(id)
      // if (res.success) {
      //   Object.keys(res.data).forEach(key => {
      //     setValue(key, res.data[key])
      //   })
      // }
    } catch (error) {
      console.error('Error fetching permit data:', error)
      Toaster({ type: 'error', message: 'Failed to fetch permit data' })
    } finally {
      setLoading(false)
    }
  }

  const handlePermitDetailsSubmit = data => {
    const permitDetails = {
      certificate_id: data.certificate_id,
      date_of_issue: data.date_of_issue,
      last_day_of_validity: data.last_day_of_validity,
      country_of_origin: data.country_of_origin,
      exporter_name: data.exporter_name,
      importer: data.importer,
      purpose_of_transfer: data.purpose_of_transfer,
      species: data.species,
      animals: data.animals
    }

    console.log('Permit Details Submitted:', permitDetails)
    Toaster({ type: 'success', message: 'Permit Details Saved' })
  }

  const handlePermitDetailsReset = () => {
    Toaster({ type: 'info', message: 'Permit Details Reset' })
  }

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
        <ExportPermitForm onSubmit={handlePermitDetailsSubmit} onReset={handlePermitDetailsReset} id={id} />
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
