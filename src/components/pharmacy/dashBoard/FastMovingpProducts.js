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
import Chip from '@mui/material/Chip'

// ** Custom Components Imports
import OptionsMenu from 'src/@core/components/option-menu'
import { getFastMovingStocks } from 'src/lib/api/pharmacy/dashboard'

const FastMovingProducts = () => {
  const [productsList, setProductsList] = useState([])

  const getProductsList = async () => {
    try {
      const result = await getFastMovingStocks()

      if (result?.success === true && result?.data?.list_items?.length > 0) {
        setProductsList(result?.data?.list_items)
      }
    } catch (error) {}
  }

  useEffect(() => {
    getProductsList()
  }, [])

  return (
    <Card>
      <CardHeader
        title='Fast moving products'
        titleTypographyProps={{ sx: { lineHeight: '2rem !important', letterSpacing: '0.15px !important' } }}
        action={
          <OptionsMenu options={['Refresh']} iconButtonProps={{ size: 'small', className: 'card-more-options' }} />
        }
      />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ '& .MuiTableCell-root': { py: theme => `${theme.spacing(2.5)} !important` } }}>
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
            </TableRow>
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
                              {row?.stock_name}
                            </Typography>
                            <Typography variant='caption' sx={{ whiteSpace: 'nowrap' }}>
                              Qty in stock : {row?.qty ? row?.qty : 'NA'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          {/* <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {row?.total_nos ? `${row?.total_nos}nos` : 'NA'}
                          </Typography> */}
                          <Chip
                            sx={{ ml: '6px', fontSize: '12px' }}
                            size='small'
                            variant='outlined'
                            label={row?.total_nos ? `${row?.total_nos}nos` : 'NA'}
                            color='error'
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                })
              : null}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}

export default FastMovingProducts
