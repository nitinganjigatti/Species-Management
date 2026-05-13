'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CardHeader, Box, Breadcrumbs, Typography, Select, alpha, Tabs, Tab } from '@mui/material'
import Icon from 'src/@core/components/icon'
import CustomAccordion from 'src/views/utility/CustomAccordion'
import { getDocumentTypeList } from 'src/lib/api/compliance/exports'
import Toaster from 'src/components/Toaster'
import SupportingDocuments from 'src/components/compliance/SupportingDocuments'
import AnimalsData from 'src/views/pages/compliance/documents/imports/forms/AnimalsData'
import { getLinkedDocumentsImports } from 'src/lib/api/compliance/imports'
import { useTheme } from '@mui/material/styles'
import LinkedShipments from 'src/components/compliance/LinkedShipments'
import { DocumentType } from 'src/types/compliance'
import { useTranslation } from 'react-i18next'

const AddEditImport = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams?.get('id')
  const action = searchParams?.get('action')
  const theme = useTheme()
  const isEdit = Boolean(id && id !== 'new')
  const [expanded, setExpanded] = useState<string[]>(['animals-details'])
  const [showEditAnimals, setShowEditAnimals] = useState<boolean>(true)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const [documentList, setDocumentList] = useState<DocumentType[]>([])
  const [totalAnimals, setTotalAnimals] = useState<number>(0)
  const [totalSpecies, setTotalSpecies] = useState<number>(0)
  const [airwaybillvalue, setAirwaybillvalue] = useState<string>('')
  const [linkedShipments, setLinkedShipments] = useState<Record<string, unknown>[]>([])
  const [linkedShipmentsData, setLinkedShipmentsData] = useState<Record<string, unknown> | undefined>()
  const [totalLinkedShipments, setTotalLinkedShipments] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<string>('completed')
  const animalsEditRef = useRef<(() => void) | null>(null)

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)
  }

  useEffect(() => {
    if (isEdit && action === 'edit') {
      setShowEditAnimals(true)
    }
  }, [isEdit, action])

  const fetchDocumentTypeList = async (exportId?: string) => {
    setIsFetching(true)
    try {
      const params = {
        id: (id || exportId) as string,
        status: activeTab,
        type: 'import'
      }
      const res = await getDocumentTypeList(params)
      if (res.success) {
        setDocumentList((res.data?.items || []) as DocumentType[])
        setTotalCount(res.data?.total || 0)
      } else {
        Toaster({ type: 'error', message: res.message || t('compliance_module.failed_to_fetch_export_details') })
      }
    } catch (error) {
      Toaster({ type: 'error', message: t('compliance_module.error_fetching_export_details') })
    } finally {
      setIsFetching(false)
    }
  }

  const uploadedFileCount = documentList?.filter(doc => (doc as any).file_path).length || 0

  const handleAddEditSuccess = () => {
    fetchDocumentTypeList()
    setActiveTab('completed')
  }

  useEffect(() => {
    if (id) {
      fetchLinkedDocuments()
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchDocumentTypeList()
    }
  }, [id, activeTab])

  const fetchLinkedDocuments = async () => {
    try {
      const response = await getLinkedDocumentsImports(id as string)
      if (response?.success) {
        setTotalLinkedShipments((response?.data as any)?.shipments?.length || 0)
        setLinkedShipments((response.data as any)?.shipments || [])
        setLinkedShipmentsData(response.data as any)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (e) {
      Toaster({ type: 'error', message: t('compliance_module.error_fetching_shipment_basic_details') })
    }
  }

  const isAnimalsEditable = showEditAnimals && expanded.includes('animals-details') && id && action === 'details'

  // Accordion toggle handler
  const handleAccordionChange = (panelId: string) => {
    setExpanded(
      prev =>
        prev.includes(panelId)
          ? prev?.filter(p => p !== panelId) // Close if open
          : [...prev, panelId] // Open if closed
    )
  }

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Typography>{t('compliance_module.import_documents')}</Typography>
          <Typography onClick={() => router.push('/compliance/documents/imports')} sx={{ cursor: 'pointer' }}>
            {t('compliance_module.import')}
          </Typography>
          <Typography color='text.primary'>
            {action === 'edit'
              ? t('compliance_module.edit_import')
              : action === 'details'
              ? t('compliance_module.import_details')
              : t('compliance_module.new_import')}
          </Typography>
        </Breadcrumbs>
      </Box>

      <Box display='flex' justifyContent='space-between' alignItems='center' sx={{ mb: 3, mt: 6 }}>
        {/* Left section: Back icon and title */}
        <Box
          display='flex'
          alignItems='center'
          onClick={() => router.push('/compliance/documents/imports')}
          sx={{ cursor: 'pointer' }}
        >
          <Icon
            style={{ cursor: 'pointer', color: theme.palette.customColors.OnSurfaceVariant }}
            icon='material-symbols:arrow-back'
          />
          <CardHeader
            title={
              action === 'edit'
                ? t('compliance_module.edit_import_permit')
                : action === 'details'
                ? t('compliance_module.import_details')
                : t('compliance_module.cites_import_permit')
            }
            slotProps={{
              title: {
                sx: { fontSize: '1.5rem !important', fontWeight: 'bold' }
              }
            }}
            sx={{ paddingLeft: 2, py: 0, pr: 0 }}
          />
        </Box>
      </Box>

      <CustomAccordion
        id='animals-details'
        docsCount={
          !isAnimalsEditable && !expanded.includes('animals-details') && (totalAnimals || totalSpecies) ? (
            <Typography component='span' sx={{ fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
              <strong>{totalSpecies}</strong> {t('compliance_module.species')}&nbsp;|&nbsp;
              <strong>{totalAnimals}</strong> {t('animals')}
            </Typography>
          ) : (
            (null as any)
          )
        }
        title={
          <Typography sx={{ fontWeight: 500, fontSize: '22px', color: theme.palette.customColors.OnPrimaryContainer }}>
            {t('details')}
          </Typography>
        }
        expanded={expanded.includes('animals-details')}
        onChange={handleAccordionChange}
        editable={!!(showEditAnimals && expanded.includes('animals-details') && id && action === 'details')}
        handleEditClick={() => {
          setExpanded(['animals - details'])
          animalsEditRef.current?.()
          router.push(`/compliance/documents/imports/AddEditImport/?id=${id}&action=edit`)
        }}
        type='shipment'
      >
        <AnimalsData
          onEditClick={animalsEditRef}
          setShowEditAnimals={setShowEditAnimals}
          importId={id as string | undefined}
          setTotalAnimals={setTotalAnimals}
          setTotalSpecies={setTotalSpecies}
          totalAnimals={totalAnimals}
          totalSpecies={totalSpecies}
          setAirwaybillvalue={setAirwaybillvalue}
          airwaybillvalue={airwaybillvalue}
        />
      </CustomAccordion>

      {id && (
        <CustomAccordion
          id='supporting-documents'
          title={
            <Typography
              sx={{ fontWeight: 500, fontSize: '22px', color: theme.palette.customColors.OnPrimaryContainer }}
            >
              {t('compliance_module.supporting_documents')}
            </Typography>
          }
          docsCount={(totalCount ? `${uploadedFileCount}/${totalCount}` : null) as any}
          expanded={expanded.includes('supporting-documents')}
          onChange={handleAccordionChange}
          editable={false}
          handleEditClick={() => {}}
          type='import'
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
              <Typography
                sx={{ color: theme.palette.customColors.neutralSecondary, fontWeight: 500, fontSize: '1rem' }}
              >
                {t('compliance_module.please_save_form_details_to_add_supporting_documents')}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 8 }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label='supporting documents tabs'>
                  <Tab
                    label={`${t('completed')}${
                      activeTab === 'completed' && documentList.length > 0 ? ` (${documentList.length})` : ''
                    }`}
                    value='completed'
                    sx={{ mr: 4 }}
                  />
                  <Tab
                    label={`${t('pending')}${
                      activeTab === 'pending' && documentList.length > 0 ? ` (${documentList.length})` : ''
                    }`}
                    value='pending'
                  />
                </Tabs>
              </Box>
              <SupportingDocuments
                isFetching={isFetching}
                documentList={documentList as any}
                totalCount={totalCount}
                onAddEditSuccess={handleAddEditSuccess as any}
                type='2'
              />
            </Box>
          )}
        </CustomAccordion>
      )}

      {id ? (
        <CustomAccordion
          id='linked-shipments'
          title={`${t('compliance_module.linked_shipments')} - ${totalLinkedShipments}`}
          expanded={expanded.includes('linked-shipments')}
          onChange={handleAccordionChange}
          editable={false}
          handleEditClick={() => {}}
          type='shipment'
        >
          <LinkedShipments
            shipments={linkedShipments}
            totalShipped={(linkedShipmentsData?.total_shipment_animals as number) || 0}
            totalAllowed={(linkedShipmentsData?.total_export_animals as number) || 0}
          />
        </CustomAccordion>
      ) : (
        ''
      )}
    </>
  )
}

export default AddEditImport
