'use client'

import { Box, Drawer, IconButton, Skeleton, Typography, useTheme } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from 'src/@core/components/icon'
import { getPatientListByEnclosures } from 'src/lib/api/hospital/hospitalBeds'
import AnimalCard from 'src/views/utility/AnimalCard'

interface EnclosureOccupantsDrawerProps {
  open: boolean
  onClose: () => void
  selectedEnclosure?: any
}

const EnclosureOccupantsDrawer = ({ open, onClose, selectedEnclosure }: EnclosureOccupantsDrawerProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()
  console.log(selectedEnclosure)

  const [occupants, setOccupants] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const getEnclosureOccupants = async () => {
    try {
      setLoading(true)
      const res: any = await getPatientListByEnclosures({ bed_id: selectedEnclosure?.id })
      if (res?.success) {
        setOccupants(res?.data)
      } else {
        throw Error(res?.message)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    if (!selectedEnclosure?.id) return
    getEnclosureOccupants()
  }, [selectedEnclosure?.id])

  const OccupantSkeleton = () => {
    const theme: any = useTheme()

    return (
      <Box
        sx={{
          backgroundColor: theme.palette.customColors.OnPrimary,
          p: 3,
          borderRadius: 1
        }}
      >
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <Skeleton variant='circular' width={48} height={48} />

          <Box sx={{ flex: 1 }}>
            <Skeleton variant='text' width='60%' height={24} />
            <Skeleton variant='text' width='40%' height={18} />
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: '80%', md: 560 },
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.palette.customColors.OnPrimary,
              p: 0
            }
          }
        }}
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            pb: 0,
            p: 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
          }}
        >
          <Typography sx={{ fontWeight: 500, fontSize: '24px', color: theme.palette.customColors.OnSurfaceVariant }}>
            {t('hospital_module.enclosure_occupants')}
          </Typography>
          <IconButton onClick={onClose}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            background: theme.palette.customColors.Background,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            minHeight: 0,
            p: 6
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => <OccupantSkeleton key={index} />)
            ) : occupants?.length ? (
              occupants.map((occupant: any) => (
                <Box
                  key={occupant?.animal_id}
                  sx={{ backgroundColor: theme.palette.customColors.OnPrimary, p: 3, borderRadius: 1 }}
                >
                  <AnimalCard
                    data={{
                      default_icon: occupant?.occupant_icon,
                      sex: occupant?.sex,
                      local_identifier_name: occupant?.local_identifier_name,
                      local_identifier_value: occupant?.local_identifier_value,
                      animal_id: occupant?.animal_id,
                      common_name: occupant?.default_common_name,
                      scientific_name: occupant?.scientific_name,
                      age: occupant?.age,
                      site_name: occupant?.site_name,
                      user_enclosure_name: occupant?.enclosure_name,
                      section_name: occupant?.section_name,
                      weight: occupant?.weight
                    }}
                  />
                </Box>
              ))
            ) : (
              <Typography
                sx={{
                  textAlign: 'center',
                  color: theme.palette.customColors.neutralSecondary,
                  mt: 4
                }}
              >
                {t('hospital_module.no_occupants_found')}
              </Typography>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default EnclosureOccupantsDrawer
