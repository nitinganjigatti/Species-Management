import React, { useState, useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import { CardHeader, Box, Breadcrumbs, Typography, alpha } from '@mui/material'
import { AuthContext } from 'src/context/AuthContext'

import CustomAccordion from 'src/views/utility/CustomAccordion'
import ExportPermitForm from 'src/components/compliance/forms/ExportPermitForm'
import SupportingDocuments from 'src/components/compliance/SupportingDocuments'
import { getDocumentTypeList, getExportDetails } from 'src/lib/api/compliance/exports'
import Toaster from 'src/components/Toaster'
import { useTheme } from '@mui/material/styles'

const AddEditExportPermit = () => {
  const router = useRouter()
  const { id } = router.query
  const isEdit = Boolean(id && id !== 'new')
  const { userData } = useContext(AuthContext)
  const [expanded, setExpanded] = useState('permit-details') // Accordion open state
  const [exportData, setExportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [documentList, setDocumentList] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const theme = useTheme()

  useEffect(() => {
    if (isEdit) {
      fetchExportDetails()
    }
  }, [id])

  const fetchExportDetails = async () => {
    setLoading(true)
    try {
      const res = await getExportDetails(id)
      if (res.success) {
        setExportData(res.data)
      }
    } catch (error) {
      console.error('Error fetching export details:', error)
    }
    setLoading(false)
  }

  const handleFormSubmit = exportId => {
    console.log('id', exportId)
    if (!isEdit) {
      setExpanded('supporting-documents')
      fetchDocumentTypeList(exportId)
    }
  }

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

  useEffect(() => {
    if (id) fetchDocumentTypeList()
  }, [id])

  const uploadedFileCount = documentList?.filter(doc => doc.file_path).length || 0

  const handleAddEditSuccess = data => {
    console.log('data', data)
    const updatedList = documentList.map(item => (item.id === data.id ? { ...data } : item))
    console.log('updatedList', updatedList)
    setDocumentList(updatedList)

    // fetchDocumentTypeList()
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
        <ExportPermitForm id={id} exportData={exportData} isLoading={loading} onSubmit={handleFormSubmit} />
      </CustomAccordion>

      <CustomAccordion
        id='supporting-documents'
        title='Supporting Documents'
        docsCount={totalCount ? `${uploadedFileCount}/${totalCount}` : null}
        expanded={expanded}
        onChange={panelId => setExpanded(prev => (prev === panelId ? null : panelId))}
      >
        {!isEdit && !documentList?.length ? (
          <Box
            sx={{
              height: '150px',
              width: '100%',
              mx: 'auto',
              backgroundColor: alpha(theme.palette.common.black, 0.05),
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '8px',
              px: 4
            }}
          >
            <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontWeight: 500, fontSize: '1rem' }}>
              Please save form details to add supporting documents
            </Typography>
          </Box>
        ) : (
          <SupportingDocuments
            isFetching={isFetching}
            documentList={documentList}
            totalCount={totalCount}
            onAddEditSuccess={handleAddEditSuccess}
          />
        )}
      </CustomAccordion>
    </>
  )
}

export default AddEditExportPermit
