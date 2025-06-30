import {
  Card,
  Drawer,
  IconButton,
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
import NoDataFound from 'src/views/utility/NoDataFound'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'

const StockConfigDetails = ({ open, configMed, setConfigMed, close }) => {
  console.log(configMed)

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={close}
      PaperProps={{
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
          <IconButton onClick={close}>
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
            padding: '20px',
            borderRadius: '8px',
            mt: 1,
            backgroundColor: 'customColors.neutral05'
          }}
        >
          <PharmacyProductCard
            title={configMed?.stock_items_name}
            subTitle={configMed?.generic_name ? configMed?.generic_name : 'NA'}
            icon={configMed?.image}
          />
          <Typography sx={{ fontSize: '14px' }}>
            Reorder Level: <strong>{configMed?.min_qty ? configMed?.min_qty : 0}</strong>
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
          {/* <Typography
            variant='subtitle1'
            marginBottom={2}
            sx={{ color: 'customColors.customHeadingTextColor', fontWeight: 500, fontSize: '14px' }}
          >
            Rack and Shelves Details
          </Typography> */}
          <Card
            sx={{
              boxShadow: 'none'
            }}
          >
            {configMed?.stock_config?.length > 0 ? (
              <TableContainer component={'paper'}>
                <Table
                  aria-label='rack and shelves table'
                  sx={{
                    border: '1px solid #e0e0e0',
                    '& .MuiTableCell-root': {
                      border: '1px solid #e0e0e0'
                    },
                    '& .MuiTableBody-root .MuiTableRow-root:last-child .MuiTableCell-root': {
                      borderBottom: '1px solid #e0e0e0'
                    }
                  }}
                >
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: '#c8d0d0',
                        '& .MuiTableCell-root': {
                          backgroundColor: '#c8d0d0',
                          fontWeight: 'bold'
                        }
                      }}
                    >
                      <TableCell>
                        <strong>Rack</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Shelves</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {configMed.stock_config.map(config =>
                      config.racks.map(rack =>
                        rack.shelf_configs.map(shelf => (
                          <TableRow key={`${rack.id}-${shelf.id}`}>
                            <TableCell>{rack.rack}</TableCell>
                            <TableCell>{shelf.name}</TableCell>
                          </TableRow>
                        ))
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 200,
                  flexDirection: 'column',
                  p: 4,
                  mt: 6
                }}
              >
                <NoDataFound variant='Meerkat' height={250} width={250} />
              </Box>
            )}
          </Card>
        </Card>
      </Box>
    </Drawer>
  )
}

export default StockConfigDetails
