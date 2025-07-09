import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { CardHeader, Box, Breadcrumbs, Typography, Select, MenuItem, Button } from '@mui/material'
import Icon from 'src/@core/components/icon'
import CustomAccordion from 'src/views/utility/CustomAccordion'
import { getDocumentTypeList } from 'src/lib/api/compliance/exports'
import SupportingDocuments from 'src/components/compliance/SupportingDocuments'
import AnimalsData from 'src/views/pages/compliance/documents/shipment/forms/AnimalsData'
import ShipmentBasicDetails from 'src/views/pages/compliance/documents/shipment/forms/ShipmentBasicDetails'

const AddEditShipment = () => {
  const router = useRouter()
  const { id, action, export: exportCount } = router.query
  const isEdit = Boolean(id && id !== 'new')
  const [expanded, setExpanded] = useState('permit-details') // Accordion open state
  const [showEdit, setShowEdit] = useState(true)
  const [showEditAnimals, setShowEditAnimals] = useState(true)
  const [status, setStatus] = useState('draft')
  const [totalCount, setTotalCount] = useState(0)
  const [isFetching, setIsFetching] = useState(false)
  const [documentList, setDocumentList] = useState([])
  const [totalAnimals, setTotalAnimals] = useState(0)
  const [totalSpecies, setTotalSpecies] = useState(0)
  const [airwaybillvalue, setAirwaybillvalue] = useState('')
  const animalsEditRef = useRef() // ref to trigger child
  const basicDetailsEditRef = useRef()

  useEffect(() => {
    if (isEdit && action === 'edit') {
      setShowEdit(true)
      setShowEditAnimals(true)
    }
  }, [isEdit, action])

  const rawValue = airwaybillvalue || ''
  const removeSpaceValue = rawValue.replace(/\s+/g, '') // remove all spaces
  const formattedValue =
    removeSpaceValue.length > 3 ? `${removeSpaceValue.slice(0, 3)} - ${removeSpaceValue.slice(3)}` : removeSpaceValue

  const fetchDocumentTypeList = async exportId => {
    setIsFetching(true)
    try {
      const params = {
        id: id || exportId,
        type: 'shipment'
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

  const uploadedFileCount = documentList?.filter(doc => doc.file_path).length || 0

  const handleAddEditSuccess = data => {
    const updatedList = documentList.map(item => (item.id === data.id ? { ...item, ...data } : item))
    setDocumentList(updatedList)
  }

  useEffect(() => {
    if (id) {
      fetchDocumentTypeList()
    }
  }, [id])

  const isBasicEditable = showEdit && expanded === 'permit-details' && id && action === 'details'
  const isAnimalsEditable =
    showEditAnimals && expanded === 'animals-details' && id && action === 'details' && exportCount > 0

  return (
    <>
      <Box sx={{ mb: 2 }}>
        {console.log(action, 'action')}
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
          <Icon style={{ cursor: 'pointer', color: '#44544A' }} icon='material-symbols:arrow-back' />
          <CardHeader
            title={
              action === 'edit'
                ? 'Edit Shipment Permit'
                : action === 'details'
                ? 'Shipment Details'
                : 'New Shipment Permit'
            }
            titleTypographyProps={{ fontSize: '1.5rem !important', fontWeight: 'bold' }}
            sx={{ paddingLeft: 2, py: 0, pr: 0 }}
          />
        </Box>

        {/* Right section: Status and dropdown */}
        <Box display='flex' alignItems='center' gap={2}>
          <Typography sx={{ fontWeight: 500, color: '#44544A' }}>Status:</Typography>
          <Select
            value={status}
            onChange={e => setStatus(e.target.value)}
            size='small'
            sx={{ minWidth: 140, fontWeight: 600, background: '#FFE86E', color: '#000' }}
          >
            <MenuItem value='draft'>Draft</MenuItem>
            <MenuItem value='completed'>Completed</MenuItem>
          </Select>
        </Box>
      </Box>

      {/* PERMIT DETAILS SECTION */}

      <CustomAccordion
        id='permit-details'
        docsCount={!isBasicEditable && expanded !== 'permit-details' ? `ID: ${formattedValue}` : null}
        title={<Typography sx={{ fontWeight: 500, fontSize: '22px', color: '#1F515B' }}>Basic Details</Typography>}
        expanded={expanded}
        onChange={panelId => setExpanded(prev => (prev === panelId ? null : panelId))}
        editable={showEdit && expanded === 'permit-details' && id && action === 'details'}
        handleEditClick={() => {
          basicDetailsEditRef.current?.()
          router.push(`/compliance/documents/shipments/AddEditShipment/?id=${id}&action=edit`)
        }}
        type='shipment'
      >
        <ShipmentBasicDetails
          onEditClick={basicDetailsEditRef}
          setShowEdit={setShowEdit}
          showEdit={showEdit}
          status={status}
          setStatus={setStatus}
          airwaybillvalue={airwaybillvalue}
          setAirwaybillvalue={setAirwaybillvalue}
        />
      </CustomAccordion>

      {id && (
        <CustomAccordion
          id='animals-details'
          docsCount={
            !isAnimalsEditable && expanded !== 'animals-details' && (totalAnimals || totalSpecies)
              ? `${totalSpecies} Species  | ${totalAnimals} Animals`
              : null
          }
          title={<Typography sx={{ fontWeight: 500, fontSize: '22px', color: '#1F515B' }}>Animals</Typography>}
          expanded={expanded}
          onChange={panelId => setExpanded(prev => (prev === panelId ? null : panelId))}
          editable={showEditAnimals && expanded === 'animals-details' && id && action === 'details' && exportCount > 0}
          handleEditClick={() => {
            animalsEditRef.current?.()
            router.push(`/compliance/documents/shipments/AddEditShipment/?id=${id}&action=edit&export=${exportCount}`)
          }}
          type='shipment'
        >
          <AnimalsData
            onEditClick={animalsEditRef}
            showEditAnimals={showEditAnimals}
            setShowEditAnimals={setShowEditAnimals}
            shipmentId={id}
            setTotalAnimals={setTotalAnimals}
            setTotalSpecies={setTotalSpecies}
            totalAnimals={totalAnimals}
            totalSpecies={totalSpecies}
          />
        </CustomAccordion>
      )}

      <CustomAccordion
        id='supporting-documents'
        title='Travel & customs Documents'
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
            type='3'
          />
        )}
      </CustomAccordion>

      {/* <CustomAccordion
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

export default AddEditShipment
