import React, { useEffect, useMemo, useState } from 'react'
import { Drawer, Box, Typography, IconButton, Button, Radio } from '@mui/material'
import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'

import { getAnesthesiaList } from 'src/lib/api/hospital/anesthesia'

const baseSampleRecords = [
  {
    id: 'AN2345/25',
    procedures: ['Endoscopy', 'CT Scan', 'MRI'],
    createdBy: 'Dr. Madhav Mehta',
    createdOn: '12 Aug 2025',
    time: '12:00 PM'
  },
  {
    id: 'AN4567/25',
    procedures: ['X-ray', 'Blood Test'],
    createdBy: 'Dr. Madhav Mehta',
    createdOn: '5 Aug 2025',
    time: '10:30 AM'
  },
  {
    id: 'AN7890/25',
    procedures: ['Ultrasound', 'MRI'],
    createdBy: 'Dr. Madhav Mehta',
    createdOn: '28 Jul 2025',
    time: '03:15 PM'
  }
]

const generatedSampleRecords = Array.from({ length: 12 }).map((_, index) => {
  const template = baseSampleRecords[index % baseSampleRecords.length]

  return {
    ...template,
    id: `${template.id}-${index + 1}`
  }
})

const SelectAnesthesiaRecordDrawer = ({
  open,
  onClose,
  hospitalCaseId,
  medicalRecordId,
  records = generatedSampleRecords,
  initialSelectedId = null,
  onSelect = () => {},
  onConfirm = () => {}
}) => {
  const [selectedId, setSelectedId] = useState(initialSelectedId)

  useEffect(() => {
    if (open) {
      setSelectedId(initialSelectedId)
    }
  }, [initialSelectedId, open])

  const { data: anesthesiaResponse, isFetching: isAnesthesiaLoading } = useQuery({
    queryKey: ['anesthesia-records', hospitalCaseId, medicalRecordId, open],
    queryFn: () => {
      const params = {
        hospital_case_id: hospitalCaseId,
        medical_record_id: medicalRecordId,
        page_no: 1,
        limit: 20
      }

      return getAnesthesiaList({ params })
    },
    enabled: open && Boolean(hospitalCaseId),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
    retry: false
  })

  const items = useMemo(() => {
    const apiRecords = Array.isArray(anesthesiaResponse?.data?.records) && anesthesiaResponse?.data?.records

    if (Array.isArray(apiRecords) && apiRecords.length) {
      return apiRecords
    }

    return Array.isArray(records) && records.length ? records : generatedSampleRecords
  }, [anesthesiaResponse, records])

  const getRecordId = record => {
    if (!record) return ''
    return record?.anaesthesia_id || record?.id || record?.code || ''
  }

  const handleSelect = record => {
    setSelectedId(getRecordId(record))
    onSelect(record)
  }

  const handleConfirm = () => {
    const record = items.find(item => getRecordId(item) === selectedId) || null
    onConfirm(record)
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          width: '562px',
          display: 'flex',
          flexDirection: 'column',

          boxShadow: 'none'
        }
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #C3CEC7',
          padding: '24px',
          gap: '12px',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'center' }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              backgroundColor: '#E8F4F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon icon='mdi:content-save-outline' fontSize={22} color='#1F515B' />
          </Box>
          <Typography sx={{ fontWeight: 500, fontSize: '24px', letterSpacing: 0, color: '#44544A' }} component='div'>
            Select Anesthesia Record
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ alignSelf: 'flex-start', mr: '-10px' }}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          backgroundColor: '#E8F4F266',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {isAnesthesiaLoading && <Typography sx={{ color: '#7A8684' }}>Loading anesthesia records...</Typography>}
        {!isAnesthesiaLoading && items.length === 0 && (
          <Typography sx={{ color: '#7A8684' }}>No anesthesia records found.</Typography>
        )}
        {items.map(record => {
          const recordId = getRecordId(record)
          const isSelected = recordId === selectedId
          const createdAt = record?.created_at ? dayjs(record.created_at) : null
          const purposeNames = Array.isArray(record?.purpose)
            ? record.purpose.map(item => item?.name).filter(Boolean)
            : record?.procedures || []
          const createdOn = createdAt?.isValid() ? createdAt.format('DD MMM YYYY') : record?.createdOn || '--'
          const createdTime = createdAt?.isValid() ? createdAt.format('hh:mm A') : record?.time || '--'

          return (
            <Box
              key={recordId}
              role='button'
              tabIndex={0}
              onClick={() => handleSelect(record)}
              sx={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                display: 'flex',
                gap: '24px',
                padding: '24px 20px 24px 24px',
                border: `1px solid ${isSelected ? '#37BD69' : 'transparent'}`,
                boxShadow: '0px 1px 2px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                outline: 'none'
              }}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleSelect(record)
                }
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <Box
                  sx={{
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#AFEFEB99',
                    padding: '8px 12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    width: 'fit-content'
                  }}
                >
                  <Typography
                    sx={{ fontWeight: 600, fontSize: '16px', letterSpacing: 0, color: '#1F515B', textAlign: 'center' }}
                  >
                    {record?.code || recordId}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {purposeNames.map((procedure, index) => (
                    <Typography
                      key={`${recordId}-proc-${procedure}`}
                      sx={{ color: '#1F515B', fontWeight: 500, fontSize: '14px', letterSpacing: '0.1px' }}
                    >
                      {procedure}
                      {index < purposeNames.length - 1 ? ' • ' : ''}
                    </Typography>
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Typography
                    sx={{ fontWeight: 400, fontSize: '12px', letterSpacing: 0, color: '#7A8684' }}
                    component='span'
                  >
                    Created by: {record?.created_by_name || record?.createdBy || '--'}
                  </Typography>
                  <Typography sx={{ fontWeight: 400, fontSize: '12px', letterSpacing: 0, color: '#7A8684' }}>
                    •
                  </Typography>
                  <Typography sx={{ fontWeight: 400, fontSize: '12px', letterSpacing: 0, color: '#7A8684' }}>
                    {createdOn}
                  </Typography>
                  <Typography sx={{ fontWeight: 400, fontSize: '12px', letterSpacing: 0, color: '#7A8684' }}>
                    •
                  </Typography>
                  <Typography sx={{ fontWeight: 400, fontSize: '12px', letterSpacing: 0, color: '#7A8684' }}>
                    {createdTime}
                  </Typography>
                </Box>
              </Box>
              <Radio
                checked={isSelected}
                onChange={() => handleSelect(record)}
                value={recordId}
                sx={{
                  pointerEvents: 'none',
                  '&.Mui-checked': {
                    color: '#37BD69'
                  }
                }}
              />
            </Box>
          )
        })}
      </Box>

      <Box
        sx={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0px -1px 30px 0px #0000001A',
          padding: '16px',
          height: '88px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Button
          variant='contained'
          onClick={handleConfirm}
          disabled={!selectedId}
          sx={{
            width: '100%',
            height: '56px',
            borderRadius: '8px',
            backgroundColor: '#37BD69',
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}
        >
          ADD
        </Button>
      </Box>
    </Drawer>
  )
}

export default SelectAnesthesiaRecordDrawer
