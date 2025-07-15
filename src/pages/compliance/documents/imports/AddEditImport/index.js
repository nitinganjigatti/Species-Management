import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { CardHeader, Box, Breadcrumbs, Typography, Select, alpha } from '@mui/material'
import Icon from 'src/@core/components/icon'
import CustomAccordion from 'src/views/utility/CustomAccordion'
import { getDocumentTypeList } from 'src/lib/api/compliance/exports'
import Toaster from 'src/components/Toaster'
import SupportingDocuments from 'src/components/compliance/SupportingDocuments'
import AnimalsData from 'src/views/pages/compliance/documents/imports/forms/AnimalsData'
import { getLinkedDocumentsImports } from 'src/lib/api/compliance/imports'
import { useTheme } from '@mui/material/styles'
import LinkedShipments from 'src/components/compliance/LinkedShipments'

const AddEditImport = () => {
  const router = useRouter()
  const { id, action } = router.query
  const theme = useTheme()
  const isEdit = Boolean(id && id !== 'new')
  const [expanded, setExpanded] = useState('animals-details')
  const [showEditAnimals, setShowEditAnimals] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [isFetching, setIsFetching] = useState(false)
  const [documentList, setDocumentList] = useState([])
  const [totalAnimals, setTotalAnimals] = useState(0)
  const [totalSpecies, setTotalSpecies] = useState(0)
  const [airwaybillvalue, setAirwaybillvalue] = useState('')
  const [linkedShipments, setLinkedShipments] = useState([])
  const [linkedShipmentsData, setLinkedShipmentsData] = useState()
  const [totalLinkedShipments, setTotalLinkedShipments] = useState(0)
  const animalsEditRef = useRef()

  useEffect(() => {
    if (isEdit && action === 'edit') {
      setShowEditAnimals(true)
    }
  }, [isEdit, action])

  const fetchDocumentTypeList = async exportId => {
    setIsFetching(true)
    try {
      const params = {
        id: id || exportId,
        type: 'import'
      }
      const res = await getDocumentTypeList(params)
      if (res.success) {
        setDocumentList(res.data.items)
        setTotalCount(res.data.total)
      } else {
        Toaster({ type: 'error', message: res.message || 'Failed to fetch export details' })
      }
    } catch (error) {
      Toaster({ type: 'error', message: 'Error fetching export details' })
    } finally {
      setIsFetching(false)
    }
  }

  const uploadedFileCount = documentList?.filter(doc => doc.file_path).length || 0

  const handleAddEditSuccess = data => {
    const updatedList = documentList.map(item => (item.id === data.id ? { ...item, ...data } : item))
    setDocumentList(updatedList)
  }

  useEffect(() => {
    if (id) {
      fetchDocumentTypeList()
      fetchLinkedDocuments()
    }
  }, [id])

  const fetchLinkedDocuments = async () => {
    try {
      const response = await getLinkedDocumentsImports(id)
      if (response?.success) {
        setTotalLinkedShipments(response?.data?.shipments?.length)
        setLinkedShipments(response.data.shipments)
        setLinkedShipmentsData(response.data)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (e) {
      Toaster({ type: 'error', message: 'Error fetching shipment basic details' })
    }
  }

  const isAnimalsEditable = showEditAnimals && expanded === 'animals-details' && id && action === 'details'

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Typography>Import Documents</Typography>
          <Typography onClick={() => router.push('/compliance/documents/imports')} sx={{ cursor: 'pointer' }}>
            Import
          </Typography>
          <Typography color='text.primary'>
            {action === 'edit' ? 'Edit Import ' : action === 'details' ? 'Import Details' : 'New Import'}
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
          <Icon style={{ cursor: 'pointer', color: '#44544A' }} icon='material-symbols:arrow-back' />
          <CardHeader
            title={
              action === 'edit' ? 'Edit Import Permit' : action === 'details' ? 'Import Details' : 'CITES Import Permit'
            }
            titleTypographyProps={{ fontSize: '1.5rem !important', fontWeight: 'bold' }}
            sx={{ paddingLeft: 2, py: 0, pr: 0 }}
          />
        </Box>
      </Box>

      <CustomAccordion
        id='animals-details'
        docsCount={
          !isAnimalsEditable && expanded !== 'animals-details' && (totalAnimals || totalSpecies) ? (
            <Typography component='span' sx={{ fontWeight: 400, color: '#44544A' }}>
              <strong>{totalSpecies}</strong> Species&nbsp;|&nbsp;
              <strong>{totalAnimals}</strong> Animals
            </Typography>
          ) : null
        }
        title={<Typography sx={{ fontWeight: 500, fontSize: '22px', color: '#1F515B' }}>Details</Typography>}
        expanded={expanded}
        onChange={panelId => setExpanded(prev => (prev === panelId ? null : panelId))}
        editable={showEditAnimals && expanded === 'animals-details' && id && action === 'details'}
        handleEditClick={() => {
          animalsEditRef.current?.()
          router.push(`/compliance/documents/imports/AddEditImport/?id=${id}&action=edit`)
        }}
        type='shipment'
      >
        <AnimalsData
          onEditClick={animalsEditRef}
          showEditAnimals={showEditAnimals}
          setShowEditAnimals={setShowEditAnimals}
          importId={id}
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
            <Typography sx={{ fontWeight: 500, fontSize: '22px', color: '#1F515B' }}>Supporting Documents</Typography>
          }
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
              <Typography
                sx={{ color: theme.palette.customColors.neutralSecondary, fontWeight: 500, fontSize: '1rem' }}
              >
                Please save form details to add supporting documents
              </Typography>
            </Box>
          ) : (
            <SupportingDocuments
              isFetching={isFetching}
              documentList={documentList}
              totalCount={totalCount}
              onAddEditSuccess={handleAddEditSuccess}
              type='2'
            />
          )}
        </CustomAccordion>
      )}

      {id ? (
        <CustomAccordion
          id='linked-shipments'
          title={`Linked Shipments - ${totalLinkedShipments}`}
          expanded={expanded}
          onChange={panelId => setExpanded(prev => (prev === panelId ? null : panelId))}
        >
          <LinkedShipments
            shipments={linkedShipments}
            totalShipped={linkedShipmentsData?.total_shipment_animals || 0}
            totalAllowed={linkedShipmentsData?.total_export_animals || 0}
          />
        </CustomAccordion>
      ) : (
        ''
      )}
    </>
  )
}

export default AddEditImport
