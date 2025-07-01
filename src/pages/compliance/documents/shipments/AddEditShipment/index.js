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
  const { id, action } = router.query
  const isEdit = Boolean(id && id !== 'new')
  const [expanded, setExpanded] = useState('permit-details') // Accordion open state
  const [showEdit, setShowEdit] = useState(true)
  const [showEditAnimals, setShowEditAnimals] = useState(false)
  const [status, setStatus] = useState('draft')
  const animalsEditRef = useRef() // ref to trigger child
  const basicDetailsEditRef = useRef()

  useEffect(() => {
    if (isEdit && action === 'edit') {
      setShowEdit(true)
    }
  }, [isEdit, action])

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
      {console.log(id, 'id')}
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
            {showEdit && expanded === 'permit-details' && id && action === 'details' ? (
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
                onClick={() => {
                  basicDetailsEditRef.current?.()
                  router.push(`/compliance/documents/shipments/AddEditShipment/?id=${id}&action=edit`)
                }}
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
        <ShipmentBasicDetails
          onEditClick={basicDetailsEditRef}
          setShowEdit={setShowEdit}
          showEdit={showEdit}
          status={status}
          setStatus={setStatus}
        />
      </CustomAccordion>

      <CustomAccordion
        id='animals-details'
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
            {!showEditAnimals && expanded === 'animals-details' ? (
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
