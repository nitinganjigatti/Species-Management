import React, { useState, useEffect, useContext, useMemo } from 'react'
import { useRouter } from 'next/router'
import { CardHeader, Box, Breadcrumbs, Typography, CircularProgress, alpha, Tabs, Tab } from '@mui/material'
import { AuthContext } from 'src/context/AuthContext'
import Toaster from 'src/components/Toaster'
import {
  getDocumentTypeList,
  getExportDetails,
  getLinkedImportsDetails,
  getLinkedShipmentDetails,
  getMastersData
} from 'src/lib/api/compliance/exports'
import CustomAccordion from 'src/views/utility/CustomAccordion'
import { useTheme } from '@mui/material/styles'
import SpeciesDetail from 'src/components/compliance/SpeciesDetail'
import ExportPermitDetailsContent from 'src/views/pages/compliance/documents/exports/ExportPermitDetailsContent'
import LinkedImports from 'src/components/compliance/LinkedImports'
import LinkedShipments from 'src/components/compliance/LinkedShipments'
import SupportingDocuments from 'src/components/compliance/SupportingDocuments'
import countryList from 'react-select-country-list'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { DocumentType, ExportPermit } from 'src/types/compliance'

const ExportPermitDetails = () => {
  const router = useRouter()
  const theme = useTheme()
  const { id } = router.query
  const { userData } = useContext(AuthContext)
  const canEdit = (userData as any)?.roles?.settings?.cites_export_permit_module === 'EDIT'
  const [expanded, setExpanded] = useState<string[]>(['permit-details'])
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const [documentList, setDocumentList] = useState<DocumentType[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [linkedShipments, setLinkedShipments] = useState<Record<string, unknown>[]>([])
  const [linkedShipmentsData, setLinkedShipmentsData] = useState<Record<string, unknown> | undefined>()
  const [totalLinkedShipments, setTotalLinkedShipments] = useState<number>(0)
  const [linkedImports, setLinkedImports] = useState<Record<string, unknown>[]>([])
  const [totalLinkedImports, setTotalLinkedImports] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<string>('completed')
  const [loading, setLoading] = useState<boolean>(true)

  const [exportData, setExportData] = useState<ExportPermit>({
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
    species: []
  })
  const countryListOptions = useMemo(() => countryList().getData(), [])

  // Accordion toggle handler
  const handleAccordionChange = (panelId: string) => {
    setExpanded(prev =>
      prev.includes(panelId)
        ? prev.filter(p => p !== panelId) // Close if open
        : [...prev, panelId] // Open if closed
    )
  }

  const fetchDocumentTypeList = async (exportId?: string) => {
    setIsFetching(true)
    try {
      const params = {
        id: (id || exportId) as string,
        status: activeTab,
        type: 'export'
      }
      const res = await getDocumentTypeList(params)
      if (res.success) {
        console.log('res.data', res.data)
        setDocumentList((res.data?.items || []) as DocumentType[])
        setTotalCount(res.data?.total || 0)
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

  const fetchMastersData = async (): Promise<string | null> => {
    try {
      const res = await getMastersData()
      if (res?.success) {
        return (res.data?.document_type_id as string) || null
      }
    } catch (error) {
      console.error('Error fetching masters data:', error)
      Toaster({ type: 'error', message: 'Error fetching masters data' })
    }

    return null
  }

  const fetchExportDetails = async () => {
    setLoading(true)
    try {
      const documentTypeIdFromRes = await fetchMastersData()

      const params = {
        document_type_id: documentTypeIdFromRes
      }
      const res = await getExportDetails(id as string, params)
      if (res.success) {
        setExportData({
          ...res.data,
          origin_country: res?.data?.origin_country
            ? countryListOptions.find((country: { value: string }) => country.value === res?.data?.origin_country)?.label
            : '-',
          exporting_country: res?.data?.exporting_country
            ? countryListOptions.find(
                (country: { value: string }) => country.value === res?.data?.exporting_country
              )?.label
            : '-'
        })
        if (id && !documentList.length) fetchDocumentTypeList()
        fetchLinkedShipmentsDetails()
        fetchLinkedImportsDetails()
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

  const fetchLinkedShipmentsDetails = async () => {
    setLoading(true)
    try {
      const res = await getLinkedShipmentDetails(id as string)
      if (res.success) {
        console.log('getLinkedShipmentDetails res.data', res.data)
        setTotalLinkedShipments((res.data as any)?.total_shipments || 0)
        setLinkedShipments((res.data as any)?.records || [])
        setLinkedShipmentsData(res.data as any)
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

  const fetchLinkedImportsDetails = async () => {
    setLoading(true)
    try {
      const res = await getLinkedImportsDetails(id as string)
      if (res.success) {
        setTotalLinkedImports((res.data as any)?.total_imports || 0)
        setLinkedImports((res.data as any)?.records || [])
      } else {
        Toaster({ type: 'error', message: res.message || 'Failed to fetch export details' })
      }
    } catch (error) {
      console.error('Error fetching export details:', error)
      Toaster({ type: 'error', message: 'Error fetching Linked Import' })
    } finally {
      setLoading(false)
    }
  }

  const uploadedFileCount = documentList?.filter(doc => (doc as any).file_path).length || 0

  const handleAddEditSuccess = () => {
    fetchDocumentTypeList()
    setActiveTab('completed')
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)
  }

  useEffect(() => {
    if (id) {
      fetchExportDetails()
    }
  }, [id])

  useEffect(() => {
    if (id && documentList?.length) {
      fetchDocumentTypeList()
    }
  }, [id, activeTab])

  return (
    <>
      <Box sx={{ mb: 5 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Typography sx={{ color: 'inherit' }}>Compliance</Typography>
          <Typography
            sx={{ cursor: 'pointer', color: 'inherit' }}
            onClick={() => router.push('/compliance/documents/exports')}
          >
            CITES Export Permit
          </Typography>
          <Typography sx={{ color: 'text.primary' }}>{exportData.export_number || 'Export Permit'}</Typography>
        </Breadcrumbs>
      </Box>

      <CardHeader
        title={
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 'medium' }}>{`CITES Export Permit - ${
            exportData.export_number || 'No ID'
          }`}</Typography>
        }
      />
      <CustomAccordion
        id='permit-details'
        title='Details'
        expanded={expanded.includes('permit-details')}
        shouldScrollToTop={false}
        onChange={handleAccordionChange}
        editable
        handleEditClick={() => router.push(`/compliance/documents/exports/AddEditExportPermit?id=${id}`)}
        type='export'
      >
        {loading ? (
          <Box display='flex' justifyContent='center' alignItems='center' minHeight='300px'>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <ExportPermitDetailsContent exportData={exportData} loading={loading} />
            <SpeciesDetail
              species={exportData?.species || []}
              speciesCount={(exportData?.species_count as number) || 0}
              animalsCount={(exportData?.animals_count as number) || 0}
            />
          </>
        )}
      </CustomAccordion>
      {documentList?.length ? (
        <CustomAccordion
          id='supporting-documents'
          title='Supporting Documents'
          docsCount={`${uploadedFileCount}/${totalCount}` as any}
          expanded={expanded.includes('supporting-documents')}
          onChange={handleAccordionChange}
          editable={false}
          handleEditClick={() => {}}
          type='export'
        >
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 8 }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label='supporting documents tabs'>
                <Tab
                  label={`Completed${
                    activeTab === 'completed' && documentList.length > 0 ? ` (${documentList.length})` : ''
                  }`}
                  value='completed'
                  sx={{ mr: 4 }}
                />
                <Tab
                  label={`Pending${
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
              onAddEditSuccess={handleAddEditSuccess}
              type='1'
            />
          </Box>
        </CustomAccordion>
      ) : null}
      <CustomAccordion
        id='linked-imports'
        title={`Linked Imports - ${totalLinkedImports}`}
        expanded={expanded.includes('linked-imports')}
        onChange={handleAccordionChange}
        editable={false}
        handleEditClick={() => {}}
        type='import'
      >
        <LinkedImports imports={linkedImports} />
      </CustomAccordion>

      <CustomAccordion
        id='linked-shipments'
        title={`Linked Shipments - ${totalLinkedShipments}`}
        expanded={expanded.includes('linked-shipments')}
        onChange={handleAccordionChange}
        editable={false}
        handleEditClick={() => {}}
        type='shipment'
      >
        <LinkedShipments
          shipments={linkedShipments}
          totalShipped={(linkedShipmentsData?.total_shipped_animals as number) || 0}
          totalAllowed={(linkedShipmentsData?.total_export_animals as number) || 0}
        />
      </CustomAccordion>
    </>
  )
}

export default enforceModuleAccess(ExportPermitDetails, 'compliance_module')
