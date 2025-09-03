// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import Avatar from '@mui/material/Avatar'
import TableRow from '@mui/material/TableRow'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import TableContainer from '@mui/material/TableContainer'
import { useEffect, useState } from 'react'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Chip from '@mui/material/Chip'

// ** Custom Components Imports
import OptionsMenu from 'src/@core/components/option-menu'
import { getExpiredStocks } from 'src/lib/api/pharmacy/dashboard'
import { Grid } from '@mui/material'

const ExpiredProducts = () => {
  const [productsList, setProductsList] = useState([])
  const { selectedPharmacy } = usePharmacyContext()

  const getProductsList = async () => {
    try {
      const result = await getExpiredStocks()
      if (result?.success === true && result?.data?.list_items?.length > 0) {
        setProductsList(result?.data?.list_items)
      }
    } catch (error) {}
  }

  useEffect(() => {
    getProductsList()
  }, [selectedPharmacy.type, selectedPharmacy.id])

  return (
    <Grid>
      <TableContainer>
        <Table>
          <TableHead>
            {/* <TableRow sx={{ '& .MuiTableCell-root': { py: theme => `${theme.spacing(2.5)} !important` } }}>
              <TableCell>
                <Typography variant='subtitle2' sx={{ textTransform: 'capitalize' }}>
                  Product details
                </Typography>
              </TableCell>

              <TableCell align='right'>
                <Typography variant='subtitle2' sx={{ textTransform: 'capitalize' }}>
                  QTY required
                </Typography>
              </TableCell>
            </TableRow> */}
          </TableHead>
          <TableBody>
            {productsList?.length > 0
              ? productsList?.map((row, index) => {
                  return (
                    <TableRow
                      key={index}
                      sx={{ '& .MuiTableCell-root': { border: 0, py: theme => `${theme.spacing(2.75)} !important` } }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              mr: 3,
                              width: 50,
                              height: 30,
                              borderRadius: '6px',
                              backgroundColor: 'background.default'
                            }}
                          >
                            <img
                              alt='Product image'
                              src={row?.image ? row?.image : '/images/tablet.png'}
                              width='100%'
                              height='auto'
                            />
                          </Avatar>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {row?.stock_item_name}
                            </Typography>
                            <Typography variant='caption' sx={{ whiteSpace: 'nowrap' }}>
                              Qty in stock : {row?.stock_qty ? row?.stock_qty : 'NA'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          {/* <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {row?.total_nos ? `${row?.total_nos}nos` : 'NA'}
                          </Typography> */}
                          {/* <Chip
                            sx={{ ml: '6px', fontSize: '12px' }}
                            size='small'
                            variant='outlined'
                            label={row?.package_qty ? `${row?.package_qty}nos` : 'NA'}
                            color='error'
                          /> */}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                })
              : null}
          </TableBody>
        </Table>
      </TableContainer>
    </Grid>
  )
}

export default ExpiredProducts
