import {
  alpha,
  Box,
  Chip,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Skeleton,
  Typography,
  useTheme
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import { getShipmentSpeciesData } from 'src/lib/api/compliance/shipment'
import { getSpeciesDetailsShipmentExports } from 'src/lib/api/compliance/species'
import SpeciesShipmentExpandableCard from 'src/views/pages/compliance/documents/shipment/shipment-view/SpeciesShipmentExpandableCard'

const SpeciesExportDrawer = ({ open, onClose, shipmentId, shipmentNumber, type, speciesId }) => {
  const theme = useTheme()

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({})

  useEffect(() => {
    const getExportSpecies = async () => {
      setLoading(true)
      try {
        if (type === 'total_animals') {
          await getShipmentSpeciesData(shipmentId).then(res => {
            if (res?.success === true) {
              setData(res?.data)
              setLoading(false)
            }
          })
        } else if (type === 'total_exports') {
          await getSpeciesDetailsShipmentExports({ speciesId, shipmentId }).then(res => {
            if (res?.success === true) {
              setData(res?.data)
              setLoading(false)
            }
          })
        }
      } catch (error) {
        console.error(error, 'Cannot Fetch Species Export')
        setLoading(false)
      }
    }

    getExportSpecies()
  }, [shipmentId])

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          backgroundColor: theme.palette.customColors.OnPrimary
        }}
      >
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.palette.customColors.OnPrimary,
            p: theme => theme.spacing(3, 3.255, 3, 5.255),
            borderBottom: `0.5px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>{`Export List - ${shipmentNumber}`}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={onClose}>
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>
        </Box>
        <Box
          sx={{
            '& .MuiDrawer-paper': { width: ['100%', '562px'] },
            backgroundColor: theme.palette.customColors.OnPrimary,
            height: '100%',
            p: theme => theme.spacing(3, 3.255, 3, 5.255),
            mt: 6
          }}
        >
          <SpeciesShipmentExpandableCard data={data} loading={loading} defaultCollapseStatus={false} />
        </Box>
      </Drawer>
    </>
  )
}

export default SpeciesExportDrawer
