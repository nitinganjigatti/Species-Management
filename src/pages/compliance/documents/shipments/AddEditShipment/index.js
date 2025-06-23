import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { CardHeader, Box, Breadcrumbs, Typography, Select, MenuItem } from '@mui/material'
import Icon from 'src/@core/components/icon'
import CustomAccordion from 'src/views/utility/CustomAccordion'
import BasicDetails from 'src/views/pages/compliance/documents/shipment/view-component/BasicDetails'
import AnimalsData from 'src/views/pages/compliance/documents/shipment/forms/AnimalsData'
import ShipmentBasicDetails from 'src/views/pages/compliance/documents/shipment/forms/ShipmentBasicDetails'

const AddEditShipment = () => {
  const router = useRouter()
  const { id } = router.query
  const isEdit = Boolean(id && id !== 'new')
  const [expanded, setExpanded] = useState('permit-details') // Accordion open state
  const [showEdit, setShowEdit] = useState(false)
  const [showEditAnimals, setShowEditAnimals] = useState(false)
  const [status, setStatus] = useState('Draft')
  const animalsEditRef = useRef() // ref to trigger child
  const basicDetailsEditRef = useRef()

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Typography>Shipment Documents</Typography>
          <Typography onClick={() => router.push('/compliance/documents/shipments')} sx={{ cursor: 'pointer' }}>
            Shipments
          </Typography>
          <Typography color='text.primary'>{isEdit ? 'Edit Shipment Permit' : 'New Shipment Permit'}</Typography>
        </Breadcrumbs>
      </Box>

      <Box display='flex' justifyContent='space-between' alignItems='center' sx={{ mb: 3, mt: 6 }}>
        {/* Left section: Back icon and title */}
        <Box display='flex' alignItems='center'>
          <Icon style={{ cursor: 'pointer', color: '#44544A' }} icon='material-symbols:arrow-back' />
          <CardHeader
            title={isEdit ? 'Edit Shipment Permit' : 'Shipment Permit'}
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
            <MenuItem value='Draft'>Draft</MenuItem>
            <MenuItem value='Completed'>Completed</MenuItem>
          </Select>
        </Box>
      </Box>

      {/* PERMIT DETAILS SECTION */}
      <CustomAccordion
        id='permit-details'
        title={
          <Box
            className='edit_contxt'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              gap: '800px'
            }}
          >
            <Typography sx={{ fontWeight: 500, fontSize: '22px', color: '#1F515B' }}>Basic Details</Typography>
            {!showEdit && expanded ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: '#E1F9ED',
                  pr: 4,
                  pl: 2,
                  py: 1,
                  borderRadius: '5px'
                }}
                onClick={() => basicDetailsEditRef.current?.()} // trigger SpeciesAddEdit
              >
                <Icon
                  style={{ fontSize: '15px', cursor: 'pointer', marginRight: '4px', color: '#006D35' }}
                  icon='bx:pencil'
                />
                <Typography variant='body2' sx={{ color: '#006D35', fontWeight: 500 }}>
                  Edit
                </Typography>
              </Box>
            ) : (
              ''
            )}
          </Box>
        }
        expanded={expanded}
        onChange={panelId => setExpanded(prev => (prev === panelId ? null : panelId))}
      >
        <ShipmentBasicDetails onEditClick={basicDetailsEditRef} setShowEdit={setShowEdit} showEdit={showEdit} />
      </CustomAccordion>

      <CustomAccordion
        id='supporting-documents'
        title={
          <Box
            className='editanimals_contxt'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              gap: '860px'
            }}
          >
            <Typography sx={{ fontWeight: 500, fontSize: '22px', color: '#1F515B' }}>Animals</Typography>
            {!showEditAnimals && expanded ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: '#E1F9ED',
                  pr: 4,
                  pl: 2,
                  py: 1,
                  borderRadius: '5px'
                }}
                onClick={() => animalsEditRef.current?.()} // trigger SpeciesAddEdit
              >
                <Icon
                  style={{ fontSize: '15px', cursor: 'pointer', marginRight: '4px', color: '#006D35' }}
                  icon='bx:pencil'
                />
                <Typography variant='body2' sx={{ color: '#006D35', fontWeight: 500 }}>
                  Edit
                </Typography>
              </Box>
            ) : (
              ''
            )}
          </Box>
        }
        expanded={expanded}
        onChange={panelId => setExpanded(prev => (prev === panelId ? null : panelId))}
      >
        <AnimalsData
          onEditClick={animalsEditRef}
          showEditAnimals={showEditAnimals}
          setShowEditAnimals={setShowEditAnimals}
        />
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
