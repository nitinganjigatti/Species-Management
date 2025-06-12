import { useTheme } from '@emotion/react'
import {
  Avatar,
  Card,
  Drawer,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'
import Icon from 'src/@core/components/icon'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'

const StockDetailDrawer = ({ openDrawer, stockDetail, setDrawerClose }) => {
  const theme = useTheme()
  console.log(stockDetail)

  const groupedRacks = React.useMemo(() => {
    if (!stockDetail?.racks) return []

    const map = new Map()

    stockDetail.racks.forEach(({ rack_id, rack_name, shelf_name }) => {
      if (!map.has(rack_id)) {
        map.set(rack_id, { rack_name, shelves: [shelf_name] })
      } else {
        map.get(rack_id).shelves.push(shelf_name)
      }
    })

    return Array.from(map.values())
  }, [stockDetail])

  return (
    <Drawer
      anchor='right'
      open={openDrawer}
      onClose={setDrawerClose}
      slotProps={{
        paper: {
          sx: {
            width: {
              xs: '100%',
              sm: '80%',
              md: 560
            },
            backgroundColor: 'customColors.Background',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }
        }
      }}
    >
      <Box
        sx={{
          p: 4,
          position: 'sticky',
          top: 0,
          backgroundColor: 'customColors.Background',
          zIndex: 1,
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h6' fontWeight='bold'>
            Rack and Shelves
          </Typography>
          <IconButton onClick={setDrawerClose}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ p: 4, overflowY: 'auto', flexGrow: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px',
            borderRadius: '8px',
            mt: 1,
            backgroundColor: 'customColors.neutral05'
          }}
        >
          <PharmacyProductCard
            title={stockDetail?.stock_name}
            subTitle={stockDetail?.generic_name ? stockDetail?.generic_name : 'NA'}
            icon={stockDetail?.image}
          />
          <Typography sx={{ fontSize: '14px' }}>
            Reorder-Level: <strong>{stockDetail?.min_qty ? stockDetail?.min_qty : 0}</strong>
          </Typography>
        </Box>

        <Card
          sx={{
            p: 4,
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            marginBottom: 2,
            marginTop: 6,

            boxShadow: 'none'
          }}
        >
          <Typography
            variant='subtitle1'
            marginBottom={2}
            sx={{ color: 'customColors.customHeadingTextColor', fontWeight: 500, fontSize: '14px' }}
          >
            Rack and Shelves Details
          </Typography>
          <Card
            sx={{
              // m: 6,
              border: '1px solid',
              borderColor: 'customColors.customTableBorderBg',
              boxShadow: 'none'
            }}
          >
            <TableContainer component={Paper}>
              <Table aria-label='rack and shelves table'>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Rack</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Shelves</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupedRacks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} align='center'>
                        No rack data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    groupedRacks.map(({ rack_name, shelves }, index) => (
                      <TableRow
                        key={index}
                        sx={{
                          '&:last-child td, &:last-child th': {
                            borderBottom: 0
                          }
                        }}
                      >
                        <TableCell>{rack_name}</TableCell>
                        <TableCell>{shelves.join(', ')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Card>
      </Box>
    </Drawer>
  );
}

export default StockDetailDrawer
