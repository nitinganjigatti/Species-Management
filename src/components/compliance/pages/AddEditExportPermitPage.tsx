'use client'

import React, { useState, useContext, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CardHeader, Box, Breadcrumbs, Typography, alpha, CircularProgress } from '@mui/material'
import { AuthContext } from 'src/context/AuthContext'

import CustomAccordion from 'src/views/utility/CustomAccordion'
import ExportPermitForm from 'src/components/compliance/forms/ExportPermitForm'
import SupportingDocuments from 'src/components/compliance/SupportingDocuments'
import { getDocumentTypeList, getExportDetails, getMastersData } from 'src/lib/api/compliance/exports'
import Toaster from 'src/components/Toaster'
import { useTheme } from '@mui/material/styles'
import { DocumentType, ExportPermit, Id } from 'src/types/compliance'
import { useTranslation } from 'react-i18next'

const AddEditExportPermit = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams?.get('id')
  const type = searchParams?.get('type')
  const isEdit = Boolean(id && id !== 'new')
  const { userData } = useContext(AuthContext)
  const [expanded, setExpanded] = useState<string[]>(['permit-details'])
  const [exportData, setExportData] = useState<ExportPermit | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const [documentList, setDocumentList] = useState<DocumentType[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const theme = useTheme()
  const [documentTypeId, setDocumentTypeId] = useState<string | null>(null)

  useEffect(() => {
    if (isEdit) {
      fetchExportDetails()
    }
  }, [id])

  useEffect(() => {
    if (id && type) {
      setExpanded(['supporting-documents'])
    }
  }, [id, type])

  // Accordion toggle handler
  const handleAccordionChange = (panelId: string) => {
    setExpanded(
      prev =>
        prev.includes(panelId)
          ? prev.filter(p => p !== panelId) // Close if open
          : [...prev, panelId] // Open if closed
    )
  }

  const fetchMastersData = async (): Promise<string | null> => {
    try {
      const res = await getMastersData()
      if (res?.success) {
        setDocumentTypeId((res?.data?.document_type_id as string) || null)

        return (res.data?.document_type_id as string) || null
      }
    } catch (error) {
      console.error('Error fetching masters data:', error)
      Toaster({ type: 'error', message: t('compliance_module.error_fetching_masters_data') })
    }

    return null
  }

  const fetchExportDetails = async () => {
    setLoading(true)

    try {
      let documentTypeIdFromRes: string | null | undefined
      if (!documentTypeId) {
        documentTypeIdFromRes = await fetchMastersData()
      }

      const params = {
        document_type_id: documentTypeIdFromRes || documentTypeId
      }
      const res = await getExportDetails(id as string, params)
      if (res.success) {
        setExportData(res.data || null)
        if (id && !documentList?.length) fetchDocumentTypeList()
      }
    } catch (error) {
      console.error('Error fetching export details:', error)
    }
    setLoading(false)
  }

  const handleFormSubmit = (exportId: string) => {
    if (isEdit) {
      fetchExportDetails()
    }
    setExpanded(['supporting-documents'])
  }

  const fetchDocumentTypeList = async (exportId?: string) => {
    setIsFetching(true)
    try {
      const params = {
        id: (id || exportId) as string,
        type: 'export'
      }
      const res = await getDocumentTypeList(params)
      if (res.success) {
        console.log('res.data', res.data)
        setDocumentList((res.data?.items || []) as DocumentType[])
        setTotalCount(res.data?.total || 0)
      } else {
        Toaster({ type: 'error', message: res.message || t('compliance_module.failed_to_fetch_export_details') })
      }
    } catch (error) {
      console.error('Error fetching export details:', error)
      Toaster({ type: 'error', message: t('compliance_module.error_fetching_export_details') })
    } finally {
      setIsFetching(false)
    }
  }

  const uploadedFileCount = documentList?.filter(doc => (doc as any).file_path).length || 0

  const handleAddEditSuccess = () => {
    fetchDocumentTypeList()
  }

  return (
    <>
      <Box sx={{ mb: 5 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Typography onClick={() => router.push('/compliance')} sx={{ cursor: 'pointer' }}>
            {t('compliance_module.compliance')}
          </Typography>
          <Typography onClick={() => router.push('/compliance/documents/exports')} sx={{ cursor: 'pointer' }}>
            {t('compliance_module.cites_export_permit')}
          </Typography>
          <Typography color='text.primary'>
            {isEdit ? t('compliance_module.edit_cites_export_permit') : t('compliance_module.new_export_permit')}
          </Typography>
        </Breadcrumbs>
      </Box>

      <CardHeader
        title={
          isEdit
            ? `${t('compliance_module.edit_cites_export_permit')}`
            : `${t('compliance_module.cites_export_permit')}`
        }
      />

      {/* PERMIT DETAILS SECTION */}
      <CustomAccordion
        id='permit-details'
        title={t('details')}
        expanded={expanded.includes('permit-details')}
        onChange={handleAccordionChange}
        shouldScrollToTop={false}
        editable={false}
        handleEditClick={() => {}}
        type='export'
      >
        <ExportPermitForm
          id={id as string | undefined}
          exportData={exportData}
          isLoading={loading}
          onSubmit={(exportId?: Id) => handleFormSubmit(exportId as string)}
        />
      </CustomAccordion>
      <CustomAccordion
        id='supporting-documents'
        title={t('compliance_module.supporting_documents')}
        docsCount={(totalCount ? `${uploadedFileCount}/${totalCount}` : null) as any}
        expanded={expanded.includes('supporting-documents')}
        onChange={handleAccordionChange}
        shouldScrollToTop={id ? true : false}
        editable={false}
        handleEditClick={() => {}}
        type='export'
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
              {t('compliance_module.please_save_form_details_to_add_supporting_documents')}
            </Typography>
          </Box>
        ) : (
          <SupportingDocuments
            isFetching={isFetching}
            documentList={documentList as any}
            totalCount={totalCount}
            onAddEditSuccess={handleAddEditSuccess}
            type='1'
          />
        )}
      </CustomAccordion>
    </>
  )
}

export default AddEditExportPermit
