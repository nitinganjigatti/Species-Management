import React, { useEffect, useMemo, useState } from 'react'
import { Drawer, Box, Typography, IconButton, Button, Radio, Skeleton } from '@mui/material'
import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { alpha, useTheme } from '@mui/material/styles'

import { getAnesthesiaList } from 'src/lib/api/hospital/anesthesia'

const SelectAnesthesiaRecordDrawer = ({
  open,
  onClose,
  hospitalCaseId,
  medicalRecordId,
  records = [],
  initialSelectedId = null,
  onSelect = () => {},
  onConfirm = () => {}
}) => {
  const theme = useTheme()
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

    if (Array.isArray(apiRecords) && apiRecords.length) return apiRecords

    return Array.isArray(records) && records.length ? records : []
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

  const renderSkeletonCard = count =>
    Array.from({ length: count }).map((_, index) => (
      <Box
        key={`anesthesia-skeleton-${index}`}
        sx={{
          backgroundColor: theme.palette.primary.contrastText,
          borderRadius: '8px',
          display: 'flex',
          gap: '24px',
          padding: '35px 20px 24px 35px',
          boxShadow: `0px 1px 2px ${alpha(theme.palette.common.black, 0.05)}`
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <Skeleton variant='rounded' width={120} height={28} />
          <Skeleton variant='text' width='70%' height={20} />
          <Skeleton variant='text' width='50%' height={18} />
        </Box>
        <Skeleton variant='circular' width={20} height={20} />
      </Box>
    ))

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
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          padding: '24px',
          gap: '12px',
          justifyContent: 'space-between',
          backgroundColor: theme.palette.primary.contrastText
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'center' }}>
          <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Filter Icon' />
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '24px',
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
            component='div'
          >
            Select Anesthesia Record
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ alignSelf: 'flex-start', mr: '-10px' }}>
          <Icon icon='mdi:close' color={theme.palette.primary.light} fontSize={24} />
        </IconButton>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          backgroundColor: alpha(theme.palette.customColors.displaybgPrimary, 102 / 255),
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {isAnesthesiaLoading && renderSkeletonCard(7)}
        {!isAnesthesiaLoading && items.length === 0 && (
          <Typography sx={{ color: theme.palette.customColors.neutralSecondary }}>
            No anesthesia records found.
          </Typography>
        )}
        {!isAnesthesiaLoading &&
          items.map(record => {
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
                  backgroundColor: theme.palette.primary.contrastText,
                  borderRadius: '8px',
                  display: 'flex',
                  gap: '24px',
                  padding: '24px 20px 24px 24px',
                  border: `1px solid ${isSelected ? theme.palette.primary.main : 'transparent'}`,
                  boxShadow: `0px 1px 2px ${alpha(theme.palette.common.black, 0.05)}`,
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
                      backgroundColor: alpha(theme.palette.customColors.SecondaryContainer, 153 / 255),
                      padding: '8px 12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      width: 'fit-content'
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '16px',
                        letterSpacing: 0,
                        color: theme.palette.primary.light,
                        textAlign: 'center'
                      }}
                    >
                      {record?.code || recordId}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {purposeNames.map((procedure, index) => (
                      <Typography
                        key={`${recordId}-proc-${procedure}`}
                        sx={{
                          color: theme.palette.primary.light,
                          fontWeight: 500,
                          fontSize: '14px',
                          letterSpacing: '0.1px'
                        }}
                      >
                        {procedure}
                        {index < purposeNames.length - 1 ? ' • ' : ''}
                      </Typography>
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '12px',
                        letterSpacing: 0,
                        color: theme.palette.customColors.neutralSecondary
                      }}
                      component='span'
                    >
                      Created by: {record?.created_by_name || record?.createdBy || '--'}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '12px',
                        letterSpacing: 0,
                        color: theme.palette.customColors.neutralSecondary
                      }}
                    >
                      •
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '12px',
                        letterSpacing: 0,
                        color: theme.palette.customColors.neutralSecondary
                      }}
                    >
                      {createdOn}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '12px',
                        letterSpacing: 0,
                        color: theme.palette.customColors.neutralSecondary
                      }}
                    >
                      •
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '12px',
                        letterSpacing: 0,
                        color: theme.palette.customColors.neutralSecondary
                      }}
                    >
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
                      color: theme.palette.primary.main
                    }
                  }}
                />
              </Box>
            )
          })}
      </Box>

      <Box
        sx={{
          backgroundColor: theme.palette.primary.contrastText,
          boxShadow: `0px -1px 30px 0px ${theme.palette.customColors.shadowColor}`,
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
            backgroundColor: theme.palette.primary.main,
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
