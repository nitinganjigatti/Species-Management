import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { CardHeader, Box, Breadcrumbs, Typography, Select, MenuItem, Button, alpha, Tab, Tabs } from '@mui/material'
import Icon from 'src/@core/components/icon'
import CustomAccordion from 'src/views/utility/CustomAccordion'
import { getDocumentTypeList } from 'src/lib/api/compliance/exports'
import { getMastersData } from 'src/lib/api/compliance/exports'
import Toaster from 'src/components/Toaster'
import SupportingDocuments from 'src/components/compliance/SupportingDocuments'
import AnimalsData from 'src/views/pages/compliance/documents/shipment/forms/AnimalsData'
import ShipmentBasicDetails from 'src/views/pages/compliance/documents/shipment/forms/ShipmentBasicDetails'
import { getLinkedDocumentsShipments } from 'src/lib/api/compliance/shipment'
import { useTheme } from '@mui/material/styles'
import LinkedDocuments from 'src/views/pages/compliance/documents/shipment/forms/LinkedDocuments'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { DocumentType, MastersData } from 'src/types/compliance'

const AddEditShipment = () => {
  const router = useRouter()
  const { id, action, export: exportCount } = router.query
  const theme = useTheme()
  const isEdit = Boolean(id && id !== 'new')
  const [expanded, setExpanded] = useState<string[]>(['permit-details'])
  const [showEdit, setShowEdit] = useState<boolean>(true)
  const [showEditAnimals, setShowEditAnimals] = useState<boolean>(true)
  const [mastersData, setMastersData] = useState<MastersData | Record<string, unknown>>({})
  const [status, setStatus] = useState<string>('draft')
  const [totalCount, setTotalCount] = useState<number>(0)
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const [documentList, setDocumentList] = useState<DocumentType[]>([])
  const [totalAnimals, setTotalAnimals] = useState<number>(0)
  const [totalSpecies, setTotalSpecies] = useState<number>(0)
  const [airwaybillvalue, setAirwaybillvalue] = useState<string>('')
  const [linkedDocumentsData, setlinkedDocumentsData] = useState<Record<string, unknown>>({})
  const [shipmentIdval, setshipmentIdVal] = useState<string | number | null>('')
  const [activeTab, setActiveTab] = useState<string>('completed')
  const animalsEditRef = useRef<(() => void) | null>(null)
  const basicDetailsEditRef = useRef<(() => void) | null>(null)
  const basicDetailsRef = useRef<{ handleSave: (status: string) => Promise<boolean | undefined> } | null>(null)

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)
  }

  useEffect(() => {
    if (isEdit && action === 'edit') {
      setShowEdit(true)
      setShowEditAnimals(true)
    }
  }, [isEdit, action])

  const handleStatusChange = async (newStatus: string) => {
    if (basicDetailsRef.current && typeof basicDetailsRef.current.handleSave === 'function') {
      try {
        const success = await basicDetailsRef.current.handleSave(newStatus)

        if (success) {
          setStatus(newStatus)
        }
      } catch (error) {
        console.error('Error saving status:', error)
      }
    }
  }

  const rawValue = airwaybillvalue || ''
  const removeSpaceValue = rawValue.replace(/\s+/g, '') // remove all spaces

  const formattedValue =
    removeSpaceValue.length > 3 ? `${removeSpaceValue.slice(0, 3)} - ${removeSpaceValue.slice(3)}` : removeSpaceValue

  const fetchDocumentTypeList = async (exportId?: string) => {
    setIsFetching(true)
    try {
      const params = {
        id: (id || exportId) as string,
        status: activeTab,
        type: 'shipment'
      }
      const res = await getDocumentTypeList(params)
      if (res.success) {
        setDocumentList((res.data?.items || []) as DocumentType[])
        setTotalCount(res.data?.total || 0)
      } else {
        Toaster({ type: 'error', message: res.message || 'Failed to fetch export details' })
      }
    } catch (error) {
      Toaster({ type: 'error', message: 'Error fetching export details' })
    } finally {
      setIsFetching(false)
    }
  }

  const uploadedFileCount = documentList?.filter(doc => (doc as any).file_path).length || 0

  const handleAddEditSuccess = (data: Record<string, unknown>) => {
    const updatedList = documentList.map(item => (item.id === data.id ? { ...item, ...data } : item))
    setDocumentList(updatedList as DocumentType[])
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
      const response = await getLinkedDocumentsShipments(id as string)
      if (response?.success) {
        setlinkedDocumentsData(response.data as Record<string, unknown>)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (e) {
      Toaster({ type: 'error', message: 'Error fetching shipment basic details' })
    }
  }

  const isBasicEditable = showEdit && expanded.includes('permit-details') && id && action === 'details'

  const isAnimalsEditable =
    showEditAnimals && expanded.includes('animals-details') && id && action === 'details' && Number(exportCount) > 0

  // Accordion toggle handler
  const handleAccordionChange = (panelId: string) => {
    setExpanded(prev =>
      prev.includes(panelId)
        ? prev?.filter(p => p !== panelId) // Close if open
        : [...prev, panelId] // Open if closed
    )
  }

  const fetchMastersData = async () => {
    try {
      const res = await getMastersData()
      if (res?.success) {
        const data = res.data
        setMastersData(data as MastersData)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchMastersData()
  }, [])

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Typography>Shipment Documents</Typography>
          <Typography onClick={() => router.push('/compliance/documents/shipments')} sx={{ cursor: 'pointer' }}>
            Shipments
          </Typography>
          <Typography color='text.primary'>
            {action === 'edit'
              ? 'Edit Shipment Permit'
              : action === 'details'
              ? 'Shipment Details'
              : 'New Shipment Permit'}
          </Typography>
        </Breadcrumbs>
      </Box>

      <Box display='flex' justifyContent='space-between' alignItems='center' sx={{ mb: 3, mt: 6 }}>
        {/* Left section: Back icon and title */}
        <Box
          display='flex'
          alignItems='center'
          onClick={() => router.push('/compliance/documents/shipments')}
          sx={{ cursor: 'pointer' }}
        >
          <Icon
            style={{ cursor: 'pointer', color: theme.palette.customColors.OnSurfaceVariant }}
            icon='material-symbols:arrow-back'
          />
          <CardHeader
            title={
              action === 'edit'
                ? 'Edit Shipment Permit'
                : action === 'details'
                ? 'Shipment Details'
                : 'New Shipment Permit'
            }
            slotProps={{
              title: {
                sx: { fontSize: '1.5rem !important', fontWeight: 'bold' }
              }
            }}
            sx={{ paddingLeft: 2, py: 0, pr: 0 }}
          />
        </Box>

        {/* Right section: Status and dropdown */}
        <Box display='flex' alignItems='center' gap={2}>
          <Typography sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>Status:</Typography>
          {action === 'details' ? (
            <Typography
              sx={{
                fontWeight: 600,
                color: status === 'draft' ? theme.palette.common.black : theme.palette.common.black,
                backgroundColor:
                  status === 'draft'
                    ? theme.palette.customColors.antzNotes80
                    : theme.palette.customColors.PrimaryContainer,
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                display: 'inline-block'
              }}
            >
              {status === 'draft' ? 'Draft' : 'Completed'}
            </Typography>
          ) : (
            <Select
              value={status}
              onChange={e => handleStatusChange(e.target.value)}
              size='small'
              sx={{
                minWidth: 140,
                fontWeight: 600,
                background:
                  status === 'draft'
                    ? theme.palette.customColors.antzNotes80
                    : theme.palette.customColors.PrimaryContainer,
                color: theme.palette.common.black
              }}
            >
              <MenuItem value='draft'>Draft</MenuItem>
              <MenuItem value='completed'>Completed</MenuItem>
            </Select>
          )}
        </Box>
      </Box>

      {/* PERMIT DETAILS SECTION */}

      <CustomAccordion
        id='permit-details'
        docsCount={(!isBasicEditable && !expanded.includes('permit-details') && id ? `ID: ${rawValue}` : null) as any}
        title={
          <Typography sx={{ fontWeight: 500, fontSize: '22px', color: theme.palette.customColors.OnPrimaryContainer }}>
            Basic Details
          </Typography>
        }
        expanded={expanded.includes('permit-details')}
        onChange={handleAccordionChange}
        editable={!!(expanded.includes('permit-details') && id && action === 'details')}
        handleEditClick={() => {
          setExpanded(['permit - details'])
          basicDetailsEditRef.current?.()
          linkedDocumentsData?.exports_count || Number(exportCount) > 0
            ? router.push(`/compliance/documents/shipments/AddEditShipment/?id=${id}&action=edit&export=1`)
            : router.push(`/compliance/documents/shipments/AddEditShipment/?id=${id}&action=edit`)
        }}
        type='shipment'
      >
        <ShipmentBasicDetails
          ref={basicDetailsRef}
          onEditClick={basicDetailsEditRef}
          setShowEdit={setShowEdit}
          showEdit={showEdit}
          status={status}
          setStatus={setStatus}
          airwaybillvalue={airwaybillvalue}
          setAirwaybillvalue={setAirwaybillvalue}
          setshipmentIdVal={setshipmentIdVal}
          shipmentIdval={shipmentIdval}
          setExpanded={setExpanded}
          linkedDocumentsData={linkedDocumentsData}
          mastersData={mastersData}
          exportCount={Number(exportCount) || 0}
        />
      </CustomAccordion>

      {id && (
        <CustomAccordion
          id='animals-details'
          docsCount={
            !isAnimalsEditable && !expanded.includes('animals-details') && (totalAnimals || totalSpecies) ? (
              <Typography component='span' sx={{ fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
                <strong>{totalSpecies}</strong> Species&nbsp;|&nbsp;
                <strong>{totalAnimals}</strong> Animals
              </Typography>
            ) : (null as any)
          }
          title={
            <Typography
              sx={{ fontWeight: 500, fontSize: '22px', color: theme.palette.customColors.OnPrimaryContainer }}
            >
              Animals
            </Typography>
          }
          expanded={expanded.includes('animals-details')}
          onChange={handleAccordionChange}
          editable={!!(showEditAnimals &&
            expanded.includes('animals-details') &&
            id &&
            action === 'details' &&
            Number(exportCount) > 0)}
          handleEditClick={() => {
            setExpanded(['animals - details'])
            animalsEditRef.current?.()
            router.push(`/compliance/documents/shipments/AddEditShipment/?id=${id}&action=edit&export=${exportCount}`)
          }}
          type='shipment'
        >
          <Box className={expanded.includes('animals-details') && action !== 'details' ? 'animl_dt' : ''}>
            <AnimalsData
              onEditClick={animalsEditRef as any}
              setShowEditAnimals={setShowEditAnimals}
              shipmentId={id as string}
              setTotalAnimals={setTotalAnimals}
              setTotalSpecies={setTotalSpecies}
              totalAnimals={totalAnimals}
              totalSpecies={totalSpecies}
              setExpanded={setExpanded}
              fetchLinkedDocuments={fetchLinkedDocuments}
              mastersData={mastersData as any}
            />
          </Box>
        </CustomAccordion>
      )}

      {id && (
        <CustomAccordion
          id='supporting-documents'
          title={
            <Typography
              sx={{ fontWeight: 500, fontSize: '22px', color: theme.palette.customColors.OnPrimaryContainer }}
            >
              Travel & customs Documents
            </Typography>
          }
          docsCount={(totalCount ? `${uploadedFileCount}/${totalCount}` : null) as any}
          expanded={expanded.includes('supporting-documents')}
          onChange={handleAccordionChange}
          editable={false}
          handleEditClick={() => {}}
          type='shipment'
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
                Please save form details to add supporting documents
              </Typography>
            </Box>
          ) : (
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
                onAddEditSuccess={handleAddEditSuccess as any}
                type='3'
              />
            </Box>
          )}
        </CustomAccordion>
      )}

      {id && ((linkedDocumentsData?.exports as unknown[])?.length || (linkedDocumentsData?.imports as unknown[])?.length) ? (
        <CustomAccordion
          id='linked-documents'
          title={
            <Typography
              sx={{ fontWeight: 500, fontSize: '22px', color: theme.palette.customColors.OnPrimaryContainer }}
            >
              Linked Documents
            </Typography>
          }
          expanded={expanded.includes('linked-documents')}
          onChange={handleAccordionChange}
          editable={false}
          handleEditClick={() => {}}
          docsCount={
            (linkedDocumentsData?.exports_count || linkedDocumentsData?.imports_count ? (
              <Typography component='span' sx={{ fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
                <strong>{linkedDocumentsData?.exports_count as number}</strong> Exports&nbsp;|&nbsp;
                <strong>{linkedDocumentsData?.imports_count as number}</strong> Imports
              </Typography>
            ) : null) as any
          }
          type='shipment'
        >
          <LinkedDocuments linkedDocumentsData={linkedDocumentsData} />
        </CustomAccordion>
      ) : (
        ''
      )}
    </>
  )
}

export default enforceModuleAccess(AddEditShipment, 'compliance_module')
